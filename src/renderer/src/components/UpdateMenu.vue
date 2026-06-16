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
