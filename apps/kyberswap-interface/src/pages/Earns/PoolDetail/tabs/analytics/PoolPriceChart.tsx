import { type UTCTimestamp, createChart } from 'lightweight-charts'
import { rgba } from 'polished'
import { useEffect, useMemo, useRef } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { type PoolAnalyticsWindow, type PoolPriceAnalytics } from 'services/zapEarn'
import styled from 'styled-components'

import { Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import {
  ChartLoadingState,
  ChartState,
  ChartWrapper,
  SectionCard,
  SectionHeader,
  WindowSelector,
  formatPriceNumber,
  formatSignedPercent,
} from 'pages/Earns/PoolDetail/tabs/analytics/shared'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
`

const PriceChange = styled(Text)<{ $positive: boolean }>`
  color: ${({ theme, $positive }) => ($positive ? theme.primary : theme.red)};
`

type PoolPriceChartProps = {
  analytics?: PoolPriceAnalytics
  baseSymbol?: string
  quoteSymbol?: string
  isError: boolean
  isLoading: boolean
  onSelectWindow: (value: PoolAnalyticsWindow) => void
  window: PoolAnalyticsWindow
}

const PoolPriceChart = ({
  analytics,
  baseSymbol,
  quoteSymbol,
  isError,
  isLoading,
  onSelectWindow,
  window,
}: PoolPriceChartProps) => {
  const theme = useTheme()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const chartData = useMemo(
    () =>
      analytics?.candles.map(candle => ({
        time: candle.ts as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })) || [],
    [analytics?.candles],
  )

  useEffect(() => {
    const container = chartContainerRef.current

    if (!container || !chartData.length) return

    const chart = createChart(container, {
      width: container.clientWidth,
      height: chartHeight,
      layout: {
        backgroundColor: 'transparent',
        textColor: theme.subText,
      },
      grid: {
        vertLines: {
          color: rgba(theme.subText, 0.12),
        },
        horzLines: {
          color: rgba(theme.subText, 0.12),
        },
      },
      rightPriceScale: {
        borderColor: theme.border,
        scaleMargins: {
          top: 0.12,
          bottom: 0.12,
        },
      },
      timeScale: {
        borderColor: theme.border,
        timeVisible: window !== '30d',
      },
      localization: {
        priceFormatter: (value: number) =>
          formatDisplayNumber(value, {
            significantDigits: value !== 0 && Math.abs(value) < 1 ? 8 : 6,
            allowDisplayNegative: true,
          }),
      },
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: theme.primary,
      downColor: theme.red,
      borderDownColor: theme.red,
      borderUpColor: theme.primary,
      wickDownColor: theme.red,
      wickUpColor: theme.primary,
      priceLineColor: theme.primary,
      priceLineVisible: true,
      lastValueVisible: true,
    })

    candlestickSeries.setData(chartData)
    chart.timeScale().fitContent()

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0]

      if (!entry) return

      chart.resize(entry.contentRect.width, chartHeight)
      chart.timeScale().fitContent()
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [chartData, chartHeight, theme.border, theme.primary, theme.red, theme.subText, window])

  return (
    <SectionCard gap={20}>
      <SectionHeader>
        <Stack gap={6}>
          <Text color={theme.text} fontSize={18} fontWeight={500}>
            Pool Price
          </Text>
          <PriceRow>
            <Text color={theme.text} fontSize={upToSmall ? 26 : 32} fontWeight={500}>
              {formatPriceNumber(analytics?.currentPrice)}
            </Text>
            {analytics?.priceChange !== undefined ? (
              <PriceChange $positive={analytics.priceChange >= 0} fontSize={16} fontWeight={500}>
                {formatSignedPercent(analytics.priceChange)}
              </PriceChange>
            ) : null}
          </PriceRow>
          {baseSymbol && quoteSymbol && analytics?.currentPrice !== undefined ? (
            <Text color={theme.subText} fontSize={14}>
              1 {baseSymbol} = {formatPriceNumber(analytics.currentPrice)} {quoteSymbol}
            </Text>
          ) : null}
        </Stack>

        <WindowSelector onSelect={onSelectWindow} window={window} />
      </SectionHeader>

      {isLoading && !chartData.length ? (
        <ChartLoadingState height={chartHeight} />
      ) : isError ? (
        <ChartState height={chartHeight} message="Unable to load pool price." />
      ) : !chartData.length ? (
        <ChartState height={chartHeight} message="No price data available for this pool." />
      ) : (
        <ChartWrapper $height={chartHeight} ref={chartContainerRef} />
      )}
    </SectionCard>
  )
}

export default PoolPriceChart
