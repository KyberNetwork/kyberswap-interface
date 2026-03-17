import { Pool, PoolType, Token } from '@kyber/schema'
import { skipToken } from '@reduxjs/toolkit/query'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { useMemo } from 'react'
import { useGetZapInRouteQuery } from 'services/zapInService'

import useDebounce from 'hooks/useDebounce'

interface UseAddLiquidityRouteProps {
  chainId: number
  poolAddress: string
  poolType: PoolType
  pool?: Pool | null
  account?: string
  positionId?: string | number
  tokensIn?: Token[]
  amountsIn?: string
  slippage?: number
  tickLower?: number | null
  tickUpper?: number | null
}

const hasPositiveAmount = (amountsIn: string) =>
  amountsIn.split(',').some(value => Number.isFinite(Number(value.trim())) && Number(value.trim()) > 0)

const getErrorMessage = (error?: FetchBaseQueryError | { error?: string }) => {
  if (!error) return ''
  if ('error' in error && typeof error.error === 'string') return error.error
  if ('data' in error && typeof error.data === 'string') return error.data
  return 'Failed to get zap route'
}

export default function useAddLiquidityRoute({
  chainId,
  poolAddress,
  poolType,
  pool,
  account,
  positionId,
  tokensIn = [],
  amountsIn = '',
  slippage,
  tickLower,
  tickUpper,
}: UseAddLiquidityRouteProps) {
  const debouncedAmountsIn = useDebounce(amountsIn, 200)
  const debouncedTickLower = useDebounce(tickLower, 150)
  const debouncedTickUpper = useDebounce(tickUpper, 150)
  const isRouteActive = useMemo(() => {
    if (!pool || !slippage || !tokensIn.length || !hasPositiveAmount(amountsIn)) return false

    if ('minTick' in pool && 'maxTick' in pool) {
      if (tickLower == null || tickUpper == null || tickLower >= tickUpper) {
        return false
      }
    }

    return true
  }, [amountsIn, pool, slippage, tickLower, tickUpper, tokensIn])

  const queryArgs = useMemo(() => {
    if (!pool || !slippage || !tokensIn.length || !hasPositiveAmount(debouncedAmountsIn)) return skipToken

    if ('minTick' in pool && 'maxTick' in pool) {
      if (debouncedTickLower == null || debouncedTickUpper == null || debouncedTickLower >= debouncedTickUpper) {
        return skipToken
      }
    }

    return {
      chainId,
      poolAddress,
      poolType,
      pool,
      tokensIn,
      amountsIn: debouncedAmountsIn,
      slippage,
      tickLower: debouncedTickLower,
      tickUpper: debouncedTickUpper,
      account,
      positionId,
    }
  }, [
    account,
    chainId,
    debouncedAmountsIn,
    debouncedTickLower,
    debouncedTickUpper,
    pool,
    poolAddress,
    poolType,
    positionId,
    slippage,
    tokensIn,
  ])

  const routeResult = useGetZapInRouteQuery(queryArgs, {
    pollingInterval: 10_000,
    refetchOnMountOrArgChange: true,
  })

  return {
    route: isRouteActive ? routeResult.data || null : null,
    routeError: isRouteActive
      ? getErrorMessage(routeResult.error as FetchBaseQueryError | { error?: string } | undefined)
      : '',
    routeLoading: isRouteActive ? routeResult.isLoading || routeResult.isFetching : false,
  }
}
