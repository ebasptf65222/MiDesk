import * as https from 'https'
import * as http from 'http'

export interface ModelProvider {
  id: string
  name: string
  baseUrl: string
  models: ModelInfo[]
  apiKeyRequired: boolean
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  contextLength: number
  description: string
}

export const PROVIDERS: ModelProvider[] = [
  {
    id: 'mimo',
    name: 'MiMo',
    baseUrl: 'https://api.mimo.com',
    apiKeyRequired: true,
    models: [
      { id: 'mimo-auto', name: 'MiMo Auto', provider: 'mimo', contextLength: 128000, description: '推荐 - 自动选择最佳模型' },
      { id: 'mimo-v2.5-pro', name: 'MiMo v2.5 Pro', provider: 'mimo', contextLength: 128000, description: '最强推理能力' },
      { id: 'mimo-v2.5-flash', name: 'MiMo v2.5 Flash', provider: 'mimo', contextLength: 128000, description: '快速响应' }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    apiKeyRequired: true,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextLength: 128000, description: '最强多模态' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextLength: 128000, description: '高性价比' },
      { id: 'o1', name: 'o1', provider: 'openai', contextLength: 200000, description: '推理模型' }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    apiKeyRequired: true,
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', contextLength: 200000, description: '最佳编码' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', contextLength: 200000, description: '快速轻量' }
    ]
  },
  {
    id: 'google',
    name: 'Google',
    baseUrl: 'https://generativelanguage.googleapis.com',
    apiKeyRequired: true,
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', contextLength: 1000000, description: '百万上下文' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', contextLength: 1000000, description: '快速推理' }
    ]
  },
  {
    id: 'ollama',
    name: 'Ollama (本地)',
    baseUrl: 'http://localhost:11434',
    apiKeyRequired: false,
    models: [
      { id: 'llama3.1', name: 'Llama 3.1', provider: 'ollama', contextLength: 128000, description: '本地运行' },
      { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', provider: 'ollama', contextLength: 128000, description: '本地编码' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'ollama', contextLength: 128000, description: '本地编码' }
    ]
  }
]

export interface ProviderConfig {
  providerId: string
  apiKey: string
  baseUrl?: string
}

export class ModelProviderManager {
  private configs: Map<string, ProviderConfig> = new Map()

  constructor() {
    this.loadConfigs()
  }

  private loadConfigs(): void {
    try {
      const fs = require('fs')
      const path = require('path')
      const os = require('os')
      const configFile = path.join(os.homedir(), '.mimo-desktop', 'providers.json')
      if (fs.existsSync(configFile)) {
        const data = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
        for (const [id, config] of Object.entries(data)) {
          this.configs.set(id, config as ProviderConfig)
        }
      }
    } catch {
      // Ignore errors on load
    }
  }

  private saveConfigs(): void {
    const fs = require('fs')
    const path = require('path')
    const os = require('os')
    const configDir = path.join(os.homedir(), '.mimo-desktop')
    const configFile = path.join(configDir, 'providers.json')
    fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(configFile, JSON.stringify(Object.fromEntries(this.configs), null, 2))
  }

  getConfig(providerId: string): ProviderConfig | undefined {
    return this.configs.get(providerId)
  }

  setConfig(config: ProviderConfig): void {
    this.configs.set(config.providerId, config)
    this.saveConfigs()
  }

  removeConfig(providerId: string): void {
    this.configs.delete(providerId)
    this.saveConfigs()
  }

  getProvider(id: string): ModelProvider | undefined {
    return PROVIDERS.find(p => p.id === id)
  }

  getAllProviders(): ModelProvider[] {
    return PROVIDERS
  }

  getModelsByProvider(providerId: string): ModelInfo[] {
    const provider = this.getProvider(providerId)
    return provider?.models || []
  }

  async testConnection(providerId: string): Promise<{ success: boolean; error?: string }> {
    const provider = this.getProvider(providerId)
    const config = this.configs.get(providerId)
    if (!provider) return { success: false, error: 'Provider not found' }
    if (provider.apiKeyRequired && !config?.apiKey) return { success: false, error: 'API Key not configured' }

    try {
      const url = new URL(provider.baseUrl)
      const client = url.protocol === 'https:' ? https : http

      return new Promise((resolve) => {
        const req = client.request({
          hostname: url.hostname,
          port: url.port,
          path: providerId === 'ollama' ? '/api/tags' : '/v1/models',
          method: 'GET',
          headers: config?.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {},
          timeout: 10000
        }, (res) => {
          resolve({ success: res.statusCode === 200 })
        })
        req.on('error', (err) => resolve({ success: false, error: err.message }))
        req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Connection timeout' }) })
        req.end()
      })
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }
}

export const modelProviderManager = new ModelProviderManager()
