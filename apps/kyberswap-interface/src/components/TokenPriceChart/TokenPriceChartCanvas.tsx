import {
  type CandlestickData,
  CandlestickSeries,
  type HistogramData,
  HistogramSeries,
  type IPriceLine,
  type ISeriesApi,
  LineStyle,
  type MouseEventParams,
  type UTCTimestamp,
  createChart,
} from 'lightweight-charts'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import { type TokenChartTimeFrame } from 'services/tokenChart'

import { PriceChartTooltip } from 'components/TokenPriceChart/PriceChartTooltip'
import { PriceMarkerLayer } from 'components/TokenPriceChart/TokenPriceChartOverlays'
import {
  DEFAULT_VISIBLE_CANDLES,
  type DisplayCandle,
  LOAD_MORE_THRESHOLD,
  SYMBOL_FONT,
  type TooltipState,
  createRobustAutoscaleInfoProvider,
  getCandlestickSeriesOptions,
  getChartOptions,
  getPriceScaleConfig,
  getSafeChartVolume,
  getTooltipPosition,
  getUnixTimestampFromChartTime,
  scheduleAfterNextPaint,
} from 'components/TokenPriceChart/chartOptions'
import { type PriceMarkerOverlay } from 'components/TokenPriceChart/priceMarkers'
import useTokenPriceChartMarkers from 'components/TokenPriceChart/useTokenPriceChartMarkers'
import useTheme from 'hooks/useTheme'
import { formatPrice } from 'pages/Earns/PoolDetail/Information/utils'
import { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { MEDIA_WIDTHS } from 'theme'
import { hexAlpha } from 'utils/colorAlpha'

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
const TokenPriceChartCanvas = ({
  focusMarkerRequest,
  chartData: rawChartData,
  canLoadMore = false,
  onLoadMore,
  timeFrame,
  formatValue = formatPrice,
  markerOverlay,
  onOffscreenChange,
}: TokenPriceChartCanvasProps) => {
  const chartData = useMemo(
    () => rawChartData.map(candle => ({ ...candle, volume: getSafeChartVolume(candle.volume) })),
    [rawChartData],
  )
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
  const referenceLineRef = useRef<IPriceLine | null>(null)
  const markerLineColors = useMemo(
    () => ({ warning: theme.darkOrange, blue: theme.darkBlue }),
    [theme.darkOrange, theme.darkBlue],
  )

  const { markerLayout, markerOverlayRef, scheduleMarkerUpdate, cancelMarkerFocus, disposeMarkers } =
    useTokenPriceChartMarkers({
      chartRef,
      candlestickSeriesRef,
      chartHeightRef,
      focusMarkerRequest,
      markerOverlay,
      onOffscreenChange,
      upToSmall,
      markerLineColors,
    })

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
      disposeMarkers()
      chart.unsubscribeCrosshairMove(handleCrosshairMove)
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(scheduleMarkerUpdate)
      referenceLineRef.current = null
      chartRef.current = null
      candlestickSeriesRef.current = null
      volumeSeriesRef.current = null
      chart.remove()
    }
  }, [cancelMarkerFocus, disposeMarkers, markerOverlayRef, scheduleMarkerUpdate])

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
