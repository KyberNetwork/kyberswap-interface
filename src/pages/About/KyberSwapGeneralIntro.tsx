import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import { MoneyBagOutline } from 'components/Icons'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'

const StyledText = styled.span`
  font-weight: 400;
  font-size: 18px;
  line-height: 28px;
  text-align: center;
  color: ${({ theme }) => theme.subText};
`

const StyledHighlightText = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const KyberSwapGeneralIntro = () => {
  const above768 = useMedia('(min-width: 768px)')
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()

  const renderKyberSwapIntroDEX = () => {
    return (
      <StyledText>
        <Trans>
          KyberSwap is a decentralized exchange (DEX) aggregator. We provide our traders with the{' '}
          <StyledHighlightText>best token prices</StyledHighlightText> by analyzing rates across thousands of exchanges
          instantly!
        </Trans>
      </StyledText>
    )
  }

  const renderKyberSwapIntroAMM = () => {
    return (
      <StyledText>
        <Trans>
          KyberSwap is also an automated market maker (AMM) with industry-leading liquidity protocols and{' '}
          <StyledHighlightText>concentrated liquidity</StyledHighlightText>. Liquidity providers can add liquidity to
          our pools & <StyledHighlightText>earn fees</StyledHighlightText>!
        </Trans>
      </StyledText>
    )
  }

  const renderSwapNowButton = () => {
    return (
      <ButtonPrimary
        onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_SWAP_CLICKED)}
        as={Link}
        to="/swap?highlightBox=true"
        style={{
          width: '216px',
          padding: '10px 12px',
          borderRadius: '32px',
        }}
      >
        <Repeat size={20} />
        <Text fontSize="14px" marginLeft="8px">
          <Trans>Swap Now</Trans>
        </Text>
      </ButtonPrimary>
    )
  }

  const renderStartEarningButton = () => {
    return (
      <ButtonLight
        as={Link}
        to={'/pools?tab=elastic&highlightAddLiquidityButton=true'}
        onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_START_EARNING_CLICKED)}
        style={{
          width: '216px',
        }}
      >
        <MoneyBagOutline color={theme.primary} size={20} />
        <Text fontSize="14px" marginLeft="8px">
          <Trans>Start Earning</Trans>
        </Text>
      </ButtonLight>
    )
  }

  if (above768) {
    return (
      <Box
        sx={{
          marginTop: '32px',
          width: '100%',
          paddingLeft: '64px',
          paddingRight: '64px',

          display: 'grid',
          gap: '24px 72px ',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr auto',
          justifyItems: 'center',
        }}
      >
        {renderKyberSwapIntroDEX()}
        {renderKyberSwapIntroAMM()}
        {renderSwapNowButton()}
        {renderStartEarningButton()}
      </Box>
    )
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        marginTop: '32px',
        width: '100%',
        paddingLeft: '32px',
        paddingRight: '32px',
        rowGap: '48px',
      }}
    >
      <Flex
        flexDirection={'column'}
        sx={{
          alignItems: 'center',
          rowGap: '16px',
        }}
      >
        {renderKyberSwapIntroDEX()}
        {renderSwapNowButton()}
      </Flex>

      <Flex
        flexDirection={'column'}
        sx={{
          alignItems: 'center',
          rowGap: '16px',
        }}
      >
        {renderKyberSwapIntroAMM()}
        {renderStartEarningButton()}
      </Flex>
    </Flex>
  )
}

export default KyberSwapGeneralIntro
