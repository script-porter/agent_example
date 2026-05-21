import OpenAI from "openai";
import Model from "./enums";
import { ChatCompletionMessageParam, ReasoningEffort } from "openai/resources";
import { toolMaps } from "./Tools";
import { COMPRESS_PROMPT } from "./prompt/compressPrompt";
import { SkillLoader } from "./SkillLoader";

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface ChatOptions {
  response_format?: { type: string };
}

class Agent {
  private client: OpenAI = null!;
  /** @todo 历史记录，当前逻辑是将所有消息都加入历史记录，后续考虑对上下文管理进行优化 */
  private history: ChatCompletionMessageParam[] = [];

  private reasoningEffort: ReasoningEffort = "medium";

  private thinking: "enabled" | "disabled" = "disabled";

  /** 模型单次输出词元的限制 */
  private maxTokens: number = 1024;

  /** 上下文压缩摘要阙值 单位 以`轮` */
  private maxContextMessage = 20;

  private temperature: number = 0.7;

  private isEnableSkill: boolean = true;

  private skillLoader: SkillLoader = new SkillLoader();

  constructor(
    private url: string,
    private model: Model,
    private apiKey: string,
    private systemPrompt?: ChatCompletionMessageParam[] | null,
    private tools?: any[],
    private options?: {
      temperature?: number;
      reasoning_effort?: ReasoningEffort;
      thinking?: boolean;
      max_tokens?: number;
      isEnableSkill?: boolean;
    },
  ) {
    this.client = new OpenAI({
      baseURL: this.url,
      apiKey: this.apiKey,
    });
    if (this.systemPrompt?.length) {
      if (this.systemPrompt[0]?.content) this.injectSkills();
      this.history.push(...this.systemPrompt);
    }

    if (this.options) {
      this.reasoningEffort = this.options.reasoning_effort || "medium";
      this.thinking = this.options.thinking ? "enabled" : "disabled";
      this.maxTokens = this.options.max_tokens || 1024;
      this.temperature = this.options.temperature || 0.7;
      this.isEnableSkill = this.options.isEnableSkill || true;
    }
  }

  // 注入技能Skill
  private injectSkills() {
    if (!this.systemPrompt?.[0]?.content) return;
    this.systemPrompt[0].content = this.isEnableSkill
      ? `
        ${this.systemPrompt[0]?.content}

        ## 技能列表
        
        - 你可以使用如下技能：

        ${this.skillLoader.skills
          .map(
            (skill, index) => `
          ${index + 1}. ${skill.name}： ${skill.description}
        `,
          )
          .join("\n")}
      `
      : this.systemPrompt[0]?.content;
  }

  /** 将消息加入历史记录 */
  private addHistory(message: ChatCompletionMessageParam) {
    this.history.push(message);
    if (this.history.length > this.maxTokens && message.role === "assistant") {
      this.compressHistory();
    }
  }

  /** 将工具执行结果加入历史记录 */
  addToolResult(toolCallId: string, result: string) {
    this.addHistory({
      role: "tool",
      tool_call_id: toolCallId,
      content: result,
    });
  }

  /** 发起一次 API 调用，并将 assistant 回复加入历史 */
  private async callApi(option?: ChatOptions) {
    let response: any = null!;

    try {
      response = await this.client.chat.completions.create(
        {
          model: this.model,
          messages: this.history,
          tools: this.tools as any[],
          tool_choice: "auto",
          temperature: this.temperature,
          reasoning_effort: this.reasoningEffort,
          extra_body: {
            thinking: {
              type: this.thinking,
            },
          },
          response_format: option?.response_format,
        } as any,
        {
          timeout: 5000,
        },
      );
      const responseMessage = response?.choices?.[0]?.message;

      // 将 assistant 消息加入历史（无论是否包含 tool_calls）
      this.addHistory(responseMessage as ChatCompletionMessageParam);

      return response;
    } catch (error) {
      console.log("callAPI", error);
    }
  }

  /** 与模型交互，处理用户输入 */
  async chat(prompt: string, option?: ChatOptions) {
    // 1. 添加用户消息到历史
    this.addHistory({
      role: "user",
      content: prompt,
    });

    // 2. 调用 API 并将回复加入历史
    const response = await this.callApi(option);
    return this.toolCallLoop(response);
  }

  /** 循环处理工具调用，直到模型返回最终文本回复 */
  async toolCallLoop(initialResponse: OpenAI.Chat.Completions.ChatCompletion) {
    let response = initialResponse;

    // 只要回复中包含 tool_calls 就继续循环
    while (response.choices?.[0]?.message?.tool_calls?.length) {
      const toolCalls = response.choices[0].message.tool_calls;

      for (const item of toolCalls) {
        const functionItem: ToolCall = item as unknown as ToolCall;
        const toolResult = await toolMaps[
          functionItem.function.name as keyof typeof toolMaps
        ].function(JSON.parse(functionItem.function.arguments));

        console.log("[工具调用结果]", item.id, toolResult);

        // 将工具执行结果加入历史记录
        this.addToolResult(item.id, JSON.stringify(toolResult));
      }

      // 继续调用 API，获取下一轮回复（可能是文本或新一轮工具调用）
      response = await this.callApi();
    }

    return response;
  }
  /** 压缩历史记录，移除旧消息 */
  async compressHistory() {
    /** 策略：
     * 1. 保留最近10-20条消息（原格式）
     * 2. 超过max_tokens时，从10-20条消息开始，后续消息进行压缩摘要
     * 3. 压缩摘要需要使用单独专属模型，至于优化策略需要着重考虑
     */

    /** 以轮为主 */
    let MAX_COMPRESS_TOKENS = 10;

    let roundCount = 0;
    for (let i = this.history.length; i; i--) {
      const item = this.history[i];
      if (item?.role === "user") roundCount++;
    }

    // 判断是否需要压缩摘要
    if (this.history.length <= this.maxContextMessage) {
      return;
    }
    // 压缩摘要
    const compressedHistory = this.history.slice(0, -MAX_COMPRESS_TOKENS);

    const compressedStr = compressedHistory
      .map((item) => `${item.role}: ${item.content}`)
      .join("\n");

    const agent = new Agent(
      process.env.DEEPSEEK_API_URL || "",
      Model.DeepseekFlash,
      process.env.DEEPSEEK_API_KEY || "",
      [
        {
          role: "system",
          content: COMPRESS_PROMPT,
        },
      ],
    );

    const compressedResponse = await agent.chat(compressedStr, {
      response_format: { type: "json_object" },
    });
    console.log(
      "[压缩摘要]",
      compressedResponse?.choices?.[0]?.message?.content || "",
    );

    const compressedSummary = JSON.parse(
      compressedResponse?.choices?.[0]?.message?.content || "",
    );
    this.history = [
      {
        role: "system",
        content: compressedSummary.summary,
      },
      ...this.history.slice(-MAX_COMPRESS_TOKENS),
    ];
  }
}

export default Agent;
