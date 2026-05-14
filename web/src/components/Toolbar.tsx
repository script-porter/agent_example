import { Plus, Trash2, Play, Download, Upload } from 'lucide-react'

interface ToolbarProps {
  onAddAgent: () => void
  onDeleteSelected: () => void
  hasSelection: boolean
}

export default function Toolbar({ onAddAgent, onDeleteSelected, hasSelection }: ToolbarProps) {
  return (
    <div className="w-16 h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-1 shadow-sm">
      {/* Logo / 标题 */}
      <div className="mb-4 w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
        <span className="text-white font-bold text-sm">AO</span>
      </div>

      <div className="w-10 h-px bg-gray-200 mb-2" />

      {/* 添加 Agent */}
      <ToolbarButton
        icon={<Plus className="w-5 h-5" />}
        label="添加 Agent"
        onClick={onAddAgent}
        primary
      />

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
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  primary?: boolean
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
          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
        }
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon}
    </button>
  )
}
