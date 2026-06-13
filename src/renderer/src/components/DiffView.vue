<template>
  <div class="diff-view" v-if="diffStore.activeDiff">
    <div class="diff-header">
      <div class="diff-tabs">
        <div
          v-for="diff in diffStore.activeDiffs"
          :key="diff.id"
          :class="['diff-tab', { active: diff.id === diffStore.activeDiffId }]"
          @click="diffStore.activeDiffId = diff.id"
        >
          <span class="tab-name" :title="diff.filePath">{{ fileName(diff.filePath) }}</span>
          <button class="tab-close" @click.stop="diffStore.removeDiff(diff.id)">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="diff-file-path">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>
      <span>{{ diffStore.activeDiff.filePath }}</span>
    </div>

    <div class="diff-stats">
      <span class="stat-added">+{{ addedLines }} 行</span>
      <span class="stat-removed">-{{ removedLines }} 行</span>
    </div>

    <div class="diff-content">
      <div
        v-for="(change, index) in diffStore.activeDiff.changes"
        :key="index"
        :class="['diff-line', change.type]"
      >
        <span class="line-prefix">{{ change.type === 'added' ? '+' : change.type === 'removed' ? '-' : ' ' }}</span>
        <span class="line-numbers">{{ change.lineStart }}-{{ change.lineEnd }}</span>
        <pre class="line-content">{{ change.content }}</pre>
      </div>
    </div>

    <div class="diff-actions">
      <button class="reject-btn" @click="handleReject">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        拒绝
      </button>
      <button class="accept-btn" @click="handleAccept">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
        接受全部
      </button>
    </div>
  </div>

  <div class="diff-empty" v-else-if="diffStore.hasPendingDiffs">
    <p>选择一个文件查看差异</p>
  </div>

  <div class="diff-empty" v-else>
    <div class="empty-content">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/>
        <circle cx="12" cy="12" r="4"/>
      </svg>
      <p>暂无代码变更</p>
      <span>当 AI 建议修改文件时，差异将显示在这里</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDiffStore } from '../stores/diff'

const diffStore = useDiffStore()

const addedLines = computed(() => {
  if (!diffStore.activeDiff) return 0
  return diffStore.activeDiff.changes
    .filter(c => c.type === 'added')
    .reduce((sum, c) => sum + (c.lineEnd - c.lineStart + 1), 0)
})

const removedLines = computed(() => {
  if (!diffStore.activeDiff) return 0
  return diffStore.activeDiff.changes
    .filter(c => c.type === 'removed')
    .reduce((sum, c) => sum + (c.lineEnd - c.lineStart + 1), 0)
})

function fileName(path: string): string {
  return path.split(/[/\\]/).pop() || path
}

function handleAccept() {
  const result = diffStore.acceptDiff(diffStore.activeDiffId!)
  if (result) {
    // Emit event or call file write
    window.mimo.file.write(diffStore.activeDiff?.filePath || '', result)
  }
}

function handleReject() {
  diffStore.rejectDiff(diffStore.activeDiffId!)
}
</script>

<style scoped>
.diff-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0f172a;
}

.diff-header {
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.diff-tabs {
  display: flex;
  overflow-x: auto;
}

.diff-tabs::-webkit-scrollbar {
  height: 0;
}

.diff-tab {
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

.diff-tab:hover {
  background: #334155;
}

.diff-tab.active {
  background: #0f172a;
  color: #e2e8f0;
  border-bottom: 2px solid #3b82f6;
}

.tab-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  background: none;
  border: none;
  color: #64748b;
  border-radius: 3px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.1s;
}

.diff-tab:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: #475569;
  color: #e2e8f0;
}

.diff-file-path {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 12px;
  color: #94a3b8;
  border-bottom: 1px solid #1e293b;
}

.diff-stats {
  display: flex;
  gap: 12px;
  padding: 8px 16px;
  font-size: 12px;
  border-bottom: 1px solid #1e293b;
}

.stat-added {
  color: #34d399;
}

.stat-removed {
  color: #f87171;
}

.diff-content {
  flex: 1;
  overflow-y: auto;
  font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 20px;
}

.diff-line {
  display: flex;
  padding: 0 12px;
  border-left: 3px solid transparent;
}

.diff-line.added {
  background: rgba(52, 211, 153, 0.1);
  border-left-color: #34d399;
}

.diff-line.removed {
  background: rgba(248, 113, 113, 0.1);
  border-left-color: #f87171;
}

.diff-line.unchanged {
  color: #475569;
}

.line-prefix {
  width: 16px;
  text-align: center;
  color: #475569;
  user-select: none;
}

.diff-line.added .line-prefix { color: #34d399; }
.diff-line.removed .line-prefix { color: #f87171; }

.line-numbers {
  width: 80px;
  color: #475569;
  text-align: right;
  padding-right: 12px;
  user-select: none;
}

.line-content {
  flex: 1;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: #e2e8f0;
}

.diff-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: #1e293b;
  border-top: 1px solid #334155;
}

.reject-btn,
.accept-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.reject-btn {
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
  border: 1px solid rgba(71, 85, 105, 0.5);
}

.reject-btn:hover {
  background: rgba(71, 85, 105, 0.9);
  color: #ffffff;
}

.accept-btn {
  background: #3b82f6;
  color: #ffffff;
}

.accept-btn:hover {
  background: #2563eb;
}

.diff-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
  color: #475569;
}

.empty-icon {
  margin-bottom: 12px;
  color: #334155;
}

.empty-content p {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 4px;
}

.empty-content span {
  font-size: 12px;
}
</style>
