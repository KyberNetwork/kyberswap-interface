import { type UTCTimestamp, createChart } from 'lightweight-charts'
import { rgba } from 'polished'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { type PoolAnalyticsWindow, usePoolPriceQuery } from 'services/zapEarn'

import SegmentedControl from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { CHART_WINDOW_OPTIONS, formatPrice, formatSignedPercent } from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState, { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const PoolPriceChart = () => {
  const theme = useTheme()
  const { chainId, poolAddress } = usePoolDetailContext()

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [window, setWindow] = useState<PoolAnalyticsWindow>('7d')

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const {
    currentData: poolPriceData,
    isError,
    isFetching,
  } = usePoolPriceQuery({
    chainId,
    address: poolAddress,
    window,
  })

  const chartData = useMemo(
    () =>
      poolPriceData?.candles.map(candle => ({
        time: candle.ts as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })) || [],
    [poolPriceData?.candles],
  )

  const currentPrice = poolPriceData?.currentPrice
  const priceChange = poolPriceData?.priceChange ?? 0

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
    <Stack gap={16}>
      <HStack align="flex-start" gap={16} justify="space-between" wrap="wrap">
        <Stack gap={8}>
          <Text color={theme.text} fontSize={18} fontWeight={500}>
            Pool Price
          </Text>

          <HStack align="baseline" gap={8} wrap="wrap">
            <Text color={theme.text} fontSize={18} fontWeight={500}>
              {formatPrice(currentPrice)}
            </Text>

            <Text color={priceChange >= 0 ? theme.primary : theme.red} fontSize={14} fontWeight={500}>
              {formatSignedPercent(priceChange)}
            </Text>
          </HStack>
        </Stack>

        <SegmentedControl onChange={setWindow} options={CHART_WINDOW_OPTIONS} value={window} />
      </HStack>

      <PoolChartState
        emptyMessage="No price data available for this pool."
        errorMessage="Unable to load pool price."
        height={chartHeight}
        isEmpty={!chartData.length}
        isError={isError}
        isLoading={isFetching && !poolPriceData}
      >
        <PoolChartWrapper $height={chartHeight} ref={chartContainerRef} />
      </PoolChartState>
    </Stack>
  )
}

export default PoolPriceChart
