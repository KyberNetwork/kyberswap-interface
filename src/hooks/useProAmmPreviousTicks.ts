import { computePoolAddress, Pool, Position, TickMath } from '@vutien/dmm-v3-sdk'
import { ZERO_ADDRESS } from 'constants/index'
import {
  PRO_AMM_CORE_FACTORY_ADDRESSES,
  PRO_AMM_INIT_CODE_HASH,
  PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES
} from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useMemo } from 'react'
import { Result, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useProAmmTickReader } from './useContract'

const isNullOrUndefined = <T>(value: T) => value === null || value === undefined

function usePoolAddress(pool: Pool | null | undefined): string {
  const { chainId } = useActiveWeb3React()
  return useMemo(() => {
    const proAmmCoreFactoryAddress = chainId && PRO_AMM_CORE_FACTORY_ADDRESSES[chainId]
    if (!!proAmmCoreFactoryAddress && !!pool) {
      return computePoolAddress({
        factoryAddress: proAmmCoreFactoryAddress,
        tokenA: pool.token0,
        tokenB: pool.token1,
        fee: pool.fee,
        initCodeHashManualOverride: PRO_AMM_INIT_CODE_HASH
      })
    }
    return ''
  }, [chainId, pool])
}
export default function useProAmmPreviousTicks(
  pool: Pool | null | undefined,
  position: Position | undefined
): number[] | undefined {
  const tickReader = useProAmmTickReader()
  const poolAddress = usePoolAddress(position?.pool)

  const results = useSingleContractMultipleData(
    tickReader,
    'getNearestInitializedTicks',
    [
      [poolAddress, position?.tickLower],
      [poolAddress, position?.tickUpper]
    ].filter(item => !!pool && !isNullOrUndefined(item[0]) && !isNullOrUndefined(item[1]))
  )

  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])
  return useMemo(() => {
    if (!pool) return [TickMath.MIN_TICK, TickMath.MIN_TICK]
    if (!loading && !error && !!pool) {
      return results.map(call => {
        const result = call.result as Result
        return result.previous
      })
    }
    return undefined
  }, [results, loading, error, pool])
}

export function useProAmmTotalFeeOwedByPosition(
  pool: Pool | null | undefined,
  tokenID: string | null | undefined
): number[] {
  const tickReader = useProAmmTickReader()
  const poolAddress = usePoolAddress(pool)
  const { chainId } = useActiveWeb3React()

  const result = useSingleContractMultipleData(
    tickReader,
    'getTotalFeesOwedToPosition',
    [[chainId && PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId], poolAddress, tokenID!!]].filter(
      item => !!item[0] && !!item[1] && !!item[2]
    )
  )?.[0]?.result
  return result ? [result[0], result[1]] : []
}
