import { ipcMain, dialog, BrowserWindow } from 'electron'
import { listDirectory, readFile, writeFile, searchFiles } from '../services/file-service'

export function registerFileIPC(): void {
  ipcMain.handle('mimo:file:list', async (_event, dirPath: string) => {
    return listDirectory(dirPath)
  })

  ipcMain.handle('mimo:file:read', async (_event, filePath: string) => {
    return readFile(filePath)
  })

  ipcMain.handle('mimo:file:write', async (_event, filePath: string, content: string) => {
    await writeFile(filePath, content)
  })

  ipcMain.handle('mimo:file:search', async (_event, dirPath: string, pattern: string) => {
    return searchFiles(dirPath, pattern)
  })

  ipcMain.handle('mimo:file:openDirectory', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return null

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
      title: '选择项目文件夹'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })
}
