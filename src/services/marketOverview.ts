import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { TOKEN_API_URL } from 'constants/env'

export interface QueryParams {
  // name?: string
  // symbol?: string
  // address?: string
  // addresses?: string
  search?: string
  user?: string
  isFavorite?: boolean
  tags: string[]
  sort?: string
  page?: number
  pageSize?: number
  chainId?: number
}

export interface AssetToken {
  id: number
  name: string
  symbol: string
  decimals: number
  logoURL: string
  type: string
  tags: string
  tokens: Array<{
    chainId: number
    address: string
    priceBuy: number
    priceBuyChange24h: number
    priceBuyChange1h: number
    priceBuyChange7d: number
    priceSell: number
    priceSellChange24h: number
    priceSellChange1h: number
    priceSellChange7d: number
  }>
  isStable: string
  volume24h: string
  marketCap: string
  allTimeLow: string
  allTimeHigh: string
  isFavorite: boolean
}

interface Response {
  data: {
    assets: Array<AssetToken>
    pagination: {
      totalItems: number
    }
  }
}

interface AddRemoveFavoriteParams {
  user: string
  assetIds: number[]
  message: string
  signature: string
}

const marketOverviewServiceApi = createApi({
  reducerPath: 'marketOverviewApi',
  baseQuery: fetchBaseQuery({
    baseUrl: TOKEN_API_URL,
  }),
  keepUnusedDataFor: 1,
  endpoints: builder => ({
    marketOverview: builder.query<Response, QueryParams>({
      query: params => ({
        url: `/v1/public/assets`,
        params: {
          ...params,
          chainIds: params.chainId,
          isFavorite: params.isFavorite || undefined,
          search: (params.search || '').trim(),
          tags: params.tags.length ? params.tags.join(',') : undefined,
        },
      }),
    }),
    addFavorite: builder.mutation<void, AddRemoveFavoriteParams>({
      query: body => ({
        method: 'POST',
        body,
        url: `/v1/public/assets/favorite`,
      }),
    }),
    removeFavorite: builder.mutation<void, AddRemoveFavoriteParams>({
      query: body => ({
        method: 'DELETE',
        body,
        url: `/v1/public/assets/favorite`,
      }),
    }),

    getPrices: builder.mutation<
      { data: { [chainId: string]: { [address: string]: { PriceBuy: number; PriceSell: number } } } },
      { [chainId: number]: string[] }
    >({
      query: body => ({
        method: 'POST',
        body,
        url: '/v1/public/tokens/prices',
      }),
    }),

    getQuoteByChain: builder.query<
      { data: { onchainPrice: { usdQuoteTokenByChainId: { [chain: string]: { symbol: string } } } } },
      void
    >({
      query: () => ({ url: '/v1/public/tokens/config' }),
    }),
  }),
})

export const {
  useMarketOverviewQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useGetPricesMutation,
  useGetQuoteByChainQuery,
} = marketOverviewServiceApi

export default marketOverviewServiceApi
