"use client"

import { cn } from "@/lib/utils"

interface ConnectionLineProps {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  type: "reply" | "quote"
  isHighlighted: boolean
}

export function ConnectionLine({ sourceX, sourceY, targetX, targetY, type, isHighlighted }: ConnectionLineProps) {
  // Calculate the center points of the nodes
  const sourceNodeCenterX = sourceX + 144 // Half of node width (288/2)
  const sourceNodeCenterY = sourceY + 75 // Approximate half of node height
  const targetNodeCenterX = targetX + 144
  const targetNodeCenterY = targetY + 75

  // Calculate the angle for the arrow
  const angle = Math.atan2(targetNodeCenterY - sourceNodeCenterY, targetNodeCenterX - sourceNodeCenterX)

  // Calculate the end points with some offset to not overlap the nodes
  const nodeRadius = 75
  const sourceOffsetX = sourceNodeCenterX + Math.cos(angle) * nodeRadius
  const sourceOffsetY = sourceNodeCenterY + Math.sin(angle) * nodeRadius
  const targetOffsetX = targetNodeCenterX - Math.cos(angle) * nodeRadius
  const targetOffsetY = targetNodeCenterY - Math.sin(angle) * nodeRadius

  // For quote connections, add a curve
  const isCurved = type === "quote"

  // Calculate control points for curved lines
  const dx = targetOffsetX - sourceOffsetX
  const dy = targetOffsetY - sourceOffsetY
  const controlX = sourceOffsetX + dx / 2 - dy / 4
  const controlY = sourceOffsetY + dy / 2 + dx / 4

  // Path for the line
  const path = isCurved
    ? `M ${sourceOffsetX} ${sourceOffsetY} Q ${controlX} ${controlY} ${targetOffsetX} ${targetOffsetY}`
    : `M ${sourceOffsetX} ${sourceOffsetY} L ${targetOffsetX} ${targetOffsetY}`

  // Calculate arrow points
  const arrowLength = 10
  const arrowWidth = 6
  const arrowAngle = isCurved ? Math.atan2(targetOffsetY - controlY, targetOffsetX - controlX) : angle

  const arrowPoint1X = targetOffsetX - arrowLength * Math.cos(arrowAngle) + arrowWidth * Math.sin(arrowAngle)
  const arrowPoint1Y = targetOffsetY - arrowLength * Math.sin(arrowAngle) - arrowWidth * Math.cos(arrowAngle)
  const arrowPoint2X = targetOffsetX - arrowLength * Math.cos(arrowAngle) - arrowWidth * Math.sin(arrowAngle)
  const arrowPoint2Y = targetOffsetY - arrowLength * Math.sin(arrowAngle) + arrowWidth * Math.cos(arrowAngle)

  return (
    <>
      {/* Connection line */}
      <path
        d={path}
        fill="none"
        className={cn(
          "transition-colors",
          type === "reply"
            ? isHighlighted
              ? "stroke-blue-500"
              : "stroke-blue-300 dark:stroke-blue-700"
            : isHighlighted
              ? "stroke-green-500"
              : "stroke-green-300 dark:stroke-green-700",
          type === "reply" ? "stroke-[2px]" : "stroke-[2px] stroke-dasharray-2",
        )}
      />

      {/* Arrow head */}
      <polygon
        points={`${targetOffsetX},${targetOffsetY} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`}
        className={cn(
          "transition-colors",
          type === "reply"
            ? isHighlighted
              ? "fill-blue-500"
              : "fill-blue-300 dark:fill-blue-700"
            : isHighlighted
              ? "fill-green-500"
              : "fill-green-300 dark:fill-green-700",
        )}
      />
    </>
  )
}
