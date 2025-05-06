import { rgba } from 'polished'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useExplorerLandingQuery } from 'services/zapEarn'
import { MEDIA_WIDTHS } from 'theme'
import { FilterTag } from 'pages/Earns/PoolExplorer'
import { OverviewWrapper, WrapperBg, Container } from 'pages/Earns/Landing/styles'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import FireIcon from 'assets/svg/earn/fire.svg'
import LiquidityPoolIcon from 'assets/svg/earn/liquidity-pools.svg'
import LiquidityPosIcon from 'assets/svg/earn/liquidity-positions.svg'
import LowVolatilityIcon from 'assets/svg/earn/low-volatility.svg'
import PlayIcon from 'assets/svg/earn/play-icon.svg'
import RocketIcon from 'assets/svg/rocket.svg'
import SolidEarningIcon from 'assets/svg/earn/solid-earning.svg'
import StakingIcon from 'assets/svg/staking.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/earn/ic_claim.svg'
import useTheme from 'hooks/useTheme'
import Card from 'pages/Earns/Landing/Card'
import PoolSection from 'pages/Earns/Landing/PoolSection'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'

const EarnLanding = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { isLoading, data } = useExplorerLandingQuery({ userAddress: account })
  const { widget: zapMigrationWidget, handleOpenZapMigration } = useZapMigrationWidget()
  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration: handleOpenZapMigration,
  })

  const highlightedPools = (data?.data?.highlightedPools || []).slice(0, 9)
  const highAprPool = (data?.data?.highAPR || []).slice(0, 5)
  const lowVolatilityPool = [...(data?.data?.lowVolatility || [])].sort((a, b) => b.apr - a.apr).slice(0, 5)
  const solidEarningPool = (data?.data?.solidEarning || []).slice(0, 5)

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)

  useEffect(() => {
    const poolsToOpen = data?.data?.highlightedPools || []
    const openPool = searchParams.get('openPool')
    const openPoolIndex = parseInt(openPool || '', 10)

    if (!isNaN(openPoolIndex) && poolsToOpen.length && poolsToOpen[openPoolIndex]) {
      searchParams.delete('openPool')
      setSearchParams(searchParams)
      handleOpenZapIn({
        exchange: poolsToOpen[openPoolIndex].exchange,
        chainId: poolsToOpen[openPoolIndex].chainId,
        address: poolsToOpen[openPoolIndex].address,
      })
    }
  }, [handleOpenZapIn, data, searchParams, setSearchParams])

  return (
    <WrapperBg>
      {zapInWidget}
      {zapMigrationWidget}
      <Container>
        <Text fontSize={36} fontWeight="500">
          Maximize Your Earnings in DeFi
        </Text>
        <Text marginTop="1rem" maxWidth="800px" fontSize={16} color={theme.subText} marginX="auto" lineHeight="24px">
          Unlock the full potential of your assets. Offering data, tools, and utilities—centered around Zap
          technology—to help you maximize earnings from your liquidity across various DeFi protocols.
        </Text>

        <OverviewWrapper>
          <Card
            title="Liquidity Pools"
            icon={LiquidityPoolIcon}
            desc="Explore and instantly add liquidity to high-APY pools the easy way with Zap Technology."
            action={{
              text: 'Explore Pools',
              onClick: () => navigate({ pathname: APP_PATHS.EARN_POOLS }),
            }}
          />
          <Card
            title="Enhance Your Liquidity Positions"
            icon={LiquidityPosIcon}
            desc="Track, adjust, and optimize your positions to stay in control of your DeFi journey."
            action={{
              text: 'My positions',
              onClick: () => navigate({ pathname: APP_PATHS.EARN_POSITIONS }),
            }}
          />
          <Card
            title="Staking/Compounding Strategies"
            icon={StakingIcon}
            desc="Coming soon..."
            action={{
              text: 'Coming Soon',
              onClick: () => {},
              disabled: true,
            }}
          />
        </OverviewWrapper>

        <PoolSection
          title="Farming Pools"
          tooltip="No staking is required to earn rewards in these pools"
          icon={<FarmingIcon width={21} height={21} color={theme.primary} />}
          tag={FilterTag.FARMING_POOL}
          isLoading={isLoading}
          listPools={highlightedPools}
          size="large"
          isFarming
          styles={{ marginTop: '64px' }}
        />

        <PoolSection
          title="Highlighted Pools"
          tooltip="Pools matching your wallet tokens or top 24h volume pools if no wallet is connected"
          icon={FireIcon}
          tag={FilterTag.HIGHLIGHTED_POOL}
          isLoading={isLoading}
          listPools={highlightedPools}
          size="large"
          styles={{ marginTop: '40px' }}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: upToSmall ? '1fr' : 'repeat(3, 1fr)',
            marginTop: upToXXSmall ? 16 : 40,
            gap: upToXXSmall ? 16 : 20,
          }}
        >
          <PoolSection
            title="High APR"
            tooltip="Top 100 Pools with assets that offer exceptionally high APRs"
            icon={RocketIcon}
            tag={FilterTag.HIGH_APR}
            isLoading={isLoading}
            listPools={highAprPool}
          />

          <PoolSection
            title="Low Volatility"
            tooltip="Top 100 highest TVL Pools consisting of stable coins or correlated pairs"
            icon={LowVolatilityIcon}
            tag={FilterTag.LOW_VOLATILITY}
            isLoading={isLoading}
            listPools={lowVolatilityPool}
          />

          <PoolSection
            title="Solid Earning"
            tooltip="Top 100 pools that have the high total earned fee in the last 7 days"
            icon={SolidEarningIcon}
            tag={FilterTag.SOLID_EARNING}
            isLoading={isLoading}
            listPools={solidEarningPool}
          />
        </Box>

        <Flex
          role="button"
          onClick={() => {
            navigate({
              pathname: APP_PATHS.EARN_POOLS,
            })
          }}
          sx={{
            cursor: 'pointer',
            border: `1px solid ${theme.primary}`,
            margin: 'auto',
            marginTop: '40px',
            borderRadius: '999px',
            height: '56px',
            background: rgba(theme.primary, 0.2),
            fontSize: '16px',
            fontWeight: 500,
            color: theme.primary,
            alignItems: 'center',
            padding: '1rem 2rem',
            width: 'fit-content',
          }}
        >
          EXPLORE POOLS
          <img src={PlayIcon} alt="play" width="36px" />
        </Flex>
      </Container>
    </WrapperBg>
  )
}

export default EarnLanding
