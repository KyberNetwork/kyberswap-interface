import { t } from '@lingui/macro'
import { useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { useExplorerLandingQuery } from 'services/zapEarn'

import { ReactComponent as VaultIcon } from 'assets/svg/earn/ic_partner_vault.svg'
import { ReactComponent as LiquidityPoolIcon } from 'assets/svg/earn/liquidity-pools.svg'
import LowVolatilityIcon from 'assets/svg/earn/low-volatility.svg'
import PlayIcon from 'assets/svg/earn/play-icon.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import RocketIcon from 'assets/svg/rocket.svg'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import FeaturedPartnerVaults from 'pages/Earns/Landing/FeaturedPartnerVaults'
import PoolSection from 'pages/Earns/Landing/PoolSection'
import RewardSection from 'pages/Earns/Landing/RewardSection'
import {
  BottomLeftCol,
  BottomRightCol,
  BottomSectionInner,
  BottomSectionsRow,
  ExplorePoolsButton,
  ExplorePoolsWrapper,
  HeaderIconCircle,
  HeaderIconLine,
  HeaderIconWrapper,
  HeaderTextBlock,
  HeroSection,
  HeroTitle,
  PageGrid,
  SectionContainer,
  SectionDivider,
  SectionHeader,
  SectionInner,
  TopSectionsRow,
  TwoColumnGrid,
} from 'pages/Earns/Landing/styles'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import useSmartExitWidget from 'pages/Earns/hooks/useSmartExitWidget'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { EarnPool } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'

const PARTNER_VAULTS_ACCENT = '#8165f5'

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

  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const largePoolCount = upToExtraSmall ? 3 : upToSmall ? 4 : 6
  const farmingPools = (data?.data?.farmingPools || []).slice(0, 3)
  const highlightedPools = (data?.data?.highlightedPools || []).slice(0, largePoolCount)
  const highAprPool = (data?.data?.highAPR || []).slice(0, 4)
  const lowVolatilityPool = [...(data?.data?.lowVolatility || [])].sort((a, b) => b.lpApr - a.lpApr).slice(0, 4)

  const handlePoolClick = useCallback(
    (pool: EarnPool) =>
      handleOpenZapIn({
        pool: { dex: pool.exchange, chainId: pool.chainId as number, address: pool.address },
      }),
    [handleOpenZapIn],
  )

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
    <>
      {zapInWidget}
      {zapMigrationWidget}
      {smartExitWidget}

      <PageGrid>
        {/* Hero */}
        <HeroSection>
          <HeroTitle>
            <Text fontSize={upToSmall ? 28 : 36} fontWeight={400} lineHeight={upToSmall ? '36px' : '48px'}>
              {t`Maximize Your Earnings in DeFi`}
            </Text>
            <Text fontSize={upToSmall ? 14 : 16} color={theme.subText} lineHeight="24px">
              {t`Unlock the full potential of your assets. Offering data, tools, and utilities—centered around Zap technology—to help you maximize earnings from your liquidity across various DeFi protocols.`}
            </Text>
          </HeroTitle>
          <RewardSection />
        </HeroSection>

        {/* Top Row: Liquidity Pools + Partner Vaults */}
        <TopSectionsRow>
          <SectionContainer accentColor={theme.primary}>
            <SectionInner accentColor={theme.primary}>
              <SectionHeader>
                <HeaderIconWrapper>
                  <HeaderIconLine accentColor={theme.primary} />
                  <HeaderIconCircle accentColor={theme.primary}>
                    <LiquidityPoolIcon width={40} height={40} />
                  </HeaderIconCircle>
                </HeaderIconWrapper>
                <HeaderTextBlock>
                  <Text fontSize={18} fontWeight={500} color={theme.text}>
                    {t`Liquidity Pools`}
                  </Text>
                  <Text fontSize={14} color={theme.subText} lineHeight="20px">
                    {t`Explore and instantly add liquidity to high-APY pools the easy way with Zap Technology.`}
                  </Text>
                </HeaderTextBlock>
              </SectionHeader>

              <SectionDivider />

              <TwoColumnGrid>
                <PoolSection
                  title={t`🔥 High APR`}
                  tooltip={t`Top 100 Pools with assets that offer exceptionally high APRs`}
                  icon={RocketIcon}
                  tag={FilterTag.HIGH_APR}
                  isLoading={isLoading}
                  listPools={highAprPool}
                  variant="inner"
                  skeletonCount={4}
                  onPoolClick={handlePoolClick}
                />
                <PoolSection
                  title={t`💎 Stable Pairs`}
                  tooltip={t`Top 100 highest TVL Pools consisting of stable coins or correlated pairs`}
                  icon={LowVolatilityIcon}
                  tag={FilterTag.LOW_VOLATILITY}
                  isLoading={isLoading}
                  listPools={lowVolatilityPool}
                  variant="inner-stable"
                  skeletonCount={4}
                  onPoolClick={handlePoolClick}
                />
              </TwoColumnGrid>
            </SectionInner>
          </SectionContainer>

          <SectionContainer
            accentColor={PARTNER_VAULTS_ACCENT}
            role="button"
            tabIndex={0}
            clickable
            onClick={() => navigate(APP_PATHS.EARN_VAULTS)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(APP_PATHS.EARN_VAULTS)
              }
            }}
          >
            <SectionInner accentColor={PARTNER_VAULTS_ACCENT}>
              <SectionHeader>
                <HeaderIconWrapper>
                  <HeaderIconLine accentColor={PARTNER_VAULTS_ACCENT} />
                  <HeaderIconCircle accentColor={PARTNER_VAULTS_ACCENT}>
                    <VaultIcon width={40} height={40} />
                  </HeaderIconCircle>
                </HeaderIconWrapper>
                <HeaderTextBlock>
                  <Text fontSize={18} fontWeight={500} color={theme.text}>
                    {t`Partner Vaults`}
                  </Text>
                  <Text fontSize={14} color={theme.subText} lineHeight="20px">
                    {t`Auto-compounding, single-asset strategies managed by partners (starting with ether.fi).`}
                  </Text>
                </HeaderTextBlock>
              </SectionHeader>

              <FeaturedPartnerVaults isLoading={isLoading} />
            </SectionInner>
          </SectionContainer>
        </TopSectionsRow>

        {/* Bottom Row: Highlighted + Farming Pools inside a single gray-accent container */}
        <BottomSectionsRow>
          <SectionContainer accentColor={theme.subText}>
            <SectionInner accentColor={theme.subText}>
              <BottomSectionInner>
                <BottomLeftCol>
                  <PoolSection
                    title={t`⚡ Highlighted Pools`}
                    tooltip={t`Pools matching your wallet tokens or top volume pools if no wallet is connected`}
                    tag={FilterTag.HIGHLIGHTED_POOL}
                    isLoading={isLoading}
                    listPools={highlightedPools}
                    variant="highlighted"
                    skeletonCount={largePoolCount}
                    onPoolClick={handlePoolClick}
                  />
                </BottomLeftCol>
                <BottomRightCol>
                  <PoolSection
                    title={t`Farming Pools`}
                    tooltip={t`No staking is required to earn rewards in these pools`}
                    icon={<FarmingIcon width={28} height={28} />}
                    tag={FilterTag.FARMING_POOL}
                    isLoading={isLoading}
                    listPools={farmingPools}
                    variant="farming"
                    skeletonCount={3}
                    onPoolClick={handlePoolClick}
                  />
                </BottomRightCol>
              </BottomSectionInner>
            </SectionInner>
          </SectionContainer>
        </BottomSectionsRow>

        {/* CTA */}
        <ExplorePoolsWrapper>
          <ExplorePoolsButton to={APP_PATHS.EARN_POOLS}>
            <Text fontSize={16} color={theme.primary} fontWeight={500} sx={{ textTransform: 'uppercase' }}>
              {t`Explore Pools`}
            </Text>
            <img src={PlayIcon} alt="play" width={28} height={28} />
          </ExplorePoolsButton>
        </ExplorePoolsWrapper>
      </PageGrid>
    </>
  )
}

export default EarnLanding
