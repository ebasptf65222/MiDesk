<template>
  <Teleport to="body">
    <div class="command-overlay" v-if="visible" @click.self="close">
      <div class="command-palette">
        <div class="command-input-wrapper">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref="inputEl"
            v-model="query"
            placeholder="输入命令..."
            @keydown="handleKeydown"
          />
        </div>
        <div class="command-list">
          <div
            v-for="(cmd, index) in filteredCommands"
            :key="cmd.id"
            :class="['command-item', { active: index === selectedIndex }]"
            @click="executeCommand(cmd)"
            @mouseenter="selectedIndex = index"
          >
            <span class="command-icon">{{ cmd.icon }}</span>
            <div class="command-info">
              <span class="command-name">{{ cmd.name }}</span>
              <span class="command-desc">{{ cmd.description }}</span>
            </div>
            <span class="command-shortcut" v-if="cmd.shortcut">{{ cmd.shortcut }}</span>
          </div>
          <div v-if="filteredCommands.length === 0" class="no-results">
            没有匹配的命令
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

interface Command {
  id: string
  name: string
  description: string
  icon: string
  shortcut?: string
  action: () => void
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'execute', command: string): void
}>()

const inputEl = ref<HTMLInputElement>()
const query = ref('')
const selectedIndex = ref(0)

const commands: Command[] = [
  { id: 'save', name: '保存文件', description: '保存当前文件', icon: '💾', shortcut: 'Ctrl+S', action: () => emit('execute', 'save') },
  { id: 'saveAll', name: '保存所有文件', description: '保存所有修改的文件', icon: '💾', action: () => emit('execute', 'saveAll') },
  { id: 'openFile', name: '打开文件', description: '打开文件选择器', icon: '📁', shortcut: 'Ctrl+P', action: () => emit('execute', 'openFile') },
  { id: 'terminal', name: '切换终端', description: '打开/关闭终端', icon: '⌨️', shortcut: 'Ctrl+`', action: () => emit('execute', 'terminal') },
  { id: 'git', name: '源代码管理', description: '打开 Git 面板', icon: '🔀', shortcut: 'Ctrl+G', action: () => emit('execute', 'git') },
  { id: 'settings', name: '设置', description: '打开设置', icon: '⚙️', shortcut: 'Ctrl+,', action: () => emit('execute', 'settings') },
  { id: 'skills', name: '技能管理', description: '查看已安装技能', icon: '🧩', action: () => emit('execute', 'skills') },
  { id: 'clearChat', name: '清空对话', description: '清空当前对话', icon: '🗑️', action: () => emit('execute', 'clearChat') },
  { id: 'refreshTree', name: '刷新文件树', description: '重新加载文件列表', icon: '🔄', action: () => emit('execute', 'refreshTree') },
  { id: 'help', name: '帮助', description: '查看帮助信息', icon: '❓', action: () => emit('execute', 'help') }
]

const filteredCommands = computed(() => {
  if (!query.value) return commands

  const q = query.value.toLowerCase()
  return commands.filter(cmd =>
    cmd.name.toLowerCase().includes(q) ||
    cmd.description.toLowerCase().includes(q)
  )
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (filteredCommands.value[selectedIndex.value]) {
      executeCommand(filteredCommands.value[selectedIndex.value])
    }
  } else if (e.key === 'Escape') {
    close()
  }
}

function executeCommand(cmd: Command) {
  cmd.action()
  close()
}

function close() {
  emit('close')
  query.value = ''
  selectedIndex.value = 0
}

watch(() => props.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      inputEl.value?.focus()
    })
  }
})

watch(query, () => {
  selectedIndex.value = 0
})
</script>

<style scoped>
.command-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  padding-top: 100px;
  z-index: 1000;
}

.command-palette {
  width: 500px;
  max-width: 90%;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.command-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #334155;
}

.command-input-wrapper svg {
  color: #64748b;
  flex-shrink: 0;
}

.command-input-wrapper input {
  flex: 1;
  background: none;
  border: none;
  color: #e2e8f0;
  font-size: 15px;
  outline: none;
}

.command-input-wrapper input::placeholder {
  color: #64748b;
}

.command-list {
  max-height: 400px;
  overflow-y: auto;
}

.command-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.1s;
}

.command-item:hover,
.command-item.active {
  background: rgba(59, 130, 246, 0.15);
}

.command-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.command-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.command-name {
  font-size: 14px;
  color: #e2e8f0;
}

.command-desc {
  font-size: 12px;
  color: #64748b;
}

.command-shortcut {
  font-size: 11px;
  color: #64748b;
  background: #334155;
  padding: 2px 8px;
  border-radius: 4px;
}

.no-results {
  padding: 24px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}
</style>
