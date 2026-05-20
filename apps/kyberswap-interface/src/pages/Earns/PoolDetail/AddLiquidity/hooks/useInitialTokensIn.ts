import { useDebounce } from '@kyber/hooks'
import { Pool, Token } from '@kyber/schema'
import { getTokenBalances } from '@kyber/utils/crypto'
import { useEffect, useState } from 'react'

const DEFAULT_AMOUNT_USD_VALUE = 100
const DEFAULT_AMOUNT_MULTIPLIERS = [1, 2, 5]
const MAX_DEFAULT_AMOUNT_EXPONENT = 30

const getMinimumUsdAmount = (price: number) => {
  if (!price || price <= 0) return undefined

  for (let exponent = 0; exponent <= MAX_DEFAULT_AMOUNT_EXPONENT; exponent += 1) {
    for (const multiplier of DEFAULT_AMOUNT_MULTIPLIERS) {
      const amount = multiplier * 10 ** exponent
      if (amount * price >= DEFAULT_AMOUNT_USD_VALUE) {
        return `${multiplier}${'0'.repeat(exponent)}`
      }
    }
  }

  return undefined
}

const getInitialAmountFromPrice = (price: number | undefined): string => {
  const amount = getMinimumUsdAmount(price || 0)
  return amount || ''
}

type UseInitialTokensInProps = {
  pool: Pool | null
  chainId: number
  account?: string
  nativeToken: Token
  tokenPrices?: Record<string, number>
  tokenPricesLoading?: boolean
}

export const useInitialTokensIn = ({
  pool,
  chainId,
  account,
  nativeToken,
  tokenPrices = {},
  tokenPricesLoading = false,
}: UseInitialTokensInProps) => {
  const [tokensIn, setTokensIn] = useState<Token[]>([])
  const [amountsIn, setAmountsIn] = useState('')
  const [initialized, setInitialized] = useState(false)

  const debouncedAmountsIn = useDebounce(amountsIn, 300)

  useEffect(() => {
    setTokensIn([])
    setAmountsIn('')
    setInitialized(false)
  }, [chainId, pool?.address])

  useEffect(() => {
    let cancelled = false

    const setDefaultTokensIn = async () => {
      if (!pool || initialized) return
      if (tokenPricesLoading) return

      const nativeTokenAddress = nativeToken.address.toLowerCase()

      if (!account) {
        setTokensIn([nativeToken])
        setAmountsIn(getInitialAmountFromPrice(tokenPrices[nativeTokenAddress]))
        setInitialized(true)
        return
      }

      const token0Address = pool.token0.address.toLowerCase()
      const token1Address = pool.token1.address.toLowerCase()
      const pairBalance = await getTokenBalances({
        tokenAddresses: Array.from(new Set([token0Address, token1Address, nativeTokenAddress])),
        chainId,
        account,
      })

      if (cancelled) return

      const tokensToSet: Token[] = []
      const amountsToSet: string[] = []

      const hasToken0Balance = BigInt(pairBalance[token0Address] || '0') > 0n
      const hasToken1Balance = BigInt(pairBalance[token1Address] || '0') > 0n
      const isToken0PricedHigher = (tokenPrices[token0Address] || 0) >= (tokenPrices[token1Address] || 0)

      const shouldUseToken0 = hasToken0Balance && (!hasToken1Balance || isToken0PricedHigher)
      const shouldUseToken1 = hasToken1Balance && (!hasToken0Balance || !isToken0PricedHigher)

      if (shouldUseToken0) {
        tokensToSet.push(pool.token0)
        amountsToSet.push(getInitialAmountFromPrice(tokenPrices[token0Address]))
      }

      if (shouldUseToken1) {
        tokensToSet.push(pool.token1)
        amountsToSet.push(getInitialAmountFromPrice(tokenPrices[token1Address]))
      }

      if (!tokensToSet.length) {
        tokensToSet.push(nativeToken)
        amountsToSet.push(getInitialAmountFromPrice(tokenPrices[nativeTokenAddress]))
      }

      setTokensIn(tokensToSet)
      setAmountsIn(amountsToSet.join(','))
      setInitialized(true)
    }

    void setDefaultTokensIn()

    return () => {
      cancelled = true
    }
  }, [account, chainId, initialized, nativeToken, pool, tokenPrices, tokenPricesLoading])

  return {
    tokensIn,
    amountsIn,
    debouncedAmountsIn,
    setTokensIn,
    setAmountsIn,
  }
}
