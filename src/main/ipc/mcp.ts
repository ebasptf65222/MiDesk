import { ipcMain } from 'electron'
import { mcpManager, McpServer } from '../services/mcp-manager'

export function registerMcpIPC(): void {
  ipcMain.handle('mimo:mcp:servers', () => {
    return mcpManager.getServers()
  })

  ipcMain.handle('mimo:mcp:add', (_event, server: Omit<McpServer, 'id'>) => {
    return mcpManager.addServer(server)
  })

  ipcMain.handle('mimo:mcp:update', (_event, id: string, updates: Partial<McpServer>) => {
    mcpManager.updateServer(id, updates)
  })

  ipcMain.handle('mimo:mcp:remove', (_event, id: string) => {
    mcpManager.removeServer(id)
  })

  ipcMain.handle('mimo:mcp:connect', async (_event, id: string) => {
    return mcpManager.connect(id)
  })

  ipcMain.handle('mimo:mcp:disconnect', (_event, id: string) => {
    mcpManager.disconnect(id)
  })

  ipcMain.handle('mimo:mcp:tools', () => {
    return mcpManager.getAllTools()
  })

  ipcMain.handle('mimo:mcp:callTool', async (_event, toolName: string, args: any) => {
    return mcpManager.callTool(toolName, args)
  })
}
