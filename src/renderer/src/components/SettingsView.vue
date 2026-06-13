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
          <ModelSelector @provider-change="onProviderChange" />
        </div>

        <!-- Custom URL Config -->
        <template v-if="selectedProvider === 'custom'">
          <div class="form-row">
            <label>自定义请求地址 <span class="required">*</span></label>
            <div class="input-header">
              <span class="hint">完整 URL</span>
              <button
                :class="['switch', { on: settings.isCustomUrl }]"
                @click="settings.isCustomUrl = !settings.isCustomUrl"
              >
                <span class="switch-thumb"></span>
              </button>
            </div>
            <input
              v-model="settings.customBaseUrl"
              :placeholder="settings.isCustomUrl ? 'e.g. https://api.example.com/v1/chat/completions' : 'e.g. https://api.openai.com/v1'"
            />
            <div class="info-box">
              <span class="info-icon">i</span>
              <span>请填写兼容 OpenAI API 的服务端点地址，不要以斜杠结尾。<br>/chat/completions 将会被补充到你填写的地址末尾。</span>
            </div>
          </div>

          <div class="form-row">
            <label>模型 ID <span class="required">*</span></label>
            <div class="input-header">
              <span class="hint">多模态</span>
              <button
                :class="['switch', { on: settings.isMultimodal }]"
                @click="settings.isMultimodal = !settings.isMultimodal"
              >
                <span class="switch-thumb"></span>
              </button>
            </div>
            <input v-model="settings.customModelId" placeholder="输入模型 ID" />
          </div>
        </template>

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

        <!-- Advanced Config -->
        <template v-if="selectedProvider === 'custom'">
          <div class="advanced-section">
            <button class="advanced-toggle" @click="showAdvanced = !showAdvanced">
              <svg :class="['chevron', { expanded: showAdvanced }]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
              高级配置
            </button>
            <div v-if="showAdvanced" class="advanced-content">
              <div class="form-row">
                <label>模型系列</label>
                <span class="field-hint">针对特定模型系列优化了 Prompt 和超参，未选择时使用默认配置。</span>
                <select v-model="settings.modelFamily">
                  <option value="">默认</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="qwen">Qwen</option>
                </select>
              </div>

              <div class="form-row">
                <label>模型展示名称</label>
                <span class="field-hint">在模型列表中展示的名称，未设置时默认显示 Model ID。</span>
                <div class="input-with-count">
                  <input v-model="settings.displayName" placeholder="请输入模型展示名称" maxlength="32" />
                  <span class="char-count">{{ (settings.displayName || '').length }}/32</span>
                </div>
              </div>

              <div class="form-row">
                <label>上下文窗口</label>
                <div class="context-inputs">
                  <div class="context-field">
                    <span class="context-label">输入</span>
                    <input type="number" v-model.number="settings.inputContextWindow" placeholder="184000" />
                  </div>
                  <div class="context-field">
                    <span class="context-label">输出</span>
                    <input type="number" v-model.number="settings.outputContextWindow" placeholder="16000" />
                  </div>
                </div>
              </div>

              <div class="form-row">
                <label>工具调用轮次</label>
                <input type="number" v-model.number="settings.maxToolRounds" placeholder="200" />
              </div>
            </div>
          </div>
        </template>
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
        <div class="form-row">
          <label>颜色模式</label>
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

        <div class="form-row">
          <label>配色方案</label>
          <div class="color-theme-grid">
            <button
              v-for="colorTheme in colorThemes"
              :key="colorTheme.name"
              :class="['color-theme-card', { active: settings.colorTheme === colorTheme.name }]"
              @click="settings.colorTheme = colorTheme.name"
            >
              <div class="color-preview">
                <span class="color-swatch" :style="{ background: colorTheme.theme?.primary?.dark || '#3b82f6' }"></span>
                <span class="color-swatch" :style="{ background: colorTheme.theme?.background?.dark || '#1e293b' }"></span>
                <span class="color-swatch" :style="{ background: colorTheme.theme?.text?.dark || '#e2e8f0' }"></span>
              </div>
              <span class="color-theme-name">{{ colorTheme.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Providers -->
    <div class="settings-panel" v-show="activeTab === 'providers'">
      <div class="panel-header">
        <h3>提供商管理</h3>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <label>启用的提供商</label>
          <span class="field-hint">留空表示启用所有提供商</span>
          <input v-model="settings.enabledProviders" placeholder="anthropic,openai (逗号分隔)" />
        </div>
        <div class="form-row">
          <label>禁用的提供商</label>
          <span class="field-hint">禁用的提供商不会出现在模型列表中</span>
          <input v-model="settings.disabledProviders" placeholder="openai,gemini (逗号分隔)" />
        </div>
        <div class="info-box">
          <span class="info-icon">i</span>
          <span>禁用列表优先于启用列表。配置后需要重启应用生效。</span>
        </div>
      </div>
    </div>

    <!-- Permissions -->
    <div class="settings-panel" v-show="activeTab === 'permissions'">
      <div class="panel-header">
        <h3>权限配置</h3>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <label>全局权限</label>
          <select v-model="settings.globalPermission">
            <option value="allow">允许 (allow) - 无需审批</option>
            <option value="ask">询问 (ask) - 每次审批</option>
            <option value="deny">拒绝 (deny) - 禁止操作</option>
          </select>
        </div>
        <div class="permission-list">
          <div class="permission-item">
            <span class="perm-name">bash</span>
            <select v-model="settings.permissionBash">
              <option value="allow">允许</option>
              <option value="ask">询问</option>
              <option value="deny">拒绝</option>
            </select>
          </div>
          <div class="permission-item">
            <span class="perm-name">edit</span>
            <select v-model="settings.permissionEdit">
              <option value="allow">允许</option>
              <option value="ask">询问</option>
              <option value="deny">拒绝</option>
            </select>
          </div>
          <div class="permission-item">
            <span class="perm-name">webfetch</span>
            <select v-model="settings.permissionWebfetch">
              <option value="allow">允许</option>
              <option value="ask">询问</option>
              <option value="deny">拒绝</option>
            </select>
          </div>
          <div class="permission-item">
            <span class="perm-name">skill</span>
            <select v-model="settings.permissionSkill">
              <option value="allow">允许</option>
              <option value="ask">询问</option>
              <option value="deny">拒绝</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Environment Variables -->
    <div class="settings-panel" v-show="activeTab === 'envvars'">
      <div class="panel-header">
        <h3>环境变量</h3>
      </div>
      <div class="panel-body">
        <div class="env-var-list">
          <div v-for="(envVar, idx) in settings.envVars" :key="idx" class="env-var-item">
            <input v-model="envVar.key" placeholder="变量名" class="env-key" />
            <input v-model="envVar.value" placeholder="值" class="env-value" type="password" />
            <button class="remove-btn" @click="removeEnvVar(idx)">×</button>
          </div>
        </div>
        <button class="add-btn" @click="addEnvVar">+ 添加环境变量</button>
        <div class="info-box">
          <span class="info-icon">i</span>
          <span>常用的 MiMo 环境变量：<br>
            - MIMO_MULTIMODAL: 1 (启用多模态)<br>
            - MIMO_MODEL_FAMILY: openai/anthropic/google<br>
            - MIMO_MAX_TOOL_ROUNDS: 200<br>
            - MIMOCODE_ENABLE_EXA: 1 (启用 websearch)
          </span>
        </div>
      </div>
    </div>

    <!-- Network -->
    <div class="settings-panel" v-show="activeTab === 'network'">
      <div class="panel-header">
        <h3>网络配置</h3>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <label>HTTPS 代理</label>
          <input v-model="settings.httpsProxy" placeholder="https://proxy.example.com:8080" />
          <span class="field-hint">用于 API 请求的 HTTPS 代理地址</span>
        </div>
        <div class="form-row">
          <label>HTTP 代理</label>
          <input v-model="settings.httpProxy" placeholder="http://proxy.example.com:8080" />
          <span class="field-hint">当 HTTPS 代理不可用时使用</span>
        </div>
        <div class="form-row">
          <label>不使用代理的地址</label>
          <input v-model="settings.noProxy" placeholder="localhost,127.0.0.1" />
          <span class="field-hint">逗号分隔的地址列表，这些地址不走代理</span>
        </div>
        <div class="form-row">
          <label>自定义 CA 证书</label>
          <input v-model="settings.caCert" placeholder="/path/to/ca-cert.pem" />
          <span class="field-hint">企业自定义 CA 证书路径 (NODE_EXTRA_CA_CERTS)</span>
        </div>
        <div class="info-box">
          <span class="info-icon">i</span>
          <span>代理和证书配置会作为环境变量传递给 MiMo CLI。配置后需要重启应用生效。</span>
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

interface ColorTheme {
  name: string
  description: string
  theme: Record<string, { dark: string; light: string }>
}

interface Settings {
  apiKey: string
  model: string
  theme: 'dark' | 'light' | 'system'
  colorTheme: string
  autoSave: boolean
  autoSaveInterval: number
  fontSize: number
  customBaseUrl: string
  isCustomUrl: boolean
  customModelId: string
  isMultimodal: boolean
  modelFamily: string
  displayName: string
  inputContextWindow: number
  outputContextWindow: number
  maxToolRounds: number
}

defineProps<{
  activeTab: string
}>()

const themes = [
  { value: 'dark' as const, label: '深色' },
  { value: 'light' as const, label: '浅色' },
  { value: 'system' as const, label: '跟随系统' }
]

const colorThemes = ref<ColorTheme[]>([])

const settings = ref<Settings>({
  apiKey: '',
  model: 'mimo-auto',
  theme: 'dark',
  colorTheme: 'default',
  autoSave: true,
  autoSaveInterval: 60,
  fontSize: 14,
  customBaseUrl: '',
  isCustomUrl: false,
  customModelId: '',
  isMultimodal: true,
  modelFamily: '',
  displayName: '',
  inputContextWindow: 184000,
  outputContextWindow: 16000,
  maxToolRounds: 200
})

const showApiKey = ref(false)
const showAdvanced = ref(false)
const saved = ref(false)
const selectedProvider = ref('mimo')

function onProviderChange(providerId: string) {
  selectedProvider.value = providerId
}

onMounted(async () => {
  try {
    const loaded = await window.mimo.settings.get()
    settings.value = { ...settings.value, ...loaded }
  } catch (err) {
    console.error('Failed to load settings:', err)
  }

  try {
    colorThemes.value = await window.mimo.themes.list()
  } catch (err) {
    console.error('Failed to load color themes:', err)
    colorThemes.value = []
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
      settings.value = { ...settings.value, ...reset }
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
  color: var(--text-primary);
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
  color: var(--text-primary);
}

.required {
  color: var(--error-color);
}

.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.form-row input {
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
}

.form-row input:focus {
  border-color: var(--accent-color);
  outline: none;
}

.info-box {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: var(--accent-muted);
  border: 1px solid var(--accent-color);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: var(--accent-color);
  color: white;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.input-group {
  display: flex;
  gap: 8px;
}

.input-group input {
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
}

.input-group input:focus {
  border-color: var(--accent-color);
  outline: none;
}

.input-btn {
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: none;
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
}

.input-btn:hover {
  background: var(--border-active);
}

select {
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
}

select:focus {
  border-color: var(--accent-color);
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
  background: var(--bg-tertiary);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.range-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent-color);
  border-radius: 50%;
  cursor: pointer;
}

.range-value {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 35px;
}

.switch {
  width: 44px;
  height: 24px;
  background: var(--bg-tertiary);
  border: none;
  border-radius: 12px;
  padding: 2px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.switch.on {
  background: var(--accent-color);
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

.advanced-section {
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.advanced-toggle:hover {
  color: var(--text-primary);
}

.chevron {
  transition: transform 0.2s;
}

.chevron.expanded {
  transform: rotate(180deg);
}

.advanced-content {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: -4px;
}

.input-with-count {
  position: relative;
}

.input-with-count input {
  width: 100%;
  padding-right: 40px;
}

.char-count {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--text-muted);
}

.context-inputs {
  display: flex;
  gap: 12px;
}

.context-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.context-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.context-field input {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
}

.context-field input:focus {
  border-color: var(--accent-color);
  outline: none;
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
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.theme-card:hover {
  border-color: var(--border-active);
}

.theme-card.active {
  border-color: var(--accent-color);
  background: var(--accent-muted);
}

.theme-preview {
  width: 48px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
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
  color: var(--text-secondary);
}

.theme-card.active .theme-name {
  color: var(--accent-color);
}

.color-theme-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.color-theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.color-theme-card:hover {
  border-color: var(--border-active);
}

.color-theme-card.active {
  border-color: var(--accent-color);
  background: var(--accent-muted);
}

.color-preview {
  display: flex;
  gap: 4px;
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.color-theme-name {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: capitalize;
}

.color-theme-card.active .color-theme-name {
  color: var(--accent-color);
}

.danger-zone {
  padding: 16px;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
}

.danger-zone p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.danger-btn {
  padding: 8px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: var(--error-color);
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
  color: var(--success-color);
  background: rgba(34, 197, 94, 0.1);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(34, 197, 94, 0.2);
}
</style>
