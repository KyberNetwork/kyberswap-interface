import { FeeAmount, Pool } from '@vutien/dmm-v3-sdk'
import { Currency, Token } from '@vutien/sdk-core'
import { useActiveWeb3React } from 'hooks'
import React, { useMemo } from 'react'
import { useAllCurrencyCombinations } from './useAllCurrencyCombinations'
import { PoolState, usePools } from './usePools'

export function useProAmmSwapPools(
  currencyIn?: Currency,
  currencyOut?: Currency
): {
  pools: Pool[]
  loading: boolean
} {
  const { chainId } = useActiveWeb3React()

  const allCurrencyCombinations = useAllCurrencyCombinations(currencyIn, currencyOut)
  const allCurrencyCombinationsWithAllFees: [Token, Token, FeeAmount][] = useMemo(
    () =>
      allCurrencyCombinations.reduce<[Token, Token, FeeAmount][]>((list, [tokenA, tokenB]) => {
        return list.concat([
          [tokenA, tokenB, FeeAmount.LOWEST],
          [tokenA, tokenB, FeeAmount.LOW],
          [tokenA, tokenB, FeeAmount.MEDIUM],
          [tokenA, tokenB, FeeAmount.HIGH]
        ])
      }, []),
    [allCurrencyCombinations, chainId]
  )
  const pools = usePools(allCurrencyCombinationsWithAllFees)

  return useMemo(() => {
    return {
      pools: pools
        .filter((tuple): tuple is [PoolState.EXISTS, Pool] => {
          return tuple[0] === PoolState.EXISTS && tuple[1] !== null
        })
        .map(([, pool]) => pool),
      loading: pools.some(([state]) => state === PoolState.LOADING)
    }
  }, [pools])
}
