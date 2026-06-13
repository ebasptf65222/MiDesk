import { ipcMain, dialog, BrowserWindow } from 'electron'
import { listSkills, getSkillContent, installSkill, removeSkill, getSkillsDirectory } from '../services/skills-manager'

export function registerSkillsIPC(): void {
  ipcMain.handle('mimo:skills:list', async () => {
    return listSkills()
  })

  ipcMain.handle('mimo:skills:content', async (_event, skillId: string) => {
    return getSkillContent(skillId)
  })

  ipcMain.handle('mimo:skills:install', async (event, skillPath: string) => {
    if (skillPath) {
      return installSkill(skillPath)
    }

    // Open folder picker if no path provided
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return null

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
      title: '选择技能文件夹'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return installSkill(result.filePaths[0])
  })

  ipcMain.handle('mimo:skills:remove', async (_event, skillId: string) => {
    return removeSkill(skillId)
  })

  ipcMain.handle('mimo:skills:directory', async () => {
    return getSkillsDirectory()
  })
}
