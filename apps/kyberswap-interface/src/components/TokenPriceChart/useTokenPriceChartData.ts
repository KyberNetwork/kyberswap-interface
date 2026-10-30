import { ChainId, type Currency } from '@kyberswap/ks-sdk-core'
import { useInfiniteQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import tokenChartApi, {
  TOKEN_CHART_CANDLE_INTERVAL_MS,
  type TokenChartCandle,
  type TokenChartQueryParams,
  type TokenChartTimeFrame,
  getTokenChartFromBucketMs,
  useTokenPriceChartQuery,
} from 'services/tokenChart'

import { PRICE_CHART_QUOTES } from 'constants/tokens'
import { useAppDispatch } from 'state/hooks'

const mergeTokenChartCandles = (candles: TokenChartCandle[]) =>
  [...candles]
    .sort((a, b) => dayjs(a.bucket).valueOf() - dayjs(b.bucket).valueOf())
    .filter((candle, index, array) => index === 0 || candle.bucket !== array[index - 1]?.bucket)

const countRecentTransactions = (candles: TokenChartCandle[], count: number) => {
  return candles.slice(-count).reduce((total, candle) => total + (candle.transactions ?? 0), 0)
}

/** Owns chart queries, pagination and candle derivation for one token/timeframe.
 * Cache identity includes chain, token and quote; activity uses currentData to avoid cross-token warnings. */
export const useTokenPriceChartData = (
  token: Currency | undefined,
  timeFrame: TokenChartTimeFrame,
  quoteCurrency?: Currency,
) => {
  const chainId = token?.chainId ?? ChainId.MAINNET
  const activeTokenAddress = token?.wrapped.address.toLowerCase()
  const stableToken = PRICE_CHART_QUOTES[chainId]
  const quoteToken = quoteCurrency ?? stableToken
  const quoteAddress = quoteToken?.wrapped.address.toLowerCase()
  const stableAddress = stableToken?.wrapped.address.toLowerCase()
  const fromBucketMs = useMemo(() => getTokenChartFromBucketMs({ timeFrame }), [timeFrame])
  const chartRequestKey = `${chainId}:${activeTokenAddress}:${quoteAddress}:${timeFrame}`
  const dispatch = useAppDispatch()

  const initialQueryParams: TokenChartQueryParams = {
    chainId,
    tokenAddress: activeTokenAddress as string,
    stableAddress,
    quoteAddress,
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
    enabled: Boolean(activeTokenAddress && stableAddress && quoteAddress),
    initialPageParam: initialQueryParams,
    queryFn: async ({ pageParam }) =>
      dispatch(
        tokenChartApi.endpoints.tokenPriceChart.initiate(pageParam, { subscribe: false, forceRefetch: true }),
      ).unwrap(),
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
    { skip: !activeTokenAddress || !stableAddress || !quoteAddress },
  )

  const handleLoadMore = async () => {
    if (!hasNextPage || isFetchingNextPage) return
    await fetchNextPage()
  }

  const accumulatedCandles = useMemo(
    () => mergeTokenChartCandles(infiniteData?.pages.flatMap(page => page?.candles ?? []) ?? []),
    [infiniteData?.pages],
  )
  const chartData = useMemo(
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
  const priceChange = latestPageData?.change24h

  const activityCandles = useMemo(() => activityData?.candles ?? [], [activityData?.candles])
  const shouldUseActivityState = activityCandles.length > 0
  const shouldHideChartForNoActivity = shouldUseActivityState && countRecentTransactions(activityCandles, 24 * 7) < 1
  const shouldShowLowActivityWarning = shouldUseActivityState && countRecentTransactions(activityCandles, 24) < 5

  return {
    stableToken,
    quoteToken,
    chartRequestKey,
    chartData,
    currentPrice,
    priceChange,
    isError,
    isLoading: isLoading || isActivityLoading,
    hasNextPage,
    handleLoadMore,
    shouldHideChartForNoActivity,
    shouldShowLowActivityWarning,
  }
}
