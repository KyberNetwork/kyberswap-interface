import React, { useEffect, useRef, useState } from 'react'
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
import { getDexInfoByPool } from './helpers'
import { getEtherscanLink, isAddress } from 'utils'

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
      if (maximumPathLengths[targetAddress] === undefined) {
        maximumPathLengths[targetAddress] = currentLength + 1
        queue.push(targetAddress)
      } else {
        maximumPathLengths[targetAddress] = Math.max(maximumPathLengths[targetAddress], currentLength + 1)
      }
    }
  }

  const levels = [...new Set(Object.values(maximumPathLengths))].filter(Boolean).sort()

  nodes.sort((a, b) => (maximumPathLengths[a.address] || 0) - (maximumPathLengths[b.address] || 0))

  const theme = useTheme()
  const svgRef = useRef<SVGSVGElement>(null)

  return (
    <>
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
          if (!svgRect) return null
          const totalAmount = edges
            .filter(edge => edge.source.address === node.address)
            .reduce((acc, cur) => {
              const swapAmount = cur.swaps.reduce((acc, cur) => BigInt(cur.swapAmount) + acc, 0n)
              return acc + swapAmount
            }, 0n)

          // tokenOut
          if (edges.filter(edge => edge.source.address === node.address).length === 0) {
            const rect = nodeRects[node.address]
            if (!rect) return null
            const x = rect.x + rect.width - svgRect.x
            const y = rect.y + rect.height / 2 - svgRect.y

            return (
              <React.Fragment key={node.address}>
                <text x={x + 4} y={y + 3} fontSize="10" fontWeight="500" fill={theme.primary}>
                  100%
                </text>
                <line
                  x1={x}
                  y1={y}
                  x2={svgRect.width - 10}
                  y2={y}
                  stroke={rgba('#fff', 0.06)}
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <line
                  x1={svgRect.width - 10}
                  y1={y}
                  x2={svgRect.width - 10}
                  y2={y - svgRect.height / 2}
                  stroke={rgba('#fff', 0.06)}
                  strokeWidth="2"
                />
              </React.Fragment>
            )
          }

          const edgesOut = edges
            .filter(
              edge =>
                edge.source.address === node.address &&
                nodeRects[edge.source.address] &&
                nodeRects[edge.target.address],
            )
            .map(edge => {
              const source = nodeRects[edge.source.address]
              const target = nodeRects[edge.target.address]

              const sourceLevel = maximumPathLengths[edge.source.address]
              const targetLevel = maximumPathLengths[edge.target.address]

              const start = {
                x: source.x + source.width,
                y: (Math.max(source.y, target.y) + Math.min(source.y + source.height, target.y + target.height)) / 2,
              }
              const end = {
                x: target.x,
                y: start.y,
              }

              const middleNodes = nodes.filter(node => {
                const level = maximumPathLengths[node.address]
                return level > sourceLevel && level < targetLevel
              })
              const isCorss = middleNodes.some(node => {
                const nodeRect = nodeRects[node.address]
                if (!nodeRect) return false
                return nodeRect.y < start.y && start.y < nodeRect.y + nodeRect.height
              })

              const swapAmount = edge.swaps.reduce((acc, cur) => BigInt(cur.swapAmount) + acc, 0n)
              const percent = (swapAmount * 100n) / totalAmount

              return {
                ...edge,
                start,
                end,
                middleNodes,
                isCorss,
                percent,
              }
            })

          //token in

          if (node.address === tokenIn.address) {
            const eds = edges.filter(edge => edge.source.address === node.address)
            const totalAmount = eds.reduce((acc, cur) => {
              const swapAmount = cur.swaps.reduce((acc, cur) => BigInt(cur.swapAmount) + acc, 0n)
              return acc + swapAmount
            }, 0n)

            const maxY = Math.max(
              ...eds.map(edge => nodeRects[edge.target.address].y + nodeRects[edge.target.address].height / 2),
            )

            return (
              <React.Fragment key={node.address}>
                <line x1={10} y1={10} x2={10} y2={maxY - svgRect.y} stroke={rgba('#fff', 0.06)} strokeWidth="2" />

                {eds.map(edge => {
                  const target = nodeRects[edge.target.address]
                  if (!target) return null
                  const y = target.y + target.height / 2 - svgRect.y
                  const percent =
                    (edge.swaps.reduce((acc, cur) => BigInt(cur.swapAmount) + acc, 0n) * 100n) / totalAmount

                  return (
                    <React.Fragment key={edge.source.address + edge.target.address}>
                      <text x={16} y={y + 3} fontSize="10" fontWeight="500" fill={theme.primary}>
                        {percent.toString()}%
                      </text>
                      <line
                        x1={10}
                        y1={y}
                        x2={target.x - svgRect.x}
                        y2={y}
                        stroke={rgba('#fff', 0.06)}
                        strokeWidth="2"
                        markerEnd={'url(#arrowhead)'}
                      />
                    </React.Fragment>
                  )
                })}
              </React.Fragment>
            )
          }

          const noCrossEdges = edgesOut.filter(edge => !edge.isCorss)
          const crossEdges = edgesOut.filter(edge => edge.isCorss)

          return (
            <React.Fragment key={node.address}>
              {noCrossEdges.map(edge => {
                const x1 = edge.start.x - svgRect.x
                const y1 = edge.start.y - svgRect.y
                return (
                  <React.Fragment key={edge.source.address + edge.target.address}>
                    <text x={x1 + 4} y={y1 + 3} fontSize="10" fontWeight="500" fill={theme.primary}>
                      {edge.percent.toString()}%
                    </text>

                    <line
                      key={edge.source.address + edge.target.address}
                      x1={edge.start.x - svgRect.x}
                      y1={edge.start.y - svgRect.y}
                      x2={edge.end.x - svgRect.x}
                      y2={edge.end.y - svgRect.y}
                      stroke={rgba('#fff', 0.06)}
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  </React.Fragment>
                )
              })}
              {crossEdges.map((edge, index) => {
                const source = nodeRects[edge.source.address]
                const target = nodeRects[edge.target.address]
                const { end, middleNodes } = edge
                const middleNodeRects = middleNodes
                  .map(node => {
                    const nodeRect = nodeRects[node.address]
                    if (!nodeRect) return null
                    return nodeRect
                  })
                  .filter(Boolean) as DOMRect[]

                const startY =
                  Math.max(
                    source.y + source.height,
                    ...middleNodeRects.map(node => node.y + node.height),
                    target.y + target.height,
                  ) +
                  30 +
                  (crossEdges.length - 1 - index) * 10
                const startX = source.x + (source.width / (crossEdges.length + 1)) * (index + 1)

                const isLineUnderTarget = startY > target.y + target.height

                return (
                  <React.Fragment key={edge.source.address + edge.target.address}>
                    {/*label*/}
                    <text
                      x={startX - svgRect.x + 6}
                      y={startY - svgRect.y + 3}
                      fontSize="10"
                      fontWeight="500"
                      fill={theme.primary}
                    >
                      {edge.percent.toString()}%
                    </text>

                    {/*vertical line*/}
                    <line
                      x1={startX - svgRect.x}
                      y1={source.y + source.height - svgRect.y}
                      x2={startX - svgRect.x}
                      y2={startY - svgRect.y}
                      stroke={rgba('#fff', 0.06)}
                      strokeWidth="2"
                    />
                    {/*horizontal line*/}
                    <line
                      x1={startX - svgRect.x}
                      y1={startY - svgRect.y}
                      x2={end.x + (isLineUnderTarget ? target.width / 2 : 0) - svgRect.x}
                      y2={startY - svgRect.y}
                      stroke={rgba('#fff', 0.06)}
                      strokeWidth="2"
                      markerEnd={isLineUnderTarget ? undefined : 'url(#arrowhead)'}
                    />
                    {isLineUnderTarget && (
                      <line
                        x1={end.x + target.width / 2 - svgRect.x}
                        y1={startY - svgRect.y}
                        x2={end.x + target.width / 2 - svgRect.x}
                        y2={target.y + target.height - svgRect.y}
                        stroke={rgba('#fff', 0.06)}
                        strokeWidth="2"
                        markerEnd={'url(#arrowhead)'}
                      />
                    )}
                  </React.Fragment>
                )
              })}
            </React.Fragment>
          )
        })}
      </svg>
      <Flex justifyContent="space-evenly" sx={{ paddingBottom: '60px' }}>
        {levels.map(level => {
          const nodesAtLevel = nodes.filter(node => maximumPathLengths[node.address] === level)

          return (
            <Flex key={level} flexDirection="column" justifyContent="space-around">
              {nodesAtLevel.map(node => {
                const edgesIn = edges.filter(edge => edge.target.address === node.address)

                return <RouteNode node={node} edgesIn={edgesIn} key={node.address} setNodeRects={setNodeRects} />
              })}
            </Flex>
          )
        })}
      </Flex>
    </>
  )
}

export default TradeRouteV3

const RouteNode = ({
  edgesIn,
  node,
  setNodeRects,
}: {
  edgesIn: Edge[]
  node: Token
  setNodeRects: React.Dispatch<React.SetStateAction<{ [key: string]: DOMRect }>>
}) => {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const allDexes = useAllDexes(chainId)

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setNodeRects(prev => ({ ...prev, [node.address]: rect }))
  }, [setNodeRects, node.address])

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
            <Flex alignItems="center" sx={{ gap: '4px', fontSize: '10px' }}>
              <CurrencyLogo currency={edge.source} size="12px" />
              {edge.source.symbol}
            </Flex>
            {edge.swaps.map(swap => {
              const dex = getDexInfoByPool(swap.exchange, allDexes)
              const poolId = swap.pool.split('-')?.[0]

              const isAddressLink = isAddress(chainId || 1, poolId)
              const percent = swap.swapAmount ? (BigInt(swap.swapAmount) * 100n) / totalAmount : 0n

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
                  <Text marginLeft="auto">{Number(percent.toString()).toFixed(0)}%</Text>
                </Flex>
              )
            })}
          </ListPool>
        )
      })}
    </NodeWrapper>
  )
}
