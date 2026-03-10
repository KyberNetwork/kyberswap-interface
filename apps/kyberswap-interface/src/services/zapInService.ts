import { parseUnits } from '@ethersproject/units'
import {
  API_URLS,
  CHAIN_ID_TO_CHAIN,
  Pool,
  PoolType,
  Token,
  ZERO_ADDRESS,
  ZapRouteDetail,
  Token as ZapToken,
  univ3Types,
} from '@kyber/schema'
import { fetchTokens, getPoolInfo } from '@kyber/utils'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { TOKEN_API_URL } from 'constants/env'

type PoolInfoResult = {
  pool: Pool | null
  error: string | null
}

type RouteArgs = {
  chainId: number
  poolAddress: string
  poolType: PoolType
  pool: Pool
  tokensIn: ZapToken[]
  amountsIn: string
  slippage: number
  tickLower?: number | null
  tickUpper?: number | null
  account?: string
  positionId?: string | number
  source?: string
}

type AprEstimationArgs = {
  chainId: number
  poolAddress: string
  tickLower: number
  tickUpper: number
  positionLiquidity: string
  positionTvl?: string
}

type AprEstimationResponse = {
  data: {
    feeApr: number
    egApr: number
    lmApr: number
  }
}

export type PositionAprData = {
  totalApr: number
  feeApr: number
  egApr: number
  lmApr: number
}

type ZapRouteApiResponse = {
  data?: ZapRouteDetail
  message?: string
}

export type BuildZapInData = {
  callData: string
  routerAddress: string
  value: string
}

export type HoneypotInfo = {
  isHoneypot: boolean
  isFOT: boolean
  tax: number
}

type BuildZapInRouteArgs = {
  chainId: number
  sender: string
  recipient: string
  route: unknown
  deadline: number
  permits?: Record<string, string>
  source?: string
  referral?: string
}

type BuildZapInApiResponse = {
  data?: BuildZapInData
  message?: string
}

const parseTokensAndAmounts = (tokensIn: ZapToken[], amountsIn: string) => {
  const rawAmounts = amountsIn.split(',')
  const validTokens: ZapToken[] = []
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

const zapInServiceApi = createApi({
  reducerPath: 'zapInServiceApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  keepUnusedDataFor: 30,
  endpoints: builder => ({
    poolInfo: builder.query<PoolInfoResult, { chainId: number; poolAddress: string; poolType: PoolType }>({
      async queryFn({ chainId, poolAddress, poolType }) {
        try {
          const result = await getPoolInfo({
            chainId: chainId as any,
            poolAddress,
            poolType,
          })

          return {
            data: {
              pool: result.pool as Pool | null,
              error: result.error ?? null,
            },
          }
        } catch (error) {
          return {
            data: {
              pool: null,
              error: error instanceof Error ? error.message : 'Failed to load pool',
            },
          }
        }
      },
    }),

    tokensByAddresses: builder.query<Token[], { chainId: number; addresses: string[] }>({
      async queryFn({ chainId, addresses }) {
        try {
          const uniqueAddresses = Array.from(new Set(addresses.map(address => address.toLowerCase()))).filter(Boolean)
          const tokens = await fetchTokens(uniqueAddresses, chainId)

          return {
            data: tokens as Token[],
          }
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: error instanceof Error ? error.message : 'Failed to load tokens',
            } as any,
          }
        }
      },
    }),

    estimatePositionApr: builder.query<PositionAprData, AprEstimationArgs>({
      async queryFn(args, _api, _extraOptions, baseQuery) {
        const result = (await baseQuery({
          url: `${API_URLS.ZAP_EARN_API}/v1/apr-estimation`,
          params: {
            poolAddress: args.poolAddress,
            chainId: args.chainId.toString(),
            tickLower: args.tickLower.toString(),
            tickUpper: args.tickUpper.toString(),
            positionLiquidity: args.positionLiquidity,
            positionTvl: args.positionTvl || '0',
          },
        })) as { data?: AprEstimationResponse; error?: any }

        if (result.error) return { error: result.error }
        if (!result.data?.data) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: 'Failed to estimate position APR',
            } as any,
          }
        }

        return {
          data: {
            totalApr: (result.data.data.feeApr + result.data.data.egApr + result.data.data.lmApr) * 100,
            feeApr: result.data.data.feeApr * 100,
            egApr: result.data.data.egApr * 100,
            lmApr: result.data.data.lmApr * 100,
          },
        }
      },
    }),

    honeypotInfo: builder.query<Record<string, HoneypotInfo>, { chainId: number; addresses: string[] }>({
      async queryFn({ chainId, addresses }, _api, _extraOptions, baseQuery) {
        const normalizedAddresses = Array.from(new Set(addresses.map(address => address.toLowerCase()))).filter(Boolean)

        if (!normalizedAddresses.length) return { data: {} }

        try {
          const results = await Promise.all(
            normalizedAddresses.map(async address => {
              const response = (await baseQuery({
                url: `${TOKEN_API_URL}/v1/public/tokens/honeypot-fot-info`,
                params: {
                  address,
                  chainId: chainId.toString(),
                },
              })) as { data?: { data?: HoneypotInfo }; error?: any }

              if (response.error) throw response.error

              return [
                address,
                response.data?.data || {
                  isHoneypot: false,
                  isFOT: false,
                  tax: 0,
                },
              ] as const
            }),
          )

          return {
            data: Object.fromEntries(results),
          }
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: error instanceof Error ? error.message : 'Failed to load honeypot info',
            } as any,
          }
        }
      },
    }),

    getZapInRoute: builder.query<ZapRouteDetail, RouteArgs>({
      async queryFn(args, _api, _extraOptions, baseQuery) {
        const { tokensIn, amountsIn, tokenAddresses } = parseTokensAndAmounts(args.tokensIn, args.amountsIn)

        if (!tokensIn.length || !tokenAddresses) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: 'Missing valid zap input',
            } as any,
          }
        }

        let amountsInWei: string[] = []

        try {
          amountsInWei = tokensIn.map((token, index) => parseUnits(amountsIn[index], token.decimals).toString())
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: error instanceof Error ? error.message : 'Invalid input amount',
            } as any,
          }
        }

        if (!amountsInWei.some(amount => amount !== '0')) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: 'Missing valid zap input',
            } as any,
          }
        }

        const params = new URLSearchParams()
        params.set('dex', String(args.poolType))
        params.set('pool.id', args.poolAddress)
        params.set('pool.token0', args.pool.token0.address)
        params.set('pool.token1', args.pool.token1.address)
        params.set('pool.fee', String(args.pool.fee * 10_000))
        params.set('tokensIn', tokenAddresses)
        params.set('amountsIn', amountsInWei.join(','))
        params.set('slippage', String(args.slippage))

        const chainName = CHAIN_ID_TO_CHAIN[args.chainId as keyof typeof CHAIN_ID_TO_CHAIN]
        if (!chainName) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: 'Unsupported chain for zap route',
            } as any,
          }
        }

        if (
          univ3Types.includes(args.poolType as any) &&
          args.tickLower !== null &&
          args.tickLower !== undefined &&
          args.tickUpper !== null &&
          args.tickUpper !== undefined &&
          !args.positionId
        ) {
          params.set('position.tickLower', String(args.tickLower))
          params.set('position.tickUpper', String(args.tickUpper))
        } else {
          params.set('position.id', String(args.positionId || args.account || ZERO_ADDRESS))
        }

        const routeResult = (await baseQuery({
          url: `${API_URLS.ZAP_API}/${chainName}/api/v1/in/route?${params.toString()}`,
          headers: {
            'X-Client-Id': args.source || 'kyberswap',
          },
        })) as { data?: ZapRouteApiResponse; error?: any }

        if (routeResult.error) return { error: routeResult.error }
        if (!routeResult.data?.data) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: routeResult.data?.message || 'Failed to get zap route',
            } as any,
          }
        }

        return {
          data: routeResult.data.data,
        }
      },
    }),

    buildZapInRoute: builder.mutation<BuildZapInData, BuildZapInRouteArgs>({
      async queryFn(args, _api, _extraOptions, baseQuery) {
        const chainName = CHAIN_ID_TO_CHAIN[args.chainId as keyof typeof CHAIN_ID_TO_CHAIN]
        if (!chainName) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: 'Unsupported chain for zap build route',
            } as any,
          }
        }

        const buildResult = (await baseQuery({
          url: `${API_URLS.ZAP_API}/${chainName}/api/v1/in/route/build`,
          method: 'POST',
          body: {
            sender: args.sender,
            recipient: args.recipient,
            route: args.route,
            deadline: args.deadline,
            permits: args.permits,
            source: args.source,
            referral: args.referral,
          },
        })) as { data?: BuildZapInApiResponse; error?: any }

        if (buildResult.error) return { error: buildResult.error }
        if (!buildResult.data?.data?.callData || !buildResult.data?.data?.routerAddress) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: buildResult.data?.message || 'Failed to build zap route',
            } as any,
          }
        }

        return {
          data: buildResult.data.data,
        }
      },
    }),
  }),
})

export const {
  useBuildZapInRouteMutation,
  useEstimatePositionAprQuery,
  useHoneypotInfoQuery: useGetHoneypotInfoQuery,
  useGetZapInRouteQuery,
  usePoolInfoQuery: useAddLiquidityPoolInfoQuery,
  useTokensByAddressesQuery: useAddLiquidityTokensQuery,
} = zapInServiceApi

export default zapInServiceApi
