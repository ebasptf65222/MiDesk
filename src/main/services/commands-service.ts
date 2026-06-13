import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface CustomCommand {
  name: string
  description: string
  template: string
  agent?: string
  model?: string
  subtask?: boolean
}

const GLOBAL_COMMANDS_DIR = path.join(os.homedir(), '.config', 'mimocode', 'commands')

let cachedCommands: CustomCommand[] | null = null
let commandsDir: string | null = null

export function setCommandsDir(dir: string): void {
  commandsDir = dir
  cachedCommands = null
}

function parseMarkdownCommand(filePath: string): CustomCommand | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const name = path.basename(filePath, '.md')

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!frontmatterMatch) {
      return { name, description: '', template: content.trim() }
    }

    const frontmatter = frontmatterMatch[1]
    const body = content.substring(frontmatterMatch[0].length).trim()

    const description = frontmatter.match(/description:\s*(.+)/)?.[1]?.trim() || ''
    const agent = frontmatter.match(/agent:\s*(.+)/)?.[1]?.trim()
    const model = frontmatter.match(/model:\s*(.+)/)?.[1]?.trim()
    const subtask = frontmatter.match(/subtask:\s*(true|false)/)?.[1] === 'true'

    return {
      name,
      description,
      template: body,
      agent,
      model,
      subtask
    }
  } catch {
    return null
  }
}

function scanCommandsDir(dir: string): CustomCommand[] {
  const commands: CustomCommand[] = []

  try {
    if (!fs.existsSync(dir)) {
      return commands
    }

    const files = fs.readdirSync(dir)
    for (const file of files) {
      if (file.endsWith('.md')) {
        const command = parseMarkdownCommand(path.join(dir, file))
        if (command) {
          commands.push(command)
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return commands
}

export function listCustomCommands(): CustomCommand[] {
  if (cachedCommands) {
    return cachedCommands
  }

  const commands: CustomCommand[] = []

  // Scan global commands directory
  commands.push(...scanCommandsDir(GLOBAL_COMMANDS_DIR))

  // Scan project commands directory
  if (commandsDir) {
    const projectCommands = scanCommandsDir(commandsDir)
    // Project commands override global commands with the same name
    const commandMap = new Map<string, CustomCommand>()
    for (const cmd of commands) {
      commandMap.set(cmd.name, cmd)
    }
    for (const cmd of projectCommands) {
      commandMap.set(cmd.name, cmd)
    }
    cachedCommands = Array.from(commandMap.values())
    return cachedCommands
  }

  cachedCommands = commands
  return cachedCommands
}

export function getCustomCommand(name: string): CustomCommand | null {
  const commands = listCustomCommands()
  return commands.find(c => c.name === name) || null
}

export function clearCommandsCache(): void {
  cachedCommands = null
}
