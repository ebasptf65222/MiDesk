import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Message, MessagePart, ToolCallInfo, ConfirmationRequest } from '../types/chat'

export type { Message, MessagePart, ToolCallInfo }

export type AgentMode = 'build' | 'plan' | 'compose'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const currentMessage = ref<Message | null>(null)
  const mode = ref<AgentMode>('build')

  const MAX_MESSAGES = 1000 // 限制最大消息数量

  let removeChunkListener: (() => void) | null = null
  let removeDoneListener: (() => void) | null = null

  function cleanup() {
    console.log('[ChatStore] cleanup called')
    removeChunkListener?.()
    removeChunkListener = null
    removeDoneListener?.()
    removeDoneListener = null
    isStreaming.value = false
    currentMessage.value = null
  }

  // 限制消息数量，防止内存无限增长
  function limitMessages() {
    if (messages.value.length > MAX_MESSAGES) {
      messages.value = messages.value.slice(-MAX_MESSAGES)
    }
  }

  async function setMode(newMode: AgentMode) {
    mode.value = newMode
    await window.mimo.chat.setAgent(newMode)
  }

  async function initMode() {
    try {
      const agent = await window.mimo.chat.getAgent()
      if (agent) {
        mode.value = agent as AgentMode
      }
    } catch {
      mode.value = 'build'
    }
  }

  async function send(message: string) {
    if (!message.trim() || isStreaming.value) {
      console.log('[ChatStore] send blocked, empty or already streaming')
      return
    }

    console.log('[ChatStore] sending:', message)

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', content: message }],
      content: message,
      accumulatedText: message,
      timestamp: Date.now()
    }
    messages.value.push(userMsg)

    const assistantMsg: Message = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      parts: [],
      content: '',
      accumulatedText: '',
      timestamp: Date.now()
    }
    messages.value.push(assistantMsg)
    currentMessage.value = assistantMsg

    isStreaming.value = true

    // Listen for chunks BEFORE sending
    removeChunkListener = window.mimo.chat.onChunk((chunk: { type: string; content: string; metadata?: Record<string, unknown> }) => {
      console.log('[ChatStore] chunk received, type:', chunk.type)

      if (currentMessage.value) {
        if (chunk.type === 'text') {
          // Incremental: accumulate text into ONE part, update content in place
          currentMessage.value.accumulatedText += chunk.content
          currentMessage.value.content = currentMessage.value.accumulatedText

          const parts = currentMessage.value.parts
          const lastPart = parts[parts.length - 1]
          if (lastPart?.type === 'text') {
            lastPart.content = currentMessage.value.accumulatedText
          } else {
            parts.push({
              type: 'text',
              content: currentMessage.value.accumulatedText
            })
          }
        } else if (chunk.type === 'confirmation') {
          try {
            const request: ConfirmationRequest = JSON.parse(chunk.content)
            currentMessage.value.parts.push({
              type: 'confirmation',
              content: chunk.content,
              metadata: { confirmationId: request.id }
            })
          } catch {
            currentMessage.value.parts.push({
              type: 'confirmation',
              content: chunk.content
            })
          }
        } else if (chunk.type === 'error') {
          currentMessage.value.parts.push({
            type: 'error',
            content: chunk.content
          })
          currentMessage.value.status = 'error'
        } else if (chunk.type === 'progress') {
          currentMessage.value.parts.push({
            type: 'progress',
            content: chunk.content,
            metadata: chunk.metadata
          })
          currentMessage.value.status = 'running'
        } else {
          // Other types (thinking, tool_use, tool_result) — push as separate parts
          currentMessage.value.parts.push({
            type: chunk.type as MessagePart['type'],
            content: chunk.content,
            metadata: chunk.metadata
          })
        }
      }
    })

    // Listen for done event
    removeDoneListener = window.mimo.chat.onDone(() => {
      console.log('[ChatStore] done received')
      limitMessages()
      cleanup()
    })

    try {
      console.log('[ChatStore] calling mimo.chat.send')
      await window.mimo.chat.send(message)
      console.log('[ChatStore] mimo.chat.send resolved')
    } catch (err) {
      console.error('[ChatStore] error:', err)
      if (currentMessage.value) {
        currentMessage.value.accumulatedText += `\n[Error: ${err}]`
        currentMessage.value.content = currentMessage.value.accumulatedText
        const parts = currentMessage.value.parts
        const lastPart = parts[parts.length - 1]
        if (lastPart?.type === 'text') {
          lastPart.content = currentMessage.value.accumulatedText
        } else {
          parts.push({
            type: 'text',
            content: currentMessage.value.accumulatedText
          })
        }
      }
      cleanup()
    }
  }

  async function stop() {
    await window.mimo.chat.stop()
    cleanup()
  }

  function clear() {
    messages.value = []
    currentMessage.value = null
  }

  async function respondToConfirmation(id: string, approved: boolean, selectedOption?: string) {
    await window.mimo.chat.confirmResponse({ id, approved, selectedOption })
  }

  async function undo() {
    if (isStreaming.value) return

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', content: '/undo' }],
      content: '/undo',
      accumulatedText: '/undo',
      timestamp: Date.now()
    }
    messages.value.push(userMsg)

    const assistantMsg: Message = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      parts: [],
      content: '',
      accumulatedText: '',
      timestamp: Date.now()
    }
    messages.value.push(assistantMsg)
    currentMessage.value = assistantMsg

    isStreaming.value = true

    removeChunkListener = window.mimo.chat.onChunk((chunk: { type: string; content: string; metadata?: Record<string, unknown> }) => {
      if (currentMessage.value) {
        if (chunk.type === 'text') {
          currentMessage.value.accumulatedText += chunk.content
          currentMessage.value.content = currentMessage.value.accumulatedText
          const parts = currentMessage.value.parts
          const lastPart = parts[parts.length - 1]
          if (lastPart?.type === 'text') {
            lastPart.content = currentMessage.value.accumulatedText
          } else {
            parts.push({ type: 'text', content: currentMessage.value.accumulatedText })
          }
        } else if (chunk.type === 'error') {
          currentMessage.value.parts.push({ type: 'error', content: chunk.content })
        }
      }
    })

    removeDoneListener = window.mimo.chat.onDone(() => {
      limitMessages()
      cleanup()
    })

    try {
      await window.mimo.chat.undo()
    } catch (err) {
      console.error('[ChatStore] undo error:', err)
      cleanup()
    }
  }

  async function redo() {
    if (isStreaming.value) return

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', content: '/redo' }],
      content: '/redo',
      accumulatedText: '/redo',
      timestamp: Date.now()
    }
    messages.value.push(userMsg)

    const assistantMsg: Message = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      parts: [],
      content: '',
      accumulatedText: '',
      timestamp: Date.now()
    }
    messages.value.push(assistantMsg)
    currentMessage.value = assistantMsg

    isStreaming.value = true

    removeChunkListener = window.mimo.chat.onChunk((chunk: { type: string; content: string; metadata?: Record<string, unknown> }) => {
      if (currentMessage.value) {
        if (chunk.type === 'text') {
          currentMessage.value.accumulatedText += chunk.content
          currentMessage.value.content = currentMessage.value.accumulatedText
          const parts = currentMessage.value.parts
          const lastPart = parts[parts.length - 1]
          if (lastPart?.type === 'text') {
            lastPart.content = currentMessage.value.accumulatedText
          } else {
            parts.push({ type: 'text', content: currentMessage.value.accumulatedText })
          }
        } else if (chunk.type === 'error') {
          currentMessage.value.parts.push({ type: 'error', content: chunk.content })
        }
      }
    })

    removeDoneListener = window.mimo.chat.onDone(() => {
      limitMessages()
      cleanup()
    })

    try {
      await window.mimo.chat.redo()
    } catch (err) {
      console.error('[ChatStore] redo error:', err)
      cleanup()
    }
  }

  return { messages, isStreaming, currentMessage, mode, send, stop, clear, setMode, initMode, undo, redo, respondToConfirmation }
})
