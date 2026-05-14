import { useCallback, useState } from "react";
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
  type NodeChange,
  addEdge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import AgentGroupNode from "./components/AgentGroupNode";
import ModelNode from "./components/ModelNode";
import ToolNode from "./components/ToolNode";
import StartNode from "./components/StartNode";
import EndNode from "./components/EndNode";
import GuideOverlay from "./components/GuideOverlay";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import {
  defaultAgentData,
  defaultModelData,
  defaultToolData,
} from "./types/nodes";
import { mockFlowData } from "./mock/data";
import { useAlignmentGuides } from "./hooks/useAlignmentGuides";

// ========== 从 Mock 数据加载初始节点与连线 ==========
const initialNodes: Node[] = mockFlowData.nodes;
const initialEdges: Edge[] = mockFlowData.edges;

// ========== 注册自定义节点类型（模块级，避免重复创建） ==========
const nodeTypes: NodeTypes = {
  startNode: StartNode,
  endNode: EndNode,
  agentGroup: AgentGroupNode,
  modelNode: ModelNode,
  toolNode: ToolNode,
};

export default function App() {
  const [nodes, setNodes, baseOnNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // ========== 标线系统 ==========
  const { guides, snapPosition, clearGuides, syncNodes } = useAlignmentGuides();

  // 每次 nodes 变更后同步到 hook
  syncNodes(nodes);

  // 包装 onNodesChange：在拖拽时应用对齐吸附
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // 检测拖拽状态
      const hasDragging = changes.some(
        (c) => c.type === "position" && c.dragging,
      );
      const hasDragStop = changes.some(
        (c) => c.type === "position" && c.dragging === false,
      );

      if (hasDragging) {
        // 对每个位置变更应用吸附
        const snapped = changes.map((c) => {
          if (c.type === "position" && c.dragging && c.position) {
            const snappedPos = snapPosition(c.id, c.position);
            return { ...c, position: snappedPos };
          }
          return c;
        });
        baseOnNodesChange(snapped);
      } else {
        if (hasDragStop) clearGuides();
        baseOnNodesChange(changes);
      }
    },
    [baseOnNodesChange, snapPosition, clearGuides],
  );

  const selectedNode = selectedNodeId
    ? (nodes.find((n) => n.id === selectedNodeId) ?? null)
    : null;

  // ========== 连线 ==========
  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges],
  );

  // ========== 选中 ==========
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // ========== 更新节点数据 ==========
  const updateNodeData = useCallback(
    (nodeId: string, updates: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n,
        ),
      );
    },
    [setNodes],
  );

  // ========== 添加 Agent 组 ==========
  const addAgentNode = useCallback(() => {
    const id = `agent-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "agentGroup",
        position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
        data: { ...defaultAgentData, label: `新 Agent ${id.slice(-4)}` },
      },
    ]);
  }, [setNodes]);

  // ========== 添加模型（平级节点） ==========
  const addModelNode = useCallback(() => {
    const id = `m-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "modelNode",
        position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
        data: { ...defaultModelData, label: `模型 ${id.slice(-4)}` },
      },
    ]);
  }, [setNodes]);

  // ========== 添加工具（平级节点） ==========
  const addToolNode = useCallback(() => {
    const id = `t-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "toolNode",
        position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
        data: { ...defaultToolData, label: `工具 ${id.slice(-4)}` },
      },
    ]);
  }, [setNodes]);

  // ========== 删除选中节点（同时清理关联连线） ==========
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNodeId && e.target !== selectedNodeId,
      ),
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  // ========== 添加开始节点 ==========
  const addStartNode = useCallback(() => {
    setNodes((nds) => [
      ...nds,
      {
        id: `start-${Date.now()}`,
        type: "startNode",
        position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
        data: {},
      },
    ]);
  }, [setNodes]);

  // ========== 添加结束节点 ==========
  const addEndNode = useCallback(() => {
    setNodes((nds) => [
      ...nds,
      {
        id: `end-${Date.now()}`,
        type: "endNode",
        position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
        data: {},
      },
    ]);
  }, [setNodes]);

  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* 左侧工具栏 */}
      <Toolbar
        onAddAgent={addAgentNode}
        onAddModel={addModelNode}
        onAddTool={addToolNode}
        onAddStart={addStartNode}
        onAddEnd={addEndNode}
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
          deleteKeyCode={["Backspace", "Delete"]}
        >
          {/* 标线图层 */}
          <GuideOverlay lines={guides} />
          <Background color="#e5e7eb" gap={20} />
          <Controls className="!rounded-lg !shadow-md !border !border-gray-200" />
          <MiniMap
            className="!rounded-lg !shadow-md !border !border-gray-200"
            nodeColor={(n) =>
              n.selected
                ? "#6366f1"
                : n.type === "startNode"
                  ? "#6ee7b7"
                  : n.type === "endNode"
                    ? "#fda4af"
                    : n.type === "modelNode"
                      ? "#6ee7b7"
                      : n.type === "toolNode"
                        ? "#fcd34d"
                        : "#c7d2fe"
            }
            maskColor="rgba(0,0,0,0.05)"
          />
          <Panel position="top-right" className="flex gap-3">
            <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-gray-200 px-4 py-2 text-sm text-gray-500">
              节点:{" "}
              <span className="font-semibold text-indigo-600">{nodeCount}</span>
              <span className="mx-2">|</span>
              连线:{" "}
              <span className="font-semibold text-indigo-600">{edgeCount}</span>
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
  );
}
