import { Token } from '@kyberswap/ks-sdk-core'
import '@xyflow/react/dist/style.css'
import cytoscape from 'cytoscape'
import dagre from 'cytoscape-dagre'
import { useEffect } from 'react'

import useTheme from 'hooks/useTheme'
import { SwapRouteV3 } from 'utils/aggregationRouting'

cytoscape.use(dagre)

type Node = {
  id: string
  data: {
    label: string
  }
}

type Edge = {
  id: string
  source: string
  target: string
  animated: boolean
}

export const RouteRowV3 = ({
  tradeComposition,
  tokenIn,
  tokenOut,
}: {
  tradeComposition: SwapRouteV3[]
  tokenIn: Token | undefined
  tokenOut: Token | undefined
}) => {
  const theme = useTheme()
  useEffect(() => {
    if (!tokenIn || !tokenOut) return
    const tokens: { [key: string]: Token } = {}
    tradeComposition.forEach(trade => {
      tokens[trade.tokenIn.address.toLowerCase()] = trade.tokenIn
      tokens[trade.tokenOut.address.toLowerCase()] = trade.tokenOut
    })

    const initNodes: Node[] = [
      {
        id: tokenIn.address.toLowerCase(),
        data: { label: tokenIn.symbol || '' },
      },
      ...Object.keys(tokens)
        .filter(
          addr =>
            addr.toLowerCase() !== tokenIn.address.toLowerCase() &&
            addr.toLowerCase() !== tokenOut.address.toLowerCase(),
        )
        .map(addr => ({
          id: addr,
          type: '',
          data: { label: tokens[addr].symbol || '' },
        })),
      {
        id: tokenOut.address.toLowerCase(),
        data: { label: tokenOut.symbol || '' },
      },
    ]

    const initEdges: Edge[] = []
    for (let i = 0; i < initNodes.length; i++) {
      for (let j = i + 1; j < initNodes.length; j++) {
        const swaps = tradeComposition.filter(
          swap =>
            swap.tokenIn.address.toLowerCase() === initNodes[i].id &&
            swap.tokenOut.address.toLowerCase() === initNodes[j].id,
        )

        if (swaps.length) {
          initEdges.push({
            id: `${initNodes[i].id}-${initNodes[j].id}`,
            source: initNodes[i].id,
            target: initNodes[j].id,
            animated: true,
          })
        }
      }
    }

    const cy = cytoscape({
      container: document.getElementById('cy'), // Specify the container ID
      elements: [
        ...initNodes.map(item => ({
          data: { id: item.id, label: item.data.label },
        })),

        ...initEdges.map(item => ({
          data: { id: item.id, source: item.source, target: item.target },
        })),
      ],
      layout: {
        name: 'dagre',
        rankDir: 'LR',
      } as any,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': theme.background,
            color: theme.subText,
            'border-color': theme.border,
            'border-width': 1,
            'padding-top': '8px',
            'padding-left': '8px',
            'padding-bottom': '8px',
            'padding-right': '8px',
            'font-size': 12,
            label: 'data(label)',
            'text-wrap': 'wrap',
            'text-valign': 'center',
            'text-halign': 'center',
            width: 'max-content',
            shape: 'roundrectangle',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 3,
            'line-color': '#888',
            'target-arrow-color': '#888',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier', // Taxi edge style
          },
        },
        {
          selector: 'edge.round-taxi',
          style: {
            'curve-style': 'taxi',
            'taxi-direction': 'horizontal',
            'taxi-turn': 20,
            'taxi-turn-min-distance': 5,
          },
        },
      ],
    })

    // Clean up Cytoscape instance on unmount
    return () => cy.destroy()
  }, [tradeComposition])

  if (!tokenIn || !tokenOut) return null

  return <div style={{ height: '500px' }} id="cy"></div>

  //return (
  //  <>
  //    {groups.map((group, index) => {
  //      if (group.tokenOut.toLowerCase() === tokenOut.address.toLowerCase())
  //        return (
  //          <div style={{ display: 'flex', padding: level * 16 + 'px' }}>
  //            {tokenOut.symbol} {level}
  //          </div>
  //        )
  //
  //      return (
  //        <div style={{ padding: level * 16 + 'px' }} key={`${group.tokenIn.address}-${group.tokenOut}`}>
  //          <div>
  //            {group.swaps[0].tokenOut.symbol} {' -> '}{' '}
  //          </div>
  //
  //          <RouteRowV3
  //            level={level + 1}
  //            tradeComposition={tradeComposition}
  //            tokenIn={group.swaps[0].tokenOut}
  //            tokenOut={tokenOut}
  //          />
  //        </div>
  //      )
  //    })}
  //  </>
  //)
}
