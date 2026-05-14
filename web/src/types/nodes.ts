// ========== 节点数据接口 ==========

export interface AgentGroupData {
  label: string
  description: string
  status: 'idle' | 'running' | 'done' | 'error'
}

export interface ModelData {
  label: string
  provider: string
  modelName: string
  temperature: number
  maxTokens: number
}

export interface ToolData {
  label: string
  toolType: string
  description: string
  config: string
}

// ========== 默认值 ==========

export const defaultAgentData: AgentGroupData = {
  label: '新 Agent',
  description: '',
  status: 'idle',
}

export const defaultModelData: ModelData = {
  label: '新模型',
  provider: 'openai',
  modelName: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4096,
}

export const defaultToolData: ToolData = {
  label: '新工具',
  toolType: 'web_search',
  description: '',
  config: '{}',
}

// ========== 选项列表 ==========

export const MODEL_PROVIDERS = ['openai', 'anthropic', 'google', 'mistral', 'deepseek'] as const
export const MODEL_NAMES: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  google: ['gemini-2.0-flash', 'gemini-1.5-pro'],
  mistral: ['mistral-large', 'mistral-medium', 'mistral-small'],
  deepseek: ['deepseek-v3', 'deepseek-r1'],
}

export const TOOL_TYPES = [
  { value: 'web_search', label: '网页搜索' },
  { value: 'code_executor', label: '代码执行器' },
  { value: 'api_call', label: 'API 调用' },
  { value: 'database', label: '数据库查询' },
  { value: 'file_reader', label: '文件读取' },
  { value: 'calculator', label: '数学计算' },
]
