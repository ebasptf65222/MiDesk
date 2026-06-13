import { ChildProcess, spawn } from 'child_process'
import { EventEmitter } from 'events'
import { downloader } from './downloader'

export interface CLISession {
  id: string
  process: ChildProcess
  cwd: string
}

export class CLIManager extends EventEmitter {
  private sessions: Map<string, CLISession> = new Map()
  private activeProcess: ChildProcess | null = null

  createSession(id: string, cwd: string): CLISession {
    if (this.sessions.has(id)) {
      this.destroySession(id)
    }

    const cliPath = this.resolveCLIPath()
    // Use 'mimo run' for one-shot message execution
    const proc = spawn(cliPath, ['run'], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    })

    const session: CLISession = { id, process: proc, cwd }
    this.sessions.set(id, session)

    proc.stdout?.on('data', (data: Buffer) => {
      this.emit('output', id, data.toString())
    })

    proc.stderr?.on('data', (data: Buffer) => {
      this.emit('error', id, data.toString())
    })

    proc.on('close', (code) => {
      this.emit('exit', id, code)
      this.sessions.delete(id)
    })

    return session
  }

  sendInput(sessionId: string, message: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    this.activeProcess = session.process
    session.process.stdin?.write(message + '\n')
  }

  stopCurrent(): void {
    if (this.activeProcess && !this.activeProcess.killed) {
      this.activeProcess.kill('SIGTERM')
      this.activeProcess = null
    }
  }

  destroySession(id: string): void {
    const session = this.sessions.get(id)
    if (session) {
      session.process.kill()
      this.sessions.delete(id)
    }
  }

  destroyAll(): void {
    for (const [id] of this.sessions) {
      this.destroySession(id)
    }
  }

  private resolveCLIPath(): string {
    // First check if CLI is already downloaded
    if (downloader.isCLIDownloaded()) {
      return downloader.getCLIPath()
    }

    // MiMo Code CLI location
    const possiblePaths = [
      process.env.MIMO_CLI_PATH || '',
      'D:\\MiMoCode\\mimocode-windows-x64\\mimo.exe',
      'C:\\Users\\' + (process.env.USERNAME || '') + '\\MiMoCode\\mimocode-windows-x64\\mimo.exe',
      'mimocode',
      'mimo'
    ]
    const found = possiblePaths.find(p => p.length > 0)
    return found || 'mimocode'
  }
}
