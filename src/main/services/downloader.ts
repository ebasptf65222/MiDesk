import * as https from 'https'
import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { EventEmitter } from 'events'

export interface DownloadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface DownloadResult {
  success: boolean
  filePath?: string
  error?: string
}

export class Downloader extends EventEmitter {
  private downloadDir: string
  private tempDir: string
  private downloadUrl: string
  private filename: string

  constructor() {
    super()
    this.downloadDir = path.join(os.homedir(), '.mimo-desktop', 'bin')
    this.tempDir = path.join(os.homedir(), '.mimo-desktop', 'temp')
    this.ensureDirectories()
    
    // Load config from package.json
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'package.json'), 'utf-8'))
      this.downloadUrl = packageJson.mimoCli?.downloadUrl || ''
      this.filename = packageJson.mimoCli?.filename || 'mimo.exe'
    } catch {
      this.downloadUrl = ''
      this.filename = 'mimo.exe'
    }
  }

  private ensureDirectories(): void {
    fs.mkdirSync(this.downloadDir, { recursive: true })
    fs.mkdirSync(this.tempDir, { recursive: true })
  }

  async download(url: string, filename: string): Promise<DownloadResult> {
    const filePath = path.join(this.downloadDir, filename)
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      return { success: true, filePath }
    }

    const tempPath = path.join(this.tempDir, `${filename}.tmp`)

    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http
      
      const req = protocol.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // Follow redirect
          const redirectUrl = res.headers.location
          if (redirectUrl) {
            this.download(redirectUrl, filename).then(resolve)
            return
          }
        }

        if (res.statusCode !== 200) {
          resolve({ success: false, error: `HTTP ${res.statusCode}` })
          return
        }

        const total = parseInt(res.headers['content-length'] || '0', 10)
        let loaded = 0

        const fileStream = fs.createWriteStream(tempPath)

        res.on('data', (chunk: Buffer) => {
          loaded += chunk.length
          const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0
          this.emit('progress', { loaded, total, percentage } as DownloadProgress)
        })

        res.pipe(fileStream)

        fileStream.on('finish', () => {
          fileStream.close()
          // Move from temp to final location
          fs.renameSync(tempPath, filePath)
          resolve({ success: true, filePath })
        })

        fileStream.on('error', (err) => {
          fs.unlinkSync(tempPath)
          resolve({ success: false, error: err.message })
        })
      })

      req.on('error', (err) => {
        resolve({ success: false, error: err.message })
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({ success: false, error: 'Download timeout' })
      })
    })
  }

  getCLIPath(): string {
    return path.join(this.downloadDir, this.filename)
  }

  isCLIDownloaded(): boolean {
    return fs.existsSync(this.getCLIPath())
  }

  getDownloadUrl(): string {
    return this.downloadUrl
  }

  getFilename(): string {
    return this.filename
  }
}

export const downloader = new Downloader()