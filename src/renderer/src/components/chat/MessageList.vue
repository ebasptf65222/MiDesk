<template>
  <div class="message-list" ref="messagesContainer">
    <div v-if="messages.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </div>
      <p>开始对话</p>
      <span>问我任何关于代码的问题</span>
    </div>

    <MessageItem
      v-for="msg in messages"
      :key="msg.id"
      :message="msg"
      :is-streaming="isStreaming"
      :show-thinking="showThinking"
      @retry="handleRetry"
      @dismiss="handleDismiss"
    />

    <div v-if="isStreaming" class="typing-indicator">
      <span></span><span></span><span></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import MessageItem from './MessageItem.vue'
import type { Message, MessagePart } from '../../types/chat'

const props = defineProps<{
  messages: Message[]
  isStreaming: boolean
  showThinking?: boolean
}>()

const emit = defineEmits<{
  retry: [part: MessagePart]
  dismiss: [part: MessagePart]
}>()

const messagesContainer = ref<HTMLDivElement>()

watch(() => props.messages.length, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})

function handleRetry(part: MessagePart) {
  emit('retry', part)
}

function handleDismiss(part: MessagePart) {
  emit('dismiss', part)
}
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.empty-icon {
  margin-bottom: 12px;
  color: #334155;
}

.empty-state p {
  font-size: 15px;
  color: #64748b;
  margin-bottom: 4px;
}

.empty-state span {
  font-size: 12px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: #475569;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>