<template>
  <div class="file-tree">
    <div class="tree-header">
      <span>文件管理</span>
      <button class="icon-btn" @click="refresh" title="刷新">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 4v6h-6M1 20v-6h6"/>
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
        </svg>
      </button>
    </div>

    <div class="tree-root" v-if="editorStore.rootPath">
      <div class="root-path" :title="editorStore.rootPath">
        {{ rootName }}
      </div>
    </div>
    <div class="tree-root" v-else>
      <button class="open-folder-btn" @click="openFolder">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        打开文件夹
      </button>
    </div>

    <div class="tree-content" v-if="editorStore.fileTree.length">
      <TreeNode
        v-for="entry in editorStore.fileTree"
        :key="entry.path"
        :entry="entry"
        :depth="0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../stores/editor'
import TreeNode from './TreeNode.vue'

const editorStore = useEditorStore()

const rootName = computed(() => {
  if (!editorStore.rootPath) return ''
  return editorStore.rootPath.split(/[/\\]/).pop() || editorStore.rootPath
})

async function openFolder() {
  const dirPath = await window.mimo.file.openDirectory()
  if (dirPath) {
    editorStore.setRootPath(dirPath)
  }
}

function refresh() {
  editorStore.refreshTree()
}
</script>

<style scoped>
.file-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e293b;
}

.tree-header {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  border-bottom: 1px solid #334155;
}

.icon-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.icon-btn:hover {
  color: #94a3b8;
  background: #334155;
}

.tree-root {
  padding: 8px 12px;
  border-bottom: 1px solid #334155;
}

.root-path {
  font-size: 12px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.open-folder-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: #0f172a;
  border: 1px dashed #334155;
  border-radius: 6px;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.open-folder-btn:hover {
  border-color: #3b82f6;
  color: #94a3b8;
  background: #1e293b;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.tree-content::-webkit-scrollbar {
  width: 4px;
}

.tree-content::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 2px;
}
</style>
