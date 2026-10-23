import type { ChainId, Token } from '@kyberswap/ks-sdk-core'

import { getDexInfoByPool } from 'components/TradeRouting/helpers'
import type { Dex } from 'state/customizeDexes'
import { isAddress } from 'utils/address'
import type { SwapRouteV2, SwapRouteV3 } from 'utils/aggregationRouting'
import { getEtherscanLink } from 'utils/explorer'

export type RouteGraphPool = { id: string; name: string; logo?: string; href?: string; percent?: number }
export type RouteGraphNode = {
  id: string
  label: string
  currency?: Token
  href?: string
  logoSources?: string[]
  chainBadge?: { src: string; name: string }
  groups: { id: string; label?: string; pools: RouteGraphPool[] }[]
  outputPercent?: number
}
export type RouteGraphEdge = { id: string; source: string; target: string; percent?: number }
export type RouteGraph = {
  nodes: RouteGraphNode[]
  edges: RouteGraphEdge[]
  levels: number[]
  maximumPathLengths: Record<string, number>
  inputId: string
  maxLevel: number
}

const poolDetails = (pool: string, exchange: string, chainId: ChainId, allDexes: Dex[], allowLink = true) => {
  const dex = getDexInfoByPool(exchange, allDexes)
  const address = pool.split('-')[0]

  return {
    id: pool,
    name: dex?.name || exchange,
    logo: dex?.logoURL,
    href: allowLink && isAddress(chainId, address) ? getEtherscanLink(chainId, address, 'address') : undefined,
  }
}

const getPercent = (amount: bigint, total: bigint) => Number((amount * 100000n) / total) / 1000
const sumSwapAmounts = (swaps: SwapRouteV3[]) => swaps.reduce((sum, swap) => sum + BigInt(swap.swapAmount), 0n)

export const buildV3RouteGraph = (
  tradeComposition: SwapRouteV3[],
  tokenIn: Token,
  allDexes: Dex[] = [],
): RouteGraph => {
  const tokenMap: Record<string, Token> = {}
  tradeComposition.forEach(swap => {
    tokenMap[swap.tokenIn.address] = swap.tokenIn
    tokenMap[swap.tokenOut.address] = swap.tokenOut
  })
  const tokens = Object.values(tokenMap)
  const nodes: RouteGraphNode[] = tokens.map(token => ({
    id: token.address,
    label: token.symbol || '',
    currency: token,
    groups: [],
    outputPercent: 100,
  }))
  const edges: RouteGraphEdge[] = []

  for (const source of tokens) {
    const sourceSwaps = tradeComposition.filter(
      swap => swap.tokenIn.address.toLowerCase() === source.address.toLowerCase(),
    )
    const sourceAmount = sumSwapAmounts(sourceSwaps)
    for (const target of tokens) {
      const swaps = sourceSwaps.filter(swap => swap.tokenOut.address.toLowerCase() === target.address.toLowerCase())
      if (!swaps.length) continue
      const amount = sumSwapAmounts(swaps)
      edges.push({
        id: `${source.address}-${target.address}`,
        source: source.address,
        target: target.address,
        percent: getPercent(amount, sourceAmount),
      })
      nodes
        .find(node => node.id === target.address)
        ?.groups.push({
          id: `${source.address}-${target.address}`,
          label: `${source.symbol} → ${target.symbol}`,
          pools: swaps.map(swap => ({
            ...poolDetails(swap.pool, swap.exchange, swap.tokenOut.chainId, allDexes),
            percent: swap.swapAmount ? getPercent(BigInt(swap.swapAmount), amount) : 0,
          })),
        })
    }
  }

  const maximumPathLengths: Record<string, number> = { [tokenIn.address]: 0 }
  const queue = [tokenIn.address]
  // Cyclic routes must stop relaxing at a bounded depth, otherwise a same-token route can freeze the tab.
  const maxPathLength = nodes.length
  while (queue.length) {
    const currentNode = queue.shift() as string
    const currentLength = maximumPathLengths[currentNode] || 0
    for (const edge of edges.filter(edge => edge.source === currentNode)) {
      const targetAddress = edge.target
      const newLength = currentLength + 1
      if (
        newLength <= maxPathLength &&
        (maximumPathLengths[targetAddress] === undefined || newLength > maximumPathLengths[targetAddress])
      ) {
        maximumPathLengths[targetAddress] = newLength
        queue.push(targetAddress)
      }
    }
  }

  const levels = [...new Set(Object.values(maximumPathLengths))].filter(Boolean).sort((a, b) => a - b)
  nodes.sort((a, b) => (maximumPathLengths[a.id] || 0) - (maximumPathLengths[b.id] || 0))
  return { nodes, edges, levels, maximumPathLengths, inputId: tokenIn.address, maxLevel: Math.max(0, ...levels) }
}

/** V2 paths retain their own node identities, even when separate branches use the same token. */
export const buildV2RouteGraph = (routes: SwapRouteV2[], chainId: ChainId, allDexes: Dex[]): RouteGraph => {
  const inputId = 'input'
  const nodes: RouteGraphNode[] = [{ id: inputId, label: '', groups: [] }]
  const edges: RouteGraphEdge[] = []
  const maximumPathLengths: Record<string, number> = { [inputId]: 0 }
  const maxLevel = Math.max(0, ...routes.map(route => route.subRoutes.length))

  for (const route of routes) {
    let source = inputId

    route.subRoutes.forEach((pools, index) => {
      const token = route.path[index + 1]
      const id = `${route.id}:${index}`
      const percent = routes.length === 1 ? 100 : route.swapPercentage

      nodes.push({
        id,
        label: token.symbol || '',
        currency: token,
        href: getEtherscanLink(token.chainId, token.wrapped.address, 'token'),
        groups: [
          {
            id,
            label: `${route.path[index].symbol} → ${token.symbol}`,
            pools: pools.map(pool => ({
              ...poolDetails(
                pool.id,
                pool.exchange,
                chainId,
                allDexes,
                !['1inch', 'paraswap', '0x'].includes(pool.exchange),
              ),
              percent: pool.swapPercentage,
            })),
          },
        ],
      })
      edges.push({
        id: `${source}-${id}`,
        source,
        target: id,
        percent:
          index === 0 && percent !== undefined
            ? routes.length > 1
              ? Math.min(99.99, Math.max(0.01, percent))
              : percent
            : undefined,
      })
      // All branch outputs share the last column so terminal connectors cannot cross later cards.
      maximumPathLengths[id] = index === route.subRoutes.length - 1 ? maxLevel : index + 1
      source = id
    })
  }

  const levels = [...new Set(Object.values(maximumPathLengths))].filter(Boolean).sort((a, b) => a - b)
  return { nodes, edges, levels, maximumPathLengths, inputId, maxLevel }
}

/** Step identity is independent of token addresses so bridge destinations and repeated tokens stay distinct. */
export const buildSequentialRouteGraph = (steps: RouteGraphNode[]): RouteGraph => {
  const inputId = 'input'
  return {
    inputId,
    nodes: [{ id: inputId, label: '', groups: [] }, ...steps],
    edges: steps.map((step, index) => ({
      id: step.id,
      source: index ? steps[index - 1].id : inputId,
      target: step.id,
    })),
    maximumPathLengths: Object.fromEntries([[inputId, 0], ...steps.map((step, index) => [step.id, index + 1])]),
    levels: steps.map((_, index) => index + 1),
    maxLevel: steps.length,
  }
}
