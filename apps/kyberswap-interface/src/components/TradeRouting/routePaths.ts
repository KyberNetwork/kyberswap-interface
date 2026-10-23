import {
  type PathPoint,
  type RouteRect,
  findNonOverlapRanges,
  getPointOnPathAtRatio,
  selectPointsOnRectEdge,
} from 'components/TradeRouting/routeGeometry'
import type { RouteGraph } from 'components/TradeRouting/routeGraph'

export type RoutePath = { id: string; startX: number; startY: number; percent: number | undefined; path: string }
type DirectRoutePath = RoutePath & { direct: true; endX: number; endY: number }
type IndirectRoutePath = {
  direct: false
  id: string
  sourceRect: RouteRect
  targetRect: RouteRect
  middleNodeRects: RouteRect[]
  sameLevelNodes: RouteRect[]
  percent: number | undefined
}
type RoutePathCandidate = DirectRoutePath | IndirectRoutePath
export type RoutePathLayout = {
  id: string
  paths: (RoutePath & { label: PathPoint })[]
  terminal: { label: PathPoint; percent?: number; path: string; connector: string } | null
  inputConnector: string | null
}

const buildNodePaths = (graph: RouteGraph, nodeId: string, nodeRects: Record<string, RouteRect>): RoutePath[] => {
  const { nodes, edges, maximumPathLengths } = graph
  const edgesOut = edges.filter(edge => edge.source === nodeId)
  const candidates = edgesOut.map((edge): RoutePathCandidate | null => {
    const { percent, id } = edge

    const sourceLevel = maximumPathLengths[edge.source]
    const targetLevel = maximumPathLengths[edge.target]
    const middleNodeRects = nodes
      .filter(node => maximumPathLengths[node.id] > sourceLevel && maximumPathLengths[node.id] < targetLevel)
      .map(node => nodeRects[node.id])
      .filter(Boolean) as RouteRect[]
    const sameLevelNodes = nodes
      .filter(node => maximumPathLengths[node.id] === targetLevel)
      .map(node => nodeRects[node.id])
      .filter(Boolean) as RouteRect[]

    const sourceRect = nodeRects[edge.source]
    const targetRect = nodeRects[edge.target]
    if (!sourceRect || !targetRect) return null

    const availableRanges = findNonOverlapRanges(
      [sourceRect.y, sourceRect.y + sourceRect.height],
      middleNodeRects.map(node => [node.y, node.y + node.height]),
    )

    let maxWidthOverlap: [number, number] | null = null
    let maxWidth = 0
    const [start, end] = [targetRect.y, targetRect.y + targetRect.height]

    for (const [rangeStart, rangeEnd] of availableRanges) {
      if (end >= rangeStart && start <= rangeEnd) {
        const overlapStart = Math.max(start, rangeStart)
        const overlapEnd = Math.min(end, rangeEnd)
        const width = overlapEnd - overlapStart
        if (width > maxWidth) {
          maxWidth = width
          maxWidthOverlap = [overlapStart, overlapEnd]
        }
      }
    }
    if (maxWidthOverlap) {
      const startX = sourceRect.x + sourceRect.width
      const startY = (maxWidthOverlap[0] + maxWidthOverlap[1]) / 2
      return {
        direct: true,
        id,
        startX,
        startY,
        endX: targetRect.x,
        endY: startY,
        percent,
        path: `M ${startX} ${startY} L ${targetRect.x} ${startY}`,
      }
    }
    return {
      direct: false,
      id,
      sourceRect,
      targetRect,
      middleNodeRects,
      sameLevelNodes,
      percent,
    }
  })

  const directEdges = candidates.filter((item): item is DirectRoutePath => item?.direct === true)
  const fixedPoints = directEdges.map(e => ({ x: e.startX, y: e.startY }))
  const nonDirects = candidates.filter((item): item is IndirectRoutePath => item?.direct === false)
  const points = selectPointsOnRectEdge(nodeRects[nodeId], fixedPoints, nonDirects.length)

  const nonDirectEdges = nonDirects.map((item, index): RoutePath => {
    // Dense graphs still need an endpoint for every edge when spaced perimeter points run out.
    const point = points[index] ?? {
      x: item.sourceRect.x + item.sourceRect.width,
      y: item.sourceRect.y + (item.sourceRect.height * (index + 1)) / (nonDirects.length + 1),
    }
    const startX = point.x
    const startY = point.y

    const isOnBottomRect = point.y === item.sourceRect.y + item.sourceRect.height
    const isOnTopRect = point.y === item.sourceRect.y
    const lowestY = Math.min(
      item.targetRect.y,
      ...[...item.middleNodeRects, ...item.sameLevelNodes].map(node => node.y),
    )
    const highestY = Math.max(
      item.targetRect.y + item.targetRect.height,
      ...[...item.middleNodeRects, ...item.sameLevelNodes].map(node => node.y + node.height),
    )

    if (lowestY > (isOnBottomRect ? point.y + 36 : point.y)) {
      const targetX = item.targetRect.x + item.targetRect.width / 2
      const targetY = item.targetRect.y

      if (isOnBottomRect) {
        return {
          startX,
          startY,
          percent: item.percent,
          id: item.id,
          path: `M ${startX} ${startY} L ${startX} ${startY + 36} L ${targetX} ${startY + 36} L ${targetX} ${targetY}`,
        }
      }

      if (isOnTopRect) {
        return {
          startX,
          startY,
          percent: item.percent,
          id: item.id,
          path: `M ${startX} ${startY} L ${startX} ${startY - 36} L ${targetX} ${startY - 36} L ${targetX} ${targetY}`,
        }
      }

      return {
        startX,
        startY,
        percent: item.percent,
        id: item.id,
        path: `M ${startX} ${startY} L ${targetX} ${startY} L ${targetX} ${targetY}`,
      }
    }

    if (highestY < (isOnTopRect ? point.y - 36 : point.y)) {
      const targetX = item.targetRect.x + item.targetRect.width / 2
      const targetY = item.targetRect.y + item.targetRect.height

      if (isOnBottomRect) {
        return {
          startX,
          startY,
          percent: item.percent,
          id: item.id,
          path: `M ${startX} ${startY} L ${startX} ${startY + 36} L ${targetX} ${startY + 36} L ${targetX} ${targetY}`,
        }
      }

      if (isOnTopRect) {
        return {
          startX,
          startY,
          percent: item.percent,
          id: item.id,
          path: `M ${startX} ${startY} L ${startX} ${startY - 36} L ${targetX} ${startY - 36} L ${targetX} ${targetY}`,
        }
      }

      return {
        startX,
        startY,
        percent: item.percent,
        id: item.id,
        path: `M ${startX} ${startY} L ${targetX} ${startY} L ${targetX} ${targetY}`,
      }
    }

    const availableRanges = findNonOverlapRanges(
      [item.targetRect.y, item.targetRect.y + item.targetRect.height],
      item.middleNodeRects.map(node => [node.y, node.y + node.height]),
    )
    let maxWidthOverlap: [number, number] | null = null
    let maxWidth = 0
    const [start, end] = [item.targetRect.y, item.targetRect.y + item.targetRect.height]

    for (const [rangeStart, rangeEnd] of availableRanges) {
      if (end >= rangeStart && start <= rangeEnd) {
        const overlapStart = Math.max(start, rangeStart)
        const overlapEnd = Math.min(end, rangeEnd)
        const width = overlapEnd - overlapStart
        if (width > maxWidth) {
          maxWidth = width
          maxWidthOverlap = [overlapStart, overlapEnd]
        }
      }
    }

    const targetX = maxWidthOverlap ? item.targetRect.x : item.targetRect.x + item.targetRect.width / 2
    let targetY = maxWidthOverlap
      ? (maxWidthOverlap[0] + maxWidthOverlap[1]) / 2
      : item.targetRect.y + item.targetRect.height

    const middleMin = Math.min(...item.middleNodeRects.map(node => node.y))
    const middleMax = Math.max(...item.middleNodeRects.map(node => node.y + node.height))

    const translateY = targetY < middleMax ? middleMax + 30 : targetY > middleMin ? middleMin - 30 : 0
    const translate = translateY ? `L ${targetX} ${translateY}` : ''

    if (translateY && targetX === item.targetRect.x) {
      targetY = translateY
    }

    return {
      startX,
      startY,
      percent: item.percent,
      id: item.id,
      path: isOnTopRect
        ? `M ${startX} ${startY} L ${startX} ${startY - 36} L ${item.sourceRect.x + item.sourceRect.width + 36} ${
            startY - 36
          } L ${item.sourceRect.x + item.sourceRect.width + 36} ${
            translateY || targetY
          } ${translate} L ${targetX} ${targetY}`
        : isOnBottomRect
        ? `M ${startX} ${startY} L ${startX} ${startY + 36} L ${item.sourceRect.x + item.sourceRect.width + 36} ${
            startY + 36
          } L ${item.sourceRect.x + item.sourceRect.width + 36} ${
            translateY || targetY
          } ${translate} L ${targetX} ${targetY}`
        : `M ${startX} ${startY} L ${startX + 36} ${startY} L ${startX + 36} ${
            translateY || targetY
          } ${translate} L ${targetX} ${targetY}`,
    }
  })
  return [...directEdges, ...nonDirectEdges]
}

export const buildRoutePaths = (
  graph: RouteGraph,
  measuredRects: Record<string, RouteRect>,
  svgRect: RouteRect,
): RoutePathLayout[] => {
  // All routing math uses SVG-local coordinates, independent of page position or scrolling.
  const nodeRects = Object.fromEntries(
    Object.entries(measuredRects).map(([id, rect]) => [id, { ...rect, x: rect.x - svgRect.x, y: rect.y - svgRect.y }]),
  )

  return graph.nodes.flatMap(node => {
    const nodeRect = nodeRects[node.id]
    if (!nodeRect) return []

    const paths = buildNodePaths(graph, node.id, nodeRects)
    const isStartNode = node.id === graph.inputId
    const lowestY = isStartNode ? Math.max(...paths.map(path => path.startY).filter(Boolean)) : null
    const x = nodeRect.x + nodeRect.width
    const y = nodeRect.y + nodeRect.height / 2

    return [
      {
        id: node.id,
        paths: paths.map(path => {
          const labelPoint = isStartNode ? getPointOnPathAtRatio(path.path, 0.3) : null
          return { ...path, label: { x: (labelPoint?.x ?? path.startX) + 4, y: (labelPoint?.y ?? path.startY) + 3 } }
        }),
        terminal:
          paths.length === 0
            ? {
                label: { x: x + 4, y: y + 3 },
                percent: node.outputPercent,
                path: `M ${x} ${y} L ${svgRect.width - 10} ${y}`,
                connector: `M ${svgRect.width - 10} ${y} L ${svgRect.width - 10} 10`,
              }
            : null,
        inputConnector: lowestY && Number.isFinite(lowestY) ? `M 10 ${lowestY} L 10 10` : null,
      },
    ]
  })
}
