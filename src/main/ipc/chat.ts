import { ipcMain } from 'electron'
import { spawn } from 'child_process'
import { downloader } from '../services/downloader'
import * as fs from 'fs'

let activeProcess: ReturnType<typeof spawn> | null = null
let currentCwd: string = process.cwd()

function resolveCLIPath(): string {
  // First check if CLI is already downloaded
  if (downloader.isCLIDownloaded()) {
    return downloader.getCLIPath()
  }

  // MiMo Code CLI location - fallback paths
  const possiblePaths = [
    process.env.MIMO_CLI_PATH || '',
    'D:\\MiMoCode\\mimocode-windows-x64\\mimo.exe',
    'D:\\桌面\\mimocode-windows-x64\\mimo.exe',
    'C:\\Users\\' + (process.env.USERNAME || '') + '\\MiMoCode\\mimocode-windows-x64\\mimo.exe',
    'mimocode',
    'mimo'
  ]
  
  for (const p of possiblePaths) {
    if (p.length > 0 && fs.existsSync(p)) {
      return p
    }
  }
  
  return 'mimo'
}

export function registerChatIPC(): void {
  ipcMain.handle('mimo:chat:setCwd', (_event, dirPath: string) => {
    currentCwd = dirPath
    console.log('[Chat] CWD set to:', dirPath)
  })

  ipcMain.handle('mimo:chat:send', async (event, message: string) => {
    const webContents = event.sender
    console.log('[Chat] Received message:', message)
    console.log('[Chat] CWD:', currentCwd)

    if (activeProcess && !activeProcess.killed) {
      activeProcess.kill()
      activeProcess = null
    }

    const cliPath = resolveCLIPath()
    console.log('[Chat] CLI Path:', cliPath)

    return new Promise<void>((resolve) => {
      try {
        const proc = spawn(cliPath, ['run', message, '--format', 'json', '--pure', '--dangerously-skip-permissions'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env },
          cwd: currentCwd
        })

        activeProcess = proc
        console.log('[Chat] PID:', proc.pid)

        proc.stdin?.end()

        let buffer = ''

        proc.stdout?.on('data', (data: Buffer) => {
          buffer += data.toString()
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const evt = JSON.parse(line)
              console.log('[Chat] event type:', evt.type)

              switch (evt.type) {
                case 'text':
                  if (evt.part?.text) {
                    webContents.send('mimo:chat:chunk', { type: 'text', content: evt.part.text })
                  }
                  break
                case 'thinking':
                  if (evt.part?.thinking) {
                    webContents.send('mimo:chat:chunk', { type: 'thinking', content: evt.part.thinking })
                  }
                  break
                case 'tool_use':
                  if (evt.part) {
                    webContents.send('mimo:chat:chunk', { type: 'tool_use', content: JSON.stringify(evt.part) })
                  }
                  break
                case 'tool_result':
                  if (evt.part) {
                    webContents.send('mimo:chat:chunk', { type: 'tool_result', content: JSON.stringify(evt.part) })
                  }
                  break
                default:
                  console.log('[Chat] unknown event:', evt.type, evt)
                  break
              }
            } catch {
              webContents.send('mimo:chat:chunk', { type: 'text', content: line })
            }
          }
        })

        proc.stderr?.on('data', (data: Buffer) => {
          const text = data.toString()
          console.log('[Chat] stderr:', text.substring(0, 100))
          if (text.includes('Error') || text.includes('error')) {
            webContents.send('mimo:chat:chunk', text)
          }
        })

        proc.on('close', (code) => {
          console.log('[Chat] Closed, code:', code)
          webContents.send('mimo:chat:done')
          activeProcess = null
          resolve()
        })

        proc.on('error', (err) => {
          console.error('[Chat] Error:', err.message)
          webContents.send('mimo:chat:chunk', `Error: ${err.message}`)
          webContents.send('mimo:chat:done')
          activeProcess = null
          resolve()
        })
      } catch (err) {
        console.error('[Chat] Spawn error:', err)
        webContents.send('mimo:chat:chunk', `Spawn error: ${err}`)
        webContents.send('mimo:chat:done')
        resolve()
      }
    })
  })

  ipcMain.handle('mimo:chat:stop', () => {
    if (activeProcess && !activeProcess.killed) {
      activeProcess.kill()
      activeProcess = null
    }
  })
}

export function cleanupChatIPC(): void {
  if (activeProcess && !activeProcess.killed) {
    activeProcess.kill()
  }
}
