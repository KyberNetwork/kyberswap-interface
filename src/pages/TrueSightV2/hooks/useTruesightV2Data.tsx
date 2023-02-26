import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react'

import { TRUESIGHT_V2_API } from 'constants/env'

import { testParams } from '../pages/SingleToken'
import { INetflowToWhaleWallets, INumberOfTrades, ITokenOverview, ITradeVolume } from '../types'
import { FUNDING_RATE, HOLDER_LIST, TOKEN_LIST } from './sampleData'

const truesightV2Api = createApi({
  reducerPath: 'truesightV2Api',
  baseQuery: fetchBaseQuery({
    baseUrl: TRUESIGHT_V2_API,
  }),
  endpoints: builder => ({
    tokenDetail: builder.query<ITokenOverview, string>({
      query: (tokenAddress?: string) => ({
        url: '/overview/ethereum/0xdAC17F958D2ee523a2206206994597C13D831ec7?wallet=0x91df32F497b4E4Ff2B779636a6ae438fc4246661',
      }),
    }),
    numberOfTrades: builder.query<INumberOfTrades[], string>({
      query: (tokenAddress?: string) => ({
        url: '/trades/ethereum/' + tokenAddress,
        params: {
          from: testParams.from,
          to: testParams.to,
        },
      }),
      transformResponse: (res: any) => res.data,
    }),
    tradingVolume: builder.query({
      query: (tokenAddress?: string) => ({
        url: '/volume/ethereum/' + tokenAddress,
        params: {
          from: testParams.from,
          to: testParams.to,
        },
      }),
      transformResponse: (res: any) => {
        const parsedData: {
          buy: number
          sell: number
          buyVolume: number
          sellVolume: number
          timestamp: number
        }[] = []
        res.data.buy.forEach((item: ITradeVolume, index: number) => {
          parsedData.push({
            buy: item.numberOfTrade || 0,
            buyVolume: item.tradeVolume || 0,
            timestamp: item.timestamp || 0,
            sell: res.data.sell[index].numberOfTrade || 0,
            sellVolume: res.data.sell[index].tradeVolume || 0,
          })
        })
        return parsedData
      },
    }),
    netflowToWhaleWallets: builder.query<INetflowToWhaleWallets[], string>({
      query: (tokenAddress?: string) => ({
        url: '/netflow/ethereum/0xdefa4e8a7bcba345f687a2f1456f5edd9ce97202?from=1675209600&to=1677801600',
      }),
      transformResponse: (res: any) => res.data,
    }),
    netflowToCEX: builder.query({
      query: () => ({
        url: '/netflow/cexes/ethereum/0xdac17f958d2ee523a2206206994597c13d831ec7?from=1675156545&to=1675761345',
      }),
      transformResponse: (res: any) => res.data,
    }),
    numberOfTransfers: builder.query({
      query: () => ({
        url: '/holdersNum/ethereum/0xdac17f958d2ee523a2206206994597c13d831ec7?from=1633344036&to=1675215565',
      }),
      transformResponse: (res: any) => res.data,
    }),
    numberOfHolders: builder.query({
      query: () => ({
        url: '/holdersNum/ethereum/0xdac17f958d2ee523a2206206994597c13d831ec7?from=1633344036&to=1675215565',
      }),
      transformResponse: (res: any) => res.data,
    }),
    holderList: builder.query({
      query: () => ({
        url: '/holders/ethereum/0xdac17f958d2ee523a2206206994597c13d831ec7?from=1633344036&to=1675215565',
      }),
      transformResponse: (res: any) => HOLDER_LIST,
    }),
    fundingRate: builder.query({
      query: () => ({
        url: '/holders/ethereum/C/BTC',
      }),
      transformResponse: (res: any) => FUNDING_RATE,
    }),
    tokenList: builder.query({
      query: () => ({
        url: '/holders/ethereum/C/BTC',
      }),
      transformResponse: (res: any) => TOKEN_LIST,
    }),
  }),
})

export const coinglassApi = createApi({
  reducerPath: 'coinglassApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://fapi.coinglass.com/api/futures/liquidation/',
  }),
  endpoints: builder => ({
    cexesLiquidation: builder.query({
      query: (timeframe?: string) => ({
        url: `chart?symbol=BTC&timeType=${(timeframe && { '1D': '11', '7D': '1', '1M': '4' }[timeframe]) || '1'}`,
      }),
      transformResponse: (res: any) => {
        if (res.success) {
          return res.data
        }
        throw new Error(res.msg)
      },
    }),
    cexesInfo: builder.query({
      query: () => ({
        url: 'info?symbol=BTC&timeType=1&size=12',
      }),
      transformResponse: (res: any) => {
        if (res.success) {
          return res.data
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
  useNumberOfTransfersQuery,
  useNumberOfHoldersQuery,
  useHolderListQuery,
  useFundingRateQuery,
  useTokenListQuery,
} = truesightV2Api
export const { useCexesLiquidationQuery, useCexesInfoQuery } = coinglassApi
export default truesightV2Api
