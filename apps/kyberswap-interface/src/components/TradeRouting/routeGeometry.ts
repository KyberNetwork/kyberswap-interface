export interface RouteRect {
  x: number
  y: number
  width: number
  height: number
}

export interface PathPoint {
  x: number
  y: number
}

interface Range {
  start: number
  end: number
}

interface EdgeRange {
  edge: string
  range: Range
}

export const selectPointsOnRectEdge = (
  rect: RouteRect,
  fixedPoints: PathPoint[],
  n: number,
  minDistance = 30,
): PathPoint[] => {
  const { x, y, width, height } = rect

  const edges = [
    { start: { x: x + width, y }, end: { x: x + width, y: y + height }, name: 'right' }, // Right edge
    { start: { x, y }, end: { x: x + width, y }, name: 'top' }, // Top edge
    { start: { x, y: y + height }, end: { x: x + width, y: y + height }, name: 'bottom' }, // Bottom edge
  ]

  const edgeLengths: Record<string, number> = {
    right: height,
    top: width,
    bottom: width,
  }

  const unavailableRangesByEdge: Record<string, Range[]> = {
    right: [],
    top: [],
    bottom: [],
  }

  for (const point of fixedPoints) {
    for (const edge of edges) {
      const isOnEdge =
        point.x >= edge.start.x - 0.1 &&
        point.x <= edge.end.x + 0.1 &&
        point.y >= edge.start.y - 0.1 &&
        point.y <= edge.end.y + 0.1

      if (isOnEdge) {
        let position: number

        if (edge.name === 'top') {
          position = point.x - x
        } else if (edge.name === 'right') {
          position = point.y - y
        } else if (edge.name === 'bottom') {
          position = point.x - x
        } else {
          continue // Skip if edge is not recognized
        }

        unavailableRangesByEdge[edge.name].push({
          start: Math.max(0, position - minDistance),
          end: Math.min(edgeLengths[edge.name], position + minDistance),
        })
      }
    }
  }

  for (const edge in unavailableRangesByEdge) {
    unavailableRangesByEdge[edge] = mergeRanges(unavailableRangesByEdge[edge])
  }

  const availableRangesByEdge: Record<string, Range[]> = {}

  for (const edge in unavailableRangesByEdge) {
    availableRangesByEdge[edge] = []
    let lastEnd = 0

    for (const range of unavailableRangesByEdge[edge]) {
      if (range.start > lastEnd) {
        availableRangesByEdge[edge].push({ start: lastEnd, end: range.start })
      }
      lastEnd = range.end
    }

    if (lastEnd < edgeLengths[edge]) {
      availableRangesByEdge[edge].push({ start: lastEnd, end: edgeLengths[edge] })
    }
  }

  const selectedPoints: PathPoint[] = []
  let pointsRemaining = n

  for (const edge of edges) {
    if (pointsRemaining <= 0) break

    const availableRanges = availableRangesByEdge[edge.name]

    const sortedRanges = [...availableRanges].sort((a, b) => b.end - b.start - (a.end - a.start))

    const spaceAvailable = sortedRanges.reduce((sum, range) => sum + (range.end - range.start), 0)
    const maxPossiblePoints = Math.floor(spaceAvailable / minDistance)
    const pointsForThisEdge = Math.min(pointsRemaining, maxPossiblePoints)

    if (pointsForThisEdge === 0) continue

    const midpoints = sortedRanges
      .map(range => ({
        position: (range.start + range.end) / 2,
        rangeSize: range.end - range.start,
      }))
      .sort((a, b) => b.rangeSize - a.rangeSize)

    for (let i = 0; i < pointsForThisEdge && i < midpoints.length; i++) {
      const position = midpoints[i].position

      let point: PathPoint
      if (edge.name === 'top') {
        point = { x: x + position, y }
      } else if (edge.name === 'right') {
        point = { x: x + width, y: y + position }
      } else if (edge.name === 'bottom') {
        point = { x: x + position, y: y + height }
      } else {
        continue // Skip if edge is not recognized
      }

      selectedPoints.push(point)

      updateAvailableRangesForEdge(availableRangesByEdge[edge.name], position, minDistance)

      if (i < pointsForThisEdge - 1) {
        const updatedMidpoints = availableRangesByEdge[edge.name]
          .map(range => ({
            position: (range.start + range.end) / 2,
            rangeSize: range.end - range.start,
          }))
          .sort((a, b) => b.rangeSize - a.rangeSize)

        midpoints.splice(0) // Clear the array
        midpoints.push(...updatedMidpoints)
      }
    }

    pointsRemaining -= pointsForThisEdge
  }

  if (pointsRemaining > 0) {
    const allRemainingRanges: EdgeRange[] = []

    for (const edge of edges) {
      for (const range of availableRangesByEdge[edge.name]) {
        if (range.end - range.start >= minDistance) {
          allRemainingRanges.push({
            edge: edge.name,
            range: range,
          })
        }
      }
    }

    allRemainingRanges.sort((a, b) => b.range.end - b.range.start - (a.range.end - a.range.start))

    for (let i = 0; i < pointsRemaining && i < allRemainingRanges.length; i++) {
      const edgeName = allRemainingRanges[i].edge
      const range = allRemainingRanges[i].range
      const position = (range.start + range.end) / 2 // Middle of range

      let point: PathPoint
      if (edgeName === 'top') {
        point = { x: x + position, y }
      } else if (edgeName === 'right') {
        point = { x: x + width, y: y + position }
      } else if (edgeName === 'bottom') {
        point = { x: x + position, y: y + height }
      } else {
        continue // Skip if edge is not recognized
      }

      selectedPoints.push(point)
      updateAvailableRangesForEdge(availableRangesByEdge[edgeName], position, minDistance)
    }
  }

  return selectedPoints
}

const mergeRanges = (ranges: Range[]): Range[] => {
  if (ranges.length === 0) return []

  const sortedRanges = [...ranges].sort((a, b) => a.start - b.start)

  const mergedRanges: Range[] = [sortedRanges[0]]

  for (let i = 1; i < sortedRanges.length; i++) {
    const currentRange = sortedRanges[i]
    const lastMergedRange = mergedRanges[mergedRanges.length - 1]

    if (currentRange.start <= lastMergedRange.end) {
      lastMergedRange.end = Math.max(lastMergedRange.end, currentRange.end)
    } else {
      mergedRanges.push(currentRange)
    }
  }

  return mergedRanges
}

const updateAvailableRangesForEdge = (ranges: Range[], position: number, minDistance: number): void => {
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i]

    if (position >= range.start && position <= range.end) {
      const leftRange: Range = {
        start: range.start,
        end: Math.max(range.start, position - minDistance),
      }

      const rightRange: Range = {
        start: Math.min(range.end, position + minDistance),
        end: range.end,
      }

      ranges.splice(i, 1)

      if (leftRange.end > leftRange.start) {
        ranges.splice(i, 0, leftRange)
        i++
      }

      if (rightRange.end > rightRange.start) {
        ranges.splice(i, 0, rightRange)
      }

      break
    }
  }
}

export const findNonOverlapRanges = (
  mainLine: [number, number],
  overlappingLines: [number, number][],
): [number, number][] => {
  const [x1, x2] = mainLine

  type Event = [number, number] // [position, eventType]
  const events: Event[] = []

  for (const [start, end] of overlappingLines) {
    if (end >= x1 && start <= x2) {
      events.push([Math.max(start, x1), 1]) // 1 for start event
      events.push([Math.min(end, x2), -1]) // -1 for end event
    }
  }

  events.sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : -a[1] - -b[1]))

  const availableRanges: [number, number][] = []
  let currentPos = x1
  let overlapCount = 0

  for (const [pos, eventType] of events) {
    if (overlapCount === 0 && pos > currentPos) {
      availableRanges.push([currentPos, pos])
    }

    overlapCount += eventType
    currentPos = pos
  }

  if (currentPos < x2) {
    availableRanges.push([currentPos, x2])
  }

  return availableRanges
}

const getPathPoints = (path: string): PathPoint[] => {
  const matches = [...path.matchAll(/[ML]\s*([-\d.]+)\s+([-\d.]+)/g)]
  return matches.map(([, x, y]) => ({ x: Number(x), y: Number(y) }))
}

const getDistanceBetweenPoints = (start: PathPoint, end: PathPoint) => Math.hypot(end.x - start.x, end.y - start.y)

export const getPointOnPathAtRatio = (path: string, ratio: number): PathPoint | null => {
  const points = getPathPoints(path)
  if (points.length < 2) return null

  const segmentLengths = points.slice(1).map((point, index) => getDistanceBetweenPoints(points[index], point))
  const totalLength = segmentLengths.reduce((sum, segmentLength) => sum + segmentLength, 0)
  if (!totalLength) return null

  const targetLength = totalLength * ratio
  let traversedLength = 0

  for (let index = 0; index < segmentLengths.length; index++) {
    const segmentLength = segmentLengths[index]
    const segmentStart = points[index]
    const segmentEnd = points[index + 1]

    if (traversedLength + segmentLength >= targetLength) {
      const segmentRatio = (targetLength - traversedLength) / segmentLength
      return {
        x: segmentStart.x + (segmentEnd.x - segmentStart.x) * segmentRatio,
        y: segmentStart.y + (segmentEnd.y - segmentStart.y) * segmentRatio,
      }
    }

    traversedLength += segmentLength
  }

  return points[points.length - 1] ?? null
}
