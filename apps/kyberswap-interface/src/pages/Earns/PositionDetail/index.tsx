import { ShareModal, ShareModalProps, ShareOption, ShareType } from '@kyber/ui'
import { MAX_TICK, MIN_TICK, priceToClosestTick } from '@kyber/utils/dist/uniswapv3'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Share2 } from 'react-feather'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useGetSmartExitOrdersQuery } from 'services/smartExit'
import { useUserPositionsQuery } from 'services/zapEarn'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { ReactComponent as RocketIcon } from 'assets/svg/rocket.svg'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { NavigateButton } from 'pages/Earns/PoolExplorer/styles'
import PositionDetailHeader from 'pages/Earns/PositionDetail/Header'
import LeftSection from 'pages/Earns/PositionDetail/LeftSection'
import RightSection from 'pages/Earns/PositionDetail/RightSection'
import {
  MigrationLiquidityRecommend,
  PositionDetailWrapper,
  ShareButtonWrapper,
} from 'pages/Earns/PositionDetail/styles'
import MigrationModal from 'pages/Earns/UserPositions/MigrationModal'
import { EmptyPositionText, PositionPageWrapper } from 'pages/Earns/UserPositions/styles'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import useClosedPositions, { CheckClosedPositionParams } from 'pages/Earns/hooks/useClosedPositions'
import useFarmingStablePools from 'pages/Earns/hooks/useFarmingStablePools'
import useForceLoading from 'pages/Earns/hooks/useForceLoading'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import useReduceFetchInterval from 'pages/Earns/hooks/useReduceFetchInterval'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { FeeInfo, OrderStatus, PAIR_CATEGORY, ParsedPosition, PositionStatus, SuggestedPool } from 'pages/Earns/types'
import { getNftManagerContract } from 'pages/Earns/utils'
import { getUnclaimedFeesInfo } from 'pages/Earns/utils/fees'
import { checkEarlyPosition, parsePosition } from 'pages/Earns/utils/position'
import { getUnfinalizedPositions } from 'pages/Earns/utils/unfinalizedPosition'
import { toString } from 'utils/numbers'

const PositionDetail = () => {
  const firstLoading = useRef(false)
  const navigate = useNavigate()
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()

  const { account } = useActiveWeb3React()
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
  const rewardInfoThisPosition = rewardInfo?.nfts.find(item => item.nftId === userPositions[0]?.tokenId.toString())

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
  const [aprInterval, setAprInterval] = useState<'24h' | '7d'>('24h')
  const [feeInfoFromRpc, setFeeInfoFromRpc] = useState<FeeInfo | undefined>()
  const [shareInfo, setShareInfo] = useState<ShareModalProps | undefined>()
  const [positionToMigrate, setPositionToMigrate] = useState<ParsedPosition | null>(null)
  const [positionOwnerAddress, setPositionOwnerAddress] = useState<string | null>(null)

  const loadingInterval = isFetching
  const initialLoading = !!(forceLoading || (isLoading && !firstLoading.current))

  const position: ParsedPosition | undefined = useMemo(() => {
    const tokenId = positionId?.split('-')[1]
    if (!userPositions || !userPositions.length) {
      const unfinalizedPositions = getUnfinalizedPositions([], account || undefined)
      if (unfinalizedPositions.length > 0 && Number(tokenId) === Number(unfinalizedPositions[0].tokenId))
        return unfinalizedPositions[0]
      return
    }

    const isClosedFromRpc = closedPositionsFromRpc.includes(userPositions[0].tokenId)

    const parsedPosition = parsePosition({
      position: userPositions[0],
      feeInfo: feeInfoFromRpc,
      nftRewardInfo: rewardInfoThisPosition,
      isClosedFromRpc,
    })

    const unfinalizedPositions = getUnfinalizedPositions([parsedPosition], account || undefined)
    const matchedUnfinalized = unfinalizedPositions.find(p => Number(p.tokenId) === Number(tokenId))

    if (matchedUnfinalized) {
      if (matchedUnfinalized.isValueUpdating) return { ...parsedPosition, isValueUpdating: true }
      return matchedUnfinalized
    }

    return parsedPosition
  }, [account, feeInfoFromRpc, userPositions, rewardInfoThisPosition, closedPositionsFromRpc, positionId])

  const farmingPoolsByChain = useFarmingStablePools({ chainIds: position ? [position.chain.id] : [] })

  const handleFetchUnclaimedFee = useCallback(async () => {
    if (!position) return
    const feeFromRpc = await getUnclaimedFeesInfo(position)
    setFeeInfoFromRpc(feeFromRpc)
    setTimeout(() => setFeeInfoFromRpc(undefined), 60_000)
  }, [position])

  const handleMigrateToKem = (e: React.MouseEvent) => {
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
  }

  const handleOpenMigration = (sourcePosition: ParsedPosition, targetPool: SuggestedPool) => {
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
  }

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

  useEffect(() => {
    if (!account || account !== currentWalletAddress.current) navigate(APP_PATHS.EARN_POSITIONS)
  }, [account, navigate])

  useEffect(() => {
    if (!position || !forceLoading) return
    if (position.pool.isUniv2 ? position.positionId === positionId : position.tokenId === positionId?.split('-')[1]) {
      removeForceLoading()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceLoading, position, searchParams, setSearchParams])

  const onRefreshPosition = useCallback(
    ({ tokenId, dex, poolAddress, chainId }: CheckClosedPositionParams) => {
      refetch()
      checkClosedPosition({ tokenId, dex, poolAddress, chainId })
    },
    [checkClosedPosition, refetch],
  )

  useEffect(() => {
    if (!position) return
    const fetchOwner = async () => {
      try {
        const contract = getNftManagerContract(position.dex.id, position.chain.id)
        if (contract) {
          const owner = await contract.ownerOf(position.tokenId)
          setPositionOwnerAddress(owner)
        }
      } catch (error) {
        console.error('Failed to fetch position owner', error)
        setPositionOwnerAddress(null)
      }
    }
    fetchOwner()
  }, [position])

  const isNotAccountOwner = !!positionOwnerAddress && !!account && positionOwnerAddress !== account
  const isUnfinalized = position?.isUnfinalized
  const isUniv2 = EARN_DEXES[exchange as Exchange]?.isForkFrom === CoreProtocol.UniswapV2
  const isStablePair = position?.pool.category === PAIR_CATEGORY.STABLE
  const isEarlyPosition = !!position && checkEarlyPosition(position)
  const isWaitingForRewards = position?.pool.isFarming && position.rewards.totalUsdValue === 0 && isEarlyPosition

  const emptyPosition = (
    <EmptyPositionText>
      <IconEarnNotFound />
      <Text>{t`No position found!`}</Text>
      <Flex sx={{ gap: 2 }} marginTop={12}>
        <NavigateButton
          icon={<RocketIcon width={20} height={20} />}
          text={t`Explorer Pools`}
          to={APP_PATHS.EARN_POOLS}
        />
        <NavigateButton icon={<IconUserEarnPosition />} text={t`My Positions`} to={APP_PATHS.EARN_POSITIONS} />
      </Flex>
    </EmptyPositionText>
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
                lm: position.kemLMApr[aprInterval],
              },
              createdTime: position.createdTime,
              totalEarnings: position.rewards.totalUsdValue + position.earning.earned,
            },
          })
        }}
      >
        <Share2 size={size || 16} color={theme.primary} />
      </ShareButtonWrapper>
    ),
    [theme.primary, position, aprInterval],
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

  return (
    <>
      {zapMigrationWidget}
      {shareModal}
      {migrationModal}

      <PositionPageWrapper>
        {!!position || initialLoading ? (
          <>
            <PositionDetailHeader
              isLoading={loadingInterval}
              initialLoading={initialLoading}
              position={position}
              hasActiveSmartExitOrder={hasActiveSmartExitOrder}
            />

            <Flex flexDirection="column" sx={{ gap: '12px' }}>
              {!position?.pool.isFarming &&
                (!!position?.suggestionPool ||
                  (isStablePair && farmingPoolsByChain[position.chain.id]?.pools.length > 0)) &&
                position.status !== PositionStatus.CLOSED && (
                  <MigrationLiquidityRecommend>
                    <Text color={'#fafafa'} lineHeight={'18px'}>
                      {!!position.suggestionPool
                        ? position.pool.fee === position.suggestionPool.feeTier
                          ? t`Earn extra rewards with exact same pair and fee tier on ${suggestedProtocolName} hook.`
                          : t`We found a pool with the same pair offering extra rewards. Migrate to this pool on ${suggestedProtocolName} to start earning farming rewards.`
                        : t`We found other stable pools offering extra rewards. Explore and migrate to start earning.`}
                    </Text>
                    <Text color={theme.primary} sx={{ cursor: 'pointer' }} onClick={handleMigrateToKem}>
                      {!!position.suggestionPool ? t`Migrate` : t`View Pools`} →
                    </Text>
                  </MigrationLiquidityRecommend>
                )}

              {isNotAccountOwner && (
                <MigrationLiquidityRecommend>
                  <Text color={'#fafafa'} lineHeight={'18px'}>
                    {t`This position is currently being used in another protocol. Fee claim and liquidity actions are unavailable.`}
                  </Text>
                </MigrationLiquidityRecommend>
              )}
            </Flex>

            <PositionDetailWrapper>
              {!isUniv2 && (
                <LeftSection
                  position={position}
                  onFetchUnclaimedFee={handleFetchUnclaimedFee}
                  initialLoading={initialLoading}
                  isNotAccountOwner={isNotAccountOwner}
                  shareBtn={shareBtn}
                  refetchPositions={refetch}
                />
              )}
              <RightSection
                position={position}
                onOpenZapMigration={handleOpenZapMigration}
                initialLoading={initialLoading}
                isNotAccountOwner={isNotAccountOwner}
                positionOwnerAddress={positionOwnerAddress}
                onRefreshPosition={onRefreshPosition}
                triggerClose={triggerClose}
                setTriggerClose={setTriggerClose}
                setReduceFetchInterval={setReduceFetchInterval}
                onReposition={handleReposition}
                hasActiveSmartExitOrder={hasActiveSmartExitOrder}
                aprInterval={aprInterval}
                setAprInterval={setAprInterval}
                isUnfinalized={isUnfinalized}
                isWaitingForRewards={isWaitingForRewards}
                shareBtn={shareBtn}
              />
            </PositionDetailWrapper>
          </>
        ) : (
          emptyPosition
        )}
      </PositionPageWrapper>
    </>
  )
}

export default PositionDetail
