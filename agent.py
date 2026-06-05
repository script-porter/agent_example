"""AI Agent 核心类 —— 封装 OpenAI 兼容的对话与工具调用"""

import json
import asyncio
from typing import Any
from openai import AsyncOpenAI

from enums import Model
from tools import TOOL_REGISTRY
from skill_loader import SkillLoader


class Agent:
    """与 OpenAI 兼容 API 交互的 Agent

    支持：
    - 多轮对话历史管理
    - 工具调用自动循环 (tool_call_loop)
    - 上下文压缩
    - Skill 技能注入
    """

    def __init__(
        self,
        url: str,
        model: Model,
        api_key: str,
        system_prompt: list[dict[str, Any]] | None = None,
        tools: list[dict[str, Any]] | None = None,
        *,
        temperature: float = 0.7,
        reasoning_effort: str = "medium",
        thinking: bool = False,
        max_tokens: int = 1024,
        max_context_messages: int = 20,
        is_enable_skill: bool = True,
        stream: bool = False,
    ):
        self.url = url
        self.model = model
        self.api_key = api_key
        self.tools = tools or []
        self.temperature = temperature
        self.reasoning_effort = reasoning_effort
        self.thinking = "enabled" if thinking else "disabled"
        self.max_tokens = max_tokens
        self.max_context_messages = max_context_messages
        self.is_enable_skill = is_enable_skill
        self.system_prompt = system_prompt

        self.history: list[dict[str, Any]] = []
        self.skill_loader = SkillLoader()
        self.stream = stream

        self.client = AsyncOpenAI(
            base_url=self.url,
            api_key=self.api_key,
        )

        if self.system_prompt:
            self._inject_skills()
            print("系统提示词", self.system_prompt[0].get("content", "")[:200])
            self.history.extend(self.system_prompt)

    # ---------- 技能注入 ----------

    def _inject_skills(self) -> None:
        """将已加载的 Skill 注入到 system prompt 中"""
        if not self.system_prompt or not self.system_prompt[0].get("content"):
            return
        content = self.system_prompt[0]["content"]
        if self.is_enable_skill and self.skill_loader.skills:
            skills_text = "\n".join(
                f"{i + 1}. {s.name}：{s.description}"
                for i, s in enumerate(self.skill_loader.skills)
            )
            self.system_prompt[0]["content"] = f"""
                                                    {content}

                                                    ## 技能列表

                                                    - 你可以使用如下技能：

                                                    {skills_text}
                                                """
        else:
            self.system_prompt[0]["content"] = content

    # ---------- 历史管理 ----------

    def _add_history(self, message: dict[str, Any]) -> None:
        self.history.append(message)

    def add_tool_result(self, tool_call_id: str, result: str) -> None:
        self._add_history(
            {
                "role": "tool",
                "tool_call_id": tool_call_id,
                "content": result,
            }
        )

    # ---------- API 调用 ----------

    async def _call_api(self, options: dict[str, Any] | None = None) -> Any:
        """发起一次 API 调用，并将 assistant 回复加入历史"""
        try:
            kwargs: dict[str, Any] = {
                "model": self.model,
                "messages": self.history,
                "temperature": self.temperature,
                "extra_body": {
                    "thinking": {"type": self.thinking},
                },
                "stream": self.stream,
            }

            if self.tools:
                kwargs["tools"] = self.tools
                kwargs["tool_choice"] = "auto"

            if options and "response_format" in options:
                kwargs["response_format"] = options["response_format"]

            response = await asyncio.wait_for(
                self.client.chat.completions.create(**kwargs),
                timeout=30,
            )

            response_message = response.choices[0].message

            # 将 assistant 消息加入历史
            self._add_history(response_message.model_dump(exclude_none=True))

            return response
        except Exception as e:
            print(f"callAPI error: {e}")
            return None

    # ---------- 对话入口 ----------

    async def chat(self, prompt: str, options: dict[str, Any] | None = None) -> Any:
        """与模型交互，处理用户输入"""
        self._add_history({"role": "user", "content": prompt})
        response = await self._call_api(options)

        # 如果超过上下文轮数阈值，触发压缩
        if response and len(self.history) > self.max_context_messages:
            await self._compress_history()

        return await self.tool_call_loop(response) if response else None

    # ---------- 工具调用循环 ----------

    async def tool_call_loop(self, initial_response: Any) -> Any:
        """循环处理工具调用，直到模型返回最终文本回复"""
        response = initial_response

        while response and response.choices and response.choices[0].message.tool_calls:
            tool_calls = response.choices[0].message.tool_calls

            for tc in tool_calls:
                func_name = tc.function.name
                try:
                    func_args = json.loads(tc.function.arguments)
                except json.JSONDecodeError:
                    func_args = {}

                handler = TOOL_REGISTRY.get(func_name)
                if handler:
                    # 根据函数签名判断是否异步
                    fn = handler["function"]
                    if asyncio.iscoroutinefunction(fn):
                        result = await fn(func_args)
                    else:
                        result = fn(func_args)

                    print(f"[工具调用结果] {tc.id}: {str(result)[:200]}")

                    self.add_tool_result(tc.id, json.dumps(result, ensure_ascii=False))
                else:
                    self.add_tool_result(
                        tc.id,
                        json.dumps(
                            {"error": f"未知工具: {func_name}"}, ensure_ascii=False
                        ),
                    )

            response = await self._call_api()

        return response

    # ---------- 上下文压缩 ----------

    async def _compress_history(self) -> None:
        """压缩历史记录，保留最近消息并对早期消息做摘要"""
        from prompt.compress_prompt import COMPRESS_PROMPT

        # 保留最近 10 条，其余压缩
        keep_count = 10
        if len(self.history) <= keep_count:
            return

        to_compress = self.history[:-keep_count]
        recent = self.history[-keep_count:]

        # 将待压缩的消息格式化
        compress_text = json.dumps(to_compress, ensure_ascii=False, default=str)

        compress_agent = Agent(
            url=self.url,
            model=self.model,
            api_key=self.api_key,
            system_prompt=[{"role": "system", "content": COMPRESS_PROMPT}],
            is_enable_skill=False,
        )

        result = await compress_agent.chat(
            f"请压缩以下对话历史：\n{compress_text}",
            {"response_format": {"type": "json_object"}},
        )

        try:
            content = result.choices[0].message.content if result else "{}"
            summary = json.loads(content).get("summary", "")
        except (json.JSONDecodeError, AttributeError):
            summary = "[压缩失败]"

        # 用压缩摘要替换旧历史
        self.history = [
            {"role": "system", "content": f"[对话历史摘要]: {summary}"},
            *recent,
        ]
        print(f"[上下文压缩] 已将 {len(to_compress)} 条消息压缩为摘要")
