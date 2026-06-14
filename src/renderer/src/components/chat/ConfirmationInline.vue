<template>
  <div class="confirmation-inline">
    <div class="confirmation-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span class="confirmation-question">{{ request.question }}</span>
    </div>
    <div v-if="request.options.length > 0" class="confirmation-options">
      <button
        v-for="option in request.options"
        :key="option.value"
        class="option-btn"
        @click="handleOption(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
    <div class="confirmation-actions">
      <button class="action-btn reject" @click="handleReject">拒绝</button>
      <button class="action-btn approve" @click="handleApprove">确认</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '../../stores/chat'
import type { ConfirmationRequest } from '../../types/chat'

const props = defineProps<{
  request: ConfirmationRequest
}>()

const chatStore = useChatStore()

function handleApprove() {
  chatStore.respondToConfirmation(props.request.id, true)
}

function handleReject() {
  chatStore.respondToConfirmation(props.request.id, false)
}

function handleOption(value: string) {
  chatStore.respondToConfirmation(props.request.id, true, value)
}
</script>

<style scoped>
.confirmation-inline {
  background: #1e3a5f;
  border: 1px solid #2563eb;
  border-radius: 8px;
  padding: 10px 12px;
}

.confirmation-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
  color: #e5e7eb;
  font-size: 13px;
}

.confirmation-header svg {
  color: #60a5fa;
  flex-shrink: 0;
  margin-top: 2px;
}

.confirmation-question {
  line-height: 1.4;
}

.confirmation-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.option-btn {
  padding: 5px 10px;
  border: 1px solid #4b5563;
  border-radius: 6px;
  background: #374151;
  color: #e5e7eb;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-btn:hover {
  background: #4b5563;
  border-color: #6b7280;
}

.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.action-btn {
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.reject {
  background: transparent;
  border: 1px solid #4b5563;
  color: #9ca3af;
}

.action-btn.reject:hover {
  background: #374151;
  color: #e5e7eb;
}

.action-btn.approve {
  background: #2563eb;
  border: 1px solid #2563eb;
  color: white;
}

.action-btn.approve:hover {
  background: #1d4ed8;
}
</style>
