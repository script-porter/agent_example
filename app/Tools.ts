import fs from "fs";
import path from "path";
import os from "os";
import { tavily } from "@tavily/core";
import Agent from "./Agent";
import Model from "./enums";

// 工具定义：获取天气信息
export const getWeatherTool = {
  type: "function", // 固定字段，表示定义的是一个函数工具
  function: {
    name: "get_current_weather",
    description: "获取指定城市的当前天气信息",
    parameters: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "城市Code码，例如：上海市：310100",
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "温度单位",
        },
      },
      required: ["city"],
    },
  },
};

async function getCurrentWeather({
  city,
  unit = "celsius",
}: Record<string, any>) {
  // 注意：'city' 参数现在需要传入城市ID，例如北京是 '101010100'
  // 你可以根据需求，增加一个从城市名到城市ID的映射逻辑
  console.log(`🌦️ 正在查询城市ID为：${city} 的天气...`);

  try {
    // 1. 使用 fetch 发起真实请求
    const response = await fetch(
      `http://t.weather.sojson.com/api/weather/city/${city}`,
    );

    // 2. 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 3. 解析JSON数据
    const weatherData = await response.json();

    // 4. 检查API返回的状态码，判断请求是否成功
    // 官方的 JSON 返回中，成功时 status 为 200，失败时为非200[reference:4][reference:5]
    if (weatherData.status !== 200) {
      throw new Error(
        `Weather API error: ${weatherData.message || "Unknown error"}`,
      );
    }
    const cityName = weatherData.cityInfo.city;
    const temperature = weatherData.data.wendu; // 单位是摄氏度
    const condition = weatherData.data.forecast[0]?.type || "未知";
    const quality = weatherData.data.quality;
    const updateTime = weatherData.time;

    console.log(
      `✅ 成功获取 ${cityName} 天气：${temperature}°C，${condition}，空气质量${quality}`,
    );

    return {
      city: cityName,
      temperature: temperature,
      unit: unit, // 这里返回请求时传入的单位，与模型交互保持一致
      condition: condition,
      quality: quality,
      updateTime: updateTime,
    };
  } catch (error) {
    console.error(`❌ 获取天气信息失败：${(error as any).message}`);
    return {
      error: true,
      message: `无法获取城市 ${city} 的天气信息，请检查城市ID是否正确。`,
    };
  }
}

// 工具定义：获取当前桌面的所有文件信息
export const getDesktopFileTool = {
  type: "function", // 固定字段，表示定义的是一个函数工具
  function: {
    name: "get_desktop_files",
    description: "获取当前桌面的所有文件信息",
  },
};

export const getDesktopFiles = () => {
  try {
    const desktopPath = path.join(os.homedir(), "Desktop");
    // 从桌面获取所有文件
    const files = fs.readdirSync(desktopPath);
    return files;
  } catch (error) {
    console.error(`❌ 获取桌面文件失败：${(error as any).message}`);
    return {
      error: true,
      message: `无法获取桌面文件，请检查权限是否足够。`,
    };
  }
};

export const searchTool = {
  type: "function", // 固定字段，表示定义的是一个函数工具
  function: {
    name: "search_tool_query",
    description: "搜索互联网，获取实时网络信息",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "搜索查询关键词（可以是域名地址、关键词、句子等）",
        },
      },
      required: ["query"],
    },
  },
};

export const searchToolQuery = async ({ query }: { query: string }) => {
  try {
    const client = tavily({
      apiKey: process.env.TAVILY_API_KEY || "",
    });
    const response = await client.search(query, {
      searchDepth: "advanced",
    });
    return response;
  } catch (error) {
    console.error(`❌ 搜索互联网失败：${(error as any).message}`);
    return {
      error: true,
      message: `无法搜索互联网，请检查网络连接。`,
    };
  }
};

export const agentWorkflowTool = {
  type: "function",
  function: {
    name: "dispatch_sub_agents",
    description:
      "将一个或多个子任务派发给独立的子Agent执行，支持串行或并行模式。返回各任务的执行结果。",
    parameters: {
      type: "object",
      properties: {
        systemPrompt: {
          type: "string",
          description:
            "分发给每个子Agent的统一系统提示词（所有子任务共享此提示词）",
        },
        tasks: {
          type: "array",
          description: "要执行的子任务列表",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "任务唯一标识",
              },
              prompt: {
                type: "string",
                description: "发送给子Agent的具体任务指令",
              },
              nextTaskId: {
                type: "string",
                description:
                  "（仅串行模式）指定下一个要执行的任务ID。若不提供，则默认按tasks数组顺序执行",
              },
            },
            required: ["id", "prompt"],
          },
        },
        parallel: {
          type: "boolean",
          description:
            "true表示任务可并行执行；false表示串行执行（用于任务间有依赖的场景）",
        },
      },
      required: ["systemPrompt", "tasks", "parallel"],
    },
  },
};

const runTask = async ({
  systemPrompt,
  subTask,
  taskId,
}: {
  systemPrompt: string;
  subTask: string;
  taskId?: string;
}) => {
  const agent = new Agent(
    process.env.DEEPSEEK_API_URL,
    Model.DeepseekFlash,
    process.env.DEEPSEEK_API_KEY,
    [
      {
        role: "system",
        content: systemPrompt,
      },
    ],
  );

  try {
    const result = await agent.chat(subTask, {
      response_format: {
        type: "json_object",
      },
    });
    return {
      taskId,
      result: result.choices[0]?.message.content,
    };
  } catch (error) {
    return {
      taskId,
      status: "success",
      error: (error as any).message,
    };
  }
};

interface Task {
  id: string;
  prompt: string;
  nextTaskId: string;
}

export const agentWorkflowHandler = async ({
  systemPrompt,
  tasks,
  isSync,
}: {
  systemPrompt: string;
  tasks: Task[];
  isSync: boolean;
}) => {
  const taskLsit: any[] = [];
  let resultList: any[] = [];
  if (isSync) {
    tasks.forEach((item) => {
      taskLsit.push(runTask({ systemPrompt, subTask: item.prompt }));
    });
    resultList = await Promise.all(taskLsit);
  } else {
    let excuterCount = 0;

    while (excuterCount != tasks.length) {
      try {
        const currentTask = tasks[excuterCount] as Task;
        const current = tasks.find(({ id }) => id === currentTask.nextTaskId);
        const res = await runTask({
          systemPrompt,
          subTask: currentTask.prompt,
        });
        excuterCount += 1;
        resultList[excuterCount] = {
          ...current,
          status: "success",
          result: res,
        };
      } catch (error) {
        resultList[excuterCount] = {
          status: "error",
          error: (error as any).message,
        };
      }
    }
  }
};

export const toolMaps = {
  get_current_weather: {
    tool: getWeatherTool,
    function: getCurrentWeather,
  },
  get_desktop_files: {
    tool: getDesktopFileTool,
    function: getDesktopFiles,
  },
  search_tool_query: {
    tool: searchTool,
    function: searchToolQuery,
  },
};
