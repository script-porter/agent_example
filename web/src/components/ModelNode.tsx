import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Cpu } from 'lucide-react'
import type { ModelData } from '../types/nodes'

const providerColors: Record<string, string> = {
  openai: 'bg-emerald-100 text-emerald-700',
  anthropic: 'bg-amber-100 text-amber-700',
  google: 'bg-blue-100 text-blue-700',
  mistral: 'bg-violet-100 text-violet-700',
  deepseek: 'bg-cyan-100 text-cyan-700',
}

function ModelNode({ data, selected }: NodeProps) {
  const modelData = data as unknown as ModelData
  const providerBadge = providerColors[modelData.provider] || 'bg-gray-100 text-gray-700'

  return (
    <div
      className={`
        relative w-[180px] rounded-xl border-2 bg-white px-3.5 py-2.5 shadow-sm transition-all
        ${selected
          ? 'border-emerald-400 shadow-emerald-100'
          : 'border-gray-150 hover:border-emerald-300'
        }
      `}
    >
      {/* 顶部输入 Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-white"
      />

      {/* 头部：图标 + 类型标识 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            模型
          </span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${providerBadge}`}>
          {modelData.provider}
        </span>
      </div>

      {/* 模型名称 */}
      <p className="text-sm font-semibold text-gray-800 truncate">
        {modelData.label}
      </p>
      <p className="text-[11px] text-gray-400 truncate mt-0.5">
        {modelData.modelName}
      </p>

      {/* 参数信息 */}
      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
        <span>temp: {modelData.temperature}</span>
        <span className="text-gray-300">|</span>
        <span>{modelData.maxTokens} tokens</span>
      </div>

      {/* 底部输出 Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-white"
      />
    </div>
  )
}

export default memo(ModelNode)
