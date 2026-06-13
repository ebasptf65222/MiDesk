import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

export interface Skill {
  id: string
  name: string
  description: string
  location: string
  version?: string
  author?: string
  enabled: boolean
}

const SKILLS_DIR = path.join(os.homedir(), '.agents', 'skills')

export async function listSkills(): Promise<Skill[]> {
  const skills: Skill[] = []

  try {
    // Check if skills directory exists
    await fs.access(SKILLS_DIR)

    const entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const skillPath = path.join(SKILLS_DIR, entry.name)
        const skill = await loadSkillInfo(skillPath, entry.name)
        if (skill) {
          skills.push(skill)
        }
      }
    }
  } catch {
    // Skills directory doesn't exist or can't be read
    console.log('[Skills] Skills directory not found:', SKILLS_DIR)
  }

  return skills
}

async function loadSkillInfo(skillPath: string, dirName: string): Promise<Skill | null> {
  try {
    // Try to read SKILL.md
    const skillMdPath = path.join(skillPath, 'SKILL.md')
    let description = ''
    let name = dirName

    try {
      const content = await fs.readFile(skillMdPath, 'utf-8')
      // Extract first paragraph as description
      const lines = content.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
          description = trimmed.substring(0, 200)
          break
        }
      }
      // Extract name from first heading
      const nameMatch = content.match(/^#\s+(.+)/m)
      if (nameMatch) {
        name = nameMatch[1].trim()
      }
    } catch {
      // No SKILL.md, try package.json
      try {
        const pkgPath = path.join(skillPath, 'package.json')
        const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'))
        name = pkg.name || dirName
        description = pkg.description || ''
      } catch {
        // Use directory name
      }
    }

    // Check _meta.json for version
    let version = '1.0.0'
    try {
      const metaPath = path.join(skillPath, '_meta.json')
      const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'))
      version = meta.version || version
    } catch {
      // No meta file
    }

    return {
      id: dirName,
      name,
      description,
      location: skillPath,
      version,
      enabled: true
    }
  } catch {
    return null
  }
}

export async function getSkillContent(skillId: string): Promise<string | null> {
  try {
    const skillPath = path.join(SKILLS_DIR, skillId, 'SKILL.md')
    return await fs.readFile(skillPath, 'utf-8')
  } catch {
    return null
  }
}

export async function installSkill(skillPath: string): Promise<Skill | null> {
  try {
    const stat = await fs.stat(skillPath)
    if (!stat.isDirectory()) {
      return null
    }

    const dirName = path.basename(skillPath)
    const targetPath = path.join(SKILLS_DIR, dirName)

    // Create skills directory if needed
    await fs.mkdir(SKILLS_DIR, { recursive: true })

    // Copy skill to skills directory
    await fs.cp(skillPath, targetPath, { recursive: true })

    return await loadSkillInfo(targetPath, dirName)
  } catch (err) {
    console.error('[Skills] Install error:', err)
    return null
  }
}

export async function removeSkill(skillId: string): Promise<boolean> {
  try {
    const skillPath = path.join(SKILLS_DIR, skillId)
    await fs.rm(skillPath, { recursive: true, force: true })
    return true
  } catch {
    return false
  }
}

export async function getSkillsDirectory(): Promise<string> {
  return SKILLS_DIR
}
