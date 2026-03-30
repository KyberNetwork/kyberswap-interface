import { t } from '@lingui/macro'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useExplorerLandingQuery } from 'services/zapEarn'

import FireIcon from 'assets/svg/earn/fire.svg'
import { ReactComponent as VaultIcon } from 'assets/svg/earn/ic_partner_vault.svg'
import { ReactComponent as LiquidityPoolIcon } from 'assets/svg/earn/liquidity-pools.svg'
import { ReactComponent as LiquidityPosIcon } from 'assets/svg/earn/liquidity-positions.svg'
import LowVolatilityIcon from 'assets/svg/earn/low-volatility.svg'
import PlayIcon from 'assets/svg/earn/play-icon.svg'
import SolidEarningIcon from 'assets/svg/earn/solid-earning.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import RocketIcon from 'assets/svg/rocket.svg'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import Card from 'pages/Earns/Landing/Card'
import FeaturedPartnerVaults from 'pages/Earns/Landing/FeaturedPartnerVaults'
import PoolSection from 'pages/Earns/Landing/PoolSection'
import RewardSection from 'pages/Earns/Landing/RewardSection'
import {
  CardsRow,
  ExplorePoolsButton,
  GridSpan2,
  GridSpan3,
  PageGrid,
  PoolsRow,
  RightColumnContainer,
} from 'pages/Earns/Landing/styles'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import EarnLayout from 'pages/Earns/components/EarnLayout'
import useSmartExitWidget from 'pages/Earns/hooks/useSmartExitWidget'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { MEDIA_WIDTHS } from 'theme'

const EarnLanding = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { isLoading, data } = useExplorerLandingQuery({ userAddress: account })
  const { widget: zapMigrationWidget, handleOpenZapMigration, triggerClose, setTriggerClose } = useZapMigrationWidget()
  const { onOpenSmartExit, smartExitWidget } = useSmartExitWidget()
  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration: handleOpenZapMigration,
    triggerClose,
    setTriggerClose,
    onOpenSmartExit,
  })

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const poolCount = upToSmall ? 5 : upToLarge ? 4 : 8
  const farmingPools = (data?.data?.farmingPools || []).slice(0, poolCount)
  const highlightedPools = (data?.data?.highlightedPools || []).slice(0, poolCount)
  const highAprPool = (data?.data?.highAPR || []).slice(0, 4)
  const lowVolatilityPool = [...(data?.data?.lowVolatility || [])].sort((a, b) => b.lpApr - a.lpApr).slice(0, 4)
  const solidEarningPool = (data?.data?.solidEarning || []).slice(0, 4)

  useEffect(() => {
    const openPool = searchParams.get('openPool')
    const type = searchParams.get('type')
    const openPoolIndex = parseInt(openPool || '', 10)
    const poolsToOpen = type === 'farming' ? farmingPools : type === 'highlighted' ? highlightedPools : []

    if (!isNaN(openPoolIndex) && poolsToOpen.length && poolsToOpen[openPoolIndex]) {
      searchParams.delete('openPool')
      searchParams.delete('type')
      setSearchParams(searchParams)
      handleOpenZapIn({
        pool: {
          dex: poolsToOpen[openPoolIndex].exchange,
          chainId: poolsToOpen[openPoolIndex].chainId as number,
          address: poolsToOpen[openPoolIndex].address,
        },
      })
    }
  }, [handleOpenZapIn, searchParams, setSearchParams, farmingPools, highlightedPools])

  return (
    <EarnLayout>
      {zapInWidget}
      {zapMigrationWidget}
      {smartExitWidget}

      <PageGrid>
        {/* Row 1: Hero Section */}
        <GridSpan2>
          <Text fontSize={upToSmall ? 24 : 36} fontWeight="400" lineHeight={upToSmall ? '32px' : '48px'}>
            {t`Maximize Your Earnings in DeFi`}
          </Text>
          <Text
            marginTop="16px"
            maxWidth="760px"
            fontSize={upToSmall ? 14 : 16}
            color={theme.subText}
            lineHeight="24px"
          >
            {t`Unlock the full potential of your assets. Offering data, tools, and utilities—centered around Zap technology—to help you maximize earnings from your liquidity across various DeFi protocols.`}
          </Text>
        </GridSpan2>
        <Flex alignItems="flex-end" justifyContent={upToSmall ? 'center' : 'flex-start'} width="100%">
          <RewardSection />
        </Flex>

        {/* Row 2: Feature Cards */}
        <CardsRow>
          <Card
            title={t`Liquidity Pools`}
            icon={<LiquidityPoolIcon width={40} height={40} color="#a9a9a9" />}
            desc={t`Explore and instantly add liquidity to high-APY pools the easy way with Zap Technology.`}
            action={{
              text: t`Explore Pools`,
              onClick: () => navigate({ pathname: APP_PATHS.EARN_POOLS }),
            }}
          />
          <Card
            title={t`Enhance Your Liquidity Positions`}
            icon={<LiquidityPosIcon width={40} height={40} color="#a9a9a9" />}
            desc={t`Track, adjust, and optimize your positions to stay in control of your DeFi journey.`}
            action={{
              text: t`My Positions`,
              onClick: () => navigate({ pathname: APP_PATHS.EARN_POSITIONS }),
            }}
          />
          <Card
            title={t`Partner Vaults`}
            icon={<VaultIcon width={40} height={40} color="#a9a9a9" />}
            desc={t`Auto-compounding, single-asset strategies managed by trusted partners (starting with ether.fi).`}
            action={{
              text: t`Explore Partner Vaults`,
              onClick: () => navigate({ pathname: APP_PATHS.EARN_VAULTS }),
            }}
          />
        </CardsRow>

        {/* Row 3: Pool Sections */}
        <PoolsRow>
          <div>
            <PoolSection
              title={t`Farming Pools`}
              tooltip={t`No staking is required to earn rewards in these pools`}
              icon={<FarmingIcon width={28} height={28} />}
              tag={FilterTag.FARMING_POOL}
              isLoading={isLoading}
              listPools={farmingPools}
              size="large"
              skeletonCount={poolCount}
            />

            <PoolSection
              title={t`Highlighted Pools`}
              tooltip={t`Pools matching your wallet tokens or top volume pools if no wallet is connected`}
              icon={FireIcon}
              tag={FilterTag.HIGHLIGHTED_POOL}
              isLoading={isLoading}
              listPools={highlightedPools}
              size="large"
              styles={{ marginTop: '20px' }}
              skeletonCount={poolCount}
            />

            <Box sx={{ marginTop: '20px' }}>
              <FeaturedPartnerVaults isLoading={isLoading} />
            </Box>
          </div>

          <RightColumnContainer>
            <PoolSection
              title={t`High APR`}
              tooltip={t`Top 100 Pools with assets that offer exceptionally high APRs`}
              icon={RocketIcon}
              tag={FilterTag.HIGH_APR}
              isLoading={isLoading}
              listPools={highAprPool}
              variant="grouped"
            />

            <PoolSection
              title={t`Low Volatility`}
              tooltip={t`Top 100 highest TVL Pools consisting of stable coins or correlated pairs`}
              icon={LowVolatilityIcon}
              tag={FilterTag.LOW_VOLATILITY}
              isLoading={isLoading}
              listPools={lowVolatilityPool}
              variant="grouped"
            />

            <PoolSection
              title={t`Solid Earning`}
              tooltip={t`Top 100 pools that have the high total earned fee in the last 7 days`}
              icon={SolidEarningIcon}
              tag={FilterTag.SOLID_EARNING}
              isLoading={isLoading}
              listPools={solidEarningPool}
              variant="grouped"
            />
          </RightColumnContainer>
        </PoolsRow>

        {/* Row 4: Explore Pools CTA */}
        <GridSpan3 style={{ display: 'flex', justifyContent: 'center' }}>
          <ExplorePoolsButton to={APP_PATHS.EARN_POOLS}>
            <Text fontSize={16} color={theme.primary} fontWeight={500} sx={{ textTransform: 'uppercase' }}>
              {t`Explore Pools`}
            </Text>
            <img src={PlayIcon} alt="play" width={36} height={36} />
          </ExplorePoolsButton>
        </GridSpan3>
      </PageGrid>
    </EarnLayout>
  )
}

export default EarnLanding
