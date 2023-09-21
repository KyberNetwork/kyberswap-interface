import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { POOL_FARM_BASE_URL } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { SubgraphFarmV2 } from 'state/farms/elasticv2/types'

const knProtocolApi = createApi({
  reducerPath: 'knProtocol',
  baseQuery: fetchBaseQuery({ baseUrl: POOL_FARM_BASE_URL }),
  endpoints: builder => ({
    getFarmV2: builder.query<{ data: { data: SubgraphFarmV2[] } }, ChainId>({
      query: (chainId: ChainId) => ({
        url: `/${
          (NETWORKS_INFO[chainId] as EVMNetworkInfo).poolFarmRoute
        }/api/v1/elastic-new/farm-v2?perPage=1000&page=1`,
      }),
    }),
  }),
})

export default knProtocolApi
export const { useLazyGetFarmV2Query } = knProtocolApi
