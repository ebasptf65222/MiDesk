import { ipcMain } from 'electron'
import { listThemes, getTheme, clearThemeCache } from '../services/themes-service'

export function registerThemesIPC(): void {
  ipcMain.handle('mimo:themes:list', () => {
    return listThemes()
  })

  ipcMain.handle('mimo:themes:get', (_event, name: string) => {
    return getTheme(name)
  })

  ipcMain.handle('mimo:themes:refresh', () => {
    clearThemeCache()
    return listThemes()
  })
}
