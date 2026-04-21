import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export type TokenChartTimeFrame = '5m' | '15m' | '1h' | '4h' | '1d' | '7d'

export const TOKEN_CHART_CANDLE_INTERVAL_MS: Record<TokenChartTimeFrame, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
}

const TOKEN_CHART_FETCH_CANDLE_COUNT = 200

const getTokenChartAlignedBucketMs = ({
  bucketMs = Date.now(),
  timeFrame,
}: {
  bucketMs?: number
  timeFrame: TokenChartTimeFrame
}) => {
  const bucketIntervalMs = TOKEN_CHART_CANDLE_INTERVAL_MS[timeFrame]

  return Math.floor(bucketMs / bucketIntervalMs) * bucketIntervalMs
}

export const getTokenChartFromBucketMs = ({
  candleCount = TOKEN_CHART_FETCH_CANDLE_COUNT,
  toBucketMs = Date.now(),
  timeFrame,
}: {
  candleCount?: number
  toBucketMs?: number
  timeFrame: TokenChartTimeFrame
}) => {
  const bucketIntervalMs = TOKEN_CHART_CANDLE_INTERVAL_MS[timeFrame]
  const alignedEndBucketMs = getTokenChartAlignedBucketMs({ bucketMs: toBucketMs, timeFrame })

  return alignedEndBucketMs - bucketIntervalMs * Math.max(candleCount, 0)
}

const TOKEN_CHART_SERVICE_BASE_URL = 'https://kd-api.kyberswap.com'

export type TokenChartCandle = {
  bucket: string
  changePercent?: number
  close: number
  high: number
  low: number
  open: number
  rangePercent?: number
  transactions?: number
  volume?: number
}

export type TokenChartData = {
  candles: Array<TokenChartCandle>
  change24h: number
  latestPrice: number
  quoteAddress?: string
  summary?: {
    periodClose: number
    periodEndMs: number
    periodHigh: number
    periodLow: number
    periodOpen: number
    periodStartMs: number
    priceChange: number
    priceChangeDirection: string
  }
  tokenAddress?: string
}

export type TokenChartQueryParams = {
  chainId: number
  tokenAddress: string
  stableAddress?: string
  quoteAddress?: string
  timeFrame: TokenChartTimeFrame
  fromBucketMs: number
  toBucketMs?: number
}

type TokenChartApiResponse = {
  code: number
  data: TokenChartData
  message: string
}

const getAverage = (values: number[]) => {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const getRangePercentFromCandle = ({ high, low }: Pick<TokenChartCandle, 'high' | 'low'>) =>
  low > 0 ? ((high - low) / low) * 100 : undefined

const getNeighborCandles = (candles: TokenChartCandle[], index: number) => {
  const neighbors: TokenChartCandle[] = []
  const neighborsNeed = 10
  let offset = 1
  while (neighbors.length < neighborsNeed && (index - offset >= 0 || index + offset < candles.length)) {
    if (index - offset >= 0) {
      neighbors.push(candles[index - offset])
    }
    if (neighbors.length >= neighborsNeed) break
    if (index + offset < candles.length) {
      neighbors.push(candles[index + offset])
    }
    offset += 1
  }
  return neighbors
}

/**
 * Clamp abnormal high/low spikes by comparing a candle against the 10 nearest candles around it.
 */
export const sanitizeTokenChartCandles = (candles: TokenChartCandle[]) => {
  if (candles.length <= 2) return candles

  return [...candles]
    .sort((a, b) => Date.parse(a.bucket) - Date.parse(b.bucket))
    .map((candle, index, candles) => {
      const neighborCandles = getNeighborCandles(candles, index)
      const averageNeighborHigh = getAverage(neighborCandles.map(neighbor => neighbor.high))
      const averageNeighborLow = getAverage(neighborCandles.map(neighbor => neighbor.low))

      const nextHigh = candle.high > averageNeighborHigh * 3 ? averageNeighborHigh * 2 : candle.high
      const nextLow = candle.low > averageNeighborLow * 3 ? averageNeighborLow * 2 : candle.low

      if (nextHigh === candle.high && nextLow === candle.low) return candle

      return {
        ...candle,
        high: nextHigh,
        low: nextLow,
        rangePercent: getRangePercentFromCandle({ low: nextLow, high: nextHigh }),
      }
    })
}

const tokenChartApi = createApi({
  reducerPath: 'tokenChartApi',
  baseQuery: fetchBaseQuery({
    baseUrl: TOKEN_CHART_SERVICE_BASE_URL + '/api/v1',
  }),
  keepUnusedDataFor: 1,
  endpoints: builder => ({
    tokenPriceChart: builder.query<TokenChartData, TokenChartQueryParams>({
      query: ({ chainId, fromBucketMs, quoteAddress, stableAddress, toBucketMs, tokenAddress, timeFrame }) => ({
        url: `/tokens/${chainId}/${tokenAddress}/price-chart`,
        params: {
          stable: stableAddress,
          quote: quoteAddress,
          timeFrame,
          fromBucketMs,
          toBucketMs,
        },
      }),
      transformResponse: (response: TokenChartApiResponse) => {
        return {
          ...response.data,
          candles: sanitizeTokenChartCandles(response.data.candles),
        }
      },
    }),
  }),
})

export const { useLazyTokenPriceChartQuery, useTokenPriceChartQuery } = tokenChartApi

export default tokenChartApi
