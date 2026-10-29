import { type IChartApi, type IPriceLine, type ISeriesApi, LineStyle } from 'lightweight-charts'
import { type MutableRefObject, useCallback, useEffect, useRef, useState } from 'react'

import {
  MARKER_LABEL_HEIGHT_PX,
  type MarkerLayout,
  type MarkerTone,
  type PriceMarkerOverlay,
  clusterMarkers,
  clusterMarkersByGroup,
  countMarkersByGroup,
  findSharedLines,
  flattenMarkerGroups,
  getClusterGroup,
  getMarkerLayoutKey,
  placeMarkerLabels,
  positionMarkers,
} from 'components/TokenPriceChart/priceMarkers'

const MARKER_MIN_GAP_PX = 24
const MAX_MARKER_LINES = 6
const MAX_MARKER_LINES_MOBILE = 3
const MARKER_FOCUS_DURATION_MS = 400
const EMPTY_MARKER_LAYOUT: MarkerLayout = {
  clusters: [],
  sharedLines: [],
  aboveIds: [],
  belowIds: [],
  scaleWidth: 0,
  paneHeight: 0,
}

type UseTokenPriceChartMarkersParams = {
  chartRef: MutableRefObject<IChartApi | null>
  candlestickSeriesRef: MutableRefObject<ISeriesApi<'Candlestick'> | null>
  chartHeightRef: MutableRefObject<number>
  focusMarkerRequest?: { groupKey: string; nonce: number }
  markerOverlay?: PriceMarkerOverlay
  onOffscreenChange?: (counts: Record<string, number>) => void
  upToSmall: boolean
  markerLineColors: Record<MarkerTone, string>
}

const useTokenPriceChartMarkers = ({
  chartRef,
  candlestickSeriesRef,
  chartHeightRef,
  focusMarkerRequest,
  markerOverlay,
  onOffscreenChange,
  upToSmall,
  markerLineColors,
}: UseTokenPriceChartMarkersParams) => {
  const markerOverlayRef = useRef(markerOverlay)
  const onOffscreenChangeRef = useRef(onOffscreenChange)
  // lightweight-charts also uses a price line's color as the right-axis label background.
  const markerLineColorsRef = useRef(markerLineColors)
  const maxMarkerLinesRef = useRef(MAX_MARKER_LINES)
  const markerPriceLinesRef = useRef<IPriceLine[]>([])
  const markerLinePricesKeyRef = useRef('')
  const markerLayoutKeyRef = useRef(getMarkerLayoutKey(EMPTY_MARKER_LAYOUT))
  const markerOffscreenCountsKeyRef = useRef('')
  const markerFrameRef = useRef(0)
  const focusFrameRef = useRef(0)
  const isMarkerFocusAnimatingRef = useRef(false)
  const markerFocusIndexRef = useRef(new Map<string, number>())
  const [markerLayout, setMarkerLayout] = useState<MarkerLayout>(EMPTY_MARKER_LAYOUT)

  /**
   * Re-places the marker lines against the current price scale. Runs at most once a frame, after every
   * change that can move the scale: data, zoom and scroll, resize, and dragging the price axis.
   */
  const scheduleMarkerUpdate = useCallback(() => {
    if (markerFrameRef.current) return
    markerFrameRef.current = globalThis.requestAnimationFrame(() => {
      markerFrameRef.current = 0
      const chart = chartRef.current
      const series = candlestickSeriesRef.current
      if (!chart || !series) return

      const groups = markerOverlayRef.current?.groups ?? []
      const markers = flattenMarkerGroups(groups)
      const paneHeight = chartHeightRef.current - chart.timeScale().height()
      const { visible, aboveIds, belowIds } = positionMarkers(
        markers,
        price => series.priceToCoordinate(price),
        paneHeight,
      )
      const clusters = placeMarkerLabels(
        clusterMarkersByGroup(visible, groups, { minGap: MARKER_MIN_GAP_PX, maxClusters: maxMarkerLinesRef.current }),
        MARKER_LABEL_HEIGHT_PX,
      )
      const lineColors = clusters.map(cluster => markerLineColorsRef.current[getClusterGroup(cluster, groups).tone])
      const colorByCluster = new Map(clusters.map((cluster, index) => [cluster, lineColors[index]]))
      // A shared row keeps each line's axis label but draws the line itself once, in the overlay.
      const sharedRows = findSharedLines(clusters)
      const sharedClusters = new Set(sharedRows.flat())
      const sharedLines = sharedRows.map(row => ({
        y: row[0].y,
        colors: [...new Set(row.map(cluster => colorByCluster.get(cluster) ?? ''))],
      }))

      // Lines are only rebuilt when the set of drawn prices or their colours changes, not on every scroll frame.
      const linePricesKey = clusters
        .map((cluster, index) => `${cluster.price}:${lineColors[index]}:${sharedClusters.has(cluster)}`)
        .join(',')
      if (linePricesKey !== markerLinePricesKeyRef.current) {
        markerLinePricesKeyRef.current = linePricesKey
        markerPriceLinesRef.current.forEach(line => series.removePriceLine(line))
        markerPriceLinesRef.current = clusters.map((cluster, index) =>
          series.createPriceLine({
            price: cluster.price,
            color: lineColors[index],
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            lineVisible: !sharedClusters.has(cluster),
            axisLabelVisible: true,
            title: '',
          }),
        )
      }

      const layout = {
        clusters,
        sharedLines,
        aboveIds,
        belowIds,
        scaleWidth: chart.priceScale('right').width(),
        paneHeight,
      }
      const layoutKey = getMarkerLayoutKey(layout)
      const offscreenCounts = countMarkersByGroup([...aboveIds, ...belowIds], groups)
      const offscreenCountsKey = groups.map(group => `${group.key}:${offscreenCounts[group.key] ?? 0}`).join('|')
      if (layoutKey !== markerLayoutKeyRef.current) {
        markerLayoutKeyRef.current = layoutKey
        setMarkerLayout(layout)
      }
      if (!isMarkerFocusAnimatingRef.current && offscreenCountsKey !== markerOffscreenCountsKeyRef.current) {
        markerOffscreenCountsKeyRef.current = offscreenCountsKey
        onOffscreenChangeRef.current?.(offscreenCounts)
      }
    })
  }, [candlestickSeriesRef, chartHeightRef, chartRef])

  const cancelMarkerFocus = useCallback(() => {
    globalThis.cancelAnimationFrame(focusFrameRef.current)
    focusFrameRef.current = 0
    if (isMarkerFocusAnimatingRef.current) {
      isMarkerFocusAnimatingRef.current = false
      scheduleMarkerUpdate()
    }
  }, [scheduleMarkerUpdate])

  const focusMarkerGroup = useCallback(
    (groupKey: string) => {
      const scale = chartRef.current?.priceScale('right')
      const series = candlestickSeriesRef.current
      const start = scale?.getVisibleRange()
      const group = markerOverlayRef.current?.groups.find(group => group.key === groupKey)
      if (!scale || !series || !start || !group?.markers.length) return

      cancelMarkerFocus()
      const rangeSize = start.to - start.from
      if (!Number.isFinite(rangeSize) || rangeSize <= 0) return

      // Use the same pixel-gap clustering as the drawn labels, so repeated clicks visit lines rather
      // than individual orders. The order is high-to-low on the price axis and wraps at the end.
      const lines = clusterMarkers(
        group.markers.flatMap(marker => {
          const y = series.priceToCoordinate(marker.price)
          return y === null ? [] : [{ ...marker, y }]
        }),
        { minGap: MARKER_MIN_GAP_PX, maxClusters: Number.MAX_SAFE_INTEGER },
      ).sort((a, b) => b.price - a.price)
      if (!lines.length) return

      const previousIndex = markerFocusIndexRef.current.get(groupKey)
      const firstOffscreenIndex = lines.findIndex(line => line.price < start.from || line.price > start.to)
      const nextIndex =
        previousIndex === undefined
          ? firstOffscreenIndex >= 0
            ? firstOffscreenIndex
            : 0
          : (previousIndex + 1) % lines.length
      markerFocusIndexRef.current.set(groupKey, nextIndex)
      const focusCenter = lines[nextIndex].price

      // Preserve the current zoom level: every click only pans the price scale.
      let targetFrom = focusCenter - rangeSize / 2
      let targetTo = focusCenter + rangeSize / 2
      if (targetFrom < 0) {
        targetFrom = 0
        targetTo = rangeSize
      }
      const target = { from: targetFrom, to: targetTo }
      const duration = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : MARKER_FOCUS_DURATION_MS
      const startedAt = performance.now()
      isMarkerFocusAnimatingRef.current = true
      const animate = (now: number) => {
        const progress = duration ? Math.min((now - startedAt) / duration, 1) : 1
        const eased = 1 - (1 - progress) ** 3
        scale.setAutoScale(false)
        scale.setVisibleRange({
          from: start.from + (target.from - start.from) * eased,
          to: start.to + (target.to - start.to) * eased,
        })
        scheduleMarkerUpdate()
        if (progress < 1) {
          focusFrameRef.current = globalThis.requestAnimationFrame(animate)
        } else {
          focusFrameRef.current = 0
          isMarkerFocusAnimatingRef.current = false
          scheduleMarkerUpdate()
        }
      }
      focusFrameRef.current = globalThis.requestAnimationFrame(animate)
    },
    [cancelMarkerFocus, candlestickSeriesRef, chartRef, scheduleMarkerUpdate],
  )

  useEffect(() => {
    if (focusMarkerRequest) focusMarkerGroup(focusMarkerRequest.groupKey)
  }, [focusMarkerRequest, focusMarkerGroup])

  useEffect(() => {
    markerOverlayRef.current = markerOverlay
    cancelMarkerFocus()
    markerFocusIndexRef.current.clear()
    markerOffscreenCountsKeyRef.current = ''
    markerLineColorsRef.current = markerLineColors
    maxMarkerLinesRef.current = upToSmall ? MAX_MARKER_LINES_MOBILE : MAX_MARKER_LINES
    scheduleMarkerUpdate()
  }, [cancelMarkerFocus, markerLineColors, markerOverlay, scheduleMarkerUpdate, upToSmall])

  useEffect(() => {
    onOffscreenChangeRef.current = onOffscreenChange
  }, [onOffscreenChange])

  // The canvas calls this before destroying the chart, including React's effect replay.
  const disposeMarkers = useCallback(() => {
    globalThis.cancelAnimationFrame(markerFrameRef.current)
    globalThis.cancelAnimationFrame(focusFrameRef.current)
    markerFrameRef.current = 0
    focusFrameRef.current = 0
    isMarkerFocusAnimatingRef.current = false
    markerPriceLinesRef.current = []
    markerLinePricesKeyRef.current = ''
    markerLayoutKeyRef.current = ''
    markerOffscreenCountsKeyRef.current = ''
    markerFocusIndexRef.current.clear()
    onOffscreenChangeRef.current?.({})
  }, [])

  return { markerLayout, markerOverlayRef, scheduleMarkerUpdate, cancelMarkerFocus, disposeMarkers }
}

export default useTokenPriceChartMarkers
