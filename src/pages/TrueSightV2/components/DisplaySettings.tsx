import { Trans } from '@lingui/macro'
import React, { useRef, useState } from 'react'
import { Sliders } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonGray } from 'components/Button'
import Column from 'components/Column'
import Divider from 'components/Divider'
import ExpandableBox from 'components/ExpandableBox'
import Popover from 'components/Popover'
import { RowBetween } from 'components/Row'
import Toggle from 'components/Toggle'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { useTokenAnalysisSettings, useUpdateTokenAnalysisSettings } from 'state/user/hooks'

import { DiscoverTokenTab } from '../types'

const SettingsWrapper = styled.div`
  padding: 16px;
  border-radius: 20px;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: ${({ theme }) => theme.tableHeader};
`

const tokenAnalysisSettings = [
  {
    id: 'numberOfTrades',
    name: 'Number of Trades / Type of Trade',
  },

  {
    id: 'tradingVolume',
    name: 'Trading Volume',
  },
  {
    id: 'netflowToWhaleWallets',
    name: 'Netflow to Whale Wallets',
  },
  {
    id: 'netflowToCEX',
    name: 'Netflow to CEX',
  },
  {
    id: 'volumeOfTransfers',
    name: 'Number of Trades / Type of Trade',
  },
  {
    id: 'numberOfHolders',
    name: 'Number of Holders',
  },
  {
    id: 'top10Holders',
    name: 'Top 10 Holders',
  },
  {
    id: 'top25Holders',
    name: 'Top 25 Holders',
  },
]

export default function DisplaySettings({ currentTab }: { currentTab: DiscoverTokenTab }) {
  const theme = useTheme()
  const [showSettings, setShowSettings] = useState(false)
  const storedTokenAnalysisSettings = useTokenAnalysisSettings()
  const updateTokenAnalysisSettings = useUpdateTokenAnalysisSettings()
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => {
    setShowSettings(false)
  })
  return (
    <Popover
      show={showSettings}
      style={{ backgroundColor: theme.tableHeader }}
      opacity={1}
      content={
        <SettingsWrapper ref={ref}>
          <Text color={theme.text}>
            <Trans>Display Settings</Trans>
          </Text>
          <ExpandableBox
            style={{ padding: 0, opacity: 1 }}
            backgroundColor="inherit"
            expandedDefault={currentTab === DiscoverTokenTab.OnChainAnalysis}
            headerContent={
              <Text color={theme.text} fontSize={14}>
                On-Chain Analysis
              </Text>
            }
            hasDivider={false}
            expandContent={
              <Column gap="12px" style={{ marginTop: '12px' }}>
                {tokenAnalysisSettings.map(t => (
                  <RowBetween key={t.id}>
                    <Text fontSize={14}>
                      <Trans>{t.name}</Trans>
                    </Text>
                    <Toggle
                      isActive={storedTokenAnalysisSettings?.[t.id] ?? true}
                      toggle={() => updateTokenAnalysisSettings(t.id)}
                    />
                  </RowBetween>
                ))}
              </Column>
            }
          />
          <Divider />
          <ExpandableBox
            style={{ padding: 0 }}
            backgroundColor="inherit"
            expandedDefault={currentTab === DiscoverTokenTab.TechnicalAnalysis}
            headerContent={
              <Text color={theme.text} fontSize={14}>
                Technical Analysis
              </Text>
            }
            hasDivider={false}
            expandContent={
              <Column gap="12px" style={{ marginTop: '12px' }}>
                <RowBetween>
                  <Text fontSize={14}>
                    <Trans>BTC/USD / BTC/BTC</Trans>
                  </Text>
                  <Toggle isActive={true} toggle={() => console.log(1)} />
                </RowBetween>
                <RowBetween>
                  <Text fontSize={14}>
                    <Trans>Funding Rate on CEX</Trans>
                  </Text>
                  <Toggle isActive={true} toggle={() => console.log(1)} />
                </RowBetween>
                <RowBetween>
                  <Text fontSize={14}>
                    <Trans>Live DEX Trades</Trans>
                  </Text>
                  <Toggle isActive={true} toggle={() => console.log(1)} />
                </RowBetween>
                <RowBetween>
                  <Text fontSize={14}>
                    <Trans>Liquidations on CEX</Trans>
                  </Text>
                  <Toggle isActive={true} toggle={() => console.log(1)} />
                </RowBetween>
                <RowBetween>
                  <Text fontSize={14}>
                    <Trans>Netflow to Centralized Exchanges</Trans>
                  </Text>
                  <Toggle isActive={true} toggle={() => console.log(1)} />
                </RowBetween>
              </Column>
            }
          />
        </SettingsWrapper>
      }
      noArrow={true}
      placement="bottom"
    >
      <ButtonGray
        color={theme.subText}
        gap="4px"
        width="36px"
        height="36px"
        padding="6px"
        style={{ filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16))' }}
        onClick={() => setShowSettings(true)}
      >
        <Sliders size={16} fill="currentcolor" style={{ transform: 'rotate(-90deg)' }} />
      </ButtonGray>
    </Popover>
  )
}
