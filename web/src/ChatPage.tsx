import { useCallback, useEffect, useRef, useState } from "react";
import { Bubble, Sender } from "@ant-design/x";
import { RobotOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Input, Typography } from "antd";
import { Bot } from "lucide-react";
import ChatHistory from "./components/ChatHistory";
import type { ConversationItem } from "./components/ChatHistory";
import { XMarkdown } from "@ant-design/x-markdown";
import { SenderRef } from "@ant-design/x/es/sender";

// ========== 消息类型 ==========
interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "ai";
  status: "local" | "loading" | "success";
}

// ========== 角色头像（v2.x avatar 为 ReactNode） ==========
const RoleAvatar = ({ role }: { role: "user" | "ai" }) => (
  <span
    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs"
    style={{ background: role === "user" ? "#6366f1" : "#10b981" }}
  >
    {role === "user" ? <UserOutlined /> : <RobotOutlined />}
  </span>
);

// ========== SSE 流式请求（EventSource） ==========
function connectSSE(
  message: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): EventSource {
  const url = `http://localhost:5000/chat/sse?message=${encodeURIComponent(message)}`;
  const es = new EventSource(url);

  es.addEventListener("greeting", (e: MessageEvent) => {
    try {
      const payload = JSON.parse(e.data);
      if (payload.type === "text" && payload.data) {
        onChunk(payload.data);
      } else if (payload.type === "done") {
        es.close();
        onDone();
      }
    } catch {
      // JSON 解析失败，跳过
    }
  });

  es.addEventListener("error", () => {
    es.close();
    onError("SSE 连接错误");
  });

  return es;
}

// ========== 组件 ==========

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const senderRef = useRef<SenderRef>(null!);
  const [currentUpdateInputId, setCurrentUpdateInputId] = useState("");

  // ---------- 初始化 Mock 历史 ----------
  useEffect(() => {
    const mockConversations: ConversationItem[] = [
      {
        id: "conv-1",
        title: "Agent 编排优化建议",
        lastMessage: "这些优化预计可提升 30% 的响应速度。",
        createdAt: "2026-05-19T10:00:00Z",
        updatedAt: "2026-05-20T08:00:00Z",
      },
      {
        id: "conv-2",
        title: "如何添加错误处理？",
        lastMessage: "您需要在流程中添加异常处理分支。",
        createdAt: "2026-05-18T14:30:00Z",
        updatedAt: "2026-05-19T16:00:00Z",
      },
      {
        id: "conv-3",
        title: "模型参数调优",
        lastMessage: "建议将 temperature 调整到 0.5",
        createdAt: "2026-05-17T09:00:00Z",
        updatedAt: "2026-05-17T09:30:00Z",
      },
    ];
    setConversations(mockConversations);
  }, []);

  // ---------- 发送消息 ----------
  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        content: text,
        role: "user",
        status: "local",
      };
      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        content: "",
        role: "ai",
        status: "loading",
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setLoading(true);

      // 更新对话标题
      if (activeConvId) {
        const shortTitle = text.slice(0, 30) + (text.length > 30 ? "…" : "");
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? {
                  ...c,
                  title: shortTitle,
                  lastMessage: text,
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        );
      }

      // 取消上一次请求
      eventSourceRef.current?.close();

      senderRef.current?.clear();
      setCurrentUpdateInputId("");

      // SSE 流式请求（EventSource）
      const es = connectSSE(
        text,
        // onChunk: 逐块更新 AI 消息
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: m.content + chunk } : m,
            ),
          );
        },
        // onDone: 标记完成
        () => {
          setLoading(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, status: "success" } : m,
            ),
          );
          // 更新最后消息
          setMessages((prev) => {
            const aiFinal = prev.find((m) => m.id === aiMsgId);
            if (aiFinal && activeConvId) {
              setConversations((cvs) =>
                cvs.map((c) =>
                  c.id === activeConvId
                    ? { ...c, lastMessage: aiFinal.content.slice(0, 80) }
                    : c,
                ),
              );
            }
            return prev;
          });
        },
        // onError
        (err) => {
          setLoading(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, content: `请求失败: ${err}`, status: "success" }
                : m,
            ),
          );
        },
      );
      eventSourceRef.current = es;
    },
    [activeConvId, loading],
  );

  // ---------- 选中历史对话 ----------
  const handleSelectConv = useCallback(
    (id: string) => {
      if (id === activeConvId) return;
      setActiveConvId(id);
      const conv = conversations.find((c) => c.id === id);
      if (conv) {
        setMessages([
          {
            id: `${id}-user`,
            content: `请帮我${conv.title}`,
            role: "user",
            status: "local",
          },
          {
            id: `${id}-ai`,
            content: conv.lastMessage,
            role: "ai",
            status: "success",
          },
        ]);
      }
    },
    [activeConvId, conversations],
  );

  // ---------- 新建 / 删除 / 重命名 ----------
  const handleNewConv = useCallback(() => {
    const newConv: ConversationItem = {
      id: `conv-${Date.now()}`,
      title: "新对话",
      lastMessage: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setMessages([]);
  }, []);

  const handleDeleteConv = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === activeConvId) {
        setActiveConvId(null);
        setMessages([]);
      }
    },
    [activeConvId],
  );

  const handleRenameConv = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c)),
    );
  }, []);

  const handleCancel = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <div className="flex h-full relative">
      {/* ======== 左侧历史 ======== */}
      <div className="w-64 h-full flex-shrink-0">
        <ChatHistory
          conversations={conversations}
          activeId={activeConvId}
          loading={false}
          onSelect={handleSelectConv}
          onNew={handleNewConv}
          onDelete={handleDeleteConv}
          onRename={handleRenameConv}
        />
      </div>

      {/* ======== 右侧对话区 ======== */}
      <div className="flex-1 flex flex-col h-full bg-gray-50">
        {/* 标题栏 */}
        <div className="flex-shrink-0 px-5 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
          <Typography.Text strong className="text-sm text-gray-700">
            {activeConvId
              ? conversations.find((c) => c.id === activeConvId)?.title ||
                "对话"
              : "AI 助手"}
          </Typography.Text>
          <span className="text-xs text-gray-400">
            {messages.length} 条消息
          </span>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Bot className="w-12 h-12 mb-4 text-gray-300" />
              <Typography.Text type="secondary" className="text-sm">
                选择或创建一个对话开始交流
              </Typography.Text>
              <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
                {[
                  "帮我优化 Agent 编排流程",
                  "如何添加错误处理机制？",
                  "介绍一下模型配置参数",
                ].map((s) => (
                  <Button
                    key={s}
                    size="small"
                    type="default"
                    className="text-xs"
                    onClick={() => handleSubmit(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto flex flex-col gap-4">
              {messages.map((msg) =>
                msg.role !== "user" ? (
                  <Bubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    placement="start"
                    contentRender={(content) => (
                      <div>
                        <XMarkdown>{content}</XMarkdown>
                      </div>
                    )}
                    avatar={<RoleAvatar role={msg.role} />}
                    variant="outlined"
                    shape="corner"
                    loading={msg.status === "loading"}
                  />
                ) : (
                  <Bubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    avatar={<RoleAvatar role={msg.role} />}
                    shape="corner"
                    loading={msg.status === "loading"}
                    placement="end"
                    variant="filled"
                    className="max-w-[68.5%]"
                    contentRender={(content) => (
                      <div
                        onDoubleClick={() =>
                          !loading && setCurrentUpdateInputId(msg.id)
                        }
                      >
                        {currentUpdateInputId &&
                        currentUpdateInputId === msg.id ? (
                          <div className="min-w-10 py-3">
                            <Sender
                              defaultValue={content}
                              loading={loading}
                              placeholder="输入消息，Enter 发送…"
                              onSubmit={handleSubmit}
                              onCancel={handleCancel}
                              onBlur={() => setCurrentUpdateInputId("")}
                            />
                          </div>
                        ) : (
                          <Typography.Text>{content}</Typography.Text>
                        )}
                      </div>
                    )}
                  />
                ),
              )}
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <Sender
              ref={senderRef}
              loading={loading}
              placeholder="输入消息，Enter 发送…"
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              disabled={!!currentUpdateInputId}
            />
            <p className="text-[11px] text-gray-400 text-center mt-1.5">
              AI 助手基于编排上下文提供智能建议 · 内容由 AI 生成仅供参考
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
