import { type Currency } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { CrosshairMode, LineStyle, type MouseEventParams, type UTCTimestamp, createChart } from 'lightweight-charts'
import { rgba } from 'polished'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { type PoolPriceCandle, type PoolPriceData } from 'services/zapEarn'
import styled from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import SegmentedControl from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
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

type SwapChartWindow = '1h' | '4h' | '1d' | '1w'

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

const CHART_WINDOW_OPTIONS = [
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
] as const

const MOCK_WINDOW_CONFIG: Record<SwapChartWindow, { candleCount: number; stepMinutes: number }> = {
  '1h': { candleCount: 60, stepMinutes: 1 },
  '4h': { candleCount: 48, stepMinutes: 5 },
  '1d': { candleCount: 48, stepMinutes: 30 },
  '1w': { candleCount: 42, stepMinutes: 4 * 60 },
}

type TokenTabId = 'tokenIn' | 'tokenOut'

const hashString = (value: string) =>
  value.split('').reduce((accumulator, char, index) => accumulator + char.charCodeAt(0) * (index + 1), 0)

const createSeededRandom = (seed: number) => {
  let current = seed

  return () => {
    const value = Math.sin(current++) * 10000
    return value - Math.floor(value)
  }
}

const getCurrencySeedKey = (currency?: Currency | null) => {
  if (!currency) return 'unknown'

  return currency.isNative ? `${currency.chainId}-${currency.symbol}-native` : currency.wrapped.address.toLowerCase()
}

const formatAxisTimeLabel = (timestamp: number, window: SwapChartWindow) => {
  if (window === '1h' || window === '4h') return dayjs.unix(timestamp).format('HH:mm')
  if (window === '1d') return dayjs.unix(timestamp).format('MMM D, HH:mm')
  return dayjs.unix(timestamp).format('MMM D')
}

const buildMockPriceData = ({ token, window }: { token: Currency; window: SwapChartWindow }): PoolPriceData => {
  const { candleCount, stepMinutes } = MOCK_WINDOW_CONFIG[window]
  const tokenSeed = hashString(`${getCurrencySeedKey(token)}-USDT-${window}`)
  const random = createSeededRandom(tokenSeed)
  const basePriceBuckets = [0.00042, 0.0048, 0.093, 1.28, 12.4, 88.7, 427.95, 4675.87]
  const basePrice = basePriceBuckets[tokenSeed % basePriceBuckets.length] * (1 + ((tokenSeed >> 3) % 11) / 20)
  const stepSeconds = stepMinutes * 60
  const startTime = dayjs()
    .startOf('minute')
    .subtract((candleCount - 1) * stepMinutes, 'minute')
    .unix()
  const trendDirection = random() > 0.45 ? 1 : -1

  let currentPrice = basePrice

  const candles: PoolPriceCandle[] = Array.from({ length: candleCount }, (_, index) => {
    const trend = trendDirection * (index / candleCount) * 0.018
    const cyclicalDrift = Math.sin((index + (tokenSeed % 13)) / 3.5) * 0.032
    const noise = (random() - 0.5) * 0.048
    const open = currentPrice
    const close = Math.max(open * (1 + trend + cyclicalDrift + noise), Number.EPSILON)
    const high = Math.max(open, close) * (1 + random() * 0.028)
    const low = Math.max(Math.min(open, close) * (1 - random() * 0.028), Number.EPSILON)
    const volume = Math.round(basePrice * 12000 * (0.7 + random() * 1.8) * (1 + Math.abs(close - open) / open))

    currentPrice = close

    return {
      ts: startTime + index * stepSeconds,
      open,
      high,
      low,
      close,
      volume,
    }
  })

  const firstCandle = candles[0]
  const lastCandle = candles.at(-1)
  const priceChange = firstCandle && lastCandle ? ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100 : 0

  return {
    window: '24h',
    candles,
    currentPrice: lastCandle?.close || 0,
    priceChange,
  }
}

const formatTooltipDate = (timestamp: number, window: SwapChartWindow) =>
  dayjs.unix(timestamp).format(window === '1w' ? 'MMM D, YYYY' : 'MMM D, YYYY, HH:mm')

const PriceChartTooltip = ({ tooltip, window }: { tooltip: TooltipState; window: SwapChartWindow }) => {
  const theme = useTheme()

  const { candle, left, top } = tooltip
  const priceChange = ((candle.close - candle.open) / candle.open) * 100
  const priceRange = ((candle.high - candle.low) / candle.low) * 100

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
          {formatDisplayNumber(candle.volume, { significantDigits: 4 })}
        </Text>
      </TooltipGrid>
    </TooltipCard>
  )
}

type SwapPriceChartProps = {
  tokenIn?: Currency | null
  tokenOut?: Currency | null
}

const SwapPriceChart = ({ tokenIn, tokenOut }: SwapPriceChartProps) => {
  const theme = useTheme()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [window, setWindow] = useState<SwapChartWindow>('4h')
  const [activeTab, setActiveTab] = useState<TokenTabId>('tokenIn')
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

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
        array.findIndex(item => getCurrencySeedKey(item.token) === getCurrencySeedKey(tab.token)) === index,
    )
  }, [tokenIn, tokenOut])

  useEffect(() => {
    if (!tokenTabs.length) return
    if (!tokenTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(tokenTabs[0].id)
    }
  }, [activeTab, tokenTabs])

  const activeToken = tokenTabs.find(tab => tab.id === activeTab)?.token || tokenTabs[0]?.token

  const priceData = useMemo(
    () => (activeToken ? buildMockPriceData({ token: activeToken, window }) : undefined),
    [activeToken, window],
  )

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
        tickMarkFormatter: (time: number) => formatAxisTimeLabel(time, window),
        timeVisible: window !== '1w',
      },
      localization: {
        priceFormatter: (value: number) =>
          formatDisplayNumber(value, {
            allowDisplayNegative: true,
            significantDigits: value !== 0 && Math.abs(value) < 1 ? 8 : 6,
          }),
      },
    })

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

    candlestickSeries.setData(chartData)
    volumeSeries.setData(
      chartData.map(candle => ({
        time: candle.time,
        value: candle.volume,
        color: candle.close >= candle.open ? volumeUpColor : volumeDownColor,
      })),
    )

    chart.priceScale('volume').applyOptions({
      borderVisible: false,
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
      visible: false,
    })

    chart.timeScale().fitContent()

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

    chart.subscribeCrosshairMove(handleCrosshairMove)

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0]

      if (!entry) return

      chart.resize(entry.contentRect.width, chartHeight)
      chart.timeScale().fitContent()
    })

    resizeObserver.observe(container)

    return () => {
      setTooltip(null)
      resizeObserver.disconnect()
      chart.unsubscribeCrosshairMove(handleCrosshairMove)
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
    window,
  ])

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
                  {'/USDT'}
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
                  ({window.toUpperCase()})
                </Text>
              </HStack>
            ) : null}
          </Stack>

          <SegmentedControl onChange={setWindow} options={CHART_WINDOW_OPTIONS} size="sm" value={window} />
        </HStack>

        <PoolChartState
          emptyMessage={
            activeToken ? 'No price data available for this token.' : 'Select a token to view the price chart.'
          }
          height={chartHeight}
          isEmpty={!chartData.length}
          skeletonType="candle"
        >
          <ChartFrame $height={chartHeight}>
            {tooltip ? <PriceChartTooltip tooltip={tooltip} window={window} /> : null}
            <PoolChartWrapper $height={chartHeight - 12} ref={chartContainerRef} />
          </ChartFrame>
        </PoolChartState>
      </Stack>
    </ChartPanel>
  )
}

export default SwapPriceChart
