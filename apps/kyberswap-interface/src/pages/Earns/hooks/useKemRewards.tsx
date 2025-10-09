import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBatchClaimEncodeDataMutation, useClaimEncodeDataMutation, useRewardInfoQuery } from 'services/reward'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { fetchListTokenByAddresses } from 'hooks/Tokens'
import useChainsConfig from 'hooks/useChainsConfig'
import useFilter from 'pages/Earns/UserPositions/useFilter'
import ClaimAllModal from 'pages/Earns/components/ClaimAllModal'
import ClaimModal, { ClaimInfo, ClaimType } from 'pages/Earns/components/ClaimModal'
import { EARN_CHAINS, EarnChain } from 'pages/Earns/constants'
import useCompounding from 'pages/Earns/hooks/useCompounding'
import { ParsedPosition, RewardInfo, TokenInfo } from 'pages/Earns/types'
import { getNftManagerContractAddress, submitTransaction } from 'pages/Earns/utils'
import { parseReward } from 'pages/Earns/utils/reward'
import { useNotify } from 'state/application/hooks'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { formatDisplayNumber } from 'utils/numbers'

const useKemRewards = (refetchAfterCollect?: () => void) => {
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const allTransactions = useAllTransactions(true)

  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { supportedChains } = useChainsConfig()
  const { filters } = useFilter()

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
  const [position, setPosition] = useState<ParsedPosition | null>(null)

  const onCloseClaim = useCallback(() => {
    setOpenClaimModal(false)
    setClaimInfo(null)
  }, [])

  const { widget: compoundingWidget, handleOpenCompounding } = useCompounding({
    onRefreshPosition: () => {
      refetchAfterCollect?.()
      refetchRewardInfo()
    },
    onCloseClaimModal: onCloseClaim,
  })

  const rewardInfo: RewardInfo | null = useMemo(() => {
    const chainIds = filters.chainIds?.split(',').filter(Boolean).map(Number)
    return parseReward({
      data,
      tokens,
      supportedChains: supportedChains.filter(chain => !chainIds?.length || chainIds.includes(chain.chainId)),
    })
  }, [data, tokens, supportedChains, filters.chainIds])

  const handleClaim = useCallback(async () => {
    if (!account || !claimInfo || !claimInfo.dex) return
    if (!EARN_CHAINS[chainId as unknown as EarnChain]?.farmingSupported) return

    setClaiming(true)

    const positionManagerContract = getNftManagerContractAddress(claimInfo.dex, chainId)
    if (!positionManagerContract) return

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

    const { calldata, contractAddress } = encodeData.data

    const res = await submitTransaction({
      library,
      txData: {
        to: contractAddress,
        data: `0x${calldata}`,
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
      type: TRANSACTION_TYPE.CLAIM_REWARD,
      hash: txHash,
      extraInfo: {
        summary: `rewards: ${claimInfo.tokens
          .map(token => `${formatDisplayNumber(token.amount, { significantDigits: 4 })} ${token.symbol}`)
          .join(', ')}`,
      },
    })
  }, [account, addTransactionWithType, chainId, claimEncodeData, claimInfo, library, notify])

  const handleClaimAll = useCallback(async () => {
    if (!account || !EARN_CHAINS[chainId as unknown as EarnChain]?.farmingSupported) return
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

    const { calldata, contractAddress } = encodeData.data

    const res = await submitTransaction({
      library,
      txData: {
        to: contractAddress,
        data: `0x${calldata}`,
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
      type: TRANSACTION_TYPE.CLAIM_REWARD,
      hash: txHash,
      extraInfo: {
        summary: `rewards: ${rewardInfo?.chains
          ?.find(chain => chain.chainId === chainId)
          ?.tokens?.filter(token => token.claimableAmount > 0)
          .map(token => `${formatDisplayNumber(token.claimableAmount, { significantDigits: 4 })} ${token.symbol}`)
          .join(', ')}`,
      },
    })
  }, [account, addTransactionWithType, batchClaimEncodeData, chainId, library, notify, rewardInfo?.chains])

  const onOpenClaim = (position?: ParsedPosition) => {
    if (!position) return
    const nftId = position.tokenId
    const positionChainId = position.chain.id

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
      tokens: (rewardNftInfo.tokens || [])
        .filter(tokenReward => tokenReward.claimableAmount > 0)
        .map(tokenReward => ({
          logo: tokenReward.logo,
          symbol: tokenReward.symbol,
          amount: tokenReward.claimableAmount,
          value: tokenReward.claimableUsdValue,
        })),
      totalValue: rewardNftInfo.claimableUsdValue,
    })
    setPosition(position)
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
      const listTokenAddress: { [key: number]: string[] } = {}
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
        if (!listTokenAddress[Number(chainId)]) listTokenAddress[Number(chainId)] = []
        Object.keys(data[chainId].campaigns).forEach(campaignId => {
          data[chainId].campaigns[campaignId].tokens.forEach(rewardNftInfo => {
            propertyToCheck.forEach(property => {
              Object.keys(rewardNftInfo[property as keyof typeof rewardNftInfo]).forEach(address => {
                !listTokenAddress[Number(chainId)].includes(address) && listTokenAddress[Number(chainId)].push(address)
              })
            })
          })
        })
      })

      // Use Promise.all to fetch tokens from all chains in parallel
      const fetchPromises = Object.entries(listTokenAddress).map(([chainId, addresses]) =>
        fetchListTokenByAddresses(addresses, Number(chainId) as ChainId),
      )

      const responses = await Promise.all(fetchPromises)

      // Combine all token responses into a single array
      const allTokens = responses.flat()

      setTokens(
        allTokens.map(token => ({
          address: token.address,
          symbol: token.symbol || '',
          logo: token.logoURI || '',
          decimals: token.decimals,
          chainId: token.chainId,
        })),
      )
    }
    fetchTokens()
  }, [data, supportedChains])

  const onCompound = useCallback(() => {
    if (!position) return
    const claimableTokens = position.rewards.tokens.filter(
      token => token.claimableUsdValue > 0 || token.claimableAmount > 0,
    )
    const initDepositTokens = claimableTokens.map(token => token.address).join(',')
    const initAmounts = claimableTokens.map(token => token.claimableAmount).join(',')
    handleOpenCompounding({
      pool: {
        chainId: position.chain.id,
        address: position.pool.address,
        dex: position.dex.id,
      },
      positionId: position.tokenId,
      initDepositTokens,
      initAmounts,
      compoundType: 'COMPOUND_TYPE_REWARD',
    })
  }, [handleOpenCompounding, position])

  useEffect(() => {
    if (txHash && allTransactions && allTransactions[txHash]) {
      const tx = allTransactions[txHash]
      if (tx?.[0].receipt && tx?.[0].receipt.status === 1) {
        setClaiming(false)
        setTxHash(null)
        setOpenClaimModal(false)
        setOpenClaimAllModal(false)
        refetchRewardInfo()
      }
    }
  }, [allTransactions, refetchRewardInfo, txHash])

  useEffect(() => {
    if (!rewardInfo?.chains.length) setOpenClaimAllModal(false)
  }, [rewardInfo?.chains.length])

  const claimModal =
    openClaimModal && claimInfo ? (
      <>
        <ClaimModal
          claimType={ClaimType.REWARDS}
          claiming={claiming}
          claimInfo={claimInfo}
          compoundable
          onClaim={handleClaim}
          onCompound={onCompound}
          onClose={onCloseClaim}
        />
        {compoundingWidget}
      </>
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
