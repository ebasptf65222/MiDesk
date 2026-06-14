<template>
  <div class="error-card">
    <div class="error-header">
      <svg class="error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span class="error-title">错误</span>
    </div>
    <div class="error-content">
      <div class="error-message">{{ message }}</div>
      <div v-if="details" class="error-details">
        <pre>{{ details }}</pre>
      </div>
    </div>
    <div class="error-actions">
      <button class="retry-btn" @click="$emit('retry')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23,4 23,10 17,10"/>
          <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
        </svg>
        重试
      </button>
      <button class="dismiss-btn" @click="$emit('dismiss')">忽略</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  details?: string
}>()

defineEmits<{
  retry: []
  dismiss: []
}>()
</script>

<style scoped>
.error-card {
  background: #7f1d1d;
  border: 1px solid #991b1b;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.error-icon {
  color: #f87171;
}

.error-title {
  font-weight: 600;
  color: #fca5a5;
}

.error-content {
  margin-bottom: 12px;
}

.error-message {
  color: #fecaca;
  font-size: 14px;
}

.error-details {
  margin-top: 8px;
  background: #450a0a;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

.error-details pre {
  color: #fca5a5;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  margin: 0;
}

.error-actions {
  display: flex;
  gap: 8px;
}

.retry-btn, .dismiss-btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #991b1b;
  border: 1px solid #b91c1c;
  color: #fecaca;
}

.retry-btn:hover {
  background: #b91c1c;
}

.dismiss-btn {
  background: transparent;
  border: 1px solid #7f1d1d;
  color: #fca5a5;
}

.dismiss-btn:hover {
  background: #450a0a;
}
</style>
