import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useUserPositionsQuery } from 'services/earn'
import { useBatchClaimEncodeDataMutation, useClaimEncodeDataMutation, useRewardInfoQuery } from 'services/reward'
import { MerklRewardsResponse, markChainAsReloaded } from 'services/rewardMerkl'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import { fetchListTokenByAddresses } from 'hooks/useTokens'
import useFilter from 'pages/Earns/UserPositions/useFilter'
import ClaimAllModal, { RewardTabType } from 'pages/Earns/components/ClaimAllModal'
import { ClaimInfo } from 'pages/Earns/components/ClaimModal'
import PositionClaimModal from 'pages/Earns/components/PositionClaimModal'
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
import { enumToArrayOfValues } from 'utils/common'
import { friendlyError } from 'utils/errorMessage'
import { formatDisplayNumber } from 'utils/numbers'

type UseKemRewardsProps = {
  refetchAfterCollect?: () => void
}

// True when a chain's Merkl response no longer has any token whose `amount > claimed`.
// Used to detect when Merkl's indexer has caught up with a freshly claimed tx.
const isChainFullyClaimed = (chainData: MerklRewardsResponse | undefined): boolean => {
  if (!chainData?.rewards?.length) return false
  return chainData.rewards.every(r => {
    try {
      return BigInt(r.amount) - BigInt(r.claimed) <= 0n
    } catch {
      return true
    }
  })
}

const useKemRewards = (props?: UseKemRewardsProps) => {
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const allTransactions = useAllTransactions(true)

  const { account, chainId } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
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
  const [rewardTab, setRewardTab] = useState<RewardTabType>('ks')
  const merklRetryInFlightRef = useRef<Set<number>>(new Set())
  // Mirror of `merklRetryInFlightRef` exposed to the UI so callers can disable the claim
  // button for chains whose post-claim sync hasn't finished yet.
  const [merklSyncingChainIds, setMerklSyncingChainIds] = useState<number[]>([])
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

    if (encodeData.error) {
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
      account,
      chainId,
      isSmartConnector,
      txData: {
        to: contractAddress,
        data: `0x${calldata}`,
      },
      onError: (error: Error) => {
        notify({
          title: t`Error`,
          type: NotificationType.ERROR,
          summary: friendlyError(error),
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
  }, [account, addTransactionWithType, chainId, claimEncodeData, claimInfo, isSmartConnector, notify])

  const handleClaimAll = useCallback(async () => {
    if (!account || !chainId || !EARN_CHAINS[chainId as unknown as EarnChain]?.farmingSupported) return

    const encodeData = await batchClaimEncodeData({
      owner: account,
      recipient: account,
      chainId,
      tokenIds: filteredRewardInfo?.nfts.filter(nft => nft.chainId === chainId).map(nft => nft.nftId),
    })

    if (encodeData.error) {
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
      account,
      chainId,
      isSmartConnector,
      txData: {
        to: contractAddress,
        data: `0x${calldata}`,
      },
      onError: (error: Error) => {
        notify({
          title: t`Error`,
          type: NotificationType.ERROR,
          summary: friendlyError(error),
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
  }, [account, addTransactionWithType, batchClaimEncodeData, chainId, filteredRewardInfo, isSmartConnector, notify])

  const onOpenClaim = (position?: ParsedPosition) => {
    if (!position) return
    const nftId = position.tokenId
    const positionChainId = position.chain.id

    setPosition(position)
    setOpenClaimModal(true)

    // A position may carry only a Merkl bonus and no KEM farming reward — still open the modal
    // (its Bonus tab handles the Merkl claim) and just leave the KEM claim info empty.
    const rewardNftInfo = rewardInfo?.nfts.find(nft => nft.nftId === nftId)
    if (!rewardNftInfo) {
      setClaimInfo(null)
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
  // This helper waits, then repeatedly marks the chain (so the batched URL carries
  // `reloadChainId=X` and Merkl rebuilds its server-side cache for the claimed chain) and
  // refetches the batched `merklRewards` query. RTK writes the fresh response into the cache
  // atomically, propagating to every subscriber. The loop exits when every token on the chain
  // reports `amount === claimed` or we exhaust the retry budget.
  const reloadMerklUntilUpdated = useCallback(
    async (chainId: number) => {
      const initialAccount = accountRef.current
      if (!initialAccount) return
      // A retry loop is already running for this chain — return without scheduling a second
      // one. The in-flight loop will eventually finish (catch-up or budget exhaust) and update
      // the cache; another loop here would just double the request count to Merkl.
      if (merklRetryInFlightRef.current.has(chainId)) return
      merklRetryInFlightRef.current.add(chainId)
      setMerklSyncingChainIds(prev => (prev.includes(chainId) ? prev : [...prev, chainId]))

      // Wait 20s before the first reload — Merkl's indexer needs time after the on-chain claim
      // before the new `claimed` amount shows up. Calling sooner just wastes a request.
      // Then up to 3 retries every 10s (total budget ~50s) until the indexer catches up.
      const INITIAL_DELAY = 20_000
      const RETRY_INTERVAL = 10_000
      const MAX_ATTEMPTS = 4

      try {
        await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY))
        // Account-change abort right after the 20s wait so a wallet swap during the delay
        // doesn't trigger a fetch with the old account's address.
        if (accountRef.current !== initialAccount) return

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          // Abort if the user disconnected OR switched to a different account mid-loop —
          // continuing would fetch the old account's data into the new account's cache and
          // leave a stale syncing indicator on the new account's UI.
          if (accountRef.current !== initialAccount) return

          // Mark the chain so the batched refetch's URL carries `reloadChainId=X`, forcing
          // Merkl to rebuild its server-side cache before responding. Without the mark Merkl
          // would serve the batched URL from its edge cache and we'd get pre-claim numbers.
          markChainAsReloaded(chainId)
          const result = await refetchMerklRewards()
          const chainData = result.data?.find(c => c.chain.id === chainId)

          // Exit only when Merkl reports zero remaining claimable on this chain. The
          // `rewards.length > 0` guard inside `isChainFullyClaimed` prevents a transient empty
          // payload (Merkl returning [] while its cache rebuilds) from being read as "fully
          // claimed" and triggering a false-positive exit.
          if (isChainFullyClaimed(chainData)) return

          if (attempt < MAX_ATTEMPTS - 1) {
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL))
          }
        }

        // Retry budget exhausted — the last refetch already wrote the latest Merkl data into
        // the cache, even if the claim isn't reflected yet.
      } finally {
        merklRetryInFlightRef.current.delete(chainId)
        setMerklSyncingChainIds(prev => prev.filter(id => id !== chainId))
      }
    },
    [refetchMerklRewards],
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
    if (merklChainIdsToReload.size && account) {
      merklChainIdsToReload.forEach(chainId => {
        reloadMerklUntilUpdated(chainId)
      })
    }
  }, [account, allTransactions, claimInfo, onCloseClaim, pendingClaims, refetchRewardInfo, reloadMerklUntilUpdated])

  useEffect(() => {
    if (!rewardInfo?.chains.length && !merklChainRewards.length) setOpenClaimAllModal(false)
  }, [rewardInfo?.chains.length, merklChainRewards.length])

  useAccountChanged(() => {
    onCloseClaim()
    setOpenClaimAllModal(false)
  })

  const pendingClaimKeys = pendingClaims.map(item => item.claimKey)

  // Chains whose Merkl claim tx has been broadcast but not yet confirmed on-chain. Bridges the
  // gap between `handleClaimMerkl` resolving (tx submitted) and `merklSyncingChainIds` being
  // populated (tx confirmed) — without this, the claim button briefly re-enables while the user
  // is waiting for confirmation.
  const merklPendingTxChainIds = useMemo(
    () =>
      pendingClaims
        .filter(item => item.claimKey.startsWith('merkl:'))
        .map(item => Number(item.claimKey.split(':')[1]))
        .filter(id => id > 0 && !Number.isNaN(id)),
    [pendingClaims],
  )

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

  // Merkl bonus for the connected wallet on this position's chain (wallet-wide, not per position),
  // mirroring how the Claim-All modal claims Merkl by chain.
  const merklChainForPosition = position
    ? merklChainRewards.find(chain => chain.chainId === position.chain.id)
    : undefined
  const claimModal =
    openClaimModal && position ? (
      <>
        <PositionClaimModal
          chainId={position.chain.id}
          chainName={position.chain.name}
          chainLogo={position.chain.logo}
          ksTokens={claimInfo?.tokens || []}
          ksTotalValue={claimInfo?.totalValue || 0}
          onClaimKs={handleClaim}
          onCompound={onCompound}
          compoundable
          merklChainReward={merklChainForPosition}
          onClaimMerkl={handleClaimMerkl}
          merklSyncing={merklSyncingChainIds.includes(position.chain.id)}
          merklPendingTx={merklPendingTxChainIds.includes(position.chain.id)}
          onClose={onCloseClaim}
        />
        {compoundingWidget}
      </>
    ) : null

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
        merklSyncingChainIds={merklSyncingChainIds}
        merklPendingTxChainIds={merklPendingTxChainIds}
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
