import { useCallback, useState, useRef } from 'react'
import type { Node } from '@xyflow/react'

// ========== 类型 ==========
export interface GuideLine {
  orientation: 'horizontal' | 'vertical'
  position: number
  span: [number, number]
}

// ========== 节点尺寸估算 ==========
const NODE_SIZES: Record<string, { w: number; h: number }> = {
  startNode: { w: 130, h: 46 },
  endNode: { w: 130, h: 46 },
  agentGroup: { w: 300, h: 100 },
  modelNode: { w: 180, h: 105 },
  toolNode: { w: 180, h: 110 },
}

function getRect(node: Node, overridePos?: { x: number; y: number }) {
  const pos = overridePos ?? node.position
  const size = NODE_SIZES[node.type || ''] ?? { w: 200, h: 100 }
  const measured = (node as any).measured
  const w = measured?.width ?? size.w
  const h = measured?.height ?? size.h
  return { left: pos.x, right: pos.x + w, top: pos.y, bottom: pos.y + h, width: w, height: h }
}

// ========== 阈值 ==========
const SNAP = 6

// ========== 检查两个矩形是否对齐 ==========
type AlignResult = { vertical: GuideLine[]; horizontal: GuideLine[]; dx: number; dy: number }

function checkAlign(
  dragRect: ReturnType<typeof getRect>,
  otherRect: ReturnType<typeof getRect>,
): AlignResult {
  const vertical: GuideLine[] = []
  const horizontal: GuideLine[] = []
  const snapDx: number[] = []
  const snapDy: number[] = []

  const pairs: Array<{
    dv: number        // dragging value
    ov: number        // other value
    orientation: 'vertical' | 'horizontal'
    spanA: [number, number]
    spanB: [number, number]
  }> = [
    // 左边缘
    { dv: dragRect.left, ov: otherRect.left, orientation: 'vertical',
      spanA: [dragRect.top, dragRect.bottom], spanB: [otherRect.top, otherRect.bottom] },
    // 右边缘
    { dv: dragRect.right, ov: otherRect.right, orientation: 'vertical',
      spanA: [dragRect.top, dragRect.bottom], spanB: [otherRect.top, otherRect.bottom] },
    // 垂直中线
    { dv: dragRect.left + dragRect.width / 2, ov: otherRect.left + otherRect.width / 2, orientation: 'vertical',
      spanA: [dragRect.top, dragRect.bottom], spanB: [otherRect.top, otherRect.bottom] },
    // 上边缘
    { dv: dragRect.top, ov: otherRect.top, orientation: 'horizontal',
      spanA: [dragRect.left, dragRect.right], spanB: [otherRect.left, otherRect.right] },
    // 下边缘
    { dv: dragRect.bottom, ov: otherRect.bottom, orientation: 'horizontal',
      spanA: [dragRect.left, dragRect.right], spanB: [otherRect.left, otherRect.right] },
    // 水平中线
    { dv: dragRect.top + dragRect.height / 2, ov: otherRect.top + otherRect.height / 2, orientation: 'horizontal',
      spanA: [dragRect.left, dragRect.right], spanB: [otherRect.left, otherRect.right] },
  ]

  for (const p of pairs) {
    const diff = p.dv - p.ov
    if (Math.abs(diff) <= SNAP) {
      if (p.orientation === 'vertical') {
        vertical.push({
          orientation: 'vertical',
          position: p.ov,
          span: [Math.min(p.spanA[0], p.spanB[0]), Math.max(p.spanA[1], p.spanB[1])],
        })
        snapDx.push(-diff)
      } else {
        horizontal.push({
          orientation: 'horizontal',
          position: p.ov,
          span: [Math.min(p.spanA[0], p.spanB[0]), Math.max(p.spanA[1], p.spanB[1])],
        })
        snapDy.push(-diff)
      }
    }
  }

  return { vertical, horizontal,
    dx: snapDx.length ? snapDx.reduce((a, b) => (Math.abs(a) < Math.abs(b) ? a : b)) : 0,
    dy: snapDy.length ? snapDy.reduce((a, b) => (Math.abs(a) < Math.abs(b) ? a : b)) : 0,
  }
}

// ========== 去重 ==========
function dedupe(lines: GuideLine[]): GuideLine[] {
  const map = new Map<string, GuideLine>()
  for (const l of lines) {
    const key = `${l.orientation}_${l.position.toFixed(0)}`
    const e = map.get(key)
    if (!e || (l.span[1] - l.span[0]) > (e.span[1] - e.span[0])) map.set(key, l)
  }
  return Array.from(map.values())
}

// ========== Hook ==========
export function useAlignmentGuides() {
  const [guides, setGuides] = useState<GuideLine[]>([])
  const nodesRef = useRef<Node[]>([])

  // 由外部调用来同步 nodes
  const syncNodes = useCallback((nds: Node[]) => {
    nodesRef.current = nds
  }, [])

  // 计算对齐并返回 snapped 位置
  const snapPosition = useCallback(
    (nodeId: string, proposedPos: { x: number; y: number }): { x: number; y: number } => {
      const nodes = nodesRef.current
      const draggingNode = nodes.find((n) => n.id === nodeId)
      if (!draggingNode) {
        setGuides([])
        return proposedPos
      }

      const dragRect = getRect({ ...draggingNode, position: proposedPos })

      const allVertical: GuideLine[] = []
      const allHorizontal: GuideLine[] = []
      let totalDx = 0
      let totalDy = 0

      for (const other of nodes) {
        if (other.id === nodeId) continue
        if (other.parentId === nodeId || draggingNode.parentId === other.id) continue

        const result = checkAlign(dragRect, getRect(other))
        allVertical.push(...result.vertical)
        allHorizontal.push(...result.horizontal)
        if (result.dx !== 0) totalDx = result.dx
        if (result.dy !== 0) totalDy = result.dy
      }

      const allGuides = [...dedupe(allVertical), ...dedupe(allHorizontal)]
      setGuides(allGuides)

      return {
        x: proposedPos.x + totalDx,
        y: proposedPos.y + totalDy,
      }
    },
    [],
  )

  // 停止拖拽时清除辅助线
  const clearGuides = useCallback(() => {
    setGuides([])
  }, [])

  return { guides, snapPosition, clearGuides, syncNodes }
}

