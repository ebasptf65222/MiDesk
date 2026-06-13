<template>
  <div class="app">
    <GradientBg />
    <FloatingOrbs />

    <TitleBar
      :activeTab="activeTab"
      @changeTab="activeTab = $event"
      @toggleSidebar="toggleSidebar"
      @openFile="handleCommand('openFile')"
      @openSettings="activeTab = 'settings'"
    />
    <SearchPanel :visible="showSearch" @close="showSearch = false" @openFile="handleOpenFile" />
    <div class="app-container">
      <aside class="sidebar" v-show="showSidebar">
        <FileTree v-if="activeTab === 'files'" class="sidebar-tree" />
        <GitPanel v-if="activeTab === 'git'" class="sidebar-tree" />
        <div class="settings-sidebar" v-if="activeTab === 'settings'">
          <nav class="settings-nav">
            <button
              v-for="tab in settingTabs"
              :key="tab.id"
              :class="['nav-item', { active: settingsTab === tab.id }]"
              @click="settingsTab = tab.id"
            >
              <span class="nav-icon" v-html="tab.icon"></span>
              <span class="nav-label">{{ tab.label }}</span>
            </button>
          </nav>
        </div>
      </aside>
      <div class="main-area">
        <div class="editor-area" v-show="activeTab === 'files' && !showDiff">
          <TabBar />
          <CodeEditor />
        </div>
        <div class="diff-area" v-show="activeTab === 'files' && showDiff">
          <DiffView />
        </div>
        <div class="terminal-area" v-show="activeTab === 'terminal'">
          <TerminalPanel />
        </div>
        <div class="skills-area" v-show="activeTab === 'skills'">
          <SkillsView />
        </div>
        <div class="mcp-area" v-show="activeTab === 'mcp'">
          <McpPanel />
        </div>
        <div class="rules-area" v-show="activeTab === 'rules'">
          <RulesPanel />
        </div>
        <div class="settings-area" v-show="activeTab === 'settings'">
          <SettingsView :activeTab="settingsTab" />
        </div>
      </div>
      <div class="chat-resize-handle" @mousedown="onChatDragStart"></div>
      <aside class="chat-aside" :style="{ width: chatSidebarWidth + 'px', minWidth: chatSidebarWidth + 'px' }">
        <ChatPanel />
      </aside>
    </div>
    <StatusBar />
    <Toast ref="toastRef" />
    <CommandPalette
      :visible="showCommandPalette"
      @close="showCommandPalette = false"
      @execute="handleCommand"
    />
    <DownloadProgress />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import gsap from 'gsap'
import TitleBar from './components/TitleBar.vue'
import ChatPanel from './components/ChatPanel.vue'
import FileTree from './components/FileTree.vue'
import TabBar from './components/TabBar.vue'
import CodeEditor from './components/CodeEditor.vue'
import TerminalPanel from './components/TerminalPanel.vue'
import DiffView from './components/DiffView.vue'
import SkillsView from './components/SkillsView.vue'
import SettingsView from './components/SettingsView.vue'
import GitPanel from './components/GitPanel.vue'
import McpPanel from './components/McpPanel.vue'
import RulesPanel from './components/RulesPanel.vue'
import SearchPanel from './components/SearchPanel.vue'
import GradientBg from './components/GradientBg.vue'
import FloatingOrbs from './components/FloatingOrbs.vue'
import StatusBar from './components/StatusBar.vue'
import Toast from './components/Toast.vue'
import CommandPalette from './components/CommandPalette.vue'
import DownloadProgress from './components/DownloadProgress.vue'
import { useDiffStore } from './stores/diff'
import { useEditorStore } from './stores/editor'
import { useChatStore } from './stores/chat'

const diffStore = useDiffStore()
const editorStore = useEditorStore()
const chatStore = useChatStore()
const toastRef = ref()
const showCommandPalette = ref(false)
const showSearch = ref(false)
const showSidebar = ref(true)
const settingsTab = ref('ai')
const chatSidebarWidth = ref(parseInt(localStorage.getItem('chatSidebarWidth') || '360', 10))
const isDraggingChat = ref(false)
let dragStartX = 0
let dragStartWidth = 0

function onChatDragStart(e: MouseEvent) {
  isDraggingChat.value = true
  dragStartX = e.clientX
  dragStartWidth = chatSidebarWidth.value
  document.addEventListener('mousemove', onChatDragMove)
  document.addEventListener('mouseup', onChatDragEnd)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onChatDragMove(e: MouseEvent) {
  if (!isDraggingChat.value) return
  const delta = dragStartX - e.clientX
  const newWidth = Math.min(Math.max(dragStartWidth + delta, 280), 800)
  chatSidebarWidth.value = newWidth
}

function onChatDragEnd() {
  isDraggingChat.value = false
  document.removeEventListener('mousemove', onChatDragMove)
  document.removeEventListener('mouseup', onChatDragEnd)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  localStorage.setItem('chatSidebarWidth', String(chatSidebarWidth.value))
}

const settingTabs = [
  { id: 'ai', label: 'AI', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' },
  { id: 'editor', label: '编辑器', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' },
  { id: 'appearance', label: '外观', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' },
  { id: 'data', label: '数据', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>' }
]

const tabs = [
  { id: 'files', label: '文件' },
  { id: 'git', label: '源代码' },
  { id: 'mcp', label: 'MCP' },
  { id: 'rules', label: '规则' },
  { id: 'terminal', label: '终端' },
  { id: 'skills', label: '技能' },
  { id: 'settings', label: '设置' }
]

const activeTab = ref('files')

function toggleSidebar() {
  showSidebar.value = !showSidebar.value
}
const currentTheme = ref<'dark' | 'light' | 'system'>('dark')

const showDiff = computed(() => diffStore.hasPendingDiffs)

// Theme management
let themeCheckInterval: ReturnType<typeof setInterval> | null = null

async function loadTheme() {
  try {
    const settings = await window.mimo.settings.get()
    currentTheme.value = settings.theme || 'dark'
    applyTheme(currentTheme.value)
  } catch {
    applyTheme('dark')
  }
}

function applyTheme(theme: 'dark' | 'light' | 'system') {
  const root = document.documentElement

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

async function checkThemeUpdate() {
  try {
    const settings = await window.mimo.settings.get()
    if (settings.theme !== currentTheme.value) {
      currentTheme.value = settings.theme
      applyTheme(currentTheme.value)
    }
  } catch {
    // Ignore errors
  }
}

function handleCommand(command: string) {
  switch (command) {
    case 'save':
      if (editorStore.activeFile && editorStore.activeFile.isModified) {
        editorStore.saveFile(editorStore.activeFile.id)
      }
      break
    case 'saveAll':
      editorStore.saveAllFiles()
      break
    case 'terminal':
      activeTab.value = 'terminal'
      break
    case 'git':
      activeTab.value = 'git'
      break
    case 'mcp':
      activeTab.value = 'mcp'
      break
    case 'rules':
      activeTab.value = 'rules'
      break
    case 'settings':
      activeTab.value = 'settings'
      break
    case 'skills':
      activeTab.value = 'skills'
      break
    case 'search':
      showSearch.value = !showSearch.value
      break
    case 'clearChat':
      // Handled by ChatPanel
      break
    case 'refreshTree':
      editorStore.refreshTree()
      break
    case 'help':
      activeTab.value = 'skills'
      break
  }
}

function handleOpenFile(file: string, line: number) {
  showSearch.value = false
  activeTab.value = 'files'
  editorStore.openFile(file)
}

watch(currentTheme, (newTheme) => {
  applyTheme(newTheme)
})

// Keyboard shortcuts
function handleKeyboard(e: KeyboardEvent) {
  // Ctrl+S - Save file
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (editorStore.activeFile && editorStore.activeFile.isModified) {
      editorStore.saveFile(editorStore.activeFile.id)
    }
  }

  // Ctrl+P - Quick file open (toggle file tab)
  if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !e.shiftKey) {
    e.preventDefault()
    activeTab.value = 'files'
  }

  // Ctrl+Shift+P - Command palette
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
    e.preventDefault()
    showCommandPalette.value = !showCommandPalette.value
  }

  // Ctrl+Shift+F - Search
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
    e.preventDefault()
    showSearch.value = !showSearch.value
  }

  // Ctrl+` - Toggle terminal
  if ((e.ctrlKey || e.metaKey) && e.key === '`') {
    e.preventDefault()
    activeTab.value = activeTab.value === 'terminal' ? 'files' : 'terminal'
  }

  // Ctrl+B - Toggle sidebar (files)
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault()
    activeTab.value = activeTab.value === 'files' ? 'git' : 'files'
  }

  // Ctrl+G - Git panel
  if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
    e.preventDefault()
    activeTab.value = 'git'
  }

  // Ctrl+, - Settings
  if ((e.ctrlKey || e.metaKey) && e.key === ',') {
    e.preventDefault()
    activeTab.value = 'settings'
  }

  // Escape - Close panels
  if (e.key === 'Escape') {
    if (showDiff.value) {
      diffStore.clear()
    }
  }

  // Ctrl+Z - Undo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    chatStore.undo()
  }

  // Ctrl+Shift+Z - Redo
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
    e.preventDefault()
    chatStore.redo()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyboard)
  loadTheme()

  // Check theme updates every 1 second
  themeCheckInterval = setInterval(checkThemeUpdate, 1000)

  // Entry animations
  gsap.from('.titlebar', {
    y: -20,
    opacity: 0,
    duration: 0.6,
    ease: 'power2.out'
  })

  gsap.from('.sidebar', {
    x: -20,
    opacity: 0,
    duration: 0.6,
    delay: 0.1,
    ease: 'power2.out'
  })

  gsap.from('.chat-aside', {
    x: 20,
    opacity: 0,
    duration: 0.6,
    delay: 0.2,
    ease: 'power2.out'
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboard)
  if (themeCheckInterval) {
    clearInterval(themeCheckInterval)
    themeCheckInterval = null
  }
})
</script>

<style>
:root,
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border-color: #334155;
  --accent-color: #3b82f6;
  --accent-hover: #2563eb;
  --success-color: #22c55e;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
}

[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #e2e8f0;
  --text-primary: #1e293b;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --accent-color: #3b82f6;
  --accent-hover: #2563eb;
  --success-color: #16a34a;
  --warning-color: #d97706;
  --error-color: #dc2626;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
}

.app-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.sidebar {
  width: 220px;
  background: rgba(30, 41, 59, 0.95);
  border-right: 1px solid rgba(51, 65, 85, 0.8);
  display: flex;
  flex-direction: column;
}

.sidebar-tree {
  flex: 1;
  min-height: 0;
}

.settings-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.settings-nav {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.nav-item:hover {
  background: rgba(51, 65, 85, 0.5);
  color: #e2e8f0;
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.diff-area {
  flex: 1;
  min-height: 0;
}

.terminal-area {
  flex: 1;
  min-height: 0;
}

.skills-area {
  flex: 1;
  min-height: 0;
}

.mcp-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.rules-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.settings-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.placeholder {
  text-align: center;
  color: #64748b;
}

.placeholder h2 {
  font-size: 18px;
  margin-bottom: 8px;
  color: #94a3b8;
}

.placeholder p {
  font-size: 13px;
}

.chat-aside {
  flex-shrink: 0;
  background: rgba(30, 41, 59, 0.95);
  border-left: 1px solid rgba(51, 65, 85, 0.8);
  display: flex;
  flex-direction: column;
  margin-left: auto;
}

.chat-resize-handle {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  position: relative;
  flex-shrink: 0;
  z-index: 10;
  transition: background 0.15s;
}

.chat-resize-handle::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -2px;
  right: -2px;
}

.chat-resize-handle:hover,
.chat-resize-handle:active {
  background: rgba(59, 130, 246, 0.4);
}

/* Glassmorphism effect for panels - increased opacity for readability */
.chat-panel,
.terminal-panel,
.diff-view,
.code-editor,
.file-tree {
  background: rgba(15, 23, 42, 0.85) !important;
}

/* Fix button visibility - ensure minimum 4.5:1 contrast */
button {
  color: #e2e8f0;
}

/* Primary action buttons */
.send-btn,
.install-btn,
.accept-btn,
.save-btn {
  background: #3b82f6 !important;
  color: #ffffff !important;
  font-weight: 500;
}

.send-btn:hover:not(:disabled),
.install-btn:hover,
.accept-btn:hover,
.save-btn:hover:not(:disabled) {
  background: #2563eb !important;
}

/* Secondary buttons */
.refresh-btn,
.stop-btn,
.reject-btn,
.clear-btn {
  background: rgba(51, 65, 85, 0.8) !important;
  color: #e2e8f0 !important;
  border: 1px solid rgba(71, 85, 105, 0.5);
}

.refresh-btn:hover,
.stop-btn:hover,
.reject-btn:hover,
.clear-btn:hover {
  background: rgba(71, 85, 105, 0.9) !important;
  color: #ffffff !important;
}

/* Danger buttons */
.delete-btn {
  color: #94a3b8 !important;
}

.delete-btn:hover {
  color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.15) !important;
}

/* Input fields - ensure visible */
input,
textarea {
  background: rgba(15, 23, 42, 0.9) !important;
  color: #e2e8f0 !important;
  border: 1px solid rgba(71, 85, 105, 0.6);
}

input:focus,
textarea:focus {
  border-color: #3b82f6 !important;
  outline: none;
}

input::placeholder,
textarea::placeholder {
  color: #64748b !important;
}

/* Icon buttons - ensure visible */
.icon-btn,
.open-folder-btn,
.new-terminal-btn,
.close-btn,
.tab-close {
  color: #94a3b8 !important;
}

.icon-btn:hover,
.open-folder-btn:hover,
.new-terminal-btn:hover {
  color: #e2e8f0 !important;
  background: rgba(51, 65, 85, 0.6) !important;
}

/* Subtle hover effects */
.skill-card,
.tree-node .node-row {
  transition: all 0.2s ease;
}

.skill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.6);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}
</style>
