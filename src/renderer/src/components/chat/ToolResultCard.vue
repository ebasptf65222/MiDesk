<template>
  <div class="tool-result-card" :class="{ collapsed: isCollapsed, error: hasError }">
    <div class="card-header" @click="toggleCollapse">
      <div class="header-left">
        <svg v-if="!hasError" class="result-icon success" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22,4 12,14.01 9,11.01"/>
        </svg>
        <svg v-else class="result-icon error" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span class="result-label">{{ hasError ? '错误结果' : '工具结果' }}</span>
      </div>
      <div class="header-right">
        <button v-if="hasError" class="retry-btn" @click.stop="$emit('retry')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23,4 23,10 17,10"/>
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
          重试
        </button>
        <svg :class="['chevron', { collapsed: isCollapsed }]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </div>
    </div>
    <div v-if="!isCollapsed" class="card-content">
      <div v-if="hasError" class="error-section">
        <div class="error-message">{{ errorMessage }}</div>
      </div>
      <div v-else class="result-section">
        <pre class="result-content"><code>{{ formattedResult }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  content: string
  isError?: boolean
}>()

defineEmits<{
  retry: []
}>()

const isCollapsed = ref(true)

const hasError = computed(() => props.isError || false)

const errorMessage = computed(() => {
  try {
    const parsed = JSON.parse(props.content)
    return parsed.error || parsed.message || props.content
  } catch {
    return props.content
  }
})

const formattedResult = computed(() => {
  try {
    const parsed = JSON.parse(props.content)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return props.content
  }
})

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.tool-result-card {
  border: 1px solid #374151;
  border-radius: 8px;
  background: #1f2937;
  margin: 8px 0;
  overflow: hidden;
}

.tool-result-card.error {
  border-color: #991b1b;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  background: #111827;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-icon.success {
  color: #34d399;
}

.result-icon.error {
  color: #f87171;
}

.result-label {
  font-weight: 500;
  color: #e5e7eb;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid #4b5563;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #374151;
  color: #e5e7eb;
}

.chevron {
  transition: transform 0.2s;
  color: #9ca3af;
}

.chevron.collapsed {
  transform: rotate(-90deg);
}

.card-content {
  padding: 12px;
  border-top: 1px solid #374151;
}

.error-section {
  background: #991b1b;
  padding: 8px;
  border-radius: 4px;
}

.error-message {
  color: #fca5a5;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

.result-section {
  background: #111827;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

.result-content {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #d1d5db;
  margin: 0;
}
</style>
