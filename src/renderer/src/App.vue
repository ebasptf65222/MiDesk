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
        <GitPanel v-if="activeTab === 'git'" class="sidebar-tree" @switch-tab="handleSwitchTab" />
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
  { id: 'providers', label: '提供商', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
  { id: 'permissions', label: '权限', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' },
  { id: 'editor', label: '编辑器', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' },
  { id: 'appearance', label: '外观', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' },
  { id: 'envvars', label: '环境变量', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
  { id: 'network', label: '网络', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>' },
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

function handleSwitchTab(tab: string) {
  activeTab.value = tab
}
const currentTheme = ref<'dark' | 'light' | 'system'>('dark')
const currentColorTheme = ref<string>('default')

const showDiff = computed(() => diffStore.hasPendingDiffs)

// Theme management
let themeCheckInterval: ReturnType<typeof setInterval> | null = null

function applyColorTheme(colorThemeName: string) {
  const root = document.documentElement

  if (colorThemeName === 'default') {
    // Remove all color theme variables, fall back to base dark/light
    const themeVars = [
      'primary', 'primary-hover', 'primary-muted', 'secondary', 'accent',
      'success', 'warning', 'error', 'info',
      'bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-panel', 'bg-element',
      'text-primary', 'text-secondary', 'text-muted',
      'border', 'border-active', 'border-subtle'
    ]
    themeVars.forEach(v => root.style.removeProperty(`--theme-${v}`))
    return
  }

  try {
    const themes: Array<{ name: string; theme: Record<string, { dark: string; light: string }> }> = (window as any).__mimoColorThemes || []
    const found = themes.find(t => t.name === colorThemeName)
    if (!found) return

    const t = found.theme
    const mode = root.getAttribute('data-theme') || 'dark'
    const m = mode as 'dark' | 'light'

    root.style.setProperty('--theme-primary', t.primary?.[m] || '#3b82f6')
    root.style.setProperty('--theme-primary-hover', t.primary?.[m] || '#2563eb')
    root.style.setProperty('--theme-primary-muted', t.primary?.[m] || '#3b82f6')
    root.style.setProperty('--theme-secondary', t.secondary?.[m] || '#8b5cf6')
    root.style.setProperty('--theme-accent', t.accent?.[m] || '#06b6d4')
    root.style.setProperty('--theme-success', t.success?.[m] || '#22c55e')
    root.style.setProperty('--theme-warning', t.warning?.[m] || '#f59e0b')
    root.style.setProperty('--theme-error', t.error?.[m] || '#ef4444')
    root.style.setProperty('--theme-info', t.info?.[m] || '#3b82f6')
    root.style.setProperty('--theme-bg-primary', t.background?.[m] || '#0f172a')
    root.style.setProperty('--theme-bg-secondary', t.backgroundPanel?.[m] || '#1e293b')
    root.style.setProperty('--theme-bg-tertiary', t.backgroundElement?.[m] || '#334155')
    root.style.setProperty('--theme-bg-panel', t.backgroundPanel?.[m] || '#1e293b')
    root.style.setProperty('--theme-bg-element', t.backgroundElement?.[m] || '#334155')
    root.style.setProperty('--theme-text-primary', t.text?.[m] || '#e2e8f0')
    root.style.setProperty('--theme-text-secondary', t.textMuted?.[m] || '#94a3b8')
    root.style.setProperty('--theme-text-muted', t.textMuted?.[m] || '#64748b')
    root.style.setProperty('--theme-border', t.border?.[m] || '#334155')
    root.style.setProperty('--theme-border-active', t.borderActive?.[m] || '#475569')
    root.style.setProperty('--theme-border-subtle', t.borderSubtle?.[m] || '#334155')
  } catch {
    // Ignore errors
  }
}

async function loadTheme() {
  try {
    const settings = await window.mimo.settings.get()
    currentTheme.value = settings.theme || 'dark'
    currentColorTheme.value = settings.colorTheme || 'default'
    applyTheme(currentTheme.value)

    // Load color themes list and apply
    const themes = await window.mimo.themes.list()
    ;(window as any).__mimoColorThemes = themes
    applyColorTheme(currentColorTheme.value)
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

  // Re-apply color theme after mode change (needs correct data-theme)
  if (currentColorTheme.value !== 'default') {
    applyColorTheme(currentColorTheme.value)
  }
}

async function checkThemeUpdate() {
  try {
    const settings = await window.mimo.settings.get()
    if (settings.theme !== currentTheme.value) {
      currentTheme.value = settings.theme
      applyTheme(currentTheme.value)
    }
    if (settings.colorTheme !== currentColorTheme.value) {
      currentColorTheme.value = settings.colorTheme || 'default'
      applyColorTheme(currentColorTheme.value)
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
  --bg-primary: var(--theme-bg-primary, #0f172a);
  --bg-secondary: var(--theme-bg-secondary, #1e293b);
  --bg-tertiary: var(--theme-bg-tertiary, #334155);
  --text-primary: var(--theme-text-primary, #e2e8f0);
  --text-secondary: var(--theme-text-secondary, #94a3b8);
  --text-muted: var(--theme-text-muted, #64748b);
  --border-color: var(--theme-border, #334155);
  --border-active: var(--theme-border-active, #475569);
  --border-subtle: var(--theme-border-subtle, #334155);
  --accent-color: var(--theme-primary, #3b82f6);
  --accent-hover: var(--theme-primary-hover, #2563eb);
  --accent-muted: var(--theme-primary-muted, rgba(59, 130, 246, 0.2));
  --secondary-color: var(--theme-secondary, #8b5cf6);
  --accent-soft: var(--theme-accent, #06b6d4);
  --success-color: var(--theme-success, #22c55e);
  --warning-color: var(--theme-warning, #f59e0b);
  --error-color: var(--theme-error, #ef4444);
  --info-color: var(--theme-info, #3b82f6);
}

[data-theme="light"] {
  --bg-primary: var(--theme-bg-primary, #ffffff);
  --bg-secondary: var(--theme-bg-secondary, #f8fafc);
  --bg-tertiary: var(--theme-bg-tertiary, #e2e8f0);
  --text-primary: var(--theme-text-primary, #1e293b);
  --text-secondary: var(--theme-text-secondary, #475569);
  --text-muted: var(--theme-text-muted, #94a3b8);
  --border-color: var(--theme-border, #e2e8f0);
  --border-active: var(--theme-border-active, #cbd5e1);
  --border-subtle: var(--theme-border-subtle, #e2e8f0);
  --accent-color: var(--theme-primary, #3b82f6);
  --accent-hover: var(--theme-primary-hover, #2563eb);
  --accent-muted: var(--theme-primary-muted, rgba(59, 130, 246, 0.15));
  --secondary-color: var(--theme-secondary, #7c3aed);
  --accent-soft: var(--theme-accent, #0891b2);
  --success-color: var(--theme-success, #16a34a);
  --warning-color: var(--theme-warning, #d97706);
  --error-color: var(--theme-error, #dc2626);
  --info-color: var(--theme-info, #3b82f6);
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
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
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
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-muted);
  color: var(--accent-color);
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
  color: var(--text-muted);
}

.placeholder h2 {
  font-size: 18px;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.placeholder p {
  font-size: 13px;
}

.chat-aside {
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
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
  background: var(--accent-muted);
}

/* Glassmorphism effect for panels - increased opacity for readability */
.chat-panel,
.terminal-panel,
.diff-view,
.code-editor,
.file-tree {
  background: var(--bg-primary) !important;
}

/* Fix button visibility - ensure minimum 4.5:1 contrast */
button {
  color: var(--text-primary);
}

/* Primary action buttons */
.send-btn,
.install-btn,
.accept-btn,
.save-btn {
  background: var(--accent-color) !important;
  color: #ffffff !important;
  font-weight: 500;
}

.send-btn:hover:not(:disabled),
.install-btn:hover,
.accept-btn:hover,
.save-btn:hover:not(:disabled) {
  background: var(--accent-hover) !important;
}

/* Secondary buttons */
.refresh-btn,
.stop-btn,
.reject-btn,
.clear-btn {
  background: var(--bg-tertiary) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-active);
}

.refresh-btn:hover,
.stop-btn:hover,
.reject-btn:hover,
.clear-btn:hover {
  background: var(--border-active) !important;
  color: #ffffff !important;
}

/* Danger buttons */
.delete-btn {
  color: var(--text-secondary) !important;
}

.delete-btn:hover {
  color: var(--error-color) !important;
  background: rgba(239, 68, 68, 0.15) !important;
}

/* Input fields - ensure visible */
input,
textarea {
  background: var(--bg-primary) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-color);
}

input:focus,
textarea:focus {
  border-color: var(--accent-color) !important;
  outline: none;
}

input::placeholder,
textarea::placeholder {
  color: var(--text-muted) !important;
}

/* Icon buttons - ensure visible */
.icon-btn,
.open-folder-btn,
.new-terminal-btn,
.close-btn,
.tab-close {
  color: var(--text-secondary) !important;
}

.icon-btn:hover,
.open-folder-btn:hover,
.new-terminal-btn:hover {
  color: var(--text-primary) !important;
  background: var(--bg-tertiary) !important;
}

/* Subtle hover effects */
.skill-card,
.tree-node .node-row {
  transition: all 0.2s ease;
}

.skill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px var(--accent-muted);
  border-color: var(--accent-muted);
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
  background: var(--border-active);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}
</style>
