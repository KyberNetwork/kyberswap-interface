import { RewardData, TokenRewardExtended } from 'services/reward'

import { NftRewardInfo, TokenRewardInfo } from 'pages/Earns/types'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

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
  const claimableTokens: TokenRewardInfo[] = []

  chains.forEach(chain => {
    chain.claimableTokens.forEach(token => {
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
    totalUsdValue,
    pendingUsdValue,
    claimedUsdValue,
    claimableUsdValue,

    totalAmount,
    claimableAmount,

    nfts,
    claimableTokens,

    chains,
  }
}
