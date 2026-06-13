<template>
  <div class="tab-bar" v-if="editorStore.openFiles.length">
    <div
      v-for="file in editorStore.openFiles"
      :key="file.id"
      :class="['tab', { active: file.id === editorStore.activeFileId }]"
      @click="editorStore.activeFileId = file.id"
    >
      <span class="tab-name" :title="file.path">{{ file.name }}</span>
      <span v-if="file.isModified" class="modified-dot"></span>
      <button class="close-btn" @click.stop="editorStore.closeFile(file.id)">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '../stores/editor'

const editorStore = useEditorStore()
</script>

<style scoped>
.tab-bar {
  display: flex;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  overflow-x: auto;
}

.tab-bar::-webkit-scrollbar {
  height: 0;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 12px;
  color: #94a3b8;
  border-right: 1px solid #334155;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.1s;
}

.tab:hover {
  background: #334155;
}

.tab.active {
  background: #0f172a;
  color: #e2e8f0;
  border-bottom: 2px solid #3b82f6;
}

.tab-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modified-dot {
  width: 6px;
  height: 6px;
  background: #f59e0b;
  border-radius: 50%;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: none;
  border: none;
  color: #64748b;
  border-radius: 3px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.1s;
}

.tab:hover .close-btn {
  opacity: 1;
}

.close-btn:hover {
  background: #475569;
  color: #e2e8f0;
}
</style>
