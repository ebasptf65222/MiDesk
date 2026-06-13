import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ModelProvider {
  id: string
  name: string
  baseUrl: string
  models: ModelInfo[]
  apiKeyRequired: boolean
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  contextLength: number
  description: string
}

export interface ProviderConfig {
  providerId: string
  apiKey: string
  baseUrl?: string
}

export const useModelsStore = defineStore('models', () => {
  const providers = ref<ModelProvider[]>([])
  const configs = ref<Map<string, ProviderConfig>>(new Map())
  const selectedProvider = ref<string>('mimo')
  const selectedModel = ref<string>('mimo-auto')
  const loading = ref(false)

  async function loadProviders() {
    loading.value = true
    try {
      providers.value = await window.mimo.models.providers()
      for (const provider of providers.value) {
        const config = await window.mimo.models.getConfig(provider.id)
        if (config) {
          configs.value.set(provider.id, config)
        }
      }
    } finally {
      loading.value = false
    }
  }

  async function saveConfig(config: ProviderConfig) {
    await window.mimo.models.setConfig(config)
    configs.value.set(config.providerId, config)
  }

  async function removeConfig(providerId: string) {
    await window.mimo.models.removeConfig(providerId)
    configs.value.delete(providerId)
  }

  async function testConnection(providerId: string) {
    return window.mimo.models.test(providerId)
  }

  function getModelsByProvider(providerId: string): ModelInfo[] {
    const provider = providers.value.find(p => p.id === providerId)
    return provider?.models || []
  }

  function selectModel(providerId: string, modelId: string) {
    selectedProvider.value = providerId
    selectedModel.value = modelId
  }

  return {
    providers,
    configs,
    selectedProvider,
    selectedModel,
    loading,
    loadProviders,
    saveConfig,
    removeConfig,
    testConnection,
    getModelsByProvider,
    selectModel
  }
})
