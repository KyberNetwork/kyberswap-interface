import { Trans } from '@lingui/macro'
import styled, { useTheme } from 'styled-components'

import { ButtonOutlined } from 'components/Button'
import { RowFit } from 'components/Row'

import { SectionDescription, SectionTitle } from './components'

const Wrapper = styled.div`
  padding: 20px 0;
  width: 100%;
`

export default function TechnicalAnalysis() {
  const theme = useTheme()
  return (
    <Wrapper>
      <RowFit>
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
          Funding rate is useful in identifying short-term trends. Positive funding rates suggests traders are bullish.
          Extremely positive funding rates may result in long positions getting squeezed. Negative funding rates
          suggests traders are bearish. Extremely negative funding rates may result in short positions getting squeezed.
        </Trans>
      </SectionDescription>

      <SectionTitle>
        <Trans>Live DEX Trades</Trans>
      </SectionTitle>
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
    </Wrapper>
  )
}
