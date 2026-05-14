import { Trash2, Play, Download, Upload, Cpu, Wrench, Bot, Flag, CircleStop } from 'lucide-react'

interface ToolbarProps {
  onAddAgent: () => void
  onAddModel: () => void
  onAddTool: () => void
  onAddStart: () => void
  onAddEnd: () => void
  onDeleteSelected: () => void
  hasSelection: boolean
}

export default function Toolbar({
  onAddAgent,
  onAddModel,
  onAddTool,
  onAddStart,
  onAddEnd,
  onDeleteSelected,
  hasSelection,
}: ToolbarProps) {
  return (
    <div className="w-16 h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-1 shadow-sm">
      {/* Logo */}
      <div className="mb-3 w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
        <span className="text-white font-bold text-sm">AO</span>
      </div>

      <div className="w-10 h-px bg-gray-200 mb-1" />

      {/* 添加 Agent（容器） */}
      <ToolbarButton
        icon={<Bot className="w-5 h-5" />}
        label="添加 Agent 组"
        onClick={onAddAgent}
        primary
      />

      {/* 添加模型 */}
      <ToolbarButton
        icon={<Cpu className="w-5 h-5" />}
        label="添加模型"
        onClick={onAddModel}
      />

      {/* 添加工具 */}
      <ToolbarButton
        icon={<Wrench className="w-5 h-5" />}
        label="添加工具"
        onClick={onAddTool}
      />

      <div className="w-8 h-px bg-gray-150 mb-0.5" />

      {/* 添加开始 */}
      <ToolbarButton
        icon={<Flag className="w-5 h-5" />}
        label="添加开始节点"
        onClick={onAddStart}
        active
      />

      {/* 添加结束 */}
      <ToolbarButton
        icon={<CircleStop className="w-5 h-5" />}
        label="添加结束节点"
        onClick={onAddEnd}
        active
      />

      <div className="w-8 h-px bg-gray-150 mb-0.5" />

      {/* 删除选中 */}
      <ToolbarButton
        icon={<Trash2 className="w-5 h-5" />}
        label="删除选中"
        onClick={onDeleteSelected}
        disabled={!hasSelection}
      />

      <div className="flex-1" />

      {/* 底部操作 */}
      <ToolbarButton
        icon={<Play className="w-5 h-5" />}
        label="执行编排"
      />

      <ToolbarButton
        icon={<Download className="w-5 h-5" />}
        label="导出"
      />

      <ToolbarButton
        icon={<Upload className="w-5 h-5" />}
        label="导入"
      />
    </div>
  )
}

function ToolbarButton({
  icon,
  label,
  onClick,
  primary,
  active,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  primary?: boolean
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`
        w-10 h-10 flex items-center justify-center rounded-xl transition-all mb-1
        ${primary
          ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-200'
          : active
            ? 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50'
            : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
        }
        ${disabled ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon}
    </button>
  )
}
