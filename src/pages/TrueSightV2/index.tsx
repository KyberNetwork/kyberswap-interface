import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import Icon from 'components/Icons/Icon'
import { RowBetween, RowFit } from 'components/Row'
import SubscribeNotificationButton from 'components/SubscribeButton'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

import SearchWithDropDown from './components/SearchWithDropDown'
import TrueSightWidget from './components/Widget'
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

export default function TrueSightV2() {
  const theme = useTheme()
  const [searchValue, setSearchValue] = useState('')
  const location = useLocation()
  const isSingleToken = location?.pathname.includes('Explore')
  const above768 = useMedia('(min-width:768px)')
  const navigate = useNavigate()
  return (
    <Wrapper>
      <RowBetween>
        <RowFit color={theme.text} gap="6px">
          <Text
            fontSize={above768 ? 24 : 20}
            lineHeight="28px"
            color={isSingleToken ? theme.subText : theme.primary}
            fontWeight={500}
            onClick={() => navigate(APP_PATHS.KYBERAI_RANKINGS)}
            style={{ cursor: 'pointer' }}
          >
            <RowFit gap="4px">
              {above768 && <Icon id="leaderboard" size={20} />}
              <Trans>Ranking</Trans>
            </RowFit>
          </Text>
          <Text fontWeight={500} fontSize={[18, 20, 24]} color={theme.subText} marginX={'12px'}>
            |
          </Text>
          <Text
            fontSize={above768 ? 24 : 20}
            lineHeight="28px"
            color={isSingleToken ? theme.primary : theme.subText}
            fontWeight={500}
            onClick={() => navigate(APP_PATHS.KYBERAI_EXPLORE)}
            style={{ cursor: 'pointer' }}
          >
            <RowFit gap="4px">
              {above768 && <Icon id="truesight-v2" size={20} />}
              <Trans>Explore</Trans>
            </RowFit>
          </Text>
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
      {isSingleToken ? <SingleToken /> : <TokenAnalysisList />}
      <TrueSightWidget />
    </Wrapper>
  )
}
