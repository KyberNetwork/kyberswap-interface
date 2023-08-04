import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryOauthDynamic } from 'services/baseQueryOauth'

import { NETWORKS_INFO } from 'constants/networks'

const coingeckoApi = createApi({
  reducerPath: 'coingeckoApi',
  baseQuery: baseQueryOauthDynamic({
    baseUrl: '',
  }),
  endpoints: builder => ({
    getMarketTokenInfo: builder.query<any, { chainId: ChainId; address: string; coingeckoAPI: string }>({
      query: ({ chainId, address, coingeckoAPI }) => ({
        url:
          address.toLowerCase() === WETH[chainId].address.toLowerCase()
            ? `${coingeckoAPI}/coins/${NETWORKS_INFO[chainId].coingeckoNativeTokenId}`
            : `${coingeckoAPI}/coins/${NETWORKS_INFO[chainId].coingeckoNetworkId}/contract/${address}`,
        authentication: true,
      }),
    }),
    getSecurityTokenInfo: builder.query<any, { chainId: ChainId; address: string }>({
      query: ({ chainId, address }) => ({
        url: `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`,
      }),
      transformResponse: (data: any, _, arg) => data?.result?.[arg.address.toLowerCase()],
    }),
  }),
})

// todo memo
// todo tracking
// todo rename this file ???
// todo (not for now) move basic chart api to this file
export const { useGetMarketTokenInfoQuery, useGetSecurityTokenInfoQuery } = coingeckoApi

export default coingeckoApi
