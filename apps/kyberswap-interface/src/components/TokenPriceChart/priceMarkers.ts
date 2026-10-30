import type { ReactNode } from 'react'

/** Which way the chart price has to move to reach a marker and set it off. */
export type MarkerCrossing = 'up' | 'down'

/** A price level drawn across the chart, such as an order's trigger. */
export type PriceMarker = { id: string; price: number; crossing?: MarkerCrossing }

/** The colour a group's lines and tags are drawn in. */
export type MarkerTone = 'warning' | 'blue'

/** One kind of marker on the chart, such as a wallet's stop market orders, with its own tag and colour. */
export type PriceMarkerGroup = {
  /** Unique among the overlay's groups; it scopes the ids of the group's markers. */
  key: string
  markers: PriceMarker[]
  /** Short tag on each line, e.g. "STOP". */
  label: string
  tone: MarkerTone
  /** Content shown when a line is hovered or tapped; handed every marker of this group the line stands for. */
  renderDetails: (markerIds: string[]) => ReactNode
  /** What the badge counting this group's markers outside the visible price range calls them. */
  renderOffscreen: (count: number) => ReactNode
}

export type PriceMarkerOverlay = {
  groups: PriceMarkerGroup[]
  /**
   * The price the markers are measured against. Drawn as its own line in place of the last candle's
   * close, which can come from a different source.
   */
  referencePrice?: number
}

/**
 * The overlay for the pair read the other way round: every price becomes its reciprocal, and a level
 * the price had to rise to is now one it has to fall to.
 */
export const invertMarkerOverlay = (overlay: PriceMarkerOverlay): PriceMarkerOverlay => ({
  groups: overlay.groups.map(group => ({
    ...group,
    markers: group.markers.map(marker => ({
      ...marker,
      price: 1 / marker.price,
      crossing: marker.crossing === 'up' ? 'down' : marker.crossing === 'down' ? 'up' : undefined,
    })),
  })),
  referencePrice: overlay.referencePrice === undefined ? undefined : 1 / overlay.referencePrice,
})

/** A marker's id on the chart, scoped by its group, since two groups can number their markers alike. */
export const getGroupedMarkerId = (groupKey: string, markerId: string) => `${groupKey}:${markerId}`

/**
 * Every group's markers on one list, each id scoped by its group. Lines are placed and grouped across
 * all of them, so markers of different kinds that sit close together never draw overlapping tags.
 */
export const flattenMarkerGroups = (groups: PriceMarkerGroup[]): PriceMarker[] =>
  groups.flatMap(group => group.markers.map(marker => ({ ...marker, id: getGroupedMarkerId(group.key, marker.id) })))

/** How many of the given markers each group has, by group key; groups with none are left out. */
export const countMarkersByGroup = (ids: string[], groups: PriceMarkerGroup[]): Record<string, number> =>
  Object.fromEntries(splitMarkerIdsByGroup(ids, groups).map(entry => [entry.group.key, entry.ids.length]))

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

/** A line of one kind of marker, ready to draw: its group, and the column its label takes beside the axis. */
export type PlacedMarkerCluster = MarkerCluster & { groupKey: string; column: number }

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
 * Clusters each group's markers on their own, so lines of different kinds never merge: a limit order and
 * a stop market order at one price stay two lines, each in its own colour. The cap applies per group.
 */
export const clusterMarkersByGroup = (
  visible: PositionedMarker[],
  groups: PriceMarkerGroup[],
  options: { minGap: number; maxClusters: number },
): Array<MarkerCluster & { groupKey: string }> =>
  groups.flatMap(group => {
    const prefix = getGroupedMarkerId(group.key, '')
    const own = visible.filter(marker => marker.id.startsWith(prefix))
    return clusterMarkers(own, options).map(cluster => ({ ...cluster, groupKey: group.key }))
  })

/**
 * Lays the lines' labels out beside the price axis, top to bottom. Lines of different kinds can sit
 * closer than a label is tall; such a label takes the next column to the left of the one it would cover,
 * so every label stays level with its own line.
 */
export const placeMarkerLabels = (
  clusters: Array<MarkerCluster & { groupKey: string }>,
  labelHeight: number,
): PlacedMarkerCluster[] => {
  const placed: PlacedMarkerCluster[] = []
  ;[...clusters]
    .sort((a, b) => a.y - b.y)
    .forEach(cluster => {
      const taken = new Set(
        placed.filter(other => Math.abs(other.y - cluster.y) < labelHeight).map(other => other.column),
      )
      let column = 0
      while (taken.has(column)) column += 1
      placed.push({ ...cluster, column })
    })
  return placed
}

/**
 * Finds lines of different kinds that land on one pixel row, such as a limit order and a stop market order at
 * one price. Each row returned holds two or more lines, top to bottom; they are drawn as one line in their
 * colours by turns, as either colour alone would hide the other.
 */
export const findSharedLines = <T extends { y: number; groupKey: string }>(clusters: T[], tolerance = 1): T[][] => {
  const rows: T[][] = []
  ;[...clusters]
    .sort((a, b) => a.y - b.y)
    .forEach(cluster => {
      const row = rows[rows.length - 1]
      if (row && cluster.y - row[0].y < tolerance) row.push(cluster)
      else rows.push([cluster])
    })
  return rows.filter(row => new Set(row.map(cluster => cluster.groupKey)).size > 1)
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

/** Lines of different kinds on one pixel row, drawn as one line in their colours by turns. */
type SharedMarkerLine = { y: number; colors: string[] }

export type MarkerLayout = {
  clusters: PlacedMarkerCluster[]
  sharedLines: SharedMarkerLine[]
  aboveIds: string[]
  belowIds: string[]
  scaleWidth: number
  paneHeight: number
}
export const MARKER_LABEL_HEIGHT_PX = 22

/** The group a line belongs to; every line comes from one of the overlay's groups. */
export const getClusterGroup = (cluster: PlacedMarkerCluster, groups: PriceMarkerGroup[]) =>
  groups.find(group => group.key === cluster.groupKey) ?? groups[0]

export const clusterKey = (cluster: PlacedMarkerCluster) => cluster.ids.join(',')

export const getMarkerLayoutKey = (layout: MarkerLayout) =>
  [
    layout.clusters.map(cluster => `${clusterKey(cluster)}@${Math.round(cluster.y)}#${cluster.column}`).join('|'),
    layout.sharedLines.map(line => `${Math.round(line.y)}:${line.colors.join('/')}`).join('|'),
    layout.aboveIds.join(','),
    layout.belowIds.join(','),
    layout.scaleWidth,
    layout.paneHeight,
  ].join(';')
