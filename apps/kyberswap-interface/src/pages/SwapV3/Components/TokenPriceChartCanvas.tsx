import dayjs from 'dayjs'
import { CrosshairMode, LineStyle, type MouseEventParams, type Time, createChart } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import { Text } from 'rebass'
import { type TokenChartTimeFrame } from 'services/tokenChart'
import styled from 'styled-components'

import { Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { formatPrice, formatSignedPercent } from 'pages/Earns/PoolDetail/Information/utils'
import { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { formatDisplayNumber } from 'utils/numbers'

export type DisplayCandle = {
  close: number
  high: number
  low: number
  open: number
  time: number
  volume: number
}

type TooltipState = {
  candle: DisplayCandle
  left: number
  top: number
}

type TokenPriceChartCanvasProps = {
  chartData: DisplayCandle[]
  chartHeight: number
  crosshairColor: string
  downCandleColor: string
  fitContentKey: string
  gridColor: string
  onFromBucketChange: (fromBucketMs: number) => void
  subTextColor: string
  timeFrame: TokenChartTimeFrame
  upCandleColor: string
  volumeDownColor: string
  volumeUpColor: string
}

const ChartFrame = styled.div<{ $height: number }>`
  position: relative;
  width: 100%;
  height: ${({ $height }) => $height}px;
`

const TooltipCard = styled(Stack)`
  position: absolute;
  z-index: 2;
  gap: 12px;
  min-width: 220px;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.tableHeader};
  box-shadow: 0 12px 32px ${({ theme }) => theme.shadow};
  pointer-events: none;
`

const TooltipGrid = styled.div`
  display: grid;
  gap: 8px 16px;
  grid-template-columns: auto auto;
`

const formatAxisTimeLabel = (timestamp: number, timeFrame: TokenChartTimeFrame) => {
  if (timeFrame === '5m' || timeFrame === '15m' || timeFrame === '1h') return dayjs.unix(timestamp).format('HH:mm')
  if (timeFrame === '4h') return dayjs.unix(timestamp).format('MMM D, HH:mm')
  return dayjs.unix(timestamp).format('MMM D')
}

const formatTooltipDate = (timestamp: number, timeFrame: TokenChartTimeFrame) =>
  dayjs.unix(timestamp).format(timeFrame === '7d' ? 'MMM D, YYYY' : 'MMM D, YYYY, HH:mm')

const getUnixTimestampFromChartTime = (time: Time) => {
  if (typeof time === 'number') return time
  if (typeof time === 'string') return Math.floor(Date.parse(`${time}T00:00:00Z`) / 1000)

  return Math.floor(Date.UTC(time.year, time.month - 1, time.day) / 1000)
}

const PriceChartTooltip = ({ timeFrame, tooltip }: { timeFrame: TokenChartTimeFrame; tooltip: TooltipState }) => {
  const theme = useTheme()
  const { candle, left, top } = tooltip
  const priceChange = ((candle.close - candle.open) / candle.open) * 100
  const priceRange = ((candle.high - candle.low) / candle.low) * 100

  return (
    <TooltipCard style={{ left, top }}>
      <Text color={theme.subText} fontSize={12}>
        {formatTooltipDate(candle.time, timeFrame)}
      </Text>

      <TooltipGrid>
        <Text color={theme.subText} fontSize={12}>
          Open
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatPrice(candle.open)}
        </Text>

        <Text color={theme.subText} fontSize={12}>
          High
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatPrice(candle.high)}
        </Text>

        <Text color={theme.subText} fontSize={12}>
          Low
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatPrice(candle.low)}
        </Text>

        <Text color={theme.subText} fontSize={12}>
          Close
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatPrice(candle.close)}
        </Text>

        <Text color={theme.subText} fontSize={12}>
          %Change
        </Text>
        <Text color={priceChange >= 0 ? theme.primary : theme.red} fontSize={12} fontWeight={500} textAlign="right">
          {formatSignedPercent(priceChange)}
        </Text>

        <Text color={theme.subText} fontSize={12}>
          Range
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatSignedPercent(priceRange).replace(/^\+/, '')}
        </Text>

        <Text color={theme.subText} fontSize={12}>
          Vol
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatDisplayNumber(candle.volume, { significantDigits: 4 })}
        </Text>
      </TooltipGrid>
    </TooltipCard>
  )
}

const TokenPriceChartCanvas = ({
  chartData,
  chartHeight,
  crosshairColor,
  downCandleColor,
  fitContentKey,
  gridColor,
  onFromBucketChange,
  subTextColor,
  timeFrame,
  upCandleColor,
  volumeDownColor,
  volumeUpColor,
}: TokenPriceChartCanvasProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const candlestickSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const chartDataRef = useRef<DisplayCandle[]>([])
  const fromBucketMsRef = useRef<number | null>(null)
  const syncFromVisibleRangeTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
  const suppressVisibleRangeSyncRef = useRef(false)
  const shouldFitContentRef = useRef(true)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    chartDataRef.current = chartData
  }, [chartData])

  useEffect(() => {
    shouldFitContentRef.current = true
    setTooltip(null)
  }, [fitContentKey])

  useEffect(() => {
    const container = chartContainerRef.current

    if (!container || !chartData.length) return

    const chart = createChart(container, {
      width: container.clientWidth,
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
        priceFormatter: (value: number) =>
          formatDisplayNumber(value, {
            allowDisplayNegative: true,
            significantDigits: value !== 0 && Math.abs(value) < 1 ? 8 : 6,
          }),
      },
    })
    chartRef.current = chart

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: upCandleColor,
      downColor: downCandleColor,
      borderUpColor: upCandleColor,
      borderDownColor: downCandleColor,
      wickUpColor: upCandleColor,
      wickDownColor: downCandleColor,
      priceLineColor: upCandleColor,
      priceLineStyle: LineStyle.Dashed,
      priceLineVisible: true,
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

      const hoveredCandle = chartDataRef.current.find(candle => candle.time === param.time)

      if (!hoveredCandle) {
        setTooltip(null)
        return
      }

      const tooltipWidth = 220
      const tooltipHeight = 180
      const tooltipEdgePadding = 12
      const tooltipLeftOffset = 12
      const tooltipRightOffset = tooltipLeftOffset + 4
      const tooltipTopOffset = 12
      const chartInnerPaddingLeft = 24
      const chartInnerPaddingRight = 12
      const cursorLeft = param.point.x + chartInnerPaddingLeft
      const frameWidth = container.clientWidth + chartInnerPaddingLeft + chartInnerPaddingRight
      const isLeftHalf = param.point.x < container.clientWidth / 2

      const left = Math.min(
        Math.max(
          isLeftHalf ? cursorLeft + tooltipRightOffset : cursorLeft - tooltipWidth - tooltipLeftOffset,
          tooltipEdgePadding,
        ),
        frameWidth - tooltipWidth - tooltipEdgePadding,
      )
      const top = Math.min(
        Math.max(param.point.y + tooltipTopOffset, tooltipEdgePadding),
        chartHeight - tooltipHeight - tooltipEdgePadding,
      )

      setTooltip({
        candle: hoveredCandle,
        left,
        top,
      })
    }

    const handleVisibleTimeRangeChange = (range: { from: Time; to: Time } | null) => {
      if (!range || suppressVisibleRangeSyncRef.current) return

      const nextFromBucketMs = getUnixTimestampFromChartTime(range.from) * 1000

      if (!Number.isFinite(nextFromBucketMs) || nextFromBucketMs <= 0) return
      if (fromBucketMsRef.current !== null && Math.abs(nextFromBucketMs - fromBucketMsRef.current) < 30_000) return

      if (syncFromVisibleRangeTimeoutRef.current) {
        globalThis.clearTimeout(syncFromVisibleRangeTimeoutRef.current)
      }

      syncFromVisibleRangeTimeoutRef.current = globalThis.setTimeout(() => {
        fromBucketMsRef.current = nextFromBucketMs
        onFromBucketChange(nextFromBucketMs)
      }, 250)
    }

    chart.subscribeCrosshairMove(handleCrosshairMove)
    chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange)

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0]

      if (!entry) return

      chart.resize(entry.contentRect.width, chartHeight)
    })

    resizeObserver.observe(container)

    return () => {
      setTooltip(null)
      if (syncFromVisibleRangeTimeoutRef.current) {
        globalThis.clearTimeout(syncFromVisibleRangeTimeoutRef.current)
      }
      resizeObserver.disconnect()
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange)
      chart.unsubscribeCrosshairMove(handleCrosshairMove)
      chartRef.current = null
      candlestickSeriesRef.current = null
      volumeSeriesRef.current = null
      chart.remove()
    }
  }, [
    chartData.length,
    chartHeight,
    crosshairColor,
    downCandleColor,
    gridColor,
    onFromBucketChange,
    subTextColor,
    timeFrame,
    upCandleColor,
  ])

  useEffect(() => {
    if (!chartRef.current) return

    chartRef.current.applyOptions({
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
      timeScale: {
        borderVisible: false,
        tickMarkFormatter: (time: number) => formatAxisTimeLabel(time, timeFrame),
        timeVisible: timeFrame !== '7d',
      },
    })
    chartRef.current.priceScale('volume').applyOptions({
      borderVisible: false,
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
      visible: false,
    })
    candlestickSeriesRef.current?.applyOptions({
      upColor: upCandleColor,
      downColor: downCandleColor,
      borderUpColor: upCandleColor,
      borderDownColor: downCandleColor,
      wickUpColor: upCandleColor,
      wickDownColor: downCandleColor,
      priceLineColor: upCandleColor,
      priceLineStyle: LineStyle.Dashed,
      priceLineVisible: true,
    })
  }, [chartHeight, crosshairColor, downCandleColor, gridColor, subTextColor, timeFrame, upCandleColor])

  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current) return

    candlestickSeriesRef.current.setData(chartData)
    volumeSeriesRef.current.setData(
      chartData.map(candle => ({
        time: candle.time,
        value: candle.volume,
        color: candle.close >= candle.open ? volumeUpColor : volumeDownColor,
      })),
    )

    if (!chartData.length || !shouldFitContentRef.current) return

    suppressVisibleRangeSyncRef.current = true
    chartRef.current.timeScale().fitContent()

    globalThis.requestAnimationFrame(() => {
      suppressVisibleRangeSyncRef.current = false
    })

    shouldFitContentRef.current = false
  }, [chartData, volumeDownColor, volumeUpColor])

  return (
    <ChartFrame $height={chartHeight}>
      {tooltip ? <PriceChartTooltip timeFrame={timeFrame} tooltip={tooltip} /> : null}
      <PoolChartWrapper $height={chartHeight - 12} ref={chartContainerRef} />
    </ChartFrame>
  )
}

export default TokenPriceChartCanvas
