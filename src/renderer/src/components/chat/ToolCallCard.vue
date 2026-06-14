<template>
  <div class="tool-call-card" :class="{ collapsed: isCollapsed }">
    <div class="card-header" @click="toggleCollapse">
      <div class="header-left">
        <svg class="tool-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
        <span class="tool-name">{{ toolName }}</span>
        <span v-if="status === 'running'" class="status-badge running">执行中</span>
        <span v-else-if="status === 'success'" class="status-badge success">完成</span>
        <span v-else-if="status === 'error'" class="status-badge error">错误</span>
      </div>
      <div class="header-right">
        <StatusIndicator :status="status" />
        <svg :class="['chevron', { collapsed: isCollapsed }]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </div>
    </div>
    <div v-if="!isCollapsed" class="card-content">
      <div class="args-section">
        <div class="section-label">参数</div>
        <pre class="args-content"><code>{{ formattedArgs }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import StatusIndicator from './StatusIndicator.vue'

const props = defineProps<{
  name: string
  args: Record<string, unknown>
  status: 'pending' | 'running' | 'success' | 'error'
}>()

const isCollapsed = ref(true)

const toolName = computed(() => {
  return props.name || '未知工具'
})

const formattedArgs = computed(() => {
  try {
    return JSON.stringify(props.args, null, 2)
  } catch {
    return String(props.args)
  }
})

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.tool-call-card {
  border: 1px solid #374151;
  border-radius: 8px;
  background: #1f2937;
  margin: 8px 0;
  overflow: hidden;
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

.tool-icon {
  color: #60a5fa;
}

.tool-name {
  font-weight: 500;
  color: #e5e7eb;
}

.status-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.status-badge.running {
  background: #1e40af;
  color: #93c5fd;
}

.status-badge.success {
  background: #065f46;
  color: #6ee7b7;
}

.status-badge.error {
  background: #991b1b;
  color: #fca5a5;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
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

.section-label {
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.args-content {
  background: #111827;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #d1d5db;
  margin: 0;
}
</style>
