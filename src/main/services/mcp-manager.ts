import { spawn, ChildProcess } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface McpServer {
  id: string
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
  enabled: boolean
}

export interface McpTool {
  name: string
  description: string
  inputSchema: any
  serverId: string
}

interface McpConnection {
  server: McpServer
  process: ChildProcess
  tools: McpTool[]
  ready: boolean
  stdoutHandler?: (data: Buffer) => void
  stderrHandler?: (data: Buffer) => void
}

const MAX_BUFFER_SIZE = 1024 * 1024 // 1MB

const CONFIG_FILE = path.join(os.homedir(), '.mimo-desktop', 'mcp-servers.json')

export class McpManager {
  private connections: Map<string, McpConnection> = new Map()
  private servers: McpServer[] = []

  constructor() {
    this.loadServers()
  }

  private loadServers(): void {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        this.servers = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
      }
    } catch {
      this.servers = []
    }
  }

  private saveServers(): void {
    const configDir = path.dirname(CONFIG_FILE)
    fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.servers, null, 2))
  }

  private generateId(): string {
    return `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  getServers(): McpServer[] {
    return this.servers
  }

  addServer(server: Omit<McpServer, 'id'>): McpServer {
    const newServer: McpServer = { ...server, id: this.generateId() }
    this.servers.push(newServer)
    this.saveServers()
    return newServer
  }

  updateServer(id: string, updates: Partial<McpServer>): void {
    const index = this.servers.findIndex(s => s.id === id)
    if (index !== -1) {
      this.servers[index] = { ...this.servers[index], ...updates }
      this.saveServers()
    }
  }

  removeServer(id: string): void {
    this.disconnect(id)
    this.servers = this.servers.filter(s => s.id !== id)
    this.saveServers()
  }

  async connect(id: string): Promise<{ success: boolean; tools?: McpTool[]; error?: string }> {
    const server = this.servers.find(s => s.id === id)
    if (!server) return { success: false, error: 'Server not found' }

    if (this.connections.has(id)) {
      return { success: true, tools: this.connections.get(id)?.tools || [] }
    }

    try {
      const proc = spawn(server.command, server.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...server.env }
      })

      const connection: McpConnection = {
        server,
        process: proc,
        tools: [],
        ready: false
      }

      this.connections.set(id, connection)

      // Send initialize request
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'mimo-desktop', version: '0.1.0' }
        }
      }

      proc.stdin?.write(JSON.stringify(initRequest) + '\n')

      let buffer = ''
      const stdoutHandler = (data: Buffer) => {
        buffer += data.toString()
        // Prevent buffer from growing indefinitely
        if (buffer.length > MAX_BUFFER_SIZE) {
          buffer = buffer.slice(-MAX_BUFFER_SIZE / 2)
        }
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const response = JSON.parse(line)
            if (response.result?.tools) {
              connection.tools = response.result.tools.map((t: any) => ({
                ...t,
                serverId: id
              }))
              connection.ready = true
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      const stderrHandler = (data: Buffer) => {
        console.log(`[MCP] ${server.name} stderr:`, data.toString().substring(0, 200))
      }

      connection.stdoutHandler = stdoutHandler
      connection.stderrHandler = stderrHandler

      proc.stdout?.on('data', stdoutHandler)
      proc.stderr?.on('data', stderrHandler)

      proc.on('close', () => {
        this.connections.delete(id)
      })

      // Wait for ready
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (connection.ready || !this.connections.has(id)) {
            clearInterval(check)
            resolve()
          }
        }, 100)
        setTimeout(() => { clearInterval(check); resolve() }, 5000)
      })

      return { success: connection.ready, tools: connection.tools }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  disconnect(id: string): void {
    const connection = this.connections.get(id)
    if (connection) {
      // Remove event listeners to prevent memory leaks
      if (connection.stdoutHandler) {
        connection.process.stdout?.removeListener('data', connection.stdoutHandler)
      }
      if (connection.stderrHandler) {
        connection.process.stderr?.removeListener('data', connection.stderrHandler)
      }
      connection.process.removeAllListeners()
      connection.process.kill()
      this.connections.delete(id)
    }
  }

  async callTool(toolName: string, args: any): Promise<any> {
    for (const [, connection] of this.connections) {
      if (!connection.ready) continue
      const tool = connection.tools.find(t => t.name === toolName)
      if (tool) {
        const request = {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: toolName, arguments: args }
        }
        connection.process.stdin?.write(JSON.stringify(request) + '\n')

        // Wait for response
        return new Promise((resolve) => {
          const handler = (data: Buffer) => {
            try {
              const response = JSON.parse(data.toString().split('\n')[0])
              if (response.id === request.id) {
                connection.process.stdout?.removeListener('data', handler)
                clearTimeout(timeout)
                resolve(response.result)
              }
            } catch {
              // Ignore parse errors
            }
          }
          connection.process.stdout?.on('data', handler)
          const timeout = setTimeout(() => {
            connection.process.stdout?.removeListener('data', handler)
            resolve({ error: 'Timeout' })
          }, 30000)
        })
      }
    }
    return { error: 'Tool not found' }
  }

  getAllTools(): McpTool[] {
    const tools: McpTool[] = []
    for (const connection of this.connections.values()) {
      if (connection.ready) {
        tools.push(...connection.tools)
      }
    }
    return tools
  }
}

export const mcpManager = new McpManager()
