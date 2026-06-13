<template>
  <div class="mcp-panel">
    <div class="page-header">
      <h1 class="page-title">MCP</h1>
      <p class="page-desc">Model Context Protocol 服务器管理</p>
    </div>

    <div class="content-card">
      <div class="card-header">
        <div class="card-title-section">
          <h2 class="card-title">MCP Servers 管理</h2>
          <p class="card-desc">管理您已添加的 MCP 服务器，可启用、配置或添加新的工具能力。</p>
        </div>
        <div class="card-actions">
          <button class="icon-btn" @click="refresh" title="刷新">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23,4 23,10 17,10"/>
              <polyline points="1,20 1,14 7,14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
          </button>
          <div class="add-dropdown" ref="addDropdownRef">
            <button class="add-btn" @click="showAddMenu = !showAddMenu">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              添加
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </button>
            <div class="dropdown-menu" v-if="showAddMenu">
              <button @click="openAddDialog('local')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                添加本地服务器
              </button>
              <button @click="openAddDialog('json')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="16,18 22,12 16,6"/>
                  <polyline points="8,6 2,12 8,18"/>
                </svg>
                通过 JSON 添加
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Server List -->
      <div class="server-list" v-if="mcpStore.servers.length > 0">
        <div v-for="server in mcpStore.servers" :key="server.id" class="server-item">
          <div class="server-expand" @click="toggleExpand(server.id)">
            <svg :class="['expand-icon', { expanded: expandedServers.has(server.id) }]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </div>
          <div class="server-icon" :class="{ connected: mcpStore.connected.has(server.id) }">
            {{ server.name.charAt(0).toUpperCase() }}
          </div>
          <span class="server-name">{{ server.name }}</span>
          <svg v-if="mcpStore.connected.has(server.id)" class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          <div class="server-spacer"></div>
          <label class="toggle-switch">
            <input type="checkbox" :checked="mcpStore.connected.has(server.id)" @change="toggleServer(server)" />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- Expanded Details -->
        <div v-for="server in mcpStore.servers" :key="'detail-' + server.id">
          <div v-if="expandedServers.has(server.id)" class="server-detail">
            <div class="detail-row">
              <span class="detail-label">命令</span>
              <span class="detail-value code">{{ server.command }} {{ server.args.join(' ') }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">状态</span>
              <span :class="['detail-value', mcpStore.connected.has(server.id) ? 'status-online' : 'status-offline']">
                {{ mcpStore.connected.has(server.id) ? '运行中' : '已停止' }}
              </span>
            </div>
            <div class="detail-actions">
              <button class="btn-text danger" @click="remove(server.id)">删除服务器</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <p>暂无 MCP 服务器，点击上方「添加」按钮创建。</p>
      </div>
    </div>

    <!-- Add Dialog -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showAddDialog" @click.self="showAddDialog = false">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ addMode === 'json' ? '通过 JSON 添加' : '添加本地服务器' }}</h3>
            <button class="modal-close" @click="showAddDialog = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <template v-if="addMode === 'local'">
              <div class="field">
                <label>名称</label>
                <input v-model="newServer.name" placeholder="例如: filesystem" />
              </div>
              <div class="field">
                <label>命令</label>
                <input v-model="newServer.command" placeholder="例如: npx" />
              </div>
              <div class="field">
                <label>参数</label>
                <input v-model="newServer.argsStr" placeholder="例如: -y @modelcontextprotocol/server-filesystem" />
              </div>
            </template>
            <template v-else>
              <div class="field">
                <label>JSON 配置</label>
                <textarea v-model="jsonConfig" rows="12" placeholder='{"name":"my-server","command":"npx","args":["-y","server-package"]}'></textarea>
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showAddDialog = false">取消</button>
            <button class="btn-confirm" @click="addServer" :disabled="!isValid">确认</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMcpStore } from '../stores/mcp'

const mcpStore = useMcpStore()
const showAddMenu = ref(false)
const showAddDialog = ref(false)
const addMode = ref<'local' | 'json'>('local')
const expandedServers = ref(new Set<string>())
const addDropdownRef = ref<HTMLElement>()

const newServer = ref({ name: '', command: '', argsStr: '' })
const jsonConfig = ref('')

const isValid = computed(() => {
  if (addMode.value === 'json') {
    try {
      const config = JSON.parse(jsonConfig.value)
      return config.name && config.command
    } catch {
      return false
    }
  }
  return newServer.value.name && newServer.value.command
})

onMounted(() => {
  mcpStore.loadServers()
  mcpStore.loadTools()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(e: MouseEvent) {
  if (addDropdownRef.value && !addDropdownRef.value.contains(e.target as Node)) {
    showAddMenu.value = false
  }
}

function toggleExpand(id: string) {
  if (expandedServers.value.has(id)) {
    expandedServers.value.delete(id)
  } else {
    expandedServers.value.add(id)
  }
}

async function toggleServer(server: any) {
  if (mcpStore.connected.has(server.id)) {
    await mcpStore.disconnectServer(server.id)
  } else {
    await mcpStore.connectServer(server.id)
  }
}

function refresh() {
  mcpStore.loadServers()
  mcpStore.loadTools()
}

function openAddDialog(mode: 'local' | 'json') {
  addMode.value = mode
  showAddDialog.value = true
  showAddMenu.value = false
  newServer.value = { name: '', command: '', argsStr: '' }
  jsonConfig.value = ''
}

async function addServer() {
  if (!isValid.value) return

  if (addMode.value === 'json') {
    try {
      const config = JSON.parse(jsonConfig.value)
      await mcpStore.addServer({
        name: config.name,
        command: config.command,
        args: config.args || [],
        env: config.env,
        enabled: true
      })
    } catch {}
  } else {
    await mcpStore.addServer({
      name: newServer.value.name,
      command: newServer.value.command,
      args: newServer.value.argsStr.split(' ').filter(Boolean),
      enabled: true
    })
  }

  showAddDialog.value = false
}

async function remove(id: string) {
  await mcpStore.removeServer(id)
  expandedServers.value.delete(id)
}
</script>

<style scoped>
.mcp-panel {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.page-desc {
  font-size: 14px;
  color: #71717a;
  margin: 0;
}

.content-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid #27272a;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #fafafa;
  margin: 0 0 4px 0;
}

.card-desc {
  font-size: 13px;
  color: #71717a;
  margin: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #27272a;
  border: 1px solid #3f3f46;
  border-radius: 8px;
  color: #a1a1aa;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #3f3f46;
  color: #fafafa;
}

.add-dropdown {
  position: relative;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #fafafa;
  border: none;
  border-radius: 8px;
  color: #18181b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #e4e4e7;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 200px;
  background: #27272a;
  border: 1px solid #3f3f46;
  border-radius: 8px;
  padding: 4px;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.dropdown-menu button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  color: #d4d4d8;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}

.dropdown-menu button:hover {
  background: #3f3f46;
  color: #fafafa;
}

.server-list {
  padding: 8px 0;
}

.server-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  transition: background 0.15s;
}

.server-item:hover {
  background: #1f1f23;
}

.server-expand {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  cursor: pointer;
  color: #52525b;
}

.expand-icon {
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.server-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #22c55e;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.server-icon.connected {
  background: #22c55e;
}

.server-name {
  font-size: 14px;
  font-weight: 500;
  color: #e4e4e7;
}

.check-icon {
  flex-shrink: 0;
}

.server-spacer {
  flex: 1;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: #3f3f46;
  border-radius: 12px;
  transition: all 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background: #22c55e;
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.server-detail {
  padding: 16px 24px 16px 56px;
  background: #141416;
  border-top: 1px solid #27272a;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.detail-label {
  font-size: 12px;
  color: #52525b;
  min-width: 48px;
}

.detail-value {
  font-size: 13px;
  color: #a1a1aa;
}

.detail-value.code {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 12px;
  background: #27272a;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-online {
  color: #22c55e;
}

.status-offline {
  color: #71717a;
}

.detail-actions {
  padding-top: 12px;
  margin-top: 8px;
  border-top: 1px solid #27272a;
}

.btn-text {
  background: none;
  border: none;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.btn-text.danger {
  color: #ef4444;
}

.btn-text.danger:hover {
  color: #dc2626;
}

.empty-state {
  padding: 48px 24px;
  text-align: center;
  color: #52525b;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  width: 480px;
  max-width: 90vw;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #27272a;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fafafa;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  color: #71717a;
  border-radius: 6px;
  cursor: pointer;
}

.modal-close:hover {
  background: #27272a;
  color: #fafafa;
}

.modal-body {
  padding: 24px;
}

.field {
  margin-bottom: 20px;
}

.field:last-child {
  margin-bottom: 0;
}

.field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #a1a1aa;
  margin-bottom: 8px;
}

.field input,
.field textarea {
  width: 100%;
  padding: 10px 12px;
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  color: #fafafa;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #52525b;
}

.field input::placeholder,
.field textarea::placeholder {
  color: #3f3f46;
}

.field textarea {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 13px;
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #27272a;
}

.btn-cancel {
  padding: 8px 16px;
  background: #27272a;
  border: 1px solid #3f3f46;
  border-radius: 8px;
  color: #a1a1aa;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #3f3f46;
  color: #fafafa;
}

.btn-confirm {
  padding: 8px 16px;
  background: #fafafa;
  border: none;
  border-radius: 8px;
  color: #18181b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover:not(:disabled) {
  background: #e4e4e7;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
