import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, PoolType, Token } from '@kyber/schema'
import { ChainId as AppChainId, Token as SDKToken } from '@kyberswap/ks-sdk-core'
import { skipToken } from '@reduxjs/toolkit/query'
import { useEffect, useMemo, useState } from 'react'
import { useAddLiquidityPoolInfoQuery, useAddLiquidityTokensQuery } from 'services/zapInService'

import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useNativeBalance, useTokenBalances } from 'state/wallet/hooks'

const formatAmountWithDecimals = (amount: string | number, decimals: number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(numAmount) || numAmount <= 0) return '0'

  const factor = Math.pow(10, decimals)
  const truncated = Math.floor(numAmount * factor) / factor
  return truncated.toFixed(decimals).replace(/\.?0+$/, '') || '0'
}

interface UseAddLiquidityTokensProps {
  chainId: number
  poolAddress: string
  poolType: PoolType
  account?: string
  initDepositTokens?: string
  initAmounts?: string
}

const getDefaultNativeToken = (chainId: number): Token => {
  const network = (NETWORKS_INFO as any)[chainId]
  const wrappedToken = network.wrappedToken

  return {
    ...wrappedToken,
    address: NATIVE_TOKEN_ADDRESS.toLowerCase(),
    logo: network.nativeLogo,
    symbol: wrappedToken.symbol.slice(1) || wrappedToken.symbol,
    name: network.label,
  }
}

export default function useAddLiquidityTokens({
  chainId,
  poolAddress,
  poolType,
  account,
  initDepositTokens,
  initAmounts,
}: UseAddLiquidityTokensProps) {
  const [tokensIn, setTokensIn] = useState<Token[]>([])
  const [amountsIn, setAmountsIn] = useState('')

  const { data: poolInfo, isLoading: poolLoading } = useAddLiquidityPoolInfoQuery(
    chainId && poolAddress
      ? {
          chainId,
          poolAddress,
          poolType,
        }
      : skipToken,
  )
  const initAddresses = useMemo(() => initDepositTokens?.split(',').filter(Boolean) || [], [initDepositTokens])
  const { data: initialTokens = [] } = useAddLiquidityTokensQuery(
    chainId && initAddresses.length
      ? {
          chainId,
          addresses: initAddresses,
        }
      : skipToken,
  )

  const nativeToken = useMemo(() => getDefaultNativeToken(chainId), [chainId])
  const pool = poolInfo?.pool || null
  const poolError = poolInfo?.error || ''
  const nativeBalance = useNativeBalance(chainId as AppChainId)
  const pairBalanceTokens = useMemo(
    () =>
      pool
        ? [pool.token0, pool.token1].map(
            token => new SDKToken(chainId as AppChainId, token.address, token.decimals, token.symbol, token.name),
          )
        : [],
    [chainId, pool],
  )
  const pairTokenBalances = useTokenBalances(pairBalanceTokens, chainId as AppChainId)
  const selectedBalanceTokens = useMemo(
    () =>
      tokensIn
        .filter(token => token.address.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase())
        .map(token => new SDKToken(chainId as AppChainId, token.address, token.decimals, token.symbol, token.name)),
    [chainId, tokensIn],
  )
  const selectedTokenBalances = useTokenBalances(selectedBalanceTokens, chainId as AppChainId)
  const tokenPrices = useTokenPrices(
    useMemo(() => tokensIn.map(token => token.address.toLowerCase()), [tokensIn]),
    chainId as AppChainId,
  )
  const tokenBalances = useMemo(
    () =>
      tokensIn.reduce<Record<string, bigint>>((acc, token) => {
        if (token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
          acc[token.address.toLowerCase()] = BigInt(nativeBalance?.quotient?.toString() || '0')
          return acc
        }

        acc[token.address.toLowerCase()] = BigInt(selectedTokenBalances[token.address]?.quotient?.toString() || '0')
        return acc
      }, {}),
    [nativeBalance?.quotient, selectedTokenBalances, tokensIn],
  )

  useEffect(() => {
    setTokensIn([])
    setAmountsIn('')
  }, [chainId, poolAddress, poolType])

  useEffect(() => {
    let cancelled = false

    const initTokens = async () => {
      if (!pool || tokensIn.length) return

      if (initDepositTokens && initialTokens.length) {
        if (cancelled) return
        if (initialTokens.length) {
          const initialAmounts = (initAmounts?.split(',') || []).map(amount => amount || '')
          setTokensIn(initialTokens)
          setAmountsIn(initialAmounts.slice(0, initialTokens.length).join(','))
          return
        }
      }

      if (!account) {
        setTokensIn([nativeToken])
        return
      }

      const token0Address = pool.token0.address.toLowerCase()
      const token1Address = pool.token1.address.toLowerCase()
      const nativeTokenAddress = nativeToken.address.toLowerCase()

      const tokensToSet: Token[] = []
      const amountsToSet: string[] = []

      const token0Balance = pairTokenBalances[pool.token0.address]?.toExact() || '0'
      const token1Balance = pairTokenBalances[pool.token1.address]?.toExact() || '0'
      const fallbackNativeBalance = nativeBalance?.toExact() || '0'

      if (parseFloat(token0Balance) > 0) {
        tokensToSet.push(pool.token0)
        const amount =
          parseFloat(token0Balance) >= 1
            ? 1
            : token0Address === nativeTokenAddress
            ? parseFloat(token0Balance) * 0.95
            : parseFloat(token0Balance)
        amountsToSet.push(formatAmountWithDecimals(amount, pool.token0.decimals))
      }

      if (parseFloat(token1Balance) > 0) {
        tokensToSet.push(pool.token1)
        const amount =
          parseFloat(token1Balance) >= 1
            ? 1
            : token1Address === nativeTokenAddress
            ? parseFloat(token1Balance) * 0.95
            : parseFloat(token1Balance)
        amountsToSet.push(formatAmountWithDecimals(amount, pool.token1.decimals))
      }

      if (!tokensToSet.length) {
        const amount =
          parseFloat(fallbackNativeBalance) >= 1
            ? 1
            : parseFloat(fallbackNativeBalance) > 0
            ? parseFloat(fallbackNativeBalance) * 0.95
            : 1
        tokensToSet.push(nativeToken)
        amountsToSet.push(formatAmountWithDecimals(amount, nativeToken.decimals))
      }

      setTokensIn(tokensToSet)
      setAmountsIn(amountsToSet.join(','))
    }

    initTokens()

    return () => {
      cancelled = true
    }
  }, [
    account,
    chainId,
    initAmounts,
    initDepositTokens,
    initialTokens,
    nativeBalance,
    nativeToken,
    pairTokenBalances,
    pool,
    tokensIn.length,
  ])

  return {
    pool,
    poolError,
    poolLoading,
    tokensIn,
    amountsIn,
    tokenBalances,
    tokenPrices,
    setTokensIn,
    setAmountsIn,
  }
}
