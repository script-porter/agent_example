import { memo } from 'react'
import type { GuideLine } from '../hooks/useAlignmentGuides'

interface GuideOverlayProps {
  lines: GuideLine[]
}

function GuideOverlay({ lines }: GuideOverlayProps) {
  if (lines.length === 0) return null

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-50"
      width="100%"
      height="100%"
    >
      {lines.map((line, i) => (
        <line
          key={`${line.orientation}_${line.position.toFixed(1)}_${i}`}
          x1={line.orientation === 'vertical' ? line.position : line.span[0]}
          y1={line.orientation === 'vertical' ? line.span[0] : line.position}
          x2={line.orientation === 'vertical' ? line.position : line.span[1]}
          y2={line.orientation === 'vertical' ? line.span[1] : line.position}
          stroke="#6366f1"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.7}
        />
      ))}
    </svg>
  )
}

export default memo(GuideOverlay)
