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