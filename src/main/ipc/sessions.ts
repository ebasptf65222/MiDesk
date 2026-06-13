import { ipcMain } from 'electron'
import { listSessions, loadSession, saveSession, deleteSession, renameSession, Session } from '../services/session-service'

export function registerSessionIPC(): void {
  ipcMain.handle('mimo:sessions:list', async () => {
    return listSessions()
  })

  ipcMain.handle('mimo:sessions:load', async (_event, id: string) => {
    return loadSession(id)
  })

  ipcMain.handle('mimo:sessions:save', async (_event, session: Session) => {
    await saveSession(session)
    return true
  })

  ipcMain.handle('mimo:sessions:delete', async (_event, id: string) => {
    return deleteSession(id)
  })

  ipcMain.handle('mimo:sessions:rename', async (_event, id: string, title: string) => {
    return renameSession(id, title)
  })
}
