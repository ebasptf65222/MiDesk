# Update Checking Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual update checking feature with menu panel integration and status bar indicators

**Architecture:** Extend existing auto-updater infrastructure with UI components for manual checking, display update details, and download/install controls

**Tech Stack:** Electron, Vue 3, TypeScript, electron-updater

---

## File Structure

**New Files:**
- `src/renderer/src/components/UpdateMenu.vue` - Custom menu panel component for update checking
- `src/renderer/src/stores/update.ts` - Pinia store for update state management

**Modified Files:**
- `src/main/updater.ts:7-57` - Extend with additional IPC handlers for detailed update info
- `src/preload/index.ts:155-178` - Extend update API with additional methods
- `src/renderer/src/components/TitleBar.vue:28-39` - Add update icon and menu trigger
- `src/renderer/src/components/StatusBar.vue:22-41` - Add update status indicator

---

### Task 1: Create Update State Store

**Covers:** [S5]

**Files:**
- Create: `src/renderer/src/stores/update.ts`

- [ ] **Step 1: Create Pinia store for update state management**

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

interface UpdateInfo {
  available: boolean
  version: string | null
  releaseDate: string | null
  releaseNotes?: string
}

interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export const useUpdateStore = defineStore('update', () => {
  const updateInfo = ref<UpdateInfo>({
    available: false,
    version: null,
    releaseDate: null
  })
  const isChecking = ref(false)
  const isDownloading = ref(false)
  const progress = ref<UpdateProgress>({
    percent: 0,
    bytesPerSecond: 0,
    transferred: 0,
    total: 0
  })
  const isDownloaded = ref(false)
  const error = ref<string | null>(null)

  function setUpdateInfo(info: UpdateInfo) {
    updateInfo.value = info
  }

  function setChecking(checking: boolean) {
    isChecking.value = checking
  }

  function setDownloading(downloading: boolean) {
    isDownloading.value = downloading
  }

  function setProgress(newProgress: UpdateProgress) {
    progress.value = newProgress
  }

  function setDownloaded(downloaded: boolean) {
    isDownloaded.value = downloaded
  }

  function setError(err: string | null) {
    error.value = err
  }

  function reset() {
    updateInfo.value = { available: false, version: null, releaseDate: null }
    isChecking.value = false
    isDownloading.value = false
    progress.value = { percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 }
    isDownloaded.value = false
    error.value = null
  }

  return {
    updateInfo,
    isChecking,
    isDownloading,
    progress,
    isDownloaded,
    error,
    setUpdateInfo,
    setChecking,
    setDownloading,
    setProgress,
    setDownloaded,
    setError,
    reset
  }
})
```

- [ ] **Step 2: Verify store compiles correctly**

Run: `npm run typecheck`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/stores/update.ts
git commit -m "feat: add update state management store"
```

---

### Task 2: Extend Updater with Detailed Info

**Covers:** [S3, S6]

**Files:**
- Modify: `src/main/updater.ts:7-57`

- [ ] **Step 1: Extend updater.ts with additional IPC handlers**

```typescript
import { autoUpdater } from 'electron-updater'
import { BrowserWindow, ipcMain } from 'electron'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  ipcMain.handle('mimo:update:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return {
        available: !!result,
        version: result?.updateInfo.version || null,
        releaseDate: result?.updateInfo.releaseDate || null,
        releaseNotes: result?.updateInfo.releaseNotes || null,
        files: result?.updateInfo.files || []
      }
    } catch (err) {
      return { available: false, error: String(err) }
    }
  })

  ipcMain.handle('mimo:update:download', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('mimo:update:install', () => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.handle('mimo:update:getVersion', () => {
    return autoUpdater.currentVersion
  })

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('mimo:update:available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('mimo:update:progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('mimo:update:downloaded')
  })

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('mimo:update:error', String(err))
  })

  autoUpdater.checkForUpdates().catch(() => {})
}
```

- [ ] **Step 2: Verify updater compiles correctly**

Run: `npm run typecheck`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/main/updater.ts
git commit -m "feat: extend updater with detailed info and error handling"
```

---

### Task 3: Extend Preload API

**Covers:** [S3]

**Files:**
- Modify: `src/preload/index.ts:155-178`

- [ ] **Step 1: Extend preload API with additional update methods**

```typescript
  update: {
    check: () => electronAPI.ipcRenderer.invoke('mimo:update:check'),
    download: () => electronAPI.ipcRenderer.invoke('mimo:update:download'),
    install: () => electronAPI.ipcRenderer.invoke('mimo:update:install'),
    getVersion: () => electronAPI.ipcRenderer.invoke('mimo:update:getVersion'),
    onAvailable: (callback: (info: { version: string; releaseDate: string; releaseNotes?: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, info: { version: string; releaseDate: string; releaseNotes?: string }) => {
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
    },
    onError: (callback: (error: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, error: string) => {
        callback(error)
      }
      electronAPI.ipcRenderer.on('mimo:update:error', handler)
      return () => electronAPI.ipcRenderer.removeListener('mimo:update:error', handler)
    }
  }
```

- [ ] **Step 2: Verify preload compiles correctly**

Run: `npm run typecheck`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/preload/index.ts
git commit -m "feat: extend preload API with update error handling"
```

---

### Task 4: Create UpdateMenu Component

**Covers:** [S4]

**Files:**
- Create: `src/renderer/src/components/UpdateMenu.vue`

- [ ] **Step 1: Create UpdateMenu.vue component**

```vue
<template>
  <div class="update-menu" v-if="isOpen">
    <div class="menu-header">
      <h3>检查更新</h3>
      <button class="close-btn" @click="$emit('close')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
    
    <div class="menu-content">
      <div class="current-version">
        <span class="label">当前版本</span>
        <span class="version">{{ currentVersion }}</span>
      </div>
      
      <div class="update-status" v-if="updateStore.isChecking">
        <div class="spinner"></div>
        <span>正在检查更新...</span>
      </div>
      
      <div class="update-available" v-else-if="updateStore.updateInfo.available">
        <div class="update-info">
          <span class="new-version">新版本 {{ updateStore.updateInfo.version }}</span>
          <span class="release-date">发布于 {{ updateStore.updateInfo.releaseDate }}</span>
        </div>
        
        <div class="update-notes" v-if="updateStore.updateInfo.releaseNotes">
          <div class="notes-content" v-html="updateStore.updateInfo.releaseNotes"></div>
        </div>
        
        <div class="download-progress" v-if="updateStore.isDownloading">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: updateStore.progress.percent + '%' }"></div>
          </div>
          <span class="progress-text">{{ Math.round(updateStore.progress.percent) }}%</span>
        </div>
        
        <div class="action-buttons">
          <button 
            class="download-btn" 
            @click="handleDownload" 
            :disabled="updateStore.isDownloading"
          >
            {{ updateStore.isDownloading ? '下载中...' : '下载更新' }}
          </button>
          <button 
            class="install-btn" 
            @click="handleInstall" 
            v-if="updateStore.isDownloaded"
          >
            立即安装
          </button>
        </div>
      </div>
      
      <div class="up-to-date" v-else>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22,4 12,14.01 9,11.01"/>
        </svg>
        <span>已是最新版本</span>
      </div>
      
      <div class="error-message" v-if="updateStore.error">
        <span>{{ updateStore.error }}</span>
        <button class="retry-btn" @click="handleCheck">重试</button>
      </div>
    </div>
    
    <div class="menu-footer">
      <button class="check-btn" @click="handleCheck" :disabled="updateStore.isChecking">
        {{ updateStore.isChecking ? '检查中...' : '检查更新' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUpdateStore } from '../stores/update'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const updateStore = useUpdateStore()
const currentVersion = ref('0.1.0')

onMounted(async () => {
  try {
    const version = await window.mimo.update.getVersion()
    currentVersion.value = version || '0.1.0'
  } catch (err) {
    console.error('Failed to get version:', err)
  }
  
  window.mimo.update.onAvailable((info) => {
    updateStore.setUpdateInfo({
      available: true,
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    })
  })
  
  window.mimo.update.onProgress((progress) => {
    updateStore.setProgress(progress)
  })
  
  window.mimo.update.onDownloaded(() => {
    updateStore.setDownloaded(true)
    updateStore.setDownloading(false)
  })
  
  window.mimo.update.onError((error) => {
    updateStore.setError(error)
    updateStore.setChecking(false)
    updateStore.setDownloading(false)
  })
})

async function handleCheck() {
  updateStore.setChecking(true)
  updateStore.setError(null)
  
  try {
    const result = await window.mimo.update.check()
    if (!result.available) {
      updateStore.setUpdateInfo({
        available: false,
        version: null,
        releaseDate: null
      })
    }
  } catch (err) {
    updateStore.setError(String(err))
  } finally {
    updateStore.setChecking(false)
  }
}

async function handleDownload() {
  updateStore.setDownloading(true)
  updateStore.setError(null)
  
  try {
    await window.mimo.update.download()
  } catch (err) {
    updateStore.setError(String(err))
    updateStore.setDownloading(false)
  }
}

function handleInstall() {
  window.mimo.update.install()
}
</script>

<style scoped>
.update-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 320px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 4px;
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.menu-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.menu-content {
  padding: 16px;
}

.current-version {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.current-version .label {
  font-size: 12px;
  color: var(--text-secondary);
}

.current-version .version {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.update-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.update-available {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.update-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.new-version {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-color);
}

.release-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.update-notes {
  max-height: 120px;
  overflow-y: auto;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
}

.notes-content {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.download-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 35px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.download-btn,
.install-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.download-btn {
  background: var(--accent-color);
  color: white;
}

.download-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.install-btn {
  background: var(--success-color);
  color: white;
}

.install-btn:hover {
  background: var(--success-hover);
}

.up-to-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: var(--success-color);
}

.up-to-date span {
  font-size: 13px;
  font-weight: 500;
}

.error-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  font-size: 12px;
  color: var(--error-color);
}

.retry-btn {
  align-self: flex-start;
  padding: 4px 8px;
  background: none;
  border: 1px solid var(--error-color);
  border-radius: 4px;
  color: var(--error-color);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.retry-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.menu-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
}

.check-btn {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.check-btn:hover:not(:disabled) {
  background: var(--border-active);
}

.check-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

- [ ] **Step 2: Verify component compiles correctly**

Run: `npm run typecheck`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/UpdateMenu.vue
git commit -m "feat: create UpdateMenu component with update checking UI"
```

---

### Task 5: Modify TitleBar for Update Icon

**Covers:** [S2, S4]

**Files:**
- Modify: `src/renderer/src/components/TitleBar.vue:28-39`

- [ ] **Step 1: Add update icon and menu trigger to TitleBar**

```vue
<template>
  <div class="titlebar" @dblclick="toggleMaximize">
    <div class="titlebar-left">
      <button class="nav-btn" @click="$emit('toggleSidebar')" title="切换侧边栏">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
      </button>
      <div class="nav-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['nav-tab', { active: activeTab === tab.id }]"
          @click="$emit('changeTab', tab.id)"
          :title="tab.label"
        >
          <span class="tab-icon" v-html="tab.icon"></span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <div class="titlebar-center">
      <span class="title">MiMo Code</span>
    </div>

    <div class="titlebar-right">
      <div class="update-trigger" @click="toggleUpdateMenu">
        <button class="action-btn" title="检查更新">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <span class="update-badge" v-if="updateStore.updateInfo.available"></span>
      </div>
      
      <button class="action-btn" @click="$emit('openFile')" title="打开文件 (Ctrl+O)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
      </button>
      <button class="action-btn" @click="$emit('openSettings')" title="设置 (Ctrl+,)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      </button>
      <div class="window-controls">
        <button class="window-btn minimize" @click="minimize">
          <svg width="10" height="10" viewBox="0 0 12 12">
            <rect x="1" y="5.5" width="10" height="1" fill="currentColor"/>
          </svg>
        </button>
        <button class="window-btn maximize" @click="toggleMaximize">
          <svg width="10" height="10" viewBox="0 0 12 12">
            <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/>
          </svg>
        </button>
        <button class="window-btn close" @click="close">
          <svg width="10" height="10" viewBox="0 0 12 12">
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1"/>
          </svg>
        </button>
      </div>
    </div>
    
    <UpdateMenu :isOpen="isUpdateMenuOpen" @close="isUpdateMenuOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUpdateStore } from '../stores/update'
import UpdateMenu from './UpdateMenu.vue'

const props = defineProps<{
  activeTab: string
}>()

const emit = defineEmits<{
  (e: 'changeTab', tabId: string): void
  (e: 'toggleSidebar'): void
  (e: 'openFile'): void
  (e: 'openSettings'): void
}>()

const updateStore = useUpdateStore()
const isUpdateMenuOpen = ref(false)

const tabs = [
  { id: 'files', label: '文件', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>' },
  { id: 'git', label: '源代码', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 009 9"/></svg>' },
  { id: 'mcp', label: 'MCP', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>' },
  { id: 'rules', label: '规则', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>' },
  { id: 'terminal', label: '终端', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4,17 10,11 4,5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>' },
  { id: 'skills', label: '技能', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' },
  { id: 'settings', label: '设置', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>' }
]

function toggleUpdateMenu() {
  isUpdateMenuOpen.value = !isUpdateMenuOpen.value
}

function minimize() {
  window.electron?.ipcRenderer.invoke('window:minimize')
}

function toggleMaximize() {
  window.electron?.ipcRenderer.invoke('window:toggle-maximize')
}

function close() {
  window.electron?.ipcRenderer.invoke('window:close')
}
</script>

<style scoped>
.titlebar {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  -webkit-app-region: drag;
  position: relative;
  z-index: 10;
  user-select: none;
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.nav-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: none;
  border: none;
  border-radius: 5px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.nav-tab:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-tab.active {
  background: var(--accent-muted);
  color: var(--accent-color);
}

.tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.titlebar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.titlebar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.update-trigger {
  position: relative;
}

.update-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: var(--accent-color);
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid var(--border-active);
}

.window-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.window-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.window-btn.close:hover {
  background: rgba(239, 68, 68, 0.8);
  color: #ffffff;
}
</style>
```

- [ ] **Step 2: Verify TitleBar compiles correctly**

Run: `npm run typecheck`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/TitleBar.vue
git commit -m "feat: add update icon and menu to TitleBar"
```

---

### Task 6: Modify StatusBar for Update Indicator

**Covers:** [S2, S4]

**Files:**
- Modify: `src/renderer/src/components/StatusBar.vue:22-41`

- [ ] **Step 1: Add update status indicator to StatusBar**

```vue
<template>
  <div class="status-bar">
    <div class="status-left">
      <span class="status-item" v-if="editorStore.activeFile">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
        {{ editorStore.activeFile.name }}
      </span>
    </div>
    <div class="status-center">
      <span class="status-item" v-if="gitBranch">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="18" r="3"/>
          <circle cx="6" cy="6" r="3"/>
          <path d="M6 21V9a9 9 0 009 9"/>
        </svg>
        {{ gitBranch }}
      </span>
    </div>
    <div class="status-right">
      <button class="status-btn" @click="handleUndo" title="撤销 AI 操作 (基于 Git)" :disabled="chatStore.isStreaming">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 10h10a5 5 0 015 5v2M3 10l5 5M3 10l5-5"/>
        </svg>
      </button>
      <button class="status-btn" @click="handleRedo" title="重做 AI 操作 (基于 Git)" :disabled="chatStore.isStreaming">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10H11a5 5 0 00-5 5v2M21 10l-5 5M21 10l-5-5"/>
        </svg>
      </button>
      <span class="status-item update-indicator" v-if="updateStore.updateInfo.available" title="有新版本可用">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        更新可用
      </span>
      <span class="status-item">UTF-8</span>
      <span class="status-item">LF</span>
      <span class="status-item" v-if="editorStore.activeFile">
        行 {{ cursorLine }}, 列 {{ cursorCol }}
      </span>
      <span class="status-item" v-if="editorStore.rootPath">
        {{ rootName }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useChatStore } from '../stores/chat'
import { useUpdateStore } from '../stores/update'

const editorStore = useEditorStore()
const chatStore = useChatStore()
const updateStore = useUpdateStore()

function handleUndo() {
  if (confirm('确定要撤销 AI 上次操作吗？此操作会基于 Git 回退更改。')) {
    chatStore.undo()
  }
}

function handleRedo() {
  if (confirm('确定要重做 AI 操作吗？此操作会重新应用之前的更改。')) {
    chatStore.redo()
  }
}
const gitBranch = ref('')
const cursorLine = ref(1)
const cursorCol = ref(1)

const rootName = computed(() => {
  if (!editorStore.rootPath) return ''
  return editorStore.rootPath.split(/[/\\]/).pop() || editorStore.rootPath
})

async function updateGitBranch() {
  if (!editorStore.rootPath) {
    gitBranch.value = ''
    return
  }

  try {
    const status = await window.mimo.git.status()
    gitBranch.value = status?.branch || ''
  } catch {
    gitBranch.value = ''
  }
}

watch(() => editorStore.rootPath, () => {
  updateGitBranch()
}, { immediate: true })

watch(() => editorStore.activeFileId, () => {
  cursorLine.value = 1
  cursorCol.value = 1
})

onMounted(() => {
  updateGitBranch()
})
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  padding: 0 12px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  font-size: 11px;
  color: var(--text-secondary);
}

.status-left,
.status-center,
.status-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.status-item svg {
  opacity: 0.7;
}

.update-indicator {
  color: var(--accent-color);
  cursor: pointer;
}

.update-indicator:hover {
  color: var(--accent-hover);
}

.status-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: none;
  border: none;
  color: var(--text-secondary);
  border-radius: 3px;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s;
}

.status-btn:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.status-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
```

- [ ] **Step 2: Verify StatusBar compiles correctly**

Run: `npm run typecheck`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/StatusBar.vue
git commit -m "feat: add update indicator to StatusBar"
```

---

### Task 7: Add Update Store to Pinia

**Covers:** [S5]

**Files:**
- Modify: `src/renderer/src/main.ts`

- [ ] **Step 1: Import and register update store**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useUpdateStore } from './stores/update'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize update store
const updateStore = useUpdateStore()

// Auto-check for updates on startup
setTimeout(async () => {
  try {
    const result = await window.mimo.update.check()
    if (result.available) {
      updateStore.setUpdateInfo({
        available: true,
        version: result.version,
        releaseDate: result.releaseDate,
        releaseNotes: result.releaseNotes
      })
    }
  } catch (err) {
    console.error('Failed to check for updates on startup:', err)
  }
}, 5000) // Check after 5 seconds

app.mount('#app')
```

- [ ] **Step 2: Verify main.ts compiles correctly**

Run: `npm run typecheck`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/main.ts
git commit -m "feat: add update store initialization and auto-check on startup"
```

---

### Task 8: Test Complete Update Flow

**Covers:** [S7]

**Files:**
- None (manual testing)

- [ ] **Step 1: Start development server**

Run: `npm run dev`
Expected: Application starts without errors

- [ ] **Step 2: Test manual update checking**

1. Click update icon in TitleBar
2. Verify UpdateMenu opens
3. Click "检查更新" button
4. Verify checking state is shown
5. Verify update status is displayed correctly

- [ ] **Step 3: Test update notification**

1. Verify update badge appears when update is available
2. Verify StatusBar shows update indicator
3. Verify update details are displayed correctly

- [ ] **Step 4: Test error handling**

1. Test with no network connection
2. Verify error message is displayed
3. Test retry functionality

- [ ] **Step 5: Commit final changes**

```bash
git add .
git commit -m "feat: complete update checking feature implementation"
```

---

## Self-Review

**1. Spec coverage:** ✅ All spec sections covered
- [S1] Problem - Task 1-8
- [S2] Solution overview - Task 5-6
- [S3] Architecture - Task 1-3
- [S4] Components - Task 4-6
- [S5] Data flow - Task 1, 7
- [S6] Error handling - Task 2, 4
- [S7] Testing - Task 8

**2. Placeholder scan:** ✅ No placeholders found

**3. Type consistency:** ✅ All types match across tasks