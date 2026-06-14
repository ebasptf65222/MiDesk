# Chat Architecture Upgrade Implementation Plan

> [!NOTE]
> This document may not reflect the current implementation.
> See the final report for up-to-date state:
> [Final Report](../reports/chat-architecture-upgrade.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the chat architecture to support message type registry, permission middleware, improved tool call display, user confirmation, error handling, and progress display.

**Architecture:** Refactor the monolithic ChatPanel.vue into modular components with a message type registry for extensibility, permission middleware for tool call control, and specialized components for different message types.

**Tech Stack:** Vue 3, TypeScript, Pinia, Electron IPC

---

## File Structure

```
src/renderer/src/
├── components/
│   ├── ChatPanel.vue (modified - simplified)
│   ├── chat/
│   │   ├── MessageList.vue (new)
│   │   ├── MessageItem.vue (new)
│   │   ├── ToolCallCard.vue (new)
│   │   ├── ToolResultCard.vue (new)
│   │   ├── ConfirmationBar.vue (new)
│   │   ├── ErrorCard.vue (new)
│   │   └── StatusIndicator.vue (new)
│   └── ... (existing components)
├── stores/
│   ├── chat.ts (modified)
│   ├── messageRegistry.ts (new)
│   └── permission.ts (new)
├── types/
│   └── chat.ts (new)
└── utils/
    └── permissionMiddleware.ts (new)
```

---

## Task 1: Message Type Registry

**Covers:** [S1] Message type system

**Files:**
- Create: `src/renderer/src/types/chat.ts`
- Create: `src/renderer/src/stores/messageRegistry.ts`
- Test: Manual verification

- [ ] **Step 1: Define extended message types**

```typescript
// src/renderer/src/types/chat.ts
export interface MessagePart {
  type: 'text' | 'thinking' | 'tool_use' | 'tool_result' | 'confirmation' | 'error' | 'progress'
  content: string
  metadata?: Record<string, unknown>
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: MessagePart[]
  content: string
  accumulatedText: string
  timestamp: number
  status?: 'pending' | 'running' | 'success' | 'error'
}

export interface ToolCallInfo {
  name: string
  args: Record<string, unknown>
  status: 'pending' | 'running' | 'success' | 'error'
  result?: unknown
  error?: string
}

export interface ConfirmationRequest {
  id: string
  question: string
  options: Array<{ label: string; value: string }>
  toolCallId?: string
}

export interface PermissionRule {
  toolPattern: string
  riskLevel: 'low' | 'medium' | 'high'
  action: 'allow' | 'ask' | 'deny'
}
```

- [ ] **Step 2: Create message type registry**

```typescript
// src/renderer/src/stores/messageRegistry.ts
import { defineStore } from 'pinia'
import { ref, markRaw } from 'vue'
import type { Component } from 'vue'

export interface MessageTypeConfig {
  type: string
  component: Component
  icon?: string
  color?: string
  defaultCollapsed?: boolean
}

export const useMessageRegistry = defineStore('messageRegistry', () => {
  const messageTypes = ref<Map<string, MessageTypeConfig>>(new Map())

  function registerType(config: MessageTypeConfig) {
    messageTypes.value.set(config.type, {
      ...config,
      component: markRaw(config.component)
    })
  }

  function getTypeConfig(type: string) {
    return messageTypes.value.get(type)
  }

  function hasType(type: string) {
    return messageTypes.value.has(type)
  }

  return { registerType, getTypeConfig, hasType }
})
```

- [ ] **Step 3: Test registry functionality**

```bash
# Manual test: Import and register a test type
# Verify it can be retrieved
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/types/chat.ts src/renderer/src/stores/messageRegistry.ts
git commit -m "feat: add message type registry for extensible chat messages"
```

---

## Task 2: Permission Middleware

**Covers:** [S2] Permission control system

**Files:**
- Create: `src/renderer/src/utils/permissionMiddleware.ts`
- Create: `src/renderer/src/stores/permission.ts`
- Test: Manual verification

- [ ] **Step 1: Create permission middleware**

```typescript
// src/renderer/src/utils/permissionMiddleware.ts
import type { ToolCallInfo, PermissionRule } from '../types/chat'

export type PermissionAction = 'allow' | 'ask' | 'deny'

export interface PermissionContext {
  toolCall: ToolCallInfo
  rules: PermissionRule[]
  userSettings: Record<string, PermissionAction>
}

export interface PermissionMiddleware {
  name: string
  before?: (context: PermissionContext) => Promise<PermissionAction | null>
  after?: (context: PermissionContext & { result: unknown }) => Promise<void>
}

export class PermissionEngine {
  private middlewares: PermissionMiddleware[] = []
  private rules: PermissionRule[] = []

  use(middleware: PermissionMiddleware) {
    this.middlewares.push(middleware)
  }

  setRules(rules: PermissionRule[]) {
    this.rules = rules
  }

  async checkPermission(toolCall: ToolCallInfo): Promise<PermissionAction> {
    const context: PermissionContext = {
      toolCall,
      rules: this.rules,
      userSettings: {}
    }

    for (const middleware of this.middlewares) {
      if (middleware.before) {
        const action = await middleware.before(context)
        if (action) return action
      }
    }

    return this.getDefaultAction(toolCall)
  }

  private getDefaultAction(toolCall: ToolCallInfo): PermissionAction {
    const rule = this.rules.find(r => 
      new RegExp(r.toolPattern).test(toolCall.name)
    )
    
    if (rule) {
      return rule.action
    }

    // Default: allow low risk, ask high risk
    const highRiskTools = ['bash', 'edit', 'write', 'delete']
    if (highRiskTools.some(t => toolCall.name.toLowerCase().includes(t))) {
      return 'ask'
    }
    
    return 'allow'
  }
}
```

- [ ] **Step 2: Create permission store**

```typescript
// src/renderer/src/stores/permission.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { PermissionEngine, type PermissionAction } from '../utils/permissionMiddleware'
import type { PermissionRule, ConfirmationRequest } from '../types/chat'

export const usePermissionStore = defineStore('permission', () => {
  const engine = new PermissionEngine()
  const rules = ref<PermissionRule[]>([])
  const pendingConfirmations = ref<Map<string, ConfirmationRequest>>(new Map())
  const isConfirming = ref(false)

  function setRules(newRules: PermissionRule[]) {
    rules.value = newRules
    engine.setRules(newRules)
  }

  async function checkPermission(toolName: string, toolArgs: Record<string, unknown>): Promise<PermissionAction> {
    return engine.checkPermission({
      name: toolName,
      args: toolArgs,
      status: 'pending'
    })
  }

  function requestConfirmation(request: ConfirmationRequest) {
    pendingConfirmations.value.set(request.id, request)
    isConfirming.value = true
  }

  function resolveConfirmation(id: string, approved: boolean, selectedOption?: string) {
    pendingConfirmations.value.delete(id)
    if (pendingConfirmations.value.size === 0) {
      isConfirming.value = false
    }
    return { approved, selectedOption }
  }

  function use(middleware: any) {
    engine.use(middleware)
  }

  return { 
    rules, 
    pendingConfirmations, 
    isConfirming,
    setRules, 
    checkPermission, 
    requestConfirmation, 
    resolveConfirmation,
    use 
  }
})
```

- [ ] **Step 3: Test permission engine**

```bash
# Manual test: Create rules, test permission check
# Verify default actions work correctly
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/utils/permissionMiddleware.ts src/renderer/src/stores/permission.ts
git commit -m "feat: add permission middleware for tool call control"
```

---

## Task 3: Tool Call Components

**Covers:** [S3] Tool call display improvement

**Files:**
- Create: `src/renderer/src/components/chat/ToolCallCard.vue`
- Create: `src/renderer/src/components/chat/ToolResultCard.vue`
- Test: Manual verification

- [ ] **Step 1: Create ToolCallCard component**

```vue
<!-- src/renderer/src/components/chat/ToolCallCard.vue -->
<template>
  <div class="tool-call-card" :class="{ collapsed: isCollapsed }">
    <div class="card-header" @click="toggleCollapse">
      <div class="header-left">
        <svg class="tool-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
        <span class="tool-name">{{ toolName }}</span>
        <span v-if="status === 'running'" class="status-badge running">执行中</span>
        <span v-else-if="status === 'success'" class="status-badge success">完成</span>
        <span v-else-if="status === 'error'" class="status-badge error">错误</span>
      </div>
      <div class="header-right">
        <StatusIndicator :status="status" />
        <svg :class="['chevron', { collapsed: isCollapsed }]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </div>
    </div>
    <div v-if="!isCollapsed" class="card-content">
      <div class="args-section">
        <div class="section-label">参数</div>
        <pre class="args-content"><code>{{ formattedArgs }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import StatusIndicator from './StatusIndicator.vue'

const props = defineProps<{
  name: string
  args: Record<string, unknown>
  status: 'pending' | 'running' | 'success' | 'error'
}>()

const isCollapsed = ref(true)

const toolName = computed(() => {
  return props.name || '未知工具'
})

const formattedArgs = computed(() => {
  try {
    return JSON.stringify(props.args, null, 2)
  } catch {
    return String(props.args)
  }
})

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.tool-call-card {
  border: 1px solid #374151;
  border-radius: 8px;
  background: #1f2937;
  margin: 8px 0;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  background: #111827;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-icon {
  color: #60a5fa;
}

.tool-name {
  font-weight: 500;
  color: #e5e7eb;
}

.status-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.status-badge.running {
  background: #1e40af;
  color: #93c5fd;
}

.status-badge.success {
  background: #065f46;
  color: #6ee7b7;
}

.status-badge.error {
  background: #991b1b;
  color: #fca5a5;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chevron {
  transition: transform 0.2s;
  color: #9ca3af;
}

.chevron.collapsed {
  transform: rotate(-90deg);
}

.card-content {
  padding: 12px;
  border-top: 1px solid #374151;
}

.section-label {
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.args-content {
  background: #111827;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #d1d5db;
  margin: 0;
}
</style>
```

- [ ] **Step 2: Create ToolResultCard component**

```vue
<!-- src/renderer/src/components/chat/ToolResultCard.vue -->
<template>
  <div class="tool-result-card" :class="{ collapsed: isCollapsed, error: hasError }">
    <div class="card-header" @click="toggleCollapse">
      <div class="header-left">
        <svg v-if="!hasError" class="result-icon success" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22,4 12,14.01 9,11.01"/>
        </svg>
        <svg v-else class="result-icon error" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span class="result-label">{{ hasError ? '错误结果' : '工具结果' }}</span>
      </div>
      <div class="header-right">
        <button v-if="hasError" class="retry-btn" @click.stop="$emit('retry')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23,4 23,10 17,10"/>
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
          重试
        </button>
        <svg :class="['chevron', { collapsed: isCollapsed }]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </div>
    </div>
    <div v-if="!isCollapsed" class="card-content">
      <div v-if="hasError" class="error-section">
        <div class="error-message">{{ errorMessage }}</div>
      </div>
      <div v-else class="result-section">
        <pre class="result-content"><code>{{ formattedResult }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  content: string
  isError?: boolean
}>()

defineEmits<{
  retry: []
}>()

const isCollapsed = ref(true)

const hasError = computed(() => props.isError || false)

const errorMessage = computed(() => {
  try {
    const parsed = JSON.parse(props.content)
    return parsed.error || parsed.message || props.content
  } catch {
    return props.content
  }
})

const formattedResult = computed(() => {
  try {
    const parsed = JSON.parse(props.content)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return props.content
  }
})

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.tool-result-card {
  border: 1px solid #374151;
  border-radius: 8px;
  background: #1f2937;
  margin: 8px 0;
  overflow: hidden;
}

.tool-result-card.error {
  border-color: #991b1b;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  background: #111827;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-icon.success {
  color: #34d399;
}

.result-icon.error {
  color: #f87171;
}

.result-label {
  font-weight: 500;
  color: #e5e7eb;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid #4b5563;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #374151;
  color: #e5e7eb;
}

.chevron {
  transition: transform 0.2s;
  color: #9ca3af;
}

.chevron.collapsed {
  transform: rotate(-90deg);
}

.card-content {
  padding: 12px;
  border-top: 1px solid #374151;
}

.error-section {
  background: #991b1b;
  padding: 8px;
  border-radius: 4px;
}

.error-message {
  color: #fca5a5;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

.result-section {
  background: #111827;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

.result-content {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #d1d5db;
  margin: 0;
}
</style>
```

- [ ] **Step 3: Test components**

```bash
# Manual test: Import components in ChatPanel.vue
# Verify they render correctly with sample data
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/chat/ToolCallCard.vue src/renderer/src/components/chat/ToolResultCard.vue
git commit -m "feat: add ToolCallCard and ToolResultCard components"
```

---

## Task 4: User Confirmation Interface

**Covers:** [S4] User confirmation interface

**Files:**
- Create: `src/renderer/src/components/chat/ConfirmationBar.vue`
- Test: Manual verification

- [ ] **Step 1: Create ConfirmationBar component**

```vue
<!-- src/renderer/src/components/chat/ConfirmationBar.vue -->
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

const permissionStore = usePermissionStore()

const hasPendingConfirmation = computed(() => permissionStore.isConfirming)
const currentConfirmation = computed(() => {
  const entries = Array.from(permissionStore.pendingConfirmations.entries())
  return entries.length > 0 ? entries[0][1] : null
})

function handleApprove() {
  if (currentConfirmation.value) {
    permissionStore.resolveConfirmation(currentConfirmation.value.id, true)
  }
}

function handleReject() {
  if (currentConfirmation.value) {
    permissionStore.resolveConfirmation(currentConfirmation.value.id, false)
  }
}

function handleOption(value: string) {
  if (currentConfirmation.value) {
    permissionStore.resolveConfirmation(currentConfirmation.value.id, true, value)
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
```

- [ ] **Step 2: Test component**

```bash
# Manual test: Mock permission store with pending confirmation
# Verify UI renders and buttons work
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/chat/ConfirmationBar.vue
git commit -m "feat: add ConfirmationBar component for user confirmations"
```

---

## Task 5: Error and Status Components

**Covers:** [S5] Error handling and progress display

**Files:**
- Create: `src/renderer/src/components/chat/ErrorCard.vue`
- Create: `src/renderer/src/components/chat/StatusIndicator.vue`
- Test: Manual verification

- [ ] **Step 1: Create ErrorCard component**

```vue
<!-- src/renderer/src/components/chat/ErrorCard.vue -->
<template>
  <div class="error-card">
    <div class="error-header">
      <svg class="error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span class="error-title">错误</span>
    </div>
    <div class="error-content">
      <div class="error-message">{{ message }}</div>
      <div v-if="details" class="error-details">
        <pre>{{ details }}</pre>
      </div>
    </div>
    <div class="error-actions">
      <button class="retry-btn" @click="$emit('retry')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23,4 23,10 17,10"/>
          <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
        </svg>
        重试
      </button>
      <button class="dismiss-btn" @click="$emit('dismiss')">忽略</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  details?: string
}>()

defineEmits<{
  retry: []
  dismiss: []
}>()
</script>

<style scoped>
.error-card {
  background: #7f1d1d;
  border: 1px solid #991b1b;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.error-icon {
  color: #f87171;
}

.error-title {
  font-weight: 600;
  color: #fca5a5;
}

.error-content {
  margin-bottom: 12px;
}

.error-message {
  color: #fecaca;
  font-size: 14px;
}

.error-details {
  margin-top: 8px;
  background: #450a0a;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

.error-details pre {
  color: #fca5a5;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  margin: 0;
}

.error-actions {
  display: flex;
  gap: 8px;
}

.retry-btn, .dismiss-btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #991b1b;
  border: 1px solid #b91c1c;
  color: #fecaca;
}

.retry-btn:hover {
  background: #b91c1c;
}

.dismiss-btn {
  background: transparent;
  border: 1px solid #7f1d1d;
  color: #fca5a5;
}

.dismiss-btn:hover {
  background: #450a0a;
}
</style>
```

- [ ] **Step 2: Create StatusIndicator component**

```vue
<!-- src/renderer/src/components/chat/StatusIndicator.vue -->
<template>
  <div class="status-indicator" :class="status">
    <div v-if="status === 'pending'" class="indicator pending">
      <div class="dot"></div>
      <span>等待中</span>
    </div>
    <div v-else-if="status === 'running'" class="indicator running">
      <div class="spinner"></div>
      <span>执行中</span>
    </div>
    <div v-else-if="status === 'success'" class="indicator success">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
      <span>完成</span>
    </div>
    <div v-else-if="status === 'error'" class="indicator error">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <span>错误</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  status: 'pending' | 'running' | 'success' | 'error'
}>()
</script>

<style scoped>
.status-indicator {
  display: flex;
  align-items: center;
}

.indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #9ca3af;
}

.indicator.pending .dot {
  width: 6px;
  height: 6px;
  background: #fbbf24;
  border-radius: 50%;
}

.indicator.running .spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #374151;
  border-top-color: #60a5fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.indicator.success {
  color: #34d399;
}

.indicator.error {
  color: #f87171;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
```

- [ ] **Step 3: Test components**

```bash
# Manual test: Import and render with different statuses
# Verify all states display correctly
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/chat/ErrorCard.vue src/renderer/src/components/chat/StatusIndicator.vue
git commit -m "feat: add ErrorCard and StatusIndicator components"
```

---

## Task 6: Refactor ChatPanel

**Covers:** [S6] Component refactoring

**Files:**
- Modify: `src/renderer/src/components/ChatPanel.vue`
- Create: `src/renderer/src/components/chat/MessageItem.vue`
- Create: `src/renderer/src/components/chat/MessageList.vue`
- Test: Manual verification

- [ ] **Step 1: Create MessageItem component**

```vue
<!-- src/renderer/src/components/chat/MessageItem.vue -->
<template>
  <div :class="['message', message.role]">
    <div class="message-avatar">
      <span v-if="message.role === 'user'">U</span>
      <span v-else>M</span>
    </div>
    <div class="message-body">
      <template v-for="(part, idx) in message.parts" :key="idx">
        <div v-if="part.type === 'text'" class="text-content">
          <MarkdownRender
            :content="message.accumulatedText"
            :max-live-nodes="0"
            :render-batch-size="16"
            :render-batch-delay="8"
            :final="!isStreaming"
          />
        </div>
        <ToolCallCard 
          v-else-if="part.type === 'tool_use'"
          :name="getToolName(part.content)"
          :args="getToolArgs(part.content)"
          :status="getToolStatus(part.content)"
        />
        <ToolResultCard
          v-else-if="part.type === 'tool_result'"
          :content="part.content"
          :is-error="isErrorResult(part.content)"
          @retry="handleRetry(part)"
        />
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
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'
import ToolCallCard from './ToolCallCard.vue'
import ToolResultCard from './ToolResultCard.vue'
import ErrorCard from './ErrorCard.vue'
import type { Message, MessagePart } from '../../types/chat'

const props = defineProps<{
  message: Message
  isStreaming: boolean
}>()

const emit = defineEmits<{
  retry: [part: MessagePart]
  dismiss: [part: MessagePart]
}>()

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
  gap: 12px;
  padding: 12px 0;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #3b82f6;
  color: white;
}

.message.assistant .message-avatar {
  background: #10b981;
  color: white;
}

.message-body {
  flex: 1;
  min-width: 0;
}

.text-content {
  color: #e5e7eb;
  line-height: 1.6;
}
</style>
```

- [ ] **Step 2: Create MessageList component**

```vue
<!-- src/renderer/src/components/chat/MessageList.vue -->
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
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  text-align: center;
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  margin: 0 0 8px 0;
  color: #e5e7eb;
}

.empty-state span {
  font-size: 14px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #4b5563;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
```

- [ ] **Step 3: Update ChatPanel.vue to use new components**

```vue
<!-- Update ChatPanel.vue template section -->
<template>
  <div class="chat-panel">
    <div class="chat-header">
      <!-- existing header content -->
    </div>

    <MessageList
      :messages="chatStore.messages"
      :is-streaming="chatStore.isStreaming"
      @retry="handleRetry"
      @dismiss="handleDismiss"
    />

    <ConfirmationBar />

    <div class="chat-input-area">
      <!-- existing input area -->
    </div>
  </div>
</template>

<script setup lang="ts">
// Add imports
import MessageList from './chat/MessageList.vue'
import ConfirmationBar from './chat/ConfirmationBar.vue'

// Add handlers
function handleRetry(part: MessagePart) {
  console.log('Retry:', part)
  // Implement retry logic
}

function handleDismiss(part: MessagePart) {
  console.log('Dismiss:', part)
  // Implement dismiss logic
}
</script>
```

- [ ] **Step 4: Test refactored ChatPanel**

```bash
# Manual test: Run the application
# Verify all components render correctly
# Test tool call display, confirmation bar, error handling
```

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/chat/MessageItem.vue src/renderer/src/components/chat/MessageList.vue src/renderer/src/components/ChatPanel.vue
git commit -m "refactor: split ChatPanel into modular components"
```

---

## Task 7: Integration and Testing

**Covers:** [S7] Integration and final testing

**Files:**
- Modify: Various files for integration
- Test: Full application testing

- [ ] **Step 1: Update chat store to support new message types**

```typescript
// Update src/renderer/src/stores/chat.ts
// Add support for confirmation, error, progress message types
// Update chunk handling to support new types
```

- [ ] **Step 2: Update IPC handlers for permission checks**

```typescript
// Update src/main/ipc/chat.ts
// Add permission check before tool execution
// Handle confirmation requests from renderer
```

- [ ] **Step 3: Test complete flow**

```bash
# Manual test: 
# 1. Start application
# 2. Send a message that triggers tool calls
# 3. Verify tool calls display with fold/expand
# 4. Test permission confirmation flow
# 5. Test error handling and retry
# 6. Test progress display
```

- [ ] **Step 4: Fix any issues found**

```bash
# Fix any bugs or UX issues discovered during testing
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete chat architecture upgrade with permission system"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** All spec sections [S1]-[S7] are covered by tasks
- [ ] **Placeholder scan:** No TBD/TODO placeholders found
- [ ] **Type consistency:** All types match across tasks
- [ ] **File paths:** All file paths are correct
- [ ] **Code completeness:** All steps have complete code examples

---

## Execution Handoff

After completing all tasks, the chat architecture will be upgraded with:

1. **Message type registry** for extensible message types
2. **Permission middleware** for tool call control
3. **Tool call components** with fold/expand functionality
4. **Confirmation bar** for user confirmations
5. **Error handling** with retry capabilities
6. **Progress display** with status indicators

The monolithic ChatPanel.vue will be refactored into modular, maintainable components.