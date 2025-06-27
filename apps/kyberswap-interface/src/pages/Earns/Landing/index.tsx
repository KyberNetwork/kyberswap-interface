import { rgba } from 'polished'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useExplorerLandingQuery } from 'services/zapEarn'

import FireIcon from 'assets/svg/earn/fire.svg'
import LiquidityPoolIcon from 'assets/svg/earn/liquidity-pools.svg'
import LiquidityPosIcon from 'assets/svg/earn/liquidity-positions.svg'
import LowVolatilityIcon from 'assets/svg/earn/low-volatility.svg'
import PlayIcon from 'assets/svg/earn/play-icon.svg'
import SolidEarningIcon from 'assets/svg/earn/solid-earning.svg'
import RocketIcon from 'assets/svg/rocket.svg'
import StakingIcon from 'assets/svg/staking.svg'
import LocalLoader from 'components/LocalLoader'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import Card from 'pages/Earns/Landing/Card'
import Icon from 'pages/Earns/Landing/Icon'
import PoolItem from 'pages/Earns/Landing/PoolItem'
import { Container, ListPoolWrapper, OverviewWrapper, PoolWrapper, WrapperBg } from 'pages/Earns/Landing/styles'
import { FilterTag } from 'pages/Earns/PoolExplorer'
import useLiquidityWidget from 'pages/Earns/useLiquidityWidget'
import { MEDIA_WIDTHS } from 'theme'

const EarnLanding = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { isLoading, data } = useExplorerLandingQuery({ userAddress: account })
  const { liquidityWidget, handleOpenZapInWidget } = useLiquidityWidget()

  const title = (title: string, tooltip: string, icon: string) => (
    <>
      <Flex alignItems="center" sx={{ gap: '12px' }}>
        <Icon icon={icon} size="small" />
        <MouseoverTooltipDesktopOnly text={tooltip} placement="top">
          <Text fontSize={20}>{title}</Text>
        </MouseoverTooltipDesktopOnly>
      </Flex>
      <Box
        sx={{
          height: '1px',
          margin: '16px',
          width: '100%',
          background: 'linear-gradient(90deg, #161A1C 0%, #49287F 29%, #111413 100%)',
        }}
      />
    </>
  )

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
      handleOpenZapInWidget({
        exchange: poolsToOpen[openPoolIndex].exchange,
        chainId: poolsToOpen[openPoolIndex].chainId,
        address: poolsToOpen[openPoolIndex].address,
      })
    }
  }, [handleOpenZapInWidget, data, searchParams, setSearchParams])

  return (
    <WrapperBg>
      {liquidityWidget}
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

        <PoolWrapper style={{ marginTop: '64px' }}>
          <ListPoolWrapper
            role="button"
            onClick={() => {
              navigate({
                pathname: APP_PATHS.EARN_POOLS,
                search: `tag=${FilterTag.HIGHLIGHTED_POOL}`,
              })
            }}
          >
            {title(
              'Highlighted Pools',
              'Pools matching your wallet tokens or top 24h volume pools if no wallet is connected',
              FireIcon,
            )}
            {isLoading ? (
              <LocalLoader />
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: upToSmall ? '1fr' : 'repeat(3, 1fr)',
                  gap: '1rem',
                }}
              >
                {highlightedPools.map(pool => (
                  <PoolItem pool={pool} key={pool.address} />
                ))}
              </Box>
            )}
          </ListPoolWrapper>
        </PoolWrapper>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: upToSmall ? '1fr' : 'repeat(3, 1fr)',
            marginTop: upToXXSmall ? 16 : 40,
            gap: upToXXSmall ? 16 : 20,
          }}
        >
          <PoolWrapper>
            <ListPoolWrapper
              role="button"
              onClick={() => {
                navigate({
                  pathname: APP_PATHS.EARN_POOLS,
                  search: `tag=${FilterTag.HIGH_APR}`,
                })
              }}
            >
              {title('High APR', 'Top 100 Pools with assets that offer exceptionally high APRs', RocketIcon)}
              {isLoading ? (
                <LocalLoader />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  {highAprPool.map(pool => (
                    <PoolItem pool={pool} key={pool.address} />
                  ))}
                </Box>
              )}
            </ListPoolWrapper>
          </PoolWrapper>

          <PoolWrapper>
            <ListPoolWrapper
              role="button"
              onClick={() => {
                navigate({
                  pathname: APP_PATHS.EARN_POOLS,
                  search: `tag=${FilterTag.LOW_VOLATILITY}`,
                })
              }}
            >
              {title(
                'Low Volatility',
                'Top 100 highest TVL Pools consisting of stable coins or correlated pairs',
                LowVolatilityIcon,
              )}
              {isLoading ? (
                <LocalLoader />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  {lowVolatilityPool.map(pool => (
                    <PoolItem pool={pool} key={pool.address} />
                  ))}
                </Box>
              )}
            </ListPoolWrapper>
          </PoolWrapper>

          <PoolWrapper>
            <ListPoolWrapper
              role="button"
              onClick={() => {
                navigate({
                  pathname: APP_PATHS.EARN_POOLS,
                  search: `tag=${FilterTag.SOLID_EARNING}`,
                })
              }}
            >
              {title(
                'Solid Earning',
                'Top 100 pools that have the high total earned fee in the last 7 days',
                SolidEarningIcon,
              )}
              {isLoading ? (
                <LocalLoader />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  {solidEarningPool.map(pool => (
                    <PoolItem pool={pool} key={pool.address} />
                  ))}
                </Box>
              )}
            </ListPoolWrapper>
          </PoolWrapper>
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
