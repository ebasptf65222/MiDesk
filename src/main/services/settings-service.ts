import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

export interface AppSettings {
  apiKey: string
  model: string
  theme: 'dark' | 'light' | 'system'
  autoSave: boolean
  autoSaveInterval: number
  fontSize: number
}

const CONFIG_DIR = path.join(os.homedir(), '.mimo-desktop')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

const defaultSettings: AppSettings = {
  apiKey: '',
  model: 'mimo-auto',
  theme: 'dark',
  autoSave: true,
  autoSaveInterval: 60,
  fontSize: 14
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    await fs.access(CONFIG_FILE)
    const content = await fs.readFile(CONFIG_FILE, 'utf-8')
    const saved = JSON.parse(content)
    return { ...defaultSettings, ...saved }
  } catch {
    return { ...defaultSettings }
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings()
  const updated = { ...current, ...settings }

  await fs.mkdir(CONFIG_DIR, { recursive: true })
  await fs.writeFile(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8')

  return updated
}

export async function resetSettings(): Promise<AppSettings> {
  await fs.mkdir(CONFIG_DIR, { recursive: true })
  await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultSettings, null, 2), 'utf-8')
  return { ...defaultSettings }
}
