import { ZapRouteDetail } from '@kyber/schema'
import { useMemo } from 'react'

interface UseAddLiquidityPositionAprProps {
  amounts: string
  route?: ZapRouteDetail | null
}

export default function useAddLiquidityPositionApr({ amounts, route }: UseAddLiquidityPositionAprProps) {
  return useMemo(() => {
    const hasInput = amounts.split(',').some(value => Number.isFinite(Number(value.trim())) && Number(value.trim()) > 0)

    return {
      hasInput,
      positionLiquidity: route?.positionDetails?.addedLiquidity || null,
      positionTvl: route?.positionDetails?.addedAmountUsd || null,
    }
  }, [amounts, route])
}
