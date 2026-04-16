import dayjs from 'dayjs'
import { CrosshairMode, LineStyle, type MouseEventParams, type Time, createChart } from 'lightweight-charts'
import { rgba } from 'polished'
import { useEffect, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { type TokenChartTimeFrame } from 'services/tokenChart'
import styled from 'styled-components'

import { Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { formatPrice, formatSignedPercent } from 'pages/Earns/PoolDetail/Information/utils'
import { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { MEDIA_WIDTHS } from 'theme'
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
  timeFrame: TokenChartTimeFrame
}

type RuntimeConfig = {
  chartHeight: number
  crosshairColor: string
  downCandleColor: string
  gridColor: string
  subTextColor: string
  timeFrame: TokenChartTimeFrame
  upCandleColor: string
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
  background: ${({ theme }) => rgba(theme.tableHeader, 0.8)};
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

const getChartOptions = ({
  chartHeight,
  crosshairColor,
  gridColor,
  subTextColor,
  timeFrame,
}: Pick<RuntimeConfig, 'chartHeight' | 'crosshairColor' | 'gridColor' | 'subTextColor' | 'timeFrame'>) => ({
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

const getCandlestickSeriesOptions = ({
  downCandleColor,
  upCandleColor,
}: Pick<RuntimeConfig, 'downCandleColor' | 'upCandleColor'>) => ({
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
  const tooltipHeight = 200
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

const TokenPriceChartCanvas = ({ chartData, timeFrame }: TokenPriceChartCanvasProps) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360
  const gridColor = rgba(theme.text, 0.06)
  const crosshairColor = rgba(theme.text, 0.12)
  const upCandleColor = theme.primary
  const downCandleColor = theme.red
  const volumeUpColor = rgba(theme.darkGreen, 0.8)
  const volumeDownColor = rgba(theme.red, 0.5)
  const subTextColor = theme.subText
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const candlestickSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const chartDataByTimeRef = useRef<Map<number, DisplayCandle>>(new Map())
  const runtimeConfigRef = useRef<RuntimeConfig>({
    chartHeight,
    crosshairColor,
    downCandleColor,
    gridColor,
    subTextColor,
    timeFrame,
    upCandleColor,
  })
  const shouldFitContentRef = useRef(true)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  /** Keep crosshair tooltip lookup in sync with the latest candle set. */
  useEffect(() => {
    chartDataByTimeRef.current = new Map(chartData.map(candle => [candle.time, candle]))
  }, [chartData])

  /** Mirror visual runtime values so chart callbacks can read fresh config without re-subscribing. */
  useEffect(() => {
    runtimeConfigRef.current = {
      chartHeight,
      crosshairColor,
      downCandleColor,
      gridColor,
      subTextColor,
      timeFrame,
      upCandleColor,
    }
  }, [chartHeight, crosshairColor, downCandleColor, gridColor, subTextColor, timeFrame, upCandleColor])

  /** Reset one-time viewport fitting and clear tooltip when the selected timeframe changes. */
  useEffect(() => {
    shouldFitContentRef.current = true
    setTooltip(null)
  }, [timeFrame])

  /** Create the chart instance once and wire imperative subscriptions/cleanup around it. */
  useEffect(() => {
    const container = chartContainerRef.current

    if (!container) return

    const initialConfig = runtimeConfigRef.current

    const chart = createChart(container, {
      width: container.clientWidth,
      ...getChartOptions(initialConfig),
    })
    chartRef.current = chart

    const candlestickSeries = chart.addCandlestickSeries(getCandlestickSeriesOptions(initialConfig))

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
          chartHeight: runtimeConfigRef.current.chartHeight,
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

      chart.resize(entry.contentRect.width, runtimeConfigRef.current.chartHeight)
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

  /** Apply non-data chart option updates after mount without recreating the chart instance. */
  useEffect(() => {
    if (!chartRef.current) return

    chartRef.current.applyOptions(getChartOptions(runtimeConfigRef.current))
    chartRef.current.priceScale('volume').applyOptions({
      borderVisible: false,
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
      visible: false,
    })
    candlestickSeriesRef.current?.applyOptions(getCandlestickSeriesOptions(runtimeConfigRef.current))
  }, [chartHeight, crosshairColor, downCandleColor, gridColor, subTextColor, timeFrame, upCandleColor])

  /** Push candle and volume data into the existing series and refit once per timeframe. */
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

    chartRef.current.timeScale().fitContent()
    shouldFitContentRef.current = false
  }, [chartData, volumeDownColor, volumeUpColor])

  return (
    <ChartFrame $height={chartHeight}>
      {tooltip ? <PriceChartTooltip timeFrame={timeFrame} tooltip={tooltip} /> : null}
      <PoolChartWrapper $height={chartHeight} ref={chartContainerRef} />
    </ChartFrame>
  )
}

export default TokenPriceChartCanvas
