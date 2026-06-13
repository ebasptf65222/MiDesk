import { ipcMain } from 'electron'
import { inlineEditService } from '../services/inline-edit'

const CLI_PATH = 'D:\\MiMoCode\\mimocode-windows-x64\\mimo.exe'

export function registerInlineEditIPC(): void {
  ipcMain.handle('mimo:inline-edit:edit', async (_event, filePath: string, selectedCode: string, instruction: string) => {
    return inlineEditService.editCode(filePath, selectedCode, instruction, CLI_PATH)
  })
}
