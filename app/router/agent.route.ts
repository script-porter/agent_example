import express from "express";
import app from "../app";
import { flowTable } from "../db/FlowTable";

const router: express.Router = express.Router();

// ========== Flow CRUD API ==========

/** 获取所有流程列表 */
router.get("/", (_req, res) => {
  const flows = flowTable.getAll();
  res.json({ code: 0, data: flows, total: flows.length });
});

/** 按 ID 获取单个流程 */
router.get("/:id", (req, res) => {
  const flow = flowTable.getById(req.params.id);
  if (!flow) {
    res.status(404).json({ code: 404, message: "流程不存在" });
    return;
  }
  res.json({ code: 0, data: flow });
});

/** 搜索流程 */
router.get("/search/:keyword", (req, res) => {
  const flows = flowTable.search(req.params.keyword);
  res.json({ code: 0, data: flows, total: flows.length });
});

/** 新建流程 */
router.post("/", (req, res) => {
  try {
    const flow = flowTable.create(req.body);
    res.status(201).json({ code: 0, data: flow, message: "创建成功" });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message || "创建失败" });
  }
});

/** 更新流程 */
router.put("/:id", (req, res) => {
  const flow = flowTable.update(req.params.id, req.body);
  if (!flow) {
    res.status(404).json({ code: 404, message: "流程不存在" });
    return;
  }
  res.json({ code: 0, data: flow, message: "更新成功" });
});

/** 删除流程 */
router.delete("/:id", (req, res) => {
  const ok = flowTable.delete(req.params.id);
  if (!ok) {
    res.status(404).json({ code: 404, message: "流程不存在" });
    return;
  }
  res.json({ code: 0, message: "删除成功" });
});

/** 执行编排 */
router.post("/execute", (req, res) => {
  console.log(req.body);
  res.send("execute flow");
});

export default router;
