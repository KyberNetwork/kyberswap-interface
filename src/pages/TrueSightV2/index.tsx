import { Trans } from '@lingui/macro'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import headerBanner from 'assets/images/truesight-v2/header_banner.png'
import headerBannerLight from 'assets/images/truesight-v2/header_banner_light.png'
import Icon from 'components/Icons/Icon'
import Row, { RowBetween, RowFit } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import SubscribeButtonKyberAI from 'pages/TrueSightV2/components/SubscireButtonKyberAI'
import { MEDIA_WIDTHS } from 'theme'

import TrueSightWidget from './components/KyberAIWidget'
import SearchWithDropDown from './components/SearchWithDropDown'
import TutorialModal from './components/TutorialModal'
import SingleToken from './pages/SingleToken'
import TokenAnalysisList from './pages/TokenAnalysisList'

const Wrapper = styled.div`
  padding: 32px 24px 50px;
  display: flex;
  align-items: stretch;
  justify-content: center;
  flex-direction: column;
  max-width: 1500px;
  width: 100%;
  color: ${({ theme }) => theme.subText};
  gap: 24px;

  @media only screen and (max-width: 768px) {
    gap: 20px;
    padding: 28px 16px;
  }
`

const HeaderWrapper = styled.div`
  background-image: url(${({ theme }) => (theme.darkMode ? headerBanner : headerBannerLight)});
  background-color: ${({ theme }) => theme.buttonBlack};
  background-size: cover;
  width: 100%;
  display: flex;
  justify-content: center;
  > * {
    padding: 22px 24px;
    max-width: 1500px;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    background-image: unset;
    > * {
      padding: 12px 16px;
    }
  `}
`

const HeaderNavItem = styled.div<{ active?: boolean }>`
  font-size: 24px;
  line-height: 28px;
  font-weight: 500;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};

  :hover {
    filter: brightness(1.3);
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 20px;
  `}
`

export default function TrueSightV2() {
  const theme = useTheme()
  const mixpanelHandler = useMixpanelKyberAI()
  const location = useLocation()
  const isExplore = location?.pathname.includes('Explore')
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const navigate = useNavigate()
  return (
    <>
      <HeaderWrapper>
        <RowBetween gap={above768 ? '12px' : '6px'}>
          <RowFit color={theme.text} gap="6px">
            <HeaderNavItem onClick={() => navigate(APP_PATHS.KYBERAI_RANKINGS)} active={!isExplore}>
              <RowFit gap="4px">
                <Icon id="leaderboard" size={20} />
                <Trans>Rankings</Trans>
              </RowFit>
            </HeaderNavItem>
            <Text fontWeight={500} fontSize={[18, 20, 24]} color={theme.subText} marginX={'12px'}>
              |
            </Text>
            <HeaderNavItem onClick={() => navigate(APP_PATHS.KYBERAI_EXPLORE)} active={isExplore}>
              <RowFit gap="4px">
                <Icon id="truesight-v2" size={20} />
                <Trans>Explore</Trans>
              </RowFit>
            </HeaderNavItem>
          </RowFit>
          <RowFit gap="16px" flex={1} justify="flex-end">
            {above768 && <SearchWithDropDown />}
            {isExplore && <SubscribeButtonKyberAI source="explore" />}
          </RowFit>
        </RowBetween>
      </HeaderWrapper>
      {!above768 && (
        <Row padding="16px">
          <SearchWithDropDown />
        </Row>
      )}
      <Wrapper>
        {isExplore ? <SingleToken /> : <TokenAnalysisList />}
        <TrueSightWidget />
        <TutorialModal />
      </Wrapper>
    </>
  )
}
