<template>
  <div class="search-panel" v-if="visible">
    <div class="search-header">
      <div class="search-input-wrapper">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          v-model="searchQuery"
          placeholder="搜索文件内容... (Ctrl+Shift+F)"
          ref="inputEl"
          @keydown.esc="close"
          @keydown.enter="search"
        />
        <div class="search-options">
          <label :class="{ active: useRegex }">
            <input type="checkbox" v-model="useRegex" />
            <span>正则</span>
          </label>
          <label :class="{ active: caseSensitive }">
            <input type="checkbox" v-model="caseSensitive" />
            <span>大小写</span>
          </label>
        </div>
      </div>
    </div>

    <div class="search-results" v-if="results.length > 0">
      <div class="results-count">找到 {{ totalMatches }} 个结果</div>
      <div v-for="result in results" :key="result.file" class="result-file">
        <div class="file-header" @click="toggleFile(result.file)">
          <span class="file-name">{{ result.file }}</span>
          <span class="match-count">{{ result.matches.length }} 个匹配</span>
        </div>
        <div v-if="expandedFiles.has(result.file)" class="file-matches">
          <div
            v-for="(match, idx) in result.matches"
            :key="idx"
            class="match-line"
            @click="goToLine(result.file, match.line)"
          >
            <span class="line-number">{{ match.line }}</span>
            <span class="line-content" v-html="highlightMatch(match.content)"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="search-empty" v-else-if="searchQuery && searched">
      未找到匹配结果
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'openFile', file: string, line: number): void
}>()

const searchQuery = ref('')
const useRegex = ref(false)
const caseSensitive = ref(false)
const results = ref<Array<{ file: string; matches: Array<{ line: number; content: string }> }>>([])
const expandedFiles = ref(new Set<string>())
const searched = ref(false)
const inputEl = ref<HTMLInputElement>()

const totalMatches = computed(() => {
  return results.value.reduce((sum, r) => sum + r.matches.length, 0)
})

function close() {
  emit('close')
}

async function search() {
  if (!searchQuery.value.trim()) {
    results.value = []
    return
  }

  try {
    const searchResults = await window.mimo.file.search(
      '',
      searchQuery.value
    )
    results.value = searchResults
    searched.value = true

    // Auto-expand first result
    if (searchResults.length > 0) {
      expandedFiles.value.add(searchResults[0].file)
    }
  } catch (err) {
    console.error('Search error:', err)
  }
}

function toggleFile(file: string) {
  if (expandedFiles.value.has(file)) {
    expandedFiles.value.delete(file)
  } else {
    expandedFiles.value.add(file)
  }
}

function goToLine(file: string, line: number) {
  emit('openFile', file, line)
}

function highlightMatch(content: string): string {
  const query = searchQuery.value
  if (!query) return content

  try {
    const flags = caseSensitive.value ? 'g' : 'gi'
    const pattern = useRegex.value ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return content.replace(new RegExp(pattern, flags), '<mark>$&</mark>')
  } catch {
    return content
  }
}

onMounted(() => {
  if (props.visible) {
    nextTick(() => inputEl.value?.focus())
  }
})
</script>

<style scoped>
.search-panel {
  position: fixed;
  top: 48px;
  left: 250px;
  right: 320px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  z-index: 100;
  max-height: 50vh;
  overflow: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.search-input-wrapper svg {
  color: #94a3b8;
  flex-shrink: 0;
}

.search-input-wrapper input {
  flex: 1;
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
}

.search-input-wrapper input:focus {
  outline: none;
  border-color: #6366f1;
}

.search-options {
  display: flex;
  gap: 12px;
  font-size: 12px;
  flex-shrink: 0;
}

.search-options label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  opacity: 0.6;
  color: #94a3b8;
}

.search-options label.active {
  opacity: 1;
  color: #6366f1;
}

.search-options input[type="checkbox"] {
  width: 12px;
  height: 12px;
}

.search-results {
  padding: 0 16px 16px;
}

.results-count {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.file-header {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: #0f172a;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 4px;
}

.file-header:hover {
  background: #1a2332;
}

.file-name {
  font-family: monospace;
  font-size: 13px;
  color: #e2e8f0;
}

.match-count {
  font-size: 12px;
  color: #94a3b8;
}

.match-line {
  display: flex;
  gap: 12px;
  padding: 4px 8px;
  cursor: pointer;
  font-family: monospace;
  font-size: 13px;
}

.match-line:hover {
  background: #1a2332;
}

.line-number {
  color: #6366f1;
  min-width: 40px;
  text-align: right;
}

.line-content {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #94a3b8;
}

.line-content :deep(mark) {
  background: #6366f1;
  color: white;
  padding: 0 2px;
  border-radius: 2px;
}

.search-empty {
  padding: 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}
</style>
