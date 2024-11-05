import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import bg from 'assets/images/earn-bg.png'
import CursorIcon from 'assets/svg/cursor.svg'
import LiquidityPoolIcon from 'assets/svg/liquidity-pools.svg'
import LiquidityPosIcon from 'assets/svg/liquidity-positions.svg'
import StakingIcon from 'assets/svg/staking.svg'
import { ButtonPrimary } from 'components/Button'
import useTheme from 'hooks/useTheme'

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

const CardWrapper = styled.div`
  border-radius: 20px;
  border: 1px solid;
  border-image-source: linear-gradient(306.9deg, #262525 38.35%, rgba(49, 203, 158, 0.06) 104.02%),
    radial-gradient(58.61% 54.58% at 30.56% 0%, rgba(49, 203, 158, 0.6) 0%, rgba(0, 0, 0, 0) 100%);
  background: linear-gradient(119.08deg, rgba(20, 29, 27, 0.8) -0.89%, rgba(14, 14, 14, 0.8) 132.3%);
  padding-left: 36px;
  padding-bottom: 44px;
  text-align: left;
  min-height: 360px;
  display: flex;
  flex-direction: column;

  cursor: url(${CursorIcon}), auto;
  button {
    cursor: url(${CursorIcon}), auto;
  }
`

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
    <CardWrapper>
      <Flex flexDirection="column" width="80px" alignItems="center">
        <Box width="1px" height="36px" backgroundColor="#258166" />
        <Flex width="80px" height="80px" sx={{ border: `1px solid #258166`, borderRadius: '50%', padding: '8px' }}>
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
            <img src={icon} alt="icon" width="40px" />
          </Flex>
        </Flex>
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
  )
}

export default function Earns() {
  const theme = useTheme()

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
              onClick: () => {},
            }}
          />
          <Card
            title="Enhance Your Liquidity Positions"
            icon={LiquidityPosIcon}
            desc="Track, adjust, and optimize your positions to stay in control of your DeFi journey."
            action={{
              text: 'Your Pools',
              onClick: () => {},
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
      </Container>
    </WrapperBg>
  )
}
