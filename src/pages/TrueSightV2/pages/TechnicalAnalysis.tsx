import { t } from '@lingui/macro'
import { useState } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Row from 'components/Row'

import { SectionWrapper } from '../components'
import { LiquidOnCentralizedExchanges } from '../components/chart'
import { FundingRateTable, LiveDEXTrades, SupportResistanceLevel } from '../components/table'
import { ChartTab } from '../types'

const Wrapper = styled.div`
  padding: 20px 0;
  width: 100%;
`

const Card = styled.div`
  padding: 20px;
  border-radius: 16px;
  height: 104px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;

  background: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.text};
`

export default function TechnicalAnalysis() {
  const theme = useTheme()
  const above768 = useMedia('(min-width:768px)')
  const [liveChartTab, setLiveChartTab] = useState(ChartTab.First)
  return (
    <Wrapper>
      <SectionWrapper
        show={true}
        fullscreenButton
        tabs={[`BTC/USD`, `BTC/BTC`]}
        activeTab={liveChartTab}
        onTabClick={setLiveChartTab}
      ></SectionWrapper>
      <SectionWrapper
        show={true}
        title={t`Support & Resistance Levels`}
        description={t`Support level is where the price of a token normally stops falling and bounces back from. Resistance level is where the price of a token normally stops rising and dips back down. Support and resistance levels may vary depending on the timeframe you’re looking at. `}
        style={{ height: 'fit-content' }}
      >
        <SupportResistanceLevel />
        <Row justify="flex-end">
          <ButtonPrimary width="fit-content">Place Limit Order</ButtonPrimary>
        </Row>
      </SectionWrapper>
      <SectionWrapper
        show={true}
        id={'fundingrate'}
        title={t`Funding Rate on Centralized Exchanges`}
        description={t`Funding rate is useful in identifying short-term trends.
        <span style={{ color: ${theme.primary}, fontStyle: 'italic' }}>Positive</span> funding rates suggests traders are
        bullish. Extremely positive funding rates may result in long positions getting squeezed. Negative funding
        rates suggests traders are bearish. Extremely negative funding rates may result in short positions getting
        squeezed.`}
        style={{ height: 'fit-content' }}
      >
        <FundingRateTable />
      </SectionWrapper>
      <SectionWrapper title={t`Live Trades`} style={{ height: 'fit-content' }}>
        <LiveDEXTrades />
      </SectionWrapper>
      <SectionWrapper
        title={t`Liquidations on Centralized Exchanges`}
        description={t`Liquidations describe the forced closing of a trader&apos;s futures position due to the partial or total loss
          of their collateral. This happens when a trader has insufficient funds to keep a leveraged trade
          open.Leverated trading is high risk & high reward. The higher the leverage, the easier it is for a trader to
          get liquidated. An abrupt change in price of a token can cause large liquidations. Traders may buy / sell the
          token after large liquidations.`}
      >
        <LiquidOnCentralizedExchanges style={{ marginBottom: '24px' }} />
        <Row gap="24px" flexDirection={above768 ? 'row' : 'column'} align="stretch">
          <Card>
            <Text fontSize={14}>4H Rekt</Text>
            <Text fontSize={28}>$352.03K</Text>
          </Card>
          <Card>
            <Text fontSize={14}>12H Rekt</Text>
            <Text fontSize={28}>$2.67M</Text>
          </Card>
          <Card>
            <Text fontSize={14}>24H Rekt</Text>
            <Text fontSize={28}>$8.82M</Text>
          </Card>
        </Row>
      </SectionWrapper>
    </Wrapper>
  )
}
