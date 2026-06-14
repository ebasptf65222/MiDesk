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