import { defineStore } from 'pinia'
import { ref } from 'vue'

interface UpdateInfo {
  available: boolean
  version: string | null
  releaseDate: string | null
  releaseNotes?: string
}

interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export const useUpdateStore = defineStore('update', () => {
  const updateInfo = ref<UpdateInfo>({
    available: false,
    version: null,
    releaseDate: null
  })
  const isChecking = ref(false)
  const isDownloading = ref(false)
  const progress = ref<UpdateProgress>({
    percent: 0,
    bytesPerSecond: 0,
    transferred: 0,
    total: 0
  })
  const isDownloaded = ref(false)
  const error = ref<string | null>(null)

  function setUpdateInfo(info: UpdateInfo) {
    updateInfo.value = info
  }

  function setChecking(checking: boolean) {
    isChecking.value = checking
  }

  function setDownloading(downloading: boolean) {
    isDownloading.value = downloading
  }

  function setProgress(newProgress: UpdateProgress) {
    progress.value = newProgress
  }

  function setDownloaded(downloaded: boolean) {
    isDownloaded.value = downloaded
  }

  function setError(err: string | null) {
    error.value = err
  }

  function reset() {
    updateInfo.value = { available: false, version: null, releaseDate: null }
    isChecking.value = false
    isDownloading.value = false
    progress.value = { percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 }
    isDownloaded.value = false
    error.value = null
  }

  return {
    updateInfo,
    isChecking,
    isDownloading,
    progress,
    isDownloaded,
    error,
    setUpdateInfo,
    setChecking,
    setDownloading,
    setProgress,
    setDownloaded,
    setError,
    reset
  }
})
