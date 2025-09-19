import useThrottle from 'hooks/useThrottle'
import { Dex } from 'state/customizeDexes'

export const getDexInfoByPool = (exchange: string, allDexes?: Dex[]) => {
  if (exchange === '1inch') {
    return { name: '1inch', logoURL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8104.png' }
  }

  if (exchange === 'paraswap') {
    return { name: 'Paraswap', logoURL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/14534.png' }
  }

  if (exchange === '0x') {
    return { name: '0x', logoURL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1896.png' }
  }

  return allDexes?.find(
    dex =>
      dex.id === exchange ||
      ((exchange === 'kyberswap' || exchange === 'kyberswap-static') && dex.id === 'kyberswapv1'), // Mapping for kyberswap classic dex
  )
}

export const getSwapPercent = (percent?: number, routeNumber = 0): string | null => {
  if (routeNumber === 1) {
    return '100%'
  }
  if (!percent && percent !== 0) {
    return null
  }
  const val = routeNumber > 1 ? Math.min(99.99, Math.max(0.01, percent)) : percent
  return `${val.toFixed(0)}%`
}

export const onScroll = (element: HTMLDivElement | null) => {
  if ((element?.scrollTop ?? 0) > 0) {
    element?.classList.add('top')
  } else {
    element?.classList.remove('top')
  }
  if ((element?.scrollHeight ?? 0) - (element?.scrollTop ?? 0) > (element?.clientHeight ?? 0)) {
    element?.classList.add('bottom')
  } else {
    element?.classList.remove('bottom')
  }
}

export const useShadow = (
  scrollRef: React.RefObject<HTMLDivElement>,
  shadowRef: React.RefObject<HTMLDivElement>,
  contentRef: React.RefObject<HTMLDivElement>,
) => {
  const handleShadow = useThrottle(() => {
    const element: any = scrollRef.current
    if (element?.scrollLeft > 0) {
      shadowRef.current?.classList.add('left-visible')
    } else {
      shadowRef.current?.classList.remove('left-visible')
    }

    if (Math.floor((contentRef.current?.scrollWidth || 0) - element?.scrollLeft) > Math.floor(element?.clientWidth)) {
      shadowRef.current?.classList.add('right-visible')
    } else {
      shadowRef.current?.classList.remove('right-visible')
    }
  }, 300)
  return handleShadow
}

interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

interface Point {
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

// Selects n points on the edges of a rectangle, avoiding fixed points
export function selectPointsOnRectEdge(rect: Rectangle, fixedPoints: Point[], n: number, minDistance = 30): Point[] {
  const { x, y, width, height } = rect

  // Define the edges in priority order (right edge first)
  const edges = [
    { start: { x: x + width, y }, end: { x: x + width, y: y + height }, name: 'right' }, // Right edge
    { start: { x, y }, end: { x: x + width, y }, name: 'top' }, // Top edge
    { start: { x, y: y + height }, end: { x: x + width, y: y + height }, name: 'bottom' }, // Bottom edge
  ]

  // Calculate edge lengths
  const edgeLengths: Record<string, number> = {
    right: height,
    top: width,
    bottom: width,
  }

  // Find unavailable segments on each edge due to fixed points
  const unavailableRangesByEdge: Record<string, Range[]> = {
    right: [],
    top: [],
    bottom: [],
  }

  // Check each fixed point to see which edge it's on and mark the surrounding area as unavailable
  for (const point of fixedPoints) {
    for (const edge of edges) {
      // Check if point is on this edge
      const isOnEdge =
        point.x >= edge.start.x - 0.1 &&
        point.x <= edge.end.x + 0.1 &&
        point.y >= edge.start.y - 0.1 &&
        point.y <= edge.end.y + 0.1

      if (isOnEdge) {
        let position: number

        // Calculate position along the edge
        if (edge.name === 'top') {
          position = point.x - x
        } else if (edge.name === 'right') {
          position = point.y - y
        } else if (edge.name === 'bottom') {
          position = point.x - x
        } else {
          continue // Skip if edge is not recognized
        }

        // Add the unavailable range
        unavailableRangesByEdge[edge.name].push({
          start: Math.max(0, position - minDistance),
          end: Math.min(edgeLengths[edge.name], position + minDistance),
        })
      }
    }
  }

  // Merge overlapping ranges for each edge
  for (const edge in unavailableRangesByEdge) {
    unavailableRangesByEdge[edge] = mergeRanges(unavailableRangesByEdge[edge])
  }

  // Calculate available ranges for each edge
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

  // Prioritize middle points in each available range
  const selectedPoints: Point[] = []
  let pointsRemaining = n

  // Process edges in order of priority
  for (const edge of edges) {
    if (pointsRemaining <= 0) break

    const availableRanges = availableRangesByEdge[edge.name]

    // Sort ranges by size (largest first) to prioritize larger spaces
    const sortedRanges = [...availableRanges].sort((a, b) => b.end - b.start - (a.end - a.start))

    // Calculate how many points to assign to this edge
    const spaceAvailable = sortedRanges.reduce((sum, range) => sum + (range.end - range.start), 0)
    const maxPossiblePoints = Math.floor(spaceAvailable / minDistance)
    const pointsForThisEdge = Math.min(pointsRemaining, maxPossiblePoints)

    if (pointsForThisEdge === 0) continue

    // Create a list of midpoints for all ranges, sorted by range size
    const midpoints = sortedRanges
      .map(range => ({
        position: (range.start + range.end) / 2,
        rangeSize: range.end - range.start,
      }))
      .sort((a, b) => b.rangeSize - a.rangeSize)

    // Select points starting from the largest ranges
    for (let i = 0; i < pointsForThisEdge && i < midpoints.length; i++) {
      const position = midpoints[i].position

      // Convert position to coordinates
      let point: Point
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

      // Update available ranges to prevent placing points too close together
      updateAvailableRangesForEdge(availableRangesByEdge[edge.name], position, minDistance)

      // Recalculate midpoints if there are more points to place
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

  // If we still need more points, use any remaining spaces
  if (pointsRemaining > 0) {
    // Combine all remaining spaces across all edges
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

    // Sort by size (largest first)
    allRemainingRanges.sort((a, b) => b.range.end - b.range.start - (a.range.end - a.range.start))

    // Place remaining points
    for (let i = 0; i < pointsRemaining && i < allRemainingRanges.length; i++) {
      const edgeName = allRemainingRanges[i].edge
      const range = allRemainingRanges[i].range
      const position = (range.start + range.end) / 2 // Middle of range

      // Convert position to coordinates
      let point: Point
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

// Helper function to merge overlapping ranges
function mergeRanges(ranges: Range[]): Range[] {
  if (ranges.length === 0) return []

  // Sort ranges by start position
  const sortedRanges = [...ranges].sort((a, b) => a.start - b.start)

  const mergedRanges: Range[] = [sortedRanges[0]]

  for (let i = 1; i < sortedRanges.length; i++) {
    const currentRange = sortedRanges[i]
    const lastMergedRange = mergedRanges[mergedRanges.length - 1]

    if (currentRange.start <= lastMergedRange.end) {
      // Ranges overlap, merge them
      lastMergedRange.end = Math.max(lastMergedRange.end, currentRange.end)
    } else {
      // No overlap, add as new range
      mergedRanges.push(currentRange)
    }
  }

  return mergedRanges
}

// Helper function to update available ranges after selecting a point
function updateAvailableRangesForEdge(ranges: Range[], position: number, minDistance: number): void {
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i]

    // If position is in this range
    if (position >= range.start && position <= range.end) {
      // Create two new ranges (if they have enough space)
      const leftRange: Range = {
        start: range.start,
        end: Math.max(range.start, position - minDistance),
      }

      const rightRange: Range = {
        start: Math.min(range.end, position + minDistance),
        end: range.end,
      }

      // Remove the original range
      ranges.splice(i, 1)

      // Add new ranges if they have positive length
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

// Example usage
// const rect: Rectangle = { x: 50, y: 50, width: 300, height: 200 };
// const fixedPoints: Point[] = [
//   { x: 50, y: 100 },   // Left edge
//   { x: 200, y: 50 },   // Top edge
//   { x: 350, y: 150 }   // Right edge
// ];
// const newPoints = selectPointsOnRectEdge(rect, fixedPoints, 5);
// console.log(newPoints);
