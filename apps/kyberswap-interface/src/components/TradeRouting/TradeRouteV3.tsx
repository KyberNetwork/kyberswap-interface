import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Token } from '@kyberswap/ks-sdk-core'
import { SwapRouteV3 } from 'utils/aggregationRouting'
import { StyledDot } from './styled'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'
import { rgba } from 'polished'
import CurrencyLogo from 'components/CurrencyLogo'
import useTheme from 'hooks/useTheme'
import { useAllDexes } from 'state/customizeDexes/hooks'
import { useWeb3React } from 'hooks'
import { getDexInfoByPool, selectPointsOnRectEdge } from './helpers'
import { getEtherscanLink, isAddress } from 'utils'
import ScrollContainer from 'react-indiana-drag-scroll'

interface SwapRouteV3Props {
  tradeComposition: SwapRouteV3[]
  tokenIn: Token
}

const NodeWrapper = styled.div`
  border: 1px solid ${rgba('#fff', 0.06)};
  border-radius: 12px;
  padding: 12px;
  width: 168px;
  position: relative;
`

const ListPool = styled.div`
  margin-top: 12px;
  border-radius: 12px;
  padding: 12px 8px;
  background: ${rgba('#fff', 0.06)};
  display: flex;
  flex-direction: column;
  gap: 8px;
`

type Edge = { source: Token; target: Token; swaps: SwapRouteV3[] }

// find the non overlap between the source rect and middle rects
function findNonOverlapRanges(mainLine: [number, number], overlappingLines: [number, number][]): [number, number][] {
  const [x1, x2] = mainLine

  // Create events for start and end points
  type Event = [number, number] // [position, eventType]
  const events: Event[] = []

  for (const [start, end] of overlappingLines) {
    // Only consider overlaps within the main line
    if (end >= x1 && start <= x2) {
      events.push([Math.max(start, x1), 1]) // 1 for start event
      events.push([Math.min(end, x2), -1]) // -1 for end event
    }
  }

  // Sort events by position, then by event type (end before start)
  events.sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : -a[1] - -b[1]))

  const availableRanges: [number, number][] = []
  let currentPos = x1
  let overlapCount = 0

  for (const [pos, eventType] of events) {
    // If we're entering a non-overlapping region
    if (overlapCount === 0 && pos > currentPos) {
      availableRanges.push([currentPos, pos])
    }

    overlapCount += eventType
    currentPos = pos
  }

  // Check if there's a final available range
  if (currentPos < x2) {
    availableRanges.push([currentPos, x2])
  }

  return availableRanges
}

const TradeRouteV3: React.FC<SwapRouteV3Props> = ({ tradeComposition, tokenIn }) => {
  const tokenMap: { [key: string]: Token } = {}
  tradeComposition.forEach(swap => {
    tokenMap[swap.tokenIn.address] = swap.tokenIn
    tokenMap[swap.tokenOut.address] = swap.tokenOut
  })
  const nodes: Token[] = Object.values(tokenMap)
  const edges: Edge[] = []

  const [nodeRects, setNodeRects] = useState<{ [key: string]: DOMRect }>({})

  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes.length; j++) {
      const swaps = tradeComposition.filter(
        trade =>
          trade.tokenIn.address.toLowerCase() === nodes[i].address.toLowerCase() &&
          trade.tokenOut.address.toLowerCase() === nodes[j].address.toLowerCase(),
      )
      if (swaps.length) {
        edges.push({
          source: nodes[i],
          target: nodes[j],
          swaps,
        })
      }
    }
  }

  const maximumPathLengths: { [key: string]: number } = {}
  maximumPathLengths[tokenIn.address] = 0
  const queue = [tokenIn.address]
  while (queue.length) {
    const currentNode = queue.shift() as string // Use shift() for BFS
    const currentLength = maximumPathLengths[currentNode] || 0
    const neighbors = edges.filter(edge => edge.source.address === currentNode)

    for (const neighbor of neighbors) {
      const targetAddress = neighbor.target.address
      const newLength = currentLength + 1

      // If we found a longer path to this node
      if (maximumPathLengths[targetAddress] === undefined || newLength > maximumPathLengths[targetAddress]) {
        maximumPathLengths[targetAddress] = newLength
        queue.push(targetAddress) // Add back to the queue to find potentially longer paths from it
      }
    }
  }

  const levels = [...new Set(Object.values(maximumPathLengths))].filter(Boolean).sort()
  const maxLevel = Math.max(...levels)
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  nodes.sort((a, b) => (maximumPathLengths[a.address] || 0) - (maximumPathLengths[b.address] || 0))

  const theme = useTheme()
  const svgRef = useRef<SVGSVGElement>(null)

  const [force, updateState] = useState(1)
  const forceUpdate = useCallback(() => updateState(prev => prev + 1), [])

  useEffect(() => {
    const update = () => {
      if (!svgRef.current) return
      const svgRect = svgRef.current.getBoundingClientRect()
      const tokenInRect = {
        ...svgRect,
        width: 1,
        height: svgRect.height,
        x: svgRect.x + 10,
        y: svgRect.y,
      }
      setNodeRects(prev => ({ ...prev, [tokenIn.address]: tokenInRect }))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [tokenIn.address, tradeComposition, force])

  return (
    <ScrollContainer
      innerRef={scrollRef}
      vertical={false}
      onScroll={() => {
        forceUpdate()
      }}
    >
      <StyledDot />
      <StyledDot out />

      <svg
        ref={svgRef}
        style={{
          zIndex: 10,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="4" refY="2" orient="auto">
            <polygon points="0 0, 4 2, 0 4" fill={theme.primary} />
          </marker>
        </defs>

        {nodes.map(node => {
          const svgRect = svgRef.current?.getBoundingClientRect()
          const nodeRect = nodeRects[node.address]
          if (!svgRect || !nodeRect) return null

          const edgesOut = edges.filter(edge => edge.source.address === node.address)
          const totalSwapAmount = edgesOut.reduce((acc, cur) => {
            return cur.swaps.reduce((acc, cur) => BigInt(cur.swapAmount) + acc, 0n) + acc
          }, 0n)

          const temp = edgesOut.map(edge => {
            const swapAmount = edge.swaps.reduce((acc, cur) => BigInt(cur.swapAmount) + acc, 0n)
            const percent = (Number(((swapAmount * 100000n) / totalSwapAmount).toString()) / 1000).toFixed(0)

            const sourceLevel = maximumPathLengths[edge.source.address]
            const targetLevel = maximumPathLengths[edge.target.address]
            const middleNodeRects = nodes
              .filter(
                node =>
                  maximumPathLengths[node.address] > sourceLevel && maximumPathLengths[node.address] < targetLevel,
              )
              .map(node => nodeRects[node.address])
              .filter(Boolean) as DOMRect[]
            const sameLevelNodes = nodes
              .filter(node => maximumPathLengths[node.address] === targetLevel)
              .map(node => nodeRects[node.address])
              .filter(Boolean) as DOMRect[]

            const sourceRect = nodeRects[edge.source.address]
            const targetRect = nodeRects[edge.target.address]
            if (!sourceRect || !targetRect) return null

            // source: y, y + height
            //  middlenodes -> obstacle
            //  return all the available ranges [y1, y2] that we can draw a line from source to target
            const availableRanges = findNonOverlapRanges(
              [sourceRect.y, sourceRect.y + sourceRect.height],
              middleNodeRects.map(node => [node.y, node.y + node.height]),
            )

            let maxWidthOverlap: [number, number] | null = null
            let maxWidth = 0
            const [start, end] = [targetRect.y, targetRect.y + targetRect.height]

            for (const [rangeStart, rangeEnd] of availableRanges) {
              // Check if there's an overlap
              if (end >= rangeStart && start <= rangeEnd) {
                // Calculate the overlap range
                const overlapStart = Math.max(start, rangeStart)
                const overlapEnd = Math.min(end, rangeEnd)
                const width = overlapEnd - overlapStart
                // Update if this overlap has a greater width
                if (width > maxWidth) {
                  maxWidth = width
                  maxWidthOverlap = [overlapStart, overlapEnd]
                }
              }
            }
            if (maxWidthOverlap) {
              const startX = sourceRect.x + sourceRect.width - svgRect.x
              const startY = (maxWidthOverlap[0] + maxWidthOverlap[1]) / 2 - svgRect.y
              return {
                direct: true,
                startX,
                startY,
                endX: targetRect.x - svgRect.x,
                endY: startY,
                percent,
                path: `M ${startX} ${startY} L ${targetRect.x - svgRect.x} ${startY}`,
              }
            }
            return {
              direct: false,
              sourceRect,
              targetRect,
              middleNodeRects,
              sameLevelNodes,
              percent,
            }
          })

          const directEdges = temp.filter(item => item && item.direct)
          const fixedPoints = directEdges.map((e: any) => ({ x: e.startX + svgRect.x, y: e.startY + svgRect.y }))
          const nonDirects = temp.filter(item => item && !item.direct)
          const points = selectPointsOnRectEdge(nodeRects[node.address], fixedPoints, nonDirects.length)

          const nonDirectEdges = nonDirects
            .map((item: any, index) => {
              const point = points[index]
              if (!point) return null
              const startX = point.x - svgRect.x
              const startY = point.y - svgRect.y

              const isOnBottomRect = point.y + svgRect.y === item.targetRect.y + item.targetRect.height
              const isOnTopRect = point.y + svgRect.y === item.targetRect.y
              const lowestY = Math.min(
                item.targetRect.y,
                ...[...item.middleNodeRects, ...item.sameLevelNodes].map((node: any) => node.y),
              )
              const highestY = Math.max(
                item.targetRect.y + item.targetRect.height,
                ...[...item.middleNodeRects, ...item.sameLevelNodes].map((node: any) => node.y + node.height),
              )

              // target below source and no middle nodes
              if (lowestY > (isOnBottomRect ? point.y + 36 : point.y)) {
                const targetX = item.targetRect.x + item.targetRect.width / 2 - svgRect.x
                const targetY = item.targetRect.y - svgRect.y

                if (isOnBottomRect) {
                  return {
                    startX,
                    startY,
                    percent: item.percent,
                    path: `M ${startX} ${startY} L ${startX} ${startY + 36} L ${targetX} ${
                      startY + 36
                    } L ${targetX} ${targetY}`,
                  }
                }

                if (isOnTopRect) {
                  return {
                    startX,
                    startY,
                    percent: item.percent,
                    path: `M ${startX} ${startY} L ${startX} ${startY - 36} L ${targetX} ${
                      startY - 36
                    } L ${targetX} ${targetY}`,
                  }
                }

                return {
                  startX,
                  startY,
                  percent: item.percent,
                  path: `M ${startX} ${startY} L ${targetX} ${startY} L ${targetX} ${targetY}`,
                }
              }

              // target above source and no middle nodes
              if (highestY < (isOnTopRect ? point.y - 36 : point.y)) {
                const targetX = item.targetRect.x + item.targetRect.width / 2 - svgRect.x
                const targetY = item.targetRect.y + item.targetRect.height - svgRect.y

                if (isOnBottomRect) {
                  return {
                    startX,
                    startY,
                    percent: item.percent,
                    path: `M ${startX} ${startY} L ${startX} ${startY + 36} L ${targetX} ${
                      startY + 36
                    } L ${targetX} ${targetY}`,
                  }
                }

                if (isOnTopRect) {
                  return {
                    startX,
                    startY,
                    percent: item.percent,
                    path: `M ${startX} ${startY} L ${startX} ${startY - 36} L ${targetX} ${
                      startY - 36
                    } L ${targetX} ${targetY}`,
                  }
                }

                return {
                  startX,
                  startY,
                  percent: item.percent,
                  path: `M ${startX} ${startY} L ${targetX} ${startY} L ${targetX} ${targetY}`,
                }
              }

              const availableRanges = findNonOverlapRanges(
                [item.targetRect.y, item.targetRect.y + item.targetRect.height],
                item.middleNodeRects.map((node: any) => [node.y, node.y + node.height]),
              )
              let maxWidthOverlap: [number, number] | null = null
              let maxWidth = 0
              const [start, end] = [item.targetRect.y, item.targetRect.y + item.targetRect.height]

              for (const [rangeStart, rangeEnd] of availableRanges) {
                // Check if there's an overlap
                if (end >= rangeStart && start <= rangeEnd) {
                  // Calculate the overlap range
                  const overlapStart = Math.max(start, rangeStart)
                  const overlapEnd = Math.min(end, rangeEnd)
                  const width = overlapEnd - overlapStart
                  // Update if this overlap has a greater width
                  if (width > maxWidth) {
                    maxWidth = width
                    maxWidthOverlap = [overlapStart, overlapEnd]
                  }
                }
              }

              const targetX = maxWidthOverlap
                ? item.targetRect.x - svgRect.x
                : item.targetRect.x + item.targetRect.width / 2 - svgRect.x
              let targetY = maxWidthOverlap
                ? (maxWidthOverlap[0] + maxWidthOverlap[1]) / 2 - svgRect.y
                : item.targetRect.y + item.targetRect.height - svgRect.y

              const middleMin = Math.min(...item.middleNodeRects.map((node: any) => node.y))
              const middleMax = Math.max(...item.middleNodeRects.map((node: any) => node.y + node.height))

              const translateY =
                targetY + svgRect.y < middleMax
                  ? middleMax + 30 - svgRect.y
                  : targetY + svgRect.y > middleMin
                  ? middleMin - 30 - svgRect.y
                  : 0
              const translate = translateY ? `L ${targetX} ${translateY}` : ''

              if (translateY && targetX + svgRect.x === item.targetRect.x) {
                targetY = translateY
              }

              return {
                startX,
                startY,
                endX: item.targetRect.x - svgRect.x,
                endY: item.targetRect.y - svgRect.y,
                percent: item.percent,
                path: isOnTopRect
                  ? `M ${startX} ${startY} L ${startX} ${startY - 36} L ${
                      item.sourceRect.x + item.sourceRect.width + 36
                    } ${startY - 36} L ${item.sourceRect.x + item.sourceRect.width + 36} ${
                      translateY || targetY
                    } ${translate} L ${targetX} ${targetY}`
                  : isOnBottomRect
                  ? `M ${startX} ${startY} L ${startX} ${startY + 36} L ${
                      item.sourceRect.x + item.sourceRect.width + 36
                    } ${startY + 36} L ${item.sourceRect.x + item.sourceRect.width + 36} ${
                      translateY || targetY
                    } ${translate} L ${targetX} ${targetY}`
                  : `M ${startX} ${startY} L ${startX + 36} ${startY} L ${startX + 36} ${
                      translateY || targetY
                    } ${translate} L ${targetX} ${targetY}`,
              }
            })
            .filter(Boolean)
          const finalEdges = [...directEdges, ...nonDirectEdges]

          const isStartNode = node.address === tokenIn.address
          const lowestYForStartNode = isStartNode
            ? Math.max(...(finalEdges.map(item => item?.startY).filter(Boolean) as number[]))
            : null

          const x = nodeRect.x + nodeRect.width - svgRect.x
          const y = nodeRect.y + nodeRect.height / 2 - svgRect.y

          return (
            <React.Fragment key={node.address}>
              {finalEdges.length === 0 && (
                <>
                  <text x={x + 4} y={y + 3} fontSize="10" fontWeight="500" fill={theme.primary}>
                    100%
                  </text>
                  <path
                    d={`M ${x} ${y} L ${svgRect.width - 10} ${y}`}
                    stroke={rgba('#fff', 0.06)}
                    strokeWidth="1.5"
                    markerEnd="url(#arrowhead)"
                    fill="none"
                  />

                  <path
                    d={`M ${svgRect.width - 10} ${y} L ${svgRect.width - 10} 10`}
                    stroke={rgba('#fff', 0.06)}
                    strokeWidth="1.5"
                    fill="none"
                  />
                </>
              )}
              {isStartNode && lowestYForStartNode && (
                <line x1={10} x2={10} y1={lowestYForStartNode} y2={10} stroke={rgba('#fff', 0.06)} strokeWidth="1.5" />
              )}
              {finalEdges.map((item: any, index) => {
                return (
                  <React.Fragment key={index}>
                    <text x={item.startX + 4} y={item.startY + 3} fontSize="10" fontWeight="500" fill={theme.primary}>
                      {item.percent}%
                    </text>
                    <path
                      d={item.path}
                      stroke={rgba('#fff', 0.06)}
                      strokeWidth="1.5"
                      markerEnd="url(#arrowhead)"
                      fill="none"
                    />
                  </React.Fragment>
                )
              })}
            </React.Fragment>
          )
        })}
      </svg>

      <Flex
        justifyContent="space-evenly"
        ref={contentRef}
        sx={{
          padding: '0 48px 120px',
          gap: '48px',
          minWidth: maxLevel * 168 + (maxLevel + 1) * 48,
        }}
      >
        {levels.map(level => {
          const nodesAtLevel = nodes.filter(node => maximumPathLengths[node.address] === level)

          return (
            <Flex key={level} flexDirection="column" justifyContent="space-around" sx={{ gap: '24px' }}>
              {nodesAtLevel.map(node => {
                const edgesIn = edges.filter(edge => edge.target.address === node.address)

                return (
                  <RouteNode
                    node={node}
                    edgesIn={edgesIn}
                    key={node.address + force}
                    setNodeRects={setNodeRects}
                    tradeComposition={tradeComposition}
                  />
                )
              })}
            </Flex>
          )
        })}
      </Flex>
    </ScrollContainer>
  )
}

export default TradeRouteV3

const RouteNode = ({
  edgesIn,
  node,
  setNodeRects,
  tradeComposition,
}: {
  edgesIn: Edge[]
  node: Token
  setNodeRects: React.Dispatch<React.SetStateAction<{ [key: string]: DOMRect }>>
  tradeComposition: SwapRouteV3[]
}) => {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const allDexes = useAllDexes(chainId)

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      setNodeRects(prev => ({ ...prev, [node.address]: rect }))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [setNodeRects, node.address, tradeComposition])

  return (
    <NodeWrapper ref={ref}>
      <Flex sx={{ gap: '4px' }} alignItems="center">
        <CurrencyLogo currency={node} size="20px" />
        <Text color={theme.subText} fontSize={12} fontWeight={500}>
          {node.symbol}
        </Text>
      </Flex>

      {edgesIn.map(edge => {
        const totalAmount = edge.swaps.reduce((acc, cur) => BigInt(cur.swapAmount) + acc, 0n)
        return (
          <ListPool key={edge.source.address + edge.target.address}>
            <Flex alignItems="center" sx={{ gap: '4px', fontSize: '12px' }} color={theme.subText}>
              {edge.source.symbol} → {edge.target.symbol}
            </Flex>
            {edge.swaps.map(swap => {
              const dex = getDexInfoByPool(swap.exchange, allDexes)
              const poolId = swap.pool.split('-')?.[0]

              const isAddressLink = isAddress(chainId || 1, poolId)
              const percent =
                Number((swap.swapAmount ? (BigInt(swap.swapAmount) * 100000n) / totalAmount : 0n).toString()) / 1000

              return (
                <Flex
                  key={swap.pool}
                  as={isAddressLink ? 'a' : 'div'}
                  href={getEtherscanLink(chainId || 1, poolId, 'address')}
                  alignItems="center"
                  target="_blank"
                  sx={{ gap: '4px', fontSize: '10px', color: theme.subText }}
                >
                  <img src={dex?.logoURL} alt="" width="12px" height="12px" style={{ borderRadius: '50%' }} />
                  <Text flex={1} sx={{}}>
                    {dex?.name || swap.exchange}
                  </Text>
                  <Text marginLeft="auto">{percent.toFixed(0)}%</Text>
                </Flex>
              )
            })}
          </ListPool>
        )
      })}
    </NodeWrapper>
  )
}
