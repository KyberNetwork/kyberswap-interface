import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBatchClaimEncodeDataMutation, useClaimEncodeDataMutation, useRewardInfoQuery } from 'services/reward'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { fetchListTokenByAddresses } from 'hooks/Tokens'
import useChainsConfig from 'hooks/useChainsConfig'
import ClaimAllModal from 'pages/Earns/components/ClaimAllModal'
import ClaimModal, { ClaimInfo, ClaimType } from 'pages/Earns/components/ClaimModal'
import { EarnDex, FARMING_SUPPORTED_CHAIN, KEM_REWARDS_CONTRACT } from 'pages/Earns/constants'
import { RewardInfo, TokenInfo } from 'pages/Earns/types'
import { getNftManagerContractAddress, submitTransaction } from 'pages/Earns/utils'
import { parseReward } from 'pages/Earns/utils/reward'
import { useNotify } from 'state/application/hooks'
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
    { skip: !account, pollingInterval: 15_000 },
  )
  const [batchClaimEncodeData] = useBatchClaimEncodeDataMutation()
  const [claimEncodeData] = useClaimEncodeDataMutation()

  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null)
  const [openClaimModal, setOpenClaimModal] = useState(false)
  const [openClaimAllModal, setOpenClaimAllModal] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  const rewardInfo: RewardInfo | null = useMemo(
    () => parseReward({ data, tokens, supportedChains }),
    [data, tokens, supportedChains],
  )

  const handleClaim = useCallback(async () => {
    if (!account || !claimInfo) return
    if (!FARMING_SUPPORTED_CHAIN.includes(chainId)) return

    setClaiming(true)

    const positionManagerContract = getNftManagerContractAddress(EarnDex.DEX_UNISWAP_V4_FAIRFLOW, chainId)

    const encodeData = await claimEncodeData({
      recipient: account,
      chainId,
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
      setOpenClaimModal(false)
      return
    }

    const res = await submitTransaction({
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
        setOpenClaimModal(false)
      },
    })
    const { txHash, error } = res
    if (!txHash || error) throw new Error(error?.message || 'Transaction failed')
    setTxHash(txHash)
    addTransactionWithType({
      type: TRANSACTION_TYPE.COLLECT_FEE,
      hash: txHash,
    })
  }, [account, addTransactionWithType, chainId, claimEncodeData, claimInfo, library, notify])

  const handleClaimAll = useCallback(async () => {
    if (!account || !FARMING_SUPPORTED_CHAIN.includes(chainId)) return
    setClaiming(true)

    const encodeData = await batchClaimEncodeData({
      owner: account,
      recipient: account,
      chainId,
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

    const res = await submitTransaction({
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
    const { txHash, error } = res
    if (!txHash || error) throw new Error(error?.message || 'Transaction failed')
    setTxHash(txHash)
    addTransactionWithType({
      type: TRANSACTION_TYPE.COLLECT_FEE,
      hash: txHash,
    })
  }, [account, addTransactionWithType, batchClaimEncodeData, chainId, library, notify])

  const onCloseClaim = useCallback(() => {
    setOpenClaimModal(false)
    setClaimInfo(null)
  }, [])

  const onOpenClaim = (nftId: string, positionChainId: number) => {
    if (!rewardInfo) {
      console.log('reward is not ready!')
      return
    }
    setOpenClaimModal(true)

    const rewardNftInfo = rewardInfo.nfts.find(nft => nft.nftId === nftId)

    if (!rewardNftInfo) {
      console.log('reward nft info is not existed!')
      return
    }

    setClaimInfo({
      nftId,
      chainId: positionChainId,
      tokens: (rewardNftInfo.tokens || []).map(tokenReward => ({
        logo: tokenReward.logo,
        symbol: tokenReward.symbol,
        amount: tokenReward.claimableAmount,
        value: tokenReward.claimableUsdValue,
      })),
      totalValue: rewardNftInfo.claimableUsdValue,
    })
  }

  const onOpenClaimAllRewards = () => {
    if (!rewardInfo) {
      console.log('reward is not ready!')
      return
    }
    setOpenClaimAllModal(true)
  }

  useEffect(() => {
    const fetchTokens = async () => {
      if (!data || !supportedChains || !supportedChains.length) {
        setTokens([])
        return
      }
      const listTokenAddress: string[] = []
      const propertyToCheck = [
        'claimedAmounts',
        'merkleAmounts',
        'pendingAmounts',
        'vestingAmounts',
        'claimableAmounts',
        'claimableUSDValues',
      ] as const

      const listChainIds = Object.keys(data)

      listChainIds.forEach(chainId => {
        Object.keys(data[chainId].campaigns).forEach(campaignId => {
          data[chainId].campaigns[campaignId].tokens.forEach(rewardNftInfo => {
            propertyToCheck.forEach(property => {
              Object.keys(rewardNftInfo[property as keyof typeof rewardNftInfo]).forEach(address => {
                !listTokenAddress.includes(address) && listTokenAddress.push(address)
              })
            })
          })
        })
      })

      const response = await fetchListTokenByAddresses(listTokenAddress, chainId)
      setTokens(
        response.map(token => ({
          address: token.address,
          symbol: token.symbol || '',
          logo: token.logoURI || '',
          decimals: token.decimals,
          chainId: token.chainId,
        })),
      )
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

  const claimAllRewardsModal =
    openClaimAllModal && rewardInfo ? (
      <ClaimAllModal
        rewardInfo={rewardInfo}
        onClaimAll={handleClaimAll}
        onClose={() => setOpenClaimAllModal(false)}
        claiming={claiming}
        setClaiming={setClaiming}
      />
    ) : null

  return { rewardInfo, claimModal, onOpenClaim, claiming, claimAllRewardsModal, onOpenClaimAllRewards }
}

export default useKemRewards
