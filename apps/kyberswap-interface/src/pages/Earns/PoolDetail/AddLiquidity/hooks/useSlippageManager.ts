import { NATIVE_TOKEN_ADDRESS, POOL_CATEGORY, Pool, Token } from '@kyber/schema'
import { useEffect, useState } from 'react'

import { getNetworkInfo, getSlippageStorageKey } from 'pages/Earns/PoolDetail/AddLiquidity/utils'

type UseSlippageManagerProps = {
  pool: Pool | null
  tokensIn: Token[]
  chainId: number
}

export const useSlippageManager = ({ pool, tokensIn, chainId }: UseSlippageManagerProps) => {
  const [slippage, setSlippage] = useState<number | undefined>(undefined)

  useEffect(() => {
    setSlippage(undefined)
  }, [chainId, pool?.address])

  useEffect(() => {
    if (!pool || slippage !== undefined || !tokensIn.length) return

    if (pool.token0.symbol && pool.token1.symbol) {
      try {
        const storageKey = getSlippageStorageKey(pool.token0.symbol, pool.token1.symbol, chainId, pool.fee)
        const savedSlippage = localStorage.getItem(storageKey)

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

    const isTokensStable = tokensIn.every(token => token.isStable)
    const isTokensInPair = tokensIn.every(token => {
      const address =
        token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? getNetworkInfo(chainId).wrappedToken.address.toLowerCase()
          : token.address.toLowerCase()

      return pool.token0.address.toLowerCase() === address || pool.token1.address.toLowerCase() === address
    })

    if (pool.category === POOL_CATEGORY.STABLE_PAIR && isTokensStable) {
      setSlippage(1)
      return
    }

    if (pool.category === POOL_CATEGORY.CORRELATED_PAIR && isTokensInPair) {
      setSlippage(5)
      return
    }

    setSlippage(10)
  }, [chainId, pool, slippage, tokensIn])

  return {
    slippage,
    setSlippage,
  }
}
