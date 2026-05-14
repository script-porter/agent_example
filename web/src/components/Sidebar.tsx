import { useState, useEffect } from 'react'
import { type Node } from '@xyflow/react'
import { X, Bot, Link, Settings } from 'lucide-react'

interface SidebarProps {
  node: Node
  onClose: () => void
  onUpdate: (nodeId: string, updates: Record<string, unknown>) => void
}

export default function Sidebar({ node, onClose, onUpdate }: SidebarProps) {
  const data = node.data as Record<string, unknown>
  const [label, setLabel] = useState((data?.label as string) || '')
  const [description, setDescription] = useState((data?.description as string) || '')

  // 切换节点时同步本地状态
  useEffect(() => {
    setLabel((data?.label as string) || '')
    setDescription((data?.description as string) || '')
  }, [node.id, data?.label, data?.description])

  const handleSave = () => {
    onUpdate(node.id, { label, description })
  }

  return (
    <div className="w-72 h-full bg-white border-l border-gray-200 shadow-lg flex flex-col animate-slide-in">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-800">属性面板</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 基本信息 */}
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
            <div>
              <label className="block text-xs text-gray-500 mb-1">名称</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full text-xs bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors"
              />
            </div>
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

        {/* 位置信息 */}
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

        {/* 描述 */}
        <section>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">描述说明</h4>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="请输入 Agent 描述…"
            className="w-full text-xs bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors resize-none"
          />
        </section>
      </div>

      {/* 底部操作 */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleSave}
          className="w-full py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
        >
          保存配置
        </button>
      </div>
    </div>
  )
}
