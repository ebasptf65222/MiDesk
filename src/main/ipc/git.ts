import { ipcMain } from 'electron'
import { getGitStatus, gitCommit, gitDiff, gitLog } from '../services/git-service'

let currentCwd: string = process.cwd()

export function registerGitIPC(): void {
  ipcMain.handle('mimo:git:setCwd', (_event, dirPath: string) => {
    currentCwd = dirPath
  })

  ipcMain.handle('mimo:git:status', async () => {
    return getGitStatus(currentCwd)
  })

  ipcMain.handle('mimo:git:commit', async (_event, message: string) => {
    return gitCommit(currentCwd, message)
  })

  ipcMain.handle('mimo:git:diff', async (_event, filePath?: string) => {
    return gitDiff(currentCwd, filePath)
  })

  ipcMain.handle('mimo:git:log', async (_event, count?: number) => {
    return gitLog(currentCwd, count)
  })
}
