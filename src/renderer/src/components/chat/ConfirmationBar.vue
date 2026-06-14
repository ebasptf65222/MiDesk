<template>
  <div v-if="hasPendingConfirmation" class="confirmation-bar">
    <div class="confirmation-content">
      <div class="confirmation-question">
        <svg class="question-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>{{ currentConfirmation?.question }}</span>
      </div>
      <div class="confirmation-options">
        <button 
          v-for="option in currentConfirmation?.options" 
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePermissionStore } from '../../stores/permission'
import { useChatStore } from '../../stores/chat'

const permissionStore = usePermissionStore()
const chatStore = useChatStore()

const hasPendingConfirmation = computed(() => permissionStore.isConfirming)
const currentConfirmation = computed(() => {
  const entries = Array.from(permissionStore.pendingConfirmations.entries())
  return entries.length > 0 ? entries[0][1] : null
})

function handleApprove() {
  if (currentConfirmation.value) {
    permissionStore.resolveConfirmation(currentConfirmation.value.id, true)
    chatStore.respondToConfirmation(currentConfirmation.value.id, true)
  }
}

function handleReject() {
  if (currentConfirmation.value) {
    permissionStore.resolveConfirmation(currentConfirmation.value.id, false)
    chatStore.respondToConfirmation(currentConfirmation.value.id, false)
  }
}

function handleOption(value: string) {
  if (currentConfirmation.value) {
    permissionStore.resolveConfirmation(currentConfirmation.value.id, true, value)
    chatStore.respondToConfirmation(currentConfirmation.value.id, true, value)
  }
}
</script>

<style scoped>
.confirmation-bar {
  background: #1e3a5f;
  border-top: 1px solid #2563eb;
  padding: 12px 16px;
  position: sticky;
  bottom: 0;
}

.confirmation-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.confirmation-question {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #e5e7eb;
}

.question-icon {
  color: #60a5fa;
  flex-shrink: 0;
  margin-top: 2px;
}

.confirmation-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-btn {
  padding: 6px 12px;
  border: 1px solid #4b5563;
  border-radius: 6px;
  background: #374151;
  color: #e5e7eb;
  font-size: 13px;
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
  gap: 8px;
}

.action-btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
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
