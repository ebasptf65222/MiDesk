<template>
  <div class="settings-view">
    <!-- AI Config -->
    <div class="settings-panel" v-show="activeTab === 'ai'">
      <div class="panel-header">
        <h3>AI 配置</h3>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <label>模型提供商</label>
          <ModelSelector />
        </div>
        <div class="form-row">
          <label>API Key</label>
          <div class="input-group">
            <input
              :type="showApiKey ? 'text' : 'password'"
              v-model="settings.apiKey"
              placeholder="输入你的 API Key"
            />
            <button class="input-btn" @click="showApiKey = !showApiKey">
              {{ showApiKey ? '隐藏' : '显示' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor Config -->
    <div class="settings-panel" v-show="activeTab === 'editor'">
      <div class="panel-header">
        <h3>编辑器</h3>
      </div>
      <div class="panel-body">
        <div class="form-row inline">
          <label>字体大小</label>
          <div class="range-control">
            <input
              type="range"
              v-model.number="settings.fontSize"
              min="12"
              max="20"
              step="1"
            />
            <span class="range-value">{{ settings.fontSize }}px</span>
          </div>
        </div>
        <div class="form-row inline">
          <label>自动保存</label>
          <button
            :class="['switch', { on: settings.autoSave }]"
            @click="settings.autoSave = !settings.autoSave"
          >
            <span class="switch-thumb"></span>
          </button>
        </div>
        <div class="form-row inline" v-if="settings.autoSave">
          <label>保存间隔</label>
          <select v-model.number="settings.autoSaveInterval" class="small-select">
            <option :value="30">30秒</option>
            <option :value="60">1分钟</option>
            <option :value="300">5分钟</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Appearance -->
    <div class="settings-panel" v-show="activeTab === 'appearance'">
      <div class="panel-header">
        <h3>外观</h3>
      </div>
      <div class="panel-body">
        <div class="theme-grid">
          <button
            v-for="theme in themes"
            :key="theme.value"
            :class="['theme-card', { active: settings.theme === theme.value }]"
            @click="settings.theme = theme.value"
          >
            <span class="theme-preview" :class="theme.value"></span>
            <span class="theme-name">{{ theme.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Data -->
    <div class="settings-panel" v-show="activeTab === 'data'">
      <div class="panel-header">
        <h3>数据管理</h3>
      </div>
      <div class="panel-body">
        <div class="danger-zone">
          <p>重置所有设置恢复为默认值</p>
          <button class="danger-btn" @click="resetSettings">重置设置</button>
        </div>
      </div>
    </div>

    <div class="save-indicator" v-if="saved">✓ 已保存</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import ModelSelector from './ModelSelector.vue'

interface Settings {
  apiKey: string
  model: string
  theme: 'dark' | 'light' | 'system'
  autoSave: boolean
  autoSaveInterval: number
  fontSize: number
}

defineProps<{
  activeTab: string
}>()

const themes = [
  { value: 'dark' as const, label: '深色' },
  { value: 'light' as const, label: '浅色' },
  { value: 'system' as const, label: '跟随系统' }
]

const settings = ref<Settings>({
  apiKey: '',
  model: 'mimo-auto',
  theme: 'dark',
  autoSave: true,
  autoSaveInterval: 60,
  fontSize: 14
})

const showApiKey = ref(false)
const saved = ref(false)

onMounted(async () => {
  try {
    const loaded = await window.mimo.settings.get()
    settings.value = loaded
  } catch (err) {
    console.error('Failed to load settings:', err)
  }
})

async function save() {
  try {
    await window.mimo.settings.update(settings.value)
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch (err) {
    console.error('Failed to save settings:', err)
  }
}

async function resetSettings() {
  if (confirm('确定要重置所有设置吗？')) {
    try {
      const reset = await window.mimo.settings.reset()
      settings.value = reset
    } catch (err) {
      console.error('Failed to reset settings:', err)
    }
  }
}

watch(settings, () => {
  save()
}, { deep: true })
</script>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

.settings-panel {
  max-width: 480px;
}

.panel-header {
  margin-bottom: 20px;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row.inline {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.form-row label {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
}

.input-group {
  display: flex;
  gap: 8px;
}

.input-group input {
  flex: 1;
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
}

.input-group input:focus {
  border-color: #3b82f6;
  outline: none;
}

.input-btn {
  padding: 8px 12px;
  background: #334155;
  border: none;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 12px;
  cursor: pointer;
}

.input-btn:hover {
  background: #475569;
}

select {
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
}

select:focus {
  border-color: #3b82f6;
  outline: none;
}

.small-select {
  width: auto;
}

.range-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.range-control input[type="range"] {
  width: 120px;
  height: 4px;
  background: #334155;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.range-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
}

.range-value {
  font-size: 12px;
  color: #94a3b8;
  min-width: 35px;
}

.switch {
  width: 44px;
  height: 24px;
  background: #334155;
  border: none;
  border-radius: 12px;
  padding: 2px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.switch.on {
  background: #3b82f6;
}

.switch-thumb {
  display: block;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.switch.on .switch-thumb {
  transform: translateX(20px);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: #1e293b;
  border: 2px solid #334155;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.theme-card:hover {
  border-color: #475569;
}

.theme-card.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.theme-preview {
  width: 48px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid #334155;
}

.theme-preview.dark {
  background: linear-gradient(135deg, #1e293b 50%, #0f172a 50%);
}

.theme-preview.light {
  background: linear-gradient(135deg, #ffffff 50%, #f1f5f9 50%);
}

.theme-preview.system {
  background: linear-gradient(135deg, #1e293b 50%, #ffffff 50%);
}

.theme-name {
  font-size: 12px;
  color: #94a3b8;
}

.theme-card.active .theme-name {
  color: #60a5fa;
}

.danger-zone {
  padding: 16px;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
}

.danger-zone p {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.danger-btn {
  padding: 8px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #ef4444;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.danger-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.save-indicator {
  position: fixed;
  bottom: 40px;
  right: 20px;
  font-size: 12px;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(34, 197, 94, 0.2);
}
</style>
