import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useRef, useState } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Column from 'components/Column'
import Divider from 'components/Divider'
import Icon from 'components/Icons/Icon'
import Row from 'components/Row'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'

import { WidgetTable } from './table'

const WidgetWrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: fixed;
  right: 0;
  top: 110px;
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
  width: 20%;
  min-width: 168px;
  padding: 12px 20px;
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
  display: flex;
  justify-content: center;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  ${({ active, theme }) =>
    active &&
    css`
      background-color: ${rgba(theme.primary, 0.3)};
      border-bottom: 2px solid ${theme.primary};
    `}

  > * {
    text-align: center;
    width: fit-content;
    border-bottom: 2px dotted ${({ theme }) => theme.subText};
  }
  :hover {
    filter: brightness(0.8);
  }
`

enum WidgetTab {
  MyWatchlist = 'My Watchlist',
  Bullish = 'Bullish',
  Bearish = 'Bearish',
  TopCEXInflow = 'Top CEX Inflow',
  TopCEXOutflow = 'Top CEX Outflow',
}

export default function Widget() {
  const theme = useTheme()
  const [show, setShow] = useState(false)
  const [activeTab, setActiveTab] = useState<WidgetTab>(WidgetTab.MyWatchlist)
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => {
    setShow(false)
  })
  return (
    <>
      <WidgetWrapper onClick={() => setShow(true)}>
        <IconButton onClick={() => setActiveTab(WidgetTab.MyWatchlist)}>
          <Icon id="star" size={16} />
        </IconButton>
        <Divider style={{ margin: '0 12px' }} />
        <IconButton onClick={() => setActiveTab(WidgetTab.Bullish)}>
          <Icon id="bullish" size={16} />
        </IconButton>
        <Divider style={{ margin: '0 12px' }} />
        <IconButton onClick={() => setActiveTab(WidgetTab.Bearish)}>
          <Icon id="bearish" size={16} />
        </IconButton>
        <Divider style={{ margin: '0 12px' }} />
        <IconButton onClick={() => setActiveTab(WidgetTab.TopCEXInflow)}>
          <Icon id="download" size={16} />
        </IconButton>
        <Divider style={{ margin: '0 12px' }} />
        <IconButton onClick={() => setActiveTab(WidgetTab.TopCEXOutflow)}>
          <Icon id="upload" size={16} />
        </IconButton>
      </WidgetWrapper>
      <ExpandedWidgetWrapper ref={ref} show={show}>
        <Column>
          <Row>
            {Object.values(WidgetTab).map(t => (
              <Tab key={t} onClick={() => setActiveTab(t)} active={activeTab === t}>
                <Text>{t}</Text>
              </Tab>
            ))}
          </Row>
          {activeTab === WidgetTab.MyWatchlist ? (
            <Row align="center" justify="center" height="380px">
              <Text color={theme.subText}>
                <Trans>
                  You can add more tokens to your watchlist from <span color={theme.primary}>Discover</span>
                </Trans>
              </Text>
            </Row>
          ) : (
            <WidgetTable />
          )}
        </Column>
      </ExpandedWidgetWrapper>
    </>
  )
}
