import { parseUnits } from '@ethersproject/units'
import {
  CHAIN_ID_TO_CHAIN,
  PoolType,
  Token,
  ZERO_ADDRESS,
  Pool as ZapPool,
  ZapRouteDetail,
  univ3Types,
} from '@kyber/schema'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export type ZapRouteApiResponse = {
  data?: ZapRouteDetail
  message?: string
}

export type BuildZapInData = {
  callData: string
  routerAddress: string
  value: string
}

export type GetZapInRouteApiArgs = {
  chainName: string
  params: string
  clientId?: string
}

export type BuildZapInRouteApiArgs = {
  chainName: string
  sender: string
  recipient: string
  route: unknown
  deadline: number
  permits?: Record<string, string>
  referral?: string
  source?: string
}

export type BuildZapInApiResponse = {
  data?: BuildZapInData
  message?: string
}

const parseTokensAndAmounts = (tokensIn: Token[], amountsIn: string) => {
  const rawAmounts = amountsIn.split(',')
  const validTokens: Token[] = []
  const validAmounts: string[] = []

  tokensIn.forEach((token, index) => {
    const value = rawAmounts[index]?.trim()
    const parsed = Number(value)

    if (value && Number.isFinite(parsed) && parsed > 0) {
      validTokens.push(token)
      validAmounts.push(value)
    }
  })

  return {
    tokensIn: validTokens,
    amountsIn: validAmounts,
    tokenAddresses: validTokens.map(token => token.address).join(','),
  }
}

export const prepareGetZapInRouteRequest = ({
  chainId,
  poolAddress,
  poolType,
  pool,
  tokensIn,
  amountsIn,
  slippage,
  tickLower,
  tickUpper,
  account,
  source,
}: {
  chainId: number
  poolAddress: string
  poolType: PoolType
  pool: ZapPool
  tokensIn: Token[]
  amountsIn: string
  slippage: number
  tickLower?: number | null
  tickUpper?: number | null
  account?: string
  source?: string
}) => {
  const {
    tokensIn: parsedTokens,
    amountsIn: parsedAmounts,
    tokenAddresses,
  } = parseTokensAndAmounts(tokensIn, amountsIn)

  if (!parsedTokens.length || !tokenAddresses) {
    return { data: null, error: 'Missing valid zap input' }
  }

  let amountsInWei: string[]

  try {
    amountsInWei = parsedTokens.map((token, index) => parseUnits(parsedAmounts[index], token.decimals).toString())
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Invalid input amount',
    }
  }

  if (!amountsInWei.some(amount => amount !== '0')) {
    return { data: null, error: 'Missing valid zap input' }
  }

  const chainName = CHAIN_ID_TO_CHAIN[chainId as keyof typeof CHAIN_ID_TO_CHAIN]
  if (!chainName) {
    return { data: null, error: 'Unsupported chain for zap route' }
  }

  const params = new URLSearchParams()
  params.set('dex', String(poolType))
  params.set('pool.id', poolAddress)
  params.set('pool.token0', pool.token0.address)
  params.set('pool.token1', pool.token1.address)
  params.set('pool.fee', String(pool.fee * 10_000))
  params.set('tokensIn', tokenAddresses)
  params.set('amountsIn', amountsInWei.join(','))
  params.set('slippage', String(slippage))

  if (
    univ3Types.includes(poolType as (typeof univ3Types)[number]) &&
    tickLower !== null &&
    tickLower !== undefined &&
    tickUpper !== null &&
    tickUpper !== undefined
  ) {
    params.set('position.tickLower', String(tickLower))
    params.set('position.tickUpper', String(tickUpper))
  } else {
    params.set('position.id', String(account || ZERO_ADDRESS))
  }

  return {
    data: {
      chainName,
      params: params.toString(),
      clientId: source,
    },
    error: null,
  }
}

export const prepareBuildZapInRouteRequest = ({
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
  route: unknown
  deadline: number
  permits?: Record<string, string>
  source?: string
  referral?: string
}) => {
  const chainName = CHAIN_ID_TO_CHAIN[chainId as keyof typeof CHAIN_ID_TO_CHAIN]
  if (!chainName) {
    return { data: null, error: 'Unsupported chain for zap build route' }
  }

  return {
    data: {
      chainName,
      sender,
      recipient,
      route,
      deadline,
      permits,
      referral,
      source,
    },
    error: null,
  }
}

const zapApi = createApi({
  reducerPath: 'zapApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_ZAP_API_URL,
  }),
  keepUnusedDataFor: 30,
  endpoints: builder => ({
    getZapInRoute: builder.query<ZapRouteApiResponse, GetZapInRouteApiArgs>({
      query: ({ chainName, params, clientId }) => ({
        url: `/${chainName}/api/v1/in/route?${params}`,
        headers: {
          'X-Client-Id': clientId || 'kyberswap',
        },
      }),
    }),

    buildZapInRoute: builder.mutation<BuildZapInApiResponse, BuildZapInRouteApiArgs>({
      query: ({ chainName, ...body }) => ({
        url: `/${chainName}/api/v1/in/route/build`,
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const { useBuildZapInRouteMutation, useGetZapInRouteQuery } = zapApi

export default zapApi
