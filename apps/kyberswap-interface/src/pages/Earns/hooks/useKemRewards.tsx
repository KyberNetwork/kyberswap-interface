import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBatchClaimEncodeDataMutation, useClaimEncodeDataMutation, useRewardInfoQuery } from 'services/reward'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { fetchListTokenByAddresses } from 'hooks/Tokens'
import useChainsConfig from 'hooks/useChainsConfig'
import ClaimModal, { ClaimInfo, ClaimType } from 'pages/Earns/components/ClaimModal'
import { EarnDex, FARMING_SUPPORTED_CHAIN, KEM_REWARDS_CONTRACT } from 'pages/Earns/constants'
import { RewardInfo } from 'pages/Earns/types'
import { getNftManagerContractAddress, parseReward, submitTransaction } from 'pages/Earns/utils'
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

  const { data, refetch: refetchRewardInfo } = useRewardInfoQuery(
    {
      owner: account || '',
    },
    { skip: !account, pollingInterval: 30_000 },
  )
  const [batchClaimEncodeData] = useBatchClaimEncodeDataMutation()
  const [claimEncodeData] = useClaimEncodeDataMutation()

  const [tokens, setTokens] = useState<WrappedTokenInfo[]>([])
  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null)
  const [openClaimModal, setOpenClaimModal] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  const rewardInfo: RewardInfo | null = useMemo(() => parseReward(data, tokens), [data, tokens])

  const handleClaim = useCallback(async () => {
    if (!account || !claimInfo) return
    if (!FARMING_SUPPORTED_CHAIN.includes(chainId)) return

    setClaiming(true)

    const positionManagerContract = getNftManagerContractAddress(EarnDex.DEX_UNISWAP_V4_FAIRFLOW, chainId)

    const encodeData = !claimInfo.nftId
      ? await batchClaimEncodeData({
          owner: account,
          recipient: account,
          chainId,
        })
      : await claimEncodeData({
          recipient: account,
          chainId,
          campaignId: claimInfo.campaignId || '',
          erc721Addr: positionManagerContract,
          erc721Id: claimInfo.nftId,
        })

    if ('error' in encodeData) {
      notify({
        title: t`Error`,
        type: NotificationType.ERROR,
        summary:
          'data' in encodeData.error &&
          encodeData.error.data &&
          typeof encodeData.error.data === 'object' &&
          'message' in encodeData.error.data
            ? (encodeData.error.data.message as string)
            : 'status' in encodeData.error && encodeData.error.status === 'CUSTOM_ERROR'
            ? encodeData.error.error
            : 'An error occurred while processing your request',
      })
      setClaiming(false)
      return
    }

    const txHash = await submitTransaction({
      library,
      txData: {
        to: KEM_REWARDS_CONTRACT[chainId as keyof typeof KEM_REWARDS_CONTRACT],
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
  }, [account, addTransactionWithType, batchClaimEncodeData, chainId, claimEncodeData, claimInfo, library, notify])

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
      campaignId: rewardNftInfo?.campaignId,
    })
  }

  useEffect(() => {
    const fetchTokens = async () => {
      if (!data || !supportedChains || !supportedChains.length) {
        setTokens([])
        return
      }
      const listTokenAddress: string[] = []
      const propertyToCheck = ['claimableUSDValues', 'claimedAmounts', 'merkleAmounts', 'pendingAmounts'] as const

      supportedChains.forEach(chainInfo => {
        if (data[chainInfo.chainId.toString()]) {
          Object.keys(data[chainInfo.chainId.toString()].campaigns).forEach(campaignId => {
            data[chainInfo.chainId.toString()].campaigns[campaignId].tokens.forEach(rewardNftInfo => {
              propertyToCheck.forEach(property => {
                Object.keys(rewardNftInfo[property as keyof typeof rewardNftInfo]).forEach(address => {
                  !listTokenAddress.includes(address) && listTokenAddress.push(address)
                })
              })
            })
          })
        }
      })

      const response = await fetchListTokenByAddresses(listTokenAddress, chainId)
      setTokens(response)
    }
    fetchTokens()
  }, [chainId, data, supportedChains])

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
