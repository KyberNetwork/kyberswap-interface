import dayjs from 'dayjs'
import {
  type AutoscaleInfo,
  type AutoscaleInfoProvider,
  type CandlestickData,
  CrosshairMode,
  type HistogramData,
  type ISeriesApi,
  LineStyle,
  type LogicalRange,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
  createChart,
} from 'lightweight-charts'
import { type MutableRefObject, useEffect, useMemo, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import { type TokenChartTimeFrame } from 'services/tokenChart'

import { Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { formatPrice, formatSignedPercent } from 'pages/Earns/PoolDetail/Information/utils'
import { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { MEDIA_WIDTHS } from 'theme'
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
}

const DEFAULT_VISIBLE_CANDLES = 60
const LOAD_MORE_THRESHOLD = 20

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
  getVisibleLogicalRange,
}: {
  chartDataRef: MutableRefObject<DisplayCandle[]>
  getVisibleLogicalRange: () => LogicalRange | null
}): AutoscaleInfoProvider => {
  return baseImplementation =>
    getRobustAutoscaleInfo(getVisibleCandles(chartDataRef.current, getVisibleLogicalRange()), baseImplementation())
}

const getUnixTimestampFromChartTime = (time: Time) => {
  if (typeof time === 'number') return time
  if (typeof time === 'string') return Math.floor(Date.parse(`${time}T00:00:00Z`) / 1000)

  return Math.floor(Date.UTC(time.year, time.month - 1, time.day) / 1000)
}

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
    fontFamily: "'Work Sans', 'Inter', sans-serif",
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
  upCandleColor,
}: {
  downCandleColor: string
  priceMinMove: number
  pricePrecision: number
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
  priceLineVisible: true,
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

const PriceChartTooltip = ({ timeFrame, tooltip }: { timeFrame: TokenChartTimeFrame; tooltip: TooltipState }) => {
  const theme = useTheme()
  const { candle, left, top } = tooltip
  const priceChange = candle.changePercent ?? (candle.open ? ((candle.close - candle.open) / candle.open) * 100 : 0)
  const priceRange = candle.rangePercent ?? (candle.low ? ((candle.high - candle.low) / candle.low) * 100 : 0)

  return (
    <Stack
      className="pointer-events-none absolute z-[2] min-w-[220px] gap-3 rounded-xl border border-border bg-tableHeader/80 px-4 py-3"
      style={{ left, top, boxShadow: `0 12px 32px ${theme.shadow}` }}
    >
      <span className="text-xs text-subText">{formatTooltipDate(candle.time, timeFrame)}</span>

      <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2">
        <span className="text-xs text-subText">Open</span>
        <span className="text-right text-xs font-medium text-text">{formatPrice(candle.open)}</span>

        <span className="text-xs text-subText">High</span>
        <span className="text-right text-xs font-medium text-text">{formatPrice(candle.high)}</span>

        <span className="text-xs text-subText">Low</span>
        <span className="text-right text-xs font-medium text-text">{formatPrice(candle.low)}</span>

        <span className="text-xs text-subText">Close</span>
        <span className="text-right text-xs font-medium text-text">{formatPrice(candle.close)}</span>

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

const TokenPriceChartCanvas = ({
  chartData,
  canLoadMore = false,
  onLoadMore,
  timeFrame,
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
  const candlestickSeriesOptions = useMemo(
    () =>
      getCandlestickSeriesOptions({
        downCandleColor,
        priceMinMove: priceScaleConfig.minMove,
        pricePrecision: priceScaleConfig.precision,
        upCandleColor,
      }),
    [downCandleColor, priceScaleConfig.minMove, priceScaleConfig.precision, upCandleColor],
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

  useEffect(() => {
    chartDataRef.current = chartData
    chartDataByTimeRef.current = new Map(chartData.map(candle => [candle.time, candle]))
  }, [chartData])

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

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0]

      if (!entry) return

      chart.resize(entry.contentRect.width, chartHeightRef.current)
    })

    resizeObserver.observe(container)

    return () => {
      setTooltip(null)
      resizeObserver.disconnect()
      chart.unsubscribeCrosshairMove(handleCrosshairMove)
      chartRef.current = null
      candlestickSeriesRef.current = null
      volumeSeriesRef.current = null
      chart.remove()
    }
  }, [])

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

    if (!chartData.length || hasInitializedViewRef.current) return

    return scheduleAfterNextPaint(() => {
      if (!chartRef.current || hasInitializedViewRef.current) return

      const lastCandleIndex = chartData.length - 1
      chartRef.current.timeScale().setVisibleLogicalRange({
        from: Math.max(lastCandleIndex - (DEFAULT_VISIBLE_CANDLES - 1), 0),
        to: lastCandleIndex + 0.5,
      })
      hasInitializedViewRef.current = true
      setIsViewportReady(true)
    })
  }, [chartData, volumeDownColor, volumeUpColor])

  return (
    <div className="relative w-full" style={{ height: `${chartHeight}px` }}>
      {tooltip && isViewportReady ? <PriceChartTooltip timeFrame={timeFrame} tooltip={tooltip} /> : null}
      <PoolChartWrapper
        $height={chartHeight}
        ref={chartContainerRef}
        style={{ visibility: isViewportReady ? 'visible' : 'hidden' }}
      />
    </div>
  )
}

export default TokenPriceChartCanvas
