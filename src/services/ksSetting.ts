import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { ChainId, NativeCurrency } from '@kyberswap/ks-sdk-core'
import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { KS_SETTING_API } from 'constants/env'
import { AppJsonRpcProvider } from 'constants/providers'
import { ChainStateMap } from 'hooks/useChainsConfig'
import { TokenInfo, WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { TopToken } from 'state/topTokens/type'
import { formatTokenInfo } from 'utils/tokenInfo'

export type KyberSwapConfig = {
  rpc: string
  isEnableBlockService: boolean
  isEnableKNProtocol: boolean
  blockClient: ApolloClient<NormalizedCacheObject>
  classicClient: ApolloClient<NormalizedCacheObject>
  elasticClient: ApolloClient<NormalizedCacheObject>
  readProvider: AppJsonRpcProvider | undefined
  commonTokens?: string[]
}

export type KyberSwapConfigResponse = {
  rpc: string
  isEnableBlockService: boolean
  isEnableKNProtocol: boolean
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

type Dex = {
  id: number
  dexId: string
  name: string
  logoURL: string
}

export interface TokenListResponse<T = TokenInfo> {
  data: {
    pagination?: {
      totalItems: number
    }
    tokens: Array<T>
  }
}

export interface TokenImportResponse<T = TokenInfo> {
  data: {
    tokens: {
      data: T
      errorMsg: string
    }[]
  }
}

const ksSettingApi = createApi({
  reducerPath: 'ksSettingConfigurationApi',
  baseQuery: baseQueryOauth({
    baseUrl: `${KS_SETTING_API}/v1`,
    trackingOnly: true,
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

    getDexList: builder.query<Dex[], { chainId: string }>({
      query: ({ chainId }) => ({
        url: `/dexes`,
        params: { chain: chainId, isEnabled: true, pageSize: 100 },
      }),
      transformResponse: (res: CommonPagingRes<{ dexes: Dex[] }>) => res.data.dexes,
    }),
    getTokenList: builder.query<
      TokenListResponse,
      {
        chainId: number
        page?: number
        pageSize?: number
        isWhitelisted?: boolean
        isStable?: boolean
        query?: string
        addresses?: string
      }
    >({
      query: ({ chainId, ...params }) => ({
        url: `/tokens`,
        params: { ...params, chainIds: chainId },
      }),
    }),
    getTokenByAddress: builder.query<WrappedTokenInfo | NativeCurrency, { address: string; chainId: ChainId }>({
      queryFn: async ({ address, chainId }, _api, _extra, fetchWithBQ): Promise<any> => {
        const tokenListRes = await fetchWithBQ({
          url: '/tokens',
          params: { chainIds: chainId, addresses: address },
        })
        let token = (tokenListRes.data as TokenListResponse)?.data.tokens[0]
        if (!token) {
          const importTokenRes = await fetchWithBQ({
            url: '/tokens/import',
            method: 'POST',
            body: { tokens: [{ chainId: chainId.toString(), address }] },
          })
          token = (importTokenRes.data as TokenImportResponse)?.data.tokens[0]?.data
        }
        const data = token ? formatTokenInfo(token) : undefined
        return { data }
      },
    }),

    getTokenByAddresses: builder.query<
      Array<WrappedTokenInfo | NativeCurrency>,
      { addresses: string[]; chainId: ChainId }
    >({
      queryFn: async ({ addresses, chainId }, _api, _extra, fetchWithBQ): Promise<any> => {
        const tokenListRes = await fetchWithBQ({
          url: '/tokens',
          params: { chainIds: chainId, addresses: addresses.join(','), page: 1, pageSize: 100 },
        })
        const tokens = (tokenListRes.data as TokenListResponse)?.data.tokens
        const foundedTokenAddress = tokens.map(item => item.address)

        const tokensNotFound = addresses.filter(item => !foundedTokenAddress.includes(item.toLowerCase()))

        if (tokensNotFound.length) {
          const importTokenRes = await fetchWithBQ({
            url: '/tokens/import',
            method: 'POST',
            body: { tokens: tokensNotFound.map(item => ({ chainId: chainId.toString(), address: item })) },
          })
          const importedTokens = (importTokenRes.data as TokenImportResponse)?.data.tokens?.map(item => item.data)
          return {
            data: [...tokens, ...importedTokens].map(formatTokenInfo),
          }
        }
        return { data: tokens.map(formatTokenInfo) }
      },
    }),

    importToken: builder.mutation<TokenListResponse, Array<{ chainId: string; address: string }>>({
      query: tokens => ({
        url: `/tokens/import`,
        body: { tokens },
        method: 'POST',
      }),
      transformResponse: (response: TokenImportResponse): TokenListResponse => {
        const tokens: TokenInfo[] = response.data.tokens.map(token => ({
          ...token.data,
          chainId: Number(token.data.chainId),
        }))
        return { data: { tokens } }
      },
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
  useGetTokenByAddressesQuery,
} = ksSettingApi

export default ksSettingApi
