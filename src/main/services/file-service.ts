import * as fs from 'fs/promises'
import * as path from 'path'

export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: number
}

// 常见的二进制文件扩展名
const BINARY_EXTENSIONS = new Set([
  // 压缩文件
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
  // 图片
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg',
  // 文档
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  // 可执行文件
  '.exe', '.dll', '.so', '.dylib', '.bin',
  // 音视频
  '.mp3', '.mp4', '.avi', '.mov', '.wav', '.flac', '.ogg',
  // 数据库
  '.db', '.sqlite', '.sqlite3',
  // 其他二进制
  '.class', '.o', '.obj', '.lib', '.a',
  '.woff', '.woff2', '.ttf', '.eot',
  '.psd', '.ai', '.sketch',
])

// 检查文件是否为二进制文件
function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase()
  return BINARY_EXTENSIONS.has(ext)
}

export interface ReadFileResult {
  content: string
  isBinary: boolean
  error?: string
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

export async function readFile(filePath: string): Promise<ReadFileResult> {
  // 先检查是否为二进制文件
  if (isBinaryFile(filePath)) {
    return {
      content: '',
      isBinary: true,
      error: '二进制文件无法在编辑器中显示'
    }
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return {
      content,
      isBinary: false
    }
  } catch (error) {
    return {
      content: '',
      isBinary: false,
      error: error instanceof Error ? error.message : '读取文件失败'
    }
  }
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
