import { computePosition, flip, limitShift, shift } from '@floating-ui/dom'
import { Percent, Token } from '@kyberswap/ks-sdk-core'
import cytoscape from 'cytoscape'
import dagre from 'cytoscape-dagre'
import cytoscapePopper from 'cytoscape-popper'
import { BigNumber } from 'ethers'
import { useEffect } from 'react'
import { renderToString } from 'react-dom/server'
import { Flex } from 'rebass'

import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useAllDexes } from 'state/customizeDexes/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { getEtherscanLink, isAddress } from 'utils'
import { SwapRouteV3 } from 'utils/aggregationRouting'

import { getDexInfoByPool } from './helpers'

cytoscape.use(dagre)

cytoscape.use(
  cytoscapePopper((ref, content, opts) => {
    // see https://floating-ui.com/docs/computePosition#options
    const popperOptions = {
      // matching the default behaviour from Popper@2
      // https://floating-ui.com/docs/migration#configure-middleware
      middleware: [flip(), shift({ limiter: limitShift() })],
      ...opts,
    }

    function update() {
      computePosition(ref, content, popperOptions).then(({ x, y }) => {
        Object.assign(content.style, {
          left: `${x}px`,
          top: `${y}px`,
          transform: `translateY(-50%)`,
        })
      })
    }
    update()
    return { update }
  }),
)

type Node = {
  id: string
  data: {
    label: string
    logo?: string
  }
}

type Edge = {
  id: string
  source: string
  target: string
  animated: boolean
  label: string
  swaps: SwapRouteV3[]
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
  const { chainId } = useActiveWeb3React()
  const allDexes = useAllDexes(chainId)

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
        data: { label: tokenIn.symbol || '', logo: (tokenIn as WrappedTokenInfo).logoURI },
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
          data: { label: tokens[addr].symbol || '', logo: (tokens[addr] as WrappedTokenInfo).logoURI },
        })),
      {
        id: tokenOut.address.toLowerCase(),
        data: { label: tokenOut.symbol || '', logo: (tokenOut as WrappedTokenInfo).logoURI },
      },
    ]

    const initEdges: Edge[] = []
    for (let i = 0; i < initNodes.length; i++) {
      const totalAmount = tradeComposition
        .filter(swap => swap.tokenIn.address.toLowerCase() === initNodes[i].id)
        .reduce((total, item) => total.add(BigNumber.from(item.swapAmount)), BigNumber.from(0))

      for (let j = 0; j < initNodes.length; j++) {
        const swaps = tradeComposition.filter(
          swap =>
            swap.tokenIn.address.toLowerCase() === initNodes[i].id &&
            swap.tokenOut.address.toLowerCase() === initNodes[j].id,
        )

        const swapAmount = swaps.reduce((total, item) => total.add(BigNumber.from(item.swapAmount)), BigNumber.from(0))
        const percent = new Percent(swapAmount.toString(), totalAmount.toString())

        if (swaps.length) {
          initEdges.push({
            id: `${initNodes[i].id}-${initNodes[j].id}`,
            source: initNodes[i].id,
            target: initNodes[j].id,
            animated: true,
            label: percent.toFixed(0) + '%',
            swaps,
          })
        }
      }
    }

    const cy = cytoscape({
      container: document.getElementById('cy'), // Specify the container ID
      userZoomingEnabled: false,
      elements: [
        ...initNodes.map(item => ({
          data: {
            id: item.id,
            label: item.data.label,
            href: getEtherscanLink(chainId, item.id, 'token'),
            logo: item.data.logo,
          },
        })),

        ...initEdges.map(item => ({
          data: { id: item.id, source: item.source, target: item.target, label: item.label, swaps: item.swaps },
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
            label: 'data(label)',
            'background-color': theme.background,
            color: theme.subText,
            'border-width': 0,
            'font-size': '6px',
            'background-image': 'data(logo)',
            'background-fit': 'contain',
            'background-image-crossorigin': 'null',
            width: '16px',
            height: '16px',
          } as any,
        },
        {
          selector: 'edge',
          style: {
            width: 1,
            'line-color': '#505050',
            'target-arrow-color': theme.primary,
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.6,
            'curve-style': 'straight', // Straight edges instead of bezier
          },
        },

        {
          selector: 'edge[label]',
          style: {
            'source-label': 'data(label)',
            color: theme.primary,
            'font-size': '6px',
            'text-justification': 'left',
            'source-text-offset': 12,
            'source-text-rotation': 'autorotate',
          },
        },
      ],
    })

    const makeDiv = (data: Edge) => {
      let div = document.getElementById(data.id)
      if (!div) div = document.createElement('div')
      div.style.border = `1px solid ${theme.border}`
      div.style.background = theme.background
      div.style.borderRadius = '8px'
      div.style.padding = '0.25rem'
      div.style.width = 'fit-content'
      div.style.position = 'absolute'
      div.style.zIndex = '2'

      div.id = data.id

      const totalAmount = data.swaps.reduce(
        (total, item) => total.add(BigNumber.from(item.swapAmount)),
        BigNumber.from(0),
      )

      div.innerHTML = renderToString(
        <div>
          {data.swaps.map((swap, index) => {
            const percent = new Percent(swap.swapAmount, totalAmount.toString())
            const dex = getDexInfoByPool(swap.exchange, allDexes)
            const isStatic = !isAddress(chainId, swap.pool)

            return (
              <Flex
                key={index}
                padding="2px 0"
                color={theme.subText}
                lineHeight="16px"
                fontSize={10}
                alignItems="center"
                sx={{ gap: '4px' }}
                as={isStatic ? undefined : 'a'}
                href={getEtherscanLink(chainId, swap.pool, 'address')}
                target="_blank"
              >
                <img width={12} height={12} src={dex?.logoURL} />
                <div>{dex?.name || swap.exchange}:</div>
                <div>{percent.toFixed(0)}%</div>
              </Flex>
            )
          })}
        </div>,
      )

      const container = cy.container()
      if (container) container.appendChild(div)

      return div
    }

    cy.edges().forEach(edge => {
      const popper = edge.popper({
        content: () => {
          return makeDiv(edge.data())
        },
      })
      const updateAB = function () {
        popper.update()
      }

      edge.connectedNodes().on('position', updateAB)
      cy.on('pan zoom resize', updateAB)
    })
    cy.on('tap', 'node', event => {
      try {
        // your browser may block popups
        window.open(event.target.data('href'))
      } catch (e) {
        // fall back on url change
        window.location.href = event.target.data('href')
      }
    })
    cy.on('mouseover', 'node', evt => {
      evt.target.css('color', theme.primary)
      const c = evt.cy.container()
      if (c) {
        c.style.cursor = 'pointer'
      }
    })

    cy.on('mouseout', 'node', evt => {
      evt.target.css('color', theme.subText)
      const c = evt.cy.container()
      if (c) {
        c.style.cursor = 'default'
      }
    })

    cy.fit()

    // Clean up Cytoscape instance on unmount
    return () => cy.destroy()

    // eslint-disable-next-line
  }, [JSON.stringify(tradeComposition)])

  if (!tokenIn || !tokenOut) return null

  return <div style={{ height: '500px', overflow: 'hidden' }} id="cy"></div>
}
