import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { usePreviousDistinct } from 'react-use'
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
  TotalLiquiditySection,
  VerticalDivider,
} from 'pages/Earns/PositionDetail/styles'
import { EmptyPositionText, PositionPageWrapper } from 'pages/Earns/UserPositions/styles'
import { Exchange } from 'pages/Earns/constants'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { FeeInfo, ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { getUnclaimedFeesInfo } from 'pages/Earns/utils/fees'
import { parsePosition } from 'pages/Earns/utils/position'
import { formatDisplayNumber } from 'utils/numbers'

export const PositionSkeleton = ({
  width,
  height,
  style,
}: {
  width: number
  height: number
  style?: React.CSSProperties
}) => {
  const theme = useTheme()

  return (
    <Skeleton
      width={width}
      height={height}
      baseColor={theme.background}
      highlightColor={theme.buttonGray}
      borderRadius="1rem"
      style={style}
    />
  )
}

const PositionDetail = () => {
  const firstLoading = useRef(false)
  const navigate = useNavigate()
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const forceLoading = searchParams.get('forceLoading')

  const { account } = useActiveWeb3React()
  const { positionId, chainId, protocol } = useParams()
  const { widget: zapMigrationWidget, handleOpenZapMigration } = useZapMigrationWidget()

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

  const currentWalletAddress = useRef(account)
  const hadForceLoading = useRef(forceLoading ? true : false)
  const [feeInfoFromRpc, setFeeInfoFromRpc] = useState<FeeInfo | undefined>()

  const loadingInterval = isFetching
  const initialLoading = !!(forceLoading || (isLoading && !firstLoading.current))

  const previousPosition = usePreviousDistinct(userPosition)

  const position: ParsedPosition | undefined = useMemo(() => {
    let positionToRender = []

    if (!userPosition || !userPosition.length) {
      if (!previousPosition || !previousPosition.length) return undefined
      positionToRender = previousPosition
    } else positionToRender = userPosition

    return parsePosition({ position: positionToRender[0], feeInfo: feeInfoFromRpc })
  }, [feeInfoFromRpc, userPosition, previousPosition])

  const handleFetchUnclaimedFee = useCallback(async () => {
    if (!position) return

    const feeFromRpc = await getUnclaimedFeesInfo(position)

    setFeeInfoFromRpc(feeFromRpc)

    setTimeout(() => setFeeInfoFromRpc(undefined), 60_000)
  }, [position])

  const handleMigrateToKem = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!position || !position.suggestionPool) return

    handleOpenZapMigration({
      chainId: position.chain.id,
      from: {
        dex: position.dex.id,
        poolId: position.pool.address,
        positionId: position.tokenId,
      },
      to: {
        dex: position.suggestionPool?.poolExchange as Exchange,
        poolId: position.suggestionPool?.address || '',
      },
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
    <TotalLiquiditySection showForFarming={position?.pool.isFarming}>
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
    <AprSection showForFarming={position?.pool.isFarming}>
      <Flex alignItems={'center'} sx={{ gap: '2px' }}>
        <Text fontSize={14} color={theme.subText}>
          {t`Est. Position APR`}
        </Text>
        {position?.pool.isFarming && (
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

  return (
    <>
      {zapMigrationWidget}

      <PositionPageWrapper>
        {!!position || initialLoading ? (
          <>
            <PositionDetailHeader
              isLoading={loadingInterval}
              initialLoading={initialLoading}
              position={position}
              hadForceLoading={hadForceLoading.current}
            />
            {!!position?.suggestionPool && position.status !== PositionStatus.CLOSED && (
              <MigrationLiquidityRecommend>
                <Text color={'#fafafa'} lineHeight={'18px'}>
                  {position.pool.fee === position.suggestionPool.feeTier
                    ? t`Migrate to exact same pair and fee tier on Uniswap v4 hook to earn extra rewards from the
              Kyberswap Liquidity Mining Program.`
                    : t`We found a pool with the same pair having Liquidity Mining Program. Migrate to this pool on Uniswap v4 hook to start earning farming rewards.`}
                </Text>
                <Text color={theme.primary} sx={{ cursor: 'pointer' }} onClick={handleMigrateToKem}>
                  Migrate →
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
              />
              <RightSection
                position={position}
                onOpenZapMigration={handleOpenZapMigration}
                totalLiquiditySection={totalLiquiditySection}
                aprSection={aprSection}
                refetch={refetch}
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
