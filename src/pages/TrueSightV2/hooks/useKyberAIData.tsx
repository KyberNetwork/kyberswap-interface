import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react'

import { KYBERAI_API } from 'constants/env'

import {
  ILiquidCEX,
  ILiveTrade,
  INetflowToCEX,
  INetflowToWhaleWallets,
  INumberOfHolders,
  INumberOfTrades,
  INumberOfTransfers,
  ITokenList,
  ITokenOverview,
  ITokenSearchResult,
  ITradingVolume,
  KyberAIListType,
  OHLCData,
} from '../types'

const kyberAIApi = createApi({
  reducerPath: 'kyberAIApi',
  baseQuery: fetchBaseQuery({
    baseUrl: KYBERAI_API,
  }),
  tagTypes: ['tokenOverview'],
  endpoints: builder => ({
    //1.
    tokenList: builder.query<
      { data: ITokenList[]; totalItems: number },
      { type?: KyberAIListType; chain?: string; page?: number; pageSize?: number }
    >({
      query: ({ type, chain, page, pageSize }) => ({
        url: '/tokens',
        params: { type: type || 'ALL', chain: chain || 'all', page: page || 1, size: pageSize || 10 },
      }),
      transformResponse: (res: any) => {
        if (res.code === 0) {
          return { data: res.data.data.contents, totalItems: res.data.paging.totalItems }
        }
        throw new Error(res.msg)
      },
    }),
    //2.
    addToWatchlist: builder.mutation({
      query: params => ({
        url: `/watchlist`,
        method: 'POST',
        params,
      }),
      invalidatesTags: (res, err, params) => [{ type: 'tokenOverview', id: params.tokenAddress }],
    }),
    //3.
    removeFromWatchlist: builder.mutation({
      query: params => ({
        url: `/watchlist`,
        method: 'DELETE',
        params,
      }),
      invalidatesTags: (res, err, params) => [{ type: 'tokenOverview', id: params.tokenAddress }],
    }),

    //4.
    tokenDetail: builder.query<ITokenOverview, { chain?: string; address?: string; account?: string }>({
      query: ({ chain, address, account }: { chain?: string; address?: string; account?: string }) => ({
        url: `/overview/${chain || 'ethereum'}/${address}`,
        params: { wallet: account },
      }),
      transformResponse: (res: any) => res.data,
      providesTags: result => [{ type: 'tokenOverview', id: result?.address }],
    }),
    //5.
    numberOfTrades: builder.query<INumberOfTrades[], string>({
      query: (tokenAddress?: string) => ({
        url: `/trades/ethereum/${tokenAddress}?from=1672531200&to=1673136000`,
      }),
      transformResponse: (res: any) => res.data,
    }),
    //6.
    tradingVolume: builder.query<
      ITradingVolume[],
      { chain?: string; address?: string; params?: { from: number; to: number } }
    >({
      query: ({ chain, address, params }) => ({
        url: `/volume/${chain}/${address}`,
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
    netflowToWhaleWallets: builder.query<
      INetflowToWhaleWallets[],
      { chain?: string; address?: string; from: number; to: number }
    >({
      query: ({ chain, address, from, to }) => ({
        url: `/netflow/${chain}/${address?.toLowerCase()}`,
        params: { from, to },
      }),
      transformResponse: (res: any) => res.data,
    }),
    //8.
    netflowToCEX: builder.query<INetflowToCEX[], { chain?: string; address?: string; from: number; to: number }>({
      query: ({ chain, address, from, to }) => ({
        url: `/netflow/cexes/${chain}/${address?.toLowerCase()}`,
        params: { from, to },
      }),
      transformResponse: (res: any) => res.data,
    }),
    //9.
    numberOfHolders: builder.query<INumberOfHolders[], { chain?: string; address?: string; from: number; to: number }>({
      query: ({ chain, address, from, to }) => ({
        url: `/holdersNum/${chain}/${address}`,
        params: { from, to },
      }),
      transformResponse: (res: any) => res.data,
    }),
    //10.
    holderList: builder.query({
      query: ({ address }) => ({
        url: `/holders/ethereum/${address}?page=1&pageSize=25`,
      }),
      transformResponse: (res: any) => {
        console.log(res)
        return res?.data
      },
    }),
    //11.
    chartingData: builder.query<
      OHLCData[],
      { chain: string; address: string; from: number; to: number; candleSize: string; currency: string }
    >({
      query: ({ chain, address, from, to, candleSize, currency }) => ({
        url: `/ohlcv/${chain}/${address}`,
        params: { from, to, candleSize, currency },
      }),
      transformResponse: (res: any) => {
        if (res.code === 0) {
          return res.data.ohlc
        }
      },
    }),
    //13.
    fundingRate: builder.query({
      query: ({ tokenAddress }) => ({ url: `/funding-rate/ethereum/${tokenAddress}` }),
      transformResponse: (res: any) => {
        if (res.code === 0) {
          return res.data
        }
        throw new Error(res.msg)
      },
    }),
    //14.
    liveDexTrades: builder.query<ILiveTrade[], { chain: string; address: string }>({
      query: ({ chain, address }) => ({ url: `/live-trades/${chain}/${address}` }),
      transformResponse: (res: any) => {
        if (res.code === 0) {
          return res.data
        }
        throw new Error(res.msg)
      },
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
    transferInformation: builder.query<
      INumberOfTransfers[],
      { chain?: string; address?: string; from: number; to: number }
    >({
      query: ({ chain, address, from, to }) => ({
        url: `/transfer/${chain}/${address}`,
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
  useFundingRateQuery,
} = kyberAIApi
export const { useCexesInfoQuery } = coinglassApi
export default kyberAIApi
