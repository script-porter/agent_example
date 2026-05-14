import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Bot } from 'lucide-react'
import type { AgentGroupData } from '../types/nodes'

const statusColors: Record<string, string> = {
  idle: 'bg-gray-300',
  running: 'bg-yellow-400 animate-pulse',
  done: 'bg-green-400',
  error: 'bg-red-400',
}

function AgentGroupNode({ data, selected }: NodeProps) {
  const agentData = data as unknown as AgentGroupData
  const status = agentData.status || 'idle'

  return (
    <div
      className={`
        relative min-w-[220px] max-w-[320px] rounded-2xl border-2 bg-white px-5 py-4 shadow-lg transition-all cursor-default
        ${selected
          ? 'border-indigo-400 shadow-indigo-100 ring-2 ring-indigo-100'
          : 'border-indigo-200/60 hover:border-indigo-300'
        }
      `}
    >
      {/* 顶部输入 Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white"
      />

      {/* 内容区 */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-indigo-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800 truncate">
              {agentData.label}
            </span>
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${statusColors[status]}`}
              title={status}
            />
          </div>
          {agentData.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {agentData.description}
            </p>
          )}
        </div>

        <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium flex-shrink-0">
          Agent
        </span>
      </div>

      {/* 底部输出 Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white"
      />
    </div>
  )
}

export default memo(AgentGroupNode)
