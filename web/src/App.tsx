import { useCallback, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionMode,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  addEdge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import AgentNode from './components/AgentNode'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'

const nodeTypes: NodeTypes = {
  agentNode: AgentNode,
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'agentNode',
    position: { x: 300, y: 200 },
    data: { label: '输入解析 Agent', description: '解析用户输入并分发任务' },
  },
  {
    id: '2',
    type: 'agentNode',
    position: { x: 600, y: 80 },
    data: { label: '知识检索 Agent', description: '检索相关知识库内容' },
  },
  {
    id: '3',
    type: 'agentNode',
    position: { x: 600, y: 320 },
    data: { label: '代码生成 Agent', description: '根据需求生成代码' },
  },
  {
    id: '4',
    type: 'agentNode',
    position: { x: 900, y: 200 },
    data: { label: '结果汇总 Agent', description: '汇总各 Agent 输出结果' },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
]

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // 从 nodes 中实时获取选中的节点数据（保证与画布同步）
  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId) ?? null
    : null

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges],
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  // 更新节点 data 字段
  const updateNodeData = useCallback(
    (nodeId: string, updates: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, ...updates } }
            : n,
        ),
      )
    },
    [setNodes],
  )

  const addAgentNode = useCallback(() => {
    const id = `${Date.now()}`
    const newNode: Node = {
      id,
      type: 'agentNode',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        label: `新 Agent ${id.slice(-4)}`,
        description: '双击编辑描述',
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  const deleteSelectedNode = useCallback(() => {
    if (selectedNodeId) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId))
      setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId))
      setSelectedNodeId(null)
    }
  }, [selectedNodeId, setNodes, setEdges])

  const nodeCount = nodes.length
  const edgeCount = edges.length

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* 左侧工具栏 */}
      <Toolbar
        onAddAgent={addAgentNode}
        onDeleteSelected={deleteSelectedNode}
        hasSelection={!!selectedNodeId}
      />

      {/* 中间画布 */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls className="!rounded-lg !shadow-md !border !border-gray-200" />
          <MiniMap
            className="!rounded-lg !shadow-md !border !border-gray-200"
            nodeColor={(n) => (n.selected ? '#6366f1' : '#c7d2fe')}
            maskColor="rgba(0,0,0,0.05)"
          />
          <Panel position="top-right" className="flex gap-3">
            <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-gray-200 px-4 py-2 text-sm text-gray-500">
              节点: <span className="font-semibold text-indigo-600">{nodeCount}</span>
              <span className="mx-2">|</span>
              连线: <span className="font-semibold text-indigo-600">{edgeCount}</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* 右侧属性面板 */}
      {selectedNode && (
        <Sidebar
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onUpdate={updateNodeData}
        />
      )}
    </div>
  )
}
