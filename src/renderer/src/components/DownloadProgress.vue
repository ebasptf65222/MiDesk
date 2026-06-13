<template>
  <div class="download-overlay" v-if="isDownloading">
    <div class="download-modal">
      <div class="download-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <h3>Downloading MiMo CLI</h3>
      </div>
      <div class="download-content">
        <p>Downloading MiMo Code CLI component...</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress.percentage}%` }"></div>
        </div>
        <div class="progress-info">
          <span>{{ formatSize(progress.loaded) }} / {{ formatSize(progress.total) }}</span>
          <span>{{ progress.percentage }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isDownloading = ref(false)
const progress = ref({ loaded: 0, total: 0, percentage: 0 })

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

onMounted(async () => {
  const status = await window.mimo.download.status()
  if (!status.isDownloaded && status.downloadUrl) {
    isDownloading.value = true
    const unsubscribe = window.mimo.download.onProgress((p) => {
      progress.value = p
    })
    
    await window.mimo.download.start()
    
    isDownloading.value = false
    unsubscribe()
  }
})
</script>

<style scoped>
.download-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.download-modal {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.download-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.download-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.download-content p {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.progress-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-muted);
}
</style>