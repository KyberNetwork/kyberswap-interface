import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { useMemo } from 'react'

import { PositionDetails } from 'types/position'

import { useCurrency } from './Tokens'
import { PoolState, usePool } from './usePools'

export function useProAmmDerivedPositionInfo(positionDetails: PositionDetails | undefined): {
  position: Position | undefined
  pool: Pool | undefined
  loading: boolean
} {
  const currency0 = useCurrency(positionDetails?.token0)
  const currency1 = useCurrency(positionDetails?.token1)

  // construct pool data
  const [poolState, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, positionDetails?.fee)

  const liquidity = positionDetails?.liquidity.toString()
  const tickLower = positionDetails?.tickLower
  const tickUpper = positionDetails?.tickUpper
  const position = useMemo(() => {
    if (pool && liquidity && tickUpper !== undefined && tickLower !== undefined) {
      return new Position({
        pool,
        liquidity,
        tickLower,
        tickUpper,
      })
    }
    return undefined
  }, [pool, liquidity, tickLower, tickUpper])

  return {
    position,
    pool: pool ?? undefined,
    loading: poolState === PoolState.LOADING,
  }
}
