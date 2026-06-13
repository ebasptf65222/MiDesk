<template>
  <div class="rules-panel">
    <div class="page-header">
      <h1 class="page-title">规则与记忆</h1>
    </div>

    <div class="tabs">
      <button :class="['tab', { active: activeTab === 'project' }]" @click="activeTab = 'project'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        项目规则
      </button>
      <button :class="['tab', { active: activeTab === 'global' }]" @click="activeTab = 'global'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
        </svg>
        全局规则
      </button>
    </div>

    <!-- Project Rules Tab -->
    <div v-if="activeTab === 'project'" class="tab-content">
      <div class="content-card">
        <div class="card-header">
          <div class="card-title-section">
            <h2 class="card-title">项目规则管理</h2>
            <p class="card-desc">在项目根目录创建规则文件来定制 AI 行为。支持的文件格式：</p>
            <div class="file-tags">
              <span class="file-tag">.mimorules</span>
              <span class="file-tag">.clinerules</span>
              <span class="file-tag">.cursorrules</span>
            </div>
          </div>
          <button class="add-btn" @click="createRule" v-if="rulesStore.projectRules.length > 0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            新建
          </button>
        </div>

        <!-- Rule List -->
        <div class="rule-list" v-if="rulesStore.projectRules.length > 0">
          <div v-for="rule in rulesStore.projectRules" :key="rule.id" class="rule-item" @click="editRule(rule)">
            <div class="rule-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div class="rule-info">
              <span class="rule-name">{{ rule.name }}</span>
              <span class="rule-meta">{{ rule.content.length }} 字符</span>
            </div>
            <svg class="rule-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <p>暂无项目规则文件</p>
          <button class="btn-text" @click="createRule">创建规则文件</button>
        </div>
      </div>
    </div>

    <!-- Global Rules Tab -->
    <div v-if="activeTab === 'global'" class="tab-content">
      <div class="content-card">
        <div class="card-header">
          <div class="card-title-section">
            <h2 class="card-title">全局规则</h2>
            <p class="card-desc">这些规则会应用到所有项目。</p>
          </div>
        </div>
        <div class="editor-area">
          <textarea
            v-model="globalRulesContent"
            placeholder="# 全局规则&#10;&#10;在这里输入适用于所有项目的规则...&#10;&#10;例如：&#10;- 使用 TypeScript strict 模式&#10;- 优先使用函数式编程&#10;- 所有函数必须有类型注解"
            rows="20"
          ></textarea>
        </div>
        <div class="editor-footer">
          <span class="char-count">{{ globalRulesContent.length }} 字符</span>
          <button class="save-btn" @click="saveGlobal" :disabled="!hasGlobalChanges">
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="editingRule" @click.self="editingRule = null">
        <div class="modal modal-large">
          <div class="modal-header">
            <h3>{{ editingRule.name }}</h3>
            <button class="modal-close" @click="editingRule = null">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <textarea v-model="editingContent" rows="22" placeholder="输入规则内容..."></textarea>
          </div>
          <div class="modal-footer">
            <span class="char-count">{{ editingContent.length }} 字符</span>
            <div class="footer-actions">
              <button class="btn-cancel" @click="editingRule = null">取消</button>
              <button class="btn-confirm" @click="saveRule">保存</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRulesStore } from '../stores/rules'
import { useEditorStore } from '../stores/editor'

const rulesStore = useRulesStore()
const editorStore = useEditorStore()
const activeTab = ref('project')
const globalRulesContent = ref('')
const originalGlobalRules = ref('')
const editingRule = ref<any>(null)
const editingContent = ref('')

const hasGlobalChanges = computed(() => {
  return globalRulesContent.value !== originalGlobalRules.value
})

onMounted(async () => {
  if (editorStore.rootPath) {
    await rulesStore.loadRules(editorStore.rootPath)
  }
  globalRulesContent.value = rulesStore.globalRules
  originalGlobalRules.value = rulesStore.globalRules
})

function editRule(rule: any) {
  editingRule.value = rule
  editingContent.value = rule.content
}

async function saveRule() {
  if (editingRule.value) {
    await rulesStore.saveRule(editingRule.value.name, editingContent.value)
    editingRule.value = null
  }
}

async function saveGlobal() {
  await rulesStore.saveGlobalRules(globalRulesContent.value)
  originalGlobalRules.value = globalRulesContent.value
}

function createRule() {
  editingRule.value = { name: '.mimorules', content: '' }
  editingContent.value = ''
}
</script>

<style scoped>
.rules-panel {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0;
  letter-spacing: -0.02em;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid #27272a;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #71717a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -1px;
}

.tab:hover {
  color: #e4e4e7;
}

.tab.active {
  color: #fafafa;
  border-bottom-color: #fafafa;
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.content-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid #27272a;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #fafafa;
  margin: 0 0 4px 0;
}

.card-desc {
  font-size: 13px;
  color: #71717a;
  margin: 0 0 12px 0;
}

.file-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.file-tag {
  padding: 4px 10px;
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  color: #a1a1aa;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #fafafa;
  border: none;
  border-radius: 8px;
  color: #18181b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.add-btn:hover {
  background: #e4e4e7;
}

.rule-list {
  padding: 8px 0;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 24px;
  cursor: pointer;
  transition: background 0.15s;
}

.rule-item:hover {
  background: #1f1f23;
}

.rule-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #27272a;
  border-radius: 8px;
  color: #a1a1aa;
  flex-shrink: 0;
}

.rule-info {
  flex: 1;
  min-width: 0;
}

.rule-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #e4e4e7;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  margin-bottom: 2px;
}

.rule-meta {
  font-size: 12px;
  color: #52525b;
}

.rule-arrow {
  color: #3f3f46;
  flex-shrink: 0;
}

.empty-state {
  padding: 48px 24px;
  text-align: center;
  color: #52525b;
  font-size: 14px;
}

.btn-text {
  background: none;
  border: none;
  color: #fafafa;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.btn-text:hover {
  color: #d4d4d8;
}

.editor-area {
  padding: 0;
}

.editor-area textarea {
  width: 100%;
  padding: 20px 24px;
  background: transparent;
  border: none;
  color: #e4e4e7;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 1.7;
  resize: none;
  box-sizing: border-box;
}

.editor-area textarea:focus {
  outline: none;
}

.editor-area textarea::placeholder {
  color: #3f3f46;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-top: 1px solid #27272a;
}

.char-count {
  font-size: 12px;
  color: #52525b;
}

.save-btn {
  padding: 8px 16px;
  background: #fafafa;
  border: none;
  border-radius: 8px;
  color: #18181b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #e4e4e7;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  width: 480px;
  max-width: 90vw;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
}

.modal-large {
  width: 640px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #27272a;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fafafa;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  color: #71717a;
  border-radius: 6px;
  cursor: pointer;
}

.modal-close:hover {
  background: #27272a;
  color: #fafafa;
}

.modal-body {
  flex: 1;
  padding: 24px;
  overflow: hidden;
}

.modal-body textarea {
  width: 100%;
  min-height: 400px;
  padding: 16px;
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  color: #e4e4e7;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 1.7;
  resize: vertical;
  box-sizing: border-box;
}

.modal-body textarea:focus {
  outline: none;
  border-color: #3f3f46;
}

.modal-body textarea::placeholder {
  color: #3f3f46;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #27272a;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel {
  padding: 8px 16px;
  background: #27272a;
  border: 1px solid #3f3f46;
  border-radius: 8px;
  color: #a1a1aa;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #3f3f46;
  color: #fafafa;
}

.btn-confirm {
  padding: 8px 16px;
  background: #fafafa;
  border: none;
  border-radius: 8px;
  color: #18181b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover {
  background: #e4e4e7;
}
</style>
