import { createAction } from '@reduxjs/toolkit'

import { ClassicPoolData } from 'hooks/pool/classic/type'

import { UserLiquidityPosition } from './hooks'

export const updatePools = createAction<{ pools: ClassicPoolData[] }>('pools/updatePools')
export const setLoading = createAction<boolean>('pools/setLoading')
export const setError = createAction<Error | undefined>('pools/setError')
export const setSelectedPool = createAction<{
  poolData: ClassicPoolData
  myLiquidity?: UserLiquidityPosition
}>('pools/setSelectedPool')
export const setSharedPoolId = createAction<{ poolId: string | undefined }>('pools/setSharedPoolId')
