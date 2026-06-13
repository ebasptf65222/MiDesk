<template>
  <div class="model-selector">
    <select v-model="selectedProvider" @change="onProviderChange">
      <option v-for="provider in modelsStore.providers" :key="provider.id" :value="provider.id">
        {{ provider.name }}
      </option>
    </select>
    <select v-model="selectedModel" @change="onModelChange">
      <option v-for="model in availableModels" :key="model.id" :value="model.id">
        {{ model.name }} - {{ model.description }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useModelsStore } from '../stores/models'

const modelsStore = useModelsStore()
const selectedProvider = ref('mimo')
const selectedModel = ref('mimo-auto')

const availableModels = computed(() => {
  return modelsStore.getModelsByProvider(selectedProvider.value)
})

onMounted(() => {
  modelsStore.loadProviders()
})

function onProviderChange() {
  selectedModel.value = availableModels.value[0]?.id || ''
  modelsStore.selectModel(selectedProvider.value, selectedModel.value)
}

function onModelChange() {
  modelsStore.selectModel(selectedProvider.value, selectedModel.value)
}
</script>

<style scoped>
.model-selector {
  display: flex;
  gap: 8px;
}

.model-selector select {
  flex: 1;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
}
</style>
