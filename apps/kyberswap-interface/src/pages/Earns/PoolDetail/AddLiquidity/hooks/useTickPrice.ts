import { useDebounce } from '@kyber/hooks'
import { Position, Token, univ3Position } from '@kyber/schema'
import { formatNumber } from '@kyber/utils/number'
import { tickToPrice } from '@kyber/utils/uniswapv3'
import { useEffect, useMemo, useState } from 'react'

type UseTickPriceProps = {
  token0?: Token
  token1?: Token
  revertPrice: boolean
  position: Position | null
}

export const useTickPrice = ({ token0, token1, revertPrice, position }: UseTickPriceProps) => {
  const [tickLower, setTickLower] = useState<number | null>(null)
  const [tickUpper, setTickUpper] = useState<number | null>(null)

  const debouncedTickLower = useDebounce(tickLower, 300)
  const debouncedTickUpper = useDebounce(tickUpper, 300)

  const minPrice = useMemo(() => {
    if (!token0 || !token1 || tickLower === null || tickUpper === null) return null

    return formatNumber(
      +tickToPrice(!revertPrice ? tickLower : tickUpper, token0.decimals, token1.decimals, revertPrice),
      8,
    )
  }, [revertPrice, tickLower, tickUpper, token0, token1])

  const maxPrice = useMemo(() => {
    if (!token0 || !token1 || tickLower === null || tickUpper === null) return null

    return formatNumber(
      +tickToPrice(!revertPrice ? tickUpper : tickLower, token0.decimals, token1.decimals, revertPrice),
      8,
    )
  }, [revertPrice, tickLower, tickUpper, token0, token1])

  useEffect(() => {
    if (position === null) return

    const { success: isUniV3Position, data } = univ3Position.safeParse(position)

    if (isUniV3Position && data.tickLower !== undefined && data.tickUpper !== undefined) {
      setTickLower(data.tickLower)
      setTickUpper(data.tickUpper)
    }
  }, [position])

  return {
    tickLower,
    tickUpper,
    setTickLower,
    setTickUpper,
    debouncedTickLower,
    debouncedTickUpper,
    minPrice,
    maxPrice,
  }
}
