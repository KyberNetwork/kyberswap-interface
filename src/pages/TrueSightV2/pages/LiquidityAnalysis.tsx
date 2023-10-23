import { t } from '@lingui/macro'
import styled from 'styled-components'

import { useTokenAnalysisSettings } from 'state/user/hooks'

import { SectionWrapper } from '../components'
import { LiquidityProfile } from '../components/chart'
import { LiquidityMarkets } from '../components/table'
import { KYBERAI_CHART_ID } from '../constants'

const Wrapper = styled.div`
  padding: 20px 0;
  width: 100%;
`

export default function LiquidityAnalysis() {
  const tokenAnalysisSettings = useTokenAnalysisSettings()
  return (
    <Wrapper>
      {/* In development */}
      {/* <SectionWrapper
        show={tokenAnalysisSettings?.liquidityProfile}
        id={KYBERAI_CHART_ID.LIQUIDITY_PROFILE}
        title={t`Liquidity Profile`}
        description={t`Liquidity profile indicates how the price of a token will be affected by an order. You can now visualize the on-chain liquidity of a token and the impact to price based on different trade sizes. Higher the liquidity, lower the effect on the token price.`}
        fullscreenButton
        // shareContent={numberOfTradesNodata ? undefined : () => <NumberofTradesChart noAnimation />}
        docsLinks={[]}
      >
        <LiquidityProfile />
      </SectionWrapper> */}
      <SectionWrapper
        show={tokenAnalysisSettings?.markets}
        id={KYBERAI_CHART_ID.MARKETS}
        title={t`Markets`}
        description={t`View all centralizeds and de-centralized markets on which the token can be traded.`}
        fullscreenButton
        // shareContent={numberOfTradesNodata ? undefined : () => <NumberofTradesChart noAnimation />}
        docsLinks={[]}
        style={{ height: 'fit-content' }}
      >
        <LiquidityMarkets />
      </SectionWrapper>
    </Wrapper>
  )
}
