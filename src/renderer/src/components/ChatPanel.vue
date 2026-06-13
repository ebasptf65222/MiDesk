<template>
  <div class="chat-panel">
    <div class="chat-header">
      <div class="header-left">
        <span>AI 对话</span>
        <div class="mode-toggle">
          <button :class="{ active: chatStore.mode === 'plan' }" @click="chatStore.setMode('plan')" title="规划模式">
            规划
          </button>
          <button :class="{ active: chatStore.mode === 'act' }" @click="chatStore.setMode('act')" title="执行模式">
            执行
          </button>
        </div>
        <button class="icon-btn" @click="showSessions = !showSessions" title="会话列表">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </button>
      </div>
      <div class="header-actions">
        <button class="icon-btn" @click="saveSession" title="保存会话">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
          </svg>
        </button>
        <button class="icon-btn" @click="chatStore.clear()" title="清空对话">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Session List Dropdown -->
    <div class="session-list" v-if="showSessions">
      <div class="session-list-header">
        <span>历史会话</span>
        <button class="icon-btn" @click="showSessions = false">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="session-items">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          @click="loadSession(session.id)"
        >
          <span class="session-title">{{ session.title }}</span>
          <span class="session-time">{{ formatTime(session.updatedAt) }}</span>
          <button class="delete-btn" @click.stop="deleteSession(session.id)">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div v-if="sessions.length === 0" class="empty-sessions">
          暂无保存的会话
        </div>
      </div>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div v-if="chatStore.messages.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </div>
        <p>开始对话</p>
        <span>问我任何关于代码的问题</span>
      </div>

      <div
        v-for="msg in chatStore.messages"
        :key="msg.id"
        :class="['message', msg.role]"
      >
        <div class="message-avatar">
          <span v-if="msg.role === 'user'">U</span>
          <span v-else>M</span>
        </div>
        <div class="message-body">
          <template v-for="(part, idx) in msg.parts" :key="idx">
            <!-- Thinking block -->
            <div v-if="part.type === 'thinking'" class="thinking-block">
              <div class="thinking-header" @click="toggleThinking(idx)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                <span>思考过程</span>
                <svg :class="['chevron', { expanded: expandedThinkings.has(idx) }]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </div>
              <div v-if="expandedThinkings.has(idx)" class="thinking-content">
                {{ part.content }}
              </div>
            </div>

            <!-- Text block -->
            <div v-else-if="part.type === 'text'" class="text-content">
              <MarkdownRender
                :content="msg.accumulatedText"
                :max-live-nodes="0"
                :render-batch-size="16"
                :render-batch-delay="8"
                :final="!chatStore.isStreaming"
              />
            </div>

            <!-- Tool use block -->
            <div v-else-if="part.type === 'tool_use'" class="tool-block tool-use">
              <div class="tool-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                </svg>
                <span>工具调用</span>
              </div>
              <div class="tool-content">{{ formatToolUse(part.content) }}</div>
            </div>

            <!-- Tool result block -->
            <div v-else-if="part.type === 'tool_result'" class="tool-block tool-result">
              <div class="tool-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                <span>工具结果</span>
              </div>
              <div class="tool-content">{{ formatToolResult(part.content) }}</div>
            </div>
          </template>
        </div>
      </div>

      <div v-if="chatStore.isStreaming" class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>

    <div class="chat-input-area">
      <!-- Slash Command Menu -->
      <div class="slash-menu" v-if="showSlashMenu">
        <div
          v-for="(cmd, index) in filteredCommands"
          :key="cmd.name"
          :class="['slash-item', { active: index === selectedCommandIndex }]"
          @click="executeCommand(cmd)"
          @mouseenter="selectedCommandIndex = index"
        >
          <span class="cmd-name">{{ cmd.name }}</span>
          <span class="cmd-desc">{{ cmd.description }}</span>
        </div>
      </div>

      <div class="input-wrapper">
        <textarea
          ref="inputEl"
          v-model="inputText"
          :placeholder="chatStore.isStreaming ? 'AI 正在回复...' : '输入消息... (Enter 发送, / 命令)'"
          :disabled="chatStore.isStreaming"
          @keydown="handleKeydown"
          @input="handleInput"
          rows="1"
        ></textarea>
        <div class="input-actions">
          <button
            v-if="chatStore.isStreaming"
            class="stop-btn"
            @click="chatStore.stop()"
            title="停止回复"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>
          <button
            v-else
            class="send-btn"
            :disabled="!inputText.trim()"
            @click="handleSend"
            title="发送"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, computed } from 'vue'
import { useChatStore } from '../stores/chat'
import { useEditorStore } from '../stores/editor'
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'

interface Session {
  id: string
  title: string
  messages: Array<{ role: string; content: string; timestamp: number }>
  createdAt: number
  updatedAt: number
}

const chatStore = useChatStore()
const editorStore = useEditorStore()
const inputText = ref('')
const inputEl = ref<HTMLTextAreaElement>()
const messagesContainer = ref<HTMLDivElement>()
const showSessions = ref(false)
const sessions = ref<Session[]>([])
const currentSessionId = ref<string | null>(null)
const showSlashMenu = ref(false)
const selectedCommandIndex = ref(0)
const expandedThinkings = ref(new Set<number>())

const slashCommands = [
  { name: '/help', description: '显示帮助信息', action: 'help' },
  { name: '/clear', description: '清空当前对话', action: 'clear' },
  { name: '/model', description: '切换 AI 模型', action: 'model' },
  { name: '/save', description: '保存当前会话', action: 'save' },
  { name: '/export', description: '导出对话为 Markdown', action: 'export' },
  { name: '/stats', description: '查看 Token 统计', action: 'stats' },
  { name: '/plan', description: '创建实现计划 - 使用 compose:plan 技能', action: 'compose:plan' },
  { name: '/debug', description: '系统化调试 - 使用 compose:debug 技能', action: 'compose:debug' },
  { name: '/tdd', description: '测试驱动开发 - 使用 compose:tdd 技能', action: 'compose:tdd' },
  { name: '/execute', description: '执行实现计划 - 使用 compose:execute 技能', action: 'compose:execute' },
  { name: '/verify', description: '验证代码完成 - 使用 compose:verify 技能', action: 'compose:verify' },
  { name: '/brainstorm', description: '头脑风暴设计 - 使用 compose:brainstorm 技能', action: 'compose:brainstorm' },
  { name: '/review', description: '代码审查 - 使用 compose:review 技能', action: 'compose:review' },
  { name: '/subagent', description: '子代理执行 - 使用 compose:subagent 技能', action: 'compose:subagent' },
  { name: '/feedback', description: '处理代码反馈 - 使用 compose:feedback 技能', action: 'compose:feedback' }
]

const filteredCommands = ref(slashCommands)

function handleInput() {
  if (inputText.value.startsWith('/')) {
    const query = inputText.value.toLowerCase()
    filteredCommands.value = slashCommands.filter(cmd =>
      cmd.name.toLowerCase().includes(query)
    )
    showSlashMenu.value = filteredCommands.value.length > 0
    selectedCommandIndex.value = 0
  } else {
    showSlashMenu.value = false
  }
}

function executeCommand(cmd: typeof slashCommands[0]) {
  showSlashMenu.value = false
  inputText.value = ''

  if (cmd.action.startsWith('compose:')) {
    const skillName = cmd.action
    const skillPrompts: Record<string, string> = {
      'compose:plan': '请使用 compose:plan 技能。我需要为当前项目创建一个实现计划。请先了解项目结构和需求，然后生成一个详细的、可执行的实现计划。',
      'compose:debug': '请使用 compose:debug 技能。我遇到了一个 bug 或意外行为，请帮我系统化地调试，找到根本原因后再提出修复方案。',
      'compose:tdd': '请使用 compose:tdd 技能。我要开始测试驱动开发，请先帮我编写失败的测试用例，然后实现最小代码使其通过。',
      'compose:execute': '请使用 compose:execute 技能。我有一个实现计划需要执行，请帮我按照计划逐步实现，每个任务完成后进行验证。',
      'compose:verify': '请使用 compose:verify 技能。我需要验证代码是否正确完成，请帮我运行测试和检查，确认所有功能正常。',
      'compose:brainstorm': '请使用 compose:brainstorm 技能。我有一个新功能的想法，请帮我通过头脑风暴来探索需求和设计，逐步完善方案。',
      'compose:review': '请使用 compose:review 技能。请帮我审查当前代码，检查是否符合需求、是否有潜在问题、代码质量如何。',
      'compose:subagent': '请使用 compose:subagent 技能。请帮我将实现计划分解为独立任务，使用子代理并行执行来提高效率。',
      'compose:feedback': '请使用 compose:feedback 技能。我收到了代码审查反馈，请帮我分析反馈的技术合理性，然后决定如何处理。'
    }
    chatStore.send(skillPrompts[skillName] || `请使用 ${skillName} 技能。`)
    return
  }

  switch (cmd.action) {
    case 'clear':
      chatStore.clear()
      break
    case 'save':
      saveSession()
      break
    case 'help':
      chatStore.messages.push({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `## 可用命令\n\n### 基础命令\n${slashCommands.filter(c => !c.action.startsWith('compose:')).map(c => `- **${c.name}** - ${c.description}`).join('\n')}\n\n### Compose 技能命令\n${slashCommands.filter(c => c.action.startsWith('compose:')).map(c => `- **${c.name}** - ${c.description}`).join('\n')}`,
        timestamp: Date.now()
      })
      break
    case 'model':
      chatStore.messages.push({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: '当前模型: **MiMo Auto**\n\n可在设置中切换模型',
        timestamp: Date.now()
      })
      break
    case 'export':
      exportChat()
      break
    case 'stats':
      chatStore.messages.push({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `## 会话统计\n\n- 消息数量: ${chatStore.messages.length}\n- 当前会话: ${currentSessionId.value || '新会话'}`,
        timestamp: Date.now()
      })
      break
  }
}

function exportChat() {
  const content = chatStore.messages
    .map(m => `### ${m.role === 'user' ? '用户' : '助手'}\n\n${m.content}`)
    .join('\n\n---\n\n')

  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chat-export-${Date.now()}.md`
  a.click()
  URL.revokeObjectURL(url)
}

// Sync working directory to chat
watch(() => editorStore.rootPath, (newPath) => {
  if (newPath) {
    window.mimo.chat.setCwd(newPath)
  }
}, { immediate: true })

async function loadSessionList() {
  try {
    sessions.value = await window.mimo.sessions.list()
  } catch (err) {
    console.error('Failed to load sessions:', err)
  }
}

async function saveSession() {
  if (chatStore.messages.length === 0) return

  const title = chatStore.messages[0]?.content?.substring(0, 30) || '新会话'
  const session: Session = {
    id: currentSessionId.value || `session-${Date.now()}`,
    title,
    messages: chatStore.messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp
    })),
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  try {
    await window.mimo.sessions.save(session)
    currentSessionId.value = session.id
    await loadSessionList()
  } catch (err) {
    console.error('Failed to save session:', err)
  }
}

async function loadSession(id: string) {
  try {
    const session = await window.mimo.sessions.load(id)
    if (session) {
      chatStore.clear()
      session.messages.forEach(m => {
        chatStore.messages.push({
          id: `msg-${m.timestamp}`,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: m.timestamp
        })
      })
      currentSessionId.value = id
      showSessions.value = false
    }
  } catch (err) {
    console.error('Failed to load session:', err)
  }
}

async function deleteSession(id: string) {
  try {
    await window.mimo.sessions.delete(id)
    await loadSessionList()
  } catch (err) {
    console.error('Failed to delete session:', err)
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleDateString('zh-CN')
}

function toggleThinking(idx: number) {
  if (expandedThinkings.value.has(idx)) {
    expandedThinkings.value.delete(idx)
  } else {
    expandedThinkings.value.add(idx)
  }
}

function formatToolUse(content: string): string {
  try {
    const parsed = JSON.parse(content)
    return parsed.name || content
  } catch {
    return content
  }
}

function formatToolResult(content: string): string {
  try {
    const parsed = JSON.parse(content)
    return JSON.stringify(parsed, null, 2).substring(0, 500) + (parsed.length > 500 ? '...' : '')
  } catch {
    return content.substring(0, 500) + (content.length > 500 ? '...' : '')
  }
}

onMounted(() => {
  loadSessionList()
})

function handleKeydown(e: KeyboardEvent) {
  // Slash menu navigation
  if (showSlashMenu.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedCommandIndex.value = Math.min(
        selectedCommandIndex.value + 1,
        filteredCommands.value.length - 1
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedCommandIndex.value = Math.max(selectedCommandIndex.value - 1, 0)
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (filteredCommands.value[selectedCommandIndex.value]) {
        executeCommand(filteredCommands.value[selectedCommandIndex.value])
      }
      return
    } else if (e.key === 'Escape') {
      showSlashMenu.value = false
      return
    }
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleSend() {
  if (!inputText.value.trim()) return
  chatStore.send(inputText.value)
  inputText.value = ''
  nextTick(() => autoResize())
}

function autoResize() {
  if (!inputEl.value) return
  inputEl.value.style.height = 'auto'
  inputEl.value.style.height = Math.min(inputEl.value.scrollHeight, 150) + 'px'
}

watch(
  () => chatStore.messages.length,
  () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }
)

watch(inputText, () => nextTick(autoResize))
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e293b;
  position: relative;
}

.chat-header {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
  border-bottom: 1px solid #334155;
  color: #e2e8f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  color: #94a3b8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-toggle {
  display: flex;
  gap: 2px;
  background: #334155;
  border-radius: 6px;
  padding: 2px;
}

.mode-toggle button {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-toggle button.active {
  background: #6366f1;
  color: white;
}

.mode-toggle button:hover:not(.active) {
  color: #e2e8f0;
}

.icon-btn:hover {
  color: #e2e8f0;
  background: rgba(51, 65, 85, 0.5);
}

/* Session List */
.session-list {
  position: absolute;
  top: 44px;
  left: 0;
  right: 0;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  z-index: 10;
  max-height: 300px;
  display: flex;
  flex-direction: column;
}

.session-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  border-bottom: 1px solid #334155;
}

.session-items {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.1s;
}

.session-item:hover {
  background: rgba(51, 65, 85, 0.5);
}

.session-title {
  flex: 1;
  font-size: 12px;
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  font-size: 11px;
  color: #64748b;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  color: #64748b;
  border-radius: 3px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.1s;
}

.session-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.empty-sessions {
  padding: 20px;
  text-align: center;
  font-size: 12px;
  color: #64748b;
}

.clear-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.clear-btn:hover {
  color: #94a3b8;
  background: #334155;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.empty-icon {
  margin-bottom: 12px;
  color: #334155;
}

.empty-state p {
  font-size: 15px;
  color: #64748b;
  margin-bottom: 4px;
}

.empty-state span {
  font-size: 12px;
}

.message {
  display: flex;
  gap: 10px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 2px;
}

.message.user .message-avatar {
  background: #3b82f6;
  color: white;
}

.message.assistant .message-avatar {
  background: #8b5cf6;
  color: white;
}

.message-content {
  flex: 1;
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
  overflow-wrap: break-word;
}

.message-body {
  flex: 1;
  min-width: 0;
}

.thinking-block {
  margin-bottom: 8px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 6px;
  background: rgba(139, 92, 246, 0.05);
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 12px;
  color: #a78bfa;
  cursor: pointer;
  user-select: none;
}

.thinking-header:hover {
  background: rgba(139, 92, 246, 0.1);
}

.thinking-header svg {
  flex-shrink: 0;
}

.thinking-header span {
  flex: 1;
}

.chevron {
  transition: transform 0.2s;
}

.chevron.expanded {
  transform: rotate(180deg);
}

.thinking-content {
  padding: 0 12px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #94a3b8;
  white-space: pre-wrap;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
}

.text-content {
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
  overflow-wrap: break-word;
  width: 100%;
  min-width: 0;
}

.text-content :deep(.markdown-render) {
  width: 100%;
}

.tool-block {
  margin-bottom: 8px;
  border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 6px;
  background: rgba(71, 85, 105, 0.1);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: #94a3b8;
  border-bottom: 1px solid rgba(71, 85, 105, 0.2);
}

.tool-use .tool-header {
  color: #60a5fa;
}

.tool-result .tool-header {
  color: #34d399;
}

.tool-content {
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.4;
  color: #94a3b8;
  font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 150px;
  overflow-y: auto;
}

.text-content :deep(p) {
  margin: 0 0 8px;
}

.text-content :deep(p:last-child) {
  margin-bottom: 0;
}

.text-content :deep(pre) {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 12px;
  margin: 8px 0;
  overflow-x: auto;
}

.text-content :deep(code) {
  font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
  font-size: 12px;
}

.text-content :deep(:not(pre) > code) {
  background: #334155;
  padding: 2px 5px;
  border-radius: 3px;
}

.text-content :deep(ul),
.text-content :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.text-content :deep(li) {
  margin: 4px 0;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: #475569;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input-area {
  padding: 12px;
  border-top: 1px solid #334155;
  background: rgba(30, 41, 59, 0.6);
  position: relative;
}

/* Slash Command Menu */
.slash-menu {
  position: absolute;
  bottom: 100%;
  left: 12px;
  right: 12px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 20;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

.slash-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.1s;
}

.slash-item:hover,
.slash-item.active {
  background: rgba(59, 130, 246, 0.15);
}

.cmd-name {
  font-size: 13px;
  font-weight: 500;
  color: #60a5fa;
  min-width: 70px;
}

.cmd-desc {
  font-size: 12px;
  color: #94a3b8;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid #475569;
  border-radius: 10px;
  padding: 8px 12px;
  transition: border-color 0.15s;
}

.input-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.input-wrapper textarea {
  flex: 1;
  background: none;
  border: none;
  color: #e2e8f0;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  outline: none;
  font-family: inherit;
}

.input-wrapper textarea::placeholder {
  color: #64748b;
}

.input-wrapper textarea:disabled {
  opacity: 0.6;
}

.input-actions {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.send-btn,
.stop-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.send-btn {
  background: #3b82f6;
  color: white;
  font-weight: 500;
}

.send-btn:hover:not(:disabled) {
  background: #2563eb;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #475569;
}

.stop-btn {
  background: #ef4444;
  color: white;
  font-weight: 500;
}

.stop-btn:hover {
  background: #dc2626;
}
</style>
