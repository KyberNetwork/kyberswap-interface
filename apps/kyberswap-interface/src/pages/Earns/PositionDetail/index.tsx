import { ShareModal, ShareModalProps, ShareOption, ShareType } from '@kyber/ui'
import { formatAprNumber } from '@kyber/utils/dist/number'
import { MAX_TICK, MIN_TICK, priceToClosestTick } from '@kyber/utils/dist/uniswapv3'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Share2 } from 'react-feather'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useUserPositionsQuery } from 'services/zapEarn'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import { ReactComponent as RocketIcon } from 'assets/svg/rocket.svg'
import InfoHelper from 'components/InfoHelper'
import { Loader2 } from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { timings } from 'pages/Earns/PoolExplorer/Filter'
import { NavigateButton } from 'pages/Earns/PoolExplorer/styles'
import PositionDetailHeader from 'pages/Earns/PositionDetail/Header'
import LeftSection from 'pages/Earns/PositionDetail/LeftSection'
import RightSection from 'pages/Earns/PositionDetail/RightSection'
import {
  AprSection,
  MigrationLiquidityRecommend,
  PositionDetailWrapper,
  ShareButtonWrapper,
  TotalLiquiditySection,
  VerticalDivider,
} from 'pages/Earns/PositionDetail/styles'
import MigrationModal from 'pages/Earns/UserPositions/MigrationModal'
import { EmptyPositionText, PositionPageWrapper } from 'pages/Earns/UserPositions/styles'
import DropdownMenu from 'pages/Earns/components/DropdownMenu'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import RewardSyncing from 'pages/Earns/components/RewardSyncing'
import { EarnDex, protocolGroupNameToExchangeMapping } from 'pages/Earns/constants'
import useClosedPositions, { CheckClosedPositionParams } from 'pages/Earns/hooks/useClosedPositions'
import useFarmingStablePools from 'pages/Earns/hooks/useFarmingStablePools'
import useForceLoading from 'pages/Earns/hooks/useForceLoading'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import useReduceFetchInterval from 'pages/Earns/hooks/useReduceFetchInterval'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { FeeInfo, PAIR_CATEGORY, ParsedPosition, PositionStatus, SuggestedPool } from 'pages/Earns/types'
import { getNftManagerContract } from 'pages/Earns/utils'
import { getUnclaimedFeesInfo } from 'pages/Earns/utils/fees'
import { checkEarlyPosition, parsePosition } from 'pages/Earns/utils/position'
import { getUnfinalizedPositions } from 'pages/Earns/utils/unfinalizedPosition'
import { formatDisplayNumber, toString } from 'utils/numbers'

const PositionDetail = () => {
  const firstLoading = useRef(false)
  const navigate = useNavigate()
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()

  const { account } = useActiveWeb3React()
  const { forceLoading, removeForceLoading } = useForceLoading()
  const { positionId, chainId, protocol } = useParams()
  const { widget: zapMigrationWidget, handleOpenZapMigration, triggerClose, setTriggerClose } = useZapMigrationWidget()

  const { closedPositionsFromRpc, checkClosedPosition } = useClosedPositions()
  const { reduceFetchInterval, setReduceFetchInterval } = useReduceFetchInterval()

  const {
    data: userPositions,
    isLoading,
    isFetching,
    refetch,
  } = useUserPositionsQuery(
    {
      addresses: account || '',
      positionId: positionId?.toLowerCase(),
      chainIds: chainId || '',
      protocols: protocol || '',
    },
    { skip: !account, pollingInterval: forceLoading || reduceFetchInterval ? 5_000 : 15_000 },
  )
  const { rewardInfo } = useKemRewards(refetch)
  const rewardInfoThisPosition = !userPositions
    ? undefined
    : rewardInfo?.nfts.find(item => item.nftId === userPositions?.[0]?.tokenId)

  const currentWalletAddress = useRef(account)
  const [aprInterval, setAprInterval] = useState<'24h' | '7d'>('24h')
  const [feeInfoFromRpc, setFeeInfoFromRpc] = useState<FeeInfo | undefined>()
  const [shareInfo, setShareInfo] = useState<ShareModalProps | undefined>()
  const [positionToMigrate, setPositionToMigrate] = useState<ParsedPosition | null>(null)
  const [positionOwnerAddress, setPositionOwnerAddress] = useState<string | null>(null)

  const loadingInterval = isFetching
  const initialLoading = !!(forceLoading || (isLoading && !firstLoading.current))

  const position: ParsedPosition | undefined = useMemo(() => {
    if (!userPositions || !userPositions.length) {
      const unfinalizedPositions = getUnfinalizedPositions([])
      if (unfinalizedPositions.length > 0) return unfinalizedPositions[0]
      return
    }

    const isClosedFromRpc = closedPositionsFromRpc.some(
      (closedPosition: { tokenId: string }) => closedPosition.tokenId === userPositions[0].tokenId,
    )

    const parsedPosition = parsePosition({
      position: userPositions[0],
      feeInfo: feeInfoFromRpc,
      nftRewardInfo: rewardInfoThisPosition,
      isClosedFromRpc,
    })

    const unfinalizedPositions = getUnfinalizedPositions([parsedPosition])

    if (unfinalizedPositions.length > 0) return unfinalizedPositions[0]

    return parsedPosition
  }, [feeInfoFromRpc, userPositions, rewardInfoThisPosition, closedPositionsFromRpc])

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

    const dontNeedRevert =
      sourcePosition.token0.decimals === targetToken0Decimals && sourcePosition.token1.decimals === targetToken1Decimals

    const isMinPrice = sourcePosition.priceRange.isMinPrice
    const isMaxPrice = sourcePosition.priceRange.isMaxPrice

    const tickLower = sourcePosition.pool.isUniv2
      ? undefined
      : dontNeedRevert
      ? isMinPrice
        ? MIN_TICK
        : priceToClosestTick(toString(sourceMinPrice), targetToken0Decimals, targetToken1Decimals)
      : isMaxPrice
      ? MAX_TICK
      : priceToClosestTick(toString(1 / sourceMaxPrice), targetToken0Decimals, targetToken1Decimals)

    const tickUpper = sourcePosition.pool.isUniv2
      ? undefined
      : dontNeedRevert
      ? isMaxPrice
        ? MAX_TICK
        : priceToClosestTick(toString(sourceMaxPrice), targetToken0Decimals, targetToken1Decimals)
      : isMinPrice
      ? MIN_TICK
      : priceToClosestTick(toString(1 / sourceMinPrice), targetToken0Decimals, targetToken1Decimals)

    handleOpenZapMigration({
      chainId: sourcePosition.chain.id,
      from: {
        poolType: sourcePosition.dex.id,
        poolAddress: sourcePosition.pool.address,
        positionId: sourcePosition.pool.isUniv2 ? account || '' : sourcePosition.tokenId,
      },
      to: {
        poolType: targetPool.poolExchange,
        poolAddress: targetPool.address,
      },
      initialTick:
        tickLower !== undefined && tickUpper !== undefined
          ? {
              tickLower: tickLower,
              tickUpper: tickUpper,
            }
          : undefined,
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
        },
        rePositionMode: true,
      })
    },
    [handleOpenZapMigration, account],
  )

  useEffect(() => {
    if (!firstLoading.current && !isLoading) {
      firstLoading.current = true
    }
  }, [isLoading])

  useEffect(() => {
    if (!account || account !== currentWalletAddress.current) navigate(APP_PATHS.EARN_POSITIONS)
  }, [account, navigate])

  useEffect(() => {
    if (!position || !forceLoading) return
    if (position.pool.isUniv2 ? position.id === positionId : position.tokenId === positionId?.split('-')[1]) {
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

  const totalLiquiditySection = (
    <TotalLiquiditySection>
      <Flex flexDirection={'column'} alignContent={'flex-start'} sx={{ gap: '6px' }}>
        <Flex alignItems={'center'} sx={{ gap: '6px' }}>
          <Text fontSize={14} color={theme.subText}>
            {t`Total Liquidity`}
          </Text>
          {position?.isValueUpdating && (
            <MouseoverTooltipDesktopOnly text={t`Value is updating`} placement="top" width="fit-content">
              <Loader2 size={12} />
            </MouseoverTooltipDesktopOnly>
          )}
        </Flex>
        {initialLoading ? (
          <PositionSkeleton width={95} height={24} />
        ) : (
          <Text fontSize={20}>
            {formatDisplayNumber(position?.totalProvidedValue, {
              style: 'currency',
              significantDigits: 4,
            })}
          </Text>
        )}
      </Flex>
      <VerticalDivider />
      <Flex flexDirection={'column'} alignContent={'flex-end'} sx={{ gap: 2 }}>
        {initialLoading ? (
          <PositionSkeleton width={120} height={19} />
        ) : (
          <Flex alignItems={'center'} sx={{ gap: '6px' }} fontSize={16}>
            <TokenLogo src={position?.token0.logo} size={16} />
            <Text>{formatDisplayNumber(position?.token0.totalProvide, { significantDigits: 4 })}</Text>
            <Text>{position?.token0.symbol}</Text>
          </Flex>
        )}

        {initialLoading ? (
          <PositionSkeleton width={120} height={19} />
        ) : (
          <Flex alignItems={'center'} sx={{ gap: '6px' }} fontSize={16}>
            <TokenLogo src={position?.token1.logo} size={16} />
            <Text>{formatDisplayNumber(position?.token1.totalProvide, { significantDigits: 4 })}</Text>
            <Text>{position?.token1.symbol}</Text>
          </Flex>
        )}
      </Flex>
    </TotalLiquiditySection>
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
              dexName: position.dex.id,
              exchange: protocolGroupNameToExchangeMapping[position.dex.id as EarnDex],
              token0: {
                symbol: position.token0.symbol,
                logo: position.token0.logo,
              },
              token1: {
                symbol: position.token1.symbol,
                logo: position.token1.logo,
              },
            },
            position: {
              apr: {
                total: position.apr[aprInterval],
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

  const aprSection = (
    <AprSection>
      <Flex alignItems={'center'} sx={{ gap: '2px' }}>
        <Text fontSize={14} color={theme.subText}>
          {t`Est. Position APR`}
        </Text>
        {position?.pool.isFarming && !isUnfinalized && (
          <InfoHelper
            size={16}
            fontSize={14}
            placement="top"
            width="fit-content"
            text={
              <div>
                {t`LP Fee`}: {formatAprNumber(position?.feeApr[aprInterval] || 0)}%
                <br />
                {t`EG Sharing Reward`}: {formatAprNumber(position?.kemEGApr[aprInterval] || 0)}%
                <br />
                {t`LM Reward`}: {formatAprNumber(position?.kemLMApr[aprInterval] || 0)}%
              </div>
            }
          />
        )}
      </Flex>

      {initialLoading ? (
        <PositionSkeleton width={70} height={24} />
      ) : isUnfinalized ? (
        <PositionSkeleton width={70} height={24} text="Finalizing..." />
      ) : isWaitingForRewards ? (
        <RewardSyncing width={70} height={24} />
      ) : (
        <Flex alignItems={'center'} justifyContent={'space-between'}>
          <Flex alignItems={'center'} sx={{ gap: 1 }}>
            {position?.pool.isFarmingLm ? (
               <FarmingLmIcon width={20} height={20} />
              ) : position?.pool.isFarming ? (
            <FarmingIcon width={20} height={20} />
          ) : null}
            <Text
              fontSize={20}
              marginRight={1}
              color={position?.apr && position.apr[aprInterval] > 0 ? theme.primary : theme.text}
            >
              {formatAprNumber(position?.apr[aprInterval] || 0)}%
            </Text>
            {!initialLoading &&
              !isUnfinalized &&
              position?.status !== PositionStatus.CLOSED &&
              shareBtn(12, [ShareOption.TOTAL_APR])}
          </Flex>

          <DropdownMenu
            width={30}
            flatten
            tooltip={`APR calculated based on last ${aprInterval} fees. Useful for recent performance trends.`}
            options={timings.slice(0, 2)}
            value={aprInterval}
            alignLeft
            onChange={value => setAprInterval(value as '24h')}
          />
        </Flex>
      )}
    </AprSection>
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

  return (
    <>
      {zapMigrationWidget}
      {shareModal}
      {migrationModal}

      <PositionPageWrapper>
        {!!position || initialLoading ? (
          <>
            <PositionDetailHeader isLoading={loadingInterval} initialLoading={initialLoading} position={position} />

            <Flex flexDirection={'column'} sx={{ gap: '12px' }}>
              {!position?.pool.isFarming &&
                (!!position?.suggestionPool ||
                  (isStablePair && farmingPoolsByChain[position.chain.id]?.pools.length > 0)) &&
                position.status !== PositionStatus.CLOSED && (
                  <MigrationLiquidityRecommend>
                    <Text color={'#fafafa'} lineHeight={'18px'}>
                      {!!position.suggestionPool
                        ? position.pool.fee === position.suggestionPool.feeTier
                          ? t`Earn extra rewards with exact same pair and fee tier on Uniswap v4 hook.`
                          : t`We found a pool with the same pair offering extra rewards. Migrate to this pool on Uniswap v4 hook to start earning farming rewards.`
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
              <LeftSection
                position={position}
                onFetchUnclaimedFee={handleFetchUnclaimedFee}
                totalLiquiditySection={totalLiquiditySection}
                aprSection={aprSection}
                initialLoading={initialLoading}
                isNotAccountOwner={isNotAccountOwner}
                shareBtn={shareBtn}
                refetchPositions={refetch}
              />
              <RightSection
                position={position}
                onOpenZapMigration={handleOpenZapMigration}
                totalLiquiditySection={totalLiquiditySection}
                aprSection={aprSection}
                initialLoading={initialLoading}
                isNotAccountOwner={isNotAccountOwner}
                positionOwnerAddress={positionOwnerAddress}
                onRefreshPosition={onRefreshPosition}
                triggerClose={triggerClose}
                setTriggerClose={setTriggerClose}
                setReduceFetchInterval={setReduceFetchInterval}
                onReposition={handleReposition}
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
