import { ShareModal, ShareModalProps, ShareType } from '@kyber/ui'
import { formatAprNumber } from '@kyber/utils/dist/number'
import { priceToClosestTick } from '@kyber/utils/dist/uniswapv3'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Share2 } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useUserPositionsQuery } from 'services/zapEarn'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { ReactComponent as IconKem } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as RocketIcon } from 'assets/svg/rocket.svg'
import InfoHelper from 'components/InfoHelper'
import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { NavigateButton } from 'pages/Earns/PoolExplorer/styles'
import PositionDetailHeader from 'pages/Earns/PositionDetail/Header'
import LeftSection from 'pages/Earns/PositionDetail/LeftSection'
import RightSection from 'pages/Earns/PositionDetail/RightSection'
import {
  AprSection,
  MigrationLiquidityRecommend,
  PositionDetailWrapper,
  ShareButtonWrapper,
  SkeletonText,
  SkeletonWrapper,
  TotalLiquiditySection,
  VerticalDivider,
} from 'pages/Earns/PositionDetail/styles'
import MigrationModal from 'pages/Earns/UserPositions/MigrationModal'
import { EmptyPositionText, PositionPageWrapper } from 'pages/Earns/UserPositions/styles'
import {
  EarnDex,
  Exchange,
  POSSIBLE_FARMING_PROTOCOLS,
  protocolGroupNameToExchangeMapping,
} from 'pages/Earns/constants'
import useClosedPositions, { CheckClosedPositionParams } from 'pages/Earns/hooks/useClosedPositions'
import useFarmingStablePools from 'pages/Earns/hooks/useFarmingStablePools'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { FeeInfo, PAIR_CATEGORY, ParsedPosition, PositionStatus, SuggestedPool } from 'pages/Earns/types'
import { getUnclaimedFeesInfo } from 'pages/Earns/utils/fees'
import { parsePosition } from 'pages/Earns/utils/position'
import { formatDisplayNumber } from 'utils/numbers'

const PositionDetail = () => {
  const firstLoading = useRef(false)
  const navigate = useNavigate()
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const forceLoading = searchParams.get('forceLoading')

  const { account } = useActiveWeb3React()
  const { positionId, chainId, protocol } = useParams()
  const { widget: zapMigrationWidget, handleOpenZapMigration } = useZapMigrationWidget()

  const { closedPositionsFromRpc, checkClosedPosition } = useClosedPositions()

  const {
    data: userPosition,
    isLoading,
    isFetching,
    refetch,
  } = useUserPositionsQuery(
    {
      addresses: account || '',
      positionId: positionId,
      chainIds: chainId || '',
      protocols: protocol || '',
    },
    { skip: !account, pollingInterval: forceLoading ? 5_000 : 15_000 },
  )
  const { rewardInfo } = useKemRewards()
  const rewardInfoThisPosition = !userPosition
    ? undefined
    : rewardInfo?.nfts.find(item => item.nftId === userPosition?.[0]?.tokenId)

  const currentWalletAddress = useRef(account)
  const hadForceLoading = useRef(forceLoading ? true : false)
  const [feeInfoFromRpc, setFeeInfoFromRpc] = useState<FeeInfo | undefined>()
  const [shareInfo, setShareInfo] = useState<ShareModalProps | undefined>()
  const [positionToMigrate, setPositionToMigrate] = useState<ParsedPosition | null>(null)

  const loadingInterval = isFetching
  const initialLoading = !!(forceLoading || (isLoading && !firstLoading.current))

  const position: ParsedPosition | undefined = useMemo(() => {
    if (!userPosition || !userPosition.length) return

    const isClosedFromRpc = closedPositionsFromRpc.some(
      (closedPosition: { tokenId: string }) => closedPosition.tokenId === userPosition[0].tokenId,
    )

    return parsePosition({
      position: userPosition[0],
      feeInfo: feeInfoFromRpc,
      nftRewardInfo: rewardInfoThisPosition,
      isClosedFromRpc,
    })
  }, [feeInfoFromRpc, userPosition, rewardInfoThisPosition, closedPositionsFromRpc])

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
    const tickLower = sourcePosition.pool.isUniv2
      ? undefined
      : priceToClosestTick(
          sourcePosition.priceRange.min.toString(),
          sourcePosition.token0.decimals,
          sourcePosition.token1.decimals,
        )
    const tickUpper = sourcePosition.pool.isUniv2
      ? undefined
      : priceToClosestTick(
          sourcePosition.priceRange.max.toString(),
          sourcePosition.token0.decimals,
          sourcePosition.token1.decimals,
        )

    handleOpenZapMigration({
      chainId: sourcePosition.chain.id,
      from: {
        dex: sourcePosition.dex.id,
        poolId: sourcePosition.pool.address,
        positionId: sourcePosition.pool.isUniv2 ? account || '' : sourcePosition.tokenId,
      },
      to: {
        dex: targetPool.poolExchange,
        poolId: targetPool.address,
      },
      initialTick:
        tickLower && tickUpper
          ? {
              tickLower: tickLower,
              tickUpper: tickUpper,
            }
          : undefined,
    })
  }

  useEffect(() => {
    if (!firstLoading.current && !isLoading) {
      firstLoading.current = true
    }
  }, [isLoading])

  useEffect(() => {
    if (!account || account !== currentWalletAddress.current) navigate(APP_PATHS.EARN_POSITIONS)
  }, [account, navigate])

  useEffect(() => {
    if (position && forceLoading) {
      searchParams.delete('forceLoading')
      setSearchParams(searchParams)
    }
  }, [forceLoading, position, searchParams, setSearchParams])

  const onRefreshPosition = useCallback(
    ({ tokenId, dex, poolAddress, chainId }: CheckClosedPositionParams) => {
      refetch()
      checkClosedPosition({ tokenId, dex, poolAddress, chainId })
    },
    [checkClosedPosition, refetch],
  )

  const isFarmingPossible = POSSIBLE_FARMING_PROTOCOLS.includes(protocol as Exchange)
  const isUnfinalized = position?.isUnfinalized
  const isStablePair = position?.pool.category === PAIR_CATEGORY.STABLE

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
    <TotalLiquiditySection
      showForFarming={
        position?.pool.isFarming ||
        (initialLoading && isFarmingPossible) ||
        Number(position?.rewards.claimableUsdValue || 0) > 0
      }
    >
      <Flex flexDirection={'column'} alignContent={'flex-start'} sx={{ gap: '6px' }}>
        <Text fontSize={14} color={theme.subText}>
          {t`Total Liquidity`}
        </Text>
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

  const aprSection = (
    <AprSection
      showForFarming={
        position?.pool.isFarming ||
        (initialLoading && isFarmingPossible) ||
        Number(position?.rewards.claimableUsdValue || 0) > 0
      }
    >
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
                {t`LP Fee APR`}: {formatAprNumber(position?.feeApr || 0)}%
                <br />
                {t`EG Sharing Reward`}: {formatAprNumber(position?.kemEGApr || 0)}%
                <br />
                {t`LM Reward`}: {formatAprNumber(position?.kemLMApr || 0)}%
              </div>
            }
          />
        )}
      </Flex>

      {initialLoading ? (
        <PositionSkeleton width={70} height={24} />
      ) : isUnfinalized ? (
        <PositionSkeleton width={70} height={24} text="Finalizing..." />
      ) : (
        <Flex alignItems={'center'} sx={{ gap: 1 }}>
          <Text fontSize={20} color={position?.apr && position.apr > 0 ? theme.primary : theme.text}>
            {formatAprNumber(position?.apr || 0)}%
          </Text>
          {position?.pool.isFarming && <IconKem width={20} height={20} />}
        </Flex>
      )}
    </AprSection>
  )

  const shareBtn = useCallback(
    (type: ShareType) => (
      <ShareButtonWrapper
        onClick={() => {
          if (!position) return

          setShareInfo({
            type,
            onClose: () => setShareInfo(undefined),
            pool: {
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
              apr: position.apr,
              createdTime: position.createdTime,
              rewardEarnings: position.rewards.totalUsdValue,
            },
          })
        }}
      >
        <Share2 size={16} color={theme.subText} />
      </ShareButtonWrapper>
    ),
    [theme.subText, position],
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
            <PositionDetailHeader
              isLoading={loadingInterval}
              initialLoading={initialLoading}
              position={position}
              hadForceLoading={hadForceLoading.current}
              shareBtn={shareBtn}
            />
            {(!!position?.suggestionPool ||
              (isStablePair && farmingPoolsByChain[position.chain.id]?.pools.length > 0)) &&
              position.status !== PositionStatus.CLOSED && (
                <MigrationLiquidityRecommend>
                  <Text color={'#fafafa'} lineHeight={'18px'}>
                    {!!position.suggestionPool
                      ? position.pool.fee === position.suggestionPool.feeTier
                        ? t`Migrate to exact same pair and fee tier on Uniswap v4 hook to earn extra rewards from the
              Kyberswap Liquidity Mining Program.`
                        : t`We found a pool with the same pair having Liquidity Mining Program. Migrate to this pool on Uniswap v4 hook to start earning farming rewards.`
                      : t`We found other stable pools participating in the Kyberswap Liquidity Mining Program. Explore and migrate to start earning farming rewards.`}
                  </Text>
                  <Text color={theme.primary} sx={{ cursor: 'pointer' }} onClick={handleMigrateToKem}>
                    {!!position.suggestionPool ? t`Migrate` : t`View Pools`} →
                  </Text>
                </MigrationLiquidityRecommend>
              )}
            <PositionDetailWrapper>
              <LeftSection
                initialLoading={initialLoading}
                position={position}
                onFetchUnclaimedFee={handleFetchUnclaimedFee}
                totalLiquiditySection={totalLiquiditySection}
                aprSection={aprSection}
                shareBtn={shareBtn}
              />
              <RightSection
                position={position}
                onOpenZapMigration={handleOpenZapMigration}
                totalLiquiditySection={totalLiquiditySection}
                aprSection={aprSection}
                onRefreshPosition={onRefreshPosition}
                initialLoading={initialLoading}
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

export const PositionSkeleton = ({
  width,
  height,
  style,
  text,
}: {
  width: number
  height: number
  style?: React.CSSProperties
  text?: string
}) => {
  const theme = useTheme()

  return !text ? (
    <Skeleton
      width={width}
      height={height}
      baseColor={theme.background}
      highlightColor={theme.buttonGray}
      borderRadius="1rem"
      style={style}
    />
  ) : (
    <SkeletonWrapper>
      <Skeleton
        width={width}
        height={height}
        baseColor={theme.background}
        highlightColor={theme.buttonGray}
        borderRadius="1rem"
        style={style}
      />
      <SkeletonText>{text}</SkeletonText>
    </SkeletonWrapper>
  )
}
