import * as fs from 'fs'
import * as path from 'path'

export interface Theme {
  name: string
  description: string
  theme: Record<string, { dark: string; light: string }>
}

const BUILTIN_THEMES_DIR = path.join(__dirname, '..', '..', 'resources', 'themes')
const CUSTOM_THEMES_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', '.mimo-desktop', 'themes')

let cachedThemes: Theme[] | null = null

function loadBuiltinThemes(): Theme[] {
  const themes: Theme[] = []

  try {
    if (fs.existsSync(BUILTIN_THEMES_DIR)) {
      const files = fs.readdirSync(BUILTIN_THEMES_DIR)
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(path.join(BUILTIN_THEMES_DIR, file), 'utf-8')
            const theme = JSON.parse(content) as Theme
            if (theme.name && theme.theme) {
              themes.push(theme)
            }
          } catch {
            // Skip invalid theme files
          }
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return themes
}

function loadCustomThemes(): Theme[] {
  const themes: Theme[] = []

  try {
    if (fs.existsSync(CUSTOM_THEMES_DIR)) {
      const files = fs.readdirSync(CUSTOM_THEMES_DIR)
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(path.join(CUSTOM_THEMES_DIR, file), 'utf-8')
            const theme = JSON.parse(content) as Theme
            if (theme.name && theme.theme) {
              themes.push(theme)
            }
          } catch {
            // Skip invalid theme files
          }
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return themes
}

export function listThemes(): Theme[] {
  if (cachedThemes) {
    return cachedThemes
  }

  const builtin = loadBuiltinThemes()
  const custom = loadCustomThemes()

  // Custom themes override builtin themes with the same name
  const themeMap = new Map<string, Theme>()
  for (const theme of builtin) {
    themeMap.set(theme.name, theme)
  }
  for (const theme of custom) {
    themeMap.set(theme.name, theme)
  }

  cachedThemes = Array.from(themeMap.values())
  return cachedThemes
}

export function getTheme(name: string): Theme | null {
  const themes = listThemes()
  return themes.find(t => t.name === name) || null
}

export function clearThemeCache(): void {
  cachedThemes = null
}
