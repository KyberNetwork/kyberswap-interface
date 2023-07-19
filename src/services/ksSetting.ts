import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Connection } from '@solana/web3.js'
import { ethers } from 'ethers'

import { KS_SETTING_API } from 'constants/env'
import { TokenInfo } from 'state/lists/wrappedTokenInfo'

export type KyberSwapConfig = {
  rpc: string
  prochart: boolean
  isEnableBlockService: boolean
  blockClient: ApolloClient<NormalizedCacheObject>
  classicClient: ApolloClient<NormalizedCacheObject>
  elasticClient: ApolloClient<NormalizedCacheObject>
  readProvider: ethers.providers.JsonRpcProvider | undefined
  connection: Connection | undefined
}

export type KyberSwapConfigResponse = {
  rpc: string
  prochart: boolean
  isEnableBlockService: boolean
  blockSubgraph: string
  classicSubgraph: string
  elasticSubgraph: string
}

export type KyberswapConfigurationResponse = {
  data: {
    config: KyberSwapConfigResponse
  }
}

export type KyberswapGlobalConfigurationResponse = {
  data: {
    config: {
      aggregator: string
      isEnableAuthenAggregator: boolean
    }
  }
}

export interface TokenListResponse {
  data: {
    pageination: {
      totalItems: number
    }
    tokens: Array<TokenInfo>
  }
}

const ksSettingApi = createApi({
  reducerPath: 'ksSettingConfigurationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${KS_SETTING_API}/v1`,
  }),
  endpoints: builder => ({
    getKyberswapConfiguration: builder.query<KyberswapConfigurationResponse, ChainId>({
      query: chainId => ({
        url: '/configurations/fetch',
        params: {
          serviceCode: `kyberswap-${chainId}`,
        },
      }),
    }),

    getKyberswapGlobalConfiguration: builder.query<KyberswapGlobalConfigurationResponse, void>({
      query: () => ({
        url: '/configurations/fetch',
        params: {
          serviceCode: `kyberswap`,
        },
      }),
    }),

    getTokenList: builder.query<
      TokenListResponse,
      { chainId: number; page: number; pageSize: number; isWhitelisted: boolean }
    >({
      query: ({ chainId, page, pageSize, isWhitelisted }) => ({
        url: `/tokens`,
        params: {
          chainIds: chainId,
          page,
          pageSize,
          isWhitelisted,
        },
      }),
    }),
  }),
})

export const {
  useGetKyberswapConfigurationQuery,
  useLazyGetKyberswapConfigurationQuery,
  useGetKyberswapGlobalConfigurationQuery,
  useLazyGetTokenListQuery,
} = ksSettingApi

export default ksSettingApi
