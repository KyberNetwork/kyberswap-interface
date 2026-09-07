import { ShareModal, ShareModalProps, ShareOption, ShareType } from '@kyber/ui'
import { MAX_TICK, MIN_TICK, priceToClosestTick } from '@kyber/utils/dist/uniswapv3'
import { t } from '@lingui/macro'
import { readContract } from '@wagmi/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Share2 } from 'react-feather'
import { useNavigate, useParams } from 'react-router-dom'
import { useUserPositionsQuery } from 'services/earn'
import { useGetSmartExitOrdersQuery } from 'services/smartExit'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { ReactComponent as RocketIcon } from 'assets/svg/rocket.svg'
import { ListingPageNavigateButton, ListingPageWrapper } from 'components/Listing/Page'
import { wagmiConfig } from 'components/Web3Provider'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import PositionDetailHeader from 'pages/Earns/PositionDetail/Header'
import LeftSection from 'pages/Earns/PositionDetail/LeftSection'
import { PositionDetailProvider } from 'pages/Earns/PositionDetail/PositionDetailContext'
import RightSection from 'pages/Earns/PositionDetail/RightSection'
import {
  MigrationLiquidityRecommend,
  PositionDetailWrapper,
  ShareButtonWrapper,
} from 'pages/Earns/PositionDetail/styles'
import MigrationModal from 'pages/Earns/UserPositions/MigrationModal'
import { EmptyPositionText } from 'pages/Earns/UserPositions/styles'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import useClosedPositions, { CheckClosedPositionParams } from 'pages/Earns/hooks/useClosedPositions'
import useFarmingStablePools from 'pages/Earns/hooks/useFarmingStablePools'
import useForceLoading from 'pages/Earns/hooks/useForceLoading'
import useIsWalletRestoring from 'pages/Earns/hooks/useIsWalletRestoring'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import useMerklRewards from 'pages/Earns/hooks/useMerklRewards'
import useReduceFetchInterval from 'pages/Earns/hooks/useReduceFetchInterval'
import useUnfinalizedPositions from 'pages/Earns/hooks/useUnfinalizedPositions'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { FeeInfo, OrderStatus, PAIR_CATEGORY, ParsedPosition, PositionStatus, SuggestedPool } from 'pages/Earns/types'
import { getNftManagerContractAddress } from 'pages/Earns/utils'
import { getUnclaimedFeesInfo } from 'pages/Earns/utils/fees'
import { checkEarlyPosition, parsePosition } from 'pages/Earns/utils/position'
import {
  getUnfinalizedPositionKeyFromPosition,
  getUnfinalizedPositionKeyFromRoute,
} from 'pages/Earns/utils/unfinalizedPosition'
import { getPoolDetailUrl } from 'pages/Earns/utils/url'
import { toString } from 'utils/numbers'
import { type Address } from 'utils/viem'

// Long enough to outlast the receipt lookup the placeholder write waits on, short enough that a zap whose
// placeholder never lands still resolves to a real page state instead of spinning.
const FORCE_LOADING_MAX_MS = 30_000

const PositionDetail = () => {
  const firstLoading = useRef(false)
  const navigate = useNavigate()

  const { account } = useActiveWeb3React()
  const isRestoringWallet = useIsWalletRestoring()
  const { forceLoading, removeForceLoading } = useForceLoading()
  const { positionId, chainId, exchange } = useParams()
  const { widget: zapMigrationWidget, handleOpenZapMigration, triggerClose, setTriggerClose } = useZapMigrationWidget()

  const { closedPositionsFromRpc, checkClosedPosition } = useClosedPositions()
  const { reduceFetchInterval, setReduceFetchInterval } = useReduceFetchInterval()

  const {
    data: userPositionsData,
    isLoading,
    isFetching,
    refetch,
  } = useUserPositionsQuery(
    {
      wallet: account || '',
      positionIds: positionId?.toLowerCase(),
      chainIds: chainId || '',
      protocols: exchange || '',
      useOnFly: true,
    },
    { skip: !account, pollingInterval: forceLoading || reduceFetchInterval ? 5_000 : 15_000 },
  )
  const { rewardInfo } = useKemRewards({ refetchAfterCollect: refetch })

  const userPositions = useMemo(() => userPositionsData?.positions || [], [userPositionsData?.positions])
  const rewardInfoThisPosition = useMemo(
    () => rewardInfo?.nfts.find(item => item.nftId === userPositions[0]?.tokenId.toString()),
    [rewardInfo?.nfts, userPositions],
  )

  const { data: smartExitOrders } = useGetSmartExitOrdersQuery(
    {
      userWallet: account || '',
      positionIds: positionId ? [positionId] : [],
      status: OrderStatus.OrderStatusOpen,
      page: 1,
      pageSize: 1,
    },
    {
      skip: !positionId || !account,
    },
  )
  const hasActiveSmartExitOrder = !!smartExitOrders?.orders?.length && smartExitOrders.orders.length > 0

  const currentWalletAddress = useRef(account)
  // Anchors the bound to mount: `removeForceLoading`'s identity changes with the URL.
  const removeForceLoadingRef = useRef(removeForceLoading)
  removeForceLoadingRef.current = removeForceLoading
  const [aprInterval, setAprInterval] = useState<'24h' | '7d'>('24h')
  const [feeInfoFromRpc, setFeeInfoFromRpc] = useState<FeeInfo | undefined>()
  const [shareInfo, setShareInfo] = useState<ShareModalProps | undefined>()
  const [positionToMigrate, setPositionToMigrate] = useState<ParsedPosition | null>(null)
  const [positionOwnerAddress, setPositionOwnerAddress] = useState<string | null>(null)

  const loadingInterval = isFetching

  const parsedPosition: ParsedPosition | undefined = useMemo(() => {
    const positionFromApi = userPositions[0]
    if (!positionFromApi) return undefined

    return parsePosition({
      position: positionFromApi,
      feeInfo: feeInfoFromRpc,
      nftRewardInfo: rewardInfoThisPosition,
      isClosedFromRpc: closedPositionsFromRpc.includes(positionFromApi.tokenId),
    })
  }, [closedPositionsFromRpc, feeInfoFromRpc, rewardInfoThisPosition, userPositions])

  const parsedPositions = useMemo(() => (parsedPosition ? [parsedPosition] : []), [parsedPosition])
  const { placeholderByKey, valueUpdatingKeys } = useUnfinalizedPositions({
    owner: account || undefined,
    positions: parsedPositions,
  })

  // The route carries the pool address for UniV2 pairs and `<nftManager>-<tokenId>` for NFT positions, so
  // the cache can be addressed before the indexer has returned anything.
  const routePositionKey = useMemo(
    () => getUnfinalizedPositionKeyFromRoute({ chainId, dexId: exchange, positionId }),
    [chainId, exchange, positionId],
  )

  // The positions query keeps serving the previously viewed position until a new set of arguments resolves,
  // so a row that does not belong to this route is treated as not yet arrived. A row that cannot be
  // addressed at all is trusted, since the query was already filtered by this route's position id.
  const indexedPosition: ParsedPosition | undefined = useMemo(() => {
    if (!parsedPosition) return undefined
    const key = getUnfinalizedPositionKeyFromPosition(parsedPosition)
    return key && routePositionKey && key !== routePositionKey ? undefined : parsedPosition
  }, [parsedPosition, routePositionKey])

  const position: ParsedPosition | undefined = useMemo(() => {
    if (!routePositionKey) return indexedPosition
    if (!indexedPosition) return placeholderByKey.get(routePositionKey)
    // A zap into an existing position leaves the indexed row usable and only makes its value stale.
    return valueUpdatingKeys.has(routePositionKey) ? { ...indexedPosition, isValueUpdating: true } : indexedPosition
  }, [indexedPosition, placeholderByKey, routePositionKey, valueUpdatingKeys])

  // A request in flight with nothing to show for this route means the position is still on its way, whether
  // that is the first load or a move between two position pages; skeletons beat an empty state either way.
  // A wallet still being restored counts too: the query is skipped until it lands, so nothing is in flight
  // yet and "No position found" would be answering a question that has not been asked.
  const initialLoading = !!(
    forceLoading ||
    isRestoringWallet ||
    (isLoading && !firstLoading.current) ||
    (!position && isFetching)
  )

  const farmingPoolsByChain = useFarmingStablePools({ chainIds: position ? [position.chain.id] : [] })

  const { rewardsByPosition: merklRewardsByPosition } = useMerklRewards({
    positions: position ? [position] : undefined,
  })
  // Merkl bonus (claimed + claimable) so the shared Total Earnings matches the reward card and the
  // shared APR, which already folds in `bonusApr`.
  const merklPositionRewards = position ? merklRewardsByPosition[position.positionId] : undefined
  const merklEarningsUsd = (merklPositionRewards?.claimedUsdValue || 0) + (merklPositionRewards?.totalUsdValue || 0)

  const positionRef = useRef(position)
  positionRef.current = position
  const handleFetchUnclaimedFee = useCallback(async () => {
    if (!positionRef.current) return
    const feeFromRpc = await getUnclaimedFeesInfo(positionRef.current)
    setFeeInfoFromRpc(feeFromRpc)
    setTimeout(() => setFeeInfoFromRpc(undefined), 60_000)
  }, [])

  const handleOpenMigration = useCallback(
    (sourcePosition: ParsedPosition, targetPool: SuggestedPool) => {
      const sourceMinPrice = sourcePosition.priceRange.min
      const sourceMaxPrice = sourcePosition.priceRange.max
      const targetToken0Decimals = targetPool.token0.decimals
      const targetToken1Decimals = targetPool.token1.decimals

      const isTokenOrderSame =
        sourcePosition.token0.address.toLowerCase() === targetPool.token0.address.toLowerCase() &&
        sourcePosition.token1.address.toLowerCase() === targetPool.token1.address.toLowerCase()

      const isMinPrice = sourcePosition.priceRange.isMinPrice
      const isMaxPrice = sourcePosition.priceRange.isMaxPrice

      const tickLower = sourcePosition.pool.isUniv2
        ? undefined
        : isTokenOrderSame
        ? isMinPrice
          ? MIN_TICK
          : priceToClosestTick(toString(sourceMinPrice), targetToken0Decimals, targetToken1Decimals)
        : isMaxPrice
        ? MAX_TICK
        : priceToClosestTick(toString(1 / sourceMaxPrice), targetToken0Decimals, targetToken1Decimals)

      const tickUpper = sourcePosition.pool.isUniv2
        ? undefined
        : isTokenOrderSame
        ? isMaxPrice
          ? MAX_TICK
          : priceToClosestTick(toString(sourceMaxPrice), targetToken0Decimals, targetToken1Decimals)
        : isMinPrice
        ? MIN_TICK
        : priceToClosestTick(toString(1 / sourceMinPrice), targetToken0Decimals, targetToken1Decimals)

      const isOutRange = sourcePosition.status === PositionStatus.OUT_RANGE

      handleOpenZapMigration({
        chainId: sourcePosition.chain.id,
        from: {
          poolType: sourcePosition.dex.id,
          poolAddress: sourcePosition.pool.address,
          positionId: sourcePosition.pool.isUniv2 ? account || '' : sourcePosition.tokenId,
          dexId: sourcePosition.dex.id,
        },
        to: {
          poolType: targetPool.exchange,
          poolAddress: targetPool.address,
          dexId: targetPool.exchange,
        },
        initialTick:
          tickLower !== undefined && tickUpper !== undefined && !isOutRange ? { tickLower, tickUpper } : undefined,
      })
    },
    [handleOpenZapMigration, account],
  )

  const handleMigrateToKem = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      if (!position) return

      if (!!position.suggestionPool) {
        handleOpenMigration(position, position.suggestionPool)
      } else if (
        position.pool.category === PAIR_CATEGORY.STABLE &&
        farmingPoolsByChain[position.chain.id]?.pools.length > 0
      )
        setPositionToMigrate(position)
    },
    [position, farmingPoolsByChain, handleOpenMigration],
  )

  const handleReposition = useCallback(
    (e: React.MouseEvent, position: ParsedPosition) => {
      e.stopPropagation()
      e.preventDefault()
      handleOpenZapMigration({
        chainId: position.chain.id,
        from: {
          poolType: position.dex.id,
          poolAddress: position.pool.address,
          positionId: position.pool.isUniv2 ? account || '' : position.tokenId,
          dexId: position.dex.id,
        },
        rePositionMode: true,
      })
    },
    [handleOpenZapMigration, account],
  )

  useEffect(() => {
    if (!firstLoading.current && !isLoading) firstLoading.current = true
  }, [isLoading])

  // Sends the visitor back to the list once this page no longer belongs to the wallet in hand.
  //
  // Opening a position in a new tab lands here before the wallet has been restored, so `account` is
  // briefly undefined through no fault of the visitor: waiting for the restore is what keeps that cold
  // load on the page instead of bouncing it straight back to the list. The wallet that arrives is then
  // the one this page belongs to — `currentWalletAddress` is seeded at mount, which a cold load reaches
  // before there is anything to seed it with.
  useEffect(() => {
    if (isRestoringWallet) return
    if (account && !currentWalletAddress.current) {
      currentWalletAddress.current = account
      return
    }
    if (!account || account !== currentWalletAddress.current) navigate(APP_PATHS.EARN_POSITIONS)
  }, [account, isRestoringWallet, navigate])

  // `?forceLoading=true` is the hand-off from the zap flow: caching the placeholder needs the mined receipt,
  // so the page holds its skeletons rather than flashing "No position found" in between. `position` is
  // route-scoped, so anything rendering means the hand-off is done; the timer bounds the wait.
  useEffect(() => {
    if (!forceLoading) return
    if (position) {
      removeForceLoadingRef.current()
      return
    }
    const timeout = setTimeout(() => removeForceLoadingRef.current(), FORCE_LOADING_MAX_MS)
    return () => clearTimeout(timeout)
  }, [forceLoading, position])

  const onRefreshPosition = useCallback(
    ({ tokenId, dex, poolAddress, chainId }: CheckClosedPositionParams) => {
      refetch()
      checkClosedPosition({ tokenId, dex, poolAddress, chainId })
    },
    [checkClosedPosition, refetch],
  )

  const positionDexId = position?.dex.id
  const positionChainId = position?.chain.id
  const positionTokenId = position?.tokenId
  useEffect(() => {
    if (!positionDexId || !positionChainId || !positionTokenId) return
    const fetchOwner = async () => {
      try {
        const nftManagerAddress = getNftManagerContractAddress(positionDexId, positionChainId)
        const nftManagerAbi = EARN_DEXES[positionDexId].nftManagerContractAbi
        if (nftManagerAddress && nftManagerAbi) {
          const owner = (await readContract(wagmiConfig, {
            address: nftManagerAddress as Address,
            abi: nftManagerAbi,
            functionName: 'ownerOf',
            args: [BigInt(positionTokenId)],
            chainId: positionChainId,
          })) as Address
          setPositionOwnerAddress(owner)
        }
      } catch (error) {
        console.error('Failed to fetch position owner', error)
        setPositionOwnerAddress(null)
      }
    }
    fetchOwner()
  }, [positionDexId, positionChainId, positionTokenId])

  const isNotAccountOwner = !!positionOwnerAddress && !!account && positionOwnerAddress !== account
  const isUnfinalized = position?.isUnfinalized
  const isUniv2 = EARN_DEXES[exchange as Exchange]?.isForkFrom === CoreProtocol.UniswapV2
  const isStablePair = position?.pool.category === PAIR_CATEGORY.STABLE
  const isEarlyPosition = !!position && checkEarlyPosition(position)
  const isWaitingForRewards = position?.pool.isFarming && position.rewards.totalUsdValue === 0 && isEarlyPosition

  const emptyPosition = useMemo(
    () => (
      <EmptyPositionText>
        <IconEarnNotFound />
        <span>{t`No position found!`}</span>
        <div className="mt-3 flex gap-2">
          <ListingPageNavigateButton
            icon={<RocketIcon width={20} height={20} />}
            text={t`Explorer Pools`}
            to={APP_PATHS.EARN_POOLS}
          />
          <ListingPageNavigateButton
            icon={<IconUserEarnPosition />}
            text={t`My Positions`}
            to={APP_PATHS.EARN_POSITIONS}
          />
        </div>
      </EmptyPositionText>
    ),
    [],
  )

  const shareBtn = useCallback(
    (size?: number, defaultOptions?: ShareOption[]) => (
      <ShareButtonWrapper
        onClick={() => {
          if (!position) return
          setShareInfo({
            isFarming: position.pool.isFarming,
            defaultOptions,
            type: ShareType.POSITION_INFO,
            url: `${window.location.origin}${getPoolDetailUrl(
              position.chain.id,
              position.dex.id,
              position.pool.address,
            )}`,
            onClose: () => setShareInfo(undefined),
            pool: {
              feeTier: position.pool.fee,
              address: position.pool.address,
              chainId: position.chain.id,
              chainLogo: position.chain.logo,
              dexLogo: position.dex.logo,
              dexName: position.dex.name,
              exchange: position.dex.id,
              token0: { symbol: position.token0.symbol, logo: position.token0.logo },
              token1: { symbol: position.token1.symbol, logo: position.token1.logo },
            },
            position: {
              apr: {
                total: position.apr[aprInterval] + position.bonusApr,
                eg: position.kemEGApr[aprInterval],
                reward: position.kemLMApr[aprInterval] + position.bonusApr,
              },
              createdTime: position.createdTime,
              totalEarnings: position.rewards.totalUsdValue + position.earning.earned + merklEarningsUsd,
            },
          })
        }}
      >
        <Share2 size={size || 16} className="text-primary" />
      </ShareButtonWrapper>
    ),
    [position, aprInterval, merklEarningsUsd],
  )

  const shareModal = shareInfo ? <ShareModal {...shareInfo} /> : null
  const migrationModal =
    positionToMigrate && farmingPoolsByChain[positionToMigrate.chain.id]?.pools.length > 0 ? (
      <MigrationModal
        positionToMigrate={positionToMigrate}
        farmingPools={farmingPoolsByChain[positionToMigrate.chain.id].pools}
        onOpenMigration={handleOpenMigration}
        onClose={() => setPositionToMigrate(null)}
      />
    ) : null
  const suggestedProtocolName = position?.suggestionPool ? EARN_DEXES[position.suggestionPool.exchange].name : ''

  const contextValue = useMemo(
    () => ({
      position,
      initialLoading,
      isNotAccountOwner,
      positionOwnerAddress,
      hasActiveSmartExitOrder,
      aprInterval,
      setAprInterval,
      isUnfinalized,
      isWaitingForRewards,
      loadingInterval,
      onOpenZapMigration: handleOpenZapMigration,
      onRefreshPosition,
      onReposition: handleReposition,
      handleFetchUnclaimedFee,
      refetchPositions: refetch,
      triggerClose,
      setTriggerClose,
      setReduceFetchInterval,
      shareBtn,
    }),
    [
      position,
      initialLoading,
      isNotAccountOwner,
      positionOwnerAddress,
      hasActiveSmartExitOrder,
      aprInterval,
      isUnfinalized,
      isWaitingForRewards,
      loadingInterval,
      handleOpenZapMigration,
      onRefreshPosition,
      handleReposition,
      handleFetchUnclaimedFee,
      refetch,
      triggerClose,
      setTriggerClose,
      setReduceFetchInterval,
      shareBtn,
    ],
  )

  return (
    <>
      {zapMigrationWidget}
      {shareModal}
      {migrationModal}

      <PositionDetailProvider value={contextValue}>
        <ListingPageWrapper>
          {!!position || initialLoading ? (
            <>
              <PositionDetailHeader />

              <div className="flex flex-col gap-3">
                {!position?.pool.isFarming &&
                  (!!position?.suggestionPool ||
                    (isStablePair && farmingPoolsByChain[position.chain.id]?.pools.length > 0)) &&
                  position.status !== PositionStatus.CLOSED && (
                    <MigrationLiquidityRecommend>
                      <p className="leading-[18px] text-white2">
                        {!!position.suggestionPool
                          ? position.pool.fee === position.suggestionPool.feeTier
                            ? t`Earn extra rewards with exact same pair and fee tier on ${suggestedProtocolName} hook.`
                            : t`We found a pool with the same pair offering extra rewards. Migrate to this pool on ${suggestedProtocolName} to start earning farming rewards.`
                          : t`We found other stable pools offering extra rewards. Explore and migrate to start earning.`}
                      </p>
                      <p className="cursor-pointer text-primary" onClick={handleMigrateToKem}>
                        {!!position.suggestionPool ? t`Migrate` : t`View Pools`} →
                      </p>
                    </MigrationLiquidityRecommend>
                  )}

                {isNotAccountOwner && (
                  <MigrationLiquidityRecommend>
                    <p className="leading-[18px] text-white2">
                      {t`This position is currently being used in another protocol. Fee claim and liquidity actions are unavailable.`}
                    </p>
                  </MigrationLiquidityRecommend>
                )}
              </div>

              <PositionDetailWrapper>
                {!isUniv2 && <LeftSection />}
                <RightSection />
              </PositionDetailWrapper>
            </>
          ) : (
            emptyPosition
          )}
        </ListingPageWrapper>
      </PositionDetailProvider>
    </>
  )
}

export default PositionDetail
