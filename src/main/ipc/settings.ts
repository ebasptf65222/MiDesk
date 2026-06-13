import { ipcMain } from 'electron'
import { loadSettings, saveSettings, resetSettings, AppSettings } from '../services/settings-service'

export function registerSettingsIPC(): void {
  ipcMain.handle('mimo:settings:get', async () => {
    return loadSettings()
  })

  ipcMain.handle('mimo:settings:update', async (_event, settings: Partial<AppSettings>) => {
    return saveSettings(settings)
  })

  ipcMain.handle('mimo:settings:reset', async () => {
    return resetSettings()
  })
}
