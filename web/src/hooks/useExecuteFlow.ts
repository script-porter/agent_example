import { useCallback, useEffect, useRef, useState } from "react";
import type { Node, Edge } from "@xyflow/react";

// ========== API 响应类型 ==========
interface ApiResponse<T> {
  code: number;
  data: T;
  total?: number;
  message?: string;
}

interface FlowItem {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

// ========== Hook：加载 / 保存 / 执行编排 ==========
export function useFlowApi() {
  const [flows, setFlows] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // ---------- GET /flow —— 加载所有流程 ----------
  const fetchFlows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/flow`);
      console.log('Flow/nodes',res);

      const json: ApiResponse<FlowItem[]> = await res.json();
      if (json.code === 0) {
        setFlows(json.data);
      } else {
        setError(json.message || "加载失败");
      }
    } catch (err: any) {
      setError(err.message || "网络错误");
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------- GET /flow/:id ----------
  const fetchFlowById = useCallback(
    async (id: string): Promise<FlowItem | null> => {
      try {
        const res = await fetch(`/flow/${id}`);
        const json: ApiResponse<FlowItem> = await res.json();
        return json.code === 0 ? json.data : null;
      } catch {
        return null;
      }
    },
    [],
  );

  // ---------- POST /flow —— 新建流程 ----------
  const createFlow = useCallback(
    async (data: Partial<FlowItem>): Promise<FlowItem | null> => {
      try {
        const res = await fetch("/flow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json: ApiResponse<FlowItem> = await res.json();
        if (json.code === 0) {
          setFlows((prev) => [...prev, json.data]);
          return json.data;
        }
        return null;
      } catch {
        return null;
      }
    },
    [],
  );

  // ---------- PUT /flow/:id —— 更新流程 ----------
  const updateFlow = useCallback(
    async (id: string, data: Partial<FlowItem>): Promise<FlowItem | null> => {
      try {
        const res = await fetch(`/flow/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json: ApiResponse<FlowItem> = await res.json();
        if (json.code === 0) {
          setFlows((prev) => prev.map((f) => (f.id === id ? json.data : f)));
          return json.data;
        }
        return null;
      } catch {
        return null;
      }
    },
    [],
  );

  // ---------- PUT /flow/:id (轻量：仅 nodes+edges) ----------
  const saveFlowNodesEdges = useCallback(
    async (id: string, nodes: Node[], edges: Edge[]): Promise<boolean> => {
      try {
        const res = await fetch(`/flow/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
        });
        const json = await res.json();
        return json.code === 0;
      } catch {
        return false;
      }
    },
    [],
  );

  // ---------- DELETE /flow/:id ----------
  const deleteFlow = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/flow/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.code === 0) {
        setFlows((prev) => prev.filter((f) => f.id !== id));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // ---------- POST /flow/execute —— 执行编排 ----------
  const executeFlow = useCallback(
    async (nodes: Node[], edges: Edge[]): Promise<void> => {
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      try {
        const res = await fetch("/flow/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
          signal: controllerRef.current.signal,
        });
        await res.text();
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("执行编排失败:", err);
        }
      }
    },
    [],
  );

  return {
    flows,
    loading,
    error,
    fetchFlows,
    fetchFlowById,
    createFlow,
    updateFlow,
    saveFlowNodesEdges,
    deleteFlow,
    executeFlow,
  };
}
