import { t } from '@lingui/macro'
import { createApi } from '@reduxjs/toolkit/dist/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { SelectOption } from 'components/Select'
import { BFF_API } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import { DEFAULT_PARAMS_BY_TAB } from 'pages/TrueSightV2/constants'
import { useIsWhiteListKyberAI } from 'state/user/hooks'

import {
  IAssetOverview,
  ICustomWatchlists,
  ILiquidCEX,
  ILiveTrade,
  INetflowToCEX,
  INetflowToWhaleWallets,
  INumberOfHolders,
  INumberOfTrades,
  INumberOfTransfers,
  ITokenList,
  ITokenSearchResult,
  ITradingVolume,
  KyberAIListType,
  OHLCData,
  QueryTokenParams,
} from '../types'

const kyberAIApi = createApi({
  reducerPath: 'kyberAIApi',
  baseQuery: baseQueryOauth({
    baseUrl: `${BFF_API}/v1/truesight`,
  }),
  tagTypes: [
    RTK_QUERY_TAGS.GET_TOKEN_OVERVIEW_KYBER_AI,
    RTK_QUERY_TAGS.GET_TOKEN_LIST_KYBER_AI,
    RTK_QUERY_TAGS.GET_WATCHLIST_TOKENS_KYBER_AI,
    RTK_QUERY_TAGS.GET_WATCHLIST_INFO_KYBER_AI,
  ],
  endpoints: builder => ({
    //1.
    tokenList: builder.query<{ data: ITokenList[]; totalItems: number }, QueryTokenParams>({
      query: ({ type, chain, page, pageSize, keywords, sort, ...filter }) => {
        const { secondarySort, ...defaultParams } = DEFAULT_PARAMS_BY_TAB[type as KyberAIListType] || {}
        const sortParam =
          sort || defaultParams.sort
            ? `${sort || defaultParams.sort}${secondarySort ? `,${secondarySort}` : ''}`
            : undefined
        return {
          url: '/assets',
          params: {
            ...defaultParams,
            ...filter,
            sort: sortParam,
            page: page || 1,
            pageSize: pageSize || 10,
            keywords,
          },
        }
      },
      transformResponse: (res: any) => {
        return { data: res.data.assets, totalItems: res.data.pagination.totalItems }
      },
      providesTags: (_, __, { type }) =>
        type === KyberAIListType.MYWATCHLIST
          ? [RTK_QUERY_TAGS.GET_WATCHLIST_TOKENS_KYBER_AI, RTK_QUERY_TAGS.GET_TOKEN_LIST_KYBER_AI]
          : [RTK_QUERY_TAGS.GET_TOKEN_LIST_KYBER_AI],
    }),
    assetOverview: builder.query<IAssetOverview, { assetId?: string }>({
      query: ({ assetId }: { assetId?: string }) => ({
        url: `/assets/${assetId}`,
      }),
      transformResponse: (res: any) => {
        // If token is stablecoin remove its kyberscore value
        if (res.data && res.data.tags?.includes('stablecoin')) {
          return { ...res.data, kyberScore: { ks3d: null, label: '', score: 0 } }
        }
        return res.data
      },
    }),
    //4.
    tokenOverview: builder.query<IAssetOverview, { chain?: string; address?: string }>({
      query: ({ chain, address }: { chain?: string; address?: string }) => ({
        url: `/overview/${chain}/${address}`,
      }),
      transformResponse: (res: any) => {
        // If token is stablecoin remove its kyberscore value
        if (res.data && res.data.tags?.includes('stablecoin')) {
          return { ...res.data, kyberScore: { ks3d: null, label: '', score: 0 } }
        }
        return res.data
      },
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
      query: ({ address, chain }) => ({
        url: `/holders/${chain}/${address}?page=1&pageSize=25`,
      }),
      transformResponse: (res: any) => res?.data?.holders,
    }),
    //11.
    chartingData: builder.query<
      OHLCData[],
      { chain?: string; address?: string; from: number; to: number; candleSize: string; currency: string }
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
      query: ({ address, chain }) => ({ url: `/funding-rate/${chain}/${address}` }),
      transformResponse: (res: any) => {
        if (res.code === 0) {
          return res.data
        }
        throw new Error(res.msg)
      },
    }),
    //14.
    liveDexTrades: builder.query<ILiveTrade[], { chain?: string; address?: string }>({
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
        totalVolUsd: {
          h1TotalVolUsd?: number
          h4TotalVolUsd?: number
          h12TotalVolUsd?: number
          h24TotalVolUsd?: number
        }
      },
      { tokenAddress?: string; chartSize?: '1d' | '7d' | '1m' | '3m' | string; chain?: string }
    >({
      query: ({
        tokenAddress,
        chartSize,
        chain,
      }: {
        tokenAddress?: string
        chartSize?: '1d' | '7d' | '1m' | '3m' | string
        chain?: string
      }) => ({
        url: `/cex/liquidation/${chain}/${tokenAddress}`,
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
    //19.
    addToWatchlist: builder.mutation({
      query: ({ userWatchlistId, assetId }: { userWatchlistId: number; assetId: number }) => ({
        url: `/watchlists/${userWatchlistId}/assets`,
        method: 'POST',
        params: { assetId },
      }),
      async onQueryStarted({ userWatchlistId, assetId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          kyberAIApi.util.updateQueryData('getWatchlistInformation', undefined, draft => {
            draft.totalUniqueAssetNumber += 1
            const watchlists = draft.watchlists.find(item => item.id === userWatchlistId)
            if (watchlists) {
              if (watchlists.assetIds) {
                watchlists.assetIds.push(assetId)
              } else {
                watchlists.assetIds = [assetId]
              }
              watchlists.assetNumber += 1
            }
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: (result, error) =>
        error ? [] : [RTK_QUERY_TAGS.GET_WATCHLIST_INFO_KYBER_AI, RTK_QUERY_TAGS.GET_WATCHLIST_TOKENS_KYBER_AI],
    }),
    //20.
    removeFromWatchlist: builder.mutation({
      query: ({ userWatchlistId, assetId }: { userWatchlistId: number; assetId: number }) => ({
        url: `/watchlists/${userWatchlistId}/assets`,
        method: 'DELETE',
        params: { assetId },
      }),
      async onQueryStarted({ userWatchlistId, assetId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          kyberAIApi.util.updateQueryData('getWatchlistInformation', undefined, draft => {
            draft.totalUniqueAssetNumber -= 1
            const watchlists = draft.watchlists.find(item => item.id === userWatchlistId)
            if (watchlists) {
              if (watchlists.assetIds) {
                const index = watchlists.assetIds.indexOf(assetId)
                watchlists.assetIds.splice(index, 1)
              }
              watchlists.assetNumber -= 1
            }
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: (_, error) =>
        error ? [] : [RTK_QUERY_TAGS.GET_WATCHLIST_INFO_KYBER_AI, RTK_QUERY_TAGS.GET_WATCHLIST_TOKENS_KYBER_AI],
    }),
    //21.
    createCustomWatchlist: builder.mutation({
      query: (params: { name: string }) => ({
        url: `/watchlists`,
        method: 'POST',
        params,
      }),
      invalidatesTags: (_, error) => (error ? [] : [RTK_QUERY_TAGS.GET_WATCHLIST_INFO_KYBER_AI]),
    }),
    //22.
    deleteCustomWatchlist: builder.mutation({
      query: (params: { ids: string }) => ({
        url: `/watchlists`,
        method: 'DELETE',
        params,
      }),
      invalidatesTags: (_, error) =>
        error ? [] : [RTK_QUERY_TAGS.GET_WATCHLIST_INFO_KYBER_AI, RTK_QUERY_TAGS.GET_WATCHLIST_TOKENS_KYBER_AI],
    }),
    //23.
    updateWatchlistsName: builder.mutation({
      query: ({ userWatchlistId, name }: { userWatchlistId: number; name: string }) => ({
        url: `/watchlists/${userWatchlistId}`,
        method: 'PUT',
        params: { name },
      }),
      async onQueryStarted({ userWatchlistId, name }, { dispatch }) {
        dispatch(
          kyberAIApi.util.updateQueryData('getWatchlistInformation', undefined, draft => {
            const watchlists = draft.watchlists.find(item => item.id === userWatchlistId)
            if (watchlists) {
              watchlists.name = name
            }
          }),
        )
      },
    }),
    //24.
    getWatchlistInformation: builder.query<{ totalUniqueAssetNumber: number; watchlists: ICustomWatchlists[] }, void>({
      query: () => ({
        url: `/watchlists/overview`,
      }),
      transformResponse: (res: any) => res.data,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        if (data.watchlists.length === 0) {
          await dispatch(kyberAIApi.endpoints.createCustomWatchlist.initiate({ name: t`My 1st Watchlists` }))
        }
      },
      providesTags: [RTK_QUERY_TAGS.GET_WATCHLIST_INFO_KYBER_AI],
    }),
    //26.
    updateCustomizedWatchlistsPriorities: builder.mutation({
      query: ({ orderedIds }: { orderedIds: string }) => ({
        url: `/watchlists/priorities`,
        method: 'PUT',
        params: { orderedIds },
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_WATCHLIST_INFO_KYBER_AI],
    }),
    getFilterCategories: builder.query<{ displayName: string; queryKey: string; values: SelectOption[] }[], void>({
      query: () => ({
        url: `/assets/filters`,
      }),
      transformResponse: (res: any) =>
        res.data.map((e: any) => ({
          ...e,
          values: [
            { label: t`All ${e.displayName}`, value: '' },
            ...e.values.map((opt: any) => ({ label: opt.displayName, value: opt.queryValue })),
          ],
        })),
    }),
  }),
})

export const useGetWatchlistInformationQuery = () => {
  const { isWhiteList } = useIsWhiteListKyberAI()

  const data = kyberAIApi.useGetWatchlistInformationQuery(undefined, { skip: !isWhiteList })

  return data
}

export const {
  useAssetOverviewQuery,
  useTokenOverviewQuery,
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
  useLazySearchTokenQuery,
  useFundingRateQuery,
  useCreateCustomWatchlistMutation,
  useDeleteCustomWatchlistMutation,
  useUpdateWatchlistsNameMutation,
  useUpdateCustomizedWatchlistsPrioritiesMutation,
  useGetFilterCategoriesQuery,
} = kyberAIApi
export default kyberAIApi
