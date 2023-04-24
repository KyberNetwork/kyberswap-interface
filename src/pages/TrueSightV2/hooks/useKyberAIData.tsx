import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react'

import { KYBERAI_API } from 'constants/env'

import {
  ILiquidCEX,
  INetflowToCEX,
  INetflowToWhaleWallets,
  INumberOfHolders,
  INumberOfTrades,
  INumberOfTransfers,
  ITokenOverview,
  ITokenSearchResult,
  ITradingVolume,
  OHLCData,
} from '../types'
import { HOLDER_LIST, TOKEN_LIST } from './sampleData'

const kyberAIApi = createApi({
  reducerPath: 'kyberAIApi',
  baseQuery: fetchBaseQuery({
    baseUrl: KYBERAI_API,
  }),
  endpoints: builder => ({
    //1.
    tokenList: builder.query({
      query: () => ({
        url: '/holders/ethereum/C/BTC',
      }),
      transformResponse: (res: any) => TOKEN_LIST,
    }),
    //2.
    addToWatchlist: builder.mutation({
      query: params => ({
        url: `/watchlist`,
        method: 'POST',
        params,
      }),
    }),
    //3.
    removeFromWatchlist: builder.mutation({
      query: params => ({
        url: `/watchlist`,
        method: 'DELETE',
        params,
      }),
    }),

    //4.
    tokenDetail: builder.query<ITokenOverview, { tokenAddress?: string; account?: string }>({
      query: ({ tokenAddress, account }: { tokenAddress?: string; account?: string }) => ({
        url: `/overview/ethereum/${tokenAddress}`,
        params: { wallet: account },
      }),
      transformResponse: (res: any) => res.data,
    }),
    //5.
    numberOfTrades: builder.query<INumberOfTrades[], string>({
      query: (tokenAddress?: string) => ({
        url: '/trades/ethereum/0xdAC17F958D2ee523a2206206994597C13D831ec7?from=1672531200&to=1673136000',
      }),
      transformResponse: (res: any) => res.data,
    }),
    //6.
    tradingVolume: builder.query<ITradingVolume[], { tokenAddress?: string; params?: { from: number; to: number } }>({
      query: ({ tokenAddress, params }) => ({
        url: '/volume/ethereum/0xdAC17F958D2ee523a2206206994597C13D831ec7',
        params,
      }),
      transformResponse: (res: any) => {
        const parsedData: ITradingVolume[] = []
        res.data.buy.forEach(
          (
            item: {
              numberOfTrade: number
              tradeVolume: number
              timestamp: number
            },
            index: number,
          ) => {
            parsedData.push({
              buy: item.numberOfTrade || 0,
              buyVolume: item.tradeVolume || 0,
              timestamp: item.timestamp || 0,
              sell: res.data.sell[index].numberOfTrade || 0,
              sellVolume: res.data.sell[index].tradeVolume || 0,
              totalVolume: (item.tradeVolume || 0) + (res.data.sell[index].tradeVolume || 0),
              totalTrade: (item.numberOfTrade || 0) + (res.data.sell[index].numberOfTrade || 0),
            })
          },
        )
        return parsedData
      },
    }),
    //7.
    netflowToWhaleWallets: builder.query<INetflowToWhaleWallets[], { tokenAddress?: string; from: number; to: number }>(
      {
        query: ({ tokenAddress, from, to }) => ({
          url: `/netflow/ethereum/${tokenAddress?.toLowerCase()}`,
          params: { from, to },
        }),
        transformResponse: (res: any) => res.data,
      },
    ),
    //8.
    netflowToCEX: builder.query<INetflowToCEX[], { tokenAddress?: string; from: number; to: number }>({
      query: ({ tokenAddress, from, to }) => ({
        url: `/netflow/cexes/ethereum/${tokenAddress?.toLowerCase()}`,
        params: { from, to },
      }),
      transformResponse: (res: any) => res.data,
    }),
    //9.
    numberOfHolders: builder.query<INumberOfHolders[], { tokenAddress?: string; from: number; to: number }>({
      query: ({ tokenAddress, from, to }) => ({
        url: `/holdersNum/ethereum/${tokenAddress}`,
        params: { from, to },
      }),
      transformResponse: (res: any) => res.data,
    }),
    //10.
    holderList: builder.query({
      query: () => ({
        url: '/holders/ethereum/0xdac17f958d2ee523a2206206994597c13d831ec7?from=1633344036&to=1675215565',
      }),
      transformResponse: (res: any) => HOLDER_LIST,
    }),
    //11.
    chartingData: builder.query<OHLCData[], { from: number; to: number; candleSize: string; currency: string }>({
      query: params => ({
        url: `/ohlcv/ethereum/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599`,
        params,
      }),
      transformResponse: (res: any) => {
        if (res.code === 0) {
          return res.data.ohlc
        }
      },
    }),
    //14.
    liveDexTrades: builder.query({
      query: ({ tokenAddress }) => ({ url: `/live-trades/ethereum/${tokenAddress}` }),
    }),
    //15.
    cexesLiquidation: builder.query<
      {
        chart: ILiquidCEX[]
        totalVolUsd: { h1TotalVolUsd: number; h4TotalVolUsd: number; h12TotalVolUsd: number; h24TotalVolUsd: number }
      },
      { tokenAddress?: string; chartSize?: '1d' | '7d' | '1m' | '3m' | string }
    >({
      query: ({
        tokenAddress,
        chartSize,
      }: {
        tokenAddress?: string
        chartSize?: '1d' | '7d' | '1m' | '3m' | string
      }) => ({
        url: `cex/liquidation/ethereum/${tokenAddress}`,
        params: { chartSize },
      }),
      transformResponse: (res: any) => {
        if (res.code === 0) {
          return res.data
        }
        throw new Error(res.msg)
      },
    }),
    //16.
    transferInformation: builder.query<INumberOfTransfers[], { tokenAddress?: string; from: number; to: number }>({
      query: ({ tokenAddress, from, to }) => ({
        url: `/transfer/ethereum/${tokenAddress}`,
        params: { from, to },
      }),
      transformResponse: (res: any) => res.data,
    }),
    //18.
    searchToken: builder.query<ITokenSearchResult[], { q?: string; size?: number }>({
      query: ({ q, size }) => ({
        url: `/tokens/search`,
        params: { q, size },
      }),
      transformResponse: (res: any) => res.data,
    }),
  }),
})

export const coinglassApi = createApi({
  reducerPath: 'coinglassApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://fapi.coinglass.com/api/',
  }),
  endpoints: builder => ({
    cexesInfo: builder.query({
      query: () => ({
        url: 'futures/liquidation/info?symbol=BTC&timeType=1&size=12',
      }),
      transformResponse: (res: any) => {
        if (res.success) {
          return undefined
        }
        throw new Error(res.msg)
      },
    }),
    fundingRate: builder.query({
      query: () => ({
        url: 'fundingRate/v2/home',
      }),
      transformResponse: (res: any) => {
        if (res.success) {
          return undefined
        }
        throw new Error(res.msg)
      },
    }),
  }),
})

export const {
  useTokenDetailQuery,
  useNumberOfTradesQuery,
  useTradingVolumeQuery,
  useNetflowToWhaleWalletsQuery,
  useNetflowToCEXQuery,
  useTransferInformationQuery,
  useNumberOfHoldersQuery,
  useHolderListQuery,
  useTokenListQuery,
  useLiveDexTradesQuery,
  useLazyChartingDataQuery,
  useChartingDataQuery,
  useAddToWatchlistMutation,
  useRemoveFromWatchlistMutation,
  useCexesLiquidationQuery,
  useSearchTokenQuery,
} = kyberAIApi
export const { useCexesInfoQuery, useFundingRateQuery } = coinglassApi
export default kyberAIApi
