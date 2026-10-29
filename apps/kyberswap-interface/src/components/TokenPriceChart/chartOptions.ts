import dayjs from 'dayjs'
import {
  type AutoscaleInfo,
  type AutoscaleInfoProvider,
  ColorType,
  CrosshairMode,
  LineStyle,
  type LogicalRange,
  type Time,
} from 'lightweight-charts'
import { type MutableRefObject } from 'react'
import { type TokenChartTimeFrame } from 'services/tokenChart'

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

export type TooltipState = {
  candle: DisplayCandle
  left: number
  top: number
}

export const MAX_SAFE_CHART_VALUE = Number.MAX_SAFE_INTEGER / 100

export const getSafeChartVolume = (volume?: number | null) => {
  if (volume === undefined || volume === null || !Number.isFinite(volume)) return 0

  return Math.abs(volume) <= MAX_SAFE_CHART_VALUE ? volume : 0
}

export const DEFAULT_VISIBLE_CANDLES = 40
export const LOAD_MORE_THRESHOLD = 20
const formatAxisTimeLabel = (timestamp: number, timeFrame: TokenChartTimeFrame) => {
  if (timeFrame === '1d' || timeFrame === '7d') {
    return dayjs.unix(timestamp).format('MMM D')
  }
  return dayjs.unix(timestamp).format('MMM D, HH:mm')
}

export const formatTooltipDate = (timestamp: number, timeFrame: TokenChartTimeFrame) => {
  if (timeFrame === '7d') {
    return dayjs.unix(timestamp).format('MMM D, YYYY')
  }
  return dayjs.unix(timestamp).format('MMM D, YYYY, HH:mm')
}

export const scheduleAfterNextPaint = (callback: () => void) => {
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

export const getPriceScaleConfig = (chartData: DisplayCandle[]) => {
  const minPrice = Math.min(...chartData.map(candle => candle.open)) || 0.1

  const precision =
    minPrice < 1e-8 ? 12 : minPrice < 1e-6 ? 10 : minPrice < 1e-4 ? 8 : minPrice < 1e-2 ? 6 : minPrice < 1 ? 4 : 2
  const minMove = 10 ** -precision

  return {
    minMove,
    precision,
  }
}

export const getVisibleCandles = (chartData: DisplayCandle[], visibleLogicalRange: LogicalRange | null) => {
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

export const createRobustAutoscaleInfoProvider = ({
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

export const getUnixTimestampFromChartTime = (time: Time) => {
  if (typeof time === 'number') return time
  if (typeof time === 'string') return Math.floor(Date.parse(`${time}T00:00:00Z`) / 1000)

  return Math.floor(Date.UTC(time.year, time.month - 1, time.day) / 1000)
}

// Axis labels carry subscript digits (0.0₅28…) and Work Sans has no glyph for them, so the chart needs
// the same symbol face the DOM uses — canvas text resolves its own font list, not the CSS stack.
export const SYMBOL_FONT = 'Inter Symbols'
const CHART_FONT_FAMILY = `'Work Sans', '${SYMBOL_FONT}', sans-serif`

export const getChartOptions = ({
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

export const getCandlestickSeriesOptions = ({
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

export const getTooltipPosition = ({
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
