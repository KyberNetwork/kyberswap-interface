import { Route, SwapQuoter, Trade } from '@vutien/dmm-v3-sdk'
import { Currency, CurrencyAmount, TradeType } from '@vutien/sdk-core'
import { useActiveWeb3React } from 'hooks'
import { useMemo } from 'react'
import { useSingleContractWithCallData } from 'state/multicall/hooks'
import { TradeState } from 'state/routing/types'
import { useProAmmQuoter } from './useContract'
import { useProAmmAllRoutes } from './useProAmmAllRoutes'

export function useProAmmClientSideTrade<TTradeType extends TradeType>(
  tradeType: TTradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
) {
  const [currencyIn, currencyOut] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [tradeType, amountSpecified, otherCurrency]
  )
  const { routes, loading: routesLoading } = useProAmmAllRoutes(currencyIn, currencyOut)

  const { chainId } = useActiveWeb3React()
  const quoter = useProAmmQuoter()

  const quotesResults = useSingleContractWithCallData(
    quoter,
    amountSpecified
      ? routes.map(route => SwapQuoter.quoteCallParameters(route, amountSpecified, tradeType).calldata)
      : [],
    {
      gasRequired: 2_000_000
    }
  )
  // { "internalType": "uint256", "name": "usedAmount", "type": "uint256" },
  // { "internalType": "uint256", "name": "returnedAmount", "type": "uint256" },
  // { "internalType": "uint160", "name": "afterSqrtP", "type": "uint160" },
  // { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" },
  // { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }

  console.log('=====quotesResults', routes, quotesResults)
  const t = useMemo(() => {
    if (
      !amountSpecified ||
      !currencyIn ||
      !currencyOut ||
      quotesResults.some(({ valid }) => !valid) ||
      // skip when tokens are the same
      (tradeType === TradeType.EXACT_INPUT
        ? amountSpecified.currency.equals(currencyOut)
        : amountSpecified.currency.equals(currencyIn))
    ) {
      return {
        state: TradeState.INVALID,
        trade: undefined
      }
    }

    if (routesLoading || quotesResults.some(({ loading }) => loading)) {
      return {
        state: TradeState.LOADING,
        trade: undefined
      }
    }
    const { bestRoute, amountIn, amountOut } = quotesResults.reduce(
      (
        currentBest: {
          bestRoute: Route<Currency, Currency> | null
          amountIn: CurrencyAmount<Currency> | null
          amountOut: CurrencyAmount<Currency> | null
        },
        { result },
        i
      ) => {
        if (!result) return currentBest
        // overwrite the current best if it's not defined or if this route is better
        if (tradeType === TradeType.EXACT_INPUT) {
        } else {
        }
        return currentBest
      },
      {
        bestRoute: null,
        amountIn: null,
        amountOut: null
      }
    )

    if (!bestRoute || !amountIn || !amountOut) {
      return {
        state: TradeState.NO_ROUTE_FOUND,
        trade: undefined
      }
    }
    return {}
  }, [amountSpecified, currencyIn, currencyOut, quotesResults, routes, routesLoading, tradeType])
}
