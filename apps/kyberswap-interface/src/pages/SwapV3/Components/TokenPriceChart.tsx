import { ChainId, type Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useInfiniteQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'react-feather'
import { useMedia } from 'react-use'
import {
  TOKEN_CHART_CANDLE_INTERVAL_MS,
  type TokenChartCandle,
  type TokenChartQueryParams,
  type TokenChartTimeFrame,
  getTokenChartFromBucketMs,
  useLazyTokenPriceChartQuery,
  useTokenPriceChartQuery,
} from 'services/tokenChart'

import CurrencyLogo from 'components/CurrencyLogo'
import SegmentedControl from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { PRICE_CHART_QUOTE_TOKEN_BY_CHAIN } from 'constants/tokens'
import useTheme from 'hooks/useTheme'
import { formatPrice, formatSignedPercent } from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState, { PoolChartSkeleton } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

import type { DisplayCandle } from './TokenPriceChartCanvas'

const TokenPriceChartCanvas = lazy(() => import('./TokenPriceChartCanvas'))

const CHART_TIME_FRAME_OPTIONS = [
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '24h', value: '1d' },
  { label: '1W', value: '7d' },
] as const

const getCurrencyKey = (currency: Currency) => {
  if (currency.isNative) {
    return `${currency.chainId}-${currency.symbol}-native`
  }
  return currency.wrapped.address.toLowerCase()
}

const mergeTokenChartCandles = (candles: TokenChartCandle[]) =>
  [...candles]
    .sort((a, b) => dayjs(a.bucket).valueOf() - dayjs(b.bucket).valueOf())
    .filter((candle, index, array) => index === 0 || candle.bucket !== array[index - 1]?.bucket)

const countRecentTransactions = (candles: TokenChartCandle[], count: number) => {
  return candles.slice(-count).reduce((total, candle) => total + (candle.transactions ?? 0), 0)
}

type TokenPriceChartProps = {
  tokens?: Array<Currency | undefined>
}

const TokenPriceChart = ({ tokens }: TokenPriceChartProps) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const chainId = tokens?.find(Boolean)?.chainId || ChainId.MAINNET

  const filteredTokens = useMemo(() => {
    return (tokens ?? []).reduce<Currency[]>((result, token) => {
      if (!token) return result

      const currencyKey = getCurrencyKey(token)
      const quoteStableToken = PRICE_CHART_QUOTE_TOKEN_BY_CHAIN[token.chainId]
      const quoteStableTokenKey = quoteStableToken ? getCurrencyKey(quoteStableToken) : ''
      if (currencyKey === quoteStableTokenKey) return result

      return result.concat(token)
    }, [])
  }, [tokens])

  const [timeFrame, setTimeFrame] = useState<TokenChartTimeFrame>('1d')
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(!upToSmall)

  const resolvedActiveTabIndex = activeTabIndex < filteredTokens.length ? activeTabIndex : 0
  const activeToken = filteredTokens[resolvedActiveTabIndex] ?? filteredTokens[0]
  const activeTokenAddress = activeToken?.wrapped.address.toLowerCase()

  const stableToken = PRICE_CHART_QUOTE_TOKEN_BY_CHAIN[chainId]
  const stableAddress = stableToken?.wrapped.address.toLowerCase()
  const fromBucketMs = useMemo(() => getTokenChartFromBucketMs({ timeFrame }), [timeFrame])
  const chartRequestKey = `${chainId}:${activeTokenAddress}:${stableAddress}:${timeFrame}`

  useEffect(() => {
    setActiveTabIndex(0)
  }, [filteredTokens.length])

  useEffect(() => {
    setIsExpanded(!upToSmall)
  }, [upToSmall])

  const [fetchTokenChart] = useLazyTokenPriceChartQuery()

  const initialQueryParams: TokenChartQueryParams = {
    chainId,
    tokenAddress: activeTokenAddress as string,
    stableAddress,
    quoteAddress: stableAddress,
    timeFrame,
    fromBucketMs,
  }

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['token-price-chart', chartRequestKey, fromBucketMs],
    enabled: Boolean(activeTokenAddress && stableAddress),
    initialPageParam: initialQueryParams,
    queryFn: async ({ pageParam }) => fetchTokenChart(pageParam).unwrap(),
    getNextPageParam: lastPage => {
      if (!lastPage?.candles.length) return undefined

      const lastPagePeriodStartMs = lastPage.summary?.periodStartMs
      if (!lastPagePeriodStartMs) return undefined

      const toBucketMs = lastPagePeriodStartMs - TOKEN_CHART_CANDLE_INTERVAL_MS[timeFrame]

      return {
        ...initialQueryParams,
        fromBucketMs: getTokenChartFromBucketMs({ toBucketMs, timeFrame }),
        toBucketMs,
      }
    },
  })

  const { currentData: activityData, isLoading: isActivityLoading } = useTokenPriceChartQuery(
    {
      ...initialQueryParams,
      timeFrame: '1h',
      fromBucketMs: getTokenChartFromBucketMs({ timeFrame: '1h' }),
    },
    { skip: !activeTokenAddress || !stableAddress },
  )

  const handleLoadMore = async () => {
    if (!hasNextPage || isFetchingNextPage) return
    await fetchNextPage()
  }

  const accumulatedCandles = useMemo(
    () => mergeTokenChartCandles(infiniteData?.pages.flatMap(page => page?.candles ?? []) ?? []),
    [infiniteData?.pages],
  )
  const chartData = useMemo<DisplayCandle[]>(
    () =>
      accumulatedCandles.map(candle => ({
        ...candle,
        time: dayjs(candle.bucket).unix(),
        volume: candle.volume ?? 0,
      })),
    [accumulatedCandles],
  )

  const latestPageData = infiniteData?.pages[0]
  const currentPrice = latestPageData?.latestPrice ?? chartData.at(-1)?.close
  const priceChange = latestPageData?.change24h ?? 0
  const priceChangeColor = priceChange >= 0 ? theme.primary : theme.red

  const activityCandles = useMemo(() => activityData?.candles ?? [], [activityData?.candles])
  const shouldUseActivityState = activityCandles.length > 0
  const shouldHideChartForNoActivity = shouldUseActivityState && countRecentTransactions(activityCandles, 24 * 7) < 1
  const shouldShowLowActivityWarning = shouldUseActivityState && countRecentTransactions(activityCandles, 24) < 5

  if (!activeToken || !stableToken) return null

  const settlementPriceTooltip = (
    <Stack gap={4} align="flex-start">
      <span className="text-xs text-subText">
        <Trans>
          Prices are tracked by KyberSwap from on-chain settlement data, tracked and calculated by KyberSwap, from
          actual on-chain swap events across supported DEX liquidity sources — not aggregated feeds or oracle data.
          Values may differ from prices on other platforms.
        </Trans>
      </span>
      <ExternalLink href="https://docs.kyberswap.com/developer-guide/start-here/foundational-solutions/token-settlement-price">
        <Trans>Learn more about KyberSwap Settlement Prices</Trans>
      </ExternalLink>
    </Stack>
  )

  return (
    <Stack gap={0} className="overflow-hidden rounded-xl border border-darkBorder">
      <HStack align="center" gap={12} pr={16}>
        <div role="tablist" className="flex min-w-0 flex-1 items-center overflow-x-auto">
          {filteredTokens.map((token, index) => {
            const isActive = index === resolvedActiveTabIndex
            const isLast = index === filteredTokens.length - 1
            return (
              <button
                type="button"
                key={getCurrencyKey(token)}
                onClick={() => {
                  setActiveTabIndex(index)
                  setIsExpanded(true)
                }}
                className={cn(
                  'relative flex shrink-0 cursor-pointer items-center gap-1.5 border-0 px-4 py-3 text-sm font-medium',
                  !isLast && 'border-r border-darkBorder',
                  isActive
                    ? 'bg-primary/15 text-primary shadow-[inset_0_-2px_0_var(--ks-primary)] hover:bg-primary/15 hover:text-primary'
                    : 'bg-transparent text-subText hover:bg-tableHeader hover:text-text',
                )}
              >
                <CurrencyLogo currency={token} size="20px" />
                <span className="text-base font-medium" style={{ color: 'inherit' }}>
                  {token.symbol}/{stableToken?.symbol}
                </span>
              </button>
            )
          })}
        </div>

        {!upToSmall && (
          <MouseoverTooltip placement="top" text={settlementPriceTooltip} width="360px">
            <span className="block min-w-0 shrink basis-auto truncate text-sm italic text-subText transition-colors duration-150 hover:text-text">
              {t`Powered by KyberSwap Settlement Prices`}
            </span>
          </MouseoverTooltip>
        )}

        {upToSmall && (
          <button
            type="button"
            onClick={() => setIsExpanded(expanded => !expanded)}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 transition-colors duration-150 hover:bg-tableHeader"
          >
            <ChevronDown
              size={18}
              className={cn('text-subText transition-transform duration-150', isExpanded ? 'rotate-180' : 'rotate-0')}
            />
          </button>
        )}
      </HStack>

      {isExpanded && (
        <Stack p={16} className="border-t border-darkBorder">
          <Stack gap={12} position="relative">
            <HStack align="flex-start" gap={16} justify="space-between" wrap="wrap">
              <Stack>
                {currentPrice !== undefined && (
                  <HStack align="baseline" gap={8} wrap="nowrap">
                    <span className="text-xl font-medium text-text">{formatPrice(currentPrice)}</span>

                    <HStack align="center" gap={4}>
                      <span className="text-sm font-medium" style={{ color: priceChangeColor }}>
                        {formatSignedPercent(priceChange)}
                      </span>
                      <span className="text-[10px]" style={{ color: priceChangeColor }}>
                        {priceChange >= 0 ? '▲' : '▼'}
                      </span>
                    </HStack>
                    <span className="text-sm text-subText">(24h)</span>
                  </HStack>
                )}
              </Stack>

              <Stack ml="auto">
                <SegmentedControl
                  onChange={setTimeFrame}
                  options={CHART_TIME_FRAME_OPTIONS}
                  size="sm"
                  value={timeFrame}
                />
              </Stack>
            </HStack>

            <div className="relative rounded-lg">
              {shouldShowLowActivityWarning && (
                <HStack
                  align="center"
                  justify="center"
                  className="absolute top-0 z-10 rounded-lg border border-warning/25 bg-warning/10 p-2 text-warning"
                >
                  <MouseoverTooltip
                    placement="top"
                    text={
                      <span className="text-xs">
                        <Trans>Limited on-chain activity in the past 24h - price may not reflect tradable rates</Trans>
                      </span>
                    }
                  >
                    <AlertTriangle size={14} />
                  </MouseoverTooltip>
                </HStack>
              )}

              <PoolChartState
                key={chartRequestKey}
                emptyMessage={
                  activeToken ? 'Chart unavailable for this pair.' : 'Select a token to view the price chart.'
                }
                errorMessage="Unable to load token price."
                height={chartHeight}
                isEmpty={chartData.length === 0}
                isError={isError}
                isLoading={isLoading || isActivityLoading}
                skeletonType="candle"
              >
                <Suspense fallback={<PoolChartSkeleton height={chartHeight} type="candle" />}>
                  <TokenPriceChartCanvas
                    key={`${activeTokenAddress}:${stableAddress}:${timeFrame}`}
                    chartData={chartData}
                    canLoadMore={hasNextPage}
                    onLoadMore={handleLoadMore}
                    timeFrame={timeFrame}
                  />
                </Suspense>
              </PoolChartState>

              {shouldHideChartForNoActivity && (
                <Stack
                  align="center"
                  gap={8}
                  justify="center"
                  className="absolute inset-0 z-10 rounded-[inherit] border border-warning/25 p-3 text-center text-warning backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(28,28,28,0.6)' }}
                >
                  <AlertTriangle color={theme.warning} size={28} />
                  <span className="text-sm font-medium text-text">
                    <Trans>Not enough on-chain activity to display a reliable price chart for this token</Trans>
                  </span>
                </Stack>
              )}
            </div>

            {upToSmall && (
              <MouseoverTooltip placement="top" text={settlementPriceTooltip} width="280px">
                <span className="block min-w-0 shrink basis-auto truncate text-sm italic text-subText transition-colors duration-150 hover:text-text">
                  {t`Settlement Prices`}
                </span>
              </MouseoverTooltip>
            )}
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}

export default TokenPriceChart
