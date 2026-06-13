import { spawn } from 'child_process'

export class InlineEditService {
  async editCode(
    filePath: string,
    selectedCode: string,
    instruction: string,
    cliPath: string
  ): Promise<{ success: boolean; newCode?: string; error?: string }> {
    const prompt = `请根据以下指令修改代码：

文件路径: ${filePath}

选中的代码:
\`\`\`
${selectedCode}
\`\`\`

指令: ${instruction}

请直接返回修改后的代码，不要包含解释。`

    return new Promise((resolve) => {
      try {
        const proc = spawn(cliPath, ['run', prompt, '--format', 'json', '--pure'], {
          stdio: ['pipe', 'pipe', 'pipe']
        })

        let output = ''
        proc.stdout?.on('data', (data) => {
          const text = data.toString()
          try {
            const lines = text.split('\n')
            for (const line of lines) {
              if (!line.trim()) continue
              const evt = JSON.parse(line)
              if (evt.type === 'text' && evt.part?.text) {
                output += evt.part.text
              }
            }
          } catch {
            output += text
          }
        })

        proc.on('close', () => {
          // Extract code from markdown code block if present
          const codeMatch = output.match(/```[\s\S]*?\n([\s\S]*?)```/)
          const newCode = codeMatch ? codeMatch[1].trim() : output.trim()
          resolve({ success: true, newCode })
        })

        proc.on('error', (err) => {
          resolve({ success: false, error: err.message })
        })
      } catch (err: any) {
        resolve({ success: false, error: err.message })
      }
    })
  }
}

export const inlineEditService = new InlineEditService()
