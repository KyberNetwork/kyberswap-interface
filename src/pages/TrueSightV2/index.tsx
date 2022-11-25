import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Bell, Star } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import Divider from 'components/Divider'
import { RowBetween, RowFit } from 'components/Row'
import { TabButton, TabDivider } from 'components/Tab'
import useTheme from 'hooks/useTheme'
import { ButtonText } from 'theme'

import TokenAnalysis from './TokenAnalysis'
import { TokenAnalysisTab, TruesightV2Pages } from './types'

const Wrapper = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: center;
  flex-direction: column;
  max-width: 1224px;
  width: 100%;
  color: ${({ theme }) => theme.subText};
`

export default function TrueSightV2() {
  const theme = useTheme()
  const [currentPage, setCurrentPage] = useState<string>(TruesightV2Pages.TokenAnalysis)
  return (
    <Wrapper>
      Truesight v2
      <RowBetween>
        <RowFit>
          <TabButton
            color={currentPage === TruesightV2Pages.Overview ? theme.primary : theme.subText}
            key={TruesightV2Pages.Overview}
            onClick={() => setCurrentPage(TruesightV2Pages.Overview)}
            fontSize={24}
          >
            {TruesightV2Pages.Overview}
          </TabButton>
          <TabDivider width={3} height={24} color={theme.subText} margin="0 15px" />
          <TabButton
            color={currentPage === TruesightV2Pages.TokenAnalysis ? theme.primary : theme.subText}
            key={TruesightV2Pages.TokenAnalysis}
            onClick={() => setCurrentPage(TruesightV2Pages.TokenAnalysis)}
            fontSize={24}
          >
            {TruesightV2Pages.TokenAnalysis}
          </TabButton>
        </RowFit>
        <RowFit gap="24px">
          <ButtonText color={theme.subText} gap="4px">
            <Star size={16} fill="currentColor" />
            <Text fontSize={14} fontWeight={500}>
              <Trans>My Watchlist</Trans>
            </Text>
          </ButtonText>
          <ButtonText color={theme.subText} gap="4px">
            <Bell size={16} fill="currentColor" />
            <Text fontSize={14} fontWeight={500}>
              <Trans>My Alerts</Trans>
            </Text>
          </ButtonText>
        </RowFit>
      </RowBetween>
      <Divider color={theme.border} />
      <Text fontSize={12} margin="16px 0">
        Lorem Ipsum, some explanation text here
      </Text>
      <Divider color={theme.border} />
      <TokenAnalysis />
    </Wrapper>
  )
}
