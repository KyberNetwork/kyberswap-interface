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

const tokenChartApi = createApi({
  reducerPath: 'tokenChartApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_KYBER_AI_API_URL + '/v1',
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
      transformResponse: (response: TokenChartApiResponse) => response.data,
    }),
  }),
})

export const { useLazyTokenPriceChartQuery, useTokenPriceChartQuery } = tokenChartApi

export default tokenChartApi
