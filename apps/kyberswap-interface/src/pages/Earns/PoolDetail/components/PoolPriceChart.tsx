import dayjs from 'dayjs'
import {
  CrosshairMode,
  LineStyle,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
  createChart,
} from 'lightweight-charts'
import { rgba } from 'polished'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { type PoolAnalyticsWindow, usePoolPriceQuery } from 'services/zapEarn'
import styled from 'styled-components'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import SegmentedControl from 'components/SegmentedControl'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import {
  CHART_WINDOW_OPTIONS,
  formatAxisTimeLabel,
  formatPrice,
  formatSignedPercent,
} from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState, { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { RevertIconWrapper } from 'pages/Earns/PositionDetail/styles'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

type DisplayCandle = {
  close: number
  high: number
  low: number
  open: number
  time: UTCTimestamp
  volume: number
}

type TooltipState = {
  candle: DisplayCandle
  left: number
  top: number
}

const ChartFrame = styled.div<{ $height: number }>`
  position: relative;
  width: 100%;
  height: ${({ $height }) => $height}px;
`

const ChartInner = styled.div`
  width: 100%;
  height: 100%;
  padding: 0 12px 24px 24px;
  box-sizing: border-box;
`

const HeaderTitle = styled(HStack)`
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`

const PairLabel = styled(Text)`
  white-space: nowrap;
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

const invertPrice = (value: number) => (value === 0 ? 0 : 1 / value)

const formatTooltipDate = (timestamp: number, window: PoolAnalyticsWindow) =>
  dayjs.unix(timestamp).format(window === '30d' ? 'MMM D, YYYY' : 'MMM D, YYYY, HH:mm')

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
  window,
}: {
  chartHeight: number
  crosshairColor: string
  gridColor: string
  subTextColor: string
  window: PoolAnalyticsWindow
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
    tickMarkFormatter: (time: number) => formatAxisTimeLabel(time, window),
    timeVisible: window === '24h',
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
  const tooltipHeight = 200
  const tooltipEdgePadding = 12
  const tooltipLeftOffset = 12
  const tooltipRightOffset = tooltipLeftOffset + 4
  const tooltipTopOffset = 12

  const cursorLeft = pointX + 24
  const frameWidth = containerWidth + 24 + 12
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

const PriceChartTooltip = ({ tooltip, window }: { tooltip: TooltipState; window: PoolAnalyticsWindow }) => {
  const theme = useTheme()

  const { candle, left, top } = tooltip
  const priceChange = candle.open ? ((candle.close - candle.open) / candle.open) * 100 : 0
  const priceRange = candle.low ? ((candle.high - candle.low) / candle.low) * 100 : 0

  return (
    <TooltipCard style={{ left, top }}>
      <Text color={theme.subText} fontSize={12}>
        {formatTooltipDate(candle.time, window)}
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
          {formatDisplayNumber(candle.volume, { style: 'currency', significantDigits: 4 })}
        </Text>
      </TooltipGrid>
    </TooltipCard>
  )
}

type PoolPriceChartProps = {
  chainId: number
  poolAddress: string
}

const PoolPriceChart = ({ chainId, poolAddress }: PoolPriceChartProps) => {
  const theme = useTheme()
  const { primaryToken, secondaryToken } = usePoolDetailContext()

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [window, setWindow] = useState<PoolAnalyticsWindow>('7d')
  const [revertPrice, setRevertPrice] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const gridColor = rgba(theme.text, 0.06)
  const crosshairColor = rgba(theme.text, 0.12)
  const upCandleColor = theme.primary
  const downCandleColor = theme.red
  const volumeUpColor = rgba(theme.darkGreen, 0.8)
  const volumeDownColor = rgba(theme.red, 0.5)

  const {
    data: priceData,
    isError,
    isLoading,
  } = usePoolPriceQuery({
    chainId,
    address: poolAddress,
    window,
  })

  const displayedToken0 = revertPrice ? secondaryToken : primaryToken
  const displayedToken1 = revertPrice ? primaryToken : secondaryToken
  const shouldInvertPrice = priceData?.priceInToken && priceData.priceInToken !== secondaryToken.address
  const shouldRevertPrice = revertPrice ? !shouldInvertPrice : shouldInvertPrice

  const chartData = useMemo<DisplayCandle[]>(
    () =>
      (priceData?.candles ?? []).map(candle => ({
        time: candle.ts as UTCTimestamp,
        open: shouldRevertPrice ? invertPrice(candle.open) : candle.open,
        high: shouldRevertPrice ? invertPrice(candle.low) : candle.high,
        low: shouldRevertPrice ? invertPrice(candle.high) : candle.low,
        close: shouldRevertPrice ? invertPrice(candle.close) : candle.close,
        volume: candle.volume,
      })),
    [priceData?.candles, shouldRevertPrice],
  )

  const priceScaleConfig = useMemo(() => getPriceScaleConfig(chartData), [chartData])
  const subTextColor = theme.subText
  const chartOptions = useMemo(
    () =>
      getChartOptions({
        chartHeight,
        crosshairColor,
        gridColor,
        subTextColor,
        window,
      }),
    [chartHeight, crosshairColor, gridColor, subTextColor, window],
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

  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const candlestickSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const chartDataByTimeRef = useRef<Map<number, DisplayCandle>>(new Map())
  const chartHeightRef = useRef(chartHeight)
  const latestChartOptionsRef = useRef(chartOptions)
  const latestCandlestickSeriesOptionsRef = useRef(candlestickSeriesOptions)

  const firstCandle = chartData[0]
  const lastCandle = chartData.at(-1)

  const priceChange =
    firstCandle && lastCandle
      ? firstCandle.open
        ? ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100
        : 0
      : undefined
  const priceChangeColor = priceChange === undefined || priceChange >= 0 ? upCandleColor : downCandleColor

  useEffect(() => {
    chartDataByTimeRef.current = new Map(chartData.map(candle => [candle.time, candle]))
  }, [chartData])

  useEffect(() => {
    chartHeightRef.current = chartHeight
  }, [chartHeight])

  useEffect(() => {
    latestChartOptionsRef.current = chartOptions
  }, [chartOptions])

  useEffect(() => {
    latestCandlestickSeriesOptionsRef.current = candlestickSeriesOptions
  }, [candlestickSeriesOptions])

  const hasRenderableChart = chartData.length > 0 && !isError && !isLoading

  useEffect(() => {
    const container = chartContainerRef.current

    if (!container || !hasRenderableChart || chartRef.current) return

    const chart = createChart(container, {
      width: container.clientWidth,
      ...latestChartOptionsRef.current,
    })
    chartRef.current = chart

    const candlestickSeries = chart.addCandlestickSeries(latestCandlestickSeriesOptionsRef.current)
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
      chart.timeScale().fitContent()
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
  }, [hasRenderableChart])

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

    candlestickSeriesRef.current.setData(chartData)
    volumeSeriesRef.current.setData(
      chartData.map(candle => ({
        time: candle.time,
        value: candle.volume,
        color: candle.close >= candle.open ? volumeUpColor : volumeDownColor,
      })),
    )

    if (!chartData.length) return

    return scheduleAfterNextPaint(() => {
      chartRef.current?.timeScale().fitContent()
    })
  }, [chartData, volumeDownColor, volumeUpColor, window])

  return (
    <Stack gap={16}>
      <HStack align="flex-start" gap={16} justify="space-between" wrap="wrap">
        <Stack gap={12}>
          <HeaderTitle>
            <HStack align="center" flex="0 0 auto" gap={0}>
              <TokenLogo src={displayedToken0.logoURI} size={24} />
              <TokenLogo src={displayedToken1.logoURI} size={24} translateLeft />
            </HStack>

            <PairLabel color={theme.text} fontSize={20} fontWeight={500}>
              {displayedToken0.symbol}/{displayedToken1.symbol}
            </PairLabel>

            <RevertIconWrapper onClick={() => setRevertPrice(prev => !prev)}>
              <RevertPriceIcon height={12} width={12} />
            </RevertIconWrapper>
          </HeaderTitle>

          {lastCandle && priceChange !== undefined ? (
            <HStack align="baseline" gap={10} wrap="wrap">
              <>
                <Text color={theme.text} fontSize={24} fontWeight={500}>
                  {formatPrice(lastCandle.close)}
                </Text>

                <HStack align="center" gap={6}>
                  <Text color={priceChangeColor} fontSize={16} fontWeight={500}>
                    {formatSignedPercent(priceChange)}
                  </Text>
                  <Text color={priceChangeColor} fontSize={12}>
                    {priceChange >= 0 ? '▲' : '▼'}
                  </Text>
                </HStack>
              </>
            </HStack>
          ) : (
            <Skeleton height={28.5} width={240} />
          )}
        </Stack>

        <SegmentedControl onChange={setWindow} options={CHART_WINDOW_OPTIONS} value={window} />
      </HStack>

      <PoolChartState
        emptyMessage="No price data available for this pool."
        errorMessage="Unable to load pool price."
        height={chartHeight}
        isEmpty={!chartData.length}
        isError={isError}
        isLoading={isLoading}
        skeletonType="candle"
      >
        <ChartFrame $height={chartHeight}>
          {tooltip ? <PriceChartTooltip tooltip={tooltip} window={window} /> : null}
          <ChartInner>
            <PoolChartWrapper $height={chartHeight - 12} ref={chartContainerRef} />
          </ChartInner>
        </ChartFrame>
      </PoolChartState>
    </Stack>
  )
}

export default PoolPriceChart
