import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, PoolType, Token } from '@kyber/schema'
import { ChainId as AppChainId, Token as SDKToken } from '@kyberswap/ks-sdk-core'
import { skipToken } from '@reduxjs/toolkit/query'
import { useEffect, useMemo, useState } from 'react'
import { useAddLiquidityPoolInfoQuery, useAddLiquidityTokensQuery } from 'services/zapInService'

import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useNativeBalance, useTokenBalances } from 'state/wallet/hooks'

const getTokenBalanceKey = (address: string) =>
  address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
    ? NATIVE_TOKEN_ADDRESS.toLowerCase()
    : address.toLowerCase()

const formatAmountWithDecimals = (amount: string | number, decimals: number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(numAmount) || numAmount <= 0) return '0'

  const factor = Math.pow(10, decimals)
  const truncated = Math.floor(numAmount * factor) / factor
  return truncated.toFixed(decimals).replace(/\.?0+$/, '') || '0'
}

const createTrackedBalanceConfig = (tokens: Token[], chainId: number) => {
  const trackedTokens = tokens.filter(token => getTokenBalanceKey(token.address) !== NATIVE_TOKEN_ADDRESS.toLowerCase())
  const sdkTokens = trackedTokens.map(
    token => new SDKToken(chainId as AppChainId, token.address, token.decimals, token.symbol, token.name),
  )

  return {
    sdkTokens,
    addressMap: trackedTokens.reduce<Record<string, string>>((acc, token, index) => {
      acc[getTokenBalanceKey(token.address)] = sdkTokens[index]?.address || token.address
      return acc
    }, {}),
  }
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
  const pairBalanceConfig = useMemo(
    () => createTrackedBalanceConfig(pool ? [pool.token0, pool.token1] : [], chainId),
    [chainId, pool],
  )
  const selectedBalanceConfig = useMemo(() => createTrackedBalanceConfig(tokensIn, chainId), [chainId, tokensIn])
  const pairTokenBalances = useTokenBalances(pairBalanceConfig.sdkTokens, chainId as AppChainId)
  const selectedTokenBalances = useTokenBalances(selectedBalanceConfig.sdkTokens, chainId as AppChainId)
  const tokenPriceAddresses = useMemo(() => tokensIn.map(token => token.address.toLowerCase()), [tokensIn])
  const tokenPrices = useTokenPrices(tokenPriceAddresses, chainId as AppChainId)
  const tokenBalances = useMemo(
    () =>
      tokensIn.reduce<Record<string, bigint>>((acc, token) => {
        const balanceKey = getTokenBalanceKey(token.address)
        if (balanceKey === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
          acc[balanceKey] = BigInt(nativeBalance?.quotient?.toString() || '0')
          return acc
        }

        const balanceAddress = selectedBalanceConfig.addressMap[balanceKey] || token.address
        acc[balanceKey] = BigInt(selectedTokenBalances[balanceAddress]?.quotient?.toString() || '0')
        return acc
      }, {}),
    [nativeBalance?.quotient, selectedBalanceConfig.addressMap, selectedTokenBalances, tokensIn],
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
          const listInitAmounts = initAmounts?.split(',') || []
          const parseListAmountsIn: string[] = []
          initialTokens.forEach((_, index: number) => {
            parseListAmountsIn.push(listInitAmounts[index] || '')
          })

          setTokensIn(initialTokens)
          setAmountsIn(parseListAmountsIn.join(','))
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

      const token0BalanceAddress = pairBalanceConfig.addressMap[token0Address] || pool.token0.address
      const token1BalanceAddress = pairBalanceConfig.addressMap[token1Address] || pool.token1.address
      const token0Balance = pairTokenBalances[token0BalanceAddress]?.toExact() || '0'
      const token1Balance = pairTokenBalances[token1BalanceAddress]?.toExact() || '0'
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
    pairBalanceConfig.addressMap,
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
