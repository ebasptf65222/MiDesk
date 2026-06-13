import * as pty from 'node-pty'
import * as os from 'os'

export interface TerminalSession {
  id: string
  process: pty.IPty
  shell: string
  onDataDisposable?: { dispose: () => void }
  onExitDisposable?: { dispose: () => void }
}

export class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map()

  createSession(id: string, cwd: string): TerminalSession {
    if (this.sessions.has(id)) {
      this.destroySession(id)
    }

    const shell = this.getDefaultShell()
    const proc = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: { ...process.env } as { [key: string]: string }
    })

    const session: TerminalSession = { id, process: proc, shell }
    this.sessions.set(id, session)

    return session
  }

  writeToSession(id: string, data: string): void {
    const session = this.sessions.get(id)
    if (session && session.process) {
      try {
        session.process.write(data)
      } catch (err) {
        console.error('[Terminal] Write error:', err)
      }
    }
  }

  resizeSession(id: string, cols: number, rows: number): void {
    const session = this.sessions.get(id)
    if (session && session.process) {
      try {
        session.process.resize(cols, rows)
      } catch (err) {
        console.error('[Terminal] Resize error:', err)
      }
    }
  }

  destroySession(id: string): void {
    const session = this.sessions.get(id)
    if (session) {
      // Remove event listeners to prevent sending to destroyed WebContents
      session.onDataDisposable?.dispose()
      session.onExitDisposable?.dispose()
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
