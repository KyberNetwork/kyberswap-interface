import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import headerBanner from 'assets/images/truesight-v2/header_banner.png'
import Icon from 'components/Icons/Icon'
import { RowBetween, RowFit } from 'components/Row'
import SubscribeNotificationButton from 'components/SubscribeButton'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

import TrueSightWidget from './components/KyberAIWidget'
import SearchWithDropDown from './components/SearchWithDropDown'
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
    padding: 28px 16px 40px;
  }
`

const HeaderWrapper = styled.div`
  background-image: url(${headerBanner});
  background-size: cover;
  width: 100%;
  display: flex;
  justify-content: center;
  > * {
    padding: 22px 24px;
    max-width: 1500px;
  }
  @media only screen and (max-width: 768px) {
    padding: 16px;
  }
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
`

export default function TrueSightV2() {
  const theme = useTheme()
  const [searchValue, setSearchValue] = useState('')
  const location = useLocation()
  const isSingleToken = location?.pathname.includes('Explore')
  const above768 = useMedia('(min-width:768px)')
  const navigate = useNavigate()
  return (
    <>
      <HeaderWrapper>
        <RowBetween>
          <RowFit color={theme.text} gap="6px">
            <HeaderNavItem onClick={() => navigate(APP_PATHS.KYBERAI_RANKINGS)} active={!isSingleToken}>
              <RowFit gap="4px">
                {above768 && <Icon id="leaderboard" size={20} />}
                <Trans>Rankings</Trans>
              </RowFit>
            </HeaderNavItem>
            <Text fontWeight={500} fontSize={[18, 20, 24]} color={theme.subText} marginX={'12px'}>
              |
            </Text>
            <HeaderNavItem onClick={() => navigate(APP_PATHS.KYBERAI_EXPLORE)} active={isSingleToken}>
              <RowFit gap="4px">
                {above768 && <Icon id="truesight-v2" size={20} />}
                <Trans>Explore</Trans>
              </RowFit>
            </HeaderNavItem>
          </RowFit>
          <RowFit gap="16px">
            <SearchWithDropDown onSearch={setSearchValue} searchValue={searchValue} />
            <MouseoverTooltip
              text={t`Subscribe to receive daily email notifications witha curated list of tokens from each category!`}
              placement="right"
              delay={1200}
            >
              <SubscribeNotificationButton />
            </MouseoverTooltip>
          </RowFit>
        </RowBetween>
      </HeaderWrapper>
      <Wrapper>
        {isSingleToken ? <SingleToken /> : <TokenAnalysisList />}
        <TrueSightWidget />
      </Wrapper>
    </>
  )
}
