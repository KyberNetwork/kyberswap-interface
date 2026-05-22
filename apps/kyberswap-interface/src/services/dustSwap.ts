import { CHAIN_ID_TO_CHAIN } from '@kyber/schema'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export type DustSwapTokenAmount = {
  address: string
  amount: string
  amountUsd?: string
}

export type DustSwapAction =
  | {
      type: 'ACTION_TYPE_AGGREGATOR_SWAP'
      aggregatorSwap: {
        swaps: Array<{
          tokenIn: DustSwapTokenAmount
          tokenOut: DustSwapTokenAmount
        }>
      }
    }
  | {
      type: 'ACTION_TYPE_REFUND'
      refund: {
        tokens: DustSwapTokenAmount[]
      }
    }
  | {
      // Forward-compat catch-all; backend may add new action types
      type: string
      [key: string]: unknown
    }

export type DustSwapRouteDetails = {
  initialAmountUsd: string
  actions: DustSwapAction[]
  finalAmountUsd: string
  priceImpact: number
  suggestedSlippage: number
}

export type DustSwapRouteData = {
  zapDetails: DustSwapRouteDetails
  route: string
  routerAddress: string
  gas: string
  gasUsd: string
  routerPermitAddress?: string
}

export type DustSwapRouteApiResponse = {
  data?: DustSwapRouteData
  message?: string
  requestId?: string
}

export type BuildDustSwapData = {
  routerAddress: string
  callData: string
  value: string
  tokenTarget?: string
  quoteAmountOut: string
  minAmountOut: string
  amountOutUsd?: string
}

export type BuildDustSwapApiResponse = {
  data?: BuildDustSwapData
  message?: string
  requestId?: string
}

export type GetDustSwapRouteApiArgs = {
  chainName: string
  params: string
  clientId?: string
}

export type BuildDustSwapApiArgs = {
  chainName: string
  sender: string
  recipient: string
  route: string
  deadline: number
  permits?: Record<string, string>
  referral?: string
  source?: string
}

/**
 * Build the URLSearchParams string for the /swap/route GET endpoint.
 * Multi-token: pass comma-separated tokensIn + amountsIn (wei) in the same order.
 * Use 0xEee...E for the native asset.
 */
export const prepareGetDustSwapRouteRequest = ({
  chainId,
  tokensIn,
  amountsIn,
  tokenOut,
  slippage,
  source,
}: {
  chainId: number
  tokensIn: string[]
  amountsIn: string[] // wei
  tokenOut: string
  slippage: number // bips
  source?: string
}): { data: GetDustSwapRouteApiArgs | null; error: string | null } => {
  if (!tokensIn.length || tokensIn.length !== amountsIn.length) {
    return { data: null, error: 'tokensIn / amountsIn length mismatch' }
  }
  if (amountsIn.every(a => !a || a === '0')) {
    return { data: null, error: 'All input amounts are zero' }
  }
  const chainName = CHAIN_ID_TO_CHAIN[chainId as keyof typeof CHAIN_ID_TO_CHAIN]
  if (!chainName) {
    return { data: null, error: 'Unsupported chain for dust swap route' }
  }

  const params = new URLSearchParams()
  params.set('tokens_in', tokensIn.join(','))
  params.set('amounts_in', amountsIn.join(','))
  params.set('token_out', tokenOut)
  params.set('slippage', String(slippage))

  return {
    data: { chainName, params: params.toString(), clientId: source },
    error: null,
  }
}

export const prepareBuildDustSwapRequest = ({
  chainId,
  sender,
  recipient,
  route,
  deadline,
  permits,
  source,
  referral,
}: {
  chainId: number
  sender: string
  recipient: string
  route: string
  deadline: number
  permits?: Record<string, string>
  source?: string
  referral?: string
}): { data: BuildDustSwapApiArgs | null; error: string | null } => {
  const chainName = CHAIN_ID_TO_CHAIN[chainId as keyof typeof CHAIN_ID_TO_CHAIN]
  if (!chainName) {
    return { data: null, error: 'Unsupported chain for dust swap build' }
  }
  // Backend deadline is a uint32 (proto fixed32). 4294967295 = 2106-02-07.
  if (!Number.isInteger(deadline) || deadline < 0 || deadline > 4_294_967_295) {
    return { data: null, error: 'Invalid deadline' }
  }
  return {
    data: { chainName, sender, recipient, route, deadline, permits, referral, source },
    error: null,
  }
}

const dustSwapApi = createApi({
  reducerPath: 'dustSwapApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_ZAP_API_URL,
  }),
  keepUnusedDataFor: 20,
  endpoints: builder => ({
    getDustSwapRoute: builder.query<DustSwapRouteApiResponse, GetDustSwapRouteApiArgs>({
      query: ({ chainName, params, clientId }) => ({
        url: `/${chainName}/api/v1/swap/route?${params}`,
        headers: { 'X-Client-Id': clientId || 'kyberswap' },
      }),
    }),
    buildDustSwapRoute: builder.mutation<BuildDustSwapApiResponse, BuildDustSwapApiArgs>({
      query: ({ chainName, ...body }) => ({
        url: `/${chainName}/api/v1/swap/route/build`,
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const { useGetDustSwapRouteQuery, useLazyGetDustSwapRouteQuery, useBuildDustSwapRouteMutation } = dustSwapApi

export default dustSwapApi
