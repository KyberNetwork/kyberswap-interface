import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { enumToArrayOfValues } from 'utils'

interface ExplorerLandingResponse {
  data: {
    highlightedPools: Array<EarnPool>
    solidEarning: Array<EarnPool>
    highAPR: Array<EarnPool>
    lowVolatility: Array<EarnPool>
  }
}

interface SupportedChainsResponse {
  code: number
  message: string
  data: {
    chains: {
      [chainId: string]: {
        chainId: number
        protocols: Array<{ id: string; name: string }>
      }
    }
  }
  requestId: string
}

export interface PoolQueryParams {
  chainId: ChainId
  page?: number
  limit?: number
  interval: string
  protocol: string
  userAddress?: string
  tag?: string
  sortBy?: string
  orderBy?: string
  q?: string
}

export interface EarnPool {
  address: string
  earnFee: number
  exchange: string
  type: string
  feeTier: number
  volume: number
  apr: number
  liquidity: number
  tvl: number
  chainId?: number
  favorite?: {
    chainId: number
    isFavorite: boolean
  }
  tokens: Array<{
    address: string
    logoURI: string
    symbol: string
  }>
}

export enum EarnDex {
  DEX_UNISWAPV3 = 'Uniswap V3',
  DEX_PANCAKESWAPV3 = 'PancakeSwap V3',
  DEX_SUSHISWAPV3 = 'SushiSwap V3',
  DEX_QUICKSWAPV3ALGEBRA = 'QuickSwap V3',
  DEX_CAMELOTV3 = 'Camelot V3',
  DEX_THENAFUSION = 'THENA',
  DEX_KODIAK_V3 = 'Kodiak Concentrated',
  // DEX_UNISWAPV2 = 'Uniswap V2',
}

export enum EarnDex2 {
  DEX_UNISWAPV3 = 'uniswapv3',
  DEX_PANCAKESWAPV3 = 'pancake-v3',
  DEX_SUSHISWAPV3 = 'sushiswap-v3',
  DEX_QUICKSWAPV3ALGEBRA = 'quickswap-v3',
  DEX_CAMELOTV3 = 'camelot-v3',
  DEX_THENAFUSION = 'thena',
  DEX_KODIAK_V3 = 'kodiakcl',
  // DEX_UNISWAPV2 = 'uniswapv2',
}

export const earnSupportedChains = [
  ChainId.MAINNET,
  ChainId.BASE,
  ChainId.BSCMAINNET,
  ChainId.ARBITRUM,
  ChainId.AVAXMAINNET,
  ChainId.OPTIMISM,
  ChainId.MATIC,
  ChainId.BERA,
]

export const earnSupportedProtocols = enumToArrayOfValues(EarnDex)

export enum PositionStatus {
  IN_RANGE = 'IN_RANGE',
  OUT_RANGE = 'OUT_RANGE',
}

export interface PositionAmount {
  token: {
    address: string
    symbol: string
    name: string
    decimals: number
    logo: string
    tag: string
    price: number
  }
  tokenType: string
  tokenID: string
  balance: string
  quotes: {
    usd: {
      symbol: string
      marketPrice: number
      price: number
      priceChange24hPercentage: number
      value: number
      timestamp: number
    }
  }
}

export interface EarnPosition {
  [x: string]: any
  chainName: 'eth'
  chainId: number
  chainLogo: string
  userAddress: string
  id: string
  tokenAddress: string
  tokenId: string
  liquidity: string
  minPrice: number
  maxPrice: number
  currentAmounts: Array<PositionAmount>
  providedAmounts: Array<PositionAmount>
  feePending: Array<PositionAmount>
  feesClaimed: Array<PositionAmount>
  farmRewardsPending: Array<PositionAmount>
  farmRewardsClaimed: Array<PositionAmount>
  feeEarned24h: Array<PositionAmount>
  farmReward24h: Array<PositionAmount>
  createdTime: number
  lastUpdateBlock: number
  openedBlock: number
  openedTime: number
  closedBlock: number
  closedTime: number
  closedPrice: number
  farming: boolean
  impermanentLoss: number
  apr: number
  feeApr: number
  farmApr: number
  pnl: number
  initialUnderlyingValue: number
  currentUnderlyingValue: number
  currentPositionValue: number
  compareWithHodl: number
  returnOnInvestment: number
  totalDepositValue: number
  totalWithdrawValue: number
  yesterdayEarning: number
  earning24h: number
  earning7d: number
  status: PositionStatus
  avgConvertPrice: number
  isConvertedFromToken0: boolean
  gasUsed: number
  isSupportAutomation: boolean
  hasAutomationOrder: boolean
  pool: {
    id: string
    poolAddress: string
    price: number
    tokenAmounts: Array<PositionAmount>
    farmRewardTokens: Array<PositionAmount>
    fees: Array<number>
    rewards24h: Array<PositionAmount>
    tickSpacing: number
    project: string
    projectLogo: string
    projectAddress: string
    showWarning: boolean
    tvl: number
    farmAddress: string
    tag: string
  }
}

interface PoolsExplorerResponse {
  code: number
  message: string
  data: {
    pools: Array<EarnPool>
    pagination: {
      totalItems: number
    }
  }
  requestId: string
}

export enum PositionHistoryType {
  DEPOSIT = 'DEPOSIT',
}

export interface PositionHistory {
  txHash: string
  type: PositionHistoryType
}

export interface PositionQueryParams {
  chainIds?: string
  addresses: string
  positionId?: string
  protocols: string
  status: string
  q?: string
  sortBy?: string
  orderBy?: string
  page: number
}

interface PositionHistoryParams {
  chainId: ChainId
  tokenAddress: string
  tokenId: string
}

interface AddRemoveFavoriteParams {
  chainId: ChainId
  message: string
  signature: string
  poolAddress: string
  userAddress: string
}

const zapEarnServiceApi = createApi({
  reducerPath: 'zapEarnServiceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_ZAP_EARN_URL,
  }),
  keepUnusedDataFor: 1,
  endpoints: builder => ({
    explorerLanding: builder.query<ExplorerLandingResponse, { userAddress?: string }>({
      query: params => ({
        url: `/v1/explorer/landing-page`,
        params,
      }),
    }),
    supportedProtocols: builder.query<SupportedChainsResponse, void>({
      query: () => ({
        url: `/v1/protocol`,
      }),
    }),
    poolsExplorer: builder.query<PoolsExplorerResponse, PoolQueryParams>({
      query: params => ({
        url: `/v1/explorer/pools`,
        params: {
          ...params,
          orderBy: params.orderBy?.toUpperCase() || '',
        },
      }),
      async onQueryStarted(agr, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          dispatch(
            zapEarnServiceApi.util.upsertQueryData('poolsExplorer', agr, {
              data: { pools: [], pagination: { totalItems: 0 } },
              code: 0,
              message: '',
              requestId: '',
            }),
          )
        }
      },
    }),
    userPositions: builder.query<Array<EarnPosition>, PositionQueryParams>({
      query: params => ({
        url: `/v1/userPositions`,
        params: {
          ...params,
          chainIds: params.chainIds || earnSupportedChains,
          protocols: params.protocols || earnSupportedProtocols,
          quoteSymbol: 'usd',
          offset: 0,
          orderBy: 'liquidity',
          orderASC: false,
          positionStatus: 'open',
        },
      }),
      transformResponse: (response: {
        data: {
          positions: Array<EarnPosition>
        }
      }) => response.data.positions,
      async onQueryStarted(agr, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          dispatch(zapEarnServiceApi.util.upsertQueryData('userPositions', agr, []))
        }
      },
    }),
    positionHistory: builder.query<Array<PositionHistory>, PositionHistoryParams>({
      query: params => ({
        url: `/v1/userPositions/positionHistory`,
        params,
      }),
      transformResponse: (response: { data: Array<PositionHistory> }) => response.data,
      async onQueryStarted(agr, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          dispatch(zapEarnServiceApi.util.upsertQueryData('positionHistory', agr, []))
        }
      },
    }),
    addFavorite: builder.mutation<void, AddRemoveFavoriteParams>({
      query: body => ({
        method: 'POST',
        body,
        url: `/v1/favorite`,
      }),
    }),
    removeFavorite: builder.mutation<void, AddRemoveFavoriteParams>({
      query: body => ({
        method: 'DELETE',
        body,
        url: `/v1/favorite`,
      }),
    }),
  }),
})

export const {
  useExplorerLandingQuery,
  useSupportedProtocolsQuery,
  usePoolsExplorerQuery,
  useUserPositionsQuery,
  usePositionHistoryQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = zapEarnServiceApi

export default zapEarnServiceApi
