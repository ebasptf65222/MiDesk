<template>
  <div :class="['message', message.role]">
    <div class="message-avatar">
      <span v-if="message.role === 'user'">U</span>
      <span v-else>M</span>
    </div>
    <div class="message-body">
      <template v-for="(part, idx) in message.parts" :key="idx">
        <!-- Thinking block -->
        <div v-if="part.type === 'thinking' && showThinking" class="thinking-block">
          <div class="thinking-header" @click="toggleThinking(idx)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <span>思考过程</span>
            <svg :class="['chevron', { expanded: expandedThinkings.has(idx) }]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </div>
          <div v-if="expandedThinkings.has(idx)" class="thinking-content">
            {{ part.content }}
          </div>
        </div>

        <!-- Text block -->
        <div v-else-if="part.type === 'text'" class="text-content">
          <MarkdownRender
            :content="message.accumulatedText"
            :max-live-nodes="0"
            :render-batch-size="16"
            :render-batch-delay="8"
            :final="!isStreaming"
          />
        </div>

        <!-- Tool use block -->
        <ToolCallCard 
          v-else-if="part.type === 'tool_use'"
          :name="getToolName(part.content)"
          :args="getToolArgs(part.content)"
          :status="getToolStatus(part.content)"
        />

        <!-- Tool result block -->
        <ToolResultCard
          v-else-if="part.type === 'tool_result'"
          :content="part.content"
          :is-error="isErrorResult(part.content)"
          @retry="handleRetry(part)"
        />

        <!-- Error block -->
        <ErrorCard
          v-else-if="part.type === 'error'"
          :message="part.content"
          @retry="handleRetry(part)"
          @dismiss="handleDismiss(part)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'
import ToolCallCard from './ToolCallCard.vue'
import ToolResultCard from './ToolResultCard.vue'
import ErrorCard from './ErrorCard.vue'
import type { Message, MessagePart } from '../../types/chat'

const props = defineProps<{
  message: Message
  isStreaming: boolean
  showThinking?: boolean
}>()

const emit = defineEmits<{
  retry: [part: MessagePart]
  dismiss: [part: MessagePart]
}>()

const expandedThinkings = ref(new Set<number>())

function toggleThinking(idx: number) {
  if (expandedThinkings.value.has(idx)) {
    expandedThinkings.value.delete(idx)
  } else {
    expandedThinkings.value.add(idx)
  }
}

function getToolName(content: string): string {
  try {
    const parsed = JSON.parse(content)
    return parsed.name || '未知工具'
  } catch {
    return '未知工具'
  }
}

function getToolArgs(content: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(content)
    return parsed.args || {}
  } catch {
    return {}
  }
}

function getToolStatus(content: string): 'pending' | 'running' | 'success' | 'error' {
  try {
    const parsed = JSON.parse(content)
    return parsed.status || 'pending'
  } catch {
    return 'pending'
  }
}

function isErrorResult(content: string): boolean {
  try {
    const parsed = JSON.parse(content)
    return parsed.isError || false
  } catch {
    return false
  }
}

function handleRetry(part: MessagePart) {
  emit('retry', part)
}

function handleDismiss(part: MessagePart) {
  emit('dismiss', part)
}
</script>

<style scoped>
.message {
  display: flex;
  gap: 10px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 2px;
}

.message.user .message-avatar {
  background: #3b82f6;
  color: white;
}

.message.assistant .message-avatar {
  background: #8b5cf6;
  color: white;
}

.message-body {
  flex: 1;
  min-width: 0;
}

.thinking-block {
  margin-bottom: 8px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 6px;
  background: rgba(139, 92, 246, 0.05);
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 12px;
  color: #a78bfa;
  cursor: pointer;
  user-select: none;
}

.thinking-header:hover {
  background: rgba(139, 92, 246, 0.1);
}

.thinking-header svg {
  flex-shrink: 0;
}

.thinking-header span {
  flex: 1;
}

.chevron {
  transition: transform 0.2s;
}

.chevron.expanded {
  transform: rotate(180deg);
}

.thinking-content {
  padding: 0 12px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #94a3b8;
  white-space: pre-wrap;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
}

.text-content {
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
  overflow-wrap: break-word;
  width: 100%;
  min-width: 0;
}

.text-content :deep(.markdown-render) {
  width: 100%;
}

.text-content :deep(p) {
  margin: 0 0 8px;
}

.text-content :deep(p:last-child) {
  margin-bottom: 0;
}

.text-content :deep(pre) {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 12px;
  margin: 8px 0;
  overflow-x: auto;
}

.text-content :deep(code) {
  font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
  font-size: 12px;
}

.text-content :deep(:not(pre) > code) {
  background: #334155;
  padding: 2px 5px;
  border-radius: 3px;
}

.text-content :deep(ul),
.text-content :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.text-content :deep(li) {
  margin: 4px 0;
}
</style>