import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

export interface GitStatus {
  branch: string
  isDirty: boolean
  files: GitFile[]
}

export interface GitFile {
  status: string
  path: string
}

async function execGit(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim())
      } else {
        reject(new Error(stderr || 'Git command failed'))
      }
    })

    proc.on('error', (err) => {
      reject(err)
    })
  })
}

export async function getGitStatus(cwd: string): Promise<GitStatus | null> {
  try {
    // Check if it's a git repo
    await execGit(['rev-parse', '--git-dir'], cwd)

    // Get branch name
    const branch = await execGit(['branch', '--show-current'], cwd)

    // Get status
    const statusOutput = await execGit(['status', '--porcelain'], cwd)

    const files: GitFile[] = statusOutput
      .split('\n')
      .filter(line => line.trim())
      .map(line => ({
        status: line.substring(0, 2).trim(),
        path: line.substring(3).trim()
      }))

    return {
      branch,
      isDirty: files.length > 0,
      files
    }
  } catch {
    return null
  }
}

export async function gitCommit(cwd: string, message: string): Promise<boolean> {
  try {
    await execGit(['add', '-A'], cwd)
    await execGit(['commit', '-m', message], cwd)
    return true
  } catch {
    return false
  }
}

export interface GitDiffResult {
  original: string
  modified: string
}

export async function gitDiff(cwd: string, filePath?: string): Promise<GitDiffResult | null> {
  try {
    if (!filePath) {
      console.log('gitDiff: no filePath provided')
      return null
    }

    console.log('gitDiff: cwd:', cwd, 'filePath:', filePath)

    // 直接从 git 获取原始内容（HEAD 版本）
    let original = ''
    try {
      original = await execGit(['show', `HEAD:${filePath}`], cwd)
      console.log('gitDiff: original length:', original.length)
    } catch (err) {
      // 文件可能是新文件（未跟踪）
      console.log('gitDiff: failed to get original:', err)
      original = ''
    }

    // 直接从文件系统读取当前内容
    let modified = ''
    try {
      modified = fs.readFileSync(path.join(cwd, filePath), 'utf-8')
      console.log('gitDiff: modified length:', modified.length)
    } catch {
      // 文件可能已被删除
      console.log('gitDiff: failed to get modified')
      modified = ''
    }

    console.log('gitDiff: are they different?:', original !== modified)
    return { original, modified }
  } catch (err) {
    console.error('gitDiff: unexpected error:', err)
    return null
  }
}

export async function gitLog(cwd: string, count: number = 10): Promise<string[]> {
  try {
    const output = await execGit(['log', `--oneline`, `-n`, count.toString()], cwd)
    return output.split('\n').filter(line => line.trim())
  } catch {
    return []
  }
}
