<template>
  <div class="tree-node">
    <div
      class="node-row"
      :style="{ paddingLeft: depth * 12 + 8 + 'px' }"
      :class="{ active: isActive }"
      @click="handleClick"
    >
      <span v-if="entry.isDirectory" class="arrow" :class="{ open: isExpanded }">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5l8 7-8 7z"/>
        </svg>
      </span>
      <span v-else class="arrow-spacer"></span>

      <span class="icon" :class="iconClass">
        <svg v-if="entry.isDirectory" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
      </span>

      <span class="name" :title="entry.path">{{ entry.name }}</span>
    </div>

    <div v-if="entry.isDirectory && isExpanded" class="children">
      <TreeNode
        v-for="child in children"
        :key="child.path"
        :entry="child"
        :depth="depth + 1"
      />
      <div v-if="isLoading" class="loading" :style="{ paddingLeft: (depth + 1) * 12 + 8 + 'px' }">
        加载中...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore, type FileEntry } from '../stores/editor'

const props = defineProps<{
  entry: FileEntry
  depth: number
}>()

const editorStore = useEditorStore()
const isExpanded = ref(false)
const children = ref<FileEntry[]>([])
const isLoading = ref(false)

const isActive = computed(() => editorStore.activeFile?.path === props.entry.path)

const iconClass = computed(() => {
  if (props.entry.isDirectory) return 'folder'
  const ext = props.entry.name.split('.').pop()?.toLowerCase() || ''
  if (['js', 'ts', 'jsx', 'tsx', 'vue'].includes(ext)) return 'code'
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return 'config'
  if (['md', 'txt'].includes(ext)) return 'text'
  if (['css', 'scss', 'less'].includes(ext)) return 'style'
  return 'file'
})

async function handleClick() {
  if (props.entry.isDirectory) {
    if (isExpanded.value) {
      isExpanded.value = false
    } else {
      isExpanded.value = true
      if (children.value.length === 0) {
        isLoading.value = true
        try {
          children.value = await window.mimo.file.list(props.entry.path)
        } catch (err) {
          console.error('Failed to list directory:', err)
        } finally {
          isLoading.value = false
        }
      }
    }
  } else {
    editorStore.openFile(props.entry.path)
  }
}
</script>

<style scoped>
.node-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  cursor: pointer;
  border-radius: 4px;
  margin: 0 4px;
  transition: background 0.1s;
}

.node-row:hover {
  background: #334155;
}

.node-row.active {
  background: #334155;
}

.arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: #64748b;
  transition: transform 0.15s;
}

.arrow.open {
  transform: rotate(90deg);
}

.arrow-spacer {
  width: 16px;
  height: 16px;
}

.icon {
  display: flex;
  align-items: center;
  color: #64748b;
}

.icon.folder { color: #fbbf24; }
.icon.code { color: #34d399; }
.icon.config { color: #60a5fa; }
.icon.text { color: #94a3b8; }
.icon.style { color: #f472b6; }
.icon.file { color: #64748b; }

.name {
  font-size: 12px;
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading {
  font-size: 11px;
  color: #475569;
  padding: 4px 0;
}
</style>
