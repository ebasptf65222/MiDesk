<template>
  <div class="terminal-panel">
    <div class="terminal-header">
      <div class="terminal-tabs">
        <div
          v-for="term in terminals"
          :key="term.id"
          :class="['terminal-tab', { active: term.id === activeTerminalId }]"
          @click="activeTerminalId = term.id"
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

    <div class="terminal-container">
      <div
        v-for="term in terminals"
        :key="term.id"
        v-show="term.id === activeTerminalId"
        :ref="(el) => setTerminalRef(term.id, el as HTMLElement)"
        class="terminal-instance"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface TerminalEntry {
  id: string
  index: number
  terminal: Terminal
  fitAddon: FitAddon
  element: HTMLElement | null
}

const terminals = ref<TerminalEntry[]>([])
const activeTerminalId = ref<string>('')
const terminalRefs = new Map<string, HTMLElement>()
let terminalCounter = 0

function setTerminalRef(id: string, el: HTMLElement | null) {
  if (el) {
    terminalRefs.set(id, el)
  }
}

async function createTerminal() {
  terminalCounter++
  const id = `term-${Date.now()}`
  const index = terminalCounter

  await nextTick()

  const element = terminalRefs.get(id)
  if (!element) {
    // Retry after next tick
    setTimeout(() => createTerminal(), 100)
    return
  }

  const terminal = new Terminal({
    fontSize: 13,
    fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', monospace",
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
  terminal.loadAddon(fitAddon)

  terminal.open(element)
  fitAddon.fit()

  // Create terminal session in main process
  const cwd = await window.mimo.terminal.create(id, process.cwd())

  // Listen for output
  window.mimo.terminal.onOutput(id, (data: string) => {
    terminal.write(data)
  })

  // Listen for exit
  window.mimo.terminal.onExit(id, (code: number) => {
    terminal.write(`\r\n[Process exited with code ${code}]\r\n`)
  })

  // Send input to main process
  terminal.onData((data) => {
    window.mimo.terminal.write(id, data)
  })

  // Handle resize
  const resizeObserver = new ResizeObserver(() => {
    fitAddon.fit()
    window.mimo.terminal.resize(id, terminal.cols, terminal.rows)
  })
  resizeObserver.observe(element)

  const entry: TerminalEntry = {
    id,
    index,
    terminal,
    fitAddon,
    element
  }

  terminals.value.push(entry)
  activeTerminalId.value = id
}

function closeTerminal(id: string) {
  const index = terminals.value.findIndex(t => t.id === id)
  if (index === -1) return

  const entry = terminals.value[index]
  entry.terminal.dispose()
  window.mimo.terminal.destroy(id)

  terminals.value.splice(index, 1)

  if (activeTerminalId.value === id) {
    activeTerminalId.value = terminals.value[Math.min(index, terminals.value.length - 1)]?.id || ''
  }
}

onMounted(() => {
  createTerminal()
})

onBeforeUnmount(() => {
  for (const entry of terminals.value) {
    entry.terminal.dispose()
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
</style>
