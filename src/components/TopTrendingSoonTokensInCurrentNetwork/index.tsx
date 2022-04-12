import React from 'react'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import { ExternalLink } from 'theme'
import { ChevronRight, X } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { rgba } from 'polished'
import DiscoverIconTriangle from 'assets/svg/discover_icon_triangle.svg'
import useTopTrendingSoonTokensInCurrentNetwork from 'components/TopTrendingSoonTokensInCurrentNetwork/useTopTrendingSoonTokensInCurrentNetwork'
import TrendingSoonTokenItem from './TrendingSoonTokenItem'
import { useMedia } from 'react-use'
import { TextTooltip } from 'pages/TrueSight/styled'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import { MouseoverTooltip } from 'components/Tooltip'
import { useShowTrendingSoon, useToggleTrendingSoon } from 'state/user/hooks'

const TopTrendingSoonTokensInCurrentNetwork = () => {
  const theme = useTheme()
  const topTrendingSoonTokens = useTopTrendingSoonTokensInCurrentNetwork()
  const above768 = useMedia('(min-width: 768px)')
  const isShowTrendingSoon = useShowTrendingSoon()
  const toggleTrendingSoon = useToggleTrendingSoon()

  if (!isShowTrendingSoon || topTrendingSoonTokens.length === 0) return null

  if (above768)
    return (
      <TrendingSoonTokensAndNoteContainer>
        <TrendingSoonTokensContainer>
          <img
            src={DiscoverIconTriangle}
            alt="DiscoverIconTriangle"
            style={{ position: 'absolute', top: 0, left: 0, minWidth: '36px', minHeight: '36px' }}
          />
          <Flex flexDirection="column" justifyContent="center" style={{ gap: '4px', minWidth: '140px', flex: 1 }}>
            <Text color={theme.subText} fontWeight={500}>
              <Trans>Trending Soon</Trans>
            </Text>
            <ExternalLink
              href={window.location.origin + '/#/discover?tab=trending_soon'}
              target="_blank"
              style={{ fontSize: '10px', fontWeight: 500, display: 'flex', alignItems: 'center' }}
            >
              <Trans>Discover more</Trans>
              <ChevronRight color={theme.primary} size={16} />
            </ExternalLink>
          </Flex>
          {topTrendingSoonTokens.map((tokenData, index) => (
            <TrendingSoonTokenItem key={index} tokenData={tokenData} top={index} />
          ))}
        </TrendingSoonTokensContainer>
        <TextNote>
          <Trans>
            Powered by <span style={{ fontWeight: 700 }}>TrueSight</span>, our AI prediction model
          </Trans>
        </TextNote>
      </TrendingSoonTokensAndNoteContainer>
    )

  return (
    <TrendingSoonTokensMobileContainer>
      <Flex justifyContent="space-between" alignItems="center">
        <MouseoverTooltip text={t`Powered by TrueSight, our AI prediction model`}>
          <TextTooltip
            color={theme.subText}
            fontSize="14px"
            fontWeight={500}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Text>
              <Trans>Trending Soon</Trans>
            </Text>
            <DiscoverIcon color={theme.subText} />
          </TextTooltip>
        </MouseoverTooltip>
        <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleTrendingSoon}>
          <X size={20} />
        </Flex>
      </Flex>
      <Flex style={{ gap: '12px', marginTop: '15px', overflow: 'auto' }}>
        {topTrendingSoonTokens.map((tokenData, index) => (
          <TrendingSoonTokenItem key={index} tokenData={tokenData} top={index} />
        ))}
      </Flex>
      <ExternalLink
        href={window.location.origin + '/#/discover?tab=trending_soon'}
        target="_blank"
        style={{
          fontSize: '10px',
          marginTop: '12px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <Trans>Discover more</Trans>
        <ChevronRight color={theme.primary} size={16} />
      </ExternalLink>
    </TrendingSoonTokensMobileContainer>
  )
}

const TrendingSoonTokensAndNoteContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  overflow: hidden;
`

const TrendingSoonTokensContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  padding: 8px 16px 8px 24px;
  background: ${({ theme }) => rgba(theme.background, 0.5)};
  border-radius: 8px;
  width: 100%;
  max-width: 1028px;
  overflow: auto;
`

const TrendingSoonTokensMobileContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 15px 12px;
  background: ${({ theme }) => rgba(theme.background, 0.5)};
  border-radius: 8px;
  width: 100%;
`

const TextNote = styled(Text)`
  font-style: italic;
  font-size: 12px;
  font-weight: 500;
  width: 100%;
  max-width: 1028px;
  text-align: end;
`

export default TopTrendingSoonTokensInCurrentNetwork
