"""工具定义与实现"""

import os
import json
import asyncio
from typing import Any

# Tavily 搜索
try:
    from tavily import TavilyClient
except ImportError:
    TavilyClient = None  # type: ignore[assignment]


# ==================== 工具定义 ====================

def _make_tool(name: str, description: str, parameters: dict) -> dict:
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": parameters,
        },
    }


# 天气工具
GET_WEATHER_TOOL = _make_tool(
    name="get_current_weather",
    description="获取指定城市的当前天气信息",
    parameters={
        "type": "object",
        "properties": {
            "city": {
                "type": "string",
                "description": "城市Code码，例如：上海市：310100",
            },
            "unit": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"],
                "description": "温度单位",
            },
        },
        "required": ["city"],
    },
)

# 桌面文件工具
GET_DESKTOP_FILES_TOOL = _make_tool(
    name="get_desktop_files",
    description="获取当前桌面的所有文件信息",
    parameters={"type": "object", "properties": {}},
)

# 搜索工具
SEARCH_TOOL = _make_tool(
    name="search_tool_query",
    description="搜索互联网，获取实时网络信息",
    parameters={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "搜索查询关键词（可以是域名地址、关键词、句子等）",
            },
        },
        "required": ["query"],
    },
)

# 子Agent编排工具
AGENT_WORKFLOW_TOOL = _make_tool(
    name="dispatch_sub_agents",
    description="将一个或多个子任务派发给独立的子Agent执行，支持串行或并行模式。返回各任务的执行结果。",
    parameters={
        "type": "object",
        "properties": {
            "systemPrompt": {
                "type": "string",
                "description": "分发给每个子Agent的统一系统提示词（所有子任务共享此提示词）",
            },
            "tasks": {
                "type": "array",
                "description": "要执行的子任务列表",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "任务唯一标识",
                        },
                        "prompt": {
                            "type": "string",
                            "description": "发送给子Agent的具体任务指令",
                        },
                        "nextTaskId": {
                            "type": "string",
                            "description": "（仅串行模式）指定下一个要执行的任务ID",
                        },
                    },
                    "required": ["id", "prompt"],
                },
            },
            "parallel": {
                "type": "boolean",
                "description": "true=并行执行；false=串行执行（任务间有依赖时使用）",
            },
        },
        "required": ["systemPrompt", "tasks", "parallel"],
    },
)

# 当前时间戳工具
CURRENT_TIMER_TOOL = _make_tool(
    name="get_current_timer",
    description="获取用户当前时间的时间戳/毫秒（时间戳为格林威治时间戳），涉及时间获取时使用。",
    parameters={"type": "object", "properties": {}},
)


# ==================== 工具实现 ====================

async def get_current_weather(args: dict[str, Any]) -> dict[str, Any]:
    """获取指定城市的天气信息"""
    city = args.get("city", "")
    unit = args.get("unit", "celsius")

    print(f"🌦️ 正在查询城市ID为：{city} 的天气...")

    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"http://t.weather.sojson.com/api/weather/city/{city}"
            )
            response.raise_for_status()
            weather_data = response.json()

        if weather_data.get("status") != 200:
            raise ValueError(
                f"Weather API error: {weather_data.get('message', 'Unknown error')}"
            )

        city_name = weather_data.get("cityInfo", {}).get("city", city)
        temperature = weather_data.get("data", {}).get("wendu", "未知")
        forecasts = weather_data.get("data", {}).get("forecast", [])
        condition = forecasts[0].get("type", "未知") if forecasts else "未知"
        quality = weather_data.get("data", {}).get("quality", "未知")
        update_time = weather_data.get("time", "")

        print(f"✅ 成功获取 {city_name} 天气：{temperature}°C，{condition}，空气质量{quality}")

        return {
            "city": city_name,
            "temperature": temperature,
            "unit": unit,
            "condition": condition,
            "quality": quality,
            "updateTime": update_time,
        }
    except Exception as e:
        print(f"❌ 获取天气信息失败：{e}")
        return {
            "error": True,
            "message": f"无法获取城市 {city} 的天气信息，请检查城市ID是否正确。",
        }


def get_desktop_files(_args: dict[str, Any] = None) -> dict[str, Any]:
    """获取当前桌面的所有文件信息"""
    try:
        desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
        if not os.path.exists(desktop_path):
            return {"error": True, "message": "桌面目录不存在"}
        files = os.listdir(desktop_path)
        return {"files": files}
    except Exception as e:
        print(f"❌ 获取桌面文件失败：{e}")
        return {
            "error": True,
            "message": "无法获取桌面文件，请检查权限是否足够。",
        }


async def search_tool_query(args: dict[str, Any]) -> dict[str, Any]:
    """搜索互联网"""
    query = args.get("query", "")
    try:
        if TavilyClient is None:
            return {"error": True, "message": "Tavily SDK 未安装"}

        api_key = os.environ.get("TAVILY_API_KEY", "")
        client = TavilyClient(api_key=api_key)
        response = await asyncio.to_thread(
            client.search, query, search_depth="advanced"
        )
        return response
    except Exception as e:
        print(f"❌ 搜索互联网失败：{e}")
        return {
            "error": True,
            "message": "无法搜索互联网，请检查网络连接。",
        }


def get_current_timer(_args: dict[str, Any] = None) -> dict[str, Any]:
    """获取当前时间戳"""
    import time
    return {"timestamp": int(time.time() * 1000)}


async def agent_workflow_handler(args: dict[str, Any]) -> dict[str, Any]:
    """
    子Agent编排：将子任务派发给独立的Agent执行，支持并行/串行模式。
    注意：此工具需要在外部注入 Agent 工厂函数。
    """
    from agent import Agent
    from enums import Model

    system_prompt = args.get("systemPrompt", "")
    tasks: list[dict] = args.get("tasks", [])
    is_parallel: bool = args.get("parallel", False)

    results: list[dict] = []

    async def run_single_task(task: dict) -> dict:
        task_id = task.get("id", "")
        prompt = task.get("prompt", "")
        agent = Agent(
            url=os.environ.get("DEEPSEEK_API_URL", ""),
            model=Model.DeepseekFlash,
            api_key=os.environ.get("DEEPSEEK_API_KEY", ""),
            system_prompt=[
                {"role": "system", "content": system_prompt},
            ],
            is_enable_skill=False,
        )
        try:
            result = await agent.chat(prompt, {"response_format": {"type": "json_object"}})
            content = result.choices[0].message.content if result and result.choices else ""
            return {"taskId": task_id, "result": content, "status": "success"}
        except Exception as e:
            return {"taskId": task_id, "error": str(e), "status": "error"}

    if is_parallel:
        coros = [run_single_task(t) for t in tasks]
        results = await asyncio.gather(*coros)
        return {"results": results}
    else:
        # 串行执行
        excuter_count = 0
        while excuter_count < len(tasks):
            task = tasks[excuter_count]
            res = await run_single_task(task)
            # 如果有 nextTaskId，找到对应任务
            next_id = task.get("nextTaskId")
            if next_id:
                next_task = next((t for t in tasks if t.get("id") == next_id), None)
                if next_task:
                    res["next_task"] = next_task
            results.append(res)
            excuter_count += 1
        return {"results": results}


# ==================== 工具注册表 ====================

# 每个工具映射：(tool定义, 执行函数)
TOOL_REGISTRY: dict[str, dict] = {
    "get_current_weather": {
        "tool": GET_WEATHER_TOOL,
        "function": get_current_weather,
    },
    "get_desktop_files": {
        "tool": GET_DESKTOP_FILES_TOOL,
        "function": get_desktop_files,
    },
    "search_tool_query": {
        "tool": SEARCH_TOOL,
        "function": search_tool_query,
    },
    "dispatch_sub_agents": {
        "tool": AGENT_WORKFLOW_TOOL,
        "function": agent_workflow_handler,
    },
    "get_current_timer": {
        "tool": CURRENT_TIMER_TOOL,
        "function": get_current_timer,
    },
}
