import { useDebounce } from '@kyber/hooks'
import { Pool, Token } from '@kyber/schema'
import { getTokenBalances } from '@kyber/utils/crypto'
import { formatUnits } from '@kyber/utils/number'
import { useEffect, useState } from 'react'

import { formatAmountWithDecimals } from 'pages/Earns/PoolDetail/AddLiquidity/utils'

const getInitialAmountFromBalance = (balance: string, decimals: number, isNativeToken: boolean): string => {
  const parsedBalance = parseFloat(balance)
  if (!parsedBalance || Number.isNaN(parsedBalance) || parsedBalance <= 0) return ''

  const amount = parsedBalance >= 1 ? 1 : isNativeToken ? parsedBalance * 0.95 : parsedBalance
  return formatAmountWithDecimals(amount, decimals)
}

type UseInitialTokensInProps = {
  pool: Pool | null
  chainId: number
  account?: string
  nativeToken: Token
}

export const useInitialTokensIn = ({ pool, chainId, account, nativeToken }: UseInitialTokensInProps) => {
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

      if (!account) {
        setTokensIn([nativeToken])
        setAmountsIn('')
        setInitialized(true)
        return
      }

      const token0Address = pool.token0.address.toLowerCase()
      const token1Address = pool.token1.address.toLowerCase()
      const nativeTokenAddress = nativeToken.address.toLowerCase()
      const pairBalance = await getTokenBalances({
        tokenAddresses: Array.from(new Set([token0Address, token1Address, nativeTokenAddress])),
        chainId,
        account,
      })

      if (cancelled) return

      const token0Balance = formatUnits(BigInt(pairBalance[token0Address]).toString(), pool.token0.decimals)
      const token1Balance = formatUnits(BigInt(pairBalance[token1Address]).toString(), pool.token1.decimals)
      const nativeTokenBalance = formatUnits(BigInt(pairBalance[nativeTokenAddress]).toString(), nativeToken.decimals)
      const tokensToSet: Token[] = []
      const amountsToSet: string[] = []

      if (parseFloat(token0Balance) > 0) {
        tokensToSet.push(pool.token0)
        amountsToSet.push(
          getInitialAmountFromBalance(token0Balance, pool.token0.decimals, token0Address === nativeTokenAddress),
        )
      }

      if (parseFloat(token1Balance) > 0) {
        tokensToSet.push(pool.token1)
        amountsToSet.push(
          getInitialAmountFromBalance(token1Balance, pool.token1.decimals, token1Address === nativeTokenAddress),
        )
      }

      if (!tokensToSet.length) {
        tokensToSet.push(nativeToken)
        amountsToSet.push(getInitialAmountFromBalance(nativeTokenBalance || '1', nativeToken.decimals, true) || '1')
      }

      setTokensIn(tokensToSet)
      setAmountsIn(amountsToSet.join(','))
      setInitialized(true)
    }

    void setDefaultTokensIn()

    return () => {
      cancelled = true
    }
  }, [account, chainId, initialized, nativeToken, pool])

  return {
    tokensIn,
    amountsIn,
    debouncedAmountsIn,
    setTokensIn,
    setAmountsIn,
  }
}
