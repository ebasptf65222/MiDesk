<template>
  <div class="inline-edit-overlay" v-if="visible" @click.self="cancel">
    <div class="inline-edit-popup" :style="positionStyle">
      <div class="edit-header">
        <span>内联编辑</span>
        <button class="close-btn" @click="cancel">×</button>
      </div>
      <textarea
        v-model="instruction"
        placeholder="描述你想如何修改这段代码... (Ctrl+Enter 应用)"
        rows="3"
        ref="inputEl"
        @keydown.enter.ctrl="apply"
        @keydown.esc="cancel"
      ></textarea>
      <div class="edit-actions">
        <button @click="cancel" class="cancel-btn">取消</button>
        <button @click="apply" class="apply-btn" :disabled="!instruction.trim() || loading">
          {{ loading ? '生成中...' : '应用' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  position: { top: number; left: number }
  selectedCode: string
}>()

const emit = defineEmits<{
  (e: 'apply', instruction: string): void
  (e: 'cancel'): void
}>()

const instruction = ref('')
const loading = ref(false)
const inputEl = ref<HTMLTextAreaElement>()

const positionStyle = computed(() => ({
  top: `${props.position.top}px`,
  left: `${props.position.left}px`
}))

watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => inputEl.value?.focus())
  }
})

function apply() {
  if (instruction.value.trim()) {
    loading.value = true
    emit('apply', instruction.value)
  }
}

function cancel() {
  instruction.value = ''
  loading.value = false
  emit('cancel')
}
</script>

<style scoped>
.inline-edit-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.3);
}

.inline-edit-popup {
  position: absolute;
  width: 360px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  padding: 16px;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
}

.close-btn:hover {
  color: #e2e8f0;
}

textarea {
  width: 100%;
  padding: 10px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  resize: none;
  font-size: 13px;
  box-sizing: border-box;
}

textarea:focus {
  outline: none;
  border-color: #6366f1;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.cancel-btn {
  padding: 6px 12px;
  background: #334155;
  color: #94a3b8;
  border-radius: 6px;
  font-size: 12px;
}

.cancel-btn:hover {
  background: #475569;
}

.apply-btn {
  padding: 6px 16px;
  background: #6366f1;
  color: white;
  border-radius: 6px;
  font-size: 12px;
}

.apply-btn:hover:not(:disabled) {
  background: #4f46e5;
}

.apply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
