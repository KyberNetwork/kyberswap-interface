import { WETH } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from 'constants/networks'
import { CoreProtocol, EarnDex } from 'pages/Earns/constants'
import { EarnPosition, FeeInfo, NftRewardInfo, ParsedPosition, PositionStatus, ProgramType } from 'pages/Earns/types'
import { isForkFrom, isNativeToken } from 'pages/Earns/utils'

export const parsePosition = ({
  position,
  feeInfo,
  nftRewardInfo,
}: {
  position: EarnPosition
  feeInfo?: FeeInfo
  nftRewardInfo?: NftRewardInfo
}) => {
  // Cache frequently accessed properties
  const currentAmounts = position.currentAmounts
  const feePending = position.feePending
  const feesClaimed = position.feesClaimed
  const pool = position.pool
  const tokenAmounts = pool.tokenAmounts
  const token0Data = tokenAmounts[0]?.token
  const token1Data = tokenAmounts[1]?.token

  // Cache USD calculations to avoid repeated divisions
  const token0CurrentQuote = currentAmounts[0]?.quotes.usd
  const token1CurrentQuote = currentAmounts[1]?.quotes.usd
  const token0PendingQuote = feePending[0]?.quotes.usd
  const token1PendingQuote = feePending[1]?.quotes.usd
  const token0ClaimedQuote = feesClaimed[0]?.quotes.usd
  const token1ClaimedQuote = feesClaimed[1]?.quotes.usd

  // Calculate provided token amounts
  const token0TotalProvide = token0CurrentQuote ? token0CurrentQuote.value / token0CurrentQuote.price : 0
  const token1TotalProvide = token1CurrentQuote ? token1CurrentQuote.value / token1CurrentQuote.price : 0

  const token0EarnedAmount =
    (token0PendingQuote ? token0PendingQuote.value / token0PendingQuote.price : 0) +
    (token0ClaimedQuote ? token0ClaimedQuote.value / token0ClaimedQuote.price : 0)
  const token1EarnedAmount =
    (token1PendingQuote ? token1PendingQuote.value / token1PendingQuote.price : 0) +
    (token1ClaimedQuote ? token1ClaimedQuote.value / token1ClaimedQuote.price : 0)

  // Cache other frequently used values
  const nftUnclaimedUsdValue = nftRewardInfo?.unclaimedUsdValue || 0
  const totalValue = position.currentPositionValue + nftUnclaimedUsdValue
  const unclaimedFees = feeInfo?.totalValue ?? feePending.reduce((sum, fee) => sum + fee.quotes.usd.value, 0)
  const totalProvidedValue = position.currentPositionValue - unclaimedFees

  const token0Address = token0Data?.address || ''
  const token1Address = token1Data?.address || ''

  const dex = pool.project || ''
  const isUniv2 = isForkFrom(dex, CoreProtocol.UniswapV2)

  const programs = pool.programs || []
  const isFarming = programs.includes(ProgramType.EG) || programs.includes(ProgramType.LM)

  const listDexesWithVersion = [
    EarnDex.DEX_UNISWAPV2,
    EarnDex.DEX_UNISWAPV3,
    EarnDex.DEX_UNISWAP_V4,
    EarnDex.DEX_UNISWAP_V4_FAIRFLOW,
  ]

  const unclaimedRewardTokens = nftRewardInfo?.tokens.filter(token => token.unclaimedAmount > 0) || []

  // Build totalValueTokens more efficiently
  const totalValueTokens = position.currentPositionValue
    ? [
        {
          address: token0Address,
          symbol: token0Data?.symbol || '',
          amount: token0TotalProvide + token0EarnedAmount,
        },
        {
          address: token1Address,
          symbol: token1Data?.symbol || '',
          amount: token1TotalProvide + token1EarnedAmount,
        },
      ]
    : []

  // Process unclaimed reward tokens efficiently
  for (const token of unclaimedRewardTokens) {
    const existingToken = totalValueTokens.find(t => t.address.toLowerCase() === token.address.toLowerCase())
    if (existingToken) {
      existingToken.amount += token.unclaimedAmount
    } else {
      totalValueTokens.push({
        address: token.address,
        symbol: token.symbol,
        amount: token.unclaimedAmount,
      })
    }
  }

  const now = Date.now()
  const isNewPosition = position.createdTime >= now - 2 * 60 * 1000
  const isUnfinalized = isNewPosition && (position.latestBlock || 0) - (position.createdAtBlock || 0) <= 10

  // Calculate total earned fees once
  const totalEarnedFees =
    feePending.reduce((sum, fee) => sum + fee.quotes.usd.value, 0) +
    feesClaimed.reduce((sum, fee) => sum + fee.quotes.usd.value, 0)

  // Extract dex version efficiently
  const dexVersion = listDexesWithVersion.includes(dex) ? dex.split(' ').pop() || '' : ''

  // Cache chain info
  const chainId = position.chainId as keyof typeof NETWORKS_INFO
  const nativeToken = NETWORKS_INFO[chainId]?.nativeToken

  return {
    id: position.id,
    tokenId: position.tokenId,
    pool: {
      fee: pool.fees?.[0],
      address: pool.poolAddress,
      nativeToken,
      tickSpacing: pool.tickSpacing,
      category: pool.category,
      isFarming,
      isUniv2,
    },
    dex: {
      id: dex,
      logo: pool.projectLogo,
      version: dexVersion,
    },
    chain: {
      id: position.chainId,
      name: position.chainName,
      logo: position.chainLogo,
    },
    priceRange: {
      min: position.minPrice || 0,
      max: position.maxPrice || 0,
      current: pool.price || 0,
    },
    earning: {
      earned: totalEarnedFees,
      in7d: position.earning7d || 0,
      in24h: position.earning24h || 0,
    },
    rewards: {
      totalUsdValue: nftRewardInfo?.totalUsdValue || 0,
      claimedUsdValue: nftRewardInfo?.claimedUsdValue || 0,
      unclaimedUsdValue: nftUnclaimedUsdValue,
      inProgressUsdValue: nftRewardInfo?.inProgressUsdValue || 0,
      pendingUsdValue: nftRewardInfo?.pendingUsdValue || 0,
      vestingUsdValue: nftRewardInfo?.vestingUsdValue || 0,
      claimableUsdValue: nftRewardInfo?.claimableUsdValue || 0,
      egTokens: nftRewardInfo?.egTokens || [],
      lmTokens: nftRewardInfo?.lmTokens || [],
      tokens: nftRewardInfo?.tokens || [],
    },
    totalValueTokens,
    token0: {
      address: token0Address,
      logo: token0Data?.logo || '',
      symbol: token0Data?.symbol || '',
      decimals: token0Data?.decimals,
      price: currentAmounts[0]?.token.price,
      isNative: isNativeToken(token0Address, chainId as keyof typeof WETH),
      totalProvide: token0TotalProvide,
      totalAmount: token0TotalProvide + token0EarnedAmount,
      unclaimedAmount: feeInfo
        ? Number(feeInfo.amount0)
        : token0PendingQuote
        ? token0PendingQuote.value / token0PendingQuote.price
        : 0,
      unclaimedBalance: feeInfo ? Number(feeInfo.balance0) : Number(feePending[0]?.balance || 0),
      unclaimedValue: feeInfo ? Number(feeInfo.value0) : token0PendingQuote?.value || 0,
    },
    token1: {
      address: token1Address,
      logo: token1Data?.logo || '',
      symbol: token1Data?.symbol || '',
      decimals: token1Data?.decimals,
      price: currentAmounts[1]?.token.price,
      isNative: isNativeToken(token1Address, chainId as keyof typeof WETH),
      totalProvide: token1TotalProvide,
      totalAmount: token1TotalProvide + token1EarnedAmount,
      unclaimedAmount: feeInfo
        ? Number(feeInfo.amount1)
        : token1PendingQuote
        ? token1PendingQuote.value / token1PendingQuote.price
        : 0,
      unclaimedBalance: feeInfo ? Number(feeInfo.balance1) : Number(feePending[1]?.balance || 0),
      unclaimedValue: feeInfo ? Number(feeInfo.value1) : token1PendingQuote?.value || 0,
    },
    suggestionPool: position.suggestionPool,
    tokenAddress: position.tokenAddress,
    feeApr: position.apr || 0,
    apr: (position.apr || 0) + (position.kemEGApr || 0) + (position.kemLMApr || 0),
    kemEGApr: position.kemEGApr || 0,
    kemLMApr: position.kemLMApr || 0,
    totalValue,
    totalProvidedValue,
    unclaimedFees,
    status: isUniv2 ? PositionStatus.IN_RANGE : position.status,
    createdTime: position.createdTime,
    isUnfinalized,
  }
}

export const aggregateFeeFromPositions = (positions: Array<ParsedPosition>) => {
  let totalValue = 0
  let totalEarnedFee = 0
  let totalUnclaimedFee = 0

  positions.forEach(position => {
    totalValue += position.totalValue
    totalEarnedFee += position.earning.earned
    totalUnclaimedFee += position.unclaimedFees
  })

  return {
    totalValue,
    totalEarnedFee,
    totalUnclaimedFee,
  }
}
