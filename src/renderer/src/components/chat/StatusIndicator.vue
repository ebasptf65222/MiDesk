<template>
  <div class="status-indicator" :class="status">
    <div v-if="status === 'pending'" class="indicator pending">
      <div class="dot"></div>
      <span>等待中</span>
    </div>
    <div v-else-if="status === 'running'" class="indicator running">
      <div class="spinner"></div>
      <span>执行中</span>
    </div>
    <div v-else-if="status === 'success'" class="indicator success">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
      <span>完成</span>
    </div>
    <div v-else-if="status === 'error'" class="indicator error">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <span>错误</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  status: 'pending' | 'running' | 'success' | 'error'
}>()
</script>

<style scoped>
.status-indicator {
  display: flex;
  align-items: center;
}

.indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #9ca3af;
}

.indicator.pending .dot {
  width: 6px;
  height: 6px;
  background: #fbbf24;
  border-radius: 50%;
}

.indicator.running .spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #374151;
  border-top-color: #60a5fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.indicator.success {
  color: #34d399;
}

.indicator.error {
  color: #f87171;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
