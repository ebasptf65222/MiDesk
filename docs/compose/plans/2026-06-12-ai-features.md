# MiMo Code Desktop - AI 功能增强实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 MiMo Code Desktop 添加 MCP 支持、Rules 规则系统、Plan/Act 模式、多模型支持、内联编辑和代码库索引六大核心功能。

**Architecture:** 基于现有 Electron + Vue 3 + IPC 架构，新增 6 个 IPC 模块和 6 个 renderer 组件/模块。每个功能独立实现，通过设置中心统一配置。

**Tech Stack:** Electron 32, Vue 3, Pinia, TypeScript, xterm.js, node-pty

---

## 文件结构总览

```
src/
├── main/
│   ├── ipc/
│   │   ├── mcp.ts              # MCP 协议 IPC
│   │   ├── rules.ts            # Rules 规则 IPC
│   │   ├── models.ts           # 多模型管理 IPC
│   │   ├── codebase.ts         # 代码库索引 IPC
│   │   └── inline-edit.ts      # 内联编辑 IPC
│   ├── services/
│   │   ├── mcp-manager.ts      # MCP 服务器管理
│   │   ├── rules-service.ts    # Rules 文件读写
│   │   ├── model-provider.ts   # 多模型提供商
│   │   ├── codebase-indexer.ts # 代码库索引引擎
│   │   └── inline-edit.ts      # 内联编辑逻辑
│   └── index.ts                # 注册新 IPC
├── preload/
│   └── index.ts                # 暴露新 API
└── renderer/
    └── src/
        ├── stores/
        │   ├── mcp.ts          # MCP store
        │   ├── rules.ts        # Rules store
        │   ├── models.ts       # 模型 store
        │   └── codebase.ts     # 代码库索引 store
        ├── components/
        │   ├── McpPanel.vue    # MCP 管理面板
        │   ├── RulesPanel.vue  # Rules 编辑面板
        │   ├── ModelSelector.vue # 模型选择器
        │   ├── InlineEditOverlay.vue # 内联编辑浮层
        │   └── SearchPanel.vue # 全局搜索面板
        └── App.vue             # 集成新组件
```

---

## Task 1: 多模型支持 (Multi-model)

**Covers:** 支持 OpenAI、Anthropic、Google、Ollama 等多家模型提供商

**Files:**
- Create: `src/main/services/model-provider.ts`
- Create: `src/main/ipc/models.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/src/stores/chat.ts`
- Modify: `src/renderer/src/components/SettingsView.vue`
- Modify: `src/main/index.ts`

- [ ] **Step 1: 创建模型提供商服务**

```typescript
// src/main/services/model-provider.ts
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
    } catch {}
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
```

- [ ] **Step 2: 创建模型 IPC**

```typescript
// src/main/ipc/models.ts
import { ipcMain } from 'electron'
import { modelProviderManager, ProviderConfig } from '../services/model-provider'

export function registerModelsIPC(): void {
  ipcMain.handle('mimo:models:providers', () => {
    return modelProviderManager.getAllProviders()
  })

  ipcMain.handle('mimo:models:getConfig', (_event, providerId: string) => {
    return modelProviderManager.getConfig(providerId)
  })

  ipcMain.handle('mimo:models:setConfig', (_event, config: ProviderConfig) => {
    modelProviderManager.setConfig(config)
  })

  ipcMain.handle('mimo:models:removeConfig', (_event, providerId: string) => {
    modelProviderManager.removeConfig(providerId)
  })

  ipcMain.handle('mimo:models:test', async (_event, providerId: string) => {
    return modelProviderManager.testConnection(providerId)
  })

  ipcMain.handle('mimo:models:list', (_event, providerId: string) => {
    return modelProviderManager.getModelsByProvider(providerId)
  })
}
```

- [ ] **Step 3: 注册 IPC 到主进程**

在 `src/main/index.ts` 中添加：
```typescript
import { registerModelsIPC } from './ipc/models'

// 在 app.whenReady() 中添加
registerModelsIPC()
```

- [ ] **Step 4: 暴露 preload API**

在 `src/preload/index.ts` 的 `mimoAPI` 中添加：
```typescript
models: {
  providers: () => electronAPI.ipcRenderer.invoke('mimo:models:providers'),
  getConfig: (providerId: string) => electronAPI.ipcRenderer.invoke('mimo:models:getConfig', providerId),
  setConfig: (config: any) => electronAPI.ipcRenderer.invoke('mimo:models:setConfig', config),
  removeConfig: (providerId: string) => electronAPI.ipcRenderer.invoke('mimo:models:removeConfig', providerId),
  test: (providerId: string) => electronAPI.ipcRenderer.invoke('mimo:models:test', providerId),
  list: (providerId: string) => electronAPI.ipcRenderer.invoke('mimo:models:list', providerId)
}
```

- [ ] **Step 5: 创建模型 Store**

```typescript
// src/renderer/src/stores/models.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

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

export interface ProviderConfig {
  providerId: string
  apiKey: string
  baseUrl?: string
}

export const useModelsStore = defineStore('models', () => {
  const providers = ref<ModelProvider[]>([])
  const configs = ref<Map<string, ProviderConfig>>(new Map())
  const selectedProvider = ref<string>('mimo')
  const selectedModel = ref<string>('mimo-auto')
  const loading = ref(false)

  async function loadProviders() {
    loading.value = true
    try {
      providers.value = await window.mimo.models.providers()
      for (const provider of providers.value) {
        const config = await window.mimo.models.getConfig(provider.id)
        if (config) {
          configs.value.set(provider.id, config)
        }
      }
    } finally {
      loading.value = false
    }
  }

  async function saveConfig(config: ProviderConfig) {
    await window.mimo.models.setConfig(config)
    configs.value.set(config.providerId, config)
  }

  async function removeConfig(providerId: string) {
    await window.mimo.models.removeConfig(providerId)
    configs.value.delete(providerId)
  }

  async function testConnection(providerId: string) {
    return window.mimo.models.test(providerId)
  }

  function getModelsByProvider(providerId: string): ModelInfo[] {
    const provider = providers.value.find(p => p.id === providerId)
    return provider?.models || []
  }

  function selectModel(providerId: string, modelId: string) {
    selectedProvider.value = providerId
    selectedModel.value = modelId
  }

  return {
    providers,
    configs,
    selectedProvider,
    selectedModel,
    loading,
    loadProviders,
    saveConfig,
    removeConfig,
    testConnection,
    getModelsByProvider,
    selectModel
  }
})
```

- [ ] **Step 6: 创建模型选择器组件**

```vue
<!-- src/renderer/src/components/ModelSelector.vue -->
<template>
  <div class="model-selector">
    <select v-model="selectedProvider" @change="onProviderChange">
      <option v-for="provider in modelsStore.providers" :key="provider.id" :value="provider.id">
        {{ provider.name }}
      </option>
    </select>
    <select v-model="selectedModel" @change="onModelChange">
      <option v-for="model in availableModels" :key="model.id" :value="model.id">
        {{ model.name }} - {{ model.description }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useModelsStore } from '../stores/models'

const modelsStore = useModelsStore()
const selectedProvider = ref('mimo')
const selectedModel = ref('mimo-auto')

const availableModels = computed(() => {
  return modelsStore.getModelsByProvider(selectedProvider.value)
})

onMounted(() => {
  modelsStore.loadProviders()
})

function onProviderChange() {
  selectedModel.value = availableModels.value[0]?.id || ''
  modelsStore.selectModel(selectedProvider.value, selectedModel.value)
}

function onModelChange() {
  modelsStore.selectModel(selectedProvider.value, selectedModel.value)
}
</script>

<style scoped>
.model-selector {
  display: flex;
  gap: 8px;
}

.model-selector select {
  flex: 1;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
}
</style>
```

- [ ] **Step 7: 更新 SettingsView 集成模型配置**

在 `SettingsView.vue` 的 AI 配置部分添加多提供商支持，替换原有的单一模型选择。

- [ ] **Step 8: 运行验证**

Run: `npm run dev`
Expected: 应用正常启动，设置中可切换不同模型提供商

---

## Task 2: MCP 协议支持

**Covers:** 支持 Model Context Protocol，让 AI 能调用外部工具

**Files:**
- Create: `src/main/services/mcp-manager.ts`
- Create: `src/main/ipc/mcp.ts`
- Create: `src/renderer/src/stores/mcp.ts`
- Create: `src/renderer/src/components/McpPanel.vue`
- Modify: `src/preload/index.ts`
- Modify: `src/main/index.ts`
- Modify: `src/renderer/src/App.vue`

- [ ] **Step 1: 创建 MCP 管理器**

```typescript
// src/main/services/mcp-manager.ts
import { spawn, ChildProcess } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { v4 as uuidv4 } from 'uuid'

export interface McpServer {
  id: string
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
  enabled: boolean
}

export interface McpTool {
  name: string
  description: string
  inputSchema: any
  serverId: string
}

interface McpConnection {
  server: McpServer
  process: ChildProcess
  tools: McpTool[]
  ready: boolean
}

const CONFIG_FILE = path.join(os.homedir(), '.mimo-desktop', 'mcp-servers.json')

export class McpManager {
  private connections: Map<string, McpConnection> = new Map()
  private servers: McpServer[] = []

  constructor() {
    this.loadServers()
  }

  private loadServers(): void {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        this.servers = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
      }
    } catch {
      this.servers = []
    }
  }

  private saveServers(): void {
    const configDir = path.dirname(CONFIG_FILE)
    fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.servers, null, 2))
  }

  getServers(): McpServer[] {
    return this.servers
  }

  addServer(server: Omit<McpServer, 'id'>): McpServer {
    const newServer: McpServer = { ...server, id: uuidv4() }
    this.servers.push(newServer)
    this.saveServers()
    return newServer
  }

  updateServer(id: string, updates: Partial<McpServer>): void {
    const index = this.servers.findIndex(s => s.id === id)
    if (index !== -1) {
      this.servers[index] = { ...this.servers[index], ...updates }
      this.saveServers()
    }
  }

  removeServer(id: string): void {
    this.disconnect(id)
    this.servers = this.servers.filter(s => s.id !== id)
    this.saveServers()
  }

  async connect(id: string): Promise<{ success: boolean; tools?: McpTool[]; error?: string }> {
    const server = this.servers.find(s => s.id === id)
    if (!server) return { success: false, error: 'Server not found' }

    if (this.connections.has(id)) {
      return { success: true, tools: this.connections.get(id)?.tools || [] }
    }

    try {
      const proc = spawn(server.command, server.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...server.env }
      })

      const connection: McpConnection = {
        server,
        process: proc,
        tools: [],
        ready: false
      }

      this.connections.set(id, connection)

      // Send initialize request
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'mimo-desktop', version: '0.1.0' }
        }
      }

      proc.stdin?.write(JSON.stringify(initRequest) + '\n')

      let buffer = ''
      proc.stdout?.on('data', (data: Buffer) => {
        buffer += data.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const response = JSON.parse(line)
            if (response.result?.tools) {
              connection.tools = response.result.tools.map((t: any) => ({
                ...t,
                serverId: id
              }))
              connection.ready = true
            }
          } catch {}
        }
      })

      proc.stderr?.on('data', (data: Buffer) => {
        console.log(`[MCP] ${server.name} stderr:`, data.toString().substring(0, 200))
      })

      proc.on('close', () => {
        this.connections.delete(id)
      })

      // Wait for ready
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (connection.ready || !this.connections.has(id)) {
            clearInterval(check)
            resolve()
          }
        }, 100)
        setTimeout(() => { clearInterval(check); resolve() }, 5000)
      })

      return { success: connection.ready, tools: connection.tools }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  disconnect(id: string): void {
    const connection = this.connections.get(id)
    if (connection) {
      connection.process.kill()
      this.connections.delete(id)
    }
  }

  async callTool(toolName: string, args: any): Promise<any> {
    for (const [id, connection] of this.connections) {
      if (!connection.ready) continue
      const tool = connection.tools.find(t => t.name === toolName)
      if (tool) {
        const request = {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: toolName, arguments: args }
        }
        connection.process.stdin?.write(JSON.stringify(request) + '\n')

        // Wait for response
        return new Promise((resolve) => {
          const handler = (data: Buffer) => {
            try {
              const response = JSON.parse(data.toString().split('\n')[0])
              if (response.id === request.id) {
                connection.process.stdout?.removeListener('data', handler)
                resolve(response.result)
              }
            } catch {}
          }
          connection.process.stdout?.on('data', handler)
          setTimeout(() => resolve({ error: 'Timeout' }), 30000)
        })
      }
    }
    return { error: 'Tool not found' }
  }

  getAllTools(): McpTool[] {
    const tools: McpTool[] = []
    for (const connection of this.connections.values()) {
      if (connection.ready) {
        tools.push(...connection.tools)
      }
    }
    return tools
  }
}

export const mcpManager = new McpManager()
```

- [ ] **Step 2: 创建 MCP IPC**

```typescript
// src/main/ipc/mcp.ts
import { ipcMain } from 'electron'
import { mcpManager, McpServer } from '../services/mcp-manager'

export function registerMcpIPC(): void {
  ipcMain.handle('mimo:mcp:servers', () => {
    return mcpManager.getServers()
  })

  ipcMain.handle('mimo:mcp:add', (_event, server: Omit<McpServer, 'id'>) => {
    return mcpManager.addServer(server)
  })

  ipcMain.handle('mimo:mcp:update', (_event, id: string, updates: Partial<McpServer>) => {
    mcpManager.updateServer(id, updates)
  })

  ipcMain.handle('mimo:mcp:remove', (_event, id: string) => {
    mcpManager.removeServer(id)
  })

  ipcMain.handle('mimo:mcp:connect', async (_event, id: string) => {
    return mcpManager.connect(id)
  })

  ipcMain.handle('mimo:mcp:disconnect', (_event, id: string) => {
    mcpManager.disconnect(id)
  })

  ipcMain.handle('mimo:mcp:tools', () => {
    return mcpManager.getAllTools()
  })

  ipcMain.handle('mimo:mcp:callTool', async (_event, toolName: string, args: any) => {
    return mcpManager.callTool(toolName, args)
  })
}
```

- [ ] **Step 3: 注册 IPC 和暴露 API**

在 `src/main/index.ts` 添加：
```typescript
import { registerMcpIPC } from './ipc/mcp'
registerMcpIPC()
```

在 `src/preload/index.ts` 的 `mimoAPI` 中添加：
```typescript
mcp: {
  servers: () => electronAPI.ipcRenderer.invoke('mimo:mcp:servers'),
  add: (server: any) => electronAPI.ipcRenderer.invoke('mimo:mcp:add', server),
  update: (id: string, updates: any) => electronAPI.ipcRenderer.invoke('mimo:mcp:update', id, updates),
  remove: (id: string) => electronAPI.ipcRenderer.invoke('mimo:mcp:remove', id),
  connect: (id: string) => electronAPI.ipcRenderer.invoke('mimo:mcp:connect', id),
  disconnect: (id: string) => electronAPI.ipcRenderer.invoke('mimo:mcp:disconnect', id),
  tools: () => electronAPI.ipcRenderer.invoke('mimo:mcp:tools'),
  callTool: (toolName: string, args: any) => electronAPI.ipcRenderer.invoke('mimo:mcp:callTool', toolName, args)
}
```

- [ ] **Step 4: 创建 MCP Store**

```typescript
// src/renderer/src/stores/mcp.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface McpServer {
  id: string
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
  enabled: boolean
}

export interface McpTool {
  name: string
  description: string
  inputSchema: any
  serverId: string
}

export const useMcpStore = defineStore('mcp', () => {
  const servers = ref<McpServer[]>([])
  const tools = ref<McpTool[]>([])
  const connected = ref<Set<string>>(new Set())
  const loading = ref(false)

  async function loadServers() {
    servers.value = await window.mimo.mcp.servers()
  }

  async function loadTools() {
    tools.value = await window.mimo.mcp.tools()
  }

  async function addServer(server: Omit<McpServer, 'id'>) {
    const newServer = await window.mimo.mcp.add(server)
    servers.value.push(newServer)
    return newServer
  }

  async function removeServer(id: string) {
    await window.mimo.mcp.remove(id)
    servers.value = servers.value.filter(s => s.id !== id)
    connected.value.delete(id)
  }

  async function connectServer(id: string) {
    loading.value = true
    try {
      const result = await window.mimo.mcp.connect(id)
      if (result.success) {
        connected.value.add(id)
        await loadTools()
      }
      return result
    } finally {
      loading.value = false
    }
  }

  async function disconnectServer(id: string) {
    await window.mimo.mcp.disconnect(id)
    connected.value.delete(id)
    await loadTools()
  }

  async function callTool(toolName: string, args: any) {
    return window.mimo.mcp.callTool(toolName, args)
  }

  return {
    servers,
    tools,
    connected,
    loading,
    loadServers,
    loadTools,
    addServer,
    removeServer,
    connectServer,
    disconnectServer,
    callTool
  }
})
```

- [ ] **Step 5: 创建 MCP 面板组件**

```vue
<!-- src/renderer/src/components/McpPanel.vue -->
<template>
  <div class="mcp-panel">
    <div class="panel-header">
      <h3>MCP 服务器</h3>
      <button class="add-btn" @click="showAddDialog = true">+ 添加</button>
    </div>

    <div class="server-list">
      <div v-for="server in mcpStore.servers" :key="server.id" class="server-card">
        <div class="server-info">
          <span class="server-name">{{ server.name }}</span>
          <span :class="['status', mcpStore.connected.has(server.id) ? 'connected' : 'disconnected']">
            {{ mcpStore.connected.has(server.id) ? '已连接' : '未连接' }}
          </span>
        </div>
        <div class="server-command">{{ server.command }} {{ server.args.join(' ') }}</div>
        <div class="server-actions">
          <button v-if="!mcpStore.connected.has(server.id)" @click="connect(server.id)">连接</button>
          <button v-else @click="disconnect(server.id)">断开</button>
          <button class="danger" @click="remove(server.id)">删除</button>
        </div>
      </div>
    </div>

    <div class="tools-section" v-if="mcpStore.tools.length > 0">
      <h4>可用工具 ({{ mcpStore.tools.length }})</h4>
      <div class="tool-list">
        <div v-for="tool in mcpStore.tools" :key="tool.name" class="tool-item">
          <span class="tool-name">{{ tool.name }}</span>
          <span class="tool-desc">{{ tool.description }}</span>
        </div>
      </div>
    </div>

    <!-- Add Dialog -->
    <div class="dialog-overlay" v-if="showAddDialog" @click.self="showAddDialog = false">
      <div class="dialog">
        <h3>添加 MCP 服务器</h3>
        <input v-model="newServer.name" placeholder="服务器名称" />
        <input v-model="newServer.command" placeholder="命令 (如: npx)" />
        <input v-model="newServer.argsStr" placeholder="参数 (空格分隔)" />
        <div class="dialog-actions">
          <button @click="showAddDialog = false">取消</button>
          <button @click="addServer">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMcpStore } from '../stores/mcp'

const mcpStore = useMcpStore()
const showAddDialog = ref(false)
const newServer = ref({ name: '', command: '', argsStr: '' })

onMounted(() => {
  mcpStore.loadServers()
  mcpStore.loadTools()
})

async function connect(id: string) {
  await mcpStore.connectServer(id)
}

async function disconnect(id: string) {
  await mcpStore.disconnectServer(id)
}

async function remove(id: string) {
  await mcpStore.removeServer(id)
}

async function addServer() {
  await mcpStore.addServer({
    name: newServer.value.name,
    command: newServer.value.command,
    args: newServer.value.argsStr.split(' ').filter(Boolean),
    enabled: true
  })
  showAddDialog.value = false
  newServer.value = { name: '', command: '', argsStr: '' }
}
</script>

<style scoped>
.mcp-panel {
  padding: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.server-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}

.server-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.server-name {
  font-weight: 600;
}

.status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.status.connected {
  background: #10b98120;
  color: #10b981;
}

.status.disconnected {
  background: #ef444420;
  color: #ef4444;
}

.server-command {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 8px 0;
  font-family: monospace;
}

.server-actions {
  display: flex;
  gap: 8px;
}

.server-actions button {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.server-actions button.danger {
  color: #ef4444;
}

.tools-section {
  margin-top: 24px;
}

.tool-item {
  display: flex;
  gap: 12px;
  padding: 8px;
  border-bottom: 1px solid var(--border);
}

.tool-name {
  font-weight: 500;
  color: var(--accent);
}

.tool-desc {
  color: var(--text-secondary);
  font-size: 13px;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  width: 400px;
}

.dialog input {
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
```

- [ ] **Step 6: 集成到 App.vue**

在 App.vue 的 sidebar 中添加 MCP 标签页。

- [ ] **Step 7: 运行验证**

Run: `npm run dev`
Expected: 可添加/连接/断开 MCP 服务器，工具列表正确显示

---

## Task 3: Rules 规则系统

**Covers:** 支持项目级规则文件，定制 AI 行为

**Files:**
- Create: `src/main/services/rules-service.ts`
- Create: `src/main/ipc/rules.ts`
- Create: `src/renderer/src/stores/rules.ts`
- Create: `src/renderer/src/components/RulesPanel.vue`
- Modify: `src/preload/index.ts`
- Modify: `src/main/index.ts`

- [ ] **Step 1: 创建 Rules 服务**

```typescript
// src/main/services/rules-service.ts
import * as fs from 'fs/promises'
import * as path from 'path'

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
      } catch {}
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
    } catch {}
  }

  async getGlobalRules(): Promise<string> {
    const os = require('os')
    const globalPath = path.join(os.homedir(), '.mimo-desktop', 'global-rules.md')
    try {
      return await fs.readFile(globalPath, 'utf-8')
    } catch {
      return ''
    }
  }

  async saveGlobalRules(content: string): Promise<void> {
    const os = require('os')
    const configDir = path.join(os.homedir(), '.mimo-desktop')
    const globalPath = path.join(configDir, 'global-rules.md')
    await fs.mkdir(configDir, { recursive: true })
    await fs.writeFile(globalPath, content, 'utf-8')
  }
}

export const rulesService = new RulesService()
```

- [ ] **Step 2: 创建 Rules IPC**

```typescript
// src/main/ipc/rules.ts
import { ipcMain } from 'electron'
import { rulesService } from '../services/rules-service'

export function registerRulesIPC(): void {
  ipcMain.handle('mimo:rules:setDir', (_event, dirPath: string) => {
    rulesService.setDirectory(dirPath)
  })

  ipcMain.handle('mimo:rules:list', async () => {
    return rulesService.getRules()
  })

  ipcMain.handle('mimo:rules:get', async (_event, filename: string) => {
    return rulesService.getRuleContent(filename)
  })

  ipcMain.handle('mimo:rules:save', async (_event, filename: string, content: string) => {
    await rulesService.saveRule(filename, content)
  })

  ipcMain.handle('mimo:rules:delete', async (_event, filename: string) => {
    await rulesService.deleteRule(filename)
  })

  ipcMain.handle('mimo:rules:global:get', async () => {
    return rulesService.getGlobalRules()
  })

  ipcMain.handle('mimo:rules:global:save', async (_event, content: string) => {
    await rulesService.saveGlobalRules(content)
  })
}
```

- [ ] **Step 3: 注册 IPC 和暴露 API**

在 `src/main/index.ts` 添加：
```typescript
import { registerRulesIPC } from './ipc/rules'
registerRulesIPC()
```

在 `src/preload/index.ts` 的 `mimoAPI` 中添加：
```typescript
rules: {
  setDir: (dirPath: string) => electronAPI.ipcRenderer.invoke('mimo:rules:setDir', dirPath),
  list: () => electronAPI.ipcRenderer.invoke('mimo:rules:list'),
  get: (filename: string) => electronAPI.ipcRenderer.invoke('mimo:rules:get', filename),
  save: (filename: string, content: string) => electronAPI.ipcRenderer.invoke('mimo:rules:save', filename, content),
  delete: (filename: string) => electronAPI.ipcRenderer.invoke('mimo:rules:delete', filename),
  getGlobal: () => electronAPI.ipcRenderer.invoke('mimo:rules:global:get'),
  saveGlobal: (content: string) => electronAPI.ipcRenderer.invoke('mimo:rules:global:save', content)
}
```

- [ ] **Step 4: 创建 Rules Store**

```typescript
// src/renderer/src/stores/rules.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ProjectRule {
  id: string
  name: string
  content: string
  filePath: string
  enabled: boolean
}

export const useRulesStore = defineStore('rules', () => {
  const projectRules = ref<ProjectRule[]>([])
  const globalRules = ref('')
  const activeRule = ref<ProjectRule | null>(null)
  const loading = ref(false)

  async function loadRules(dirPath: string) {
    loading.value = true
    try {
      await window.mimo.rules.setDir(dirPath)
      projectRules.value = await window.mimo.rules.list()
      globalRules.value = await window.mimo.rules.getGlobal()
    } finally {
      loading.value = false
    }
  }

  async function saveRule(filename: string, content: string) {
    await window.mimo.rules.save(filename, content)
    const rule = projectRules.value.find(r => r.id === filename)
    if (rule) {
      rule.content = content
    } else {
      projectRules.value.push({
        id: filename,
        name: filename,
        content,
        filePath: filename,
        enabled: true
      })
    }
  }

  async function deleteRule(filename: string) {
    await window.mimo.rules.delete(filename)
    projectRules.value = projectRules.value.filter(r => r.id !== filename)
  }

  async function saveGlobalRules(content: string) {
    await window.mimo.rules.saveGlobal(content)
    globalRules.value = content
  }

  function setActiveRule(rule: ProjectRule | null) {
    activeRule.value = rule
  }

  return {
    projectRules,
    globalRules,
    activeRule,
    loading,
    loadRules,
    saveRule,
    deleteRule,
    saveGlobalRules,
    setActiveRule
  }
})
```

- [ ] **Step 5: 创建 Rules 面板组件**

```vue
<!-- src/renderer/src/components/RulesPanel.vue -->
<template>
  <div class="rules-panel">
    <div class="panel-header">
      <h3>规则配置</h3>
    </div>

    <div class="rules-tabs">
      <button :class="{ active: activeTab === 'project' }" @click="activeTab = 'project'">项目规则</button>
      <button :class="{ active: activeTab === 'global' }" @click="activeTab = 'global'">全局规则</button>
    </div>

    <!-- Project Rules -->
    <div v-if="activeTab === 'project'" class="rules-content">
      <div v-if="rulesStore.projectRules.length === 0" class="empty-state">
        <p>未找到规则文件</p>
        <p class="hint">支持的文件: .mimorules, .clinerules, .cursorrules</p>
        <button @click="createRule">创建规则文件</button>
      </div>

      <div v-else class="rule-list">
        <div v-for="rule in rulesStore.projectRules" :key="rule.id" class="rule-card" @click="editRule(rule)">
          <span class="rule-name">{{ rule.name }}</span>
          <span class="rule-size">{{ rule.content.length }} 字符</span>
        </div>
      </div>
    </div>

    <!-- Global Rules -->
    <div v-if="activeTab === 'global'" class="rules-content">
      <textarea v-model="globalRulesContent" placeholder="输入全局规则，这些规则会应用到所有项目..." rows="15"></textarea>
      <button @click="saveGlobal" class="save-btn">保存全局规则</button>
    </div>

    <!-- Edit Dialog -->
    <div class="dialog-overlay" v-if="editingRule" @click.self="editingRule = null">
      <div class="dialog large">
        <h3>编辑规则: {{ editingRule.name }}</h3>
        <textarea v-model="editingContent" rows="20"></textarea>
        <div class="dialog-actions">
          <button @click="editingRule = null">取消</button>
          <button @click="saveRule">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRulesStore } from '../stores/rules'
import { useEditorStore } from '../stores/editor'

const rulesStore = useRulesStore()
const editorStore = useEditorStore()
const activeTab = ref('project')
const globalRulesContent = ref('')
const editingRule = ref<any>(null)
const editingContent = ref('')

onMounted(async () => {
  if (editorStore.rootPath) {
    await rulesStore.loadRules(editorStore.rootPath)
  }
  globalRulesContent.value = rulesStore.globalRules
})

function editRule(rule: any) {
  editingRule.value = rule
  editingContent.value = rule.content
}

async function saveRule() {
  if (editingRule.value) {
    await rulesStore.saveRule(editingRule.value.name, editingContent.value)
    editingRule.value = null
  }
}

async function saveGlobal() {
  await rulesStore.saveGlobalRules(globalRulesContent.value)
}

function createRule() {
  editingRule.value = { name: '.mimorules', content: '' }
  editingContent.value = ''
}
</script>

<style scoped>
.rules-panel {
  padding: 16px;
}

.rules-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.rules-tabs button {
  padding: 8px 16px;
  border-radius: 6px;
  background: var(--bg-secondary);
}

.rules-tabs button.active {
  background: var(--accent);
  color: white;
}

.rule-card {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}

.rule-card:hover {
  border-color: var(--accent);
}

textarea {
  width: 100%;
  padding: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: monospace;
  font-size: 13px;
  resize: vertical;
}

.dialog.large {
  width: 600px;
  max-height: 80vh;
}

.dialog.large textarea {
  height: 400px;
}

.save-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: var(--accent);
  color: white;
  border-radius: 6px;
}
</style>
```

- [ ] **Step 6: 集成到 App.vue**

在 App.vue 的 sidebar 中添加 Rules 标签页。

- [ ] **Step 7: 运行验证**

Run: `npm run dev`
Expected: 可查看/编辑项目规则和全局规则

---

## Task 4: Plan/Act 模式切换

**Covers:** AI 先规划后执行，避免一次性生成错误代码

**Files:**
- Modify: `src/renderer/src/stores/chat.ts`
- Modify: `src/renderer/src/components/ChatPanel.vue`
- Modify: `src/main/ipc/chat.ts`

- [ ] **Step 1: 更新 Chat Store 添加模式状态**

```typescript
// 在 src/renderer/src/stores/chat.ts 中添加

export type AgentMode = 'plan' | 'act'

// 在 useChatStore 中添加
const mode = ref<AgentMode>('act')
const planContent = ref<string>('')

function setMode(newMode: AgentMode) {
  mode.value = newMode
}

// 更新 send 函数，根据模式添加系统提示
async function send(message: string) {
  if (!message.trim() || isStreaming.value) return

  let systemPrompt = ''
  if (mode.value === 'plan') {
    systemPrompt = '[MODE: PLAN] 你处于规划模式。只分析问题并制定计划，不要执行任何操作。用 markdown 列出步骤。'
  } else {
    systemPrompt = '[MODE: ACT] 你处于执行模式。按照之前规划的步骤执行操作。'
  }

  const fullMessage = systemPrompt ? `${systemPrompt}\n\n${message}` : message

  // ... 原有发送逻辑
}

return { messages, isStreaming, currentMessage, mode, planContent, send, stop, clear, setMode }
```

- [ ] **Step 2: 更新 ChatPanel 添加模式切换按钮**

在 `ChatPanel.vue` 的 header 中添加模式切换：

```vue
<div class="mode-toggle">
  <button :class="{ active: chatStore.mode === 'plan' }" @click="chatStore.setMode('plan')">
    规划模式
  </button>
  <button :class="{ active: chatStore.mode === 'act' }" @click="chatStore.setMode('act')">
    执行模式
  </button>
</div>
```

添加样式：
```css
.mode-toggle {
  display: flex;
  gap: 4px;
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 2px;
}

.mode-toggle button {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.mode-toggle button.active {
  background: var(--accent);
  color: white;
}
```

- [ ] **Step 3: 运行验证**

Run: `npm run dev`
Expected: 可切换 Plan/Act 模式，AI 响应符合模式要求

---

## Task 5: 内联编辑 (Cmd+K)

**Covers:** 光标处直接修改代码，比聊天框更高效

**Files:**
- Create: `src/renderer/src/components/InlineEditOverlay.vue`
- Create: `src/main/services/inline-edit.ts`
- Modify: `src/renderer/src/components/CodeEditor.vue`

- [ ] **Step 1: 创建内联编辑服务**

```typescript
// src/main/services/inline-edit.ts
import { spawn } from 'child_process'

export class InlineEditService {
  async editCode(
    filePath: string,
    selectedCode: string,
    instruction: string,
    cliPath: string,
    model: string
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
```

- [ ] **Step 2: 创建内联编辑浮层组件**

```vue
<!-- src/renderer/src/components/InlineEditOverlay.vue -->
<template>
  <div class="inline-edit-overlay" v-if="visible" @click.self="cancel">
    <div class="inline-edit-popup" :style="position">
      <div class="edit-header">
        <span>内联编辑</span>
        <button class="close-btn" @click="cancel">×</button>
      </div>
      <textarea
        v-model="instruction"
        placeholder="描述你想如何修改这段代码..."
        rows="3"
        ref="inputEl"
        @keydown.enter.ctrl="apply"
        @keydown.esc="cancel"
      ></textarea>
      <div class="edit-actions">
        <button @click="cancel" class="cancel-btn">取消</button>
        <button @click="apply" class="apply-btn" :disabled="!instruction.trim() || loading">
          {{ loading ? '生成中...' : '应用 (Ctrl+Enter)' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  visible: boolean
  position: { top: string; left: string }
  selectedCode: string
}>()

const emit = defineEmits<{
  (e: 'apply', instruction: string): void
  (e: 'cancel'): void
}>()

const instruction = ref('')
const loading = ref(false)
const inputEl = ref<HTMLTextAreaElement>()

function apply() {
  if (instruction.value.trim()) {
    loading.value = true
    emit('apply', instruction.value)
  }
}

function cancel() {
  instruction.value = ''
  emit('cancel')
}
</script>

<style scoped>
.inline-edit-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.inline-edit-popup {
  position: absolute;
  width: 360px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  padding: 16px;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

textarea {
  width: 100%;
  padding: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  resize: none;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.apply-btn {
  padding: 6px 16px;
  background: var(--accent);
  color: white;
  border-radius: 6px;
}

.apply-btn:disabled {
  opacity: 0.5;
}
</style>
```

- [ ] **Step 3: 集成到 CodeEditor**

在 CodeEditor 组件中添加 Cmd+K 快捷键监听和内联编辑触发。

- [ ] **Step 4: 运行验证**

Run: `npm run dev`
Expected: 选中代码后按 Cmd+K/Ctrl+K 弹出内联编辑框

---

## Task 6: 全局搜索面板

**Covers:** 项目级代码搜索，替代原有的简单搜索

**Files:**
- Create: `src/renderer/src/components/SearchPanel.vue`
- Modify: `src/renderer/src/App.vue`

- [ ] **Step 1: 创建搜索面板组件**

```vue
<!-- src/renderer/src/components/SearchPanel.vue -->
<template>
  <div class="search-panel" v-if="visible">
    <div class="search-header">
      <div class="search-input-wrapper">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          v-model="searchQuery"
          placeholder="搜索文件内容... (Ctrl+Shift+F)"
          ref="inputEl"
          @keydown.esc="close"
          @keydown.enter="search"
        />
        <div class="search-options">
          <label :class="{ active: useRegex }">
            <input type="checkbox" v-model="useRegex" />
            <span>正则</span>
          </label>
          <label :class="{ active: caseSensitive }">
            <input type="checkbox" v-model="caseSensitive" />
            <span>区分大小写</span>
          </label>
        </div>
      </div>
    </div>

    <div class="search-results" v-if="results.length > 0">
      <div class="results-count">找到 {{ results.length }} 个结果</div>
      <div v-for="result in results" :key="result.file" class="result-file">
        <div class="file-header" @click="toggleFile(result.file)">
          <span class="file-name">{{ result.file }}</span>
          <span class="match-count">{{ result.matches.length }} 个匹配</span>
        </div>
        <div v-if="expandedFiles.has(result.file)" class="file-matches">
          <div
            v-for="(match, idx) in result.matches"
            :key="idx"
            class="match-line"
            @click="goToLine(result.file, match.line)"
          >
            <span class="line-number">{{ match.line }}</span>
            <span class="line-content" v-html="highlightMatch(match.content)"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="search-empty" v-else-if="searchQuery && searched">
      未找到匹配结果
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'openFile', file: string, line: number): void
}>()

const searchQuery = ref('')
const useRegex = ref(false)
const caseSensitive = ref(false)
const results = ref<Array<{ file: string; matches: Array<{ line: number; content: string }> }>>([])
const expandedFiles = ref(new Set<string>())
const searched = ref(false)
const inputEl = ref<HTMLInputElement>()

function close() {
  emit('close')
}

async function search() {
  if (!searchQuery.value.trim()) {
    results.value = []
    return
  }

  try {
    const searchResults = await window.mimo.file.search(
      '',
      searchQuery.value
    )
    results.value = searchResults
    searched.value = true

    // Auto-expand first result
    if (searchResults.length > 0) {
      expandedFiles.value.add(searchResults[0].file)
    }
  } catch (err) {
    console.error('Search error:', err)
  }
}

function toggleFile(file: string) {
  if (expandedFiles.value.has(file)) {
    expandedFiles.value.delete(file)
  } else {
    expandedFiles.value.add(file)
  }
}

function goToLine(file: string, line: number) {
  emit('openFile', file, line)
}

function highlightMatch(content: string): string {
  const query = searchQuery.value
  if (!query) return content

  try {
    const flags = caseSensitive.value ? 'g' : 'gi'
    const pattern = useRegex.value ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return content.replace(new RegExp(pattern, flags), '<mark>$&</mark>')
  } catch {
    return content
  }
}

onMounted(() => {
  nextTick(() => inputEl.value?.focus())
})
</script>

<style scoped>
.search-panel {
  position: fixed;
  top: 48px;
  left: 250px;
  right: 320px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border);
  z-index: 100;
  max-height: 50vh;
  overflow: auto;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.search-input-wrapper input {
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
}

.search-options {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.search-options label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  opacity: 0.6;
}

.search-options label.active {
  opacity: 1;
  color: var(--accent);
}

.search-results {
  padding: 0 16px 16px;
}

.results-count {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.file-header {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 4px;
}

.file-name {
  font-family: monospace;
}

.match-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.match-line {
  display: flex;
  gap: 12px;
  padding: 4px 8px;
  cursor: pointer;
  font-family: monospace;
  font-size: 13px;
}

.match-line:hover {
  background: var(--bg-secondary);
}

.line-number {
  color: var(--text-secondary);
  min-width: 40px;
}

.line-content {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-content :deep(mark) {
  background: var(--accent);
  color: white;
  padding: 0 2px;
}

.search-empty {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
}
</style>
```

- [ ] **Step 2: 集成到 App.vue**

添加 Ctrl+Shift+F 快捷键和 SearchPanel 组件。

- [ ] **Step 3: 运行验证**

Run: `npm run dev`
Expected: Ctrl+Shift+F 打开搜索面板，可搜索项目文件内容

---

## Task 7: 多光标编辑

**Covers:** 编辑器基础能力增强

**Files:**
- Modify: `src/renderer/src/components/CodeEditor.vue`

- [ ] **Step 1: 添加多光标支持**

在 CodeEditor 中添加 Alt+Click 添加光标、Ctrl+D 选中相同词的功能。

- [ ] **Step 2: 运行验证**

Run: `npm run dev`
Expected: Alt+Click 可添加多个光标，Ctrl+D 可选中相同词

---

## 实施顺序建议

```
Phase 1 (核心): Task 1 (多模型) → Task 2 (MCP) → Task 3 (Rules)
Phase 2 (效率): Task 4 (Plan/Act) → Task 5 (内联编辑) → Task 6 (搜索) → Task 7 (多光标)
```

## 验证清单

每个 Task 完成后：
1. 运行 `npm run dev` 确保应用正常启动
2. 手动测试新增功能
3. 检查 IPC 调用是否正常
4. 确认数据持久化正确
