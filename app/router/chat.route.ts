import express from "express";
const router: express.Router = express.Router();
import Agent from "../Agent";
import Model from "../enums";
import { toolMaps } from "../Tools";

enum EventName {
  Greeting = "greeting",
  Complete = "complete",
}

/** AI 对话（SSE 流式响应） */
router.get("/sse", async (req, res) => {
  const { message = "" } = req.query ?? {};
  if (!message) {
    res.status(400).json({ code: 400, message: "消息不能为空" });
    return;
  }

  // 设置 SSE 必需头信息
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // 允许跨域（如果需要）
  res.setHeader("Access-Control-Allow-Origin", "*");

  // 发送一个自定义事件 'greeting' 的消息
  const sendEvent = (message: string) => {
    // 格式：event: 事件名\ndata: 消息内容\n\n
    res.write(`event: ${EventName.Greeting}\n`);
    res.write(
      `data: ${JSON.stringify({
        type: "text",
        data: message,
      })}\n`,
    );
    res.write("\n\n");
  };

  const sendDoneEvent = () => {
    // 格式：event: 事件名\ndata: 消息内容\n\n
    res.write(`event: ${EventName.Greeting}\n`);
    res.write(
      `data: ${JSON.stringify({
        type: "done",
      })}\n`,
    );
    res.write("\n\n");
  };

  const agent = new Agent(
    process.env.DEEPSEEK_API_URL,
    Model.DeepseekPro,
    process.env.DEEPSEEK_API_KEY,
    [
      {
        role: "system",
        content: "你是一个专业的助手，你可以回答用户的问题。",
      },
    ],
    Object.values(toolMaps).map((t) => t.tool),
  );
  try {
    const response = await agent.chat(message as string);
    sendEvent(response.choices[0]?.message?.content || "");
    sendDoneEvent();
  } catch (error) {
    res.status(500).json({ code: 500, message: "服务器错误" });
  }
});

router.get("/history", async (req, res) => {
  res.status(200).json({ code: 200, message: "历史记录" });
});

export default router;
