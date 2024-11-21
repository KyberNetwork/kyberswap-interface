import { ChainId } from '@kyberswap/ks-sdk-core'
import { rgba } from 'polished'
import { useNavigate } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import { EarnPool, useExplorerLandingQuery } from 'services/zapEarn'
import styled, { keyframes } from 'styled-components'

import bg from 'assets/images/earn-bg.png'
import CursorIcon from 'assets/svg/cursor.svg'
import FireIcon from 'assets/svg/fire.svg'
import LiquidityPoolIcon from 'assets/svg/liquidity-pools.svg'
import LiquidityPosIcon from 'assets/svg/liquidity-positions.svg'
import LowVolatilityIcon from 'assets/svg/low-volatility.svg'
import PlayIcon from 'assets/svg/play-icon.svg'
import RocketIcon from 'assets/svg/rocket.svg'
import SolidEarningIcon from 'assets/svg/solid-earning.svg'
import StakingIcon from 'assets/svg/staking.svg'
import { ButtonPrimary } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'

import { FilterTag } from './PoolExplorer'
import useLiquidityWidget from './useLiquidityWidget'

const WrapperBg = styled.div`
  background-image: url(${bg});
  background-size: 100% auto;
  background-repeat: repeat-y;
  width: 100vw;
`

const Container = styled.div`
  max-width: 1152px;
  padding: 60px 16px;
  margin: auto;
  text-align: center;
`

/* Spin animation */
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const BorderWrapper = styled.div`
  padding: 1px;
  position: relative;
  background-clip: padding-box;
  border-radius: 20px;
  overflow: hidden;

  ::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 1px; /* Border width */
    background: linear-gradient(306.9deg, #262525 38.35%, rgba(49, 203, 158, 0.06) 104.02%),
      radial-gradient(58.61% 54.58% at 30.56% 0%, rgba(49, 203, 158, 0.6) 0%, rgba(0, 0, 0, 0) 100%);
    mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); /* Mask to avoid background bleed */
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); /* Mask to avoid background bleed */
    z-index: -1;
  }

  :hover::before {
    top: -20%;
    left: -20%;
    right: -20%;
    bottom: -20%;
    padding: 1px; /* Border width */
    background: linear-gradient(306.9deg, #262525 38.35%, rgba(49, 203, 158, 0.6) 104.02%),
      radial-gradient(58.61% 54.58% at 30.56% 0%, rgba(49, 203, 158, 1) 0%, rgba(0, 0, 0, 0) 100%);

    animation: ${spin} 2s linear infinite; /* Spin animation */
  }
`
const PoolWrapper = styled.div`
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  padding: 1px;
  transition: box-shadow 0.3s ease, transform 0.3s ease, background 0.3s ease;

  :hover {
    box-shadow: 0px 12px 64px 0px rgba(71, 32, 139, 0.8);
    ::before {
      background: linear-gradient(215.58deg, #262525 -9.03%, rgba(148, 115, 221, 0.6) 59.21%),
        radial-gradient(58.61% 54.58% at 30.56% 0%, rgba(130, 71, 229, 1) 0%, rgba(0, 0, 0, 0) 100%);
    }
  }

  /* Create the gradient border effect using ::before */
  ::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 20px;
    padding: 1px;

    background: linear-gradient(215.58deg, #262525 -9.03%, rgba(148, 115, 221, 0.2) 59.21%),
      radial-gradient(58.61% 54.58% at 30.56% 0%, rgba(130, 71, 229, 0.6) 0%, rgba(0, 0, 0, 0) 100%);
    mask-composite: destination-out;
    -webkit-mask-composite: destination-out;
    z-index: -1; /* Position behind the content */
  }
`

const CardWrapper = styled.div`
  border-radius: 20px;

  background: linear-gradient(119.08deg, rgba(20, 29, 27, 1) -0.89%, rgba(14, 14, 14, 1) 132.3%);
  padding: 0 36px 44px 50px;
  text-align: left;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  cursor: url(${CursorIcon}), auto;
  button {
    cursor: url(${CursorIcon}), auto;
  }
`

const ListPoolWrapper = styled.div`
  padding: 20px;
  border-radius: 20px;
  height: 100%;
  background: linear-gradient(119.08deg, rgba(20, 29, 27, 1) -0.89%, rgba(14, 14, 14, 1) 132.3%);
  cursor: url(${CursorIcon}), auto;
`

const PoolRow = styled(Flex)`
  gap: 12px;
  align-items: center;
  border-radius: 999px;
  padding: 8px 16px;

  :hover {
    background: #31cb9e1a;
  }
`

const Tag = styled.div`
  border-radius: 999px;
  background: ${({ theme }) => rgba(theme.text, 0.1)};
  color: ${({ theme }) => theme.subText};
  padding: 4px 8px;
  font-size: 12px;
`

const Icon = ({ icon, size = 'medium' }: { icon: string; size: 'small' | 'medium' }) => {
  return (
    <Flex
      width={size === 'small' ? '40px' : '80px'}
      height={size === 'small' ? '40px' : '80px'}
      padding={size === 'medium' ? '8px' : '4px'}
      sx={{ border: `1px solid #258166`, borderRadius: '50%' }}
    >
      <Flex
        width="100%"
        height="100%"
        backgroundColor="#23312E"
        alignItems="center"
        justifyContent="center"
        sx={{
          borderRadius: '50%',
        }}
      >
        <img src={icon} alt="icon" width={size === 'small' ? '24px' : '40px'} />
      </Flex>
    </Flex>
  )
}

const Card = ({
  title,
  icon,
  desc,
  action,
}: {
  title: string
  icon: string
  desc: string
  action: { text: string; disabled?: boolean; onClick: () => void }
}) => {
  const theme = useTheme()
  return (
    <BorderWrapper onClick={() => !action.disabled && action.onClick()}>
      <CardWrapper>
        <Flex flexDirection="column" width="80px" alignItems="center">
          <Box width="1px" height="36px" backgroundColor="#258166" />
          <Icon icon={icon} size="medium" />
        </Flex>

        <Text fontSize={18} fontWeight={500} marginTop="28px">
          {title}
        </Text>
        <Text color={theme.subText} marginTop="12px">
          {desc}
        </Text>
        <ButtonPrimary disabled={action.disabled} style={{ marginTop: 'auto', width: '132px', height: '36px' }}>
          {action.text}
        </ButtonPrimary>
      </CardWrapper>
    </BorderWrapper>
  )
}

export default function Earns() {
  const navigate = useNavigate()
  const theme = useTheme()
  const { data } = useExplorerLandingQuery()

  const title = (_title: string, icon: string) => (
    <>
      <Flex alignItems="center" sx={{ gap: '12px' }}>
        <Icon icon={icon} size="small" />
        <Text fontSize={20}>{_title}</Text>
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

  return (
    <WrapperBg>
      <Container>
        <Text fontSize={36} fontWeight="500">
          Maximize Your Earnings in DeFi
        </Text>
        <Text marginTop="1rem" maxWidth="800px" fontSize={16} color={theme.subText} marginX="auto" lineHeight="24px">
          Unlock the full potential of your assets. Offering data, tools, and utilities—centered around Zap
          technology—to help you maximize earnings from your liquidity across various DeFi protocols.
        </Text>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            marginTop: '64px',
            gap: '20px',
          }}
        >
          <Card
            title="Liquidity Pools"
            icon={LiquidityPoolIcon}
            desc="Explore and instantly add liquidity to high-APY pools the easy way with Zap Technology."
            action={{
              text: 'View Pools',
              onClick: () => {
                navigate({ pathname: APP_PATHS.EARN_POOLS })
              },
            }}
          />
          <Card
            title="Enhance Your Liquidity Positions"
            icon={LiquidityPosIcon}
            desc="Track, adjust, and optimize your positions to stay in control of your DeFi journey."
            action={{
              // text: 'Your Pools',
              text: 'Coming Soon',
              onClick: () => {},
              disabled: true,
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
        </Box>

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
            {title('Highlighted Pools', FireIcon)}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
              }}
            >
              {data?.data?.highlightedPools.map(pool => (
                <PoolItem pool={pool} key={pool.address} />
              ))}
            </Box>
          </ListPoolWrapper>
        </PoolWrapper>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '40px', gap: '20px' }}>
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
              {title('High APR', RocketIcon)}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {data?.data?.highAPR.map(pool => (
                  <PoolItem pool={pool} key={pool.address} />
                ))}
              </Box>
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
              {title('Low Volatility', LowVolatilityIcon)}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {data?.data?.lowVolatility.map(pool => (
                  <PoolItem pool={pool} key={pool.address} />
                ))}
              </Box>
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
              {title('Solid Earning', SolidEarningIcon)}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {data?.data?.solidEarning.map(pool => (
                  <PoolItem pool={pool} key={pool.address} />
                ))}
              </Box>
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

const PoolItem = ({ pool }: { pool: EarnPool }) => {
  const theme = useTheme()
  const { liquidityWidget, handleOpenZapInWidget } = useLiquidityWidget()

  return (
    <PoolRow
      justifyContent="space-between"
      key={pool.address}
      role="button"
      onClick={e => {
        e.stopPropagation()
        handleOpenZapInWidget(pool)
      }}
    >
      {liquidityWidget}
      <Flex alignItems="center" sx={{ gap: '4px', flex: 1 }}>
        <img src={pool.tokens[0].logoURI} width={24} height={24} alt="" style={{ borderRadius: '50%' }} />
        <img
          src={pool.tokens[1].logoURI}
          width={24}
          height={24}
          alt=""
          style={{ marginLeft: '-8px', borderRadius: '50%' }}
        />
        <img
          src={NETWORKS_INFO[pool.chainId as ChainId].icon}
          width={12}
          height={12}
          alt=""
          style={{ marginLeft: '-4px', alignSelf: 'flex-end' }}
        />
        <Text
          textAlign="left"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {pool.tokens[0].symbol} /{' '}
          <Text as="span" color={theme.subText}>
            {pool.tokens[1].symbol}
          </Text>
        </Text>
        <Tag>{pool.feeTier}%</Tag>
      </Flex>
      <Text color={theme.primary}>{pool.apr}%</Text>
    </PoolRow>
  )
}
