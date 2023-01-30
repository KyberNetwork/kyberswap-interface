import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'

import { ButtonOutlined } from 'components/Button'
import Row, { RowFit } from 'components/Row'

import { SectionDescription, SectionTitle } from '../components'
import { LiquidOnCentralizedExchanges } from '../components/chart'
import { FundingRateTable, LiveDEXTrades } from '../components/table'

const Wrapper = styled.div`
  padding: 20px 0;
  width: 100%;
`

const Card = styled.div`
  padding: 20px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.border};
  height: 104px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;

  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`

export default function TechnicalAnalysis() {
  const theme = useTheme()
  const above768 = useMedia('(min-width:768px)')
  return (
    <Wrapper>
      <RowFit gap="8px">
        <ButtonOutlined width="fit-content" height="36px" baseColor={theme.primary}>
          BTC / USD
        </ButtonOutlined>
        <ButtonOutlined width="fit-content" height="36px" baseColor={theme.border}>
          BTC / BTC
        </ButtonOutlined>
      </RowFit>
      <SectionTitle>
        <Trans>Funding Rate on Centralized Exchanges</Trans>
      </SectionTitle>
      <SectionDescription>
        <Trans>
          Funding rate is useful in identifying short-term trends.{' '}
          <span style={{ color: theme.primary, fontStyle: 'italic' }}>Positive</span> funding rates suggests traders are
          bullish. Extremely positive funding rates may result in long positions getting squeezed. Negative funding
          rates suggests traders are bearish. Extremely negative funding rates may result in short positions getting
          squeezed.
        </Trans>
      </SectionDescription>
      <FundingRateTable />
      <SectionTitle>
        <Trans>Live DEX Trades</Trans>
      </SectionTitle>
      <LiveDEXTrades />
      <SectionTitle>
        <Trans>Liquidations on Centralized Exchanges</Trans>
      </SectionTitle>
      <SectionDescription>
        <Trans>
          Liquidations describe the forced closing of a trader&apos;s futures position due to the partial or total loss
          of their collateral. This happens when a trader has insufficient funds to keep a leveraged trade
          open.Leverated trading is high risk & high reward. The higher the leverage, the easier it is for a trader to
          get liquidated. An abrupt change in price of a token can cause large liquidations. Traders may buy / sell the
          token after large liquidations.
        </Trans>
      </SectionDescription>
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
    </Wrapper>
  )
}
