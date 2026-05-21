import express from "express";
import setupConfig from "./injectConfig";
import flowRouter from "./router/agent.route";
import chatRouter from "./router/chat.route";
import { SkillLoader } from "./SkillLoader";

setupConfig();

const app: express.Express = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ========== 路由挂载 ==========

const router = express.Router();

router.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.use(router);
app.use("/flow", flowRouter);
app.use("/chat", chatRouter);

// ========== 启动服务 ==========

const server = app.listen(5000, () => {
  const address = server?.address() as any;

  const host = address?.address === "::" ? "localhost" : address?.address;
  const port = address?.port;

  console.log(`\x1B[34mhttp://${host}:${port}`, "\x1B[0m");
});

export default app;
