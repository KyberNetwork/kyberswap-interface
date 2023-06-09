import { useQuery } from '@apollo/client'
import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { FeeAmount, TICK_SPACINGS, tickToPrice } from '@kyberswap/ks-sdk-elastic'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import { ALL_TICKS, Tick } from 'apollo/queries/promm'
import { isEVM as isEVMNetwork } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { usePoolv2 } from 'hooks/usePoolv2'
import { useKyberSwapConfig } from 'state/application/hooks'
import computeSurroundingTicks from 'utils/computeSurroundingTicks'

import { PoolState } from './usePools'

const PRICE_FIXED_DIGITS = 8

// Tick with fields parsed to JSBIs, and active liquidity computed.
export interface TickProcessed {
  tickIdx: number
  liquidityActive: JSBI
  liquidityNet: JSBI
  price0: string
}

const getActiveTick = (tickCurrent: number | undefined, feeAmount: FeeAmount | undefined) =>
  tickCurrent !== undefined && feeAmount
    ? Math.floor(tickCurrent / TICK_SPACINGS[feeAmount]) * TICK_SPACINGS[feeAmount]
    : undefined

// Fetches all ticks for a given pool
function useAllV3Ticks(chainId: ChainId, poolAddress = '') {
  const { elasticClient } = useKyberSwapConfig(chainId)
  const isEVM = isEVMNetwork(chainId)

  const {
    loading: isLoading,
    data,
    error,
  } = useQuery(ALL_TICKS(poolAddress.toLowerCase()), {
    client: elasticClient,
    pollInterval: 30_000,
    skip: !isEVM || !poolAddress,
  })

  return {
    isLoading,
    isUninitialized: false,
    isError: !!error,
    error,
    ticks: data?.ticks as Tick[],
  }
}

export function usePoolActiveLiquidity(
  poolAddress: string,
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined,
): {
  isLoading: boolean
  isUninitialized: boolean
  isError: boolean
  error: any
  activeTick: number | undefined
  data: TickProcessed[] | undefined
} {
  const { chainId: currentChainId } = useActiveWeb3React()
  const chainId = currencyA?.chainId || currentChainId

  const { pool, poolState } = usePoolv2(chainId, poolAddress, currencyA, currencyB, feeAmount)

  // Find nearest valid tick for pool in case tick is not initialized.
  const activeTick = useMemo(() => getActiveTick(pool?.tickCurrent, feeAmount), [pool, feeAmount])
  const { isLoading, isUninitialized, isError, error, ticks } = useAllV3Ticks(chainId, poolAddress)

  return useMemo(() => {
    if (
      !currencyA ||
      !currencyB ||
      activeTick === undefined ||
      poolState !== PoolState.EXISTS ||
      !ticks ||
      ticks.length === 0 ||
      isLoading ||
      isUninitialized
    ) {
      return {
        isLoading: isLoading || poolState === PoolState.LOADING,
        isUninitialized,
        isError,
        error,
        activeTick,
        data: undefined,
      }
    }

    const token0 = currencyA?.wrapped
    const token1 = currencyB?.wrapped

    // find where the active tick would be to partition the array
    // if the active tick is initialized, the pivot will be an element
    // if not, take the previous tick as pivot
    const pivot = ticks.findIndex(({ tickIdx }) => tickIdx > activeTick) - 1

    if (pivot < 0) {
      // consider setting a local error
      console.error('TickData pivot not found')
      return {
        isLoading,
        isUninitialized,
        isError,
        error,
        activeTick,
        data: undefined,
      }
    }

    const activeTickProcessed: TickProcessed = {
      liquidityActive: JSBI.BigInt(pool?.liquidity ?? 0),
      tickIdx: activeTick,
      liquidityNet:
        Number(ticks[pivot].tickIdx) === activeTick ? JSBI.BigInt(ticks[pivot].liquidityNet) : JSBI.BigInt(0),
      price0: tickToPrice(token0, token1, activeTick).toFixed(PRICE_FIXED_DIGITS),
    }

    const subsequentTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, ticks, pivot, true)

    const previousTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, ticks, pivot, false)

    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks)

    return {
      isLoading,
      isUninitialized,
      isError,
      error,
      activeTick,
      data: ticksProcessed,
    }
  }, [activeTick, currencyA, currencyB, error, isError, isLoading, isUninitialized, pool?.liquidity, poolState, ticks])
}
