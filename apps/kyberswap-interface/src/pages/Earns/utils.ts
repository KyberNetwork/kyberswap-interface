import { TransactionRequest, Web3Provider } from '@ethersproject/providers'
import { ChainId, CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'
import { defaultAbiCoder as abiEncoder, keccak256, solidityPack } from 'ethers/lib/utils'
import { RewardData, TokenRewardExtended } from 'services/reward'

import StateViewABI from 'constants/abis/earn/uniswapv4StateViewAbi.json'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import {
  CoreProtocol,
  EarnChain,
  EarnDex,
  Exchange,
  FARMING_DEXES,
  NATIVE_ADDRESSES,
  NFT_MANAGER_ABI,
  NFT_MANAGER_CONTRACT,
  PROTOCOLS_CORE_MAPPING,
  UNISWAPV4_STATEVIEW_CONTRACT,
} from 'pages/Earns/constants'
import {
  EarnPosition,
  FeeInfo,
  NftRewardInfo,
  ParsedPosition,
  PositionStatus,
  TokenRewardInfo,
} from 'pages/Earns/types'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { calculateGasMargin } from 'utils'
import { getReadingContractWithCustomChain } from 'utils/getContract'

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

export const isFarmingProtocol = (protocol: EarnDex | Exchange) => FARMING_DEXES.includes(protocol)

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

export const getUniv3UnclaimedFees = async ({
  tokenId,
  dex,
  chainId,
}: {
  tokenId: string
  dex: EarnDex
  chainId: number
}) => {
  const contract = getNftManagerContract(dex, chainId)
  if (!contract) return { balance0: 0, balance1: 0 }

  const owner = await contract.ownerOf(tokenId)

  const maxUnit = '0x' + (2n ** 128n - 1n).toString(16)
  const results = await contract.callStatic.collect(
    {
      tokenId,
      recipient: owner,
      amount0Max: maxUnit,
      amount1Max: maxUnit,
    },
    { from: owner },
  )
  const balance0 = results.amount0.toString()
  const balance1 = results.amount1.toString()

  return { balance0, balance1 }
}

export const getUniv4UnclaimedFees = async ({
  tokenId,
  dex,
  chainId,
  poolAddress,
}: {
  tokenId: number | string
  dex: EarnDex
  chainId: number
  poolAddress: string
}) => {
  const defaultBalance = { balance0: 0, balance1: 0 }

  try {
    const nftPosManagerContract = getNftManagerContract(dex, chainId)
    if (!nftPosManagerContract) return defaultBalance

    const positionInfo = await nftPosManagerContract.positionInfo(tokenId)
    const { tickLower, tickUpper } = decodePositionInfo(BigInt(positionInfo))

    const stateViewAddress = UNISWAPV4_STATEVIEW_CONTRACT[chainId as keyof typeof UNISWAPV4_STATEVIEW_CONTRACT]
    const stateViewContract = getReadingContractWithCustomChain(stateViewAddress, StateViewABI, chainId)
    if (!stateViewContract) return defaultBalance

    const salt = abiEncoder.encode(['uint256'], [tokenId])
    const nftPosManagerAddress = getNftManagerContractAddress(dex, chainId)
    const positionId = keccak256(
      solidityPack(['address', 'int24', 'int24', 'bytes32'], [nftPosManagerAddress, tickLower, tickUpper, salt]),
    )
    const statePositionInfo = await stateViewContract.getPositionInfo(poolAddress, positionId)
    const positionLiquidity = statePositionInfo[0]

    const feeGrowthInsideCurrent = await stateViewContract.getFeeGrowthInside(poolAddress, tickLower, tickUpper)
    const pendingFees0 = positionLiquidity
      .mul(feeGrowthInsideCurrent[0].sub(statePositionInfo.feeGrowthInside0LastX128))
      .shr(128)
    const pendingFees1 = positionLiquidity
      .mul(feeGrowthInsideCurrent[1].sub(statePositionInfo.feeGrowthInside1LastX128))
      .shr(128)

    return {
      balance0: pendingFees0.toString(),
      balance1: pendingFees1.toString(),
    }
  } catch (error) {
    console.log('getUniv4UnclaimedFees error', error)
    return defaultBalance
  }
}

export const getUnclaimedFeesInfo = async (position: ParsedPosition) => {
  const { tokenId, dex, chain, token0, token1 } = position
  const chainId = chain.id
  const isUniv4 = isForkFrom(dex.id, CoreProtocol.UniswapV4)

  const { balance0, balance1 } = isUniv4
    ? await getUniv4UnclaimedFees({
        tokenId,
        dex: dex.id,
        chainId,
        poolAddress: position.pool.address,
      })
    : await getUniv3UnclaimedFees({
        tokenId,
        dex: dex.id,
        chainId,
      })

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

const decodePositionInfo = (positionInfo: string | bigint) => {
  // Convert input to BigInt if it's a hex string
  if (typeof positionInfo === 'string') {
    positionInfo = BigInt(positionInfo)
  }

  // Extract tickLower (bits 8–31), signed 24-bit
  const tickLowerRaw = Number((positionInfo >> 8n) & 0xffffffn)
  const tickLower = tickLowerRaw >= 0x800000 ? tickLowerRaw - 0x1000000 : tickLowerRaw

  // Extract tickUpper (bits 32–55), signed 24-bit
  const tickUpperRaw = Number((positionInfo >> 32n) & 0xffffffn)
  const tickUpper = tickUpperRaw >= 0x800000 ? tickUpperRaw - 0x1000000 : tickUpperRaw

  // Extract top 200 bits (25 bytes) for poolId
  const truncatedPoolIdBigInt = positionInfo >> 56n
  const truncatedPoolIdHex = '0x' + truncatedPoolIdBigInt.toString(16).padStart(50, '0') // 25 bytes = 50 hex chars

  return {
    poolId: truncatedPoolIdHex, // for poolKeys lookup
    tickLower,
    tickUpper,
  }
}

export const getNftManagerContractAddress = (dex: EarnDex, chainId: number) => {
  const nftManagerContractElement = NFT_MANAGER_CONTRACT[dex]

  return typeof nftManagerContractElement === 'string'
    ? nftManagerContractElement
    : nftManagerContractElement[chainId as keyof typeof nftManagerContractElement]
}

export const getNftManagerContract = (dex: EarnDex, chainId: number) => {
  const nftManagerContractAddress = getNftManagerContractAddress(dex, chainId)
  const nftManagerAbi = NFT_MANAGER_ABI[dex]
  if (!nftManagerAbi) return

  return getReadingContractWithCustomChain(nftManagerContractAddress, nftManagerAbi, chainId as ChainId)
}

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

export const parseReward = (data: RewardData | undefined, tokens: WrappedTokenInfo[]) => {
  if (!data || !tokens.length) return null

  const kncAddresses = {
    '1': '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202',
    '42161': '0xe4DDDfe67E7164b0FE14E218d80dC4C08eDC01cB',
    '10': '0xe4DDDfe67E7164b0FE14E218d80dC4C08eDC01cB',
    '137': '0x1C954E8fe737F99f68Fa1CCda3e51ebDB291948C',
    '8453': '0x28fe69Ff6864C1C218878BDCA01482D36B9D57b1',
    '56': '0xfe56d5892BDffC7BF58f2E84BE1b2C32D21C308b',
    '59144': '0x3b2F62d42DB19B30588648bf1c184865D4C3B1D6',
  }
  const kncTokenDecimals = 18

  const chains = Object.keys(data).map(chainId => {
    const rewardInfoForChain: Array<TokenRewardExtended> = []
    Object.keys(data[chainId].campaigns).forEach(campaignId => {
      const rewardInfoForCampaign = data[chainId].campaigns[campaignId]?.tokens || []
      rewardInfoForCampaign.forEach(item => {
        rewardInfoForChain.push({
          ...item,
          campaignId,
        })
      })
    })

    const kncAddress = kncAddresses[chainId as keyof typeof kncAddresses].toLowerCase()

    const nfts = rewardInfoForChain.map(item => {
      const tokenAddressesInNft: Array<string> = []

      Object.keys(item.merkleAmounts).forEach(tokenAddress => {
        if (!tokenAddressesInNft.includes(tokenAddress)) tokenAddressesInNft.push(tokenAddress)
      })
      Object.keys(item.pendingAmounts).forEach(tokenAddress => {
        if (!tokenAddressesInNft.includes(tokenAddress)) tokenAddressesInNft.push(tokenAddress)
      })

      return {
        nftId: item.erc721TokenId,
        campaignId: item.campaignId,
        totalUsdValue: Number(item.totalUSDValue),
        pendingUsdValue: Number(item.pendingUSDValue),
        claimedUsdValue: Number(item.claimedUSDValue),
        claimableUsdValue: Number(item.claimableUSDValue),

        totalAmount: kncAddress // temporary
          ? (Number(item.merkleAmounts[kncAddress] || 0) + Number(item.pendingAmounts[kncAddress] || 0)) /
            10 ** kncTokenDecimals
          : 0,
        claimableAmount: kncAddress // temporary
          ? (Number(item.merkleAmounts[kncAddress] || 0) - Number(item.claimedAmounts[kncAddress] || 0)) /
            10 ** kncTokenDecimals
          : 0,

        tokens: tokenAddressesInNft
          .map(tokenAddress => {
            const token = tokens.find(token => token.address.toLowerCase() === tokenAddress.toLowerCase())
            if (!token) return null

            return {
              symbol: token.symbol,
              logo: token.logoURI,
              chainId: token.chainId,
              address: tokenAddress,
              totalAmount:
                (Number(item.merkleAmounts[tokenAddress] || 0) + Number(item.pendingAmounts[tokenAddress] || 0)) /
                10 ** token.decimals,
              claimableAmount:
                (Number(item.merkleAmounts[tokenAddress] || 0) - Number(item.claimedAmounts[tokenAddress] || 0)) /
                10 ** token.decimals,
              claimableUsdValue: Number(item.claimableUSDValues[tokenAddress] || 0),
            }
          })
          .filter((token): token is TokenRewardInfo => !!token),
      }
    })

    const totalUsdValue = nfts.reduce((acc, item) => acc + item.totalUsdValue, 0)
    const pendingUsdValue = nfts.reduce((acc, item) => acc + item.pendingUsdValue, 0)
    const claimedUsdValue = nfts.reduce((acc, item) => acc + item.claimedUsdValue, 0)
    const claimableUsdValue = nfts.reduce((acc, item) => acc + item.claimableUsdValue, 0)

    const totalAmount = kncAddress ? nfts.reduce((acc, item) => acc + item.totalAmount, 0) : 0 // temporary
    const claimableAmount = kncAddress ? nfts.reduce((acc, item) => acc + item.claimableAmount, 0) : 0 // temporary

    const claimableTokens: TokenRewardInfo[] = []
    nfts.forEach(nft => {
      nft.tokens.forEach(token => {
        const existingTokenIndex = claimableTokens.findIndex(t => t.address === token.address)
        if (existingTokenIndex === -1) {
          claimableTokens.push(token)
        } else {
          claimableTokens[existingTokenIndex].totalAmount += token.totalAmount
          claimableTokens[existingTokenIndex].claimableAmount += token.claimableAmount
          claimableTokens[existingTokenIndex].claimableUsdValue += token.claimableUsdValue
        }
      })
    })

    return {
      chainId: Number(chainId),
      totalUsdValue,
      pendingUsdValue,
      claimedUsdValue,
      claimableUsdValue,
      nfts,
      claimableTokens,

      totalAmount, // temporary
      claimableAmount, // temporary
    }
  })

  const totalUsdValue = chains.reduce((acc, item) => acc + item.totalUsdValue, 0)
  const pendingUsdValue = chains.reduce((acc, item) => acc + item.pendingUsdValue, 0)
  const claimedUsdValue = chains.reduce((acc, item) => acc + item.claimedUsdValue, 0)
  const claimableUsdValue = chains.reduce((acc, item) => acc + item.claimableUsdValue, 0)

  const totalAmount = chains.reduce((acc, item) => acc + item.totalAmount, 0)
  const claimableAmount = chains.reduce((acc, item) => acc + item.claimableAmount, 0)

  const nfts = chains.reduce((acc, item) => acc.concat(item.nfts), [] as NftRewardInfo[])

  return {
    totalUsdValue,
    totalAmount,
    pendingUsdValue,
    claimedUsdValue,
    claimableUsdValue,
    claimableAmount,
    chains,
    nfts,
  }
}
