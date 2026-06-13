import { ipcMain } from 'electron'
import { rulesService } from '../services/rules-service'

export function registerRulesIPC(): void {
  ipcMain.handle('mimo:rules:setDir', (_event, dirPath: string) => {
    rulesService.setDirectory(dirPath)
  })

  ipcMain.handle('mimo:rules:list', async () => {
    return rulesService.getRules()
  })

  ipcMain.handle('mimo:rules:get', async (_event, filename: string) => {
    return rulesService.getRuleContent(filename)
  })

  ipcMain.handle('mimo:rules:save', async (_event, filename: string, content: string) => {
    await rulesService.saveRule(filename, content)
  })

  ipcMain.handle('mimo:rules:delete', async (_event, filename: string) => {
    await rulesService.deleteRule(filename)
  })

  ipcMain.handle('mimo:rules:global:get', async () => {
    return rulesService.getGlobalRules()
  })

  ipcMain.handle('mimo:rules:global:save', async (_event, content: string) => {
    await rulesService.saveGlobalRules(content)
  })
}
