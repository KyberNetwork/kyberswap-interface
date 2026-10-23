import { Token } from '@kyberswap/ks-sdk-core'
import { describe, expect, it } from 'vitest'

import { buildSequentialRouteGraph, buildV2RouteGraph, buildV3RouteGraph } from 'components/TradeRouting/routeGraph'
import { buildRoutePaths } from 'components/TradeRouting/routePaths'
import type { SwapRouteV3 } from 'utils/aggregationRouting'

const token = (id: number) => new Token(1, `0x${id.toString().padStart(40, '0')}`, 18, `T${id}`)
const [a, b, c, d] = [1, 2, 3, 4].map(token)
const swap = (tokenIn: Token, tokenOut: Token, swapAmount = '100', pool = 'pool'): SwapRouteV3 => ({
  tokenIn,
  tokenOut,
  swapAmount,
  amountOut: '100',
  pool,
  exchange: 'dex',
})

const svgRect = { x: 100, y: 200, width: 600, height: 200 }
const sourceRect = { x: 110, y: 200, width: 1, height: 200 }

describe('route graph and geometry', () => {
  it('preserves a direct route and its SVG-local label/terminal positions', () => {
    const graph = buildV3RouteGraph([swap(a, b)], a)
    expect(graph.levels).toEqual([1])
    expect(graph.edges[0].percent).toBe(100)
    const paths = buildRoutePaths(
      graph,
      {
        [a.address]: sourceRect,
        [b.address]: { x: 148, y: 200, width: 168, height: 113 },
      },
      svgRect,
    )
    expect(paths[0].paths[0]).toMatchObject({ path: 'M 11 56.5 L 48 56.5', label: { x: 26.1, y: 59.5 } })
    expect(paths[1].terminal).toEqual({
      label: { x: 220, y: 59.5 },
      percent: 100,
      path: 'M 216 56.5 L 590 56.5',
      connector: 'M 590 56.5 L 590 10',
    })
  })

  it('groups pools and preserves zero and thin pool percentages with integer amount precision', () => {
    const graph = buildV3RouteGraph(
      [
        swap(a, b, '999950', 'large'),
        swap(a, b, '50', 'thin'),
        swap(a, b, '0', 'zero'),
        swap(a, c, '1000000', 'split'),
      ],
      a,
    )
    expect(graph.edges.map(edge => edge.percent)).toEqual([50, 50])
    expect(graph.nodes.find(node => node.id === b.address)?.groups[0].pools.map(pool => pool.percent)).toEqual([
      99.995, 0.005, 0,
    ])
    expect(graph.maximumPathLengths).toMatchObject({ [a.address]: 0, [b.address]: 1, [c.address]: 1 })
  })

  it('places a target reached directly and through multiple hops at its longest route level', () => {
    const graph = buildV3RouteGraph([swap(a, d), swap(a, b), swap(b, c), swap(c, d)], a)
    expect(graph.nodes.map(node => node.id)).toEqual([a.address, b.address, c.address, d.address])
    expect(graph.levels).toEqual([1, 2, 3])
    expect(graph.maximumPathLengths[d.address]).toBe(3)
  })

  it('keeps cyclic routes finite, including a cycle returning to the input token', () => {
    const graph = buildV3RouteGraph([swap(a, b), swap(b, a)], a)
    expect(graph.maximumPathLengths).toEqual({ [a.address]: 2, [b.address]: 1 })
    expect(graph.levels).toEqual([1, 2])
    const paths = buildRoutePaths(
      graph,
      {
        [a.address]: sourceRect,
        [b.address]: { x: 148, y: 200, width: 168, height: 113 },
      },
      svgRect,
    )
    expect(paths.flatMap(node => node.paths)).toHaveLength(2)
    expect(JSON.stringify(paths)).not.toMatch(/NaN|Infinity/)
  })

  it('routes a non-overlapping hop into the top of the target and keeps labels by the source', () => {
    const graph = buildV3RouteGraph([swap(a, b), swap(b, c)], a)
    const paths = buildRoutePaths(
      graph,
      {
        [a.address]: sourceRect,
        [b.address]: { x: 148, y: 200, width: 168, height: 113 },
        [c.address]: { x: 364, y: 400, width: 168, height: 113 },
      },
      { ...svgRect, height: 400 },
    )
    expect(paths.find(node => node.id === b.address)?.paths[0]).toMatchObject({
      path: 'M 216 56.5 L 348 56.5 L 348 200',
      label: { x: 220, y: 59.5 },
      percent: 100,
    })
  })

  it('can prepare an empty quote before any node measurements exist', () => {
    const graph = buildV3RouteGraph([], a)
    expect(graph.maxLevel).toBe(0)
    expect(buildRoutePaths(graph, {}, svgRect)).toEqual([])
  })

  it('keeps V2 branches distinct with their quoted splits and pool-link rules', () => {
    const pool = '0x0000000000000000000000000000000000000005'
    const graph = buildV2RouteGraph(
      [
        {
          id: 'left',
          path: [a, b, d],
          swapPercentage: 30,
          subRoutes: [
            [{ id: pool, exchange: 'dex', swapPercentage: 100 }],
            [{ id: pool, exchange: '1inch', swapPercentage: 100 }],
          ],
        },
        {
          id: 'right',
          path: [a, d],
          swapPercentage: 70,
          subRoutes: [[{ id: pool, exchange: 'dex', swapPercentage: 100 }]],
        },
      ],
      1,
      [],
    )

    expect(graph.edges.filter(edge => edge.source === graph.inputId).map(edge => edge.percent)).toEqual([30, 70])
    expect(new Set(graph.nodes.map(node => node.id)).size).toBe(4)
    expect(graph.edges.find(edge => edge.target === 'left:1')?.source).toBe('left:0')
    expect(graph.maximumPathLengths['right:0']).toBe(graph.maximumPathLengths['left:1'])
    expect(graph.nodes.find(node => node.id === 'left:0')?.groups[0].pools[0].href).toContain(pool)
    expect(graph.nodes.find(node => node.id === 'left:1')?.groups[0].pools[0].href).toBeUndefined()
  })

  it('preserves sequential provider steps without merging repeated tokens or inventing percentages', () => {
    const steps = [
      { id: 'source:USDC', label: 'USDC', groups: [] },
      { id: 'destination:USDC', label: 'USDC', groups: [] },
      { id: 'unknown', label: 'Route', groups: [{ id: 'provider', pools: [{ id: 'provider', name: 'Provider' }] }] },
    ]
    const graph = buildSequentialRouteGraph(steps)

    expect(graph.nodes.slice(1)).toEqual(steps)
    expect(graph.edges.map(edge => [edge.source, edge.target])).toEqual([
      ['input', 'source:USDC'],
      ['source:USDC', 'destination:USDC'],
      ['destination:USDC', 'unknown'],
    ])
    expect(graph.edges.every(edge => edge.percent === undefined)).toBe(true)
    expect(graph.nodes.every(node => node.outputPercent === undefined)).toBe(true)
  })

  it('draws every dense indirect edge and keeps geometry invariant when the panel moves', () => {
    const targets = Array.from({ length: 10 }, (_, index) => token(index + 10))
    const graph = buildV3RouteGraph([swap(a, b), ...targets.map(target => swap(b, target))], a)
    const rects = {
      [a.address]: sourceRect,
      [b.address]: { x: 148, y: 200, width: 168, height: 113 },
      ...Object.fromEntries(
        targets.map((target, index) => [target.address, { x: 364, y: 500 + index * 140, width: 168, height: 113 }]),
      ),
    }
    const viewport = { ...svgRect, height: 2000 }
    const paths = buildRoutePaths(graph, rects, viewport)
    const translated = buildRoutePaths(
      graph,
      Object.fromEntries(
        Object.entries(rects).map(([id, rect]) => [id, { ...rect, x: rect.x + 250, y: rect.y + 400 }]),
      ),
      { ...viewport, x: viewport.x + 250, y: viewport.y + 400 },
    )

    expect(paths.flatMap(node => node.paths)).toHaveLength(graph.edges.length)
    expect(JSON.stringify(paths)).not.toMatch(/NaN|Infinity/)
    expect(translated).toEqual(paths)
  })
})
