import dayjs from 'dayjs'
import {
  type AutoscaleInfo,
  type AutoscaleInfoProvider,
  type CandlestickData,
  CrosshairMode,
  type HistogramData,
  type IPriceLine,
  type ISeriesApi,
  LineStyle,
  type LogicalRange,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
  createChart,
} from 'lightweight-charts'
import { type MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import { type TokenChartTimeFrame } from 'services/tokenChart'

import { Stack } from 'components/Stack'
import {
  type MarkerCluster,
  type PriceMarkerOverlay,
  clusterMarkers,
  positionMarkers,
} from 'components/TokenPriceChart/priceMarkers'
import useTheme from 'hooks/useTheme'
import { formatPrice, formatSignedPercent } from 'pages/Earns/PoolDetail/Information/utils'
import { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { hexAlpha } from 'utils/colorAlpha'
import { formatDisplayNumber } from 'utils/numbers'

export type DisplayCandle = {
  bucket: string
  changePercent?: number
  close: number
  high: number
  low: number
  open: number
  rangePercent?: number
  time: number
  transactions?: number
  volume: number
}

type TooltipState = {
  candle: DisplayCandle
  left: number
  top: number
}

type TokenPriceChartCanvasProps = {
  chartData: DisplayCandle[]
  canLoadMore?: boolean
  onLoadMore?: () => void
  timeFrame: TokenChartTimeFrame
  /** Formats prices in the candle tooltip; defaults to USD. */
  formatValue?: (value?: number) => string
  markerOverlay?: PriceMarkerOverlay
}

type MarkerLayout = { clusters: MarkerCluster[]; above: number; below: number; scaleWidth: number; paneHeight: number }

const DEFAULT_VISIBLE_CANDLES = 40
const LOAD_MORE_THRESHOLD = 20
/** Closest two marker lines may sit before they are drawn as one: about the height of their label. */
const MARKER_MIN_GAP_PX = 24
const MAX_MARKER_LINES = 6
const MAX_MARKER_LINES_MOBILE = 3
/** How long a marker's details stay open after the pointer leaves, so it can travel into them. */
const MARKER_DETAILS_CLOSE_DELAY_MS = 150
const EMPTY_MARKER_LAYOUT: MarkerLayout = { clusters: [], above: 0, below: 0, scaleWidth: 0, paneHeight: 0 }

const clusterKey = (cluster: MarkerCluster) => cluster.ids.join(',')

const getMarkerLayoutKey = (layout: MarkerLayout) =>
  [
    layout.clusters.map(cluster => `${clusterKey(cluster)}@${Math.round(cluster.y)}`).join('|'),
    layout.above,
    layout.below,
    layout.scaleWidth,
    layout.paneHeight,
  ].join(';')

const formatAxisTimeLabel = (timestamp: number, timeFrame: TokenChartTimeFrame) => {
  if (timeFrame === '1d' || timeFrame === '7d') {
    return dayjs.unix(timestamp).format('MMM D')
  }
  return dayjs.unix(timestamp).format('MMM D, HH:mm')
}

const formatTooltipDate = (timestamp: number, timeFrame: TokenChartTimeFrame) => {
  if (timeFrame === '7d') {
    return dayjs.unix(timestamp).format('MMM D, YYYY')
  }
  return dayjs.unix(timestamp).format('MMM D, YYYY, HH:mm')
}

const scheduleAfterNextPaint = (callback: () => void) => {
  let frameId = 0
  let nestedFrameId = 0

  frameId = globalThis.requestAnimationFrame(() => {
    nestedFrameId = globalThis.requestAnimationFrame(callback)
  })

  return () => {
    globalThis.cancelAnimationFrame(frameId)
    globalThis.cancelAnimationFrame(nestedFrameId)
  }
}

const getPriceScaleConfig = (chartData: DisplayCandle[]) => {
  const minPrice = Math.min(...chartData.map(candle => candle.open)) || 0.1

  const precision =
    minPrice < 1e-8 ? 12 : minPrice < 1e-6 ? 10 : minPrice < 1e-4 ? 8 : minPrice < 1e-2 ? 6 : minPrice < 1 ? 4 : 2
  const minMove = 10 ** -precision

  return {
    minMove,
    precision,
  }
}

const getVisibleCandles = (chartData: DisplayCandle[], visibleLogicalRange: LogicalRange | null) => {
  if (!visibleLogicalRange) {
    return chartData.slice(Math.max(chartData.length - DEFAULT_VISIBLE_CANDLES, 0))
  }

  return chartData.slice(
    Math.max(Math.floor(visibleLogicalRange.from), 0),
    Math.min(Math.ceil(visibleLogicalRange.to) + 1, chartData.length),
  )
}

const getRobustAutoscaleInfo = (candles: DisplayCandle[], baseInfo: AutoscaleInfo | null): AutoscaleInfo | null => {
  if (!baseInfo || candles.length < 8) return baseInfo

  const bodyPrices = candles.flatMap(candle => [candle.open, candle.close]).filter(Number.isFinite)
  const wickPrices = candles.flatMap(candle => [candle.high, candle.low]).filter(Number.isFinite)

  if (!bodyPrices.length || wickPrices.length < 8) return baseInfo

  const bodyMin = Math.min(...bodyPrices)
  const bodyMax = Math.max(...bodyPrices)
  const bodyMid = (bodyMin + bodyMax) / 2
  const bodyPadding = Math.max((bodyMax - bodyMin) * 0.45, bodyMid * 0.02)
  const visibleMin = bodyMin - bodyPadding
  const visibleMax = bodyMax + bodyPadding
  const includedWickPrices = wickPrices.filter(price => price >= visibleMin && price <= visibleMax)
  const minValue = Math.min(bodyMin, ...includedWickPrices) - bodyPadding * 0.2
  const maxValue = Math.max(bodyMax, ...includedWickPrices) + bodyPadding * 0.2

  if (minValue <= 0 || minValue >= maxValue) return baseInfo

  return {
    ...baseInfo,
    priceRange: {
      minValue,
      maxValue,
    },
  }
}

const createRobustAutoscaleInfoProvider = ({
  chartDataRef,
  getPinnedPrice,
  getVisibleLogicalRange,
}: {
  chartDataRef: MutableRefObject<DisplayCandle[]>
  /** A price the scale always keeps in view, so its line never leaves the pane. */
  getPinnedPrice: () => number | undefined
  getVisibleLogicalRange: () => LogicalRange | null
}): AutoscaleInfoProvider => {
  return baseImplementation => {
    const info = getRobustAutoscaleInfo(
      getVisibleCandles(chartDataRef.current, getVisibleLogicalRange()),
      baseImplementation(),
    )
    const pinned = getPinnedPrice()
    if (!info?.priceRange || pinned === undefined || !Number.isFinite(pinned)) return info

    return {
      ...info,
      priceRange: {
        minValue: Math.min(info.priceRange.minValue, pinned),
        maxValue: Math.max(info.priceRange.maxValue, pinned),
      },
    }
  }
}

const getUnixTimestampFromChartTime = (time: Time) => {
  if (typeof time === 'number') return time
  if (typeof time === 'string') return Math.floor(Date.parse(`${time}T00:00:00Z`) / 1000)

  return Math.floor(Date.UTC(time.year, time.month - 1, time.day) / 1000)
}

// Axis labels carry subscript digits (0.0₅28…) and Work Sans has no glyph for them, so the chart needs
// the same symbol face the DOM uses — canvas text resolves its own font list, not the CSS stack.
const SYMBOL_FONT = 'Inter Symbols'
const CHART_FONT_FAMILY = `'Work Sans', '${SYMBOL_FONT}', sans-serif`

const getChartOptions = ({
  chartHeight,
  crosshairColor,
  gridColor,
  subTextColor,
  timeFrame,
}: {
  chartHeight: number
  crosshairColor: string
  gridColor: string
  subTextColor: string
  timeFrame: TokenChartTimeFrame
}) => ({
  height: chartHeight,
  layout: {
    background: { color: 'transparent' },
    fontFamily: CHART_FONT_FAMILY,
    textColor: subTextColor,
  },
  grid: {
    vertLines: { color: gridColor },
    horzLines: { color: gridColor },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: {
      color: crosshairColor,
      labelVisible: false,
      style: LineStyle.Dashed,
    },
    horzLine: {
      color: crosshairColor,
      labelVisible: true,
      style: LineStyle.Dashed,
    },
  },
  rightPriceScale: {
    borderVisible: false,
    drawTicks: false,
    entireTextOnly: true,
    scaleMargins: {
      top: 0.08,
      bottom: 0.22,
    },
  },
  timeScale: {
    borderVisible: false,
    tickMarkFormatter: (time: number) => formatAxisTimeLabel(time, timeFrame),
    timeVisible: timeFrame !== '7d',
  },
  localization: {
    priceFormatter: (value: number) => formatDisplayNumber(value, { fractionDigits: 4, fallback: '' }),
  },
})

const getCandlestickSeriesOptions = ({
  downCandleColor,
  priceMinMove,
  pricePrecision,
  showLastValue,
  upCandleColor,
}: {
  downCandleColor: string
  priceMinMove: number
  pricePrecision: number
  showLastValue: boolean
  upCandleColor: string
}) => ({
  upColor: upCandleColor,
  downColor: downCandleColor,
  borderUpColor: upCandleColor,
  borderDownColor: downCandleColor,
  wickUpColor: upCandleColor,
  wickDownColor: downCandleColor,
  priceFormat: {
    type: 'price' as const,
    minMove: priceMinMove,
    precision: pricePrecision,
  },
  priceLineColor: upCandleColor,
  priceLineStyle: LineStyle.Dashed,
  priceLineVisible: showLastValue,
  lastValueVisible: showLastValue,
})

const getTooltipPosition = ({
  chartHeight,
  containerWidth,
  pointX,
  pointY,
}: {
  chartHeight: number
  containerWidth: number
  pointX: number
  pointY: number
}) => {
  const tooltipWidth = 220
  const tooltipHeight = 210
  const tooltipEdgePadding = 12
  const tooltipLeftOffset = 12
  const tooltipRightOffset = tooltipLeftOffset + 4
  const tooltipTopOffset = 12

  const cursorLeft = pointX
  const frameWidth = containerWidth
  const isLeftHalf = pointX < containerWidth / 2

  const left = Math.min(
    Math.max(
      isLeftHalf ? cursorLeft + tooltipRightOffset : cursorLeft - tooltipWidth - tooltipLeftOffset,
      tooltipEdgePadding,
    ),
    frameWidth - tooltipWidth - tooltipEdgePadding,
  )
  const top = Math.min(
    Math.max(pointY + tooltipTopOffset, tooltipEdgePadding),
    chartHeight - tooltipHeight - tooltipEdgePadding,
  )

  return { left, top }
}

const PriceChartTooltip = ({
  formatValue,
  timeFrame,
  tooltip,
}: {
  formatValue: (value?: number) => string
  timeFrame: TokenChartTimeFrame
  tooltip: TooltipState
}) => {
  const theme = useTheme()
  const { candle, left, top } = tooltip
  const priceChange = candle.changePercent ?? (candle.open ? ((candle.close - candle.open) / candle.open) * 100 : 0)
  const priceRange = candle.rangePercent ?? (candle.low ? ((candle.high - candle.low) / candle.low) * 100 : 0)

  return (
    <Stack
      className="pointer-events-none absolute z-[4] min-w-[220px] gap-3 rounded-xl border border-border bg-tableHeader/80 px-4 py-3"
      style={{ left, top, boxShadow: `0 12px 32px ${theme.shadow}` }}
    >
      <span className="text-xs text-subText">{formatTooltipDate(candle.time, timeFrame)}</span>

      <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2">
        <span className="text-xs text-subText">Open</span>
        <span className="text-right text-xs font-medium text-text">{formatValue(candle.open)}</span>

        <span className="text-xs text-subText">High</span>
        <span className="text-right text-xs font-medium text-text">{formatValue(candle.high)}</span>

        <span className="text-xs text-subText">Low</span>
        <span className="text-right text-xs font-medium text-text">{formatValue(candle.low)}</span>

        <span className="text-xs text-subText">Close</span>
        <span className="text-right text-xs font-medium text-text">{formatValue(candle.close)}</span>

        <span className="text-xs text-subText">%Change</span>
        <span
          className="text-right text-xs font-medium"
          style={{ color: priceChange >= 0 ? theme.primary : theme.red }}
        >
          {formatSignedPercent(priceChange)}
        </span>

        <span className="text-xs text-subText">Range</span>
        <span className="text-right text-xs font-medium text-text">
          {formatSignedPercent(priceRange).replace(/^\+/, '')}
        </span>

        {candle.volume > 0 && (
          <>
            <span className="text-xs text-subText">Vol</span>
            <span className="text-right text-xs font-medium text-text">
              {formatDisplayNumber(candle.volume, { significantDigits: 4 })}
            </span>
          </>
        )}

        {candle.transactions !== undefined ? (
          <>
            <span className="text-xs text-subText">Transactions</span>
            <span className="text-right text-xs font-medium text-text">
              {formatDisplayNumber(candle.transactions, { significantDigits: 4 })}
            </span>
          </>
        ) : null}
      </div>
    </Stack>
  )
}

/**
 * The tags and details drawn over the marker lines. The lines themselves are price lines on the
 * series; this layer only adds what a canvas line cannot carry — a label on the line, details on
 * hover or tap, and counts for markers outside the visible price range.
 */
const PriceMarkerLayer = ({
  chartHeight,
  layout,
  overlay,
}: {
  chartHeight: number
  layout: MarkerLayout
  overlay: PriceMarkerOverlay
}) => {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  // A tap has no "leave" to close on, so a press anywhere outside the labels and details closes them.
  useEffect(() => {
    if (!openKey) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-price-marker-layer]')) setOpenKey(null)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [openKey])

  const open = (key: string) => {
    clearTimeout(closeTimerRef.current)
    setOpenKey(key)
  }
  const scheduleClose = () => {
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => setOpenKey(null), MARKER_DETAILS_CLOSE_DELAY_MS)
  }

  const right = layout.scaleWidth + 8
  // A group can dissolve under an open panel when zooming splits it; the panel goes with it.
  const openCluster = layout.clusters.find(cluster => clusterKey(cluster) === openKey)
  const spaceBelow = openCluster ? layout.paneHeight - openCluster.y - DETAILS_OFFSET_PX - DETAILS_EDGE_PX : 0
  const spaceAbove = openCluster ? openCluster.y - DETAILS_OFFSET_PX - DETAILS_EDGE_PX : 0
  // The chart card clips its overflow, so the panel opens toward the larger space and scrolls inside it.
  const opensBelow = spaceBelow >= spaceAbove

  return (
    <>
      {layout.clusters.map(cluster => {
        const key = clusterKey(cluster)
        const count = cluster.ids.length
        return (
          <button
            key={key}
            type="button"
            data-testid="price-marker-label"
            data-marker-count={count}
            onMouseEnter={() => open(key)}
            onMouseLeave={scheduleClose}
            onFocus={() => open(key)}
            onClick={() => open(key)}
            data-price-marker-layer
            className="absolute z-[2] flex -translate-y-1/2 cursor-pointer items-center gap-1 rounded border border-warning bg-buttonBlack px-1.5 py-0.5 text-[10px] font-medium leading-[14px]"
            style={{ top: cluster.y, right }}
          >
            <span className="text-subText">{overlay.label}</span>
            <span className="text-warning">
              {count > 1 ? `×${count}` : formatDisplayNumber(cluster.price, { significantDigits: 6 })}
            </span>
          </button>
        )
      })}

      {openCluster && (
        <div
          data-testid="price-marker-details"
          data-price-marker-layer
          onMouseEnter={() => open(clusterKey(openCluster))}
          onMouseLeave={scheduleClose}
          className="absolute z-[3] overflow-y-auto rounded-xl border border-border bg-tableHeader px-3 py-2.5 shadow-lg"
          style={{
            right,
            maxHeight: Math.max(opensBelow ? spaceBelow : spaceAbove, 0),
            ...(opensBelow
              ? { top: openCluster.y + DETAILS_OFFSET_PX }
              : { bottom: chartHeight - openCluster.y + DETAILS_OFFSET_PX }),
          }}
        >
          {overlay.renderDetails(openCluster.ids)}
        </div>
      )}

      {layout.above > 0 && (
        <span data-testid="price-marker-offscreen-above" className={cn(OFFSCREEN_BADGE_CLASS, 'top-1.5')}>
          ↑ {overlay.renderOffscreen(layout.above, 'above')}
        </span>
      )}
      {layout.below > 0 && (
        <span
          data-testid="price-marker-offscreen-below"
          className={OFFSCREEN_BADGE_CLASS}
          style={{ top: layout.paneHeight - 26 }}
        >
          ↓ {overlay.renderOffscreen(layout.below, 'below')}
        </span>
      )}
    </>
  )
}

// On the left edge, clear of the line labels that sit against the price axis.
/** Gap between a line's label and its details panel, and between the panel and the pane edge. */
const DETAILS_OFFSET_PX = 14
const DETAILS_EDGE_PX = 8

const OFFSCREEN_BADGE_CLASS =
  'pointer-events-none absolute left-2 z-[2] rounded-full border border-warning/40 bg-buttonBlack px-2 py-0.5 text-[10px] font-medium text-warning'

const TokenPriceChartCanvas = ({
  chartData,
  canLoadMore = false,
  onLoadMore,
  timeFrame,
  formatValue = formatPrice,
  markerOverlay,
}: TokenPriceChartCanvasProps) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360
  const gridColor = hexAlpha(theme.text, 0.06)
  const crosshairColor = hexAlpha(theme.text, 0.12)
  const upCandleColor = theme.primary
  const downCandleColor = theme.red
  const volumeUpColor = hexAlpha(theme.darkGreen, 0.8)
  const volumeDownColor = hexAlpha(theme.red, 0.5)
  const priceScaleConfig = useMemo(() => getPriceScaleConfig(chartData), [chartData])
  const subTextColor = theme.subText
  const chartOptions = useMemo(
    () =>
      getChartOptions({
        chartHeight,
        crosshairColor,
        gridColor,
        subTextColor,
        timeFrame,
      }),
    [chartHeight, crosshairColor, gridColor, subTextColor, timeFrame],
  )
  const referencePrice = markerOverlay?.referencePrice
  // The reference line replaces the last candle's tag; two "current" prices from two sources would
  // only leave the reader guessing which one the markers answer to.
  const showLastValue = referencePrice === undefined
  const candlestickSeriesOptions = useMemo(
    () =>
      getCandlestickSeriesOptions({
        downCandleColor,
        priceMinMove: priceScaleConfig.minMove,
        pricePrecision: priceScaleConfig.precision,
        showLastValue,
        upCandleColor,
      }),
    [downCandleColor, priceScaleConfig.minMove, priceScaleConfig.precision, showLastValue, upCandleColor],
  )
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const chartDataRef = useRef(chartData)
  const chartDataByTimeRef = useRef<Map<number, DisplayCandle>>(new Map())
  const chartHeightRef = useRef(chartHeight)
  const initialChartOptionsRef = useRef(chartOptions)
  const initialCandlestickSeriesOptionsRef = useRef(candlestickSeriesOptions)
  const hasInitializedViewRef = useRef(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [isViewportReady, setIsViewportReady] = useState(false)

  const markerOverlayRef = useRef(markerOverlay)
  const markerColorRef = useRef(theme.warning)
  const maxMarkerLinesRef = useRef(MAX_MARKER_LINES)
  const markerPriceLinesRef = useRef<IPriceLine[]>([])
  const referenceLineRef = useRef<IPriceLine | null>(null)
  const markerLinePricesKeyRef = useRef('')
  const markerLayoutKeyRef = useRef(getMarkerLayoutKey(EMPTY_MARKER_LAYOUT))
  const markerFrameRef = useRef(0)
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

      const markers = markerOverlayRef.current?.markers ?? []
      const paneHeight = chartHeightRef.current - chart.timeScale().height()
      const { visible, above, below } = positionMarkers(markers, price => series.priceToCoordinate(price), paneHeight)
      const clusters = clusterMarkers(visible, { minGap: MARKER_MIN_GAP_PX, maxClusters: maxMarkerLinesRef.current })

      // Lines are only rebuilt when the set of drawn prices changes, not on every scroll frame.
      const linePricesKey = clusters.map(cluster => cluster.price).join(',') + `|${markerColorRef.current}`
      if (linePricesKey !== markerLinePricesKeyRef.current) {
        markerLinePricesKeyRef.current = linePricesKey
        markerPriceLinesRef.current.forEach(line => series.removePriceLine(line))
        markerPriceLinesRef.current = clusters.map(cluster =>
          series.createPriceLine({
            price: cluster.price,
            color: markerColorRef.current,
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            lineVisible: true,
            axisLabelVisible: true,
            title: '',
          }),
        )
      }

      const layout = { clusters, above, below, scaleWidth: chart.priceScale('right').width(), paneHeight }
      const layoutKey = getMarkerLayoutKey(layout)
      if (layoutKey === markerLayoutKeyRef.current) return
      markerLayoutKeyRef.current = layoutKey
      setMarkerLayout(layout)
    })
  }, [])

  useEffect(() => {
    chartDataRef.current = chartData
    chartDataByTimeRef.current = new Map(chartData.map(candle => [candle.time, candle]))
  }, [chartData])

  useEffect(() => {
    markerOverlayRef.current = markerOverlay
    markerColorRef.current = theme.warning
    maxMarkerLinesRef.current = upToSmall ? MAX_MARKER_LINES_MOBILE : MAX_MARKER_LINES
    scheduleMarkerUpdate()
  }, [markerOverlay, theme.warning, upToSmall, scheduleMarkerUpdate])

  useEffect(() => {
    chartHeightRef.current = chartHeight
  }, [chartHeight])

  useEffect(() => {
    const container = chartContainerRef.current

    if (!container) return

    const chart = createChart(container, {
      width: container.clientWidth,
      ...initialChartOptionsRef.current,
    })
    chartRef.current = chart

    const candlestickSeries = chart.addCandlestickSeries(initialCandlestickSeriesOptionsRef.current)
    candlestickSeries.applyOptions({
      autoscaleInfoProvider: createRobustAutoscaleInfoProvider({
        chartDataRef,
        // The reference price replaces the last candle's tag, so it has to stay on the pane. Marker
        // prices are left out: a stop far below the market would flatten every candle.
        getPinnedPrice: () => markerOverlayRef.current?.referencePrice,
        getVisibleLogicalRange: () => chart.timeScale().getVisibleLogicalRange(),
      }),
    })

    const volumeSeries = chart.addHistogramSeries({
      lastValueVisible: false,
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    candlestickSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries

    chart.priceScale('volume').applyOptions({
      borderVisible: false,
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
      visible: false,
    })

    const handleCrosshairMove = (param: MouseEventParams) => {
      if (!param.point || !param.time) {
        setTooltip(null)
        return
      }

      const hoveredTimestamp = getUnixTimestampFromChartTime(param.time)
      const hoveredCandle = chartDataByTimeRef.current.get(hoveredTimestamp)

      if (!hoveredCandle) {
        setTooltip(null)
        return
      }

      setTooltip({
        candle: hoveredCandle,
        ...getTooltipPosition({
          chartHeight: chartHeightRef.current,
          containerWidth: container.clientWidth,
          pointX: param.point.x,
          pointY: param.point.y,
        }),
      })
    }

    chart.subscribeCrosshairMove(handleCrosshairMove)
    chart.timeScale().subscribeVisibleLogicalRangeChange(scheduleMarkerUpdate)

    // Dragging the price axis rescales without any chart event, so follow the pointer while it drags.
    const handlePointerMove = (event: PointerEvent) => {
      if (event.buttons) scheduleMarkerUpdate()
    }
    container.addEventListener('pointermove', handlePointerMove)

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0]

      if (!entry) return

      chart.resize(entry.contentRect.width, chartHeightRef.current)
      scheduleMarkerUpdate()
    })

    resizeObserver.observe(container)

    return () => {
      setTooltip(null)
      resizeObserver.disconnect()
      container.removeEventListener('pointermove', handlePointerMove)
      chart.unsubscribeCrosshairMove(handleCrosshairMove)
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(scheduleMarkerUpdate)
      globalThis.cancelAnimationFrame(markerFrameRef.current)
      markerFrameRef.current = 0
      markerPriceLinesRef.current = []
      markerLinePricesKeyRef.current = ''
      referenceLineRef.current = null
      chartRef.current = null
      candlestickSeriesRef.current = null
      volumeSeriesRef.current = null
      chart.remove()
    }
  }, [scheduleMarkerUpdate])

  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || !canLoadMore || !onLoadMore) return

    const timeScale = chartRef.current.timeScale()
    const candlestickSeries = candlestickSeriesRef.current

    const handleVisibleLogicalRangeChange = (range: { from: number; to: number } | null) => {
      if (!range) return

      const barsInfo = candlestickSeries.barsInLogicalRange(range)
      if (!barsInfo || barsInfo.barsBefore == null || barsInfo.barsBefore > LOAD_MORE_THRESHOLD) return

      onLoadMore()
    }

    timeScale.subscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange)

    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange)
    }
  }, [canLoadMore, onLoadMore])

  useEffect(() => {
    if (!chartRef.current) return

    chartRef.current.applyOptions(chartOptions)
    chartRef.current.priceScale('volume').applyOptions({
      borderVisible: false,
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
      visible: false,
    })
    candlestickSeriesRef.current?.applyOptions(candlestickSeriesOptions)
  }, [candlestickSeriesOptions, chartOptions])

  useEffect(() => {
    const series = candlestickSeriesRef.current
    if (!series) return

    if (referencePrice === undefined) {
      if (referenceLineRef.current) series.removePriceLine(referenceLineRef.current)
      referenceLineRef.current = null
      return
    }

    const options = { price: referencePrice, color: theme.primary }
    if (referenceLineRef.current) {
      referenceLineRef.current.applyOptions(options)
      return
    }
    referenceLineRef.current = series.createPriceLine({
      ...options,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      lineVisible: true,
      axisLabelVisible: true,
      title: '',
    })
  }, [referencePrice, theme.primary])

  // Drawing to a canvas neither pulls a webfont in nor repaints once one arrives, so request the symbol
  // face directly and redraw when it lands. Without this the labels can keep the system fallback's
  // subscript digits, which sit below the baseline at a fraction of the size.
  useEffect(() => {
    let cancelled = false

    document.fonts.load(`12px '${SYMBOL_FONT}'`, '₀').then(() => {
      if (!cancelled) chartRef.current?.applyOptions(chartOptions)
    })

    return () => {
      cancelled = true
    }
  }, [chartOptions])

  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current) return

    const candlestickData: CandlestickData[] = chartData.map(candle => ({
      time: candle.time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }))
    const volumeData: HistogramData[] = chartData.map(candle => ({
      time: candle.time as UTCTimestamp,
      value: candle.volume,
      color: candle.close >= candle.open ? volumeUpColor : volumeDownColor,
    }))

    candlestickSeriesRef.current.setData(candlestickData)
    volumeSeriesRef.current.setData(volumeData)
    scheduleMarkerUpdate()

    if (!chartData.length || hasInitializedViewRef.current) return

    return scheduleAfterNextPaint(() => {
      if (!chartRef.current || hasInitializedViewRef.current) return

      const lastCandleIndex = chartData.length - 1
      const visibleCandleCount = Math.min(chartData.length, DEFAULT_VISIBLE_CANDLES)
      const sidePadding = (DEFAULT_VISIBLE_CANDLES - visibleCandleCount) / 2
      chartRef.current.timeScale().setVisibleLogicalRange({
        from: Math.max(lastCandleIndex - (DEFAULT_VISIBLE_CANDLES - 1), 0) - sidePadding,
        to: lastCandleIndex + sidePadding + 0.5,
      })
      hasInitializedViewRef.current = true
      setIsViewportReady(true)
      scheduleMarkerUpdate()
    })
  }, [chartData, scheduleMarkerUpdate, volumeDownColor, volumeUpColor])

  return (
    <div className="relative w-full" style={{ height: `${chartHeight}px` }}>
      {tooltip && isViewportReady ? (
        <PriceChartTooltip formatValue={formatValue} timeFrame={timeFrame} tooltip={tooltip} />
      ) : null}
      <PoolChartWrapper
        height={chartHeight}
        ref={chartContainerRef}
        style={{ visibility: isViewportReady ? 'visible' : 'hidden' }}
      />
      {markerOverlay && isViewportReady ? (
        <PriceMarkerLayer chartHeight={chartHeight} layout={markerLayout} overlay={markerOverlay} />
      ) : null}
    </div>
  )
}

export default TokenPriceChartCanvas
