import { defineStore } from 'pinia'
import { ref } from 'vue'

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

export const useMcpStore = defineStore('mcp', () => {
  const servers = ref<McpServer[]>([])
  const tools = ref<McpTool[]>([])
  const connected = ref<Set<string>>(new Set())
  const loading = ref(false)

  async function loadServers() {
    servers.value = await window.mimo.mcp.servers()
  }

  async function loadTools() {
    tools.value = await window.mimo.mcp.tools()
  }

  async function addServer(server: Omit<McpServer, 'id'>) {
    const newServer = await window.mimo.mcp.add(server)
    servers.value.push(newServer)
    return newServer
  }

  async function removeServer(id: string) {
    await window.mimo.mcp.remove(id)
    servers.value = servers.value.filter(s => s.id !== id)
    connected.value.delete(id)
  }

  async function connectServer(id: string) {
    loading.value = true
    try {
      const result = await window.mimo.mcp.connect(id)
      if (result.success) {
        connected.value.add(id)
        await loadTools()
      }
      return result
    } finally {
      loading.value = false
    }
  }

  async function disconnectServer(id: string) {
    await window.mimo.mcp.disconnect(id)
    connected.value.delete(id)
    await loadTools()
  }

  async function callTool(toolName: string, args: any) {
    return window.mimo.mcp.callTool(toolName, args)
  }

  return {
    servers,
    tools,
    connected,
    loading,
    loadServers,
    loadTools,
    addServer,
    removeServer,
    connectServer,
    disconnectServer,
    callTool
  }
})
