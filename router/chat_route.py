"""Chat 对话路由 —— SSE 流式响应"""

import os
from typing import Any
from fastapi import APIRouter, Query
from fastapi.sse import EventSourceResponse, ServerSentEvent

from agent import Agent
from enums import Model
from tools import TOOL_REGISTRY
import http

router = APIRouter(prefix="/chat", tags=["chat"])


class Sse:
    """SSE 事件构建工具 — 直接返回 ServerSentEvent，调用方 yield 即可"""

    @staticmethod
    def error(msg: str) -> ServerSentEvent:
        return ServerSentEvent(event="error", data={"type": "error", "data": msg})

    @staticmethod
    def text(data: str) -> ServerSentEvent:
        """发送纯文本片段"""
        return ServerSentEvent(event="greeting", data={"type": "text", "data": data})

    @staticmethod
    def json(data: dict[str, Any]) -> ServerSentEvent:
        """发送结构化 JSON 对象（ServerSentEvent 自动序列化）"""
        return ServerSentEvent(event="greeting", data={"type": "json", "data": data})

    @staticmethod
    def done() -> ServerSentEvent:
        return ServerSentEvent(event="greeting", data={"type": "done"})


@router.get("/sse", response_class=EventSourceResponse)
async def chat_sse(message: str = Query(default="", description="用户消息")):
    """AI 对话（SSE 流式响应，EventSource 兼容）"""
    if not message:
        yield Sse.error("消息不能为空")
        return

    agent = Agent(
        url=os.environ.get("DEEPSEEK_API_URL", ""),
        model=Model.DeepseekFlash,
        api_key=os.environ.get("DEEPSEEK_API_KEY", ""),
        system_prompt=[
            {
                "role": "system",
                "content": "你是一个专业的助手，你可以回答用户的问题。",
            },
        ],
        tools=[t["tool"] for t in TOOL_REGISTRY.values()],
        thinking=True,
    )

    try:
        response = await agent.chat(message)

        content = ""
        if response and response.choices:
            content = response.choices[0].message.content or ""

        yield Sse.text(content)
        yield Sse.done()

    except Exception as e:
        yield Sse.error(str(e))


@router.get("/history")
async def chat_history():
    """获取对话历史（暂未实现持久化）"""
    return {"code": 200, "message": "历史记录", "data": []}
