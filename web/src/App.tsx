import { useCallback, useEffect, useState } from "react";
import { App as AntdApp } from "antd";
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
import { ApartmentOutlined, MessageOutlined } from "@ant-design/icons";
import AgentGroupNode from "./components/AgentGroupNode";
import ModelNode from "./components/ModelNode";
import ToolNode from "./components/ToolNode";
import StartNode from "./components/StartNode";
import EndNode from "./components/EndNode";
import GuideOverlay from "./components/GuideOverlay";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import ChatPage from "./ChatPage";
import {
  defaultAgentData,
  defaultModelData,
  defaultToolData,
} from "./types/nodes";
import { mockFlowData } from "./mock/data";
import { useAlignmentGuides } from "./hooks/useAlignmentGuides";
import { useFlowApi } from "./hooks/useExecuteFlow";

// ========== 默认回退数据（API 不可用时使用 Mock） ==========
const fallbackNodes: Node[] = mockFlowData.nodes;
const fallbackEdges: Edge[] = mockFlowData.edges;

// ========== 注册自定义节点类型（模块级，避免重复创建） ==========
const nodeTypes: NodeTypes = {
  startNode: StartNode,
  endNode: EndNode,
  agentGroup: AgentGroupNode,
  modelNode: ModelNode,
  toolNode: ToolNode,
};

export default function App() {
  const [nodes, setNodes, baseOnNodesChange] = useNodesState(fallbackNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(fallbackEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<"flow" | "chat">("flow");

  // ========== 标线系统 ==========
  const { guides, snapPosition, clearGuides, syncNodes } = useAlignmentGuides();

  // ========== API 操作 ==========
  const { flows, loading, error, fetchFlows, fetchFlowById, executeFlow } =
    useFlowApi();

  // 每次 nodes 变更后同步到 hook
  syncNodes(nodes);

  // ========== 首次加载：从 API 获取编排数据 ==========
  useEffect(() => {
    let cancelled = false;
    async function load() {
      await fetchFlows();
      if (cancelled) return;
      // 加载第一个流程的数据到画布
      setFlowsData();
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // flows 加载完成后更新画布
  useEffect(() => {
    if (flows.length > 0 && dataLoading) {
      setFlowsData();
    }
  }, [flows]);

  const setFlowsData = useCallback(() => {
    if (flows.length > 0) {
      const first = flows[0];
      setNodes(first.nodes);
      setEdges(first.edges);
      setCurrentFlowId(first.id);
      setDataLoading(false);
    } else if (!loading && flows.length === 0) {
      // API 无数据，使用 fallback
      setDataLoading(false);
    }
  }, [flows, loading, setNodes, setEdges]);

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
        position: {
          x: Math.random() * 300 + 100,
          y: Math.random() * 300 + 100,
        },
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
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
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
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
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
        position: {
          x: Math.random() * 300 + 100,
          y: Math.random() * 300 + 100,
        },
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
        position: {
          x: Math.random() * 300 + 100,
          y: Math.random() * 300 + 100,
        },
        data: {},
      },
    ]);
  }, [setNodes]);

  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  const callExecuteFlow = useCallback(() => {
    executeFlow(nodes, edges);
  }, [executeFlow, nodes, edges]);

  useEffect(() => {
    // nodes/edges 变更时记录（可扩展为自动保存）
  }, [nodes, edges]);

  return (
    <AntdApp>
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        {/* ======== 顶部导航栏 ======== */}
        <div className="flex-shrink-0 h-11 bg-white border-b border-gray-200 flex items-center px-4 gap-0 select-none">
          <div className="flex items-center gap-2 mr-6">
            <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">AO</span>
            </div>
            <span className="text-sm font-bold text-gray-800">Agent 编排平台</span>
          </div>
          <nav className="flex h-full">
            <button
              onClick={() => setCurrentPage("flow")}
              className={`
                flex items-center gap-1.5 px-4 h-full text-sm font-medium transition-colors border-b-[3px] -mb-px
                ${currentPage === "flow"
                  ? "text-indigo-600 border-indigo-500"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <ApartmentOutlined />
              编排
            </button>
            <button
              onClick={() => setCurrentPage("chat")}
              className={`
                flex items-center gap-1.5 px-4 h-full text-sm font-medium transition-colors border-b-[3px] -mb-px
                ${currentPage === "chat"
                  ? "text-indigo-600 border-indigo-500"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <MessageOutlined />
              对话
            </button>
          </nav>
        </div>

        {/* ======== 页面内容 ======== */}
        <div className="flex-1 overflow-hidden">
          {currentPage === "flow" ? (
            <div className="flex h-full">
              <Toolbar
                onAddAgent={addAgentNode}
                onAddModel={addModelNode}
                onAddTool={addToolNode}
                onAddStart={addStartNode}
                onAddEnd={addEndNode}
                onDeleteSelected={deleteSelectedNode}
                hasSelection={!!selectedNodeId}
              />

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

              {selectedNode && (
                <Sidebar
                  node={selectedNode}
                  onClose={() => setSelectedNodeId(null)}
                  onUpdate={updateNodeData}
                  onExecute={callExecuteFlow}
                />
              )}
            </div>
          ) : (
            <div className="h-full">
              <ChatPage />
            </div>
          )}
        </div>
      </div>
    </AntdApp>
  );
}
