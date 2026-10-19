import type { ReactNode } from 'react'

/** Which way the chart price has to move to reach a marker and set it off. */
export type MarkerCrossing = 'up' | 'down'

/** A price level drawn across the chart, such as an order's trigger. */
export type PriceMarker = { id: string; price: number; crossing?: MarkerCrossing }

/** The colour a group's lines and tags are drawn in. */
export type MarkerTone = 'warning' | 'blue'

/** One kind of marker on the chart, such as a wallet's stop orders, with its own tag and colour. */
export type PriceMarkerGroup = {
  /** Unique among the overlay's groups; it scopes the ids of the group's markers. */
  key: string
  markers: PriceMarker[]
  /** Short tag on each line, e.g. "STOP". */
  label: string
  tone: MarkerTone
  /** Content shown when a line is hovered or tapped; handed every marker of this group the line stands for. */
  renderDetails: (markerIds: string[]) => ReactNode
}

export type PriceMarkerOverlay = {
  groups: PriceMarkerGroup[]
  /**
   * The price the markers are measured against. Drawn as its own line in place of the last candle's
   * close, which can come from a different source.
   */
  referencePrice?: number
  /** Text for the edge badge counting markers outside the visible price range. */
  renderOffscreen: (count: number, direction: 'above' | 'below') => ReactNode
}

/** A marker's id on the chart, scoped by its group, since two groups can number their markers alike. */
export const getGroupedMarkerId = (groupKey: string, markerId: string) => `${groupKey}:${markerId}`

/**
 * Every group's markers on one list, each id scoped by its group. Lines are placed and grouped across
 * all of them, so markers of different kinds that sit close together never draw overlapping tags.
 */
export const flattenMarkerGroups = (groups: PriceMarkerGroup[]): PriceMarker[] =>
  groups.flatMap(group => group.markers.map(marker => ({ ...marker, id: getGroupedMarkerId(group.key, marker.id) })))

/** The markers a line stands for, back in their groups with their own ids, in the overlay's order. */
export const splitMarkerIdsByGroup = (ids: string[], groups: PriceMarkerGroup[]) =>
  groups
    .map(group => {
      const prefix = getGroupedMarkerId(group.key, '')
      return { group, ids: ids.filter(id => id.startsWith(prefix)).map(id => id.slice(prefix.length)) }
    })
    .filter(entry => entry.ids.length > 0)

/** A marker with its vertical pixel position on the chart pane. */
export type PositionedMarker = PriceMarker & { y: number }

/** One drawn line: a single marker, or several that sit too close together to tell apart. */
export type MarkerCluster = {
  ids: string[]
  /** The highest price in the group, which a falling price reaches first; the line sits here. */
  price: number
  minPrice: number
  y: number
}

const MAX_GAP_GROWTH_STEPS = 12

/**
 * Groups markers whose lines would sit closer than `minGap` pixels, so their labels never overlap.
 * Grouping is by on-screen distance rather than by price, so a group falls apart on its own once
 * zooming spreads its members out. When more groups remain than `maxClusters`, the gap widens until
 * they fit.
 */
export const clusterMarkers = (
  markers: PositionedMarker[],
  { minGap, maxClusters }: { minGap: number; maxClusters: number },
): MarkerCluster[] => {
  const sorted = [...markers].sort((a, b) => a.y - b.y || b.price - a.price)
  let gap = minGap

  for (let step = 0; ; step++) {
    const clusters: MarkerCluster[] = []
    sorted.forEach(marker => {
      const current = clusters[clusters.length - 1]
      // Measured from the group's first line, so a group never stretches further than one gap.
      if (current && marker.y - current.y < gap) {
        current.ids.push(marker.id)
        current.minPrice = Math.min(current.minPrice, marker.price)
        return
      }
      clusters.push({ ids: [marker.id], price: marker.price, minPrice: marker.price, y: marker.y })
    })

    if (clusters.length <= Math.max(maxClusters, 1) || step >= MAX_GAP_GROWTH_STEPS) return clusters
    gap *= 1.5
  }
}

/**
 * Splits markers into those on the visible pane and counts of those beyond its top and bottom edges.
 * `toY` returns null only while the chart has no data to place a price against.
 */
export const positionMarkers = (markers: PriceMarker[], toY: (price: number) => number | null, paneHeight: number) => {
  const visible: PositionedMarker[] = []
  const aboveIds: string[] = []
  const belowIds: string[] = []

  markers.forEach(marker => {
    const y = toY(marker.price)
    if (y === null) return
    if (y < 0) aboveIds.push(marker.id)
    else if (y > paneHeight) belowIds.push(marker.id)
    else visible.push({ ...marker, y })
  })

  return { visible, above: aboveIds.length, below: belowIds.length, aboveIds, belowIds }
}

/**
 * The arrow a line's label carries: the way the chart price must move to set its markers off, or both
 * ways when a line groups markers of each kind. Nothing when no marker says.
 */
export const getCrossingArrow = (ids: string[], markers: PriceMarker[]): string => {
  const crossings = new Set(ids.map(id => markers.find(marker => marker.id === id)?.crossing).filter(Boolean))
  if (crossings.size > 1) return '↕'
  if (crossings.has('up')) return '↑'
  if (crossings.has('down')) return '↓'
  return ''
}
