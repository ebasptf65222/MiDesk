import { ipcMain } from 'electron'
import { TerminalManager } from '../services/terminal-manager'
import { spawn } from 'child_process'

const terminalManager = new TerminalManager()

export function registerTerminalIPC(): void {
  ipcMain.handle('mimo:terminal:create', (event, id: string, cwd: string) => {
    const session = terminalManager.createSession(id, cwd)
    const webContents = event.sender

    const onDataHandler = (data: string) => {
      if (!webContents.isDestroyed()) {
        webContents.send('mimo:terminal:output', id, data)
      }
    }

    const onExitHandler = ({ exitCode }: { exitCode: number }) => {
      if (!webContents.isDestroyed()) {
        webContents.send('mimo:terminal:exit', id, exitCode)
      }
    }

    session.onDataDisposable = session.process.onData(onDataHandler)
    session.onExitDisposable = session.process.onExit(onExitHandler)

    return { id, shell: session.shell }
  })

  ipcMain.handle('mimo:terminal:write', (_event, id: string, data: string) => {
    terminalManager.writeToSession(id, data)
  })

  ipcMain.handle('mimo:terminal:resize', (_event, id: string, cols: number, rows: number) => {
    terminalManager.resizeSession(id, cols, rows)
  })

  ipcMain.handle('mimo:terminal:destroy', (_event, id: string) => {
    terminalManager.destroySession(id)
  })

  ipcMain.handle('mimo:terminal:execute', (_event, command: string, cwd: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32'
      const shell = isWindows ? 'cmd' : '/bin/sh'
      const shellArgs = isWindows ? ['/c', command] : ['-c', command]

      const proc = spawn(shell, shellArgs, {
        cwd: cwd || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env
      })

      let stdout = ''
      let stderr = ''

      proc.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString('utf-8')
      })

      proc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString('utf-8')
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout || '(no output)')
        } else {
          resolve(`Exit code: ${code}\n${stderr || stdout}`)
        }
      })

      proc.on('error', (err) => {
        reject(err.message)
      })
    })
  })
}

export function cleanupTerminalIPC(): void {
  terminalManager.destroyAll()
}
