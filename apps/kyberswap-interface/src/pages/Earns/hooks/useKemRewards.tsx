import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBatchClaimEncodeDataMutation, useClaimEncodeDataMutation, useRewardInfoQuery } from 'services/reward'
import { useUserPositionsQuery } from 'services/zapEarn'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { fetchListTokenByAddresses } from 'hooks/Tokens'
import useChainsConfig from 'hooks/useChainsConfig'
import useFilter from 'pages/Earns/UserPositions/useFilter'
import ClaimAllModal from 'pages/Earns/components/ClaimAllModal'
import ClaimModal, { ClaimInfo, ClaimType } from 'pages/Earns/components/ClaimModal'
import { PositionStatus } from 'pages/Earns/components/PositionStatusControl'
import { EARN_CHAINS, EarnChain, Exchange } from 'pages/Earns/constants'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import useCompounding from 'pages/Earns/hooks/useCompounding'
import { ParsedPosition, RewardInfo, TokenInfo } from 'pages/Earns/types'
import { getNftManagerContractAddress, submitTransaction } from 'pages/Earns/utils'
import { parseReward } from 'pages/Earns/utils/reward'
import { useNotify } from 'state/application/hooks'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { enumToArrayOfValues } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

type UseKemRewardsProps = {
  refetchAfterCollect?: () => void
}

const useKemRewards = (props?: UseKemRewardsProps) => {
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const allTransactions = useAllTransactions(true)

  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { supportedChains } = useChainsConfig()
  const { filters } = useFilter()
  const { refetchAfterCollect } = props ?? {}

  const [thresholdValue, setThresholdValue] = useState<number | null>(null)
  const [positionStatus, setPositionStatus] = useState<PositionStatus | 'all'>()

  const {
    data,
    refetch: refetchRewardInfo,
    isLoading: isLoadingRewardInfo,
  } = useRewardInfoQuery({ owner: account || '' }, { skip: !account, pollingInterval: 15_000 })

  const { data: userPositionsData, isLoading: isLoadingUserPositions } = useUserPositionsQuery(
    {
      wallet: account || '',
      chainIds: enumToArrayOfValues(EarnChain, 'number').join(','),
      protocols: enumToArrayOfValues(Exchange).join(','),
    },
    {
      skip: !account || thresholdValue === null,
    },
  )

  const [claimEncodeData] = useClaimEncodeDataMutation()
  const [batchClaimEncodeData] = useBatchClaimEncodeDataMutation()

  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null)
  const [openClaimModal, setOpenClaimModal] = useState(false)
  const [openClaimAllModal, setOpenClaimAllModal] = useState(false)
  const [pendingClaims, setPendingClaims] = useState<Array<{ txHash: string; claimKey: string }>>([])

  const [position, setPosition] = useState<ParsedPosition | null>(null)
  const [rewardInfo, setRewardInfo] = useState<RewardInfo | null>(null)
  const [filteredRewardInfo, setFilteredRewardInfo] = useState<RewardInfo | null>(null)

  const filteredTokenIds = useMemo(() => {
    if (!userPositionsData?.positions?.length || positionStatus === 'all') return undefined
    return new Set(
      userPositionsData.positions
        .filter(position => position.status === positionStatus)
        .map(position => position.tokenId.toString()),
    )
  }, [positionStatus, userPositionsData])

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

  const parsedRewardInfo = useMemo(() => {
    const chainIds = filters.chainIds?.split(',').filter(Boolean).map(Number)
    return parseReward({
      data,
      tokens,
      supportedChains: supportedChains.filter(chain => !chainIds?.length || chainIds.includes(chain.chainId)),
    })
  }, [data, tokens, supportedChains, filters.chainIds])

  const parsedFilteredRewardInfo = useMemo(() => {
    const chainIds = filters.chainIds?.split(',').filter(Boolean).map(Number)
    const rewardInfo = parseReward({
      data,
      tokens,
      supportedChains: supportedChains.filter(chain => !chainIds?.length || chainIds.includes(chain.chainId)),
      thresholdValue,
      tokenIds: filteredTokenIds,
    })
    return rewardInfo
  }, [data, tokens, supportedChains, filters.chainIds, thresholdValue, filteredTokenIds])

  const isRewardInfoParsing = Object.keys(data || {}).length > 0 && !rewardInfo

  useEffect(() => {
    if (parsedRewardInfo) {
      setRewardInfo(parsedRewardInfo)
    }
  }, [parsedRewardInfo])

  useEffect(() => {
    if (parsedFilteredRewardInfo) {
      setFilteredRewardInfo(parsedFilteredRewardInfo)
    }
  }, [parsedFilteredRewardInfo])

  useEffect(() => {
    setRewardInfo(null)
    setFilteredRewardInfo(null)
  }, [account])

  const handleClaim = useCallback(async () => {
    if (!account || !claimInfo || !claimInfo.dex || !EARN_CHAINS[chainId as unknown as EarnChain]?.farmingSupported)
      return

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
        setOpenClaimModal(false)
      },
    })
    const { txHash, error } = res
    if (!txHash || error) throw new Error(error?.message || 'Transaction failed')

    setPendingClaims(prev => {
      const claimKey = `${claimInfo.chainId}:${claimInfo.nftId}`
      if (prev.some(item => item.txHash === txHash)) return prev
      return [...prev, { txHash, claimKey }]
    })

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
    if (!account || !chainId || !EARN_CHAINS[chainId as unknown as EarnChain]?.farmingSupported) return

    const encodeData = await batchClaimEncodeData({
      owner: account,
      recipient: account,
      chainId,
      tokenIds: filteredRewardInfo?.nfts.filter(nft => nft.chainId === chainId).map(nft => nft.nftId),
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
      },
    })
    const { txHash, error } = res
    if (!txHash || error) throw new Error(error?.message || 'Transaction failed')

    setPendingClaims(prev => {
      const claimKey = `all:${chainId}`
      if (prev.some(item => item.txHash === txHash)) return prev
      return [...prev, { txHash, claimKey }]
    })

    addTransactionWithType({
      type: TRANSACTION_TYPE.CLAIM_REWARD,
      hash: txHash,
      extraInfo: {
        summary: `rewards: ${filteredRewardInfo?.chains
          ?.find(chain => chain.chainId === chainId)
          ?.tokens?.filter(token => token.claimableAmount > 0)
          .map(token => `${formatDisplayNumber(token.claimableAmount, { significantDigits: 4 })} ${token.symbol}`)
          .join(', ')}`,
      },
    })
  }, [account, addTransactionWithType, batchClaimEncodeData, chainId, filteredRewardInfo, library, notify])

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
      dex: position.dex.id,
    })
    setPosition(position)
  }

  const onOpenClaimAllRewards = () => {
    if (!rewardInfo) {
      console.log('reward is not ready!')
      return
    }
    setOpenClaimAllModal(true)
    setThresholdValue(0)
    setPositionStatus('all')
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
        'waitingAmounts',
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
    if (!pendingClaims.length || !allTransactions) return
    const resolvedTxHashes: string[] = []
    let shouldCloseClaim = false
    let shouldCloseClaimAll = false

    pendingClaims.forEach(claim => {
      const tx = allTransactions[claim.txHash]
      const receipt = tx?.[0].receipt
      if (!receipt) return
      resolvedTxHashes.push(claim.txHash)
      if (receipt.status === 1) {
        if (claimInfo && `${claimInfo.chainId}:${claimInfo.nftId}` === claim.claimKey) {
          shouldCloseClaim = true
        }
        if (claim.claimKey.startsWith('all:')) {
          shouldCloseClaimAll = true
        }
        refetchRewardInfo()
      }
    })

    if (resolvedTxHashes.length) {
      setPendingClaims(prev => prev.filter(item => !resolvedTxHashes.includes(item.txHash)))
    }
    if (shouldCloseClaim) {
      onCloseClaim()
    }
    if (shouldCloseClaimAll) {
      setOpenClaimAllModal(false)
    }
  }, [allTransactions, claimInfo, onCloseClaim, pendingClaims, refetchRewardInfo])

  useEffect(() => {
    if (!rewardInfo?.chains.length) setOpenClaimAllModal(false)
  }, [rewardInfo?.chains.length])

  useAccountChanged(() => {
    onCloseClaim()
    setOpenClaimAllModal(false)
  })

  const pendingClaimKeys = pendingClaims.map(item => item.claimKey)

  const claimModal =
    openClaimModal && claimInfo ? (
      <>
        <ClaimModal
          claimType={ClaimType.REWARDS}
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
    openClaimAllModal && rewardInfo && filteredRewardInfo ? (
      <ClaimAllModal
        rewardInfo={rewardInfo}
        filteredRewardInfo={filteredRewardInfo}
        onClaimAll={handleClaimAll}
        onClose={() => setOpenClaimAllModal(false)}
        isLoadingUserPositions={isLoadingUserPositions}
        thresholdValue={thresholdValue ?? undefined}
        onThresholdChange={setThresholdValue}
        positionStatus={positionStatus}
        onPositionStatusChange={setPositionStatus}
      />
    ) : null

  return {
    rewardInfo,
    claimModal,
    onOpenClaim,
    claimAllRewardsModal,
    onOpenClaimAllRewards,
    isLoadingRewardInfo: isLoadingRewardInfo || isRewardInfoParsing,
    pendingClaimKeys,
  }
}

export default useKemRewards
