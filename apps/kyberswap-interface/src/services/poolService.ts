import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface PoolDetail {
  address: string
  reserveUsd: string
  amplifiedTvl: string
  swapFee: number
  exchange: string
  type: string
  reserves: Array<string>
  tokens: Array<{
    address: string
    name: string
    symbol: string
    decimals: number
    weight: number
    swappable: boolean
  }>
  positionInfo: {
    liquidity: string
    sqrtPriceX96: string
    tickSpacing: number
    tick: number
    ticks: Array<{
      index: number
      liquidityGross: number
      liquidityNet: number
    }>
  }
}

const poolServiceApi = createApi({
  reducerPath: 'poolServiceApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_BFF_API }),
  keepUnusedDataFor: 1,
  endpoints: builder => ({
    poolDetail: builder.query<PoolDetail, { chainId: number; ids: string }>({
      query: params => ({
        url: `/v1/pools`,
        params,
      }),
      transformResponse: (response: {
        data: {
          pools: Array<PoolDetail>
        }
      }) => response.data.pools?.[0] || {},
    }),
  }),
})

export const { usePoolDetailQuery } = poolServiceApi

export default poolServiceApi
