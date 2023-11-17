import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryOauthDynamic } from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import {
  NFTBalance,
  NFTTokenDetail,
  NftCollectionResponse,
  Portfolio,
  PortfolioSetting,
  PortfolioWallet,
  PortfolioWalletBalance,
  PortfolioWalletBalanceResponse,
  TokenAllowAnceResponse,
  TransactionHistoryResponse,
} from 'pages/NotificationCenter/Portfolio/type'

const KRYSTAL_API = 'https://api.krystal.app/all/v1'
const portfolioApi = createApi({
  reducerPath: 'portfolioApi',
  baseQuery: baseQueryOauthDynamic({ baseUrl: `${BFF_API}/v1/portfolio-service` }),
  tagTypes: [
    RTK_QUERY_TAGS.GET_LIST_PORTFOLIO,
    RTK_QUERY_TAGS.GET_LIST_WALLET_PORTFOLIO,
    RTK_QUERY_TAGS.GET_SETTING_PORTFOLIO,
    RTK_QUERY_TAGS.GET_FAVORITE_PORTFOLIO,
  ],
  endpoints: builder => ({
    getPortfolios: builder.query<Portfolio[], void>({
      query: () => ({
        url: '/portfolios',
        authentication: true,
      }),
      transformResponse: (data: any) => data?.data?.portfolios,
      providesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    getPortfolioById: builder.query<Portfolio, { id: string }>({
      query: ({ id }) => ({
        url: `/portfolios/${id}`,
        authentication: true,
      }),
      transformResponse: (data: any) => data?.data,
    }),
    searchPortfolio: builder.query<Portfolio[], { name: string }>({
      query: params => ({
        url: `https://portfolio-service-api.dev.kyberengineering.io/api/v1/portfolios/search`, // todo
        params,
      }),
      transformResponse: (data: any) => data?.data?.portfolios,
    }),
    getTrendingPortfolios: builder.query<Portfolio[], void>({
      query: () => ({
        url: `https://portfolio-service-api.dev.kyberengineering.io/api/v1/trending`, // todo
      }),
      transformResponse: (data: any) => data?.data,
    }),
    getFavoritesPortfolios: builder.query<string[], void>({
      query: () => ({
        url: `https://portfolio-service-api.dev.kyberengineering.io/api/v1/favorites`, // todo
        params: { identityId: window.identityId }, // todo
      }),
      transformResponse: (data: any) => data?.data?.favorites?.map((e: { value: string }) => e.value),
      providesTags: [RTK_QUERY_TAGS.GET_FAVORITE_PORTFOLIO],
    }),
    toggleFavoritePortfolio: builder.mutation<{ id: string }, { value: string; isAdd: boolean }>({
      query: ({ isAdd, ...body }) => ({
        url: '/favorites',
        method: isAdd ? 'POST' : 'DELETE',
        body,
        authentication: true,
      }),
      transformResponse: (data: any) => data?.data,
      invalidatesTags: [RTK_QUERY_TAGS.GET_FAVORITE_PORTFOLIO],
    }),
    createPortfolio: builder.mutation<{ id: string }, { name: string }>({
      query: body => ({
        url: '/portfolios',
        method: 'POST',
        body,
        authentication: true,
      }),
      transformResponse: (data: any) => data?.data,
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    clonePortfolio: builder.mutation<void, { name: string; portfolioId: string }>({
      query: body => ({
        url: '/portfolios/clone',
        method: 'POST',
        body,
        authentication: true,
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    updatePortfolio: builder.mutation<Portfolio, { name: string; id: string }>({
      query: ({ id, ...body }) => ({
        url: `/portfolios/${id}`,
        method: 'PUT',
        body,
        authentication: true,
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    deletePortfolio: builder.mutation<Portfolio, string>({
      query: id => ({
        url: `/portfolios/${id}`,
        method: 'DELETE',
        authentication: true,
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    // setting
    getPortfoliosSettings: builder.query<PortfolioSetting, void>({
      query: () => ({
        url: '/settings',
        authentication: true,
      }),
      transformResponse: (data: any) => data?.data,
      providesTags: [RTK_QUERY_TAGS.GET_SETTING_PORTFOLIO],
    }),
    updatePortfoliosSettings: builder.mutation<PortfolioSetting, PortfolioSetting>({
      query: body => ({
        url: `/settings`,
        method: 'PUT',
        body,
        authentication: true,
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_SETTING_PORTFOLIO],
    }),
    // wallets
    getWalletsPortfolios: builder.query<PortfolioWallet[], { portfolioId: string }>({
      query: ({ portfolioId }) => ({
        url: `/portfolios/${portfolioId}/wallets`,
        authentication: true,
      }),
      transformResponse: (data: any) => data?.data?.wallets,
      providesTags: [RTK_QUERY_TAGS.GET_LIST_WALLET_PORTFOLIO],
    }),
    addWalletToPortfolio: builder.mutation<Portfolio, { portfolioId: string; walletAddress: string; nickName: string }>(
      {
        query: ({ portfolioId, ...body }) => ({
          url: `/portfolios/${portfolioId}/wallets`,
          method: 'POST',
          body,
          authentication: true,
        }),
        invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_WALLET_PORTFOLIO],
      },
    ),
    updateWalletToPortfolio: builder.mutation<
      Portfolio,
      { portfolioId: string; walletAddress: string; nickName: string }
    >({
      query: ({ portfolioId, walletAddress, ...body }) => ({
        url: `/portfolios/${portfolioId}/wallets/${walletAddress}`,
        method: 'PUT',
        body,
        authentication: true,
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_WALLET_PORTFOLIO],
    }),
    removeWalletFromPortfolio: builder.mutation<Portfolio, { portfolioId: string; walletAddress: string }>({
      query: ({ portfolioId, walletAddress }) => ({
        url: `/portfolios/${portfolioId}/wallets/${walletAddress}`,
        method: 'DELETE',
        authentication: true,
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_WALLET_PORTFOLIO],
    }),
    // metadata
    getRealtimeBalance: builder.query<PortfolioWalletBalanceResponse, { query: string; chainIds?: ChainId[] }>({
      query: ({ query, chainIds }) => ({
        url: `/v1/real-time-data/${query}`,
        params: { chainIds },
      }),
      transformResponse: (data: any) => {
        const balances = data?.data?.balances
        if (balances)
          Object.keys(balances).forEach(wallet => {
            data.data.balances[wallet] = balances[wallet].map((el: PortfolioWalletBalance) => ({
              ...el,
              walletAddress: wallet,
              chainId: +el.chainId,
            }))
          })
        return data?.data
      },
    }),
    getTokenApproval: builder.query<TokenAllowAnceResponse, { address: string; chainIds?: ChainId[] }>({
      query: params => ({
        url: `${KRYSTAL_API}/approval/list`,
        params,
      }),
      transformResponse: (data: any) => data?.data,
    }),
    getNftCollections: builder.query<
      NftCollectionResponse,
      { addresses: string[]; chainIds?: ChainId[]; page: number; pageSize: number; search: string }
    >({
      query: params => ({
        url: `${KRYSTAL_API}/balance/listNftCollection`,
        params: { ...params, withNft: false },
      }),
      transformResponse: (data: any) => {
        data.data = data.data.map((chain: any) => chain.balances).flat()
        return data
      },
    }),
    getNftCollectionDetail: builder.query<
      NFTBalance,
      {
        address: string
        chainId: ChainId
        page: number
        pageSize: number
        search: string
        collectionAddress: string
      }
    >({
      query: params => ({
        url: `${KRYSTAL_API}/balance/listNftInCollection`,
        params,
      }),
      transformResponse: (data: any) => data?.data,
    }),
    getNftDetail: builder.query<
      NFTTokenDetail,
      {
        address: string
        chainId: ChainId | undefined
        tokenID: string
      }
    >({
      query: params => ({
        url: `${KRYSTAL_API}/nft/getNftDetail`,
        params,
      }),
      transformResponse: (data: any) => data?.data,
    }),
    getTransactions: builder.query<
      TransactionHistoryResponse,
      {
        walletAddress: string
        chainIds?: ChainId[]
        limit: number
        endTime: number
        tokenAddress?: string
        tokenSymbol?: string
      }
    >({
      query: params => ({
        url: `${KRYSTAL_API}/txHistory/getHistory`,
        params,
      }),
    }),
  }),
})

export const {
  useGetPortfoliosQuery,
  useCreatePortfolioMutation,
  useUpdatePortfolioMutation,
  useGetRealtimeBalanceQuery,
  useLazyGetTokenApprovalQuery,
  useGetTransactionsQuery,
  useDeletePortfolioMutation,
  useAddWalletToPortfolioMutation,
  useGetWalletsPortfoliosQuery,
  useRemoveWalletFromPortfolioMutation,
  useUpdateWalletToPortfolioMutation,
  useGetPortfolioByIdQuery,
  useClonePortfolioMutation,
  useGetPortfoliosSettingsQuery,
  useUpdatePortfoliosSettingsMutation,
  useGetFavoritesPortfoliosQuery,
  useGetTrendingPortfoliosQuery,
  useSearchPortfolioQuery,
  useToggleFavoritePortfolioMutation,
  useGetNftCollectionsQuery,
  useGetNftCollectionDetailQuery,
  useGetNftDetailQuery,
} = portfolioApi

export default portfolioApi
