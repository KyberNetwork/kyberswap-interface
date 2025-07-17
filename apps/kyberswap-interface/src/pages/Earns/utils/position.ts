import { encodeUint256, getFunctionSelector } from '@kyber/utils/dist/crypto'
import { getUniv4PositionLiquidity } from '@kyber/utils/dist/liquidity/position'
import { toString } from '@kyber/utils/dist/number'
import {
  MAX_TICK,
  MIN_TICK,
  decodeAlgebraV1Position,
  decodePosition,
  nearestUsableTick,
  priceToClosestTick,
} from '@kyber/utils/dist/uniswapv3'
import { ChainId, WETH } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from 'constants/networks'
import { CoreProtocol, EarnDex } from 'pages/Earns/constants'
import { EarnPosition, FeeInfo, NftRewardInfo, ParsedPosition, PositionStatus, ProgramType } from 'pages/Earns/types'
import { getNftManagerContractAddress, isForkFrom, isNativeToken } from 'pages/Earns/utils'

export const parsePosition = ({
  position,
  feeInfo,
  nftRewardInfo,
  isClosedFromRpc,
}: {
  position: EarnPosition
  feeInfo?: FeeInfo
  nftRewardInfo?: NftRewardInfo
  isClosedFromRpc?: boolean
}) => {
  const forceClosed = isClosedFromRpc && position.status !== PositionStatus.CLOSED

  const currentAmounts = position.currentAmounts
  const feePending = position.feePending
  const feesClaimed = position.feesClaimed
  const pool = position.pool
  const tokenAmounts = pool.tokenAmounts
  const token0Data = tokenAmounts[0]?.token
  const token1Data = tokenAmounts[1]?.token

  const token0CurrentQuote = currentAmounts[0]?.quotes.usd
  const token1CurrentQuote = currentAmounts[1]?.quotes.usd
  const token0PendingQuote = feePending[0]?.quotes.usd
  const token1PendingQuote = feePending[1]?.quotes.usd
  const token0ClaimedQuote = feesClaimed[0]?.quotes.usd
  const token1ClaimedQuote = feesClaimed[1]?.quotes.usd

  const token0TotalProvide =
    token0CurrentQuote && !forceClosed ? token0CurrentQuote.value / token0CurrentQuote.price : 0
  const token1TotalProvide =
    token1CurrentQuote && !forceClosed ? token1CurrentQuote.value / token1CurrentQuote.price : 0

  const token0EarnedAmount =
    (token0PendingQuote ? token0PendingQuote.value / token0PendingQuote.price : 0) +
    (token0ClaimedQuote ? token0ClaimedQuote.value / token0ClaimedQuote.price : 0)
  const token1EarnedAmount =
    (token1PendingQuote ? token1PendingQuote.value / token1PendingQuote.price : 0) +
    (token1ClaimedQuote ? token1ClaimedQuote.value / token1ClaimedQuote.price : 0)

  const nftUnclaimedUsdValue = nftRewardInfo?.unclaimedUsdValue || 0
  const totalValue = (forceClosed ? 0 : position.currentPositionValue) + nftUnclaimedUsdValue
  const unclaimedFees = forceClosed
    ? 0
    : feeInfo?.totalValue ?? feePending.reduce((sum, fee) => sum + fee.quotes.usd.value, 0)
  const totalProvidedValue = forceClosed ? 0 : position.currentPositionValue - unclaimedFees

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

  const totalValueTokens =
    position.currentPositionValue && !forceClosed
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

  const totalEarnedFees =
    feePending.reduce((sum, fee) => sum + fee.quotes.usd.value, 0) +
    feesClaimed.reduce((sum, fee) => sum + fee.quotes.usd.value, 0)

  const dexVersion = listDexesWithVersion.includes(dex) ? dex.split(' ').pop() || '' : ''

  const chainId = position.chainId as keyof typeof NETWORKS_INFO
  const nativeToken = NETWORKS_INFO[chainId]?.nativeToken

  const tickLower =
    pool.tickSpacing === 0 || isUniv2
      ? undefined
      : nearestUsableTick(
          priceToClosestTick(toString(position.minPrice), token0Data?.decimals, token1Data?.decimals) || 0,
          pool.tickSpacing,
        )
  const tickUpper =
    pool.tickSpacing === 0 || isUniv2
      ? undefined
      : nearestUsableTick(
          priceToClosestTick(toString(position.maxPrice), token0Data?.decimals, token1Data?.decimals) || 0,
          pool.tickSpacing,
        )

  const minTick = pool.tickSpacing === 0 ? MIN_TICK : nearestUsableTick(MIN_TICK, pool.tickSpacing)
  const maxTick = pool.tickSpacing === 0 ? MAX_TICK : nearestUsableTick(MAX_TICK, pool.tickSpacing)

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
      isMinPrice: tickLower === minTick,
      isMaxPrice: tickUpper === maxTick,
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
      unclaimedAmount: forceClosed
        ? 0
        : feeInfo
        ? Number(feeInfo.amount0)
        : token0PendingQuote
        ? token0PendingQuote.value / token0PendingQuote.price
        : 0,
      unclaimedBalance: forceClosed ? 0 : feeInfo ? Number(feeInfo.balance0) : Number(feePending[0]?.balance || 0),
      unclaimedValue: forceClosed ? 0 : feeInfo ? Number(feeInfo.value0) : token0PendingQuote?.value || 0,
    },
    token1: {
      address: token1Address,
      logo: token1Data?.logo || '',
      symbol: token1Data?.symbol || '',
      decimals: token1Data?.decimals,
      price: currentAmounts[1]?.token.price,
      isNative: isNativeToken(token1Address, chainId as keyof typeof WETH),
      totalProvide: token1TotalProvide,
      unclaimedAmount: forceClosed
        ? 0
        : feeInfo
        ? Number(feeInfo.amount1)
        : token1PendingQuote
        ? token1PendingQuote.value / token1PendingQuote.price
        : 0,
      unclaimedBalance: forceClosed ? 0 : feeInfo ? Number(feeInfo.balance1) : Number(feePending[1]?.balance || 0),
      unclaimedValue: forceClosed ? 0 : feeInfo ? Number(feeInfo.value1) : token1PendingQuote?.value || 0,
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
    status: forceClosed ? PositionStatus.CLOSED : isUniv2 ? PositionStatus.IN_RANGE : position.status,
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

export const getPositionLiquidity = async ({
  tokenId,
  dex,
  poolAddress,
  chainId,
}: {
  tokenId: string
  dex: EarnDex
  poolAddress: string
  chainId: ChainId
}) => {
  const isUniV2 = isForkFrom(dex, CoreProtocol.UniswapV2)
  const isUniV3 = isForkFrom(dex, CoreProtocol.UniswapV3)
  const isUniV4 = isForkFrom(dex, CoreProtocol.UniswapV4)
  const isAlgebra = isForkFrom(dex, CoreProtocol.AlgebraV1) || isForkFrom(dex, CoreProtocol.AlgebraV19)

  if (isUniV2) {
    const balanceOfSelector = getFunctionSelector('balanceOf(address)')
    const paddedAccount = tokenId.replace('0x', '').padStart(64, '0')

    const getPayload = (d: string) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: poolAddress,
            data: d,
          },
          'latest',
        ],
        id: 1,
      }),
    })

    const balanceRes = await fetch(
      NETWORKS_INFO[chainId].defaultRpcUrl,
      getPayload(`0x${balanceOfSelector}${paddedAccount}`),
    ).then(res => res.json() as Promise<{ result: string }>)

    const userBalance = BigInt(balanceRes?.result || '0')

    return userBalance
  }

  const nftContractAddress = getNftManagerContractAddress(dex, chainId)
  if (!nftContractAddress) return

  const encodedTokenId = encodeUint256(BigInt(tokenId))

  if (isUniV4) {
    const liquidity = await getUniv4PositionLiquidity({
      nftContractAddress,
      encodedTokenId,
      chainId: chainId as any,
    })

    return liquidity || BigInt(0)
  }

  if (isUniV3 || isAlgebra) {
    const functionSignature = 'positions(uint256)'
    const selector = getFunctionSelector(functionSignature)

    const data = `0x${selector}${encodedTokenId}`

    const payload = {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: nftContractAddress,
          data: data,
        },
        'latest',
      ],
      id: 1,
    }

    const response = await fetch(NETWORKS_INFO[chainId].defaultRpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const { result, error } = (await response.json()) as { result?: any; error?: any }
    if (!result || result === '0x' || error) return

    const decodedPosition = isAlgebra ? decodeAlgebraV1Position(result) : decodePosition(result)

    return decodedPosition.liquidity
  }

  return
}
