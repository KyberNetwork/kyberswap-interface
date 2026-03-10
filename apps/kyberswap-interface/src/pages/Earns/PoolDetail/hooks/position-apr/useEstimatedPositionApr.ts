import { skipToken } from '@reduxjs/toolkit/query'
import { useEstimatePositionAprQuery } from 'services/zapInService'

import useDebounce from 'hooks/useDebounce'

type AprData = {
  totalApr: number
  feeApr: number
  egApr: number
  lmApr: number
}

interface UseEstimatedPositionAprProps {
  chainId: number
  poolAddress: string
  tickLower: number | null
  tickUpper: number | null
  positionLiquidity?: string | number | null
  positionTvl?: string | number | null
  enabled?: boolean
}

const isMissingLiquidity = (value?: string | number | null) => {
  if (value === undefined || value === null) return true
  if (typeof value === 'number') return value <= 0

  const normalizedValue = value.trim()
  return !normalizedValue || Number(normalizedValue) <= 0
}

export default function useEstimatedPositionApr({
  chainId,
  poolAddress,
  tickLower,
  tickUpper,
  positionLiquidity,
  positionTvl,
  enabled = true,
}: UseEstimatedPositionAprProps) {
  const debouncedLower = useDebounce(tickLower, 150)
  const debouncedUpper = useDebounce(tickUpper, 150)
  const shouldSkip =
    !enabled ||
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

  return {
    data: (data as AprData | undefined) || null,
    loading: isFetching,
  }
}
