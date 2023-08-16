import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { BLOCK_SERVICE_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'

const blockServiceApi = createApi({
  reducerPath: 'blockServiceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BLOCK_SERVICE_API,
  }),
  endpoints: builder => ({
    getBlocks: builder.query<
      { data: Array<{ number: number; timestamp: number }> },
      { chainId: ChainId; timestamps: number[] }
    >({
      query: ({ chainId, timestamps }) => ({
        url: `/${NETWORKS_INFO[chainId].aggregatorRoute}/api/v1/block?timestamps=${timestamps.join(',')}`,
      }),
    }),
  }),
})

export const { useLazyGetBlocksQuery } = blockServiceApi

export default blockServiceApi
