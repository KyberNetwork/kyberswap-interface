import { describe, expect, it } from 'vitest'

import { clusterMarkers, positionMarkers } from 'components/TokenPriceChart/priceMarkers'

const marker = (id: string, price: number, y: number) => ({ id, price, y })

describe('clusterMarkers', () => {
  it('keeps lines that are far enough apart separate', () => {
    const clusters = clusterMarkers([marker('a', 100, 10), marker('b', 90, 60)], { minGap: 20, maxClusters: 6 })
    expect(clusters.map(c => c.ids)).toEqual([['a'], ['b']])
  })

  it('merges lines closer than the gap and places the group at its highest price', () => {
    const clusters = clusterMarkers([marker('a', 99, 15), marker('b', 100, 10), marker('c', 80, 100)], {
      minGap: 20,
      maxClusters: 6,
    })
    expect(clusters).toEqual([
      { ids: ['b', 'a'], price: 100, minPrice: 99, y: 10 },
      { ids: ['c'], price: 80, minPrice: 80, y: 100 },
    ])
  })

  it('measures from the first line of a group, so a chain of close lines does not merge without end', () => {
    const clusters = clusterMarkers([marker('a', 4, 0), marker('b', 3, 15), marker('c', 2, 30), marker('d', 1, 45)], {
      minGap: 20,
      maxClusters: 6,
    })
    expect(clusters.map(c => c.ids)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })

  it('splits a group once zooming spreads its lines apart', () => {
    const zoomedOut = clusterMarkers([marker('a', 100, 10), marker('b', 99, 18)], { minGap: 20, maxClusters: 6 })
    const zoomedIn = clusterMarkers([marker('a', 100, 10), marker('b', 99, 60)], { minGap: 20, maxClusters: 6 })
    expect(zoomedOut).toHaveLength(1)
    expect(zoomedIn).toHaveLength(2)
  })

  it('widens the gap until the number of lines fits the cap', () => {
    const markers = Array.from({ length: 10 }, (_, index) => marker(String(index), 100 - index, index * 30))
    const clusters = clusterMarkers(markers, { minGap: 20, maxClusters: 3 })
    expect(clusters.length).toBeLessThanOrEqual(3)
    expect(clusters.flatMap(c => c.ids).sort()).toEqual(markers.map(m => m.id).sort())
  })
})

describe('positionMarkers', () => {
  it('counts markers beyond the pane edges and skips ones that cannot be placed', () => {
    const toY = (price: number) => (price === 0 ? null : 200 - price)
    const result = positionMarkers(
      [
        { id: 'top', price: 250 },
        { id: 'in', price: 100 },
        { id: 'bottom', price: 10 },
        { id: 'none', price: 0 },
      ],
      toY,
      150,
    )
    expect(result.visible.map(m => m.id)).toEqual(['in'])
    expect(result.above).toBe(1)
    expect(result.below).toBe(1)
  })
})
