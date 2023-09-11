import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Connection } from '@solana/web3.js'

import { KS_SETTING_API } from 'constants/env'
import { AppJsonRpcProvider } from 'constants/providers'
import { ChainStateMap } from 'hooks/useChainsConfig'
import { TokenInfo } from 'state/lists/wrappedTokenInfo'
import { TopToken } from 'state/topTokens/type'

export type KyberSwapConfig = {
  rpc: string
  prochart: boolean
  isEnableBlockService: boolean
  blockClient: ApolloClient<NormalizedCacheObject>
  classicClient: ApolloClient<NormalizedCacheObject>
  elasticClient: ApolloClient<NormalizedCacheObject>
  readProvider: AppJsonRpcProvider | undefined
  connection: Connection | undefined
  commonTokens?: string[]
}

export type KyberSwapConfigResponse = {
  rpc: string
  prochart: boolean
  isEnableBlockService: boolean
  blockSubgraph: string
  classicSubgraph: string
  elasticSubgraph: string
  commonTokens?: string[]
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
      chainStates: ChainStateMap
    }
  }
}

export interface TokenListResponse<T = TokenInfo> {
  data: {
    pageination: {
      totalItems: number
    }
    tokens: Array<T>
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
    getChainsConfiguration: builder.query<{ chainId: string; name: string; icon: string }[], void>({
      query: () => ({
        url: '/configurations/fetch',
        params: {
          serviceCode: `chains`,
        },
      }),
      transformResponse: (data: any) =>
        data?.data?.config?.map((e: any) => ({
          ...e,
          name: e.displayName,
          icon: e.logoUrl,
        })),
    }),

    getTokenList: builder.query<
      TokenListResponse,
      { chainId: number; page?: number; pageSize?: number; isWhitelisted?: boolean; isStable?: boolean }
    >({
      query: ({ chainId, ...params }) => ({
        url: `/tokens`,
        params: { ...params, chainIds: chainId },
      }),
    }),
    importToken: builder.mutation<TokenListResponse, Array<{ chainId: string; address: string }>>({
      query: tokens => ({
        url: `/tokens/import`,
        body: { tokens },
        method: 'POST',
      }),
    }),
    getTopTokens: builder.query<TokenListResponse<TopToken>, { chainId: number; page: number }>({
      query: params => ({
        url: `/tokens/popular`,
        params,
      }),
    }),
  }),
})

export const {
  useGetKyberswapConfigurationQuery,
  useLazyGetKyberswapConfigurationQuery,
  useGetKyberswapGlobalConfigurationQuery,
  useLazyGetTokenListQuery,
  useGetTokenListQuery,
  useImportTokenMutation,
  useLazyGetTopTokensQuery,
  useGetChainsConfigurationQuery,
} = ksSettingApi

export default ksSettingApi
