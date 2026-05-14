/**
 * Agent 编排 Mock 数据生成器
 * 使用 Mock.js 生成逼真的中文 Agent 编排数据
 */
import Mock from 'mockjs'
import type { Node, Edge } from '@xyflow/react'
import type { AgentGroupData, ModelData, ToolData } from '../types/nodes'

const { Random } = Mock

// ========== Mock 模板 ==========

// Agent 名称模板
const AGENT_NAMES = [
  '输入解析', '意图识别', '知识检索', '代码生成',
  '结果汇总', '内容审核', '语义理解', '任务调度',
  '数据清洗', '文本分析', '对话管理', '流程编排',
]

const AGENT_DESC_PATTERNS = [
  '负责{action}用户{target}，通过{method}实现高效处理',
  '基于{tech}技术，对{target}进行{action}和优化',
  '采用{method}策略，完成{target}的{action}任务',
]

// 模型提供商 & 模型名
const MODEL_CONFIGS = [
  { provider: 'openai', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  { provider: 'anthropic', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  { provider: 'google', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
  { provider: 'deepseek', models: ['deepseek-v3', 'deepseek-r1'] },
  { provider: 'mistral', models: ['mistral-large', 'mistral-medium'] },
]

const MODEL_NAMES = [
  '语义匹配引擎', '上下文理解器', '文本生成器',
  '代码解释器', '知识提取器', '逻辑推理器',
  '情感分析器', '实体识别器', '摘要生成器',
]

// 工具类型 & 名称
const TOOL_CONFIGS = [
  { type: 'web_search', names: ['网页搜索', '实时检索', '知识查询', '网页抓取'] },
  { type: 'code_executor', names: ['代码沙箱', '脚本执行器', '代码格式化', '语法检查'] },
  { type: 'api_call', names: ['API网关', '接口调用', '服务集成', '数据拉取'] },
  { type: 'database', names: ['向量数据库', 'SQL查询器', '缓存服务', '数据持久化'] },
  { type: 'file_reader', names: ['文档解析器', '文件读取', 'PDF提取', '图片识别'] },
  { type: 'calculator', names: ['数学计算', '统计分析', '数据聚合', '指标计算'] },
]

const TOOL_DESC_PATTERNS = [
  '提供{feature}能力，支持{scenario}场景下的高效处理',
  '基于{feature}实现，适用于{scenario}等业务场景',
  '为 Agent 提供{feature}功能，可处理{scenario}任务',
]

// ========== 生成函数 ==========

function pick<T>(arr: T[]): T {
  return arr[Random.integer(0, arr.length - 1)]
}

function fillTemplate(tmpl: string): string {
  return tmpl.replace(/\{(\w+)\}/g, () => {
    const actions = ['解析', '处理', '分析', '提取', '转换', '优化', '聚合', '分发']
    const targets = ['输入数据', '查询请求', '文本内容', '结构化信息', '用户意图', '语义向量']
    const methods = ['深度学习', '规则匹配', '向量检索', '知识图谱', '多轮对话']
    const techs = ['LLM', 'RAG', 'Transformer', 'BERT', 'Embedding']
    return pick(actions)
  }).replace(/\{(\w+)\}/g, () => pick(['输入数据', '查询请求', '文本内容']))
}

/** 生成一条中文短句（10~30字） */
function cs(): string {
  return Random.csentence(10, 30)
}

/** 生成中文段落（1~2句） */
function cp(): string {
  return Random.csentence(30, 80)
}

/** 生成 Y 坐标偏移 */
function yOffset(base: number, jitter = 40): number {
  return base + Random.integer(-jitter, jitter)
}

// ========== 核心：生成完整编排数据 ==========

export interface MockFlowData {
  nodes: Node[]
  edges: Edge[]
}

export function generateFlowData(): MockFlowData {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // ---------- 开始节点 ----------
  nodes.push({
    id: 'start',
    type: 'startNode',
    position: { x: 430, y: -130 },
    data: {},
  })

  // ---------- 生成 3 个 Agent 组 ----------
  const agentCount = 3
  const rowHeight = 320
  const baseX = 80
  const rightX = 400

  for (let i = 0; i < agentCount; i++) {
    const agentId = `agent-${i + 1}`
    const baseY = i * rowHeight + 50

    // --- Agent 组 ---
    const agentName = AGENT_NAMES[i] || `Agent-${i + 1}`
    nodes.push({
      id: agentId,
      type: 'agentGroup',
      position: { x: baseX, y: baseY },
      data: {
        label: `${agentName} Agent`,
        description: cp(),
        status: 'idle',
      } satisfies AgentGroupData,
    })

    // --- 模型（1~2 个） ---
    const modelCount = Random.integer(1, 2)
    for (let m = 0; m < modelCount; m++) {
      const modelId = `m-${i + 1}${m + 1}`
      const cfg = pick(MODEL_CONFIGS)
      nodes.push({
        id: modelId,
        type: 'modelNode',
        position: {
          x: rightX + m * 200,
          y: yOffset(baseY, 30),
        },
        data: {
          label: pick(MODEL_NAMES),
          provider: cfg.provider,
          modelName: pick(cfg.models),
          temperature: Random.float(0, 1.5, 1, 1),
          maxTokens: pick([1024, 2048, 4096, 8192]),
        } satisfies ModelData,
      })
      edges.push({
        id: `e-${agentId}-${modelId}`,
        source: agentId,
        target: modelId,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 },
      })
    }

    // --- 工具（1~3 个） ---
    const toolCount = Random.integer(1, 3)
    for (let t = 0; t < toolCount; t++) {
      const toolId = `t-${i + 1}${t + 1}`
      const cfg = pick(TOOL_CONFIGS)
      nodes.push({
        id: toolId,
        type: 'toolNode',
        position: {
          x: rightX + t * 200,
          y: yOffset(baseY + 120, 30),
        },
        data: {
          label: pick(cfg.names),
          toolType: cfg.type,
          description: fillTemplate(pick(TOOL_DESC_PATTERNS)),
          config: '{}',
        } satisfies ToolData,
      })
      edges.push({
        id: `e-${agentId}-${toolId}`,
        source: agentId,
        target: toolId,
        animated: true,
        style: { stroke: '#f59e0b', strokeWidth: 2 },
      })
    }
  }

  // ---------- Agent 间流转连线 ----------
  for (let i = 0; i < agentCount - 1; i++) {
    edges.push({
      id: `e-agent-${i + 1}-agent-${i + 2}`,
      source: `agent-${i + 1}`,
      target: `agent-${i + 2}`,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2.5 },
    })
  }

  // ---------- 开始/结束连线 ----------
  edges.push({
    id: 'e-start-agent-1',
    source: 'start',
    target: 'agent-1',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2.5 },
  })
  edges.push({
    id: `e-agent-${agentCount}-end`,
    source: `agent-${agentCount}`,
    target: 'end',
    animated: true,
    style: { stroke: '#f43f5e', strokeWidth: 2.5 },
  })

  // ---------- 结束节点 ----------
  const lastY = (agentCount - 1) * rowHeight + 50
  nodes.push({
    id: 'end',
    type: 'endNode',
    position: { x: 430, y: lastY + 200 },
    data: {},
  })

  return { nodes, edges }
}

// ========== 默认导出 ==========
export const mockFlowData = generateFlowData()
