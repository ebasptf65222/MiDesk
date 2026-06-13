import { ipcMain } from 'electron'
import { listCustomCommands, getCustomCommand, setCommandsDir, clearCommandsCache } from '../services/commands-service'

let currentProjectDir: string | null = null

export function registerCommandsIPC(): void {
  ipcMain.handle('mimo:commands:list', () => {
    return listCustomCommands()
  })

  ipcMain.handle('mimo:commands:get', (_event, name: string) => {
    return getCustomCommand(name)
  })

  ipcMain.handle('mimo:commands:setDir', (_event, dirPath: string) => {
    currentProjectDir = dirPath
    setCommandsDir(dirPath ? `${dirPath}/.mimocode/commands` : '')
  })

  ipcMain.handle('mimo:commands:refresh', () => {
    clearCommandsCache()
    return listCustomCommands()
  })
}
