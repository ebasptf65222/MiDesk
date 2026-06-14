import { defineStore } from 'pinia'
import { ref, markRaw } from 'vue'
import type { Component } from 'vue'

export interface MessageTypeConfig {
  type: string
  component: Component
  icon?: string
  color?: string
  defaultCollapsed?: boolean
}

export const useMessageRegistry = defineStore('messageRegistry', () => {
  const messageTypes = ref<Map<string, MessageTypeConfig>>(new Map())

  function registerType(config: MessageTypeConfig) {
    messageTypes.value.set(config.type, {
      ...config,
      component: markRaw(config.component)
    })
  }

  function getTypeConfig(type: string) {
    return messageTypes.value.get(type)
  }

  function hasType(type: string) {
    return messageTypes.value.has(type)
  }

  return { registerType, getTypeConfig, hasType }
})