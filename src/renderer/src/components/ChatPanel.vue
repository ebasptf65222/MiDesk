<template>
  <div class="chat-panel">
    <div class="chat-header">
      <div class="header-left">
        <span>AI 对话</span>
        <div class="mode-toggle">
          <button :class="{ active: chatStore.mode === 'build' }" @click="chatStore.setMode('build')" title="Build 模式 - 完整工具权限">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
            </svg>
            Build
          </button>
          <button :class="{ active: chatStore.mode === 'plan' }" @click="chatStore.setMode('plan')" title="Plan 模式 - 只读分析">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Plan
          </button>
          <button :class="{ active: chatStore.mode === 'compose' }" @click="chatStore.setMode('compose')" title="Compose 模式 - 技能编排">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Compose
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
        <button class="icon-btn" @click="exportChat" title="导出会话">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button class="icon-btn" @click="importChat" title="导入会话">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
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
          <button class="fork-btn" @click.stop="forkSession(session.id)" title="分叉会话">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="18" r="3"/>
              <circle cx="6" cy="6" r="3"/>
              <path d="M6 21V9a9 9 0 009 9"/>
            </svg>
          </button>
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

    <MessageList
      :messages="chatStore.messages"
      :is-streaming="chatStore.isStreaming"
      :show-thinking="showThinking"
      @retry="handleRetry"
      @dismiss="handleDismiss"
    />

    <ConfirmationBar />

    <div
      class="chat-input-area"
      @dragenter="handleDragEnter"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      :class="{ dragging: isDragging }"
    >
      <!-- Pending Images Preview -->
      <div class="pending-images" v-if="pendingImages.length > 0">
        <div v-for="(img, index) in pendingImages" :key="index" class="pending-image">
          <img :src="img.preview" :alt="img.name" />
          <button class="remove-image" @click="removePendingImage(index)">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Drag Overlay -->
      <div class="drag-overlay" v-if="isDragging">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17,8 12,3 7,8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span>拖放图片到这里</span>
      </div>

      <!-- File Reference Menu -->
      <div class="file-menu" v-if="showFileMenu">
        <div class="file-menu-header">
          <span>选择文件引用</span>
          <button class="icon-btn" @click="showFileMenu = false">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="file-menu-items">
          <div
            v-for="(file, index) in fileSearchResults"
            :key="file.path"
            :class="['file-item', { active: index === selectedFileIndex }]"
            @click="selectFile(file)"
            @mouseenter="selectedFileIndex = index"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            <span class="file-name">{{ file.name }}</span>
            <span class="file-path">{{ file.path.replace(editorStore.rootPath, '').replace(/^[/\\]/, '') }}</span>
          </div>
          <div v-if="fileSearchResults.length === 0 && !fileSearchLoading" class="file-menu-empty">
            未找到匹配文件
          </div>
          <div v-if="fileSearchLoading" class="file-menu-loading">
            搜索中...
          </div>
        </div>
      </div>

      <!-- Binary File Warning -->
      <div class="binary-warning-toast" v-if="showBinaryWarning">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>此文件是二进制文件，无法作为文本引用插入</span>
      </div>

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
            :disabled="!inputText.trim() && pendingImages.length === 0"
            @click="handleSendWithImages"
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
import MessageList from './chat/MessageList.vue'
import ConfirmationBar from './chat/ConfirmationBar.vue'
import type { MessagePart } from '../types/chat'

interface Session {
  id: string
  title: string
  messages: Array<{ role: string; content: string; timestamp: number }>
  createdAt: number
  updatedAt: number
}

interface SlashCommand {
  name: string
  description: string
  action: string
}

interface CustomCommand {
  name: string
  description: string
  template: string
  agent?: string
  model?: string
}

const chatStore = useChatStore()
const editorStore = useEditorStore()
const inputText = ref('')
const inputEl = ref<HTMLTextAreaElement>()
const showSessions = ref(false)
const sessions = ref<Session[]>([])
const currentSessionId = ref<string | null>(null)
const showSlashMenu = ref(false)
const selectedCommandIndex = ref(0)
const customCommands = ref<CustomCommand[]>([])

// @ file reference state
const showFileMenu = ref(false)
const fileSearchQuery = ref('')
const fileSearchResults = ref<Array<{ name: string; path: string; isDirectory: boolean }>>([])
const selectedFileIndex = ref(0)
const fileSearchLoading = ref(false)
const showBinaryWarning = ref(false)
let binaryWarningTimer: ReturnType<typeof setTimeout> | null = null
let fileSearchDebounce: ReturnType<typeof setTimeout> | null = null

// Image drag & drop state
const isDragging = ref(false)
const pendingImages = ref<Array<{ name: string; data: string; preview: string }>>([])

// Display toggles
const showThinking = ref(true)
const showToolDetails = ref(false)

const builtInCommands: SlashCommand[] = [
  { name: '/help', description: '显示帮助信息', action: 'help' },
  { name: '/new', description: '开始新会话', action: 'new' },
  { name: '/clear', description: '清空当前对话', action: 'clear' },
  { name: '/undo', description: '撤销上次操作 (基于 Git)', action: 'undo' },
  { name: '/redo', description: '重做上次撤销的操作', action: 'redo' },
  { name: '/model', description: '切换 AI 模型', action: 'model' },
  { name: '/save', description: '保存当前会话', action: 'save' },
  { name: '/export', description: '导出对话为 Markdown', action: 'export' },
  { name: '/stats', description: '查看 Token 统计', action: 'stats' },
  { name: '/compact', description: '压缩会话上下文', action: 'compact' },
  { name: '/thinking', description: '切换思考块显示/隐藏', action: 'thinking' },
  { name: '/details', description: '切换工具执行详情显示', action: 'details' },
  { name: '/sessions', description: '列出并切换会话', action: 'sessions' },
  { name: '/themes', description: '切换主题', action: 'themes' },
  { name: '/init', description: '创建 AGENTS.md 规则文件', action: 'init' },
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

const slashCommands = computed<SlashCommand[]>(() => {
  const custom = customCommands.value.map(cmd => ({
    name: `/${cmd.name}`,
    description: cmd.description || '自定义命令',
    action: `custom:${cmd.name}`
  }))
  return [...builtInCommands, ...custom]
})

const filteredCommands = ref<SlashCommand[]>([])

function handleInput() {
  const text = inputText.value

  // Check for @ file reference
  const atIndex = text.lastIndexOf('@')
  if (atIndex >= 0 && (atIndex === 0 || text[atIndex - 1] === ' ')) {
    const query = text.substring(atIndex + 1)
    if (!query.includes(' ') || query.length < 30) {
      fileSearchQuery.value = query
      showFileMenu.value = true
      showSlashMenu.value = false
      searchFiles(query)
      return
    }
  }
  showFileMenu.value = false

  // Check for slash commands
  if (text.startsWith('/')) {
    const query = text.toLowerCase()
    filteredCommands.value = slashCommands.value.filter(cmd =>
      cmd.name.toLowerCase().includes(query)
    )
    showSlashMenu.value = filteredCommands.value.length > 0
    selectedCommandIndex.value = 0
  } else {
    showSlashMenu.value = false
  }
}

async function searchFiles(query: string) {
  if (!editorStore.rootPath) {
    fileSearchResults.value = []
    return
  }

  fileSearchLoading.value = true
  try {
    const results = await window.mimo.file.search(editorStore.rootPath, query || '.')
    fileSearchResults.value = results.slice(0, 10)
    selectedFileIndex.value = 0
  } catch (err) {
    console.error('File search error:', err)
    fileSearchResults.value = []
  } finally {
    fileSearchLoading.value = false
  }
}

async function selectFile(file: { name: string; path: string }) {
  try {
    const result = await window.mimo.file.read(file.path)
    if (result.isBinary) {
      // 显示二进制文件警告
      showBinaryWarning.value = true
      if (binaryWarningTimer) clearTimeout(binaryWarningTimer)
      binaryWarningTimer = setTimeout(() => {
        showBinaryWarning.value = false
      }, 3000)
      return
    }
    const relativePath = file.path.replace(editorStore.rootPath, '').replace(/^[/\\]/, '')

    // Replace @query with formatted file reference
    const atIndex = inputText.value.lastIndexOf('@')
    if (atIndex >= 0) {
      const before = inputText.value.substring(0, atIndex)
      inputText.value = `${before}@${relativePath}\n\`\`\`\n${result.content}\n\`\`\`\n`
    }

    showFileMenu.value = false
    fileSearchQuery.value = ''
    nextTick(() => {
      inputEl.value?.focus()
      autoResize()
    })
  } catch (err) {
    console.error('Failed to read file:', err)
  }
}

function executeCommand(cmd: SlashCommand) {
  showSlashMenu.value = false
  inputText.value = ''

  if (cmd.action.startsWith('custom:')) {
    const commandName = cmd.action.substring(7)
    const customCmd = customCommands.value.find(c => c.name === commandName)
    if (customCmd) {
      chatStore.send(customCmd.template)
    }
    return
  }

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
    case 'new':
    case 'clear':
      chatStore.clear()
      currentSessionId.value = null
      break
    case 'undo':
      chatStore.undo()
      break
    case 'redo':
      chatStore.redo()
      break
    case 'compact':
      chatStore.send('请压缩当前会话上下文，保留关键信息，删除冗余的历史消息。')
      break
    case 'save':
      saveSession()
      break
    case 'help':
      const builtIn = builtInCommands.filter(c => !c.action.startsWith('compose:'))
      const compose = builtInCommands.filter(c => c.action.startsWith('compose:'))
      const custom = customCommands.value.map(c => ({ name: `/${c.name}`, description: c.description || '自定义命令' }))
      chatStore.messages.push({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `## 可用命令\n\n### 基础命令\n${builtIn.map(c => `- **${c.name}** - ${c.description}`).join('\n')}\n\n### Compose 技能命令\n${compose.map(c => `- **${c.name}** - ${c.description}`).join('\n')}${custom.length > 0 ? `\n\n### 自定义命令\n${custom.map(c => `- **${c.name}** - ${c.description}`).join('\n')}` : ''}`,
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
    case 'thinking':
      showThinking.value = !showThinking.value
      chatStore.messages.push({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `思考块显示: **${showThinking.value ? '开启' : '关闭'}**`,
        timestamp: Date.now()
      })
      break
    case 'details':
      showToolDetails.value = !showToolDetails.value
      chatStore.messages.push({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `工具详情显示: **${showToolDetails.value ? '开启' : '关闭'}**`,
        timestamp: Date.now()
      })
      break
    case 'sessions':
      showSessions.value = !showSessions.value
      break
    case 'themes':
      chatStore.messages.push({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: '主题切换功能请使用 **Ctrl+,** 打开设置面板',
        timestamp: Date.now()
      })
      break
    case 'init':
      chatStore.messages.push({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'AGENTS.md 规则文件初始化功能开发中...',
        timestamp: Date.now()
      })
      break
  }
}

function exportChat() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessionId: currentSessionId.value,
    messages: chatStore.messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp
    }))
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chat-export-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importChat() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (data.messages && Array.isArray(data.messages)) {
        chatStore.clear()
        data.messages.forEach((m: { role: string; content: string; timestamp: number }) => {
          chatStore.messages.push({
            id: `msg-${m.timestamp || Date.now()}`,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            parts: [{ type: 'text', content: m.content }],
            accumulatedText: m.content,
            timestamp: m.timestamp || Date.now()
          })
        })
      }
    } catch (err) {
      console.error('Failed to import chat:', err)
    }
  }
  input.click()
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

async function forkSession(id: string) {
  try {
    const session = await window.mimo.sessions.load(id)
    if (session) {
      // Create a new session with the same messages but new ID
      const newSession = {
        ...session,
        id: `session-${Date.now()}`,
        title: `${session.title} (分叉)`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      await window.mimo.sessions.save(newSession)
      await loadSessionList()
    }
  } catch (err) {
    console.error('Failed to fork session:', err)
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

function autoResize() {
  if (!inputEl.value) return
  inputEl.value.style.height = 'auto'
  inputEl.value.style.height = Math.min(inputEl.value.scrollHeight, 150) + 'px'
}

function handleRetry(part: MessagePart) {
  console.log('Retry:', part)
}

function handleDismiss(part: MessagePart) {
  console.log('Dismiss:', part)
}

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
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
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

.mode-toggle button svg {
  opacity: 0.7;
}

.mode-toggle button.active svg {
  opacity: 1;
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

.fork-btn,
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

.session-item:hover .fork-btn,
.session-item:hover .delete-btn {
  opacity: 1;
}

.fork-btn:hover {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
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

/* File Reference Menu */
.file-menu {
  position: absolute;
  bottom: 100%;
  left: 12px;
  right: 12px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  max-height: 250px;
  display: flex;
  flex-direction: column;
  z-index: 20;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

.file-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  border-bottom: 1px solid #334155;
}

.file-menu-items {
  flex: 1;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.1s;
}

.file-item:hover,
.file-item.active {
  background: rgba(59, 130, 246, 0.15);
}

.file-item svg {
  flex-shrink: 0;
  color: #64748b;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
}

.file-path {
  font-size: 11px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-menu-empty,
.file-menu-loading {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #64748b;
}

.binary-warning-toast {
  position: absolute;
  bottom: 100%;
  left: 12px;
  right: 12px;
  background: #1e293b;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #fbbf24;
  z-index: 20;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pending Images */
.pending-images {
  display: flex;
  gap: 8px;
  padding: 8px 0;
  overflow-x: auto;
}

.pending-image {
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #334155;
}

.pending-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

.pending-image:hover .remove-image {
  opacity: 1;
}

/* Drag Overlay */
.drag-overlay {
  position: absolute;
  inset: 0;
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #3b82f6;
  font-size: 13px;
  z-index: 10;
  pointer-events: none;
}

.chat-input-area.dragging {
  border-color: #3b82f6;
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
