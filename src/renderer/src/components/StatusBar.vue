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

const editorStore = useEditorStore()
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
  background: #1e293b;
  border-top: 1px solid #334155;
  font-size: 11px;
  color: #94a3b8;
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
</style>
