import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface MessagePart {
  type: 'text' | 'thinking' | 'tool_use' | 'tool_result'
  content: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: MessagePart[]
  content: string
  accumulatedText: string
  timestamp: number
}

export type AgentMode = 'plan' | 'act'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const currentMessage = ref<Message | null>(null)
  const mode = ref<AgentMode>('act')

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

  function setMode(newMode: AgentMode) {
    mode.value = newMode
  }

  async function send(message: string) {
    if (!message.trim() || isStreaming.value) {
      console.log('[ChatStore] send blocked, empty or already streaming')
      return
    }

    // Add mode context to message
    let fullMessage = message
    if (mode.value === 'plan') {
      fullMessage = `[MODE: PLAN] 你处于规划模式。只分析问题并制定计划，不要执行任何操作。用 markdown 列出步骤。\n\n${message}`
    }

    console.log('[ChatStore] sending:', fullMessage)

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
    removeChunkListener = window.mimo.chat.onChunk((chunk: { type: string; content: string }) => {
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
        } else {
          // Non-text parts (thinking, tool_use, tool_result) — push as separate parts
          currentMessage.value.parts.push({
            type: chunk.type as MessagePart['type'],
            content: chunk.content
          })
        }
      }
    })

    // Listen for done event
    removeDoneListener = window.mimo.chat.onDone(() => {
      console.log('[ChatStore] done received')
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

  return { messages, isStreaming, currentMessage, mode, send, stop, clear, setMode }
})
