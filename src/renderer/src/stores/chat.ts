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

export type AgentMode = 'build' | 'plan' | 'compose'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const currentMessage = ref<Message | null>(null)
  const mode = ref<AgentMode>('build')

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

    removeChunkListener = window.mimo.chat.onChunk((chunk: { type: string; content: string }) => {
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
        }
      }
    })

    removeDoneListener = window.mimo.chat.onDone(() => {
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

    removeChunkListener = window.mimo.chat.onChunk((chunk: { type: string; content: string }) => {
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
        }
      }
    })

    removeDoneListener = window.mimo.chat.onDone(() => {
      cleanup()
    })

    try {
      await window.mimo.chat.redo()
    } catch (err) {
      console.error('[ChatStore] redo error:', err)
      cleanup()
    }
  }

  return { messages, isStreaming, currentMessage, mode, send, stop, clear, setMode, initMode, undo, redo }
})
