<template>
  <div class="code-editor" v-if="editorStore.activeFile">
    <div class="editor-toolbar">
      <span class="file-path" :title="editorStore.activeFile.path">
        {{ editorStore.activeFile.path }}
      </span>
      <div class="toolbar-actions">
        <span v-if="editorStore.activeFile.isModified" class="unsaved-badge">
          未保存
        </span>
        <button class="save-btn" @click="handleSave" :disabled="!editorStore.activeFile.isModified">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
          </svg>
          保存
        </button>
      </div>
    </div>
    <div class="editor-content" ref="editorContentEl">
      <div class="line-numbers">
        <div v-for="i in lineCount" :key="i" class="line-num">{{ i }}</div>
      </div>
      <div class="code-area">
        <pre class="code-highlight" ref="highlightEl"><code v-html="highlightedCode"></code></pre>
        <textarea
          ref="textareaEl"
          class="code-textarea"
          :value="editorStore.activeFile.content"
          @input="handleInput"
          @keydown="handleKeydown"
          @scroll="syncScroll"
          spellcheck="false"
        ></textarea>
      </div>
    </div>
  </div>
  <div class="editor-empty" v-else>
    <div class="empty-content">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>
      <p>选择文件开始编辑</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useEditorStore } from '../stores/editor'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import markdown from 'highlight.js/lib/languages/markdown'
import yaml from 'highlight.js/lib/languages/yaml'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import c from 'highlight.js/lib/languages/c'
import sql from 'highlight.js/lib/languages/sql'
import php from 'highlight.js/lib/languages/php'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'
import ruby from 'highlight.js/lib/languages/ruby'
import ini from 'highlight.js/lib/languages/ini'
import dockerfile from 'highlight.js/lib/languages/dockerfile'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('vue', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('scss', css)
hljs.registerLanguage('less', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('python', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('rs', rust)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c', c)
hljs.registerLanguage('h', c)
hljs.registerLanguage('hpp', cpp)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('php', php)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('kotlin', kotlin)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('ini', ini)
hljs.registerLanguage('toml', ini)
hljs.registerLanguage('dockerfile', dockerfile)

const editorStore = useEditorStore()
const textareaEl = ref<HTMLTextAreaElement>()
const highlightEl = ref<HTMLElement>()
const editorContentEl = ref<HTMLElement>()

const lineCount = computed(() => {
  if (!editorStore.activeFile) return 0
  return editorStore.activeFile.content.split('\n').length
})

const fileLanguage = computed(() => {
  if (!editorStore.activeFile) return 'plaintext'
  const ext = editorStore.activeFile.name.split('.').pop()?.toLowerCase() || ''
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'vue': 'xml',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'swift': 'swift',
    'kt': 'kotlin',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'toml': 'ini',
    'ini': 'ini',
    'env': 'bash',
    'gitignore': 'bash',
    'dockerfile': 'dockerfile',
    'makefile': 'makefile',
  }
  return langMap[ext] || 'plaintext'
})

const highlightedCode = computed(() => {
  if (!editorStore.activeFile) return ''
  const code = editorStore.activeFile.content
  const lang = fileLanguage.value

  if (lang === 'plaintext') {
    return escapeHtml(code)
  }

  try {
    const result = hljs.highlight(code, { language: lang, ignoreIllegals: true })
    return result.value
  } catch {
    return escapeHtml(code)
  }
})

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function handleInput(e: Event) {
  if (!editorStore.activeFile) return
  const target = e.target as HTMLTextAreaElement
  editorStore.updateContent(editorStore.activeFile.id, target.value)
}

function syncScroll() {
  if (!textareaEl.value || !highlightEl.value) return
  highlightEl.value.scrollTop = textareaEl.value.scrollTop
  highlightEl.value.scrollLeft = textareaEl.value.scrollLeft
}

function handleKeydown(e: KeyboardEvent) {
  // Tab support
  if (e.key === 'Tab') {
    e.preventDefault()
    const target = e.target as HTMLTextAreaElement
    const start = target.selectionStart
    const end = target.selectionEnd
    const value = target.value
    const newValue = value.substring(0, start) + '  ' + value.substring(end)
    editorStore.updateContent(editorStore.activeFile!.id, newValue)
    nextTick(() => {
      target.selectionStart = target.selectionEnd = start + 2
    })
  }

  // Cmd/Ctrl + S to save
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  }

  // Cmd/Ctrl + D to select same word
  if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
    e.preventDefault()
    selectSameWord()
  }
}

function selectSameWord() {
  const target = textareaEl.value
  if (!target || !editorStore.activeFile) return

  const start = target.selectionStart
  const end = target.selectionEnd
  const content = target.value

  // If no selection, select current word
  if (start === end) {
    const wordBoundary = /[\w]/
    let wordStart = start
    let wordEnd = start

    while (wordStart > 0 && wordBoundary.test(content[wordStart - 1])) {
      wordStart--
    }
    while (wordEnd < content.length && wordBoundary.test(content[wordEnd])) {
      wordEnd++
    }

    if (wordStart !== wordEnd) {
      target.selectionStart = wordStart
      target.selectionEnd = wordEnd
    }
    return
  }

  // Get selected word
  const selectedWord = content.substring(start, end)
  if (!selectedWord.trim()) return

  // Find next occurrence after current selection
  const searchStart = end
  const regex = new RegExp(selectedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
  regex.lastIndex = searchStart
  const match = regex.exec(content)

  if (match) {
    target.selectionStart = match.index
    target.selectionEnd = match.index + selectedWord.length
  } else {
    // Wrap around to beginning
    regex.lastIndex = 0
    const wrapMatch = regex.exec(content)
    if (wrapMatch && wrapMatch.index !== start) {
      target.selectionStart = wrapMatch.index
      target.selectionEnd = wrapMatch.index + selectedWord.length
    }
  }
}

async function handleSave() {
  if (!editorStore.activeFile || !editorStore.activeFile.isModified) return
  await editorStore.saveFile(editorStore.activeFile.id)
}

watch(
  () => editorStore.activeFileId,
  () => {
    nextTick(() => {
      if (textareaEl.value) {
        textareaEl.value.focus()
      }
    })
  }
)
</script>

<style scoped>
.code-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.file-path {
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unsaved-badge {
  font-size: 10px;
  color: var(--warning-color);
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.save-btn:hover:not(:disabled) {
  background: var(--accent-color);
  color: #ffffff;
  border-color: var(--accent-color);
}

.save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.line-numbers {
  padding: 12px 0;
  background: var(--bg-primary);
  border-right: 1px solid var(--bg-secondary);
  user-select: none;
  overflow: hidden;
  min-width: 48px;
  text-align: right;
}

.line-num {
  padding: 0 12px 0 8px;
  font-size: 12px;
  line-height: 20px;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
}

.code-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.code-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 12px;
  background: var(--bg-primary);
  border: none;
  overflow: auto;
  pointer-events: none;
  font-size: 13px;
  line-height: 20px;
  font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
  white-space: pre;
  color: var(--text-primary);
}

.code-highlight code {
  font-family: inherit;
}

.code-textarea {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  color: transparent;
  caret-color: var(--text-primary);
  font-size: 13px;
  line-height: 20px;
  font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
  resize: none;
  outline: none;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
  z-index: 1;
}

.code-textarea::selection {
  background: rgba(59, 130, 246, 0.3);
}

.editor-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  margin-bottom: 12px;
  color: var(--border-color);
}

.empty-content p {
  font-size: 13px;
}
</style>
