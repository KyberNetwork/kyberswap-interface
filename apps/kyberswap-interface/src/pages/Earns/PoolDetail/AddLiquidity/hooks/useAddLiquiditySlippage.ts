import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, POOL_CATEGORY, Pool, Token } from '@kyber/schema'
import { useEffect, useState } from 'react'

const getStorageKey = (token0Symbol: string, token1Symbol: string, chainId: number, feeTier: number) => {
  const sortedSymbols = [token0Symbol, token1Symbol].sort()
  return `kyber_liquidity_widget_slippage_${sortedSymbols[0]}_${sortedSymbols[1]}_${chainId}_${feeTier}`
}

interface UseAddLiquiditySlippageProps {
  chainId: number
  pool?: Pool | null
  tokensIn?: Token[]
}

export default function useAddLiquiditySlippage({ chainId, pool, tokensIn = [] }: UseAddLiquiditySlippageProps) {
  const [slippage, setSlippage] = useState<number | undefined>()

  useEffect(() => {
    if (!pool || slippage || !tokensIn.length) return

    if (pool.token0.symbol && pool.token1.symbol) {
      try {
        const savedSlippage = localStorage.getItem(
          getStorageKey(pool.token0.symbol, pool.token1.symbol, chainId, pool.fee),
        )
        if (savedSlippage) {
          const parsedSlippage = parseInt(savedSlippage, 10)
          if (!Number.isNaN(parsedSlippage) && parsedSlippage > 0) {
            if (parsedSlippage !== slippage) {
              setSlippage(parsedSlippage)
              return
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load slippage from localStorage:', error)
      }
    }

    const isStableTokens = tokensIn.every(token => token.isStable)
    const isTokensInPair = tokensIn.every(token => {
      const address =
        token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? (NETWORKS_INFO as any)[chainId].wrappedToken.address.toLowerCase()
          : token.address.toLowerCase()

      return pool.token0.address.toLowerCase() === address || pool.token1.address.toLowerCase() === address
    })

    if (pool.category === POOL_CATEGORY.STABLE_PAIR && isStableTokens) setSlippage(1)
    else if (pool.category === POOL_CATEGORY.CORRELATED_PAIR && isTokensInPair) setSlippage(5)
    else setSlippage(10)
  }, [chainId, pool, slippage, tokensIn])

  return {
    slippage,
    setSlippage,
  }
}
