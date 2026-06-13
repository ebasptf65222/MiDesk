import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

export interface ProjectRule {
  id: string
  name: string
  content: string
  filePath: string
  enabled: boolean
}

const RULES_FILES = [
  '.mimorules',
  '.clinerules',
  '.cursorrules'
]

export class RulesService {
  private currentDir: string = ''

  setDirectory(dir: string): void {
    this.currentDir = dir
  }

  async getRules(): Promise<ProjectRule[]> {
    if (!this.currentDir) return []

    const rules: ProjectRule[] = []

    for (const filename of RULES_FILES) {
      const filePath = path.join(this.currentDir, filename)
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        rules.push({
          id: filename,
          name: filename,
          content,
          filePath,
          enabled: true
        })
      } catch {
        // File doesn't exist, skip
      }
    }

    return rules
  }

  async getRuleContent(filename: string): Promise<string> {
    if (!this.currentDir) return ''
    const filePath = path.join(this.currentDir, filename)
    try {
      return await fs.readFile(filePath, 'utf-8')
    } catch {
      return ''
    }
  }

  async saveRule(filename: string, content: string): Promise<void> {
    if (!this.currentDir) throw new Error('No directory set')
    const filePath = path.join(this.currentDir, filename)
    await fs.writeFile(filePath, content, 'utf-8')
  }

  async deleteRule(filename: string): Promise<void> {
    if (!this.currentDir) return
    const filePath = path.join(this.currentDir, filename)
    try {
      await fs.unlink(filePath)
    } catch {
      // File doesn't exist, ignore
    }
  }

  async getGlobalRules(): Promise<string> {
    const globalPath = path.join(os.homedir(), '.mimo-desktop', 'global-rules.md')
    try {
      return await fs.readFile(globalPath, 'utf-8')
    } catch {
      return ''
    }
  }

  async saveGlobalRules(content: string): Promise<void> {
    const configDir = path.join(os.homedir(), '.mimo-desktop')
    const globalPath = path.join(configDir, 'global-rules.md')
    await fs.mkdir(configDir, { recursive: true })
    await fs.writeFile(globalPath, content, 'utf-8')
  }
}

export const rulesService = new RulesService()
