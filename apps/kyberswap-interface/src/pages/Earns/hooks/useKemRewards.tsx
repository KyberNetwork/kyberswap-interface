import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBatchClaimEncodeDataMutation, useClaimEncodeDataMutation, useRewardInfoQuery } from 'services/reward'
import { MerklRewardsResponse, useReloadMerklChainMutation } from 'services/rewardMerkl'
import { useUserPositionsQuery } from 'services/zapEarn'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { fetchListTokenByAddresses } from 'hooks/Tokens'
import useChainsConfig from 'hooks/useChainsConfig'
import useFilter from 'pages/Earns/UserPositions/useFilter'
import ClaimAllModal, { RewardTabType } from 'pages/Earns/components/ClaimAllModal'
import ClaimModal, { ClaimInfo, ClaimType } from 'pages/Earns/components/ClaimModal'
import { PositionStatus } from 'pages/Earns/components/PositionStatusControl'
import { EARN_CHAINS, EarnChain, Exchange } from 'pages/Earns/constants'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import useClaimMerklRewards from 'pages/Earns/hooks/useClaimMerklRewards'
import useCompounding from 'pages/Earns/hooks/useCompounding'
import useMerklRewards from 'pages/Earns/hooks/useMerklRewards'
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

// Compute the total claimable USD value for a chain from a raw Merkl API response.
// Used to detect when Merkl's indexer has caught up with a freshly claimed tx.
const computeChainClaimableUsd = (chainData: MerklRewardsResponse | undefined): number => {
  if (!chainData?.rewards?.length) return 0
  return chainData.rewards.reduce((sum, r) => {
    try {
      const claimableRaw = BigInt(r.amount) - BigInt(r.claimed)
      if (claimableRaw <= 0n) return sum
      const decimalsPow = 10 ** r.token.decimals
      return sum + (Number(claimableRaw) / decimalsPow) * r.token.price
    } catch {
      return sum
    }
  }, 0)
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

  // Merkl integration
  const {
    chainRewards: merklChainRewards,
    totalUsdValue: merklTotalUsdValue,
    refetch: refetchMerklRewards,
    rawData: merklRawData,
  } = useMerklRewards()
  const { claimMerklRewards } = useClaimMerklRewards()
  const [reloadMerklChain] = useReloadMerklChainMutation()
  const [rewardTab, setRewardTab] = useState<RewardTabType>('ks')
  const merklRetryInFlightRef = useRef<Set<number>>(new Set())
  // Keep `account` reachable from in-flight async retry loops so wallet disconnect aborts cleanly
  // (closure capture would hold the original account string indefinitely otherwise).
  const accountRef = useRef(account)
  useEffect(() => {
    accountRef.current = account
  }, [account])

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
    if (!EARN_CHAINS[chainId as unknown as EarnChain]?.farmingSupported) {
      notify({
        title: t`Error`,
        type: NotificationType.ERROR,
        summary: t`Farming is not supported on this chain`,
      })
      return
    }
    if (!account || !claimInfo || !claimInfo.dex) return

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
    if (!rewardInfo && !merklChainRewards.length) {
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

  // After a Merkl claim tx confirms, Merkl's indexer needs ~10–30s to pick up the on-chain claim.
  // This helper waits, then repeatedly hits the reload endpoint until claimable drops below the
  // baseline (indexer caught up) or we exhaust the retry budget.
  const reloadMerklUntilUpdated = useCallback(
    async (chainId: number, baselineClaimableUsd: number) => {
      if (!accountRef.current) return
      // If a retry loop is already running for this chain, fall back to a single refetch so the
      // second claim's data still gets a chance to sync via the next poll/refetch cycle.
      if (merklRetryInFlightRef.current.has(chainId)) {
        refetchMerklRewards()
        return
      }
      merklRetryInFlightRef.current.add(chainId)

      const INITIAL_DELAY = 10_000
      const RETRY_INTERVAL = 8_000
      const MAX_ATTEMPTS = 5

      try {
        await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY))

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          const currentAccount = accountRef.current
          if (!currentAccount) return

          const res = await reloadMerklChain({ address: currentAccount, chainId })
          // `'data' in res` only when the reload succeeded (queryFn returns {error} on failure).
          // Treating an errored response as "indexer caught up" would exit the loop prematurely.
          if ('data' in res) {
            const chainData = res.data?.find(c => c.chain.id === chainId)
            // Require chainData to have actual reward entries before deciding the indexer
            // caught up. Merkl can transiently return an empty array OR a chain entry with
            // `rewards: []` while its cache is rebuilding after `reloadChainId` — both would
            // read as claimable=0 and trigger a false-positive early exit, stopping the retry
            // loop after a single attempt and leaving the UI to wait for the next poll cycle.
            if (chainData?.rewards?.length) {
              const currentClaimableUsd = computeChainClaimableUsd(chainData)
              if (currentClaimableUsd < baselineClaimableUsd) {
                // Indexer has caught up — sync the main query and stop
                refetchMerklRewards()
                return
              }
            }
          }

          if (attempt < MAX_ATTEMPTS - 1) {
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL))
          }
        }

        // Retry budget exhausted — refetch anyway so the next polling cycle starts from latest data
        refetchMerklRewards()
      } finally {
        merklRetryInFlightRef.current.delete(chainId)
      }
    },
    [reloadMerklChain, refetchMerklRewards],
  )

  useEffect(() => {
    if (!pendingClaims.length || !allTransactions) return
    const resolvedTxHashes: string[] = []
    let shouldCloseClaim = false
    let shouldCloseClaimAll = false
    const merklChainIdsToReload = new Set<number>()

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
        if (claim.claimKey.startsWith('merkl:')) {
          const chainId = Number(claim.claimKey.split(':')[1])
          if (chainId > 0 && !Number.isNaN(chainId)) merklChainIdsToReload.add(chainId)
        } else {
          refetchRewardInfo()
        }
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
    if (merklChainIdsToReload.size) {
      if (account) {
        // Snapshot baseline claimable per chain (pre-reload) so the retry loop can detect when
        // Merkl's indexer has caught up with the on-chain claim.
        merklChainIdsToReload.forEach(chainId => {
          const baseline = merklChainRewards.find(c => c.chainId === chainId)?.claimableUsdValue ?? 0
          reloadMerklUntilUpdated(chainId, baseline)
        })
      } else {
        refetchMerklRewards()
      }
    }
    // merklChainRewards intentionally omitted: it changes on every poll, but we only read it
    // synchronously here to snapshot baseline at the moment a tx confirms.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    account,
    allTransactions,
    claimInfo,
    onCloseClaim,
    pendingClaims,
    refetchRewardInfo,
    refetchMerklRewards,
    reloadMerklUntilUpdated,
  ])

  useEffect(() => {
    if (!rewardInfo?.chains.length && !merklChainRewards.length) setOpenClaimAllModal(false)
  }, [rewardInfo?.chains.length, merklChainRewards.length])

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

  const handleClaimMerkl = useCallback(
    async (targetChainId: number) => {
      const chainRewards = merklRawData?.find(item => item.chain.id === targetChainId)
      const txHash = await claimMerklRewards(targetChainId, chainRewards)
      if (txHash) {
        setPendingClaims(prev => {
          const claimKey = `merkl:${targetChainId}`
          if (prev.some(item => item.txHash === txHash)) return prev
          return [...prev, { txHash, claimKey }]
        })
      }
      return txHash
    },
    [claimMerklRewards, merklRawData],
  )

  const claimAllRewardsModal =
    openClaimAllModal && ((rewardInfo && filteredRewardInfo) || merklChainRewards.length > 0) ? (
      <ClaimAllModal
        rewardInfo={rewardInfo ?? undefined}
        filteredRewardInfo={filteredRewardInfo ?? undefined}
        onClaimAll={handleClaimAll}
        onClose={() => {
          setOpenClaimAllModal(false)
          setRewardTab('ks')
        }}
        isLoadingUserPositions={isLoadingUserPositions}
        thresholdValue={thresholdValue ?? undefined}
        onThresholdChange={setThresholdValue}
        positionStatus={positionStatus}
        onPositionStatusChange={setPositionStatus}
        merklChainRewards={merklChainRewards}
        merklTotalUsdValue={merklTotalUsdValue}
        onClaimMerkl={handleClaimMerkl}
        activeTab={rewardTab}
        onTabChange={setRewardTab}
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
