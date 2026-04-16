import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import dayjs from 'dayjs'

export type TokenChartTimeFrame = '5m' | '15m' | '1h' | '4h' | '1d' | '7d'

const TOKEN_CHART_SERVICE_BASE_URL = 'https://pre-kd-api.kyberengineering.io'

export type TokenChartCandle = {
  ts: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type TokenChartData = {
  timeFrame: TokenChartTimeFrame
  candles: Array<TokenChartCandle>
  currentPrice: number
  priceChange: number
}

type TokenChartQueryParams = {
  chainId: number
  fromBucketMs: number
  stableAddress: string
  quoteAddress: string
  tokenAddress: string
  timeFrame: TokenChartTimeFrame
}

type TokenChartApiCandle = {
  bucket: string
  close: number
  high: number
  low: number
  open: number
  volume?: number
}

type TokenChartApiResponse = {
  code: number
  data: {
    candles: Array<TokenChartApiCandle>
    change24h: number
    latestPrice: number
  }
  message: string
}

const tokenChartApi = createApi({
  reducerPath: 'tokenChartApi',
  baseQuery: fetchBaseQuery({
    baseUrl: TOKEN_CHART_SERVICE_BASE_URL + '/api/v1',
  }),
  keepUnusedDataFor: 1,
  endpoints: builder => ({
    tokenPriceChart: builder.query<TokenChartData, TokenChartQueryParams>({
      query: ({ chainId, fromBucketMs, quoteAddress, stableAddress, tokenAddress, timeFrame }) => ({
        url: `/tokens/${chainId}/${tokenAddress}/price-chart`,
        params: {
          stable: stableAddress,
          quote: quoteAddress,
          timeFrame,
          fromBucketMs,
        },
      }),
      transformResponse: (response: TokenChartApiResponse, _, { timeFrame }) => {
        const candles = response.data.candles
          .sort((a, b) => dayjs(a.bucket).valueOf() - dayjs(b.bucket).valueOf())
          .map(candle => ({
            ts: dayjs(candle.bucket).unix(),
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume ?? 0,
          }))

        return {
          timeFrame,
          candles,
          currentPrice: response.data.latestPrice,
          priceChange: response.data.change24h,
        }
      },
    }),
  }),
})

export const { useTokenPriceChartQuery } = tokenChartApi

export default tokenChartApi
