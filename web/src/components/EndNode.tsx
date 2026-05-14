import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { StopCircle } from 'lucide-react'

function EndNode({ selected }: NodeProps) {
  return (
    <div
      className={`
        relative flex items-center gap-2 px-5 py-2.5 rounded-full border-2 bg-white shadow-md transition-all
        ${selected
          ? 'border-rose-400 shadow-rose-100 ring-2 ring-rose-100'
          : 'border-rose-200 hover:border-rose-300'
        }
      `}
    >
      <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center">
        <StopCircle className="w-3.5 h-3.5 text-rose-600" />
      </div>
      <span className="text-sm font-bold text-rose-700">结束</span>

      {/* 仅输入 */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-rose-500 !border-2 !border-white"
      />
    </div>
  )
}

export default memo(EndNode)
