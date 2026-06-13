import { ChildProcess, spawn } from 'child_process'
import * as os from 'os'

export interface TerminalSession {
  id: string
  process: ChildProcess
  shell: string
}

export class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map()

  createSession(id: string, cwd: string): TerminalSession {
    if (this.sessions.has(id)) {
      this.destroySession(id)
    }

    const shell = this.getDefaultShell()
    const proc = spawn(shell, [], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      shell: true
    })

    const session: TerminalSession = { id, process: proc, shell }
    this.sessions.set(id, session)

    return session
  }

  writeToSession(id: string, data: string): void {
    const session = this.sessions.get(id)
    if (session) {
      session.process.stdin?.write(data)
    }
  }

  resizeSession(id: string, cols: number, rows: number): void {
    const session = this.sessions.get(id)
    if (session && session.process.stdin) {
      // Send resize escape sequence
      session.process.stdin.write(`\x1b[8;${rows};${cols}t`)
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

  private getDefaultShell(): string {
    if (os.platform() === 'win32') {
      return process.env.COMSPEC || 'cmd.exe'
    }
    return process.env.SHELL || '/bin/sh'
  }
}
