import { ipcMain } from 'electron'
import { modelProviderManager, ProviderConfig } from '../services/model-provider'

export function registerModelsIPC(): void {
  ipcMain.handle('mimo:models:providers', () => {
    return modelProviderManager.getAllProviders()
  })

  ipcMain.handle('mimo:models:getConfig', (_event, providerId: string) => {
    return modelProviderManager.getConfig(providerId)
  })

  ipcMain.handle('mimo:models:setConfig', (_event, config: ProviderConfig) => {
    modelProviderManager.setConfig(config)
  })

  ipcMain.handle('mimo:models:removeConfig', (_event, providerId: string) => {
    modelProviderManager.removeConfig(providerId)
  })

  ipcMain.handle('mimo:models:test', async (_event, providerId: string) => {
    return modelProviderManager.testConnection(providerId)
  })

  ipcMain.handle('mimo:models:list', (_event, providerId: string) => {
    return modelProviderManager.getModelsByProvider(providerId)
  })
}
