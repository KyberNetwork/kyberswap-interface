import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { LimitOrder } from 'components/swapv2/LimitOrder/type'
import { LIMIT_ORDER_API_READ } from 'constants/env'

const limitOrderApi = createApi({
  reducerPath: 'limitOrderApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  endpoints: builder => ({
    getLOContractAddress: builder.query<string, ChainId>({
      query: chainId => ({
        url:
          'https://limit-order.stg.kyberengineering.io/read-ks/api/v1/orders?chainId=137&maker=0x9d49033a19238F9FB6e8229Eaa913C48b6758998&status=active&query=&page=1&pageSize=10' ||
          `${LIMIT_ORDER_API_READ}/v1/config/contract_address`,
        params: { chainId },
      }),
      transformResponse: (data: any) => '0x227B0c196eA8db17A665EA6824D972A64202E936' || data?.data?.latest,
    }),
    getListOrders: builder.query<
      { orders: LimitOrder[]; totalOrder: number },
      {
        chainId: ChainId
        maker: string | undefined
        status: string
        query: string
        page: number
        pageSize: number
      }
    >({
      query: params => ({
        url: `${LIMIT_ORDER_API_READ}/v1/orders`,
        params,
      }),
      transformResponse: ({ data }: any) => {
        data.orders.forEach((order: any) => {
          order.chainId = Number(order.chainId) as ChainId
        })
        return { orders: data?.orders || [], totalOrder: data?.pagination?.totalItems || 0 }
      },
    }),
  }),
})

// todo danh (later, move all api to this file)
export const { useGetLOContractAddressQuery, useGetListOrdersQuery } = limitOrderApi

export default limitOrderApi
