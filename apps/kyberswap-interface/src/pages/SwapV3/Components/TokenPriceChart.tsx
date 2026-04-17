import { type Currency } from '@kyberswap/ks-sdk-core'
import { skipToken } from '@reduxjs/toolkit/query'
import { rgba } from 'polished'
import { useEffect, useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import {
  type TokenChartCandle,
  type TokenChartData,
  type TokenChartTimeFrame,
  useTokenPriceChartQuery,
} from 'services/tokenChart'
import styled from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import SegmentedControl from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN } from 'constants/tokens'
import { useStableCoins } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { formatPrice, formatSignedPercent } from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState from 'pages/Earns/PoolDetail/components/PoolChartState'
import { MEDIA_WIDTHS } from 'theme'

import TokenPriceChartCanvas, { type DisplayCandle } from './TokenPriceChartCanvas'

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
  gap: 6px;
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

const CHART_TIME_FRAME_OPTIONS = [
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '7d' },
] as const

const DEFAULT_TIME_FRAME: TokenChartTimeFrame = '1d'

const DEFAULT_FROM_BUCKET_MS_BY_TIME_FRAME: Record<TokenChartTimeFrame, number> = {
  '5m': 60 * 60 * 1000,
  '15m': 4 * 60 * 60 * 1000,
  '1h': 7 * 24 * 60 * 60 * 1000,
  '4h': 30 * 24 * 60 * 60 * 1000,
  '1d': 90 * 24 * 60 * 60 * 1000,
  '7d': 180 * 24 * 60 * 60 * 1000,
}

const BUCKET_SIZE_SECONDS_BY_TIME_FRAME: Record<TokenChartTimeFrame, number> = {
  '5m': 5 * 60,
  '15m': 15 * 60,
  '1h': 60 * 60,
  '4h': 4 * 60 * 60,
  '1d': 24 * 60 * 60,
  '7d': 7 * 24 * 60 * 60,
}

const PEGGED_PRICE = 1

type TokenTabId = 'tokenIn' | 'tokenOut'
type MarketMode = 'direct' | 'derived'
type MarketData = {
  chartData: DisplayCandle[]
  currentPrice?: number
  isError: boolean
  isLoading: boolean
  priceChange?: number
}

type TokenPriceChartProps = {
  tokenIn?: Currency | null
  tokenOut?: Currency | null
}

const getCurrencyKey = (currency?: Currency | null) => {
  if (!currency) return 'unknown'

  return currency.isNative ? `${currency.chainId}-${currency.symbol}-native` : currency.wrapped.address.toLowerCase()
}

const getDefaultFromBucketMs = (timeFrame: TokenChartTimeFrame) =>
  Date.now() - DEFAULT_FROM_BUCKET_MS_BY_TIME_FRAME[timeFrame]

const getChartData = (candles?: TokenChartCandle[]) =>
  (candles ?? []).map(
    candle =>
      ({
        time: candle.ts,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      } as DisplayCandle),
  )

const getPreviousPriceFrom24hChange = (currentPrice: number, priceChange: number) => {
  const changeMultiplier = 1 + priceChange / 100

  if (changeMultiplier <= 0) return undefined

  return currentPrice / changeMultiplier
}

const getDerivedChartData = (baseCandles: TokenChartCandle[] = [], quoteCandles: TokenChartCandle[] = []) => {
  const quoteCandlesByTimestamp = new Map(quoteCandles.map(candle => [candle.ts, candle]))

  return getChartData(
    baseCandles.reduce<TokenChartCandle[]>((result, candle) => {
      const quoteCandle = quoteCandlesByTimestamp.get(candle.ts)

      if (
        !quoteCandle ||
        quoteCandle.open <= 0 ||
        quoteCandle.high <= 0 ||
        quoteCandle.low <= 0 ||
        quoteCandle.close <= 0
      ) {
        return result
      }

      result.push({
        ts: candle.ts,
        open: candle.open / quoteCandle.open,
        high: candle.high / quoteCandle.low,
        low: candle.low / quoteCandle.high,
        close: candle.close / quoteCandle.close,
        volume: candle.volume,
      })

      return result
    }, []),
  )
}

const getDerivedCurrentPrice = (baseData: TokenChartData, quoteData: TokenChartData) =>
  quoteData.currentPrice > 0 ? baseData.currentPrice / quoteData.currentPrice : undefined

const getDerived24hPriceChange = (baseData: TokenChartData, quoteData: TokenChartData) => {
  const currentPrice = getDerivedCurrentPrice(baseData, quoteData)
  const previousBasePrice = getPreviousPriceFrom24hChange(baseData.currentPrice, baseData.priceChange)
  const previousQuotePrice = getPreviousPriceFrom24hChange(quoteData.currentPrice, quoteData.priceChange)

  if (
    currentPrice === undefined ||
    previousBasePrice === undefined ||
    previousQuotePrice === undefined ||
    previousQuotePrice <= 0
  ) {
    return undefined
  }

  const previousPrice = previousBasePrice / previousQuotePrice

  if (previousPrice <= 0) return undefined

  return ((currentPrice - previousPrice) / previousPrice) * 100
}

const getPeggedFallbackChartData = (fromBucketMs: number, timeFrame: TokenChartTimeFrame) => {
  const step = BUCKET_SIZE_SECONDS_BY_TIME_FRAME[timeFrame]
  const startTime = Math.floor(fromBucketMs / 1000 / step) * step
  const now = Math.floor(Date.now() / 1000)
  const data: DisplayCandle[] = []

  for (let timestamp = startTime; timestamp <= now; timestamp += step) {
    data.push({
      time: timestamp,
      open: PEGGED_PRICE,
      high: PEGGED_PRICE,
      low: PEGGED_PRICE,
      close: PEGGED_PRICE,
      volume: 0,
    })
  }

  return data
}

const getPeggedChartData = (chartData: DisplayCandle[]) =>
  chartData.map(candle => ({
    ...candle,
    open: PEGGED_PRICE,
    high: PEGGED_PRICE,
    low: PEGGED_PRICE,
    close: PEGGED_PRICE,
  }))

const isStableCurrency = (currency: Currency | undefined, isStableCoin: (address: string | undefined) => boolean) => {
  if (!currency) return false

  const wrappedCurrency = currency.wrapped as typeof currency.wrapped & { isStable?: boolean }

  return Boolean(wrappedCurrency.isStable) || isStableCoin(wrappedCurrency.address)
}

const getOtherToken = (token: Currency | undefined, tabs: Array<{ id: TokenTabId; token: Currency }>) =>
  token ? tabs.find(tab => getCurrencyKey(tab.token) !== getCurrencyKey(token))?.token : undefined

const TokenPriceChart = ({ tokenIn, tokenOut }: TokenPriceChartProps) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const [timeFrame, setTimeFrame] = useState<TokenChartTimeFrame>(DEFAULT_TIME_FRAME)
  const [activeTab, setActiveTab] = useState<TokenTabId>('tokenIn')
  const [fromBucketMs, setFromBucketMs] = useState(() => getDefaultFromBucketMs(DEFAULT_TIME_FRAME))

  const gridColor = rgba(theme.text, 0.06)
  const crosshairColor = rgba(theme.text, 0.12)
  const upCandleColor = theme.primary
  const downCandleColor = theme.red
  const volumeUpColor = rgba(theme.darkGreen, 0.8)
  const volumeDownColor = rgba(theme.red, 0.5)

  const dedupedTokenTabs = useMemo(() => {
    const tabs = [
      tokenIn ? { id: 'tokenIn' as const, token: tokenIn } : null,
      tokenOut ? { id: 'tokenOut' as const, token: tokenOut } : null,
    ].filter(Boolean) as Array<{ id: TokenTabId; token: Currency }>

    return tabs.filter(
      (tab, index, array) =>
        array.findIndex(item => getCurrencyKey(item.token) === getCurrencyKey(tab.token)) === index,
    )
  }, [tokenIn, tokenOut])

  const pairQuoteToken = dedupedTokenTabs[0]
    ? DEFAULT_OUTPUT_TOKEN_BY_CHAIN[dedupedTokenTabs[0].token.chainId]
    : undefined
  const { isStableCoin } = useStableCoins(dedupedTokenTabs[0]?.token.chainId)
  const pairQuoteTokenKey = getCurrencyKey(pairQuoteToken)
  const hasQuoteStableInPair = dedupedTokenTabs.some(tab => getCurrencyKey(tab.token) === pairQuoteTokenKey)

  const tokenTabs = useMemo(() => {
    if (!hasQuoteStableInPair) return dedupedTokenTabs

    const nonQuoteTabs = dedupedTokenTabs.filter(tab => getCurrencyKey(tab.token) !== pairQuoteTokenKey)

    return nonQuoteTabs.length ? nonQuoteTabs : dedupedTokenTabs
  }, [dedupedTokenTabs, hasQuoteStableInPair, pairQuoteTokenKey])

  useEffect(() => {
    if (!tokenTabs.length) return

    if (!tokenTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(tokenTabs[0].id)
    }
  }, [activeTab, tokenTabs])

  const activeToken = tokenTabs.find(tab => tab.id === activeTab)?.token || tokenTabs[0]?.token
  const otherToken = getOtherToken(activeToken, dedupedTokenTabs)
  const stableToken = activeToken ? DEFAULT_OUTPUT_TOKEN_BY_CHAIN[activeToken.chainId] : undefined
  const quoteToken =
    hasQuoteStableInPair && stableToken && getCurrencyKey(activeToken) !== getCurrencyKey(stableToken)
      ? stableToken
      : otherToken || stableToken
  const activeTokenAddress = activeToken?.wrapped.address.toLowerCase()
  const stableAddress = stableToken?.wrapped.address.toLowerCase()
  const quoteAddress = quoteToken?.wrapped.address.toLowerCase()
  const isStablePair = isStableCurrency(activeToken, isStableCoin) && isStableCurrency(quoteToken, isStableCoin)
  const marketMode: MarketMode | undefined =
    activeToken && quoteToken && stableToken
      ? getCurrencyKey(quoteToken) === getCurrencyKey(stableToken)
        ? 'direct'
        : 'derived'
      : undefined

  const directQueryArgs =
    activeToken && activeTokenAddress && stableAddress && quoteAddress && marketMode === 'direct'
      ? {
          chainId: activeToken.chainId,
          fromBucketMs,
          stableAddress,
          tokenAddress: activeTokenAddress,
          quoteAddress,
          timeFrame,
        }
      : skipToken

  const baseToStableQueryArgs =
    activeToken && activeTokenAddress && stableAddress && quoteToken && quoteAddress && marketMode === 'derived'
      ? {
          chainId: activeToken.chainId,
          fromBucketMs,
          stableAddress,
          tokenAddress: activeTokenAddress,
          quoteAddress: stableAddress,
          timeFrame,
        }
      : skipToken

  const quoteToStableQueryArgs =
    quoteToken && quoteAddress && stableAddress && marketMode === 'derived'
      ? {
          chainId: quoteToken.chainId,
          fromBucketMs,
          stableAddress,
          tokenAddress: quoteAddress,
          quoteAddress: stableAddress,
          timeFrame,
        }
      : skipToken

  const {
    data: directPriceData,
    isError: isDirectError,
    isLoading: isDirectLoading,
  } = useTokenPriceChartQuery(directQueryArgs)
  const {
    data: baseToStablePriceData,
    isError: isBaseToStableError,
    isLoading: isBaseToStableLoading,
  } = useTokenPriceChartQuery(baseToStableQueryArgs)
  const {
    data: quoteToStablePriceData,
    isError: isQuoteToStableError,
    isLoading: isQuoteToStableLoading,
  } = useTokenPriceChartQuery(quoteToStableQueryArgs)

  const marketData = useMemo<MarketData>(() => {
    if (marketMode === 'derived') {
      return {
        chartData: getDerivedChartData(baseToStablePriceData?.candles, quoteToStablePriceData?.candles),
        currentPrice:
          baseToStablePriceData && quoteToStablePriceData
            ? getDerivedCurrentPrice(baseToStablePriceData, quoteToStablePriceData)
            : undefined,
        isError: isBaseToStableError || isQuoteToStableError,
        isLoading: isBaseToStableLoading || isQuoteToStableLoading,
        priceChange:
          baseToStablePriceData && quoteToStablePriceData
            ? getDerived24hPriceChange(baseToStablePriceData, quoteToStablePriceData)
            : undefined,
      }
    }

    return {
      chartData: getChartData(directPriceData?.candles),
      currentPrice: directPriceData?.currentPrice,
      isError: isDirectError,
      isLoading: isDirectLoading,
      priceChange: directPriceData?.priceChange,
    }
  }, [
    baseToStablePriceData,
    directPriceData,
    isBaseToStableError,
    isBaseToStableLoading,
    isDirectError,
    isDirectLoading,
    isQuoteToStableError,
    isQuoteToStableLoading,
    marketMode,
    quoteToStablePriceData,
  ])

  const chartData = useMemo(() => {
    if (!isStablePair) return marketData.chartData

    const sourceData = marketData.chartData.length
      ? marketData.chartData
      : getPeggedFallbackChartData(fromBucketMs, timeFrame)

    return getPeggedChartData(sourceData)
  }, [fromBucketMs, isStablePair, marketData.chartData, timeFrame])

  const currentPrice = isStablePair ? PEGGED_PRICE : marketData.currentPrice
  const priceChange = isStablePair ? 0 : marketData.priceChange
  const lastCandle = chartData.at(-1)
  const displayPrice = currentPrice ?? lastCandle?.close
  const priceChangeColor = priceChange === undefined || priceChange >= 0 ? upCandleColor : downCandleColor
  const isLoading = isStablePair ? false : marketData.isLoading
  const isError = isStablePair ? false : marketData.isError

  const getTabQuoteToken = (token: Currency) =>
    hasQuoteStableInPair && pairQuoteToken && getCurrencyKey(token) !== pairQuoteTokenKey
      ? pairQuoteToken
      : dedupedTokenTabs.find(tab => getCurrencyKey(tab.token) !== getCurrencyKey(token))?.token ||
        DEFAULT_OUTPUT_TOKEN_BY_CHAIN[token.chainId]

  useEffect(() => {
    if (!activeTokenAddress || !stableAddress || !quoteAddress) return

    setFromBucketMs(getDefaultFromBucketMs(timeFrame))
  }, [activeTokenAddress, quoteAddress, stableAddress, timeFrame])

  const fitContentKey = `${activeTokenAddress || 'unknown'}:${quoteAddress || 'unknown'}:${timeFrame}:${
    isStablePair ? 'pegged' : 'market'
  }`

  return (
    <ChartPanel gap={0}>
      {tokenTabs.length ? (
        <PanelHeader role="tablist">
          {tokenTabs.map((tab, index) => {
            const quoteSymbol = getTabQuoteToken(tab.token)?.symbol || 'USDT'

            return (
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
                  {tab.token.symbol}/{quoteSymbol}
                </Text>
              </TabButton>
            )
          })}
        </PanelHeader>
      ) : null}

      <Stack p={16} gap={12}>
        <HStack align="flex-start" gap={16} justify="space-between" wrap="wrap">
          <Stack>
            {displayPrice !== undefined && priceChange !== undefined ? (
              <HStack align="baseline" gap={8} wrap="wrap">
                <Text color={theme.text} fontSize={20} fontWeight={500}>
                  {formatPrice(displayPrice)} {quoteToken?.symbol}
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
                  (24h)
                </Text>
              </HStack>
            ) : null}
          </Stack>

          <SegmentedControl onChange={setTimeFrame} options={CHART_TIME_FRAME_OPTIONS} size="sm" value={timeFrame} />
        </HStack>

        {isStablePair ? (
          <Text color={theme.subText} fontSize={12}>
            Price is pegged.
          </Text>
        ) : null}

        <PoolChartState
          emptyMessage={
            activeToken
              ? stableToken
                ? 'Chart unavailable for this pair.'
                : 'No price chart stable token configured for this chain.'
              : 'Select a token to view the price chart.'
          }
          errorMessage="Unable to load token price."
          height={chartHeight}
          isEmpty={!lastCandle}
          isError={isError}
          isLoading={isLoading}
          skeletonType="candle"
        >
          <TokenPriceChartCanvas
            chartData={chartData}
            chartHeight={chartHeight}
            crosshairColor={crosshairColor}
            downCandleColor={downCandleColor}
            fitContentKey={fitContentKey}
            gridColor={gridColor}
            onFromBucketChange={setFromBucketMs}
            subTextColor={theme.subText}
            timeFrame={timeFrame}
            upCandleColor={upCandleColor}
            volumeDownColor={volumeDownColor}
            volumeUpColor={volumeUpColor}
          />
        </PoolChartState>
      </Stack>
    </ChartPanel>
  )
}

export default TokenPriceChart
