import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface QueryParams {
  // name?: string
  // symbol?: string
  // address?: string
  // addresses?: string
  search?: string
  user?: string
  isFavorite?: boolean
  tags?: string
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
  asset_ids: number[]
  message: string
  signature: string
}

const blockServiceApi = createApi({
  reducerPath: 'marketOverviewApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://token-api.stg.kyberengineering.io/api',
  }),
  endpoints: builder => ({
    marketOverview: builder.query<Response, QueryParams>({
      query: params => ({
        url: `/v1/public/assets`,
        params: {
          ...params,
          chainIds: params.chainId,
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
  }),
})

export const { useMarketOverviewQuery, useAddFavoriteMutation } = blockServiceApi

export default blockServiceApi
