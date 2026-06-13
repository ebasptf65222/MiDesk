import { ipcMain } from 'electron'
import { TerminalManager } from '../services/terminal-manager'

const terminalManager = new TerminalManager()

export function registerTerminalIPC(): void {
  ipcMain.handle('mimo:terminal:create', (event, id: string, cwd: string) => {
    const session = terminalManager.createSession(id, cwd)
    const webContents = event.sender

    session.process.stdout?.on('data', (data: Buffer) => {
      webContents.send('mimo:terminal:output', id, data.toString('binary'))
    })

    session.process.stderr?.on('data', (data: Buffer) => {
      webContents.send('mimo:terminal:output', id, data.toString('binary'))
    })

    session.process.on('close', (code) => {
      webContents.send('mimo:terminal:exit', id, code)
    })

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
}

export function cleanupTerminalIPC(): void {
  terminalManager.destroyAll()
}
