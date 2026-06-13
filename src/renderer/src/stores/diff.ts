import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as Diff from 'diff'

export interface DiffChange {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineStart: number
  lineEnd: number
}

export interface DiffFile {
  id: string
  filePath: string
  original: string
  modified: string
  changes: DiffChange[]
}

export const useDiffStore = defineStore('diff', () => {
  const activeDiffs = ref<DiffFile[]>([])
  const activeDiffId = ref<string | null>(null)

  const activeDiff = computed(() =>
    activeDiffs.value.find(d => d.id === activeDiffId.value) || null
  )

  const hasPendingDiffs = computed(() => activeDiffs.value.length > 0)

  function addDiff(filePath: string, original: string, modified: string) {
    const existing = activeDiffs.value.find(d => d.filePath === filePath)
    if (existing) {
      existing.original = original
      existing.modified = modified
      existing.changes = computeChanges(original, modified)
      activeDiffId.value = existing.id
      return existing
    }

    const diff: DiffFile = {
      id: `diff-${Date.now()}`,
      filePath,
      original,
      modified,
      changes: computeChanges(original, modified)
    }

    activeDiffs.value.push(diff)
    activeDiffId.value = diff.id
    return diff
  }

  function removeDiff(diffId: string) {
    const index = activeDiffs.value.findIndex(d => d.id === diffId)
    if (index === -1) return

    activeDiffs.value.splice(index, 1)

    if (activeDiffId.value === diffId) {
      activeDiffId.value = activeDiffs.value[0]?.id || null
    }
  }

  function acceptDiff(diffId: string) {
    const diff = activeDiffs.value.find(d => d.id === diffId)
    if (!diff) return null
    removeDiff(diffId)
    return diff.modified
  }

  function rejectDiff(diffId: string) {
    removeDiff(diffId)
  }

  function computeChanges(original: string, modified: string): DiffChange[] {
    const changes: DiffChange[] = []
    let lineStart = 1

    const diffs = Diff.diffLines(original, modified)

    for (const part of diffs) {
      const lines = part.value.split('\n')
      // Remove empty trailing element from split
      if (lines[lines.length - 1] === '') lines.pop()

      const lineEnd = lineStart + lines.length - 1

      const type = part.added ? 'added' : part.removed ? 'removed' : 'unchanged'

      changes.push({
        type,
        content: lines.join('\n'),
        lineStart,
        lineEnd
      })

      if (!part.added) {
        lineStart = lineEnd + 1
      }
    }

    return changes
  }

  function clear() {
    activeDiffs.value = []
    activeDiffId.value = null
  }

  return {
    activeDiffs,
    activeDiffId,
    activeDiff,
    hasPendingDiffs,
    addDiff,
    removeDiff,
    acceptDiff,
    rejectDiff,
    clear
  }
})
