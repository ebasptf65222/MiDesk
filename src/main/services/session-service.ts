import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

export interface Session {
  id: string
  title: string
  messages: Array<{ role: string; content: string; timestamp: number }>
  createdAt: number
  updatedAt: number
}

const DATA_DIR = path.join(os.homedir(), '.mimo-desktop')
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions')

async function ensureSessionsDir() {
  await fs.mkdir(SESSIONS_DIR, { recursive: true })
}

export async function listSessions(): Promise<Session[]> {
  await ensureSessionsDir()

  try {
    const files = await fs.readdir(SESSIONS_DIR)
    const sessions: Session[] = []

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(SESSIONS_DIR, file), 'utf-8')
          const session = JSON.parse(content)
          sessions.push(session)
        } catch {
          // Skip invalid files
        }
      }
    }

    return sessions.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export async function loadSession(id: string): Promise<Session | null> {
  const filePath = path.join(SESSIONS_DIR, `${id}.json`)

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export async function saveSession(session: Session): Promise<void> {
  await ensureSessionsDir()

  const filePath = path.join(SESSIONS_DIR, `${session.id}.json`)
  await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8')
}

export async function deleteSession(id: string): Promise<boolean> {
  const filePath = path.join(SESSIONS_DIR, `${id}.json`)

  try {
    await fs.unlink(filePath)
    return true
  } catch {
    return false
  }
}

export async function renameSession(id: string, title: string): Promise<boolean> {
  const session = await loadSession(id)
  if (!session) return false

  session.title = title
  session.updatedAt = Date.now()
  await saveSession(session)
  return true
}
