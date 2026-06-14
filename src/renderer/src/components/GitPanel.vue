<template>
  <div class="git-panel">
    <div class="git-header">
      <div class="branch-info" v-if="gitStatus">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="18" r="3"/>
          <circle cx="6" cy="6" r="3"/>
          <path d="M6 21V9a9 9 0 009 9"/>
        </svg>
        <span>{{ gitStatus.branch }}</span>
        <span v-if="gitStatus.isDirty" class="dirty-dot"></span>
      </div>
      <span v-else class="no-git">非 Git 仓库</span>
    </div>

    <div class="git-changes" v-if="gitStatus && gitStatus.files.length > 0">
      <div class="changes-header">
        <span>变更 ({{ gitStatus.files.length }})</span>
        <button class="commit-btn" @click="showCommitDialog = true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          提交
        </button>
      </div>
      <div class="file-list">
        <div
          v-for="file in gitStatus.files"
          :key="file.path"
          :class="['file-item', { selected: selectedFile === file.path }]"
          @click="handleFileClick(file.path)"
        >
          <span :class="['status-badge', file.status]">{{ file.status }}</span>
          <span class="file-path">{{ file.path }}</span>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else-if="gitStatus">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
      <span>工作区干净</span>
    </div>

    <!-- Commit Dialog -->
    <div class="commit-dialog" v-if="showCommitDialog">
      <div class="dialog-content">
        <h3>提交更改</h3>
        <textarea
          v-model="commitMessage"
          placeholder="输入提交信息..."
          rows="3"
        ></textarea>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="showCommitDialog = false">取消</button>
          <button class="confirm-btn" @click="handleCommit" :disabled="!commitMessage.trim()">
            提交
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useDiffStore } from '../stores/diff'

const emit = defineEmits<{
  (e: 'switch-tab', tab: string): void
}>()

interface GitFile {
  status: string
  path: string
}

interface GitStatus {
  branch: string
  isDirty: boolean
  files: GitFile[]
}

const editorStore = useEditorStore()
const diffStore = useDiffStore()
const gitStatus = ref<GitStatus | null>(null)
const showCommitDialog = ref(false)
const commitMessage = ref('')
const selectedFile = ref<string | null>(null)

async function refreshGitStatus() {
  if (!editorStore.rootPath) {
    gitStatus.value = null
    return
  }

  try {
    await window.mimo.git.setCwd(editorStore.rootPath)
    gitStatus.value = await window.mimo.git.status()
  } catch (err) {
    console.error('Failed to get git status:', err)
    gitStatus.value = null
  }
}

async function handleFileClick(filePath: string) {
  try {
    // Update selected file
    selectedFile.value = filePath
    
    // Get diff for the file
    const diffResult = await window.mimo.git.diff(filePath)
    
    if (diffResult && diffResult.original !== diffResult.modified) {
      // Add diff to store
      diffStore.addDiff(filePath, diffResult.original, diffResult.modified)
      
      // Switch to files tab to show diff
      emit('switch-tab', 'files')
    }
  } catch (err) {
    console.error('Failed to get diff:', err)
  }
}

async function handleCommit() {
  if (!commitMessage.value.trim()) return

  try {
    await window.mimo.git.commit(commitMessage.value)
    commitMessage.value = ''
    showCommitDialog.value = false
    await refreshGitStatus()
  } catch (err) {
    console.error('Failed to commit:', err)
  }
}

watch(() => editorStore.rootPath, () => {
  refreshGitStatus()
}, { immediate: true })

onMounted(() => {
  refreshGitStatus()
})
</script>

<style scoped>
.git-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e293b;
}

.git-header {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #334155;
}

.branch-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #e2e8f0;
}

.dirty-dot {
  width: 8px;
  height: 8px;
  background: #f59e0b;
  border-radius: 50%;
}

.no-git {
  font-size: 12px;
  color: #64748b;
}

.git-changes {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.changes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  border-bottom: 1px solid #334155;
}

.commit-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  color: #ffffff;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
}

.commit-btn:hover {
  background: #2563eb;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.file-item:hover {
  background: rgba(51, 65, 85, 0.5);
}

.file-item.selected {
  background: rgba(59, 130, 246, 0.2);
  border-left: 2px solid #3b82f6;
}

.status-badge {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.M {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.status-badge.A {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-badge.D {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.status-badge.?? {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
}

.file-path {
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
}

.commit-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog-content {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 20px;
  width: 400px;
  max-width: 90%;
}

.dialog-content h3 {
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 12px;
}

.dialog-content textarea {
  width: 100%;
  padding: 10px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
  resize: none;
  margin-bottom: 12px;
}

.dialog-content textarea:focus {
  border-color: #3b82f6;
  outline: none;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.cancel-btn {
  background: #334155;
  color: #e2e8f0;
}

.cancel-btn:hover {
  background: #475569;
}

.confirm-btn {
  background: #3b82f6;
  color: #ffffff;
}

.confirm-btn:hover:not(:disabled) {
  background: #2563eb;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
