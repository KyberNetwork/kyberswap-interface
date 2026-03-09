import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, Pool, PoolType, Token } from '@kyber/schema'
import { useMemo } from 'react'

interface UseAddLiquidityReviewDataProps {
  chainId?: number
  exchange?: string
  poolType?: PoolType
  pool?: Pool | null
  tokens?: Token[]
  amounts?: string
  prices?: Record<string, number>
  revertPrice?: boolean
  poolPrice?: number | null
  minPrice?: string | null
  maxPrice?: string | null
  slippage?: number
}

interface ReviewTokenItem {
  token: Token
  amount: number
  usdValue: number
}

const parseAmount = (value?: string) => {
  if (!value) return 0

  const parsed = Number(value.trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const getPoolTokenPrice = (token?: Token) => {
  const poolToken = token as (Token & { price?: number }) | undefined
  return poolToken?.price || 0
}

const getTokenPrice = ({
  token,
  prices,
  wrappedNativeAddress,
}: {
  token: Token
  prices: Record<string, number>
  wrappedNativeAddress?: string
}) => {
  const tokenAddress = token.address.toLowerCase()
  const directPrice = prices[tokenAddress]
  if (directPrice) return directPrice

  if (tokenAddress === NATIVE_TOKEN_ADDRESS.toLowerCase() && wrappedNativeAddress) {
    return prices[wrappedNativeAddress] || 0
  }

  return getPoolTokenPrice(token)
}

const isAddressMatch = (inputAddress: string, targetAddress: string, wrappedNativeAddress?: string) => {
  const normalizedInput = inputAddress.toLowerCase()
  const normalizedTarget = targetAddress.toLowerCase()

  if (normalizedInput === normalizedTarget) return true
  if (normalizedInput === NATIVE_TOKEN_ADDRESS.toLowerCase() && wrappedNativeAddress === normalizedTarget) return true

  return false
}

export default function useAddLiquidityReviewData({
  chainId,
  exchange,
  poolType,
  pool,
  tokens = [],
  amounts = '',
  prices = {},
  revertPrice = false,
  poolPrice = null,
  minPrice = null,
  maxPrice = null,
  slippage,
}: UseAddLiquidityReviewDataProps) {
  return useMemo(() => {
    const amountList = amounts.split(',').map(item => parseAmount(item))
    const wrappedNativeAddress = chainId
      ? (NETWORKS_INFO as Record<number, any>)[chainId]?.wrappedToken?.address?.toLowerCase()
      : undefined

    const zapInItems: ReviewTokenItem[] = tokens
      .map((token, index) => {
        const amount = amountList[index] || 0
        const usdValue = amount * getTokenPrice({ token, prices, wrappedNativeAddress })

        return {
          token,
          amount,
          usdValue,
        }
      })
      .filter(item => item.amount > 0)

    const totalInputUsd = zapInItems.reduce((total, item) => total + item.usdValue, 0)
    const hasInput = zapInItems.length > 0

    if (!pool) {
      return {
        hasInput,
        header: null,
        zapInItems,
        totalInputUsd,
        priceInfo: null,
        estimate: null,
      }
    }

    const token0 = pool.token0
    const token1 = pool.token1
    const token0Price = getTokenPrice({ token: token0, prices, wrappedNativeAddress })
    const token1Price = getTokenPrice({ token: token1, prices, wrappedNativeAddress })
    const exactAmount0 = tokens.reduce((total, token, index) => {
      return total + (isAddressMatch(token.address, token0.address, wrappedNativeAddress) ? amountList[index] || 0 : 0)
    }, 0)
    const exactAmount1 = tokens.reduce((total, token, index) => {
      return total + (isAddressMatch(token.address, token1.address, wrappedNativeAddress) ? amountList[index] || 0 : 0)
    }, 0)

    const positiveTokens = tokens.filter((_, index) => (amountList[index] || 0) > 0)
    const usesOnlyPairTokens = positiveTokens.every(token =>
      [token0.address, token1.address].some(address => isAddressMatch(token.address, address, wrappedNativeAddress)),
    )

    const useExactPairAmounts = usesOnlyPairTokens && exactAmount0 > 0 && exactAmount1 > 0
    const estimatedToken0Usd = useExactPairAmounts ? exactAmount0 * token0Price : totalInputUsd / 2
    const estimatedToken1Usd = useExactPairAmounts ? exactAmount1 * token1Price : totalInputUsd - totalInputUsd / 2
    const estimatedToken0Amount = useExactPairAmounts
      ? exactAmount0
      : token0Price > 0
      ? estimatedToken0Usd / token0Price
      : 0
    const estimatedToken1Amount = useExactPairAmounts
      ? exactAmount1
      : token1Price > 0
      ? estimatedToken1Usd / token1Price
      : 0

    const displayToken0 = revertPrice ? token1 : token0
    const displayToken1 = revertPrice ? token0 : token1
    const feeLabel = pool.fee !== undefined ? `${pool.fee}%` : poolType ? `${poolType}` : undefined

    return {
      hasInput,
      header: {
        exchange,
        poolType,
        token0,
        token1,
        feeLabel,
        pairLabel: `${token0.symbol}/${token1.symbol}`,
      },
      zapInItems,
      totalInputUsd,
      priceInfo: {
        isUniV3: minPrice !== null || maxPrice !== null,
        currentPrice: poolPrice,
        baseToken: displayToken0,
        quoteToken: displayToken1,
        minPrice,
        maxPrice,
      },
      estimate: {
        totalUsd: totalInputUsd,
        slippage,
        items: [
          {
            token: token0,
            amount: estimatedToken0Amount,
            usdValue: estimatedToken0Usd,
          },
          {
            token: token1,
            amount: estimatedToken1Amount,
            usdValue: estimatedToken1Usd,
          },
        ],
      },
    }
  }, [amounts, chainId, exchange, maxPrice, minPrice, pool, poolPrice, poolType, prices, revertPrice, slippage, tokens])
}
