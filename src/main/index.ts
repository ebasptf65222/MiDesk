import { app, BrowserWindow, shell, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerWindowIPC } from './ipc/window'
import { registerChatIPC, cleanupChatIPC } from './ipc/chat'
import { registerFileIPC } from './ipc/file'
import { registerTerminalIPC, cleanupTerminalIPC } from './ipc/terminal'
import { registerSkillsIPC } from './ipc/skills'
import { registerSettingsIPC } from './ipc/settings'
import { registerSessionIPC } from './ipc/sessions'
import { registerGitIPC } from './ipc/git'
import { registerModelsIPC } from './ipc/models'
import { registerMcpIPC } from './ipc/mcp'
import { registerRulesIPC } from './ipc/rules'
import { registerInlineEditIPC } from './ipc/inline-edit'
import { registerDownloadIPC } from './ipc/download'
import { registerThemesIPC } from './ipc/themes'
import { registerCommandsIPC } from './ipc/commands'
import { downloader } from './services/downloader'
import { setupAutoUpdater } from './updater'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.mimo.desktop')

  Menu.setApplicationMenu(null)

  registerWindowIPC()
  registerDownloadIPC()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Download MiMo CLI if not already present
  if (!downloader.isCLIDownloaded()) {
    console.log('[App] MiMo CLI not found, downloading...')
    const downloadUrl = downloader.getDownloadUrl()
    const filename = downloader.getFilename()
    if (downloadUrl) {
      const result = await downloader.download(downloadUrl, filename)
      if (result.success) {
        console.log('[App] MiMo CLI downloaded to:', result.filePath)
      } else {
        console.error('[App] Failed to download MiMo CLI:', result.error)
      }
    } else {
      console.error('[App] No download URL configured for MiMo CLI')
    }
  } else {
    console.log('[App] MiMo CLI already downloaded')
  }

  registerChatIPC()
  registerFileIPC()
  registerTerminalIPC()
  registerSkillsIPC()
  registerSettingsIPC()
  registerSessionIPC()
  registerGitIPC()
  registerModelsIPC()
  registerMcpIPC()
  registerRulesIPC()
  registerInlineEditIPC()
  registerThemesIPC()
  registerCommandsIPC()

  const mainWindow = createWindow()

  setupAutoUpdater(mainWindow)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  cleanupChatIPC()
  cleanupTerminalIPC()
})
