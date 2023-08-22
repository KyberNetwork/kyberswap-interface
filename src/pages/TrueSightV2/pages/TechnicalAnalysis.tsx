import { Trans, t } from '@lingui/macro'
import { createContext, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import Row, { RowFit } from 'components/Row'
import Toggle from 'components/Toggle'
import { IChartingLibraryWidget } from 'components/TradingViewChart/charting_library/charting_library'
import { useTokenAnalysisSettings } from 'state/user/hooks'
import { isSupportLimitOrder } from 'utils'

import { SectionWrapper } from '../components'
import CexRekt from '../components/CexRekt'
import { LiquidOnCentralizedExchanges, Prochart } from '../components/chart'
import { DexTradesShareContent } from '../components/shareContent/DexTradesShareContent'
import FundingRateShareContent from '../components/shareContent/FundingRateShareContent'
import ProchartShareContent from '../components/shareContent/ProchartShareContent'
import SupportResistanceShareContent from '../components/shareContent/SupportResistanceShareContent'
import { FundingRateTable, LiveDEXTrades, SupportResistanceLevel } from '../components/table'
import { KYBERAI_CHART_ID, NETWORK_TO_CHAINID } from '../constants'
import { useChartingDataQuery } from '../hooks/useKyberAIData'
import useKyberAITokenOverview from '../hooks/useKyberAITokenOverview'
import { ChartTab, ISRLevel, OHLCData } from '../types'
import { navigateToLimitPage } from '../utils'
import { defaultExplorePageToken } from './SingleToken'

const Wrapper = styled.div`
  padding: 20px 0;
  width: 100%;
  position: relative;
`

type TechnicalAnalysisContextProps = {
  resolution?: string
  setResolution?: (r: string) => void
  SRLevels?: ISRLevel[]
  currentPrice?: number
  showSRLevels?: boolean
  isLoading?: boolean
}

function isSupport(arr: OHLCData[], i: number) {
  if (!arr[i + 1] || !arr[i + 2] || !arr[i - 1] || !arr[i - 2]) {
    return false
  }
  return (
    arr[i].low < arr[i + 1].low &&
    arr[i + 1].low < arr[i + 2].low &&
    arr[i].low < arr[i - 1].low &&
    arr[i - 1].low < arr[i - 2].low
  )
}
function isResistance(arr: OHLCData[], i: number) {
  if (!arr[i + 1] || !arr[i + 2] || !arr[i - 1] || !arr[i - 2]) {
    return false
  }
  return (
    arr[i].high > arr[i + 1].high &&
    arr[i + 1].high > arr[i + 2].high &&
    arr[i].high > arr[i - 1].high &&
    arr[i - 1].high > arr[i - 2].high
  )
}
function getAverageCandleSize(arr: OHLCData[]): number {
  let sum = 0
  for (let i = 0; i < 100; i++) {
    if (arr[i]) sum += arr[i].high - arr[i].low
  }
  return sum / 100
}

function closeToExistedValue(newvalue: number, arr: any[], range: number) {
  return arr.findIndex(v => Math.abs(v.value - newvalue) < range)
}

export const TechnicalAnalysisContext = createContext<TechnicalAnalysisContextProps>({})

export default function TechnicalAnalysis() {
  const theme = useTheme()
  const { chain, address } = useParams()
  const [tvWidget, setTvWidget] = useState<IChartingLibraryWidget | undefined>()
  const [prochartDataURL, setProchartDataURL] = useState<string | undefined>()
  const [liveChartTab, setLiveChartTab] = useState(ChartTab.First)
  const [showSRLevels, setShowSRLevels] = useState(true)
  const [priceChartResolution, setPriceChartResolution] = useState('1h')
  const now = Math.floor(Date.now() / 60000) * 60
  const { data, isLoading } = useChartingDataQuery({
    chain: chain || defaultExplorePageToken.chain,
    address: address || defaultExplorePageToken.address,
    from: now - ({ '1h': 1080000, '4h': 4320000, '1d': 12960000 }[priceChartResolution] || 1080000),
    to: now,
    candleSize: priceChartResolution,
    currency: liveChartTab === ChartTab.First ? 'USD' : 'BTC',
  })

  const { data: tokenOverview } = useKyberAITokenOverview()

  const SRLevels: ISRLevel[] = useMemo(() => {
    if (isLoading && !data) return []
    const levels: ISRLevel[] = []
    const average = getAverageCandleSize(data || [])
    data?.forEach((v, i, arr) => {
      if (!v) return
      if (isSupport(arr, i)) {
        let newValue = Math.min(v.open, v.close)
        const closeIndex = closeToExistedValue(newValue, levels, 2 * average)
        if (closeIndex > -1) {
          newValue = (newValue + levels[closeIndex].value) / 2
          levels.splice(closeIndex, 1)
        }
        levels.push({ timestamp: v.timestamp, value: newValue })
      } else if (isResistance(arr, i)) {
        let newValue = Math.max(v.open, v.close)
        const closeIndex = closeToExistedValue(newValue, levels, 2 * average)

        if (closeIndex > -1) {
          newValue = (newValue + levels[closeIndex].value) / 2
          levels.splice(closeIndex, 1)
        }
        levels.push({ timestamp: v.timestamp, value: newValue })
      }
    })
    return levels.slice(0, 8)
  }, [data, isLoading])

  const tokenAnalysisSettings = useTokenAnalysisSettings()

  const takeScreenShot = () => {
    if (!tvWidget) return
    try {
      tvWidget.takeClientScreenshot().then(res => {
        setProchartDataURL(res.toDataURL())
      })
    } catch (err) {
      console.log(err)
    }
  }
  return (
    <TechnicalAnalysisContext.Provider
      value={{
        resolution: priceChartResolution,
        setResolution: setPriceChartResolution,
        SRLevels,
        currentPrice: data?.[0]?.close,
        showSRLevels,
        isLoading,
      }}
    >
      <Wrapper>
        <SectionWrapper
          show={tokenAnalysisSettings?.liveCharts}
          fullscreenButton
          tabs={[`${tokenOverview?.symbol?.toUpperCase()}/USD`, `${tokenOverview?.symbol?.toUpperCase()}/BTC`]}
          activeTab={liveChartTab}
          onTabClick={setLiveChartTab}
          style={{ height: '800px' }}
          subTitle={
            <RowFit gap="8px">
              <Text fontSize="14px" fontStyle="initial">
                <Trans>Support / Resistance Levels</Trans>
              </Text>
              <Toggle isActive={showSRLevels} toggle={() => setShowSRLevels(prev => !prev)} />
            </RowFit>
          }
          shareContent={() => (
            <ProchartShareContent
              title={`${tokenOverview?.symbol?.toUpperCase()}/${liveChartTab === ChartTab.First ? 'USD' : 'BTC'}`}
              dataUrl={prochartDataURL}
            />
          )}
          onShareClick={takeScreenShot}
          docsLinks={['https://docs.kyberswap.com/kyberswap-solutions/kyberai/technical-indicators/live-charts']}
        >
          <Prochart isBTC={liveChartTab === ChartTab.Second} tvWidget={tvWidget} setTvWidget={setTvWidget} />
        </SectionWrapper>
        <SectionWrapper
          show={tokenAnalysisSettings?.supportResistanceLevels}
          title={t`Support & Resistance Levels`}
          subTitle={t`Note: These are estimated support / resistance levels only and should not be considered as financial advice`}
          description={
            <Trans>
              <Text as="span" color={theme.primary}>
                Support level
              </Text>{' '}
              is where the price of a token normally stops falling and bounces back from.{' '}
              <Text as="span" color={theme.red}>
                Resistance level
              </Text>{' '}
              is where the price of a token normally stops rising and dips back down.{' '}
              <Text as="span" color={theme.primary}>
                Support
              </Text>{' '}
              and{' '}
              <Text as="span" color={theme.red}>
                Resistance
              </Text>{' '}
              levels may vary depending on the timeframe you&apos;re looking at.
            </Trans>
          }
          style={{ height: 'fit-content' }}
          shareContent={mobileMode => (
            <SupportResistanceShareContent dataUrl={prochartDataURL} mobileMode={mobileMode} />
          )}
          onShareClick={takeScreenShot}
          docsLinks={[
            'https://docs.kyberswap.com/kyberswap-solutions/kyberai/technical-indicators/support-and-resistance-levels',
          ]}
        >
          <SupportResistanceLevel />
          {chain && isSupportLimitOrder(NETWORK_TO_CHAINID[chain]) && (
            <Row justify="flex-end">
              <ButtonPrimary width="fit-content" onClick={() => navigateToLimitPage({ address, chain })}>
                <Text color={theme.textReverse} fontSize="14px" lineHeight="20px">
                  <RowFit gap="4px">
                    <Icon id="chart" size={16} /> Place Limit Order
                  </RowFit>
                </Text>
              </ButtonPrimary>
            </Row>
          )}
        </SectionWrapper>
        <SectionWrapper
          show={tokenAnalysisSettings?.liveDEXTrades}
          title={t`Live Trades`}
          subTitle={t`Note:  Live trades may be slightly delayed`}
          style={{ height: 'fit-content' }}
          shareContent={mobileMode => <DexTradesShareContent mobileMode={mobileMode} />}
          docsLinks={['https://docs.kyberswap.com/kyberswap-solutions/kyberai/technical-indicators/live-trades']}
        >
          <LiveDEXTrades />
        </SectionWrapper>
        <SectionWrapper
          show={tokenAnalysisSettings?.fundingRateOnCEX}
          id={'fundingrate'}
          title={t`Funding Rate on Centralized Exchanges`}
          description={
            <Trans>
              Funding rate is useful in identifying short-term trends.{' '}
              <Text as="span" color={theme.primary}>
                Positive funding rates
              </Text>{' '}
              suggests traders are{' '}
              <Text as="span" color={theme.primary}>
                bullish
              </Text>
              . Extremely positive funding rates may result in long positions getting squeezed.{' '}
              <Text as="span" color={theme.red}>
                Negative funding rates
              </Text>{' '}
              suggests traders are{' '}
              <Text as="span" color={theme.red}>
                bearish
              </Text>
              . Extremely negative funding rates may result in short positions getting squeezed.
            </Trans>
          }
          style={{ height: 'fit-content' }}
          shareContent={mobileMode => <FundingRateShareContent mobileMode={mobileMode} />}
          onShareClick={takeScreenShot}
          docsLinks={[
            'https://docs.kyberswap.com/kyberswap-solutions/kyberai/technical-indicators/funding-rate-on-cex',
          ]}
        >
          <FundingRateTable />
        </SectionWrapper>
        <SectionWrapper
          id={KYBERAI_CHART_ID.LIQUID_ON_CEX}
          show={tokenAnalysisSettings?.liquidationsOnCEX}
          title={t`Liquidations on Centralized Exchanges`}
          description={`Liquidations describe the forced closing of a trader's futures position due to the partial or total loss
          of their collateral. This happens when a trader has insufficient funds to keep a leveraged trade
          open. Leveraged trading is high risk & high reward. The higher the leverage, the easier it is for a trader to
          get liquidated. An abrupt change in price of a token can cause large liquidations. Traders may buy / sell the
          token after large liquidations.`}
          style={{ height: 'fit-content' }}
          fullscreenButton
          shareContent={() => (
            <Column style={{ height: '400px', width: '100%' }}>
              <LiquidOnCentralizedExchanges noAnimation />
            </Column>
          )}
          docsLinks={[
            'https://docs.kyberswap.com/kyberswap-solutions/kyberai/technical-indicators/liquidations-on-cex',
          ]}
        >
          <Column style={{ height: '500px' }}>
            <LiquidOnCentralizedExchanges />
          </Column>
          <CexRekt />
        </SectionWrapper>
      </Wrapper>
    </TechnicalAnalysisContext.Provider>
  )
}
