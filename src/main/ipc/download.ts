import { ipcMain, BrowserWindow } from 'electron'
import { downloader } from '../services/downloader'

export function registerDownloadIPC(): void {
  ipcMain.handle('mimo:download:status', () => {
    return {
      isDownloaded: downloader.isCLIDownloaded(),
      cliPath: downloader.getCLIPath(),
      downloadUrl: downloader.getDownloadUrl(),
      filename: downloader.getFilename()
    }
  })

  ipcMain.handle('mimo:download:start', async (event, url?: string, filename?: string) => {
    const webContents = event.sender
    const downloadUrl = url || downloader.getDownloadUrl()
    const downloadFilename = filename || downloader.getFilename()

    if (!downloadUrl) {
      return { success: false, error: 'No download URL configured' }
    }

    downloader.on('progress', (progress) => {
      webContents.send('mimo:download:progress', progress)
    })

    const result = await downloader.download(downloadUrl, downloadFilename)
    
    downloader.removeAllListeners('progress')
    
    return result
  })
}