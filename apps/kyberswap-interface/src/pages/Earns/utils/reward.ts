import { RewardData, RewardType } from 'services/reward'

import { NetworkInfo } from 'constants/networks/type'
import { ChainRewardInfo, NftRewardInfo, TokenInfo, TokenRewardInfo } from 'pages/Earns/types'

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj))

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

  const listNft: Array<NftRewardInfo> = []

  Object.keys(data).forEach(chainId => {
    const nftsInChain: Array<NftRewardInfo> = []

    Object.keys(data[chainId].campaigns).forEach(campaignId => {
      const rewardInfoForCampaign = data[chainId].campaigns[campaignId]?.tokens || []
      const campaignType = data[chainId].campaigns[campaignId]?.type || ''

      rewardInfoForCampaign.forEach(nft => {
        const nftId = nft.erc721TokenId
        const totalUsdValue = Number(nft.totalUSDValue || 0)
        const claimedUsdValue = Number(nft.claimedUSDValue || 0)
        const pendingUsdValue = Number(nft.pendingUSDValue || 0)
        const vestingUsdValue = Number(nft.vestingUSDValue || 0)
        const inProgressUsdValue = pendingUsdValue + vestingUsdValue
        const claimableUsdValue = Number(nft.claimableUSDValue || 0)
        const unclaimedUsdValue = claimableUsdValue + inProgressUsdValue

        const tokenAddressesInNft: Array<string> = []

        Object.keys(nft.merkleAmounts || {}).forEach(tokenAddress => {
          const address = tokenAddress.toLowerCase()
          if (!tokenAddressesInNft.includes(address)) tokenAddressesInNft.push(address)
        })
        Object.keys(nft.pendingAmounts || {}).forEach(tokenAddress => {
          const address = tokenAddress.toLowerCase()
          if (!tokenAddressesInNft.includes(address)) tokenAddressesInNft.push(address)
        })
        Object.keys(nft.vestingAmounts || {}).forEach(tokenAddress => {
          const address = tokenAddress.toLowerCase()
          if (!tokenAddressesInNft.includes(address)) tokenAddressesInNft.push(address)
        })

        const tokensByAddress: Array<TokenRewardInfo> = tokenAddressesInNft
          .map(tokenAddress => {
            const address = tokenAddress.toLowerCase()
            const token = tokens.find(token => token.address.toLowerCase() === address)
            if (!token) return null

            const { symbol, logo, chainId, decimals } = token

            const totalAmount =
              (Number(nft.merkleAmounts?.[address] || 0) +
                Number(nft.pendingAmounts?.[address] || 0) +
                Number(nft.vestingAmounts?.[address] || 0)) /
              10 ** decimals
            const claimableAmount = Number(nft.claimableAmounts?.[address] || 0) / 10 ** decimals
            const unclaimedAmount =
              (Number(nft.claimableAmounts?.[address] || 0) +
                Number(nft.pendingAmounts?.[address] || 0) +
                Number(nft.vestingAmounts?.[address] || 0)) /
              10 ** decimals
            const claimableUsdValue = Number(nft.claimableUSDValues?.[address] || 0)

            return {
              symbol,
              logo,
              chainId,
              address: tokenAddress,
              totalAmount,
              claimableAmount,
              unclaimedAmount,
              claimableUsdValue,
            }
          })
          .filter((token): token is TokenRewardInfo => !!token)

        const egTokens: Array<TokenRewardInfo> = campaignType === RewardType.EG ? deepClone(tokensByAddress) : []
        const lmTokens: Array<TokenRewardInfo> = campaignType === RewardType.LM ? deepClone(tokensByAddress) : []

        nftsInChain.push({
          nftId,
          chainId: Number(chainId),
          totalUsdValue,
          claimedUsdValue,
          pendingUsdValue,
          vestingUsdValue,
          inProgressUsdValue,
          claimableUsdValue,
          unclaimedUsdValue,
          tokens: deepClone(tokensByAddress),
          egTokens,
          lmTokens,
        })
      })
    })

    nftsInChain.forEach(nft => {
      const existingNftIndex = listNft.findIndex(item => item.nftId === nft.nftId)
      if (existingNftIndex === -1) {
        listNft.push(deepClone(nft))
      } else {
        listNft[existingNftIndex].totalUsdValue += nft.totalUsdValue
        listNft[existingNftIndex].claimedUsdValue += nft.claimedUsdValue
        listNft[existingNftIndex].pendingUsdValue += nft.pendingUsdValue
        listNft[existingNftIndex].vestingUsdValue += nft.vestingUsdValue
        listNft[existingNftIndex].inProgressUsdValue += nft.inProgressUsdValue
        listNft[existingNftIndex].claimableUsdValue += nft.claimableUsdValue

        nft.tokens.forEach(token => {
          const existingTokenIndex = listNft[existingNftIndex].tokens.findIndex(t => t.address === token.address)
          if (existingTokenIndex === -1) {
            listNft[existingNftIndex].tokens.push(deepClone(token))
          } else {
            listNft[existingNftIndex].tokens[existingTokenIndex].totalAmount += token.totalAmount
            listNft[existingNftIndex].tokens[existingTokenIndex].claimableAmount += token.claimableAmount
            listNft[existingNftIndex].tokens[existingTokenIndex].claimableUsdValue += token.claimableUsdValue
          }
        })

        nft.egTokens.forEach(token => {
          const existingTokenIndex = listNft[existingNftIndex].egTokens.findIndex(t => t.address === token.address)
          if (existingTokenIndex === -1) {
            listNft[existingNftIndex].egTokens.push(deepClone(token))
          } else {
            listNft[existingNftIndex].egTokens[existingTokenIndex].totalAmount += token.totalAmount
            listNft[existingNftIndex].egTokens[existingTokenIndex].claimableAmount += token.claimableAmount
            listNft[existingNftIndex].egTokens[existingTokenIndex].claimableUsdValue += token.claimableUsdValue
          }
        })

        nft.lmTokens.forEach(token => {
          const existingTokenIndex = listNft[existingNftIndex].lmTokens.findIndex(t => t.address === token.address)
          if (existingTokenIndex === -1) {
            listNft[existingNftIndex].lmTokens.push(deepClone(token))
          } else {
            listNft[existingNftIndex].lmTokens[existingTokenIndex].totalAmount += token.totalAmount
            listNft[existingNftIndex].lmTokens[existingTokenIndex].claimableAmount += token.claimableAmount
            listNft[existingNftIndex].lmTokens[existingTokenIndex].claimableUsdValue += token.claimableUsdValue
          }
        })
      }
    })
  })

  const totalUsdValue = listNft.reduce((acc, item) => acc + item.totalUsdValue, 0)
  const claimableUsdValue = listNft.reduce((acc, item) => acc + item.claimableUsdValue, 0)

  const chains: Array<ChainRewardInfo> = []

  listNft.forEach(nft => {
    const chainId = nft.chainId
    const chain = supportedChains.find(chain => chain.chainId === chainId)
    if (chain) {
      const existingChainRewardIndex = chains.findIndex(chain => chain.chainId === chainId)
      if (existingChainRewardIndex === -1) {
        chains.push({
          chainId,
          chainName: chain.name,
          chainLogo: chain.icon,
          claimableUsdValue: nft.claimableUsdValue,
          tokens: deepClone(nft.tokens),
        })
      } else {
        chains[existingChainRewardIndex].claimableUsdValue += nft.claimableUsdValue

        nft.tokens.forEach(token => {
          const existingTokenIndex = chains[existingChainRewardIndex].tokens.findIndex(t => t.address === token.address)
          if (existingTokenIndex === -1) {
            chains[existingChainRewardIndex].tokens.push(deepClone(token))
          } else {
            chains[existingChainRewardIndex].tokens[existingTokenIndex].totalAmount += token.totalAmount
            chains[existingChainRewardIndex].tokens[existingTokenIndex].claimableAmount += token.claimableAmount
            chains[existingChainRewardIndex].tokens[existingTokenIndex].claimableUsdValue += token.claimableUsdValue
            chains[existingChainRewardIndex].tokens[existingTokenIndex].unclaimedAmount += token.unclaimedAmount
          }
        })
      }
    }
  })

  return {
    totalUsdValue,
    claimableUsdValue,
    nfts: listNft,
    chains,
  }
}
