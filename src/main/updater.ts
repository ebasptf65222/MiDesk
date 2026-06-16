import { autoUpdater } from 'electron-updater'
import { BrowserWindow, ipcMain } from 'electron'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  ipcMain.handle('mimo:update:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return {
        available: !!result,
        version: result?.updateInfo.version || null,
        releaseDate: result?.updateInfo.releaseDate || null,
        releaseNotes: result?.updateInfo.releaseNotes || null,
        files: result?.updateInfo.files || []
      }
    } catch (err) {
      return { available: false, error: String(err) }
    }
  })

  ipcMain.handle('mimo:update:download', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('mimo:update:install', () => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.handle('mimo:update:getVersion', () => {
    return autoUpdater.currentVersion
  })

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('mimo:update:available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('mimo:update:progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('mimo:update:downloaded')
  })

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('mimo:update:error', String(err))
  })

  autoUpdater.checkForUpdates().catch(() => {})
}
