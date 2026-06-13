import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const mimoAPI = {
  chat: {
    send: (message: string) => {
      console.log('[Preload] chat.send:', message)
      return electronAPI.ipcRenderer.invoke('mimo:chat:send', message)
    },
    setCwd: (dirPath: string) => electronAPI.ipcRenderer.invoke('mimo:chat:setCwd', dirPath),
    onChunk: (callback: (chunk: { type: string; content: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, chunk: { type: string; content: string }) => {
        console.log('[Preload] chunk received, type:', chunk.type)
        callback(chunk)
      }
      electronAPI.ipcRenderer.on('mimo:chat:chunk', handler)
      return () => electronAPI.ipcRenderer.removeListener('mimo:chat:chunk', handler)
    },
    onDone: (callback: () => void) => {
      const handler = () => {
        console.log('[Preload] done received')
        callback()
      }
      electronAPI.ipcRenderer.on('mimo:chat:done', handler)
      return () => electronAPI.ipcRenderer.removeListener('mimo:chat:done', handler)
    },
    stop: () => electronAPI.ipcRenderer.invoke('mimo:chat:stop'),
    undo: () => electronAPI.ipcRenderer.invoke('mimo:chat:undo'),
    redo: () => electronAPI.ipcRenderer.invoke('mimo:chat:redo'),
    setAgent: (agent: string) => electronAPI.ipcRenderer.invoke('mimo:chat:setAgent', agent),
    getAgent: () => electronAPI.ipcRenderer.invoke('mimo:chat:getAgent')
  },
  file: {
    list: (dirPath: string) => electronAPI.ipcRenderer.invoke('mimo:file:list', dirPath),
    read: (filePath: string) => electronAPI.ipcRenderer.invoke('mimo:file:read', filePath),
    write: (filePath: string, content: string) => electronAPI.ipcRenderer.invoke('mimo:file:write', filePath, content),
    search: (dirPath: string, pattern: string) => electronAPI.ipcRenderer.invoke('mimo:file:search', dirPath, pattern),
    openDirectory: () => electronAPI.ipcRenderer.invoke('mimo:file:openDirectory')
  },
  workspace: {
    list: () => electronAPI.ipcRenderer.invoke('mimo:workspace:list'),
    open: (path: string) => electronAPI.ipcRenderer.invoke('mimo:workspace:open', path),
    close: (id: string) => electronAPI.ipcRenderer.invoke('mimo:workspace:close', id)
  },
  terminal: {
    create: (id: string, cwd: string) => electronAPI.ipcRenderer.invoke('mimo:terminal:create', id, cwd),
    write: (id: string, data: string) => electronAPI.ipcRenderer.invoke('mimo:terminal:write', id, data),
    resize: (id: string, cols: number, rows: number) => electronAPI.ipcRenderer.invoke('mimo:terminal:resize', id, cols, rows),
    destroy: (id: string) => electronAPI.ipcRenderer.invoke('mimo:terminal:destroy', id),
    execute: (command: string, cwd: string) => electronAPI.ipcRenderer.invoke('mimo:terminal:execute', command, cwd),
    onOutput: (id: string, callback: (data: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, outputId: string, data: string) => {
        if (outputId === id) callback(data)
      }
      electronAPI.ipcRenderer.on('mimo:terminal:output', handler)
      return () => electronAPI.ipcRenderer.removeListener('mimo:terminal:output', handler)
    },
    onExit: (id: string, callback: (code: number) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, exitId: string, code: number) => {
        if (exitId === id) callback(code)
      }
      electronAPI.ipcRenderer.on('mimo:terminal:exit', handler)
      return () => electronAPI.ipcRenderer.removeListener('mimo:terminal:exit', handler)
    }
  },
  settings: {
    get: () => electronAPI.ipcRenderer.invoke('mimo:settings:get'),
    update: (settings: Record<string, unknown>) => electronAPI.ipcRenderer.invoke('mimo:settings:update', settings),
    reset: () => electronAPI.ipcRenderer.invoke('mimo:settings:reset')
  },
  skills: {
    list: () => electronAPI.ipcRenderer.invoke('mimo:skills:list'),
    content: (skillId: string) => electronAPI.ipcRenderer.invoke('mimo:skills:content', skillId),
    install: (skillPath?: string) => electronAPI.ipcRenderer.invoke('mimo:skills:install', skillPath),
    remove: (skillId: string) => electronAPI.ipcRenderer.invoke('mimo:skills:remove', skillId),
    directory: () => electronAPI.ipcRenderer.invoke('mimo:skills:directory')
  },
  sessions: {
    list: () => electronAPI.ipcRenderer.invoke('mimo:sessions:list'),
    load: (id: string) => electronAPI.ipcRenderer.invoke('mimo:sessions:load', id),
    save: (session: unknown) => electronAPI.ipcRenderer.invoke('mimo:sessions:save', session),
    delete: (id: string) => electronAPI.ipcRenderer.invoke('mimo:sessions:delete', id),
    rename: (id: string, title: string) => electronAPI.ipcRenderer.invoke('mimo:sessions:rename', id, title)
  },
  git: {
    setCwd: (dirPath: string) => electronAPI.ipcRenderer.invoke('mimo:git:setCwd', dirPath),
    status: () => electronAPI.ipcRenderer.invoke('mimo:git:status'),
    commit: (message: string) => electronAPI.ipcRenderer.invoke('mimo:git:commit', message),
    diff: (filePath?: string) => electronAPI.ipcRenderer.invoke('mimo:git:diff', filePath),
    log: (count?: number) => electronAPI.ipcRenderer.invoke('mimo:git:log', count)
  },
  models: {
    providers: () => electronAPI.ipcRenderer.invoke('mimo:models:providers'),
    getConfig: (providerId: string) => electronAPI.ipcRenderer.invoke('mimo:models:getConfig', providerId),
    setConfig: (config: { providerId: string; apiKey: string; baseUrl?: string }) => electronAPI.ipcRenderer.invoke('mimo:models:setConfig', config),
    removeConfig: (providerId: string) => electronAPI.ipcRenderer.invoke('mimo:models:removeConfig', providerId),
    test: (providerId: string) => electronAPI.ipcRenderer.invoke('mimo:models:test', providerId),
    list: (providerId: string) => electronAPI.ipcRenderer.invoke('mimo:models:list', providerId)
  },
  mcp: {
    servers: () => electronAPI.ipcRenderer.invoke('mimo:mcp:servers'),
    add: (server: { name: string; command: string; args: string[]; env?: Record<string, string>; enabled: boolean }) => electronAPI.ipcRenderer.invoke('mimo:mcp:add', server),
    update: (id: string, updates: any) => electronAPI.ipcRenderer.invoke('mimo:mcp:update', id, updates),
    remove: (id: string) => electronAPI.ipcRenderer.invoke('mimo:mcp:remove', id),
    connect: (id: string) => electronAPI.ipcRenderer.invoke('mimo:mcp:connect', id),
    disconnect: (id: string) => electronAPI.ipcRenderer.invoke('mimo:mcp:disconnect', id),
    tools: () => electronAPI.ipcRenderer.invoke('mimo:mcp:tools'),
    callTool: (toolName: string, args: any) => electronAPI.ipcRenderer.invoke('mimo:mcp:callTool', toolName, args)
  },
  rules: {
    setDir: (dirPath: string) => electronAPI.ipcRenderer.invoke('mimo:rules:setDir', dirPath),
    list: () => electronAPI.ipcRenderer.invoke('mimo:rules:list'),
    get: (filename: string) => electronAPI.ipcRenderer.invoke('mimo:rules:get', filename),
    save: (filename: string, content: string) => electronAPI.ipcRenderer.invoke('mimo:rules:save', filename, content),
    delete: (filename: string) => electronAPI.ipcRenderer.invoke('mimo:rules:delete', filename),
    getGlobal: () => electronAPI.ipcRenderer.invoke('mimo:rules:global:get'),
    saveGlobal: (content: string) => electronAPI.ipcRenderer.invoke('mimo:rules:global:save', content)
  },
  inlineEdit: {
    edit: (filePath: string, selectedCode: string, instruction: string) => electronAPI.ipcRenderer.invoke('mimo:inline-edit:edit', filePath, selectedCode, instruction)
  },
  themes: {
    list: () => electronAPI.ipcRenderer.invoke('mimo:themes:list'),
    get: (name: string) => electronAPI.ipcRenderer.invoke('mimo:themes:get', name),
    refresh: () => electronAPI.ipcRenderer.invoke('mimo:themes:refresh')
  },
  commands: {
    list: () => electronAPI.ipcRenderer.invoke('mimo:commands:list'),
    get: (name: string) => electronAPI.ipcRenderer.invoke('mimo:commands:get', name),
    setDir: (dirPath: string) => electronAPI.ipcRenderer.invoke('mimo:commands:setDir', dirPath),
    refresh: () => electronAPI.ipcRenderer.invoke('mimo:commands:refresh')
  },
  download: {
    status: () => electronAPI.ipcRenderer.invoke('mimo:download:status'),
    start: (url?: string, filename?: string) => electronAPI.ipcRenderer.invoke('mimo:download:start', url, filename),
    onProgress: (callback: (progress: { loaded: number; total: number; percentage: number }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, progress: { loaded: number; total: number; percentage: number }) => {
        callback(progress)
      }
      electronAPI.ipcRenderer.on('mimo:download:progress', handler)
      return () => electronAPI.ipcRenderer.removeListener('mimo:download:progress', handler)
    }
  },
  update: {
    check: () => electronAPI.ipcRenderer.invoke('mimo:update:check'),
    download: () => electronAPI.ipcRenderer.invoke('mimo:update:download'),
    install: () => electronAPI.ipcRenderer.invoke('mimo:update:install'),
    onAvailable: (callback: (info: { version: string; releaseDate: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, info: { version: string; releaseDate: string }) => {
        callback(info)
      }
      electronAPI.ipcRenderer.on('mimo:update:available', handler)
      return () => electronAPI.ipcRenderer.removeListener('mimo:update:available', handler)
    },
    onProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => {
        callback(progress)
      }
      electronAPI.ipcRenderer.on('mimo:update:progress', handler)
      return () => electronAPI.ipcRenderer.removeListener('mimo:update:progress', handler)
    },
    onDownloaded: (callback: () => void) => {
      const handler = () => callback()
      electronAPI.ipcRenderer.on('mimo:update:downloaded', handler)
      return () => electronAPI.ipcRenderer.removeListener('mimo:update:downloaded', handler)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('mimo', mimoAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.mimo = mimoAPI
}

export type MimoAPI = typeof mimoAPI
