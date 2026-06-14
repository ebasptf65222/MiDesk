<template>
  <div class="terminal-panel" @click="focusActiveTerminal">
    <div class="terminal-header">
      <div class="terminal-tabs">
        <div
          v-for="term in terminals"
          :key="term.id"
          :class="['terminal-tab', { active: term.id === activeTerminalId }]"
          @click="switchTerminal(term.id)"
        >
          <span class="tab-label">终端 {{ term.index }}</span>
          <button class="tab-close" @click.stop="closeTerminal(term.id)">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <button class="new-terminal-btn" @click="createTerminal" title="新建终端">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>

    <div class="terminal-container" @click="focusActiveTerminal">
      <div
        v-for="term in terminals"
        :key="term.id"
        v-show="term.id === activeTerminalId"
        :ref="(el) => setTerminalRef(term.id, el as HTMLElement)"
        class="terminal-instance"
        @click="focusTerminal(term.id)"
      ></div>
      <div v-if="terminals.length === 0" class="terminal-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="4,17 10,11 4,5"/>
          <line x1="12" y1="19" x2="20" y2="19"/>
        </svg>
        <p>点击 + 创建新终端</p>
        <span>或按 Ctrl+` 快速打开</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useEditorStore } from '../stores/editor'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { ClipboardAddon } from '@xterm/addon-clipboard'
import '@xterm/xterm/css/xterm.css'

interface TerminalEntry {
  id: string
  index: number
  terminal: Terminal
  fitAddon: FitAddon
  element: HTMLElement | null
  initialized: boolean
  handleKeyDown?: (e: KeyboardEvent) => void
  resizeObserver?: ResizeObserver
  removeOutputListener?: () => void
  removeExitListener?: () => void
}

const editorStore = useEditorStore()
const terminals = ref<TerminalEntry[]>([])
const activeTerminalId = ref<string>('')
const terminalRefs = new Map<string, HTMLElement>()
let terminalCounter = 0

function setTerminalRef(id: string, el: HTMLElement | null) {
  if (el) {
    terminalRefs.set(id, el)
  }
}

function getCwd(): string {
  return editorStore.rootPath || ''
}

async function createTerminal() {
  terminalCounter++
  const id = `term-${Date.now()}`
  const index = terminalCounter

  const entry: TerminalEntry = {
    id,
    index,
    terminal: null!,
    fitAddon: null!,
    element: null,
    initialized: false
  }

  terminals.value.push(entry)
  activeTerminalId.value = id

  await nextTick()

  const element = terminalRefs.get(id)
  if (!element) {
    console.error('[Terminal] Element not found for', id)
    return
  }

  entry.element = element

  const terminal = new Terminal({
    fontSize: 13,
    fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', monospace",
    cursorBlink: true,
    theme: {
      background: '#0f172a',
      foreground: '#e2e8f0',
      cursor: '#e2e8f0',
      selectionBackground: '#334155',
      black: '#1e293b',
      red: '#f87171',
      green: '#34d399',
      yellow: '#fbbf24',
      blue: '#60a5fa',
      magenta: '#c084fc',
      cyan: '#22d3ee',
      white: '#e2e8f0',
      brightBlack: '#475569',
      brightRed: '#fca5a5',
      brightGreen: '#6ee7b7',
      brightYellow: '#fde68a',
      brightBlue: '#93c5fd',
      brightMagenta: '#d8b4fe',
      brightCyan: '#67e8f9',
      brightWhite: '#f1f5f9'
    }
  })

  const fitAddon = new FitAddon()
  const clipboardAddon = new ClipboardAddon()
  terminal.loadAddon(fitAddon)
  terminal.loadAddon(clipboardAddon)

  terminal.open(element)

  // Intercept Ctrl+V at document level to handle paste
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && !e.altKey && !e.shiftKey && (e.key === 'v' || e.code === 'KeyV')) {
      // Only handle when terminal is focused
      if (element.contains(document.activeElement) || document.activeElement === element) {
        e.preventDefault()
        e.stopImmediatePropagation()
        navigator.clipboard.readText().then((text) => {
          if (text) {
            window.mimo.terminal.write(id, text)
          }
        })
      }
    }
  }
  document.addEventListener('keydown', handleKeyDown, true)
  entry.handleKeyDown = handleKeyDown

  // Wait for element to be properly sized
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 50))
  fitAddon.fit()

  // Create terminal session in main process
  const cwd = getCwd()
  await window.mimo.terminal.create(id, cwd)

  // Write welcome message
  terminal.writeln(`\x1b[36mMiMo Code Terminal\x1b[0m`)
  terminal.writeln(`\x1b[90mWorking directory: ${cwd}\x1b[0m`)
  terminal.writeln(`\x1b[33m⚠ This is your project directory. Modifications here affect only your project, not the app.\x1b[0m`)
  terminal.writeln('')

  // Listen for output
  entry.removeOutputListener = window.mimo.terminal.onOutput(id, (data: string) => {
    terminal.write(data)
  })

  // Listen for exit
  entry.removeExitListener = window.mimo.terminal.onExit(id, (code: number) => {
    terminal.writeln(`\r\n\x1b[31m[Process exited with code ${code}]\x1b[0m`)
  })

  // Send input to main process
  terminal.onData((data) => {
    console.log('[Terminal] Input:', data)
    window.mimo.terminal.write(id, data)
  })

  // Handle resize
  const resizeObserver = new ResizeObserver(() => {
    if (element.offsetHeight > 0) {
      fitAddon.fit()
      window.mimo.terminal.resize(id, terminal.cols, terminal.rows)
    }
  })
  resizeObserver.observe(element)
  entry.resizeObserver = resizeObserver

  entry.terminal = terminal
  entry.fitAddon = fitAddon
  entry.initialized = true

  terminal.focus()
}

function switchTerminal(id: string) {
  activeTerminalId.value = id
  const entry = terminals.value.find(t => t.id === id)
  if (entry?.terminal) {
    nextTick(() => {
      entry.fitAddon.fit()
      entry.terminal.focus()
    })
  }
}

function focusTerminal(id: string) {
  const entry = terminals.value.find(t => t.id === id)
  if (entry?.terminal) {
    entry.terminal.focus()
  }
}

function focusActiveTerminal() {
  if (activeTerminalId.value) {
    focusTerminal(activeTerminalId.value)
  }
}

function closeTerminal(id: string) {
  const index = terminals.value.findIndex(t => t.id === id)
  if (index === -1) return

  const entry = terminals.value[index]
  
  // Disconnect ResizeObserver
  if (entry.resizeObserver) {
    entry.resizeObserver.disconnect()
  }
  
  // Remove terminal and its event listeners
  if (entry.terminal) {
    entry.terminal.dispose()
  }
  
  // Remove keydown listener
  if (entry.handleKeyDown) {
    document.removeEventListener('keydown', entry.handleKeyDown, true)
  }
  
  // Remove IPC listeners
  if (entry.removeOutputListener) {
    entry.removeOutputListener()
  }
  if (entry.removeExitListener) {
    entry.removeExitListener()
  }
  
  // Destroy backend process
  window.mimo.terminal.destroy(id)

  terminals.value.splice(index, 1)

  if (activeTerminalId.value === id) {
    activeTerminalId.value = terminals.value[Math.min(index, terminals.value.length - 1)]?.id || ''
  }
}

onMounted(() => {
  createTerminal()
})

// Auto-focus terminal when panel becomes visible
watch(activeTerminalId, () => {
  nextTick(() => {
    if (activeTerminalId.value) {
      focusTerminal(activeTerminalId.value)
    }
  })
})

onBeforeUnmount(() => {
  for (const entry of terminals.value) {
    // Disconnect ResizeObserver
    if (entry.resizeObserver) {
      entry.resizeObserver.disconnect()
    }
    
    // Remove terminal and its event listeners
    if (entry.terminal) {
      entry.terminal.dispose()
    }
    
    // Remove keydown listener
    if (entry.handleKeyDown) {
      document.removeEventListener('keydown', entry.handleKeyDown, true)
    }
    
    // Remove IPC listeners
    if (entry.outputListener) {
      window.mimo.terminal.removeOutputListener(entry.id, entry.outputListener)
    }
    if (entry.exitListener) {
      window.mimo.terminal.removeExitListener(entry.id, entry.exitListener)
    }
    
    // Destroy backend process
    window.mimo.terminal.destroy(entry.id)
  }
})
</script>

<style scoped>
.terminal-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0f172a;
}

.terminal-header {
  display: flex;
  align-items: center;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.terminal-tabs {
  display: flex;
  flex: 1;
  overflow-x: auto;
}

.terminal-tabs::-webkit-scrollbar {
  height: 0;
}

.terminal-tab {
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

.terminal-tab:hover {
  background: #334155;
}

.terminal-tab.active {
  background: #0f172a;
  color: #e2e8f0;
  border-bottom: 2px solid #3b82f6;
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

.terminal-tab:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: #475569;
  color: #e2e8f0;
}

.new-terminal-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0 4px;
  background: none;
  border: none;
  color: #64748b;
  border-radius: 4px;
  cursor: pointer;
}

.new-terminal-btn:hover {
  color: #94a3b8;
  background: #334155;
}

.terminal-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.terminal-instance {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 8px;
}

.terminal-empty {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #475569;
}

.terminal-empty svg {
  opacity: 0.5;
}

.terminal-empty p {
  font-size: 14px;
  color: #64748b;
}

.terminal-empty span {
  font-size: 12px;
  color: #475569;
}
</style>
