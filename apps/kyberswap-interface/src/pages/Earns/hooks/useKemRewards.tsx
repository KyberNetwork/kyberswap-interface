import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useBatchClaimEncodeDataMutation,
  useClaimEncodeDataMutation,
  useRewardCampaignQuery,
  useRewardInfoQuery,
} from 'services/reward'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { fetchListTokenByAddresses } from 'hooks/Tokens'
import useChainsConfig from 'hooks/useChainsConfig'
import ClaimModal, { ClaimInfo, ClaimType } from 'pages/Earns/components/ClaimModal'
import { KEM_REWARDS_CONTRACT } from 'pages/Earns/constants'
import { RewardInfo, TokenRewardInfo } from 'pages/Earns/types'
import { submitTransaction } from 'pages/Earns/utils'
import { useNotify } from 'state/application/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'

const useKemRewards = () => {
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const allTransactions = useAllTransactions(true)

  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { supportedChains } = useChainsConfig()

  const { data: campaignId } = useRewardCampaignQuery({
    chainId,
  })

  const { data, refetch: refetchRewardInfo } = useRewardInfoQuery(
    {
      owner: account || '',
      campaignId: campaignId || '',
    },
    { skip: !account || !campaignId },
  )
  const [batchClaimEncodeData] = useBatchClaimEncodeDataMutation()
  const [claimEncodeData] = useClaimEncodeDataMutation()

  const [tokens, setTokens] = useState<WrappedTokenInfo[]>([])
  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null)
  const [openClaimModal, setOpenClaimModal] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  const rewardInfo: RewardInfo | null = useMemo(() => {
    if (!campaignId || !data || !tokens.length) return null

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
      const rewardInfoForChain = data[chainId].campaigns[campaignId]?.tokens || []

      const totalUsdValue = rewardInfoForChain.reduce((acc, item) => acc + Number(item.totalUSDValue), 0)
      const pendingUsdValue = rewardInfoForChain.reduce((acc, item) => acc + Number(item.pendingUSDValue), 0)
      const claimedUsdValue = rewardInfoForChain.reduce((acc, item) => acc + Number(item.claimedUSDValue), 0)
      const claimableUsdValue = rewardInfoForChain.reduce((acc, item) => acc + Number(item.claimableUSDValue), 0)

      const kncAddress = kncAddresses[chainId as keyof typeof kncAddresses]

      const totalAmount = kncAddress
        ? rewardInfoForChain.reduce((acc, item) => {
            const merkleAmounts = Number(item.merkleAmounts[kncAddress] || 0) / 10 ** kncTokenDecimals
            const pendingAmounts = Number(item.pendingAmounts[kncAddress] || 0) / 10 ** kncTokenDecimals

            return acc + merkleAmounts + pendingAmounts
          }, 0)
        : 0 // temporary

      const claimableAmount = kncAddress
        ? rewardInfoForChain.reduce((acc, item) => {
            return (
              acc +
              (Number(item.merkleAmounts[kncAddress] || 0) - Number(item.claimedAmounts[kncAddress] || 0)) /
                10 ** kncTokenDecimals
            )
          }, 0)
        : 0 // temporary

      const nfts = rewardInfoForChain.map(item => ({
        nftId: item.erc721TokenId,
        totalUsdValue: Number(item.totalUSDValue),
        pendingUsdValue: Number(item.pendingUSDValue),
        claimedUsdValue: Number(item.claimedUSDValue),
        claimableUsdValue: Number(item.claimableUSDValue),

        totalAmount: kncAddress
          ? rewardInfoForChain.reduce((acc, item) => {
              const merkleAmounts = Number(item.merkleAmounts[kncAddress] || 0) / 10 ** kncTokenDecimals
              const pendingAmounts = Number(item.pendingAmounts[kncAddress] || 0) / 10 ** kncTokenDecimals

              return acc + merkleAmounts + pendingAmounts
            }, 0)
          : 0, // temporary
        claimableAmount: kncAddress
          ? rewardInfoForChain.reduce((acc, item) => {
              return (
                acc +
                (Number(item.merkleAmounts[kncAddress] || 0) - Number(item.claimedAmounts[kncAddress] || 0)) /
                  10 ** kncTokenDecimals
              )
            }, 0)
          : 0, // temporary

        tokens: Object.keys(item.merkleAmounts)
          .map(tokenAddress => {
            const token = tokens.find(token => token.address.toLowerCase() === tokenAddress.toLowerCase())
            if (!token) return null

            return {
              symbol: token.symbol,
              logo: token.logoURI,
              chainId: token.chainId,
              address: tokenAddress,
              totalAmount:
                (Number(item.merkleAmounts[tokenAddress]) + Number(item.pendingAmounts[tokenAddress])) /
                10 ** token.decimals,
              claimableAmount:
                (Number(item.merkleAmounts[tokenAddress]) - Number(item.claimedAmounts[tokenAddress])) /
                10 ** token.decimals,
              claimableUsdValue: Number(item.claimableUSDValues[tokenAddress]),
            }
          })
          .filter((token): token is TokenRewardInfo => !!token),
      }))

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

    return {
      totalUsdValue,
      totalAmount,
      pendingUsdValue,
      claimedUsdValue,
      claimableUsdValue,
      claimableAmount,
      chains,
    }
  }, [campaignId, data, tokens])

  const handleClaim = useCallback(async () => {
    if (!account || !claimInfo || !campaignId) return
    setClaiming(true)

    const encodeData = !claimInfo.nftId
      ? await batchClaimEncodeData({
          owner: account,
          recipient: account,
          chainId,
          campaignId,
        })
      : await claimEncodeData({
          recipient: account,
          chainId,
          campaignId,
          erc721Addr: '0x7c5f5a4bbd8fd63184577525326123b519429bdc',
          erc721Id: claimInfo.nftId,
        })

    if ('error' in encodeData) {
      console.error('Error in batch claim data:', encodeData.error)
      return
    }

    const txHash = await submitTransaction({
      library,
      txData: {
        to: KEM_REWARDS_CONTRACT,
        data: `0x${encodeData.data}`,
      },
      onError: (error: Error) => {
        notify({
          title: t`Error`,
          type: NotificationType.ERROR,
          summary: error.message,
        })
        setClaiming(false)
      },
    })
    if (!txHash) throw new Error('Transaction failed')
    setTxHash(txHash)
    addTransactionWithType({
      type: TRANSACTION_TYPE.COLLECT_FEE,
      hash: txHash,
    })
  }, [
    account,
    addTransactionWithType,
    batchClaimEncodeData,
    campaignId,
    chainId,
    claimEncodeData,
    claimInfo,
    library,
    notify,
  ])

  const onCloseClaim = useCallback(() => {
    setOpenClaimModal(false)
    setClaimInfo(null)
  }, [])

  const onOpenClaim = (nftId?: string, positionChainId?: number) => {
    if (!rewardInfo) {
      console.log('reward is not ready!')
      return
    }
    setOpenClaimModal(true)

    const rewardInfoForChain = rewardInfo.chains.find(item => item.chainId === positionChainId || chainId)

    if (!rewardInfoForChain) return

    const rewardNftInfo = rewardInfoForChain.nfts.find(nft => nft.nftId === nftId)

    if (nftId && !rewardNftInfo) {
      console.log('reward nft info is not existed!')
      return
    }

    setClaimInfo({
      nftId,
      chainId: nftId && positionChainId ? positionChainId : chainId,
      tokens: (rewardNftInfo?.tokens || rewardInfoForChain.claimableTokens || []).map(tokenReward => ({
        logo: tokenReward.logo,
        symbol: tokenReward.symbol,
        amount: tokenReward.claimableAmount,
        value: tokenReward.claimableUsdValue,
      })),
      totalValue: rewardNftInfo ? rewardNftInfo.claimableUsdValue : rewardInfoForChain.claimableUsdValue,
    })
  }

  useEffect(() => {
    const fetchTokens = async () => {
      if (!data || !campaignId || !supportedChains || !supportedChains.length) {
        setTokens([])
        return
      }
      const listTokenAddress: string[] = []

      supportedChains.forEach(chainInfo => {
        if (data[chainInfo.chainId.toString()]) {
          data[chainInfo.chainId.toString()].campaigns[campaignId]?.tokens.forEach(item => {
            Object.keys(item.claimedAmounts).forEach(address => {
              !listTokenAddress.includes(address) && listTokenAddress.push(address)
            })
          })
        }
      })

      const response = await fetchListTokenByAddresses(listTokenAddress, chainId)
      setTokens(response)
    }
    fetchTokens()
  }, [campaignId, chainId, data, supportedChains])

  useEffect(() => {
    if (txHash && allTransactions && allTransactions[txHash]) {
      const tx = allTransactions[txHash]
      if (tx?.[0].receipt && tx?.[0].receipt.status === 1) {
        setClaiming(false)
        setTxHash(null)
        setOpenClaimModal(false)
        refetchRewardInfo()
      }
    }
  }, [allTransactions, refetchRewardInfo, txHash])

  const claimModal =
    openClaimModal && claimInfo ? (
      <ClaimModal
        claimType={ClaimType.REWARDS}
        claiming={claiming}
        claimInfo={claimInfo}
        onClaim={handleClaim}
        onClose={onCloseClaim}
      />
    ) : null

  return { rewardInfo, claimModal, onOpenClaim, claiming }
}

export default useKemRewards
