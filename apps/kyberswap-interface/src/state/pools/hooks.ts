import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { AppState } from 'state/index'

import { setError, setSharedPoolId, updatePools } from './actions'

export interface UserLiquidityPosition {
  id: string
  liquidityTokenBalance: string
  pool: {
    id: string
    token0: {
      id: string
    }
    token1: {
      id: string
    }
    reserveUSD: string
    totalSupply: string
  }
}

export function useResetPools(chainId: ChainId) {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(updatePools({ pools: [] }))
    dispatch(setError(undefined))
  }, [chainId, dispatch])
}

export function useSelectedPool() {
  return useSelector((state: AppState) => state.pools.selectedPool)
}

export function useSharedPoolIdManager(): [string | undefined, (newSharedPoolId: string | undefined) => void] {
  const dispatch = useDispatch()
  const sharedPoolId = useSelector((state: AppState) => state.pools.sharedPoolId)

  const onSetSharedPoolId = useCallback(
    (newSharedPoolId: string | undefined) => {
      dispatch(setSharedPoolId({ poolId: newSharedPoolId }))
    },
    [dispatch],
  )

  return useMemo(() => [sharedPoolId, onSetSharedPoolId], [onSetSharedPoolId, sharedPoolId])
}
