import { Pool, Position } from '@kyberswap/ks-sdk-elastic'

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

  let position = undefined
  if (pool && positionDetails) {
    position = new Position({
      pool,
      liquidity: positionDetails.liquidity.toString(),
      tickLower: positionDetails.tickLower,
      tickUpper: positionDetails.tickUpper,
    })
  }
  return {
    position,
    pool: pool ?? undefined,
    loading: poolState === PoolState.LOADING,
  }
}
