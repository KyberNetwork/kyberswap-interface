import type { ReactNode } from 'react'

/** A price level drawn across the chart, such as an order's trigger. */
export type PriceMarker = { id: string; price: number }

export type PriceMarkerOverlay = {
  markers: PriceMarker[]
  /** Short tag on each line, e.g. "STOP". */
  label: string
  /**
   * The price the markers are measured against. Drawn as its own line in place of the last candle's
   * close, which can come from a different source.
   */
  referencePrice?: number
  /** Content shown when a line is hovered or tapped; handed every marker the line stands for. */
  renderDetails: (markerIds: string[]) => ReactNode
  /** Text for the edge badge counting markers outside the visible price range. */
  renderOffscreen: (count: number, direction: 'above' | 'below') => ReactNode
}

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
  let above = 0
  let below = 0

  markers.forEach(marker => {
    const y = toY(marker.price)
    if (y === null) return
    if (y < 0) above += 1
    else if (y > paneHeight) below += 1
    else visible.push({ ...marker, y })
  })

  return { visible, above, below }
}
