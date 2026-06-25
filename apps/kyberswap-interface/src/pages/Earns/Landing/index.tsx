import { t } from '@lingui/macro'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { useExplorerLandingQuery } from 'services/zapEarn'

import FireIcon from 'assets/svg/earn/fire.svg'
import LiquidityPoolIcon from 'assets/svg/earn/liquidity-pools.svg'
import LiquidityPosIcon from 'assets/svg/earn/liquidity-positions.svg'
import LowVolatilityIcon from 'assets/svg/earn/low-volatility.svg'
import PlayIcon from 'assets/svg/earn/play-icon.svg'
import SolidEarningIcon from 'assets/svg/earn/solid-earning.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import RocketIcon from 'assets/svg/rocket.svg'
import StakingIcon from 'assets/svg/staking.svg'
import RevealOnScroll from 'components/RevealOnScroll'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import Card from 'pages/Earns/Landing/Card'
import PoolSection from 'pages/Earns/Landing/PoolSection'
import RewardSection from 'pages/Earns/Landing/RewardSection'
import { Container, OverviewWrapper, WrapperBg } from 'pages/Earns/Landing/styles'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import useSmartExitWidget from 'pages/Earns/hooks/useSmartExitWidget'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { MEDIA_WIDTHS } from 'theme'

const EarnLanding = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
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
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)

  const farmingPools = (data?.data?.farmingPools || []).slice(0, upToSmall ? 5 : 9)
  const highlightedPools = (data?.data?.highlightedPools || []).slice(0, upToSmall ? 5 : 9)
  const highAprPool = (data?.data?.highAPR || []).slice(0, 5)
  const lowVolatilityPool = [...(data?.data?.lowVolatility || [])].sort((a, b) => b.lpApr - a.lpApr).slice(0, 5)
  const solidEarningPool = (data?.data?.solidEarning || []).slice(0, 5)

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
    <WrapperBg>
      {zapInWidget}
      {zapMigrationWidget}
      {smartExitWidget}

      <Container>
        <h1 className="text-4xl font-medium">{t`Maximize Your Earnings in DeFi`}</h1>
        <p className="mx-auto mb-8 mt-4 max-w-[800px] text-base leading-6 text-subText">
          {t`Unlock the full potential of your assets. Offering data, tools, and utilities—centered around Zap
            technology—to help you maximize earnings from your liquidity across various DeFi protocols.`}
        </p>

        <RevealOnScroll>
          <RewardSection />
        </RevealOnScroll>

        <OverviewWrapper>
          <RevealOnScroll className="sm:h-full">
            <Card
              title={t`Liquidity Pools`}
              icon={LiquidityPoolIcon}
              desc={t`Explore and instantly add liquidity to high-APY pools the easy way with Zap Technology.`}
              action={{
                text: t`Explore Pools`,
                onClick: () => navigate({ pathname: APP_PATHS.EARN_POOLS }),
              }}
            />
          </RevealOnScroll>
          <RevealOnScroll delay={0.2} className="sm:h-full">
            <Card
              title={t`Enhance Your Liquidity Positions`}
              icon={LiquidityPosIcon}
              desc={t`Track, adjust, and optimize your positions to stay in control of your DeFi journey.`}
              action={{
                text: t`My positions`,
                onClick: () => navigate({ pathname: APP_PATHS.EARN_POSITIONS }),
              }}
            />
          </RevealOnScroll>
          <RevealOnScroll delay={0.3} className="sm:h-full">
            <Card
              title={t`Staking/Compounding Strategies`}
              icon={StakingIcon}
              desc={t`Coming soon...`}
              action={{
                text: t`Coming Soon`,
                onClick: () => {},
                disabled: true,
              }}
            />
          </RevealOnScroll>
        </OverviewWrapper>

        <RevealOnScroll>
          <PoolSection
            title={t`Farming Pools`}
            tooltip={t`No staking is required to earn rewards in these pools`}
            icon={<FarmingIcon width={28} height={28} />}
            tag={FilterTag.FARMING_POOL}
            isLoading={isLoading}
            listPools={farmingPools}
            size="large"
            styles={{ marginTop: upToSmall ? '40px' : '64px' }}
          />
        </RevealOnScroll>

        <RevealOnScroll>
          <PoolSection
            title={t`Highlighted Pools`}
            tooltip={t`Pools matching your wallet tokens or top volume pools if no wallet is connected`}
            icon={FireIcon}
            tag={FilterTag.HIGHLIGHTED_POOL}
            isLoading={isLoading}
            listPools={highlightedPools}
            size="large"
            styles={{ marginTop: upToSmall ? '16px' : '40px' }}
          />
        </RevealOnScroll>

        <div
          className="grid"
          style={{
            gridTemplateColumns: upToSmall ? '1fr' : 'repeat(3, 1fr)',
            marginTop: upToXXSmall ? 16 : 40,
            gap: upToXXSmall ? 16 : 20,
          }}
        >
          <RevealOnScroll>
            <PoolSection
              title={t`High APR`}
              tooltip={t`Top 100 Pools with assets that offer exceptionally high APRs`}
              icon={RocketIcon}
              tag={FilterTag.HIGH_APR}
              isLoading={isLoading}
              listPools={highAprPool}
            />
          </RevealOnScroll>

          <RevealOnScroll delay={0.2}>
            <PoolSection
              title={t`Low Volatility`}
              tooltip={t`Top 100 highest TVL Pools consisting of stable coins or correlated pairs`}
              icon={LowVolatilityIcon}
              tag={FilterTag.LOW_VOLATILITY}
              isLoading={isLoading}
              listPools={lowVolatilityPool}
            />
          </RevealOnScroll>

          <RevealOnScroll delay={0.3}>
            <PoolSection
              title={t`Solid Earning`}
              tooltip={t`Top 100 pools that have the high total earned fee in the last 7 days`}
              icon={SolidEarningIcon}
              tag={FilterTag.SOLID_EARNING}
              isLoading={isLoading}
              listPools={solidEarningPool}
            />
          </RevealOnScroll>
        </div>

        <RevealOnScroll>
          <div
            role="button"
            onClick={() => {
              navigate({
                pathname: APP_PATHS.EARN_POOLS,
              })
            }}
            className="mx-auto mt-10 flex h-14 w-fit cursor-pointer items-center rounded-full border border-primary bg-primary/20 px-8 py-4 text-base font-medium text-primary hover:bg-primary/[0.25]"
          >
            {t`EXPLORE POOLS`}
            <img src={PlayIcon} alt="play" width="36px" />
          </div>
        </RevealOnScroll>
      </Container>
    </WrapperBg>
  )
}

export default EarnLanding
