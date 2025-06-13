import { WETH } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from 'constants/networks'
import { CoreProtocol, EarnDex } from 'pages/Earns/constants'
import {
  EarnPosition,
  FeeInfo,
  NftRewardInfo,
  ParsedPosition,
  PositionStatus,
  ProgramType,
  TokenRewardInfo,
} from 'pages/Earns/types'
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
  const token0TotalProvide = position.currentAmounts[0]?.quotes.usd.value / position.currentAmounts[0]?.quotes.usd.price
  const token1TotalProvide = position.currentAmounts[1]?.quotes.usd.value / position.currentAmounts[1]?.quotes.usd.price

  const token0EarnedAmount =
    position.feePending[0]?.quotes.usd.value / position.feePending[0]?.quotes.usd.price +
    position.feesClaimed[0]?.quotes.usd.value / position.feesClaimed[0]?.quotes.usd.price
  const token1EarnedAmount =
    position.feePending[1]?.quotes.usd.value / position.feePending[1]?.quotes.usd.price +
    position.feesClaimed[1]?.quotes.usd.value / position.feesClaimed[1]?.quotes.usd.price

  const totalValue = position.currentPositionValue + (nftRewardInfo?.unclaimedUsdValue || 0)
  const unclaimedFees = feeInfo ? feeInfo.totalValue : position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0)
  const totalProvidedValue = totalValue - unclaimedFees

  const token0Address = position.pool.tokenAmounts[0]?.token.address || ''
  const token1Address = position.pool.tokenAmounts[1]?.token.address || ''

  const dex = position.pool.project || ''
  const isUniv2 = isForkFrom(dex, CoreProtocol.UniswapV2)

  const programs = position.pool.programs || []
  const isFarming = programs.includes(ProgramType.EG) || programs.includes(ProgramType.LM)

  const listDexesWithVersion = [
    EarnDex.DEX_UNISWAPV2,
    EarnDex.DEX_UNISWAPV3,
    EarnDex.DEX_UNISWAP_V4,
    EarnDex.DEX_UNISWAP_V4_FAIRFLOW,
  ]

  const unclaimedRewardTokens = nftRewardInfo?.tokens.filter(token => token.unclaimedAmount > 0) || []
  const totalValueTokens = [
    {
      address: token0Address,
      symbol: position.pool.tokenAmounts[0]?.token.symbol || '',
      amount: token0TotalProvide + token0EarnedAmount,
    },
    {
      address: token1Address,
      symbol: position.pool.tokenAmounts[1]?.token.symbol || '',
      amount: token1TotalProvide + token1EarnedAmount,
    },
  ]

  unclaimedRewardTokens.forEach(token => {
    const tokenInfo = totalValueTokens.find(t => t.address.toLowerCase() === token.address.toLowerCase())
    if (tokenInfo) {
      tokenInfo.amount += token.unclaimedAmount
    } else {
      totalValueTokens.push({
        address: token.address,
        symbol: token.symbol,
        amount: token.unclaimedAmount,
      })
    }
  })

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
    rewards: {
      totalUsdValue: nftRewardInfo?.totalUsdValue || 0,
      claimedUsdValue: nftRewardInfo?.claimedUsdValue || 0,
      unclaimedUsdValue: nftRewardInfo?.unclaimedUsdValue || 0,
      inProgressUsdValue: nftRewardInfo?.inProgressUsdValue || 0,
      pendingUsdValue: nftRewardInfo?.pendingUsdValue || 0,
      vestingUsdValue: nftRewardInfo?.vestingUsdValue || 0,
      claimableUsdValue: nftRewardInfo?.claimableUsdValue || 0,
      egTokens: nftRewardInfo?.egTokens || [],
      lmTokens: nftRewardInfo?.lmTokens || [],
    },
    totalValueTokens,
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
    apr: (position.apr || 0) + (position.kemEGApr || 0) + (position.kemLMApr || 0),
    kemEGApr: position.kemEGApr || 0,
    kemLMApr: position.kemLMApr || 0,
    totalValue,
    totalProvidedValue,
    unclaimedFees,
    status: isUniv2 ? PositionStatus.IN_RANGE : position.status,
    createdTime: position.createdTime,
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

export const aggregateRewardFromPositions = (positions: Array<ParsedPosition>) => {
  let totalUsdValue = 0
  let claimedUsdValue = 0
  let inProgressUsdValue = 0
  let pendingUsdValue = 0
  let vestingUsdValue = 0
  let claimableUsdValue = 0
  const egTokens: Array<TokenRewardInfo> = []
  const lmTokens: Array<TokenRewardInfo> = []

  positions.forEach(position => {
    totalUsdValue += position.rewards.totalUsdValue
    claimedUsdValue += position.rewards.claimedUsdValue
    inProgressUsdValue += position.rewards.inProgressUsdValue
    pendingUsdValue += position.rewards.pendingUsdValue
    vestingUsdValue += position.rewards.vestingUsdValue
    claimableUsdValue += position.rewards.claimableUsdValue

    position.rewards.egTokens.forEach(token => {
      const existingTokenIndex = egTokens.findIndex(t => t.symbol === token.symbol)
      if (existingTokenIndex === -1) {
        egTokens.push({ ...token })
      } else {
        egTokens[existingTokenIndex].totalAmount += token.totalAmount
        egTokens[existingTokenIndex].claimableAmount += token.claimableAmount
        egTokens[existingTokenIndex].claimableUsdValue += token.claimableUsdValue
      }
    })
    position.rewards.lmTokens.forEach(token => {
      const existingTokenIndex = lmTokens.findIndex(t => t.symbol === token.symbol)
      if (existingTokenIndex === -1) {
        lmTokens.push({ ...token })
      } else {
        lmTokens[existingTokenIndex].totalAmount += token.totalAmount
        lmTokens[existingTokenIndex].claimableAmount += token.claimableAmount
        lmTokens[existingTokenIndex].claimableUsdValue += token.claimableUsdValue
      }
    })
  })

  return {
    totalUsdValue,
    claimedUsdValue,
    inProgressUsdValue,
    pendingUsdValue,
    vestingUsdValue,
    claimableUsdValue,
    egTokens,
    lmTokens,
  }
}
