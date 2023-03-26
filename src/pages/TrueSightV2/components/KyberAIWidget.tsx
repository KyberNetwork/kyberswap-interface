import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useRef, useState } from 'react'
import { X } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Column from 'components/Column'
import Divider from 'components/Divider'
import Icon from 'components/Icons/Icon'
import Row, { RowBetween } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { useKyberAIWidget } from 'state/user/hooks'

import { WidgetTable } from './table'

const CloseButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  height: 16px;
  width: 16px;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.subText};
  position: absolute;
  left: -8px;
  top: -8px;
  opacity: 0;
  transition: all 0.1s linear;
  z-index: 10;
  cursor: pointer;
  :hover {
    background-color: ${({ theme }) => theme.tableHeader};
  }
`
const WidgetWrapper = styled.div<{ show?: boolean }>`
  position: fixed;
  right: 0;
  top: 110px;
  transition: all 1.5s ease-out;
  z-index: 10;
  ${({ show }) =>
    !show &&
    css`
      right: -40px;
      visibility: hidden;
    `}
  :hover {
    ${CloseButton} {
      opacity: 1;
    }
  }
`
const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.tableHeader};
  border-radius: 8px 0 0 8px;
  overflow: hidden;
`
const IconButton = styled.div`
  padding: 12px;
  background-color: ${({ theme }) => theme.tableHeader};
  cursor: pointer;
  transition: all 0.2s ease;
  > * {
    height: 16px;
    width: 16px;
  }
  :hover {
    filter: brightness(0.8);
  }
`
const ExpandedWidgetWrapper = styled.div<{ show?: boolean }>`
  position: fixed;
  right: 0;
  top: 110px;
  background-color: ${({ theme }) => theme.tableHeader};
  border-radius: 20px 0 0 20px;
  z-index: 1000;
  transition: all 0.2s ease;
  transform: ${({ show }) => (show ? css`translateX(0)` : css`translateX(100%)`)};
  overflow: hidden;
  min-height: 470px;
`

const Tab = styled.div<{ active?: boolean }>`
  width: 25%;
  min-width: 168px;
  padding: 12px 20px;
  font-size: 14px;
  line-height: 24px;
  white-space: nowrap;
  display: flex;
  justify-content: center;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  ${({ active, theme }) =>
    active
      ? css`
          color: ${theme.text};
          background-color: ${rgba(theme.primary, 0.3)};
          border-bottom: 2px solid ${theme.primary};
        `
      : css`
          background-color: ${({ theme }) => theme.tableHeader};
        `}

  > * {
    text-align: center;
    width: fit-content;
    border-bottom: 1px dotted ${({ theme }) => theme.subText};
  }
  :hover {
    filter: brightness(1.2);
  }
`

const TextButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  cursor: pointer;
  :hover {
    filter: brightness(1.2);
  }
`

enum WidgetTab {
  MyWatchlist = 'My Watchlist',
  Bullish = 'Bullish',
  Bearish = 'Bearish',
  TrendingSoon = 'Trending Soon',
}

export default function Widget() {
  const theme = useTheme()
  const [showExpanded, setShowExpanded] = useState(false)
  const [showWidget, toggleWidget] = useKyberAIWidget()
  const [activeTab, setActiveTab] = useState<WidgetTab>(WidgetTab.MyWatchlist)
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => {
    setShowExpanded(false)
  })
  const navigate = useNavigate()
  return (
    <>
      <WidgetWrapper onClick={() => setShowExpanded(true)} show={showWidget}>
        <CloseButton
          onClick={e => {
            e.stopPropagation()
            toggleWidget()
          }}
        >
          <X size={12} />
        </CloseButton>
        <ButtonWrapper>
          <IconButton onClick={() => setActiveTab(WidgetTab.MyWatchlist)} title={t`My Watchlist`}>
            <Icon id="star" size={16} />
          </IconButton>
          <Divider style={{ margin: '0 12px' }} />
          <IconButton onClick={() => setActiveTab(WidgetTab.Bullish)} title={t`Bullish`}>
            <Icon id="bullish" size={16} />
          </IconButton>
          <Divider style={{ margin: '0 12px' }} />
          <IconButton onClick={() => setActiveTab(WidgetTab.Bearish)} title={t`Bearish`}>
            <Icon id="bearish" size={16} />
          </IconButton>
          <Divider style={{ margin: '0 12px' }} />
          <IconButton onClick={() => setActiveTab(WidgetTab.TrendingSoon)} title={t`Trending soon`}>
            <Icon id="trending-soon" size={16} />
          </IconButton>
        </ButtonWrapper>
      </WidgetWrapper>
      <ExpandedWidgetWrapper ref={ref} show={showExpanded}>
        <Column>
          <Row>
            {Object.values(WidgetTab).map(t => (
              <Tab key={t} onClick={() => setActiveTab(t)} active={activeTab === t}>
                <Text>{t}</Text>
              </Tab>
            ))}
          </Row>
          {activeTab === WidgetTab.MyWatchlist ? (
            <Row align="center" justify="center" height="380px" width="820px">
              <Text color={theme.subText} textAlign="center">
                <Trans>
                  You can add more tokens to your watchlist from{' '}
                  <Text color={theme.primary} display="inline">
                    Discover
                  </Text>
                  .<br />
                  You can watch up to 8 tokens
                </Trans>
              </Text>
            </Row>
          ) : (
            <WidgetTable />
          )}
          <RowBetween padding="16px">
            <TextButton style={{ color: theme.subText }} onClick={() => setShowExpanded(false)}>
              <Trans>Collapse</Trans>
              <Icon size={16} id="arrow" />
            </TextButton>
            <TextButton style={{ color: theme.primary }} onClick={() => navigate(APP_PATHS.KYBERAI_RANKINGS)}>
              <Trans>View more ↗</Trans>
            </TextButton>
          </RowBetween>
        </Column>
      </ExpandedWidgetWrapper>
    </>
  )
}
