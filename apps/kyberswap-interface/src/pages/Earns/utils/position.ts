import { WETH } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from 'constants/networks'
import { CoreProtocol, EarnDex } from 'pages/Earns/constants'
import { EarnPosition, FeeInfo, NftRewardInfo, PositionStatus } from 'pages/Earns/types'
import { isFarmingProtocol, isForkFrom, isNativeToken } from 'pages/Earns/utils'

export const parsePosition = ({
  position,
  feeInfo,
  nftRewardInfo,
}: {
  position: EarnPosition
  feeInfo?: FeeInfo
  nftRewardInfo?: NftRewardInfo
}) => {
  const token0TotalProvide = position.currentAmounts[0]?.quotes.usd.value / position.currentAmounts[0]?.quotes.usd.price
  const token1TotalProvide = position.currentAmounts[1]?.quotes.usd.value / position.currentAmounts[1]?.quotes.usd.price

  const token0EarnedAmount =
    position.feePending[0]?.quotes.usd.value / position.feePending[0]?.quotes.usd.price +
    position.feesClaimed[0]?.quotes.usd.value / position.feesClaimed[0]?.quotes.usd.price
  const token1EarnedAmount =
    position.feePending[1]?.quotes.usd.value / position.feePending[1]?.quotes.usd.price +
    position.feesClaimed[1]?.quotes.usd.value / position.feesClaimed[1]?.quotes.usd.price

  const token0Address = position.pool.tokenAmounts[0]?.token.address || ''
  const token1Address = position.pool.tokenAmounts[1]?.token.address || ''

  const dex = position.pool.project || ''
  const isUniv2 = isForkFrom(dex, CoreProtocol.UniswapV2)
  const isFarming = isFarmingProtocol(dex)

  const listDexesWithVersion = [
    EarnDex.DEX_UNISWAPV2,
    EarnDex.DEX_UNISWAPV3,
    EarnDex.DEX_UNISWAP_V4,
    EarnDex.DEX_UNISWAP_V4_FAIRFLOW,
  ]

  return {
    id: position.id,
    tokenId: position.tokenId,
    pool: {
      fee: position.pool.fees?.[0],
      address: position.pool.poolAddress,
      nativeToken: NETWORKS_INFO[position.chainId as keyof typeof NETWORKS_INFO].nativeToken,
      tickSpacing: position.pool.tickSpacing,
      category: position.pool.category,
      isFarming,
      isUniv2,
    },
    dex: {
      id: dex,
      logo: position.pool.projectLogo,
      version: listDexesWithVersion.includes(dex) ? dex.split(' ')[dex.split(' ').length - 1] || '' : '',
    },
    chain: {
      id: position.chainId,
      name: position.chainName,
      logo: position.chainLogo,
    },
    priceRange: {
      min: position.minPrice || 0,
      max: position.maxPrice || 0,
      current: position.pool.price || 0,
    },
    earning: {
      earned:
        position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0) +
        position.feesClaimed.reduce((a, b) => a + b.quotes.usd.value, 0),
      in7d: position.earning7d || 0,
      in24h: position.earning24h || 0,
    },
    farming: {
      unclaimedUsdValue: (nftRewardInfo?.pendingUsdValue || 0) + (nftRewardInfo?.claimedUsdValue || 0),
      pendingUsdValue: nftRewardInfo?.pendingUsdValue || 0,
      claimableUsdValue: nftRewardInfo?.claimableUsdValue || 0,
    },
    token0: {
      address: token0Address,
      logo: position.pool.tokenAmounts[0]?.token.logo || '',
      symbol: position.pool.tokenAmounts[0]?.token.symbol || '',
      decimals: position.pool.tokenAmounts[0]?.token.decimals,
      price: position.currentAmounts[0]?.token.price,
      isNative: isNativeToken(token0Address, position.chainId as keyof typeof WETH),
      totalProvide: token0TotalProvide,
      totalAmount: token0TotalProvide + token0EarnedAmount,
      unclaimedAmount: feeInfo
        ? Number(feeInfo.amount0)
        : position.feePending[0]?.quotes.usd.value / position.feePending[0]?.quotes.usd.price,
      unclaimedBalance: feeInfo ? Number(feeInfo.balance0) : Number(position.feePending[0].balance),
      unclaimedValue: feeInfo ? Number(feeInfo.value0) : position.feePending[0]?.quotes.usd.value,
    },
    token1: {
      address: token1Address,
      logo: position.pool.tokenAmounts[1]?.token.logo || '',
      symbol: position.pool.tokenAmounts[1]?.token.symbol || '',
      decimals: position.pool.tokenAmounts[1]?.token.decimals,
      price: position.currentAmounts[1]?.token.price,
      isNative: isNativeToken(token1Address, position.chainId as keyof typeof WETH),
      totalProvide: token1TotalProvide,
      totalAmount: token1TotalProvide + token1EarnedAmount,
      unclaimedAmount: feeInfo
        ? Number(feeInfo.amount1)
        : position.feePending[1]?.quotes.usd.value / position.feePending[1]?.quotes.usd.price,
      unclaimedBalance: feeInfo ? Number(feeInfo.balance1) : Number(position.feePending[1].balance),
      unclaimedValue: feeInfo ? Number(feeInfo.value1) : position.feePending[1]?.quotes.usd.value,
    },
    suggestionPool: position.suggestionPool,
    tokenAddress: position.tokenAddress,
    feeApr: position.apr || 0,
    apr: (position.apr || 0) + (position.kemApr || 0),
    kemApr: position.kemApr || 0,
    totalValue: position.currentPositionValue,
    unclaimedFees: feeInfo ? feeInfo.totalValue : position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0),
    status: isUniv2 ? PositionStatus.IN_RANGE : position.status,
    createdTime: position.createdTime,
  }
}
