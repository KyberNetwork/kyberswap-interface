import { RewardData, RewardType } from 'services/reward'

import { NetworkInfo } from 'constants/networks/type'
import { ChainRewardInfo, NftRewardInfo, RewardInfo, TokenInfo, TokenRewardInfo } from 'pages/Earns/types'

export const defaultRewardInfo: RewardInfo = {
  totalUsdValue: 0,
  totalLmUsdValue: 0,
  totalEgUsdValue: 0,
  claimableUsdValue: 0,
  claimedUsdValue: 0,
  inProgressUsdValue: 0,
  pendingUsdValue: 0,
  vestingUsdValue: 0,
  nfts: [],
  chains: [],
  tokens: [],
  egTokens: [],
  lmTokens: [],
}

const deepClone = <T>(obj: T): T => {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(obj)
  }
  return JSON.parse(JSON.stringify(obj))
}

const createTokenRewardInfo = (tokenAddress: string, token: TokenInfo, nft: any): TokenRewardInfo => {
  const { symbol, logo, decimals, chainId } = token

  const totalAmount =
    (Number(nft.merkleAmounts?.[tokenAddress] || 0) +
      Number(nft.pendingAmounts?.[tokenAddress] || 0) +
      Number(nft.vestingAmounts?.[tokenAddress] || 0)) /
    10 ** decimals

  const claimableAmount = Number(nft.claimableAmounts?.[tokenAddress] || 0) / 10 ** decimals
  const pendingAmount = Number(nft.pendingAmounts?.[tokenAddress] || 0) / 10 ** decimals
  const vestingAmount = Number(nft.vestingAmounts?.[tokenAddress] || 0) / 10 ** decimals

  const unclaimedAmount = claimableAmount + pendingAmount + vestingAmount
  const claimableUsdValue = Number(nft.claimableUSDValues?.[tokenAddress] || 0)

  return {
    symbol,
    logo,
    chainId,
    address: tokenAddress,
    totalAmount,
    claimableAmount,
    unclaimedAmount,
    pendingAmount,
    vestingAmount,
    claimableUsdValue,
  }
}

const mergeTokenRewards = (target: TokenRewardInfo, source: TokenRewardInfo): void => {
  target.totalAmount += source.totalAmount
  target.claimableAmount += source.claimableAmount
  target.unclaimedAmount += source.unclaimedAmount
  target.pendingAmount += source.pendingAmount
  target.vestingAmount += source.vestingAmount
  target.claimableUsdValue += source.claimableUsdValue
}

const mergeNftRewards = (target: NftRewardInfo, source: NftRewardInfo): void => {
  target.totalUsdValue += source.totalUsdValue
  target.totalLmUsdValue += source.totalLmUsdValue
  target.totalEgUsdValue += source.totalEgUsdValue
  target.claimedUsdValue += source.claimedUsdValue
  target.pendingUsdValue += source.pendingUsdValue
  target.vestingUsdValue += source.vestingUsdValue
  target.inProgressUsdValue += source.inProgressUsdValue
  target.claimableUsdValue += source.claimableUsdValue
  target.unclaimedUsdValue += source.unclaimedUsdValue
}

const mergeTokenArrays = (targetArray: TokenRewardInfo[], sourceArray: TokenRewardInfo[]): void => {
  const tokenMap = new Map<string, TokenRewardInfo>()

  targetArray.forEach(token => {
    tokenMap.set(token.address, token)
  })

  sourceArray.forEach(sourceToken => {
    const existingToken = tokenMap.get(sourceToken.address)
    if (existingToken) {
      mergeTokenRewards(existingToken, sourceToken)
    } else {
      const newToken = deepClone(sourceToken)
      targetArray.push(newToken)
      tokenMap.set(newToken.address, newToken)
    }
  })
}

export const parseReward = ({
  data,
  tokens,
  supportedChains,
}: {
  data: RewardData | undefined
  tokens: TokenInfo[]
  supportedChains: Array<NetworkInfo>
}) => {
  if (!data || !tokens || !tokens.length) return null

  // Create token lookup map
  const tokenLookup = new Map<string, TokenInfo>()
  tokens.forEach(token => {
    const key = `${token.address.toLowerCase()}_${token.chainId}`
    tokenLookup.set(key, token)
  })

  // Create chain lookup map
  const chainLookup = new Map<number, NetworkInfo>()
  supportedChains.forEach(chain => {
    chainLookup.set(chain.chainId, chain)
  })

  const nftMap = new Map<string, NftRewardInfo>()

  // Single pass through all data
  Object.entries(data).forEach(([chainId, chainData]) => {
    const numericChainId = Number(chainId)

    Object.entries(chainData.campaigns).forEach(([_campaignId, campaign]) => {
      const campaignType = campaign.type || ''
      const rewardTokens = campaign.tokens || []

      rewardTokens.forEach(nft => {
        const nftId = nft.erc721TokenId

        // Calculate USD values
        const totalUsdValue = Number(nft.totalUSDValue || 0)
        const totalLmUsdValue = campaignType === RewardType.LM ? totalUsdValue : 0
        const totalEgUsdValue = campaignType === RewardType.EG ? totalUsdValue : 0
        const claimedUsdValue = Number(nft.claimedUSDValue || 0)
        const pendingUsdValue = Number(nft.pendingUSDValue || 0)
        const vestingUsdValue = Number(nft.vestingUSDValue || 0)
        const inProgressUsdValue = pendingUsdValue + vestingUsdValue
        const claimableUsdValue = Number(nft.claimableUSDValue || 0)
        const unclaimedUsdValue = claimableUsdValue + inProgressUsdValue

        // Get unique token addresses
        const uniqueAddresses = new Set<string>()
        Object.keys(nft.merkleAmounts || {}).forEach(addr => uniqueAddresses.add(addr.toLowerCase()))
        Object.keys(nft.pendingAmounts || {}).forEach(addr => uniqueAddresses.add(addr.toLowerCase()))
        Object.keys(nft.vestingAmounts || {}).forEach(addr => uniqueAddresses.add(addr.toLowerCase()))

        // Process tokens
        const tokens: TokenRewardInfo[] = []
        uniqueAddresses.forEach(address => {
          const tokenKey = `${address}_${numericChainId}`
          const tokenInfo = tokenLookup.get(tokenKey)
          if (tokenInfo) {
            tokens.push(createTokenRewardInfo(address, tokenInfo, nft))
          }
        })

        // Separate EG and LM tokens based on campaign type
        const egTokens = campaignType === RewardType.EG ? [...tokens] : []
        const lmTokens = campaignType === RewardType.LM ? [...tokens] : []

        const nftReward: NftRewardInfo = {
          nftId,
          chainId: numericChainId,
          totalUsdValue,
          totalLmUsdValue,
          totalEgUsdValue,
          claimedUsdValue,
          pendingUsdValue,
          vestingUsdValue,
          inProgressUsdValue,
          claimableUsdValue,
          unclaimedUsdValue,
          tokens,
          egTokens,
          lmTokens,
        }

        // Merge with existing NFT if present
        const existingNft = nftMap.get(nftId)
        if (existingNft) {
          mergeNftRewards(existingNft, nftReward)
          mergeTokenArrays(existingNft.tokens, nftReward.tokens)
          mergeTokenArrays(existingNft.egTokens, nftReward.egTokens)
          mergeTokenArrays(existingNft.lmTokens, nftReward.lmTokens)
        } else {
          nftMap.set(nftId, nftReward)
        }
      })
    })
  })

  const listNft = Array.from(nftMap.values())

  // Calculate totals in single pass
  let totalUsdValue = 0
  let totalLmUsdValue = 0
  let totalEgUsdValue = 0
  let claimableUsdValue = 0
  let claimedUsdValue = 0
  let inProgressUsdValue = 0
  let pendingUsdValue = 0
  let vestingUsdValue = 0

  listNft.forEach(nft => {
    totalUsdValue += nft.totalUsdValue
    totalLmUsdValue += nft.totalLmUsdValue
    totalEgUsdValue += nft.totalEgUsdValue
    claimableUsdValue += nft.claimableUsdValue
    claimedUsdValue += nft.claimedUsdValue
    inProgressUsdValue += nft.inProgressUsdValue
    pendingUsdValue += nft.pendingUsdValue
    vestingUsdValue += nft.vestingUsdValue
  })

  // Aggregate EG and LM tokens
  const egTokenMap = new Map<string, TokenRewardInfo>()
  const lmTokenMap = new Map<string, TokenRewardInfo>()
  const tokenMap = new Map<string, TokenRewardInfo>()

  listNft.forEach(nft => {
    nft.egTokens.forEach(token => {
      const existing = egTokenMap.get(token.symbol)
      if (existing) {
        mergeTokenRewards(existing, token)
      } else {
        egTokenMap.set(token.symbol, deepClone(token))
      }
    })

    nft.lmTokens.forEach(token => {
      const existing = lmTokenMap.get(token.symbol)
      if (existing) {
        mergeTokenRewards(existing, token)
      } else {
        lmTokenMap.set(token.symbol, deepClone(token))
      }
    })

    nft.tokens.forEach(token => {
      const existing = tokenMap.get(token.symbol)
      if (existing) {
        mergeTokenRewards(existing, token)
      } else {
        tokenMap.set(token.symbol, deepClone(token))
      }
    })
  })

  // Build chains array
  const chainMap = new Map<number, ChainRewardInfo>()

  listNft
    .filter(nft => nft.claimableUsdValue > 0)
    .forEach(nft => {
      const chain = chainLookup.get(nft.chainId)
      if (!chain) return

      const existingChain = chainMap.get(nft.chainId)
      if (existingChain) {
        existingChain.claimableUsdValue += nft.claimableUsdValue
        mergeTokenArrays(
          existingChain.tokens,
          nft.tokens.filter(token => token.claimableAmount > 0),
        )
      } else {
        chainMap.set(nft.chainId, {
          chainId: nft.chainId,
          chainName: chain.name,
          chainLogo: chain.icon,
          claimableUsdValue: nft.claimableUsdValue,
          tokens: nft.tokens.filter(token => token.claimableAmount > 0).map(token => deepClone(token)),
        })
      }
    })

  return {
    totalUsdValue,
    totalLmUsdValue,
    totalEgUsdValue,
    claimableUsdValue,
    claimedUsdValue,
    inProgressUsdValue,
    pendingUsdValue,
    vestingUsdValue,
    nfts: listNft,
    chains: Array.from(chainMap.values()),
    egTokens: Array.from(egTokenMap.values()),
    lmTokens: Array.from(lmTokenMap.values()),
    tokens: Array.from(tokenMap.values()),
  }
}
