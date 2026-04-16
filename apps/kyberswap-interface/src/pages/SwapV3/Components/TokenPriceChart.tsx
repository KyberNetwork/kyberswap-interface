import { type Currency } from '@kyberswap/ks-sdk-core'
import { skipToken } from '@reduxjs/toolkit/query'
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
import { type TokenChartTimeFrame, useTokenPriceChartQuery } from 'services/tokenChart'
import styled from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import SegmentedControl from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN } from 'constants/tokens'
import useTheme from 'hooks/useTheme'
import { formatPrice, formatSignedPercent } from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState, { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
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

const ChartPanel = styled(Stack)`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.darkBorder};
  border-radius: 12px;
`

const PanelHeader = styled.div`
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  border-bottom: 1px solid ${({ theme }) => theme.darkBorder};
`

const TabButton = styled.button<{ $active: boolean; $isLast: boolean }>`
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 0;
  border-right: ${({ theme, $isLast }) => ($isLast ? '0' : `1px solid ${theme.darkBorder}`)};
  background: ${({ theme, $active }) => ($active ? rgba(theme.primary, 0.14) : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.subText)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: inset 0 -2px 0 ${({ theme, $active }) => ($active ? theme.primary : 'transparent')};

  :hover {
    color: ${({ theme, $active }) => ($active ? theme.primary : theme.text)};
    background: ${({ theme, $active }) => ($active ? rgba(theme.primary, 0.14) : theme.tableHeader)};
  }
`

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

const CHART_TIME_FRAME_OPTIONS = [
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '7d' },
] as const

const DEFAULT_TIME_FRAME: TokenChartTimeFrame = '1h'

const DEFAULT_FROM_BUCKET_MS_BY_TIME_FRAME: Record<TokenChartTimeFrame, number> = {
  '5m': 60 * 60 * 1000, // 1h
  '15m': 4 * 60 * 60 * 1000, // 4h
  '1h': 7 * 24 * 60 * 60 * 1000, // 7d
  '4h': 30 * 24 * 60 * 60 * 1000, // 30d
  '1d': 90 * 24 * 60 * 60 * 1000, // 90d
  '7d': 180 * 24 * 60 * 60 * 1000, // 180d
}

type TokenTabId = 'tokenIn' | 'tokenOut'

const getCurrencyKey = (currency?: Currency | null) => {
  if (!currency) return 'unknown'

  return currency.isNative ? `${currency.chainId}-${currency.symbol}-native` : currency.wrapped.address.toLowerCase()
}

const getDefaultFromBucketMs = (timeFrame: TokenChartTimeFrame) =>
  Date.now() - DEFAULT_FROM_BUCKET_MS_BY_TIME_FRAME[timeFrame]

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

const PriceChartTooltip = ({ tooltip, timeFrame }: { tooltip: TooltipState; timeFrame: TokenChartTimeFrame }) => {
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

type TokenPriceChartProps = {
  tokenIn?: Currency | null
  tokenOut?: Currency | null
}

const TokenPriceChart = ({ tokenIn, tokenOut }: TokenPriceChartProps) => {
  const theme = useTheme()

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const candlestickSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const fromBucketMsRef = useRef(getDefaultFromBucketMs(DEFAULT_TIME_FRAME))
  const syncFromVisibleRangeTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
  const suppressVisibleRangeSyncRef = useRef(false)
  const shouldFitContentRef = useRef(true)

  const [timeFrame, setTimeFrame] = useState<TokenChartTimeFrame>(DEFAULT_TIME_FRAME)
  const [activeTab, setActiveTab] = useState<TokenTabId>('tokenIn')
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [fromBucketMs, setFromBucketMs] = useState(() => getDefaultFromBucketMs(DEFAULT_TIME_FRAME))

  const gridColor = rgba(theme.text, 0.06)
  const crosshairColor = rgba(theme.text, 0.12)
  const upCandleColor = theme.primary
  const downCandleColor = theme.red
  const volumeUpColor = rgba(theme.darkGreen, 0.8)
  const volumeDownColor = rgba(theme.red, 0.5)

  const tokenTabs = useMemo(() => {
    const tabs = [
      tokenIn ? { id: 'tokenIn' as const, token: tokenIn } : null,
      tokenOut ? { id: 'tokenOut' as const, token: tokenOut } : null,
    ].filter(Boolean) as Array<{ id: TokenTabId; token: Currency }>

    return tabs.filter(
      (tab, index, array) =>
        array.findIndex(item => getCurrencyKey(item.token) === getCurrencyKey(tab.token)) === index,
    )
  }, [tokenIn, tokenOut])

  useEffect(() => {
    if (!tokenTabs.length) return

    if (!tokenTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(tokenTabs[0].id)
    }
  }, [activeTab, tokenTabs])

  const activeToken = tokenTabs.find(tab => tab.id === activeTab)?.token || tokenTabs[0]?.token
  const stableToken = activeToken ? DEFAULT_OUTPUT_TOKEN_BY_CHAIN[activeToken.chainId] : undefined
  const quoteToken =
    tokenTabs.find(tab => getCurrencyKey(tab.token) !== getCurrencyKey(activeToken))?.token || stableToken

  const activeTokenAddress = activeToken?.wrapped.address.toLowerCase()
  const stableAddress = stableToken?.wrapped.address.toLowerCase()
  const quoteAddress = quoteToken?.wrapped.address.toLowerCase()

  const queryArgs =
    activeToken && activeTokenAddress && stableAddress && quoteAddress
      ? {
          chainId: activeToken.chainId,
          fromBucketMs,
          stableAddress,
          tokenAddress: activeTokenAddress,
          quoteAddress,
          timeFrame,
        }
      : skipToken

  const { data: priceData, isError, isLoading } = useTokenPriceChartQuery(queryArgs)

  useEffect(() => {
    if (!activeTokenAddress || !stableAddress || !quoteAddress) return

    const nextFromBucketMs = getDefaultFromBucketMs(timeFrame)
    fromBucketMsRef.current = nextFromBucketMs
    shouldFitContentRef.current = true
    setTooltip(null)
    setFromBucketMs(nextFromBucketMs)
  }, [activeTokenAddress, quoteAddress, stableAddress, timeFrame])

  useEffect(() => {
    shouldFitContentRef.current = true
  }, [timeFrame])

  const chartData = useMemo<DisplayCandle[]>(
    () =>
      (priceData?.candles ?? []).map(candle => ({
        time: candle.ts as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      })),
    [priceData?.candles],
  )

  const firstCandle = chartData[0]
  const lastCandle = chartData.at(-1)
  const priceChange =
    firstCandle && lastCandle ? ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100 : undefined
  const priceChangeColor = priceChange === undefined || priceChange >= 0 ? upCandleColor : downCandleColor

  useEffect(() => {
    const container = chartContainerRef.current

    if (!container || !chartData.length) return

    const chart = createChart(container, {
      width: container.clientWidth,
      height: chartHeight,
      layout: {
        background: { color: 'transparent' },
        fontFamily: "'Work Sans', 'Inter', sans-serif",
        textColor: theme.subText,
      },
      grid: {
        vertLines: {
          color: gridColor,
        },
        horzLines: {
          color: gridColor,
        },
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
      priceFormat: {
        type: 'volume',
      },
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

      const hoveredCandle = chartData.find(candle => candle.time === param.time)

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
      if (Math.abs(nextFromBucketMs - fromBucketMsRef.current) < 30_000) return

      if (syncFromVisibleRangeTimeoutRef.current) {
        globalThis.clearTimeout(syncFromVisibleRangeTimeoutRef.current)
      }

      syncFromVisibleRangeTimeoutRef.current = globalThis.setTimeout(() => {
        fromBucketMsRef.current = nextFromBucketMs
        setFromBucketMs(nextFromBucketMs)
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
    chartData,
    chartHeight,
    crosshairColor,
    downCandleColor,
    gridColor,
    theme.subText,
    upCandleColor,
    volumeDownColor,
    volumeUpColor,
    timeFrame,
  ])

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
    <ChartPanel gap={0}>
      {tokenTabs.length ? (
        <PanelHeader role="tablist">
          {tokenTabs.map((tab, index) => (
            <TabButton
              $active={tab.id === activeTab}
              $isLast={index === tokenTabs.length - 1}
              aria-selected={tab.id === activeTab}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              <CurrencyLogo currency={tab.token} size="20px" />
              <Text color="inherit" fontSize={16} fontWeight={500}>
                {tab.token.symbol}
                <Text as="span" fontSize={14}>
                  {`/${quoteToken?.symbol || stableToken?.symbol || 'USDT'}`}
                </Text>
              </Text>
            </TabButton>
          ))}
        </PanelHeader>
      ) : null}

      <Stack p={16} gap={12}>
        <HStack align="flex-start" gap={16} justify="space-between" wrap="wrap">
          <Stack>
            {lastCandle && priceChange !== undefined ? (
              <HStack align="baseline" gap={8} wrap="wrap">
                <Text color={theme.text} fontSize={20} fontWeight={500}>
                  {formatPrice(lastCandle.close)}
                </Text>

                <HStack align="center" gap={4}>
                  <Text color={priceChangeColor} fontSize={14} fontWeight={500}>
                    {formatSignedPercent(priceChange)}
                  </Text>
                  <Text color={priceChangeColor} fontSize={10}>
                    {priceChange >= 0 ? '▲' : '▼'}
                  </Text>
                </HStack>
                <Text color={theme.subText} fontSize={14}>
                  ({timeFrame.toUpperCase()})
                </Text>
              </HStack>
            ) : null}
          </Stack>

          <SegmentedControl onChange={setTimeFrame} options={CHART_TIME_FRAME_OPTIONS} size="sm" value={timeFrame} />
        </HStack>

        <PoolChartState
          emptyMessage={
            activeToken
              ? stableToken
                ? 'No price data available for this token.'
                : 'No price chart stable token configured for this chain.'
              : 'Select a token to view the price chart.'
          }
          errorMessage="Unable to load token price."
          height={chartHeight}
          isEmpty={!chartData.length}
          isError={isError}
          isLoading={isLoading}
          skeletonType="candle"
        >
          <ChartFrame $height={chartHeight}>
            {tooltip ? <PriceChartTooltip tooltip={tooltip} timeFrame={timeFrame} /> : null}
            <PoolChartWrapper $height={chartHeight - 12} ref={chartContainerRef} />
          </ChartFrame>
        </PoolChartState>
      </Stack>
    </ChartPanel>
  )
}

export default TokenPriceChart
