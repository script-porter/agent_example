import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Wrench } from 'lucide-react'
import type { ToolData } from '../types/nodes'
import { TOOL_TYPES } from '../types/nodes'

const toolTypeIcons: Record<string, string> = {
  web_search: '🌐',
  code_executor: '💻',
  api_call: '🔗',
  database: '🗄️',
  file_reader: '📂',
  calculator: '🔢',
}

function ToolNode({ data, selected }: NodeProps) {
  const toolData = data as unknown as ToolData
  const toolLabel = TOOL_TYPES.find((t) => t.value === toolData.toolType)?.label || toolData.toolType
  const emoji = toolTypeIcons[toolData.toolType] || '🔧'

  return (
    <div
      className={`
        relative w-[180px] rounded-xl border-2 bg-white px-3.5 py-2.5 shadow-sm transition-all
        ${selected
          ? 'border-amber-400 shadow-amber-100'
          : 'border-gray-150 hover:border-amber-300'
        }
      `}
    >
      {/* 顶部输入 Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-white"
      />

      {/* 头部 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            工具
          </span>
        </div>
        <span className="text-lg leading-none">{emoji}</span>
      </div>

      {/* 工具名称 */}
      <p className="text-sm font-semibold text-gray-800 truncate">
        {toolData.label}
      </p>
      <p className="text-[11px] text-gray-400 truncate mt-0.5">
        {toolLabel}
      </p>

      {/* 描述 */}
      {toolData.description && (
        <p className="text-[10px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
          {toolData.description}
        </p>
      )}

      {/* 底部输出 Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-white"
      />
    </div>
  )
}

export default memo(ToolNode)
