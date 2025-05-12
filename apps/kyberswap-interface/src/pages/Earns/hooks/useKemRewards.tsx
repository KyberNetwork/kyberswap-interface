import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBatchClaimEncodeDataMutation, useClaimEncodeDataMutation, useRewardInfoQuery } from 'services/reward'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { fetchListTokenByAddresses } from 'hooks/Tokens'
import ClaimModal, { ClaimInfo, ClaimType } from 'pages/Earns/ClaimModal'
import { KEM_REWARDS_CONTRACT } from 'pages/Earns/constants'
import { submitTransaction } from 'pages/Earns/utils'
import { useNotify } from 'state/application/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'

interface TokenType {
  symbol: string
  logo: string
  chainId: ChainId
  amount: number
  usdValue: null
}

const useKemRewards = ({ campaignId }: { campaignId: string }) => {
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const allTransactions = useAllTransactions(true)

  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()

  const { data, refetch: refetchRewardInfo } = useRewardInfoQuery(
    {
      owner: account || '',
      campaignId,
      chainId,
    },
    { skip: !account },
  )
  const [batchClaimEncodeData] = useBatchClaimEncodeDataMutation()
  const [claimEncodeData] = useClaimEncodeDataMutation()

  const [tokens, setTokens] = useState<WrappedTokenInfo[]>([])
  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null)
  const [openClaimModal, setOpenClaimModal] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  const rewardInfo = useMemo(() => {
    if (!data || !data.length || !tokens.length) return null

    const phase1TokenAddress = Object.keys(data[0].claimedAmounts)[0]
    const phase1Token = tokens.find(token => token.address.toLowerCase() === phase1TokenAddress.toLowerCase())
    if (!phase1Token) return null

    const totalRewardsUsdValue = data.reduce((acc, item) => acc + Number(item.totalUSDValue), 0)
    const totalRewardsAmount = data.reduce((acc, item) => {
      const claimedAmounts = Number(item.claimedAmounts[phase1TokenAddress] || 0) / 10 ** phase1Token.decimals
      const merkleAmounts = Number(item.merkleAmounts[phase1TokenAddress] || 0) / 10 ** phase1Token.decimals
      const pendingAmounts = Number(item.pendingAmounts[phase1TokenAddress] || 0) / 10 ** phase1Token.decimals

      return acc + claimedAmounts + merkleAmounts + pendingAmounts
    }, 0)
    const claimableRewardsUsdValue = data.reduce((acc, item) => acc + Number(item.claimableUSDValue), 0)
    const claimableRewardsAmount = data.reduce((acc, item) => {
      const totalAmount = Object.keys(item.merkleAmounts).reduce((childAcc, tokenRewardItem) => {
        const token = tokens.find(token => token.address.toLowerCase() === tokenRewardItem.toLowerCase())
        if (!token) return childAcc
        return childAcc + Number(item.merkleAmounts[tokenRewardItem]) / 10 ** token.decimals
      }, 0)
      return acc + totalAmount
    }, 0)

    return {
      totalRewardsUsdValue,
      totalRewardsAmount, // temporary
      claimableRewardsUsdValue,
      claimableRewardsAmount, // temporary
      nfts: data.map(item => {
        const totalAmount = Object.keys(item.merkleAmounts).reduce((childAcc, tokenRewardItem) => {
          const token = tokens.find(token => token.address.toLowerCase() === tokenRewardItem.toLowerCase())
          if (!token) return childAcc
          return childAcc + Number(item.merkleAmounts[tokenRewardItem]) / 10 ** token.decimals
        }, 0)

        return {
          nftId: item.erc721TokenId,
          totalUsdValue: item.claimableUSDValue,
          totalAmount, // temporary
          tokens: Object.keys(item.merkleAmounts)
            .map(tokenAddress => {
              const token = tokens.find(token => token.address.toLowerCase() === tokenAddress.toLowerCase())
              if (!token) return null
              return {
                symbol: token.symbol as string,
                logo: token.logoURI as string,
                chainId: token.chainId,
                amount: Number(item.merkleAmounts[tokenAddress]) / 10 ** token.decimals,
                usdValue: null,
              }
            })
            .filter((token): token is TokenType => !!token),
        }
      }),
    }
  }, [data, tokens])

  const handleClaim = useCallback(async () => {
    if (!account || !claimInfo) return
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
      tokens: (rewardNftInfo?.tokens || []).map(tokenReward => ({
        logo: tokenReward?.logo || '',
        symbol: tokenReward?.symbol || '',
        amount: tokenReward?.amount.toString() || '',
        value: tokenReward?.usdValue || 0,
      })),
      totalValue: 0,
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

  return { rewardInfo, claimModal, onOpenClaim }
}

export default useKemRewards
