import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// ========== 数据模型 ==========

/** 前端 @xyflow/react 节点 */
export interface FlowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
  parentId?: string
  extent?: 'parent'
  style?: Record<string, unknown>
}

/** 前端 @xyflow/react 连线 */
export interface FlowEdge {
  id: string
  source: string
  target: string
  animated?: boolean
  style?: Record<string, unknown>
}

/** 一条编排流程 */
export interface Flow {
  id: string
  name: string
  description: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  createdAt: string
  updatedAt: string
}

// ========== 数据库路径 ==========
const DEFAULT_DB_PATH = join(process.cwd(), 'app', 'db', 'flow.json')

// ========== FlowTable 操作类 ==========

export class FlowTable {
  private dbPath: string

  constructor(dbPath?: string) {
    this.dbPath = dbPath ?? DEFAULT_DB_PATH
    this.ensureDB()
  }

  // ---------- 私有：文件 I/O ----------

  /** 确保 flow.json 存在 */
  private ensureDB(): void {
    if (!existsSync(this.dbPath)) {
      writeFileSync(this.dbPath, '[]', 'utf-8')
    }
  }

  /** 读取全部数据 */
  private readDB(): Flow[] {
    try {
      const raw = readFileSync(this.dbPath, 'utf-8')
      return JSON.parse(raw) as Flow[]
    } catch {
      return []
    }
  }

  /** 写入全部数据 */
  private writeDB(data: Flow[]): void {
    writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8')
  }

  // ---------- 公开：CRUD ----------

  /** 获取所有流程 */
  getAll(): Flow[] {
    return this.readDB()
  }

  /** 按 ID 获取单个流程 */
  getById(id: string): Flow | undefined {
    return this.readDB().find((f) => f.id === id)
  }

  /** 按名称模糊搜索 */
  search(keyword: string): Flow[] {
    const kw = keyword.toLowerCase()
    return this.readDB().filter(
      (f) =>
        f.name.toLowerCase().includes(kw) ||
        (f.description?.toLowerCase().includes(kw) ?? false),
    )
  }

  /** 新建流程（自动生成 ID 和时间戳） */
  create(data: Omit<Flow, 'id' | 'createdAt' | 'updatedAt'>): Flow {
    const flows = this.readDB()
    const now = new Date().toISOString()
    const flow: Flow = {
      id: this.generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    }
    flows.push(flow)
    this.writeDB(flows)
    return flow
  }

  /** 更新流程 */
  update(id: string, data: Partial<Omit<Flow, 'id' | 'createdAt'>>): Flow | null {
    const flows = this.readDB()
    const index = flows.findIndex((f) => f.id === id)
    if (index === -1) return null

    const existing = flows[index]!
    const updated: Flow = {
      id: existing.id,
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      nodes: data.nodes ?? existing.nodes,
      edges: data.edges ?? existing.edges,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    }
    flows[index] = updated
    this.writeDB(flows)
    return updated
  }

  /** 保存流程（存在则更新，不存在则新建） */
  save(flow: Flow): Flow {
    const existing = this.getById(flow.id)
    if (existing) {
      const result = this.update(flow.id, flow)
      return result!
    }
    return this.create(flow)
  }

  /** 仅保存 nodes 和 edges（轻量更新） */
  setFlow(id: string, nodes: FlowNode[], edges: FlowEdge[]): Flow | null {
    return this.update(id, { nodes, edges })
  }

  /** 删除流程 */
  delete(id: string): boolean {
    const flows = this.readDB()
    const filtered = flows.filter((f) => f.id !== id)
    if (filtered.length === flows.length) return false
    this.writeDB(filtered)
    return true
  }

  /** 获取流程总数 */
  count(): number {
    return this.readDB().length
  }

  // ---------- 工具 ----------

  /** 生成唯一 ID */
  private generateId(): string {
    return `flow_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
}

// ========== 单例导出 ==========
export const flowTable = new FlowTable()
