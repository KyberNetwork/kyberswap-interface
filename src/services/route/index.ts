import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryOauthDynamic } from 'services/baseQueryOauth'
import { BuildRoutePayload, BuildRouteResponse } from 'services/route/types/buildRoute'

import { BFF_API } from 'constants/env'

import { GetRouteParams, GetRouteResponse } from './types/getRoute'

const routeApi = createApi({
  reducerPath: 'routeApi',
  baseQuery: baseQueryOauthDynamic({
    baseUrl: '',
  }),
  endpoints: builder => ({
    getRoute: builder.query<
      GetRouteResponse,
      {
        url: string
        params: GetRouteParams
        authentication: boolean
        clientId?: string
      }
    >({
      query: ({ params, url, authentication, clientId }) => {
        const { chainId, tokenInDecimals, tokenOutDecimals, ...rest } = params
        return {
          url,
          params: rest,
          authentication,
          headers: {
            'x-client-id': clientId || 'kyberswap',
          },
        }
      },
      async transformResponse(baseResponse: GetRouteResponse, _meta, { params }): Promise<GetRouteResponse> {
        const { routeSummary } = baseResponse?.data || {}
        const { chainId, tokenInDecimals, tokenOutDecimals, tokenIn, tokenOut } = params || {}

        // Ensure all necessary data is available
        //if (baseResponse?.data?.routeSummary && routeSummary && chainId && tokenInDecimals && tokenOutDecimals) {
        //  const { amountIn, amountOut } = routeSummary
        //
        //  // Build the URL for the price impact API request
        //  const priceImpactUrl = new URL(`${BFF_API}/v1/price-impact`)
        //  priceImpactUrl.searchParams.append('tokenIn', tokenIn)
        //  priceImpactUrl.searchParams.append('tokenInDecimal', tokenInDecimals.toString())
        //  priceImpactUrl.searchParams.append('tokenOut', tokenOut)
        //  priceImpactUrl.searchParams.append('tokenOutDecimal', tokenOutDecimals.toString())
        //  priceImpactUrl.searchParams.append('amountIn', amountIn)
        //  priceImpactUrl.searchParams.append('amountOut', amountOut)
        //  priceImpactUrl.searchParams.append('chainId', chainId.toString())
        //
        //  try {
        //    // Fetch price impact data
        //    const priceImpactResponse = await fetch(priceImpactUrl.toString()).then(res => res.json())
        //    const { amountInUSD, amountOutUSD } = priceImpactResponse?.data || {}
        //
        //    // Update routeSummary with USD values if available
        //    if (amountInUSD && amountOutUSD) {
        //      return {
        //        ...baseResponse,
        //        data: {
        //          ...baseResponse.data,
        //          routeSummary: {
        //            ...routeSummary,
        //            amountInUsd: amountInUSD,
        //            amountOutUsd: amountOutUSD,
        //          },
        //        },
        //      }
        //    }
        //  } catch (error) {
        //    console.error('Failed to fetch price impact:', error)
        //  }
        //}

        // Return original response if conditions are not met or request fails
        //return baseResponse

        if (!baseResponse.data) return baseResponse
        baseResponse.data.routeSummary = {
          tokenIn: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
          amountIn: '1000000000000000000000',
          amountInUsd: '4352018.709992444',
          tokenOut: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
          amountOut: '4531365902',
          amountOutUsd: '4382943.981611451',
          gasUsd: '116.68998577404858',
          route: [
            [
              {
                pool: 'bebop_0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0_0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
                tokenIn: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
                tokenOut: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
                limitReturnAmount: '0',
                swapAmount: '50000000000000000000',
                amountOut: '114442213243747581952',
                exchange: 'bebop',
                poolLength: 2,
                poolType: 'bebop',
                poolExtra: null,
              },
            ],
            [
              {
                pool: '0x93d199263632a4ef4bb438f1feb99e57b4b5f0bd',
                tokenIn: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
                tokenOut: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                limitReturnAmount: '0',
                swapAmount: '250000000000000000000',
                amountOut: '296542467421645344516',
                exchange: 'balancer-v2-composable-stable',
                poolLength: 3,
                poolType: 'balancer-v2-composable-stable',
                poolExtra: {
                  blockNumber: 21319890,
                  poolId: '0x93d199263632a4ef4bb438f1feb99e57b4b5f0bd0000000000000000000005c2',
                  tokenOutIndex: 2,
                  vault: '0xba12222222228d8ba445958a75a0704d566bf2c8',
                },
              },
            ],
            [
              {
                pool: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
                tokenIn: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
                tokenOut: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
                limitReturnAmount: '0',
                swapAmount: '400000000000000000000',
                amountOut: '474626027414909852000',
                exchange: 'lido',
                poolLength: 2,
                poolType: 'lido',
                poolExtra: null,
              },
            ],
            [
              {
                pool: '0x109830a1aaad605bbf02a9dfa7b0b92ec2fb7daa',
                tokenIn: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
                tokenOut: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                limitReturnAmount: '0',
                swapAmount: '150000000000000000000',
                amountOut: '177919417229229300643',
                exchange: 'uniswapv3',
                poolLength: 2,
                poolType: 'uniswapv3',
                poolExtra: {
                  blockNumber: 0,
                  priceLimit: 4295128740,
                },
              },
            ],
            [
              {
                pool: '0x0b1a513ee24972daef112bc777a5610d4325c9e7',
                tokenIn: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
                tokenOut: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                limitReturnAmount: '0',
                swapAmount: '150000000000000000000',
                amountOut: '177927048177000000000',
                exchange: 'fluid-dex-t1',
                poolLength: 2,
                poolType: 'fluid-dex-t1',
                poolExtra: {
                  blockNumber: 21319890,
                },
              },
            ],
            [
              {
                pool: '0xe8c6c9227491c0a8156a0106a0204d881bb7e531',
                tokenIn: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
                tokenOut: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                limitReturnAmount: '0',
                swapAmount: '114442213243747581952',
                amountOut: '66944420731774458985',
                exchange: 'uniswapv3',
                poolLength: 2,
                poolType: 'uniswapv3',
                poolExtra: {
                  blockNumber: 0,
                  priceLimit: 4306310044,
                },
              },
            ],
            [
              {
                pool: '0xdc24316b9ae028f1497c275eb9192a3ea0f67022',
                tokenIn: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
                tokenOut: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                limitReturnAmount: '0',
                swapAmount: '415297773988046120500',
                amountOut: '415162858681867357755',
                exchange: 'curve-stable-plain',
                poolLength: 2,
                poolType: 'curve-stable-plain',
                poolExtra: {
                  TokenInIsNative: false,
                  TokenOutIsNative: true,
                  tokenInIndex: 1,
                  tokenOutIndex: 0,
                  underlying: false,
                },
              },
            ],
            [
              {
                pool: 'kyber_pmm_0x2260fac5e5542a773aa44fbcfedf7c193bc2c599_0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
                tokenIn: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
                tokenOut: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                limitReturnAmount: '0',
                swapAmount: '59328253426863731500',
                amountOut: '225526762',
                exchange: 'kyber-pmm',
                poolLength: 2,
                poolType: 'kyber-pmm',
                poolExtra: {
                  timestamp: 1733203751,
                },
              },
            ],
            [
              {
                pool: '0x4585fe77225b41b697c938b018e2ac67ac5a20c0',
                tokenIn: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                tokenOut: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                limitReturnAmount: '0',
                swapAmount: '422796963697320913295',
                amountOut: '1605175859',
                exchange: 'uniswapv3',
                poolLength: 2,
                poolType: 'uniswapv3',
                poolExtra: {
                  blockNumber: 0,
                  priceLimit: 1.4613005734278674e48,
                },
              },
            ],
            [
              {
                pool: '0x11b815efb8f581194ae79006d24e0d814b7697f6',
                tokenIn: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                tokenOut: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                limitReturnAmount: '0',
                swapAmount: '118619237329356120072',
                amountOut: '433089706619',
                exchange: 'uniswapv3',
                poolLength: 2,
                poolType: 'uniswapv3',
                poolExtra: {
                  blockNumber: 0,
                  priceLimit: 4295558252,
                },
              },
            ],
            [
              {
                pool: 'kyber_pmm_0x2260fac5e5542a773aa44fbcfedf7c193bc2c599_0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                tokenIn: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                tokenOut: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                limitReturnAmount: '0',
                swapAmount: '118619536988929547734',
                amountOut: '450987594',
                exchange: 'kyber-pmm',
                poolLength: 2,
                poolType: 'kyber-pmm',
                poolExtra: {
                  timestamp: 1733203751,
                },
              },
            ],
            [
              {
                pool: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
                tokenIn: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                tokenOut: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                limitReturnAmount: '0',
                swapAmount: '177924678792959222266',
                amountOut: '649603082233',
                exchange: 'uniswapv3',
                poolLength: 2,
                poolType: 'uniswapv3',
                poolExtra: {
                  blockNumber: 0,
                  priceLimit: 1.4613005734278674e48,
                },
              },
            ],
            [
              {
                pool: 'kyber_pmm_0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2_0xdac17f958d2ee523a2206206994597c13d831ec7',
                tokenIn: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                tokenOut: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                limitReturnAmount: '0',
                swapAmount: '177919417229229300642',
                amountOut: '649229108600',
                exchange: 'kyber-pmm',
                poolLength: 2,
                poolType: 'kyber-pmm',
                poolExtra: {
                  timestamp: 1733203751,
                },
              },
            ],
            [
              {
                pool: '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed',
                tokenIn: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                tokenOut: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                limitReturnAmount: '0',
                swapAmount: '118616378203721357890',
                amountOut: '449504431',
                exchange: 'uniswapv3',
                poolLength: 2,
                poolType: 'uniswapv3',
                poolExtra: {
                  blockNumber: 0,
                  priceLimit: 1.4576520669498474e48,
                },
              },
            ],
            [
              {
                pool: 'kyber_pmm_0x2260fac5e5542a773aa44fbcfedf7c193bc2c599_0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                tokenIn: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                tokenOut: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                limitReturnAmount: '0',
                swapAmount: '216663329831',
                amountOut: '225532718',
                exchange: 'kyber-pmm',
                poolLength: 2,
                poolType: 'kyber-pmm',
                poolExtra: {
                  timestamp: 1733203751,
                },
              },
            ],
            [
              {
                pool: '0x9a772018fbd77fcd2d25657e5c547baff3fd7d16',
                tokenIn: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                tokenOut: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                limitReturnAmount: '0',
                swapAmount: '216537519276',
                amountOut: '225146915',
                exchange: 'uniswapv3',
                poolLength: 2,
                poolType: 'uniswapv3',
                poolExtra: {
                  blockNumber: 0,
                },
              },
            ],
            [
              {
                pool: '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35',
                tokenIn: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                tokenOut: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                limitReturnAmount: '0',
                swapAmount: '216402233126',
                amountOut: '224649112',
                exchange: 'uniswapv3',
                poolLength: 2,
                poolType: 'uniswapv3',
                poolExtra: {
                  blockNumber: 0,
                },
              },
            ],
            [
              {
                pool: 'kyber_pmm_0x2260fac5e5542a773aa44fbcfedf7c193bc2c599_0xdac17f958d2ee523a2206206994597c13d831ec7',
                tokenIn: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                tokenOut: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                limitReturnAmount: '0',
                swapAmount: '216623912419',
                amountOut: '225658416',
                exchange: 'kyber-pmm',
                poolLength: 2,
                poolType: 'kyber-pmm',
                poolExtra: {
                  timestamp: 1733203751,
                },
              },
            ],
            [
              {
                pool: '0x9db9e0e53058c89e5b94e29621a205198648425b',
                tokenIn: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                tokenOut: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                limitReturnAmount: '0',
                swapAmount: '649327036433',
                amountOut: '674681659',
                exchange: 'uniswapv3',
                poolLength: 2,
                poolType: 'uniswapv3',
                poolExtra: {
                  blockNumber: 0,
                },
              },
            ],
            [
              {
                pool: '0x56534741cd8b152df6d48adf7ac51f75169a83b2',
                tokenIn: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                tokenOut: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                limitReturnAmount: '0',
                swapAmount: '216367866367',
                amountOut: '224502436',
                exchange: 'uniswapv3',
                poolLength: 2,
                poolType: 'uniswapv3',
                poolExtra: {
                  blockNumber: 0,
                },
              },
            ],
          ],
        }
        console.log(baseResponse)

        return baseResponse
      },
    }),
    buildRoute: builder.mutation<
      BuildRouteResponse,
      { url: string; payload: BuildRoutePayload; signal?: AbortSignal; authentication: boolean }
    >({
      query: ({ url, payload, signal, authentication }) => {
        const { chainId, tokenInDecimals, tokenOutDecimals, ...rest } = payload
        return {
          url,
          method: 'POST',
          body: rest,
          signal,
          authentication,
          headers: {
            'x-client-id': payload.source || 'kyberswap',
          },
        }
      },
      async transformResponse(baseResponse: BuildRouteResponse, _meta, { payload }): Promise<BuildRouteResponse> {
        const { data } = baseResponse || {}
        const { chainId, tokenInDecimals, tokenOutDecimals, routeSummary } = payload || {}
        const { tokenIn, tokenOut } = routeSummary || {}

        // Ensure all necessary data is available
        if (data && routeSummary && chainId && tokenInDecimals && tokenOutDecimals) {
          const { amountIn, amountOut } = routeSummary

          // Build the URL for the price impact API request
          const priceImpactUrl = new URL(`${BFF_API}/v1/price-impact`)
          priceImpactUrl.searchParams.append('tokenIn', tokenIn)
          priceImpactUrl.searchParams.append('tokenInDecimal', tokenInDecimals.toString())
          priceImpactUrl.searchParams.append('tokenOut', tokenOut)
          priceImpactUrl.searchParams.append('tokenOutDecimal', tokenOutDecimals.toString())
          priceImpactUrl.searchParams.append('amountIn', amountIn)
          priceImpactUrl.searchParams.append('amountOut', amountOut)
          priceImpactUrl.searchParams.append('chainId', chainId.toString())

          try {
            // Fetch price impact data
            const priceImpactResponse = await fetch(priceImpactUrl.toString()).then(res => res.json())
            const { amountInUSD, amountOutUSD } = priceImpactResponse?.data || {}

            // Update routeSummary with USD values if available
            if (amountInUSD && amountOutUSD) {
              return {
                ...baseResponse,
                data: {
                  ...data,
                  amountInUsd: amountInUSD,
                  amountOutUsd: amountOutUSD,
                },
              }
            }
          } catch (error) {
            console.error('Failed to fetch price impact:', error)
          }
        }

        // Return original response if conditions are not met or request fails
        return baseResponse
      },
    }),
  }),
})

export default routeApi

export const { useLazyGetRouteQuery, useBuildRouteMutation } = routeApi
