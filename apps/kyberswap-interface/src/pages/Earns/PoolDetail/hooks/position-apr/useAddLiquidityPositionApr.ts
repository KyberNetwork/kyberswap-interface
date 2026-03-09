import { parseUnits } from '@ethersproject/units'
import {
  NATIVE_TOKEN_ADDRESS,
  NETWORKS_INFO,
  PoolType,
  Token,
  Pool as ZapPool,
  univ3PoolNormalize,
  univ3Types,
} from '@kyber/schema'
import { Token as SDKToken } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { useMemo } from 'react'

interface UseAddLiquidityPositionAprProps {
  chainId: number
  poolType: PoolType
  pool: ZapPool | null
  tokens: Token[]
  amounts: string
  prices: Record<string, number>
  tickLower: number | null
  tickUpper: number | null
}

const parseAmount = (value?: string) => {
  if (!value) return 0

  const parsedValue = Number(value.trim())
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0
}

const toAddressMap = (tokens: Token[], amounts: string) => {
  const amountList = amounts.split(',').map(item => item.trim())

  return tokens.reduce<Record<string, number>>((acc, token, index) => {
    acc[token.address.toLowerCase()] = parseAmount(amountList[index])
    return acc
  }, {})
}

const isNativeAddress = (address: string) => address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()

const estimateLiquidityFromTvl = (poolLiquidity: string, poolTvl: number, positionTvl: number) => {
  if (!poolLiquidity || poolTvl <= 0 || positionTvl <= 0) return null

  try {
    const scaledPoolTvl = BigInt(Math.max(1, Math.round(poolTvl * 1_000_000)))
    const scaledPositionTvl = BigInt(Math.max(1, Math.round(positionTvl * 1_000_000)))
    const estimatedLiquidity = (BigInt(poolLiquidity) * scaledPositionTvl) / scaledPoolTvl

    return estimatedLiquidity > 0n ? estimatedLiquidity.toString() : null
  } catch {
    return null
  }
}

export default function useAddLiquidityPositionApr({
  chainId,
  poolType,
  pool,
  tokens,
  amounts,
  prices,
  tickLower,
  tickUpper,
}: UseAddLiquidityPositionAprProps) {
  return useMemo(() => {
    if (
      !univ3Types.includes(poolType as any) ||
      !pool ||
      tickLower === null ||
      tickUpper === null ||
      tickLower === tickUpper
    ) {
      return {
        hasInput: false,
        positionLiquidity: null,
        positionTvl: null,
      }
    }

    const { success, data } = univ3PoolNormalize.safeParse(pool)
    if (!success) {
      return {
        hasInput: false,
        positionLiquidity: null,
        positionTvl: null,
      }
    }

    const amountList = amounts.split(',').map(item => parseAmount(item))
    const hasInput = amountList.some(amount => amount > 0)
    if (!hasInput) {
      return {
        hasInput: false,
        positionLiquidity: null,
        positionTvl: null,
      }
    }

    const amountByAddress = toAddressMap(tokens, amounts)
    const wrappedNativeAddress = (NETWORKS_INFO as any)[chainId]?.wrappedToken?.address?.toLowerCase()
    const token0Address = data.token0.address.toLowerCase()
    const token1Address = data.token1.address.toLowerCase()
    const nativeAmount = amountByAddress[NATIVE_TOKEN_ADDRESS.toLowerCase()] || 0
    const amount0 =
      amountByAddress[token0Address] ||
      (wrappedNativeAddress && token0Address === wrappedNativeAddress ? nativeAmount : 0)
    const amount1 =
      amountByAddress[token1Address] ||
      (wrappedNativeAddress && token1Address === wrappedNativeAddress ? nativeAmount : 0)

    const positionTvl = tokens.reduce((total, token, index) => {
      const amount = amountList[index] || 0
      if (!amount) return total

      const tokenAddress = token.address.toLowerCase()
      const tokenPrice =
        prices[tokenAddress] ||
        (isNativeAddress(tokenAddress) && wrappedNativeAddress ? prices[wrappedNativeAddress] || 0 : 0)

      return total + amount * tokenPrice
    }, 0)
    const fallbackPositionLiquidity = estimateLiquidityFromTvl(data.liquidity, data.stats.tvl, positionTvl)

    if (amount0 <= 0 && amount1 <= 0) {
      return {
        hasInput: true,
        positionLiquidity: fallbackPositionLiquidity,
        positionTvl: positionTvl > 0 ? positionTvl.toString() : null,
      }
    }

    try {
      const poolInstance = new Pool(
        new SDKToken(chainId, data.token0.address, data.token0.decimals, data.token0.symbol, data.token0.name),
        new SDKToken(chainId, data.token1.address, data.token1.decimals, data.token1.symbol, data.token1.name),
        data.fee as FeeAmount,
        data.sqrtPriceX96,
        data.liquidity,
        '0',
        data.tick,
      )

      const position = Position.fromAmounts({
        pool: poolInstance,
        tickLower,
        tickUpper,
        amount0: parseUnits(amount0.toString(), data.token0.decimals).toString(),
        amount1: parseUnits(amount1.toString(), data.token1.decimals).toString(),
        useFullPrecision: true,
      })

      return {
        hasInput: true,
        positionLiquidity: position.liquidity.toString(),
        positionTvl: positionTvl > 0 ? positionTvl.toString() : null,
      }
    } catch {
      return {
        hasInput: true,
        positionLiquidity: fallbackPositionLiquidity,
        positionTvl: positionTvl > 0 ? positionTvl.toString() : null,
      }
    }
  }, [amounts, chainId, pool, poolType, prices, tickLower, tickUpper, tokens])
}
