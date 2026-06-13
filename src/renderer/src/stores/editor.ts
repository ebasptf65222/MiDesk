import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface FileTab {
  id: string
  name: string
  path: string
  content: string
  originalContent: string
  isModified: boolean
  isBinary?: boolean
}

export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: number
}

export const useEditorStore = defineStore('editor', () => {
  const openFiles = ref<FileTab[]>([])
  const activeFileId = ref<string | null>(null)
  const rootPath = ref<string>('')
  const fileTree = ref<FileEntry[]>([])
  const autoSaveEnabled = ref(true)
  const autoSaveInterval = ref(60)
  let autoSaveTimer: ReturnType<typeof setInterval> | null = null

  const activeFile = computed(() =>
    openFiles.value.find(f => f.id === activeFileId.value) || null
  )

  const hasUnsavedChanges = computed(() =>
    openFiles.value.some(f => f.isModified)
  )

  async function openFile(filePath: string) {
    const existing = openFiles.value.find(f => f.path === filePath)
    if (existing) {
      activeFileId.value = existing.id
      return existing
    }

    const result = await window.mimo.file.read(filePath)
    const name = filePath.split(/[/\\]/).pop() || filePath

    const tab: FileTab = {
      id: `file-${Date.now()}`,
      name,
      path: filePath,
      content: result.content,
      originalContent: result.content,
      isModified: false,
      isBinary: result.isBinary
    }

    openFiles.value.push(tab)
    activeFileId.value = tab.id
    return tab
  }

  function closeFile(fileId: string) {
    const index = openFiles.value.findIndex(f => f.id === fileId)
    if (index === -1) return

    openFiles.value.splice(index, 1)

    if (activeFileId.value === fileId) {
      activeFileId.value = openFiles.value[Math.min(index, openFiles.value.length - 1)]?.id || null
    }
  }

  function updateContent(fileId: string, content: string) {
    const file = openFiles.value.find(f => f.id === fileId)
    if (!file) return
    file.content = content
    file.isModified = content !== file.originalContent
  }

  async function saveFile(fileId: string) {
    const file = openFiles.value.find(f => f.id === fileId)
    if (!file) return

    await window.mimo.file.write(file.path, file.content)
    file.originalContent = file.content
    file.isModified = false
  }

  async function saveAllFiles() {
    for (const file of openFiles.value) {
      if (file.isModified) {
        await saveFile(file.id)
      }
    }
  }

  function startAutoSave() {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
    }

    if (autoSaveEnabled.value && autoSaveInterval.value > 0) {
      autoSaveTimer = setInterval(async () => {
        const modifiedFiles = openFiles.value.filter(f => f.isModified)
        if (modifiedFiles.length > 0) {
          await saveAllFiles()
          console.log('[AutoSave] Saved', modifiedFiles.length, 'files')
        }
      }, autoSaveInterval.value * 1000)
    }
  }

  function stopAutoSave() {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  function setAutoSave(enabled: boolean, interval: number = 60) {
    autoSaveEnabled.value = enabled
    autoSaveInterval.value = interval

    if (enabled) {
      startAutoSave()
    } else {
      stopAutoSave()
    }
  }

  async function refreshTree() {
    if (!rootPath.value) return
    fileTree.value = await window.mimo.file.list(rootPath.value)
  }

  function setRootPath(path: string) {
    rootPath.value = path
    refreshTree()
  }

  return {
    openFiles,
    activeFileId,
    activeFile,
    hasUnsavedChanges,
    rootPath,
    fileTree,
    autoSaveEnabled,
    autoSaveInterval,
    openFile,
    closeFile,
    updateContent,
    saveFile,
    saveAllFiles,
    startAutoSave,
    stopAutoSave,
    setAutoSave,
    refreshTree,
    setRootPath
  }
})
