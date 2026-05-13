import readline from "readline";
import Agent from "./Agent";
import Model from "./enums";
import { toolMaps } from "./Tools";
import setupConfig from "./injectConfig";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

setupConfig();

const agent = new Agent(
  process.env.DEEPSEEK_API_URL || "",
  Model.DeepseekPro,
  process.env.DEEPSEEK_API_KEY || "",
  null,
  Object.values(toolMaps).map((item) => item.tool),
);

function ask() {
  rl.question("请输入问题（输入 exit 退出）： ", async (answer) => {
    if (answer === "exit") {
      console.log("程序退出");
      rl.close();
      return;
    }
    try {
      const response = await agent.chat(answer);
      console.log("[Agent Response]", response?.choices?.[0]?.message?.content);
    } catch (err) {
      console.error("请求失败：", err);
    }
    ask(); // 递归调用，等待下一个问题
  });
}

ask();
