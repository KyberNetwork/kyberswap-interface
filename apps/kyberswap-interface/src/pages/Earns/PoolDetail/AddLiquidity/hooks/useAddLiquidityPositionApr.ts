import { ZapRouteDetail } from '@kyber/schema'
import { skipToken } from '@reduxjs/toolkit/query'
import { useMemo } from 'react'
import { useEstimatePositionAprQuery } from 'services/zapInService'

import useDebounce from 'hooks/useDebounce'

type AprData = {
  totalApr: number
  feeApr: number
  egApr: number
  lmApr: number
}

interface UseAddLiquidityPositionAprProps {
  chainId?: number
  poolAddress?: string
  tickLower: number | null
  tickUpper: number | null
  amounts: string
  route?: ZapRouteDetail | null
  routeLoading?: boolean
  enabled?: boolean
}

const isMissingLiquidity = (value?: string | number | null) => {
  if (value === undefined || value === null) return true
  if (typeof value === 'number') return value <= 0

  const normalizedValue = value.trim()
  return !normalizedValue || Number(normalizedValue) <= 0
}

export default function useAddLiquidityPositionApr({
  chainId,
  poolAddress,
  tickLower,
  tickUpper,
  amounts,
  route,
  routeLoading = false,
  enabled = true,
}: UseAddLiquidityPositionAprProps) {
  const hasInput = useMemo(
    () => amounts.split(',').some(value => Number.isFinite(Number(value.trim())) && Number(value.trim()) > 0),
    [amounts],
  )
  const positionLiquidity = route?.positionDetails?.addedLiquidity || null
  const positionTvl = route?.positionDetails?.addedAmountUsd || null
  const debouncedLower = useDebounce(tickLower, 150)
  const debouncedUpper = useDebounce(tickUpper, 150)
  const shouldSkip =
    routeLoading ||
    !enabled ||
    !chainId ||
    !poolAddress ||
    debouncedLower === null ||
    debouncedUpper === null ||
    debouncedLower === debouncedUpper ||
    isMissingLiquidity(positionLiquidity)
  const { data, isFetching } = useEstimatePositionAprQuery(
    shouldSkip
      ? skipToken
      : {
          chainId,
          poolAddress,
          tickLower: debouncedLower,
          tickUpper: debouncedUpper,
          positionLiquidity: String(positionLiquidity),
          positionTvl: String(positionTvl ?? 0),
        },
  )

  return useMemo(
    () => ({
      hasInput,
      data: (data as AprData | undefined) || null,
      loading: routeLoading || isFetching,
    }),
    [data, hasInput, isFetching, routeLoading],
  )
}
