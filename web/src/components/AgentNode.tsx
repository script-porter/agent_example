import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

interface AgentNodeData {
  label: string
  description?: string
  status?: 'idle' | 'running' | 'done' | 'error'
}

const statusColors: Record<string, string> = {
  idle: 'bg-gray-300',
  running: 'bg-yellow-400 animate-pulse',
  done: 'bg-green-400',
  error: 'bg-red-400',
}

function AgentNode({ data, selected }: NodeProps) {
  const agentData = data as unknown as AgentNodeData
  const status = agentData.status || 'idle'

  return (
    <div
      className={`
        relative min-w-[180px] rounded-xl border-2 bg-white px-4 py-3 shadow-md transition-all
        ${selected ? 'border-indigo-500 shadow-indigo-200' : 'border-gray-200 hover:border-indigo-300'}
      `}
    >
      {/* 顶部输入 Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-indigo-500"
      />

      {/* 状态指示灯 */}
      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusColors[status]}`} />
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Agent</span>
      </div>

      {/* 标题 */}
      <div className="text-sm font-semibold text-gray-800 leading-tight">
        {agentData.label}
      </div>

      {/* 描述 */}
      {agentData.description && (
        <div className="mt-1 text-xs text-gray-500 line-clamp-2">
          {agentData.description}
        </div>
      )}

      {/* 底部输出 Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-indigo-500"
      />
    </div>
  )
}

export default memo(AgentNode)
