import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Bell, Share2 } from 'react-feather'
import { Text } from 'rebass'

import { ButtonOutlined } from 'components/Button'
import ProChartToggle from 'components/LiveChart/ProChartToggle'
import Row, { RowBetween, RowFit } from 'components/Row'
import Search from 'components/Search'
import { TabButton, TabDivider } from 'components/Tab'
import Toggle from 'components/Toggle'
import useTheme from 'hooks/useTheme'

import { TokenAnalysisTab } from '../types'
import TokenAnalysisList from './TokenAnalysisList'

export default function TokenAnalysis() {
  const theme = useTheme()
  const [currentTab, setCurrentTab] = useState(TokenAnalysisTab.All)
  const [toggle, setToggle] = useState(false)
  const [activeTimeframe, setActiveTimeframe] = useState('1D')
  return (
    <>
      <Row gap="4px" margin="24px 0">
        {Object.values(TokenAnalysisTab).map((tab: string, index: number) => (
          <>
            {index !== 0 && <TabDivider height={14} width={1.6} color={theme.subText} />}
            <TabButton
              color={currentTab === tab ? theme.primary : theme.subText}
              fontWeight={500}
              onClick={() => setCurrentTab(tab)}
            >
              {tab}
            </TabButton>
          </>
        ))}
      </Row>
      <RowBetween>
        <RowFit gap="8px">
          <Text style={{ textDecoration: 'underline' }}>
            <Trans>Watchlist</Trans>
          </Text>
          <Toggle isActive={toggle} toggle={() => setToggle(prev => !prev)} />
        </RowFit>
        <RowFit gap="16px">
          <ProChartToggle
            activeName={activeTimeframe}
            buttons={[
              { name: '1D', title: '1D' },
              { name: '7D', title: '7D' },
            ]}
            toggle={(name: string) => setActiveTimeframe(name)}
          />
          <Search onSearch={(search: string) => console.log(search)} searchValue="" placeholder="Search" />
          <ButtonOutlined gap="4px" width="fit-content">
            <Share2 fill="currentColor" size={14} />
            <Text>
              <Trans>Share</Trans>
            </Text>
          </ButtonOutlined>
          <ButtonOutlined gap="4px" width="fit-content">
            <Bell fill="currentColor" size={14} />
            <Text style={{ whiteSpace: 'nowrap' }}>
              <Trans>Set Alert</Trans>
            </Text>{' '}
          </ButtonOutlined>
        </RowFit>
      </RowBetween>
      <TokenAnalysisList />
    </>
  )
}
