import { Pair, Trade } from '@kyberswap/ks-sdk-classic'
import { Currency, CurrencyAmount, Token, TradeType } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { ZERO_ADDRESS } from 'constants/index'
import { PairState, usePairs } from 'data/Reserves'
import { useActiveWeb3React } from 'hooks/index'
import { useAllCurrencyCombinations } from 'hooks/useAllCurrencyCombinations'
import useDebounce from 'hooks/useDebounce'
import { AppState } from 'state'
import { useAllDexes, useExcludeDexes } from 'state/customizeDexes/hooks'
import { usePermitData } from 'state/swap/hooks'
import { useAllTransactions } from 'state/transactions/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { isAddress } from 'utils'
import { Aggregator } from 'utils/aggregator'

import { useKyberswapGlobalConfig } from './useKyberSwapConfig'

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[][] {
  const allPairCombinations = useAllCurrencyCombinations(currencyA, currencyB)

  const allPairs = usePairs(allPairCombinations)

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      allPairs.reduce<Pair[][]>((res, poolArray) => {
        const t = Object.values(
          poolArray
            .filter((result): result is [PairState.EXISTS, Pair] =>
              Boolean(result[0] === PairState.EXISTS && result[1]),
            )
            .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
              memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
              return memo
            }, {}),
        )
        res.push(t)
        return res
      }, []),
    [allPairs],
  )
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactIn(
  currencyAmountIn?: CurrencyAmount<Currency>,
  currencyOut?: Currency,
): Trade<Currency, Currency, TradeType> | null {
  const currencyIn = useMemo(() => currencyAmountIn?.currency, [currencyAmountIn])
  const allCommonPairs = useAllCommonPairs(currencyIn, currencyOut)
  const allowedPairs = useMemo(() => allCommonPairs.filter(item => item.length > 0), [allCommonPairs])
  const [trade, setTrade] = useState<Trade<Currency, Currency, TradeType> | null>(null)

  useEffect(() => {
    let timeout: any
    const fn = async function () {
      timeout = setTimeout(() => {
        if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
          setTrade(
            Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, {
              maxHops: 3,
              maxNumResults: 1,
            })[0] ?? null,
          )
        } else setTrade(null)
      }, 100)
    }
    fn()
    return () => {
      clearTimeout(timeout)
    }
  }, [currencyAmountIn, currencyOut, allowedPairs])

  return trade
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out.
 */
export function useTradeExactInV2(
  currencyAmountIn: CurrencyAmount<Currency> | undefined,
  currencyOut: Currency | undefined,
  recipient: string | null,
): {
  trade: Aggregator | null
  onUpdateCallback: (resetRoute: boolean, minimumLoadingTime: number) => void
  loading: boolean
} {
  const { account, chainId } = useActiveWeb3React()
  const controller = useRef(new AbortController())
  const [allowedSlippage] = useUserSlippageTolerance()
  const txsInChain = useAllTransactions()
  const { aggregatorAPI } = useKyberswapGlobalConfig()
  const allDexes = useAllDexes()
  const [excludeDexes] = useExcludeDexes()

  const selectedDexes = allDexes?.filter(item => !excludeDexes.includes(item.id)).map(item => item.id)

  const dexes =
    selectedDexes?.length === allDexes?.length
      ? ''
      : selectedDexes?.join(',').replace('kyberswapv1', 'kyberswap,kyberswap-static') || ''

  const [trade, setTrade] = useState<Aggregator | null>(null)
  const [loading, setLoading] = useState(false)

  const debounceCurrencyAmountIn = useDebounce(currencyAmountIn, 100)

  const ttl = useSelector<AppState, number>(state => state.user.userDeadline)

  const permitData = usePermitData(currencyAmountIn?.currency.wrapped.address)

  // refresh aggregator data on new sent tx
  const allTxGroup = useMemo(() => JSON.stringify(Object.keys(txsInChain || {})), [txsInChain])

  const onUpdateCallback = useCallback(
    async (resetRoute: boolean, minimumLoadingTime: number) => {
      if (
        debounceCurrencyAmountIn &&
        currencyOut &&
        (debounceCurrencyAmountIn.currency as Token)?.address !== (currencyOut as Token)?.address
      ) {
        if (resetRoute) setTrade(null)
        controller.current.abort()

        controller.current = new AbortController()
        const signal = controller.current.signal

        setLoading(true)

        const to = (isAddress(chainId, recipient) ? (recipient as string) : account) ?? ZERO_ADDRESS

        const deadline = Math.round(Date.now() / 1000) + ttl

        const state = await Aggregator.bestTradeExactIn(
          aggregatorAPI,
          debounceCurrencyAmountIn,
          currencyOut,
          dexes,
          allowedSlippage,
          deadline,
          to,
          signal,
          minimumLoadingTime,
          permitData && permitData.rawSignature,
        )

        if (!signal.aborted) {
          setTrade(prev => {
            try {
              if (JSON.stringify(prev) !== JSON.stringify(state)) return state
            } catch (e) {
              return state
            }
            return prev
          })
        }
        setLoading(false)
      } else {
        setTrade(null)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      allTxGroup, // required. Refresh aggregator data after swap.
      debounceCurrencyAmountIn,
      currencyOut,
      chainId,
      recipient,
      account,
      ttl,
      aggregatorAPI,
      dexes,
      allowedSlippage,
      permitData,
    ],
  )

  useEffect(() => {
    onUpdateCallback(false, 0)
  }, [onUpdateCallback])

  return {
    trade, //todo: not return this anymore, set & use it from redux
    onUpdateCallback,
    loading,
  }
}
