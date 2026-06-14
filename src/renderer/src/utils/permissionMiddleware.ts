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