import { ChainId, CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { GetRouteParams, GetRouteResponse } from 'services/route/types/getRoute'
import { fetchTokenPrices, getMidPrice } from 'services/tokenCatalog'

import { ETHER_ADDRESS } from 'constants/index'

const getWrappedToken = (token: string, chainId: ChainId) =>
  token.toLowerCase() === ETHER_ADDRESS.toLowerCase() ? WETH[chainId].address : token

/** Enrich the quote within its TanStack query, preserving the provider's raw USD values. */
export const enrichRouteResponse = async (
  baseResponse: GetRouteResponse,
  params: GetRouteParams,
): Promise<GetRouteResponse> => {
  const { routeSummary } = baseResponse?.data || {}
  const { chainId, tokenInDecimals, tokenOutDecimals, tokenIn, tokenOut } = params

  // Ensure all necessary data is available
  if (
    baseResponse?.data?.routeSummary &&
    routeSummary &&
    chainId &&
    // decimals can be 0
    tokenInDecimals !== null &&
    tokenInDecimals !== undefined &&
    tokenOutDecimals !== null &&
    tokenOutDecimals !== undefined
  ) {
    const { amountIn, amountOut } = routeSummary

    if (!routeSummary.amountInUsd || !routeSummary.amountOutUsd) {
      console.warn('[getRoute] aggregator returned empty amountInUsd/amountOutUsd', {
        amountInUsd: routeSummary.amountInUsd,
        amountOutUsd: routeSummary.amountOutUsd,
        tokenIn,
        tokenOut,
        chainId,
      })
    }

    try {
      const wrappedTokenIn = getWrappedToken(tokenIn, chainId)
      const wrappedTokenOut = getWrappedToken(tokenOut, chainId)

      const priceResponse = await fetchTokenPrices({ [chainId]: [wrappedTokenIn, wrappedTokenOut] })

      const tokenInMidPrice = getMidPrice(priceResponse?.data?.[chainId]?.[wrappedTokenIn])
      const tokenOutMidPrice = getMidPrice(priceResponse?.data?.[chainId]?.[wrappedTokenOut])

      const currencyIn = new Token(chainId, tokenIn, tokenInDecimals)
      const currencyOut = new Token(chainId, tokenOut, tokenOutDecimals)

      const tokenInBalance = CurrencyAmount.fromRawAmount(currencyIn, amountIn).toExact()
      const tokenOutBalance = CurrencyAmount.fromRawAmount(currencyOut, amountOut).toExact()

      return {
        ...baseResponse,
        data: {
          ...baseResponse.data,
          routeSummary: {
            ...routeSummary,
            amountInUsd: tokenInMidPrice ? (+tokenInBalance * tokenInMidPrice).toString() : '',
            amountOutUsd: tokenOutMidPrice ? (+tokenOutBalance * tokenOutMidPrice).toString() : '',
            rawAmountInUsd: routeSummary.amountInUsd,
            rawAmountOutUsd: routeSummary.amountOutUsd,
          },
        },
      }
    } catch (error) {
      console.error('[getRoute] on-chain price fetch failed; rawAmount*Usd will not be set', {
        error,
        tokenIn,
        tokenOut,
        chainId,
        apiAmountInUsd: routeSummary.amountInUsd,
        apiAmountOutUsd: routeSummary.amountOutUsd,
      })
    }
  } else {
    console.warn('[getRoute] transform skipped; rawAmount*Usd will not be set', {
      hasRouteSummary: !!routeSummary,
      chainId,
      tokenInDecimals,
      tokenOutDecimals,
      tokenIn,
      tokenOut,
      apiAmountInUsd: routeSummary?.amountInUsd,
      apiAmountOutUsd: routeSummary?.amountOutUsd,
    })
  }

  // Return original response if conditions are not met or request fails
  return baseResponse
}
