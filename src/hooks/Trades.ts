import { Pair, Trade } from '@vutien/dmm-v2-sdk'
import { Currency, CurrencyAmount, Token, TradeType } from '@vutien/sdk-core'
import { useMemo, useEffect, useState, useCallback } from 'react'
import { BASES_TO_CHECK_TRADES_AGAINST, CUSTOM_BASES } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { useActiveWeb3React } from './index'
import { routerUri } from '../apollo/client'
import useDebounce from './useDebounce'
import { Aggregator } from '../utils/aggregator'
import { AggregationComparer } from '../state/swap/types'
import useParsedQueryString from './useParsedQueryString'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { useAllCurrencyCombinations } from './useAllCurrencyCombinations'

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[][] {
  const allPairCombinations = useAllCurrencyCombinations()

  const allPairs = usePairs(allPairCombinations)

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      allPairs.reduce<Pair[][]>((res, poolArray) => {
        const t = Object.values(
          poolArray
            .filter((result): result is [PairState.EXISTS, Pair] =>
              Boolean(result[0] === PairState.EXISTS && result[1])
            )
            .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
              memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
              return memo
            }, {})
        )
        res.push(t)
        return res
      }, []),
    [allPairs]
  )
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactIn(
  currencyAmountIn?: CurrencyAmount<Currency>,
  currencyOut?: Currency
): Trade<Currency, Currency, TradeType> | null {
  const allowedPairs = useAllCommonPairs(currencyAmountIn?.currency, currencyOut).filter(item => item.length > 0)
  const [trade, setTrade] = useState<Trade<Currency, Currency, TradeType> | null>(null)

  useEffect(() => {
    let timeout: any
    const fn = async function() {
      timeout = setTimeout(() => {
        if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
          if (process.env.REACT_APP_MAINNET_ENV === 'staging') {
            console.log('trade amount: ', currencyAmountIn.toSignificant(10))
          }
          setTrade(
            Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, {
              maxHops: 3,
              maxNumResults: 1
            })[0] ?? null
          )
        } else setTrade(null)
      }, 100)
    }
    fn()
    return () => {
      clearTimeout(timeout)
    }
  }, [currencyAmountIn?.toSignificant(10), currencyAmountIn?.currency, currencyOut, allowedPairs.length])

  return trade
  // return useMemo(() => {
  //   if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
  //     return (
  //       Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, { maxHops: 3, maxNumResults: 1 })[0] ?? null
  //     )
  //   }
  //   return null
  // }, [allowedPairs, currencyAmountIn, currencyOut])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(
  currencyIn?: Currency,
  currencyAmountOut?: CurrencyAmount<Currency>
): Trade<Currency, Currency, TradeType> | null {
  const allowedPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency).filter(item => item.length > 0)
  const [trade, setTrade] = useState<Trade<Currency, Currency, TradeType> | null>(null)
  useEffect(() => {
    let timeout: any
    const fn = async function() {
      timeout = setTimeout(() => {
        if (currencyAmountOut && currencyIn && allowedPairs.length > 0) {
          if (process.env.REACT_APP_MAINNET_ENV === 'staging') {
            console.log('trade amount: ', currencyAmountOut.toSignificant(10))
          }
          setTrade(
            Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, {
              maxHops: 3,
              maxNumResults: 1
            })[0] ?? null
          )
        } else setTrade(null)
      }, 100)
    }
    fn()
    return () => {
      clearTimeout(timeout)
    }
  }, [currencyAmountOut?.toSignificant(10), currencyAmountOut?.currency, currencyIn, allowedPairs.length])
  return trade
  // return useMemo(() => {
  //   if (currencyIn && currencyAmountOut && allowedPairs.length > 0) {
  //     return (
  //       Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: 3, maxNumResults: 1 })[0] ??
  //       null
  //     )
  //   }
  //   return null
  // }, [allowedPairs, currencyIn, currencyAmountOut])
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactInV2(
  currencyAmountIn?: CurrencyAmount<Currency>,
  currencyOut?: Currency,
  saveGas?: boolean
): {
  trade: Aggregator | null
  comparer: AggregationComparer | null
  onUpdateCallback: () => void
} {
  const { chainId } = useActiveWeb3React()
  const parsedQs: { dexes?: string } = useParsedQueryString()

  const [trade, setTrade] = useState<Aggregator | null>(null)
  const [comparer, setComparer] = useState<AggregationComparer | null>(null)

  const debouncedCurrencyAmountIn = useDebounce(currencyAmountIn?.toSignificant(10), 300)
  const debouncedCurrencyIn = useDebounce(currencyAmountIn?.currency, 300)

  const routerApi = useMemo((): string => {
    return (chainId && routerUri[chainId]) || ''
  }, [chainId])

  const gasPrice = useSelector((state: AppState) => state.application.gasPrice)
  const onUpdateCallback = useCallback(async () => {
    if (currencyAmountIn && currencyOut) {
      const state = await Aggregator.bestTradeExactIn(
        routerApi,
        currencyAmountIn,
        currencyOut,
        saveGas,
        parsedQs.dexes,
        gasPrice
      )
      setComparer(null)
      setTrade(state)
      const comparedResult = await Aggregator.compareDex(routerApi, currencyAmountIn, currencyOut)
      setComparer(comparedResult)
    } else {
      setTrade(null)
      setComparer(null)
    }
  }, [debouncedCurrencyAmountIn, debouncedCurrencyIn, currencyOut, routerApi, saveGas, gasPrice, parsedQs.dexes])

  useEffect(() => {
    let timeout: any
    const fn = function() {
      timeout = setTimeout(onUpdateCallback, 100)
    }
    fn()
    return () => {
      clearTimeout(timeout)
    }
  }, [onUpdateCallback])

  return {
    trade,
    comparer,
    onUpdateCallback
  }
}
