import { TransactionRequest, Web3Provider } from '@ethersproject/providers'
import { CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Contract, ethers } from 'ethers'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import {
  CoreProtocol,
  EarnChain,
  EarnDex,
  EarnDex2,
  FARMING_DEXES,
  NATIVE_ADDRESSES,
  NFT_MANAGER_ABI,
  NFT_MANAGER_CONTRACT,
  PROTOCOLS_CORE_MAPPING,
} from 'pages/Earns/constants'
import { EarnPosition, FeeInfo, NftRewardInfo, PositionStatus } from 'pages/Earns/types'
import { calculateGasMargin } from 'utils'
import { getReadingContract } from 'utils/getContract'
import { formatDisplayNumber } from 'utils/numbers'

export const formatAprNumber = (apr: string | number): string => {
  const formattedApr = Number(apr)
  let n = 0
  while (n < 4) {
    if (formattedApr - 10 ** n < 0) break
    n++
  }

  return formatDisplayNumber(formattedApr, { significantDigits: n + 2 })
}

export const getTokenId = async (provider: Web3Provider, txHash: string) => {
  try {
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt || !receipt.logs) return
    const increaseLidEventTopic = ethers.utils.id('IncreaseLiquidity(uint256,uint128,uint256,uint256)')
    const increaseLidLogs = receipt.logs.filter((log: any) => log.topics[0] === increaseLidEventTopic)
    const increaseLidEvent = increaseLidLogs?.length ? increaseLidLogs[0] : undefined
    const hexTokenId = increaseLidEvent?.topics?.[1]
    if (!hexTokenId) return
    return Number(hexTokenId)
  } catch (error) {
    console.log('getTokenId error', error)
    return
  }
}

export const isForkFrom = (protocol: EarnDex, coreProtocol: CoreProtocol) =>
  PROTOCOLS_CORE_MAPPING[protocol] === coreProtocol

export const isFarmingProtocol = (protocol: EarnDex | EarnDex2) => FARMING_DEXES.includes(protocol)

export const navigateToPositionAfterZap = async (
  library: Web3Provider,
  txHash: string,
  chainId: number,
  dex: EarnDex,
  poolId: string,
  navigateFunc: (url: string) => void,
) => {
  let url
  const isUniv2 = isForkFrom(dex, CoreProtocol.UniswapV2)

  if (isUniv2) {
    url =
      APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', poolId)
        .replace(':chainId', chainId.toString())
        .replace(':protocol', dex) + '?forceLoading=true'
  } else {
    const tokenId = await getTokenId(library, txHash)
    if (!tokenId) {
      navigateFunc(APP_PATHS.EARN_POSITIONS)
      return
    }
    const nftContractObj = NFT_MANAGER_CONTRACT[dex]
    const nftContract =
      typeof nftContractObj === 'string'
        ? nftContractObj
        : nftContractObj[chainId as unknown as keyof typeof nftContractObj]
    url =
      APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', `${nftContract}-${tokenId}`)
        .replace(':chainId', chainId.toString())
        .replace(':protocol', dex) + '?forceLoading=true'
  }

  navigateFunc(url)
}

export const isNativeToken = (tokenAddress: string, chainId: keyof typeof WETH) =>
  NATIVE_ADDRESSES[chainId as EarnChain] === tokenAddress.toLowerCase() ||
  (WETH[chainId] && tokenAddress.toLowerCase() === WETH[chainId].address)

export const parseRawPosition = ({
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
    EarnDex.DEX_UNISWAP_V4_KEM,
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
    aprFee: position.apr || 0,
    apr: (position.apr || 0) + (position.aprKem || 0),
    aprKem: position.aprKem || 0,
    totalValue: position.currentPositionValue,
    unclaimedFees: feeInfo ? feeInfo.totalValue : position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0),
    status: isUniv2 ? PositionStatus.IN_RANGE : position.status,
    createdTime: position.createdTime,
  }
}

export const submitTransaction = async ({
  library,
  txData,
  onError,
}: {
  library?: Web3Provider
  txData: TransactionRequest
  onError?: (error: Error) => void
}) => {
  if (!library) throw new Error('Library is not ready!')
  try {
    const estimate = await library.getSigner().estimateGas(txData)
    const res = await library.getSigner().sendTransaction({
      ...txData,
      gasLimit: calculateGasMargin(estimate),
    })

    return res.hash || undefined
  } catch (error) {
    console.error('Submit transaction error:', error)
    if (onError) onError(error as Error)
    return
  }
}

export const getUnclaimedFees = async ({
  contract,
  positionOwner,
  tokenId,
}: {
  contract: Contract
  positionOwner: string
  tokenId: string
}) => {
  const maxUnit = '0x' + (2n ** 128n - 1n).toString(16)
  const results = await contract.callStatic.collect(
    {
      tokenId: tokenId,
      recipient: positionOwner,
      amount0Max: maxUnit,
      amount1Max: maxUnit,
    },
    { from: positionOwner },
  )
  const balance0 = results.amount0.toString()
  const balance1 = results.amount1.toString()

  return { balance0, balance1 }
}

export const getFullUnclaimedFeesInfo = async ({
  contract,
  positionOwner,
  tokenId,
  chainId,
  token0,
  token1,
}: {
  contract: Contract
  positionOwner: string
  tokenId: string
  chainId: number
  token0: {
    address: string
    decimals: number
    price: number
  }
  token1: {
    address: string
    decimals: number
    price: number
  }
}) => {
  const maxUnit = '0x' + (2n ** 128n - 1n).toString(16)
  const results = await contract.callStatic.collect(
    {
      tokenId: tokenId,
      recipient: positionOwner,
      amount0Max: maxUnit,
      amount1Max: maxUnit,
    },
    { from: positionOwner },
  )
  const balance0 = results.amount0.toString()
  const balance1 = results.amount1.toString()

  const amount0 = CurrencyAmount.fromRawAmount(new Token(chainId, token0.address, token0.decimals), balance0).toExact()
  const amount1 = CurrencyAmount.fromRawAmount(new Token(chainId, token1.address, token1.decimals), balance1).toExact()

  const token0Price = token0.price
  const token1Price = token1.price

  return {
    balance0,
    balance1,
    amount0,
    amount1,
    value0: parseFloat(amount0) * token0Price,
    value1: parseFloat(amount1) * token1Price,
    totalValue: parseFloat(amount0) * token0Price + parseFloat(amount1) * token1Price,
  }
}

export const getNftManagerContractAddress = (dex: EarnDex, chainId: number) => {
  const nftManagerContractElement = NFT_MANAGER_CONTRACT[dex]

  return typeof nftManagerContractElement === 'string'
    ? nftManagerContractElement
    : nftManagerContractElement[chainId as keyof typeof nftManagerContractElement]
}

export const getNftManagerContract = (dex: EarnDex, chainId: number, library: Web3Provider) => {
  const nftManagerContractAddress = getNftManagerContractAddress(dex, chainId)
  const nftManagerAbi = NFT_MANAGER_ABI[dex]
  if (!nftManagerAbi) return

  return getReadingContract(nftManagerContractAddress, nftManagerAbi, library)
}
