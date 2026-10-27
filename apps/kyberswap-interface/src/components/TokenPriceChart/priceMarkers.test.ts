import { describe, expect, it } from 'vitest'

import {
  type PriceMarkerGroup,
  clusterMarkers,
  clusterMarkersByGroup,
  countMarkersByGroup,
  findSharedLines,
  flattenMarkerGroups,
  getCrossingArrow,
  invertMarkerOverlay,
  placeMarkerLabels,
  positionMarkers,
  splitMarkerIdsByGroup,
} from 'components/TokenPriceChart/priceMarkers'

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
    expect(result.aboveIds).toEqual(['top'])
    expect(result.belowIds).toEqual(['bottom'])
  })
})

describe('marker groups', () => {
  const group = (key: string, ids: string[]): PriceMarkerGroup => ({
    key,
    label: key.toUpperCase(),
    tone: 'warning',
    markers: ids.map((id, index) => ({ id, price: index + 1 })),
    renderDetails: () => null,
    renderOffscreen: () => null,
  })
  const groups = [group('limit', ['1', '2']), group('stop', ['1'])]

  it('scopes each id by its group, so two groups can number their markers alike', () => {
    expect(flattenMarkerGroups(groups).map(m => m.id)).toEqual(['limit:1', 'limit:2', 'stop:1'])
  })

  it('splits a line back into its groups with their own ids, in the overlay order', () => {
    const split = splitMarkerIdsByGroup(['stop:1', 'limit:2'], groups)
    expect(split.map(entry => [entry.group.key, entry.ids])).toEqual([
      ['limit', ['2']],
      ['stop', ['1']],
    ])
  })

  it('leaves out groups the line has no marker of', () => {
    expect(splitMarkerIdsByGroup(['limit:1'], groups).map(entry => entry.group.key)).toEqual(['limit'])
  })

  it('counts markers by group, leaving out groups with none', () => {
    expect(countMarkersByGroup(['limit:1', 'limit:2'], groups)).toEqual({ limit: 2 })
    expect(countMarkersByGroup([], groups)).toEqual({})
  })
})

describe('getCrossingArrow', () => {
  const markers = [
    { id: 'a', price: 10, crossing: 'down' as const },
    { id: 'b', price: 11, crossing: 'down' as const },
    { id: 'c', price: 12, crossing: 'up' as const },
    { id: 'd', price: 13 },
  ]

  it('points the way the price must move for a line of one kind', () => {
    expect(getCrossingArrow(['a', 'b'], markers)).toBe('↓')
    expect(getCrossingArrow(['c'], markers)).toBe('↑')
  })

  it('points both ways for a line grouping both kinds', () => {
    expect(getCrossingArrow(['a', 'c'], markers)).toBe('↕')
  })

  it('carries no arrow when the markers do not say', () => {
    expect(getCrossingArrow(['d'], markers)).toBe('')
  })
})

describe('clusterMarkersByGroup', () => {
  const group = (key: string): PriceMarkerGroup => ({
    key,
    markers: [],
    label: key.toUpperCase(),
    tone: key === 'limit' ? 'blue' : 'warning',
    renderDetails: () => null,
    renderOffscreen: () => null,
  })
  const groups = [group('limit'), group('stop')]

  it('never merges lines of different kinds, however close they sit', () => {
    const clusters = clusterMarkersByGroup([marker('limit:1', 4.4, 100), marker('stop:9', 4.4, 101)], groups, {
      minGap: 24,
      maxClusters: 6,
    })
    expect(clusters.map(c => [c.groupKey, c.ids])).toEqual([
      ['limit', ['limit:1']],
      ['stop', ['stop:9']],
    ])
  })

  it('still merges lines of one kind that sit too close', () => {
    const clusters = clusterMarkersByGroup(
      [marker('stop:1', 4.4, 100), marker('stop:2', 4.3, 110), marker('limit:1', 5, 40)],
      groups,
      { minGap: 24, maxClusters: 6 },
    )
    expect(clusters.map(c => [c.groupKey, c.ids])).toEqual([
      ['limit', ['limit:1']],
      ['stop', ['stop:1', 'stop:2']],
    ])
  })
})

describe('placeMarkerLabels', () => {
  const cluster = (groupKey: string, y: number) => ({ ids: [`${groupKey}:${y}`], price: y, minPrice: y, y, groupKey })

  it('moves a label that would cover another one column to the left', () => {
    const placed = placeMarkerLabels([cluster('stop', 100), cluster('limit', 105)], 22)
    expect(placed.map(c => [c.groupKey, c.column])).toEqual([
      ['stop', 0],
      ['limit', 1],
    ])
  })

  it('keeps labels in the first column once they are a label apart', () => {
    const placed = placeMarkerLabels([cluster('limit', 140), cluster('stop', 100)], 22)
    expect(placed.map(c => [c.y, c.column])).toEqual([
      [100, 0],
      [140, 0],
    ])
  })
})

describe('findSharedLines', () => {
  const line = (groupKey: string, y: number) => ({ groupKey, y })

  it('pairs lines of different kinds on one pixel row', () => {
    const stop = line('stop', 100)
    const limit = line('limit', 100.4)
    expect(findSharedLines([line('limit', 40), limit, stop])).toEqual([[stop, limit]])
  })

  it('leaves lines a pixel or more apart, or of one kind, on their own', () => {
    expect(findSharedLines([line('stop', 100), line('limit', 101)])).toEqual([])
    expect(findSharedLines([line('stop', 100), line('stop', 100)])).toEqual([])
  })
})

describe('invertMarkerOverlay', () => {
  const group: PriceMarkerGroup = {
    key: 'stop',
    markers: [
      { id: 'a', price: 4, crossing: 'down' },
      { id: 'b', price: 0.5, crossing: 'up' },
      { id: 'c', price: 2 },
    ],
    label: 'STOP',
    tone: 'warning',
    renderDetails: () => null,
    renderOffscreen: () => null,
  }

  it('takes the reciprocal of every price and flips each crossing', () => {
    const inverted = invertMarkerOverlay({ groups: [group], referencePrice: 8 })
    expect(inverted.groups[0].markers).toEqual([
      { id: 'a', price: 0.25, crossing: 'up' },
      { id: 'b', price: 2, crossing: 'down' },
      { id: 'c', price: 0.5, crossing: undefined },
    ])
    expect(inverted.referencePrice).toBe(0.125)
  })

  it('keeps the rest of the group and a missing reference price', () => {
    const inverted = invertMarkerOverlay({ groups: [group] })
    expect(inverted.groups[0]).toMatchObject({ key: 'stop', label: 'STOP', tone: 'warning' })
    expect(inverted.referencePrice).toBeUndefined()
    expect(invertMarkerOverlay(inverted).groups[0].markers).toEqual(group.markers)
  })
})
