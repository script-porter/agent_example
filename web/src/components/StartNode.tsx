import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play } from 'lucide-react'

function StartNode({ selected }: NodeProps) {
  return (
    <div
      className={`
        relative flex items-center gap-2 px-5 py-2.5 rounded-full border-2 bg-white shadow-md transition-all
        ${selected
          ? 'border-emerald-400 shadow-emerald-100 ring-2 ring-emerald-100'
          : 'border-emerald-200 hover:border-emerald-300'
        }
      `}
    >
      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
        <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
      </div>
      <span className="text-sm font-bold text-emerald-700">开始</span>

      {/* 仅输出 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-white"
      />
    </div>
  )
}

export default memo(StartNode)
