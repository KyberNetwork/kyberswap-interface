import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { NETWORKS_INFO } from 'constants/networks'

const coingeckoApi = createApi({
  reducerPath: 'coingeckoApi',
  baseQuery: baseQueryOauth({
    baseUrl: '',
  }),
  endpoints: builder => ({
    getMarketTokenInfo: builder.query<any, { chainId: ChainId; address: string; coingeckoAPI: string }>({
      query: ({ chainId, address, coingeckoAPI }) => ({
        url:
          address.toLowerCase() === WETH[chainId].address.toLowerCase()
            ? `${coingeckoAPI}/coins/${NETWORKS_INFO[chainId].coingeckoNativeTokenId}`
            : `${coingeckoAPI}/coins/${NETWORKS_INFO[chainId].coingeckoNetworkId}/contract/${address}`,
      }),
    }),
  }),
})

export const { useGetMarketTokenInfoQuery } = coingeckoApi

export default coingeckoApi
