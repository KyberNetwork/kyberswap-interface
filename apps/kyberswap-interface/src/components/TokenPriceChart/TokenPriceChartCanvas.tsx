import dayjs from 'dayjs'
import {
  type AutoscaleInfo,
  type AutoscaleInfoProvider,
  type CandlestickData,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  type HistogramData,
  HistogramSeries,
  type IPriceLine,
  type ISeriesApi,
  LineStyle,
  type LogicalRange,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
  createChart,
} from 'lightweight-charts'
import {
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useMedia } from 'react-use'
import { type TokenChartTimeFrame } from 'services/tokenChart'

import { ScrollIndicator } from 'components/DropdownMenu/styles'
import { Stack } from 'components/Stack'
import {
  type MarkerTone,
  type PlacedMarkerCluster,
  type PriceMarkerGroup,
  type PriceMarkerOverlay,
  clusterMarkers,
  clusterMarkersByGroup,
  countMarkersByGroup,
  findSharedLines,
  flattenMarkerGroups,
  getCrossingArrow,
  placeMarkerLabels,
  positionMarkers,
  splitMarkerIdsByGroup,
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
  focusMarkerRequest?: { groupKey: string; nonce: number }
  chartData: DisplayCandle[]
  canLoadMore?: boolean
  onLoadMore?: () => void
  timeFrame: TokenChartTimeFrame
  /** Formats prices in the candle tooltip; defaults to USD. */
  formatValue?: (value?: number) => string
  markerOverlay?: PriceMarkerOverlay
  /** Told, by group key, how many markers sit outside the visible price range whenever that changes. */
  onOffscreenChange?: (counts: Record<string, number>) => void
}

/** Lines of different kinds on one pixel row, drawn as one line in their colours by turns. */
type SharedMarkerLine = { y: number; colors: string[] }

type MarkerLayout = {
  clusters: PlacedMarkerCluster[]
  sharedLines: SharedMarkerLine[]
  aboveIds: string[]
  belowIds: string[]
  scaleWidth: number
  paneHeight: number
}

const DEFAULT_VISIBLE_CANDLES = 40
const LOAD_MORE_THRESHOLD = 20
/** Closest two lines of one kind may sit before they are drawn as one: about the height of their label. */
const MARKER_MIN_GAP_PX = 24
/** A label's box; labels of different kinds closer than this go side by side rather than on top of each other. */
const MARKER_LABEL_HEIGHT_PX = 22
/** Between two labels sitting side by side. */
const MARKER_LABEL_GAP_PX = 4
/** Stands in for a label's width until it has been measured. */
const MARKER_LABEL_FALLBACK_WIDTH_PX = 72
const MAX_MARKER_LINES = 6
const MAX_MARKER_LINES_MOBILE = 3
/** How long a marker's details stay open after the pointer leaves, so it can travel into them. */
const MARKER_DETAILS_CLOSE_DELAY_MS = 150
/** Slower pan so the next focused line remains trackable while the pair is being inspected. */
const MARKER_FOCUS_DURATION_MS = 400
/** Each colour's dash on a shared line, and the gap after it. */
const SHARED_LINE_DASH_PX = 6
const SHARED_LINE_GAP_PX = 3
const EMPTY_MARKER_LAYOUT: MarkerLayout = {
  clusters: [],
  sharedLines: [],
  aboveIds: [],
  belowIds: [],
  scaleWidth: 0,
  paneHeight: 0,
}

const TONE_CLASSES: Record<MarkerTone, { tag: string; value: string }> = {
  warning: { tag: 'border-warning', value: 'text-warning' },
  blue: { tag: 'border-blue', value: 'text-blue' },
}

/** The group a line belongs to; every line comes from one of the overlay's groups. */
const getClusterGroup = (cluster: PlacedMarkerCluster, groups: PriceMarkerGroup[]) =>
  groups.find(group => group.key === cluster.groupKey) ?? groups[0]

const clusterKey = (cluster: PlacedMarkerCluster) => cluster.ids.join(',')

const getMarkerLayoutKey = (layout: MarkerLayout) =>
  [
    layout.clusters.map(cluster => `${clusterKey(cluster)}@${Math.round(cluster.y)}#${cluster.column}`).join('|'),
    layout.sharedLines.map(line => `${Math.round(line.y)}:${line.colors.join('/')}`).join('|'),
    layout.aboveIds.join(','),
    layout.belowIds.join(','),
    layout.scaleWidth,
    layout.paneHeight,
  ].join(';')

/** A dashed line that gives each colour a dash in turn. */
const getSharedLineBackground = (colors: string[]) => {
  const step = SHARED_LINE_DASH_PX + SHARED_LINE_GAP_PX
  const stops = colors.map((color, index) => {
    const start = index * step
    const dashEnd = start + SHARED_LINE_DASH_PX
    return `${color} ${start}px ${dashEnd}px, transparent ${dashEnd}px ${start + step}px`
  })
  return `repeating-linear-gradient(90deg, ${stops.join(', ')})`
}

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
    background: { type: ColorType.Solid as const, color: 'transparent' },
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
    ticksVisible: false,
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
 * The details panel's list, with arrows at its ends when there is more to scroll to — the same hint
 * the dropdown menus give, so a cut-off list reads as a list rather than as everything there is.
 */
const MarkerDetailsList = ({ children, contentKey }: { children: ReactNode; contentKey: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const updateScrollIndicators = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollUp(el.scrollTop > 0)
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1)
  }, [])

  // Measured after layout, and again whenever the panel switches to another group of lines.
  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollIndicators)
    return () => cancelAnimationFrame(frame)
  }, [contentKey, updateScrollIndicators])

  const scrollBy = (direction: 'up' | 'down') =>
    scrollRef.current?.scrollBy({ top: direction === 'up' ? -100 : 100, behavior: 'smooth' })

  return (
    <>
      <ScrollIndicator
        $visible={canScrollUp}
        onClick={() => scrollBy('up')}
        data-testid="price-marker-details-scroll-up"
      >
        <ChevronUp size={16} />
      </ScrollIndicator>
      <div ref={scrollRef} onScroll={updateScrollIndicators} className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
      <ScrollIndicator
        $visible={canScrollDown}
        onClick={() => scrollBy('down')}
        data-testid="price-marker-details-scroll-down"
      >
        <ChevronDown size={16} />
      </ScrollIndicator>
    </>
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
  const [openMarker, setOpenMarker] = useState<{ key: string; pinned: boolean } | null>(null)
  const openKey = openMarker?.key
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Labels are measured once drawn: a label pushed into the next column sits past the one it would cover.
  const labelRefs = useRef(new Map<string, HTMLButtonElement | null>())
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({})

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  useEffect(() => {
    setOpenMarker(current =>
      current && !layout.clusters.some(cluster => clusterKey(cluster) === current.key) ? null : current,
    )
  }, [layout.clusters])

  useLayoutEffect(() => {
    const next: Record<string, number> = {}
    layout.clusters.forEach(cluster => {
      const el = labelRefs.current.get(clusterKey(cluster))
      if (el) next[clusterKey(cluster)] = el.offsetWidth
    })
    const keys = Object.keys(next)
    if (keys.length !== Object.keys(labelWidths).length || keys.some(key => labelWidths[key] !== next[key])) {
      setLabelWidths(next)
    }
  }, [layout, labelWidths])

  // Clicked labels keep their details open until dismissed or another label is clicked.
  useEffect(() => {
    if (!openKey) return
    const close = () => {
      clearTimeout(closeTimerRef.current)
      setOpenMarker(null)
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-price-marker-layer]')) close()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openKey])

  const open = (key: string) => {
    clearTimeout(closeTimerRef.current)
    setOpenMarker(current => (current?.pinned ? current : { key, pinned: false }))
  }
  const togglePinned = (key: string) => {
    clearTimeout(closeTimerRef.current)
    setOpenMarker(current => (current?.key === key && current.pinned ? null : { key, pinned: true }))
  }
  const scheduleClose = () => {
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(
      () => setOpenMarker(current => (current?.pinned ? current : null)),
      MARKER_DETAILS_CLOSE_DELAY_MS,
    )
  }

  const right = layout.scaleWidth + 8
  const markers = useMemo(() => flattenMarkerGroups(overlay.groups), [overlay.groups])
  /** How far left of the axis a label sits: past every label it would otherwise cover. */
  const getLabelOffset = (cluster: PlacedMarkerCluster): number => {
    if (cluster.column === 0) return 0
    const covered = layout.clusters.find(
      other => other.column === cluster.column - 1 && Math.abs(other.y - cluster.y) < MARKER_LABEL_HEIGHT_PX,
    )
    if (!covered) return 0
    const width = labelWidths[clusterKey(covered)] ?? MARKER_LABEL_FALLBACK_WIDTH_PX
    return getLabelOffset(covered) + width + MARKER_LABEL_GAP_PX
  }
  // A group can dissolve under an open panel when zooming splits it; the panel goes with it.
  const openCluster = layout.clusters.find(cluster => clusterKey(cluster) === openKey)
  const spaceBelow = openCluster ? layout.paneHeight - openCluster.y - DETAILS_OFFSET_PX - DETAILS_EDGE_PX : 0
  const spaceAbove = openCluster ? openCluster.y - DETAILS_OFFSET_PX - DETAILS_EDGE_PX : 0
  // The chart card clips its overflow, so the panel opens toward the larger space and scrolls inside it.
  const opensBelow = spaceBelow >= spaceAbove

  return (
    <>
      {layout.sharedLines.map(line => (
        <div
          key={`${Math.round(line.y)}:${line.colors.join('/')}`}
          aria-hidden="true"
          data-testid="price-marker-shared-line"
          className="pointer-events-none absolute left-0 h-px -translate-y-1/2"
          style={{ top: line.y, right: layout.scaleWidth, backgroundImage: getSharedLineBackground(line.colors) }}
        />
      ))}
      {layout.clusters.map(cluster => {
        const key = clusterKey(cluster)
        const count = cluster.ids.length
        const group = getClusterGroup(cluster, overlay.groups)
        const tone = TONE_CLASSES[group.tone]
        const isPinned = openKey === key && openMarker?.pinned
        return (
          <button
            key={key}
            ref={el => {
              labelRefs.current.set(key, el)
            }}
            type="button"
            data-testid="price-marker-label"
            data-marker-group={group.key}
            data-marker-count={count}
            data-marker-column={cluster.column}
            onMouseEnter={() => open(key)}
            onMouseLeave={scheduleClose}
            onFocus={() => open(key)}
            onClick={() => togglePinned(key)}
            aria-expanded={openKey === key}
            data-active={isPinned}
            data-price-marker-layer
            className={cn(
              'absolute z-[2] flex -translate-y-1/2 cursor-pointer items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-[14px] transition-colors',
              tone.tag,
              isPinned ? 'bg-tableHeader' : 'bg-buttonBlack hover:bg-buttonGray focus-visible:bg-buttonGray',
            )}
            style={{ top: cluster.y, right: right + getLabelOffset(cluster) }}
          >
            <span className="text-subText">
              {group.label} {getCrossingArrow(cluster.ids, markers)}
            </span>
            <span className={tone.value}>
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
          // Grows out of the pill it belongs to, from whichever side it opens on.
          className={cn(
            'absolute z-[3] flex flex-col overflow-hidden rounded-xl border border-border bg-tableHeader shadow-lg motion-reduce:animate-none',
            opensBelow ? 'origin-top-right animate-dropdownIn' : 'origin-bottom-right animate-dropupIn',
          )}
          style={{
            right: right + getLabelOffset(openCluster),
            maxHeight: Math.max(opensBelow ? spaceBelow : spaceAbove, 0),
            ...(opensBelow
              ? { top: openCluster.y + DETAILS_OFFSET_PX }
              : { bottom: chartHeight - openCluster.y + DETAILS_OFFSET_PX }),
          }}
        >
          <MarkerDetailsList contentKey={clusterKey(openCluster)}>
            <Stack className="gap-0">
              {splitMarkerIdsByGroup(openCluster.ids, overlay.groups).map((entry, index) => (
                <div key={entry.group.key} className={cn(index > 0 && 'border-t border-border')}>
                  {entry.group.renderDetails(entry.ids)}
                </div>
              ))}
            </Stack>
          </MarkerDetailsList>
        </div>
      )}
    </>
  )
}

/** Gap between a line's label and its details panel, and between the panel and the pane edge. */
const DETAILS_OFFSET_PX = 14
const DETAILS_EDGE_PX = 8

const TokenPriceChartCanvas = ({
  focusMarkerRequest,
  chartData,
  canLoadMore = false,
  onLoadMore,
  timeFrame,
  formatValue = formatPrice,
  markerOverlay,
  onOffscreenChange,
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
  const onOffscreenChangeRef = useRef(onOffscreenChange)
  // lightweight-charts also uses a price line's color as the right-axis label background.
  const markerLineColorsRef = useRef<Record<MarkerTone, string>>({
    warning: theme.darkOrange,
    blue: theme.darkBlue,
  })
  const maxMarkerLinesRef = useRef(MAX_MARKER_LINES)
  const markerPriceLinesRef = useRef<IPriceLine[]>([])
  const referenceLineRef = useRef<IPriceLine | null>(null)
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
  }, [])

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
    [cancelMarkerFocus, scheduleMarkerUpdate],
  )

  useEffect(() => {
    if (focusMarkerRequest) focusMarkerGroup(focusMarkerRequest.groupKey)
  }, [focusMarkerRequest, focusMarkerGroup])

  useEffect(() => {
    chartDataRef.current = chartData
    chartDataByTimeRef.current = new Map(chartData.map(candle => [candle.time, candle]))
  }, [chartData])

  useEffect(() => {
    onOffscreenChangeRef.current = onOffscreenChange
  }, [onOffscreenChange])

  // A chart that goes away takes its count with it; the next one reports its own.
  useEffect(() => () => onOffscreenChangeRef.current?.({}), [])

  useEffect(() => {
    markerOverlayRef.current = markerOverlay
    cancelMarkerFocus()
    markerFocusIndexRef.current.clear()
    markerOffscreenCountsKeyRef.current = ''
    markerLineColorsRef.current = { warning: theme.darkOrange, blue: theme.darkBlue }
    maxMarkerLinesRef.current = upToSmall ? MAX_MARKER_LINES_MOBILE : MAX_MARKER_LINES
    scheduleMarkerUpdate()
  }, [cancelMarkerFocus, markerOverlay, theme.darkOrange, theme.darkBlue, upToSmall, scheduleMarkerUpdate])

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

    const candlestickSeries = chart.addSeries(CandlestickSeries, initialCandlestickSeriesOptionsRef.current)
    candlestickSeries.applyOptions({
      autoscaleInfoProvider: createRobustAutoscaleInfoProvider({
        chartDataRef,
        // The reference price replaces the last candle's tag, so it has to stay on the pane. Marker
        // prices are left out: a stop far below the market would flatten every candle.
        getPinnedPrice: () => markerOverlayRef.current?.referencePrice,
        getVisibleLogicalRange: () => chart.timeScale().getVisibleLogicalRange(),
      }),
    })

    const volumeSeries = chart.addSeries(HistogramSeries, {
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
    container.addEventListener('pointerdown', cancelMarkerFocus)
    container.addEventListener('wheel', cancelMarkerFocus, { passive: true })
    // Double-clicking the price axis restores autoscale, which can hide orders again.
    container.addEventListener('dblclick', scheduleMarkerUpdate)

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
      container.removeEventListener('pointerdown', cancelMarkerFocus)
      container.removeEventListener('wheel', cancelMarkerFocus)
      container.removeEventListener('dblclick', scheduleMarkerUpdate)
      cancelMarkerFocus()
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
  }, [cancelMarkerFocus, scheduleMarkerUpdate])

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
