import * as fs from 'fs/promises'
import * as path from 'path'

export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: number
}

export async function listDirectory(dirPath: string): Promise<FileEntry[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  const result: FileEntry[] = []

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue

    const fullPath = path.join(dirPath, entry.name)
    try {
      const stat = await fs.stat(fullPath)
      result.push({
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
        size: stat.size,
        modified: stat.mtimeMs
      })
    } catch {
      // skip inaccessible files
    }
  }

  result.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return result
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8')
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8')
}

export async function searchFiles(
  dirPath: string,
  pattern: string
): Promise<FileEntry[]> {
  const results: FileEntry[] = []
  const regex = new RegExp(pattern, 'i')

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (regex.test(entry.name)) {
        const stat = await fs.stat(fullPath)
        results.push({
          name: entry.name,
          path: fullPath,
          isDirectory: false,
          size: stat.size,
          modified: stat.mtimeMs
        })
      }
    }
  }

  await walk(dirPath)
  return results
}
