import styled from 'styled-components'
import { Flex } from 'rebass'
import { ButtonPrimary, ButtonOutlined } from 'components/Button'
import bgimg from 'assets/images/about_background.png'

export const Wrapper = styled.div`
  max-width: 960px;
  margin: auto;
  padding: 160px 12px 0;
  padding-bottom: 160px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding-bottom: 100px;
    padding-top: 100px
  `};
`

export const SupportedChain = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 24px;
`

export const BtnOutlined = styled(ButtonOutlined)`
  width: 216px;
  padding: 14px;
  flex: 1;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

export const BtnPrimary = styled(ButtonPrimary)`
  width: 216px;
  padding: 14px;
  flex: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

export const StatisticWrapper = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-direction: row;
  margin-top: 160px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    margin-top: 100px;
  `}
`

export const StatisticItem = styled.div`
  background-color: ${({ theme }) => theme.bg20};
  flex: 1;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  padding: 20px 0px;
`

export const ForTrader = styled.div`
  margin-top: 160px;
  gap: 24px;
  display: flex;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    margin-top: 100px;
  `}
`

export const ForTraderInfo = styled(Flex)`
  margin-top: 20px;
  background-color: ${({ theme }) => theme.bg20};
  padding: 20px 0;
  display: flex;
  gap: 24px;
  border-radius: 8px;
  justify-content: center;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    padding: 20px 16px;
  `}
`
export const ForTraderDivider = styled.div<{ horizontal?: boolean }>`
  background-color: ${({ theme }) => theme.border};
  width: ${({ horizontal }) => (horizontal ? '100%' : '1px')};
  height: ${({ horizontal }) => (horizontal ? '1px' : '100%')};
  ${({ theme, horizontal }) => theme.mediaWidth.upToMedium`
    ${!horizontal && 'height: auto;'}
  `}
`

export const ForLiquidityProviderItem = styled(Flex)`
  padding: 48px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bg20};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 32px;
  `};
`

export const KyberSwapSlippage = styled.div`
  border-radius: 8px;
  background-color: ${({ theme }) => `${theme.primary}33`};
  padding: 20px 16px 12px;
  text-align: center;
`
export const TypicalAMM = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  padding: 14px 16px 24px;
  text-align: center;
`

export const Footer = styled.div<{ background: string }>`
  background: ${({ theme }) => theme.background};
  width: 100%;
  filter: drop-shadow(0px -4px 16px rgba(0, 0, 0, 0.04));

  ${({ theme }) => theme.mediaWidth.upToLarge`
    margin-bottom: 4rem;
  `};
`

export const FooterContainer = styled.div`
  margin: auto;
  max-width: 960px;
  padding: 24px;
  font-size: 14px;
  gap: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  a {
    color: ${({ theme }) => theme.subText};
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    justify-content: center;
  `};
`

export const Powered = styled(Flex)`
  img {
    ${({ theme }) => theme.mediaWidth.upToLarge`
      max-width: 120px;
    `}
  }
`

export const AboutPage = styled.div<{ background: string }>`
  width: 100%;
  background-color: ${({ background }) => background};
  background-image: url(${bgimg});
  background-repeat: repeat-y;
  background-size: contain;
`
