import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

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
    price: number
    priceChange24h: number
    priceChange1h: number
    priceChange7d: number
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
    baseUrl: import.meta.env.VITE_TOKEN_API,
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
      { data: { [chainId: string]: { [address: string]: number } } },
      { [chainId: number]: string[] }
    >({
      query: body => ({
        method: 'POST',
        body,
        url: 'v1/public/tokens/prices',
      }),
    }),
  }),
})

export const { useMarketOverviewQuery, useAddFavoriteMutation, useRemoveFavoriteMutation, useGetPricesMutation } =
  marketOverviewServiceApi

export default marketOverviewServiceApi
