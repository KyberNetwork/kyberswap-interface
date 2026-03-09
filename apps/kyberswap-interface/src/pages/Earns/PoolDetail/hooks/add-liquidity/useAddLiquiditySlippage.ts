import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, POOL_CATEGORY, Pool, Token } from '@kyber/schema'
import { useEffect, useMemo, useState } from 'react'

const getStorageKey = (token0Symbol: string, token1Symbol: string, chainId: number, feeTier: number) => {
  const sortedSymbols = [token0Symbol, token1Symbol].sort()
  return `kyber_liquidity_widget_slippage_${sortedSymbols[0]}_${sortedSymbols[1]}_${chainId}_${feeTier}`
}

const getSuggestedSlippage = (pool?: Pool | null, tokensIn: Token[] = [], chainId?: number) => {
  if (!pool || !tokensIn.length || !chainId) return undefined

  const isStableTokens = tokensIn.every(token => token.isStable)
  const isTokensInPair = tokensIn.every(token => {
    const address =
      token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
        ? (NETWORKS_INFO as any)[chainId].wrappedToken.address.toLowerCase()
        : token.address.toLowerCase()

    return pool.token0.address.toLowerCase() === address || pool.token1.address.toLowerCase() === address
  })

  if (pool.category === POOL_CATEGORY.STABLE_PAIR && isStableTokens) return 1
  if (pool.category === POOL_CATEGORY.CORRELATED_PAIR && isTokensInPair) return 5

  return 10
}

interface UseAddLiquiditySlippageProps {
  chainId: number
  pool?: Pool | null
  tokensIn?: Token[]
}

export default function useAddLiquiditySlippage({ chainId, pool, tokensIn = [] }: UseAddLiquiditySlippageProps) {
  const [slippage, setSlippage] = useState<number | undefined>()

  const suggestedSlippage = useMemo(() => getSuggestedSlippage(pool, tokensIn, chainId), [chainId, pool, tokensIn])

  useEffect(() => {
    setSlippage(undefined)
  }, [chainId, pool?.address])

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
            setSlippage(parsedSlippage)
            return
          }
        }
      } catch (error) {
        console.warn('Failed to load slippage from localStorage:', error)
      }
    }

    if (suggestedSlippage !== undefined) setSlippage(suggestedSlippage)
  }, [chainId, pool, slippage, suggestedSlippage, tokensIn.length])

  return {
    slippage,
    suggestedSlippage,
    setSlippage,
  }
}
