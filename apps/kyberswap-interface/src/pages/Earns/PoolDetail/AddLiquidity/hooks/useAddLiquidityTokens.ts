import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, PoolType, Token } from '@kyber/schema'
import { formatUnits } from '@kyber/utils'
import { getTokenBalances } from '@kyber/utils/dist/crypto'
import { ChainId as AppChainId, Token as SDKToken } from '@kyberswap/ks-sdk-core'
import { skipToken } from '@reduxjs/toolkit/query'
import { useEffect, useMemo, useState } from 'react'
import { useAddLiquidityPoolInfoQuery } from 'services/zapInService'

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
}

const getInitialAmountFromBalance = (balance: string, decimals: number, isNativeToken: boolean): string => {
  const parsedBalance = parseFloat(balance)
  if (!parsedBalance || Number.isNaN(parsedBalance) || parsedBalance <= 0) return ''

  const amount = parsedBalance >= 1 ? 1 : isNativeToken ? parsedBalance * 0.95 : parsedBalance
  return formatAmountWithDecimals(amount, decimals)
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

export default function useAddLiquidityTokens({ chainId, poolAddress, poolType, account }: UseAddLiquidityTokensProps) {
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

  const nativeToken = useMemo(() => getDefaultNativeToken(chainId), [chainId])
  const pool = poolInfo?.pool || null
  const poolError = poolInfo?.error || ''
  const nativeBalance = useNativeBalance(chainId as AppChainId)
  const selectedBalanceConfig = useMemo(() => createTrackedBalanceConfig(tokensIn, chainId), [chainId, tokensIn])
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

      const pairTokens = [pool.token0, pool.token1]

      if (!account) {
        setTokensIn(pairTokens)
        setAmountsIn(pairTokens.map(() => '').join(','))
        return
      }

      const token0Address = pool.token0.address.toLowerCase()
      const token1Address = pool.token1.address.toLowerCase()
      const pairBalance = await getTokenBalances({
        tokenAddresses: Array.from(new Set([token0Address, token1Address, nativeToken.address])),
        chainId,
        account,
      })

      if (cancelled) return

      const token0Balance = formatUnits(BigInt(pairBalance[token0Address]).toString(), pool.token0.decimals)
      const token1Balance = formatUnits(BigInt(pairBalance[token1Address]).toString(), pool.token1.decimals)
      const amountsToSet = [
        getInitialAmountFromBalance(token0Balance, pool.token0.decimals, token0Address === nativeToken.address),
        getInitialAmountFromBalance(token1Balance, pool.token1.decimals, token1Address === nativeToken.address),
      ]

      setTokensIn(pairTokens)
      setAmountsIn(amountsToSet.join(','))
    }

    initTokens()

    return () => {
      cancelled = true
    }
  }, [account, chainId, nativeToken, pool, tokensIn.length])

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
