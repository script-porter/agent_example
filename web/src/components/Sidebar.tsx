import { useState, useEffect } from 'react'
import { type Node } from '@xyflow/react'
import { X, Bot, Cpu, Wrench, Link, Settings, Flag, CircleStop } from 'lucide-react'
import {
  MODEL_PROVIDERS,
  MODEL_NAMES,
  TOOL_TYPES,
} from '../types/nodes'

interface SidebarProps {
  node: Node
  onClose: () => void
  onUpdate: (nodeId: string, updates: Record<string, unknown>) => void
}

export default function Sidebar({ node, onClose, onUpdate }: SidebarProps) {
  const data = node.data as Record<string, unknown>

  // ---------- 通用表单状态 ----------
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  // ---------- Agent 字段 ----------
  const [status, setStatus] = useState('idle')
  // ---------- Model 字段 ----------
  const [provider, setProvider] = useState('openai')
  const [modelName, setModelName] = useState('gpt-4o')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4096)
  // ---------- Tool 字段 ----------
  const [toolType, setToolType] = useState('web_search')
  const [toolConfig, setToolConfig] = useState('{}')

  // 切换节点时同步所有本地状态
  useEffect(() => {
    setLabel((data?.label as string) || '')
    setDescription((data?.description as string) || '')
    setStatus((data?.status as string) || 'idle')
    setProvider((data?.provider as string) || 'openai')
    setModelName((data?.modelName as string) || 'gpt-4o')
    setTemperature((data?.temperature as number) ?? 0.7)
    setMaxTokens((data?.maxTokens as number) ?? 4096)
    setToolType((data?.toolType as string) || 'web_search')
    setToolConfig((data?.config as string) || '{}')
  }, [node.id, data])

  const handleSave = () => {
    const base = { label, description }
    switch (node.type) {
      case 'agentGroup':
        onUpdate(node.id, { ...base, status })
        break
      case 'modelNode':
        onUpdate(node.id, { label, provider, modelName, temperature, maxTokens })
        break
      case 'toolNode':
        onUpdate(node.id, { label, toolType, description, config: toolConfig })
        break
      case 'startNode':
      case 'endNode':
        // 开始/结束节点无可编辑字段
        break
      default:
        onUpdate(node.id, base)
    }
  }

  // 节点图标
  const NodeIcon =
    node.type === 'startNode' ? Flag
    : node.type === 'endNode' ? CircleStop
    : node.type === 'modelNode' ? Cpu
    : node.type === 'toolNode' ? Wrench
    : Bot

  const nodeTypeLabel =
    node.type === 'startNode' ? '开始节点'
    : node.type === 'endNode' ? '结束节点'
    : node.type === 'modelNode' ? '模型'
    : node.type === 'toolNode' ? '工具'
    : 'Agent 组'

  const availableModels = MODEL_NAMES[provider] || []
  const isSpecial = node.type === 'startNode' || node.type === 'endNode'

  return (
    <div className="w-72 h-full bg-white border-l border-gray-200 shadow-lg flex flex-col animate-slide-in">
      {/* ======== 头部 ======== */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <NodeIcon className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-800">{nodeTypeLabel} 属性</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ======== 内容 ======== */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* --- 通用：基本信息 --- */}
        <section>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" /> 基本信息
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">节点 ID</label>
              <input
                readOnly
                value={node.id}
                className="w-full text-xs bg-gray-100 border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-500 outline-none cursor-not-allowed"
              />
            </div>
            {!isSpecial && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">名称</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full text-xs bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors"
              />
            </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">类型</label>
              <input
                readOnly
                value={node.type || 'agentNode'}
                className="w-full text-xs bg-gray-100 border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-500 outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* --- Agent 特有：状态 --- */}
        {node.type === 'agentGroup' && (
          <section>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">运行状态</h4>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-800 outline-none focus:border-indigo-400"
            >
              <option value="idle">⚪ 空闲</option>
              <option value="running">🟡 运行中</option>
              <option value="done">🟢 已完成</option>
              <option value="error">🔴 错误</option>
            </select>
          </section>
        )}

        {/* --- Model 特有 --- */}
        {node.type === 'modelNode' && (
          <>
            <section>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">模型配置</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">提供商</label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value)
                      setModelName(MODEL_NAMES[e.target.value]?.[0] || '')
                    }}
                    className="w-full text-xs bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-800 outline-none focus:border-indigo-400"
                  >
                    {MODEL_PROVIDERS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">模型名称</label>
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full text-xs bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-800 outline-none focus:border-indigo-400"
                  >
                    {availableModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">参数</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    温度: <span className="font-mono text-indigo-600">{temperature}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>精确</span><span>创造</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">最大 Tokens</label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1024)}
                    className="w-full text-xs bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-800 outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {/* --- Tool 特有 --- */}
        {node.type === 'toolNode' && (
          <>
            <section>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">工具配置</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">工具类型</label>
                  <select
                    value={toolType}
                    onChange={(e) => setToolType(e.target.value)}
                    className="w-full text-xs bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-800 outline-none focus:border-indigo-400"
                  >
                    {TOOL_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">配置 JSON</h4>
              <textarea
                value={toolConfig}
                onChange={(e) => setToolConfig(e.target.value)}
                rows={4}
                placeholder='{"key": "value"}'
                className="w-full text-xs font-mono bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors resize-none"
              />
            </section>
          </>
        )}

        {/* --- 通用：描述 --- */}
        {node.type !== 'toolNode' && !isSpecial && (
          <section>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">描述说明</h4>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="请输入描述…"
              className="w-full text-xs bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors resize-none"
            />
          </section>
        )}

        {/* --- 位置 --- */}
        <section>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Link className="w-3.5 h-3.5" /> 位置坐标
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X</label>
              <input
                readOnly
                value={Math.round(node.position.x)}
                className="w-full text-xs bg-gray-100 border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-500 outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y</label>
              <input
                readOnly
                value={Math.round(node.position.y)}
                className="w-full text-xs bg-gray-100 border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-500 outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </section>
      </div>

      {/* ======== 底部保存 ======== */}
      <div className="p-4 border-t border-gray-100">
        {isSpecial ? (
          <p className="text-xs text-gray-400 text-center py-2">开始/结束节点无需配置</p>
        ) : (
          <button
            onClick={handleSave}
            className="w-full py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
          >
            保存配置
          </button>
        )}
      </div>
    </div>
  )
}
