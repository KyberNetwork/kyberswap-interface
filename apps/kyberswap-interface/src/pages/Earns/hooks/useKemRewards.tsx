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
import ClaimModal, { ClaimInfo, ClaimType } from 'pages/Earns/ClaimModal'
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

  const { data: campaignId } = useRewardCampaignQuery({
    chainId,
  })

  const { data, refetch: refetchRewardInfo } = useRewardInfoQuery(
    {
      owner: account || '',
      campaignId: campaignId || '',
      chainId,
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
    if (!campaignId || !data || !data.length || !tokens.length) return null

    const phase1TokenAddress = Object.keys(data[0].claimedAmounts)[0]
    const phase1Token = tokens.find(token => token.address.toLowerCase() === phase1TokenAddress.toLowerCase())
    if (!phase1Token) return null

    const totalUsdValue = data.reduce((acc, item) => acc + Number(item.totalUSDValue), 0)
    const totalAmount = data.reduce((acc, item) => {
      const merkleAmounts = Number(item.merkleAmounts[phase1TokenAddress] || 0) / 10 ** phase1Token.decimals
      const pendingAmounts = Number(item.pendingAmounts[phase1TokenAddress] || 0) / 10 ** phase1Token.decimals

      return acc + merkleAmounts + pendingAmounts
    }, 0) // temporary

    const pendingUsdValue = data.reduce((acc, item) => acc + Number(item.pendingUSDValue), 0)
    const claimedUsdValue = data.reduce((acc, item) => acc + Number(item.claimedUSDValue), 0)

    const claimableUsdValue = data.reduce((acc, item) => acc + Number(item.claimableUSDValue), 0)
    const claimableAmount = data.reduce((acc, item) => {
      const amount = Object.keys(item.merkleAmounts).reduce((childAcc, tokenRewardItem) => {
        const token = tokens.find(token => token.address.toLowerCase() === tokenRewardItem.toLowerCase())
        if (!token) return childAcc

        return (
          childAcc +
          (Number(item.merkleAmounts[tokenRewardItem]) - Number(item.claimedAmounts[tokenRewardItem])) /
            10 ** token.decimals
        )
      }, 0)
      return acc + amount
    }, 0) // temporary

    const nfts = data.map(item => ({
      nftId: item.erc721TokenId,
      totalUsdValue: Number(item.totalUSDValue),
      pendingUsdValue: Number(item.pendingUSDValue),
      claimedUsdValue: Number(item.claimedUSDValue),
      claimableUsdValue: Number(item.claimableUSDValue),
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
      totalUsdValue,
      totalAmount, // temporary
      pendingUsdValue,
      claimedUsdValue,
      claimableUsdValue,
      claimableAmount, // temporary
      claimableTokens,
      nfts,
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
    const rewardNftInfo = rewardInfo.nfts.find(nft => nft.nftId === nftId)

    if (nftId && !rewardNftInfo) {
      console.log('reward nft info is not existed!')
      return
    }

    setClaimInfo({
      nftId,
      chainId: nftId && positionChainId ? positionChainId : chainId,
      tokens: (rewardNftInfo?.tokens || rewardInfo.claimableTokens || []).map(tokenReward => ({
        logo: tokenReward.logo,
        symbol: tokenReward.symbol,
        amount: tokenReward.claimableAmount,
        value: tokenReward.claimableUsdValue,
      })),
      totalValue: rewardNftInfo ? rewardNftInfo.claimableUsdValue : rewardInfo.claimableUsdValue,
    })
  }

  useEffect(() => {
    const fetchTokens = async () => {
      if (!data) {
        setTokens([])
        return
      }
      const listTokenAddress: string[] = []
      data.forEach(item => {
        Object.keys(item.claimedAmounts).forEach(address => {
          !listTokenAddress.includes(address) && listTokenAddress.push(address)
        })
      })
      const response = await fetchListTokenByAddresses(listTokenAddress, chainId)
      setTokens(response)
    }
    fetchTokens()
  }, [chainId, data])

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
