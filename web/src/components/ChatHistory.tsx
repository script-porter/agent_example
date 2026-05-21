import { useCallback, useMemo, useState } from 'react'
import {
  DeleteOutlined,
  MessageOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Button, Input, List, Popconfirm, Spin, Typography } from 'antd'

// ========== 类型 ==========

export interface ConversationItem {
  id: string
  title: string
  lastMessage: string
  createdAt: string
  updatedAt: string
}

interface ChatHistoryProps {
  conversations: ConversationItem[]
  activeId: string | null
  loading: boolean
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
}

// ========== 组件 ==========

export default function ChatHistory({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: ChatHistoryProps) {
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const filtered = useMemo(
    () =>
      search.trim()
        ? conversations.filter((c) =>
            c.title.toLowerCase().includes(search.toLowerCase()),
          )
        : conversations,
    [conversations, search],
  )

  const startRename = useCallback(
    (id: string, currentTitle: string) => {
      setEditingId(id)
      setEditTitle(currentTitle)
    },
    [],
  )

  const confirmRename = useCallback(
    (id: string) => {
      const trimmed = editTitle.trim()
      if (trimmed && trimmed !== conversations.find((c) => c.id === id)?.title) {
        onRename(id, trimmed)
      }
      setEditingId(null)
      setEditTitle('')
    },
    [editTitle, conversations, onRename],
  )

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* ======== 头部 ======== */}
      <div className="px-4 py-3 border-b border-gray-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <Typography.Text strong className="text-sm">
            对话历史
          </Typography.Text>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={onNew}
          >
            新对话
          </Button>
        </div>
        <Input
          size="small"
          placeholder="搜索历史…"
          prefix={<SearchOutlined className="text-gray-400" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      {/* ======== 列表 ======== */}
      <div className="flex-1 overflow-y-auto">
        <Spin spinning={loading}>
          {filtered.length === 0 ? (
            <div className="text-center text-gray-400 text-xs py-12">
              暂无对话记录
            </div>
          ) : (
            <List
              dataSource={filtered}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`
                    cursor-pointer px-4 py-2.5 transition-colors hover:bg-gray-50
                    ${item.id === activeId ? 'bg-indigo-50 border-r-2 border-indigo-400' : ''}
                  `}
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="删除此对话？"
                      onConfirm={(e) => {
                        e?.stopPropagation()
                        onDelete(item.id)
                      }}
                      okText="删除"
                      cancelText="取消"
                    >
                      <DeleteOutlined
                        className="text-gray-400 hover:text-red-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>,
                  ]}
                >
                  <div className="flex-1 min-w-0">
                    {editingId === item.id ? (
                      <Input
                        size="small"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => confirmRename(item.id)}
                        onPressEnter={() => confirmRename(item.id)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <MessageOutlined className="text-xs text-gray-400" />
                          <span className="text-sm text-gray-800 truncate font-medium">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5 pl-5">
                          {item.lastMessage || '新对话'}
                        </p>
                      </>
                    )}
                  </div>
                </List.Item>
              )}
            />
          )}
        </Spin>
      </div>
    </div>
  )
}
