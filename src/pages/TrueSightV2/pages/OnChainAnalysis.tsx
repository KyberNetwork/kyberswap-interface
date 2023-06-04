import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { useTokenAnalysisSettings } from 'state/user/hooks'

import { SectionWrapper } from '../components'
import RequireConnectWalletWrapper from '../components/RequireConnectWallet'
import {
  HoldersChartWrapper,
  NetflowToCentralizedExchanges,
  NetflowToWhaleWallets,
  NumberofHolders,
  NumberofTradesChart,
  NumberofTransfers,
  TradingVolumeChart,
} from '../components/chart'
import { Top10HoldersShareContent } from '../components/shareContent/Top10HoldersShareContent'
import { Top10HoldersTable } from '../components/table'
import { KYBERAI_CHART_ID } from '../constants'
import { useChartNoData } from '../hooks/useChartStatesReducer'
import { ChartTab } from '../types'

const Wrapper = styled.div`
  padding: 20px 0;
  width: 100%;
`

export default function OnChainAnalysis() {
  const theme = useTheme()
  const [netflowToWhaleWallets, setNetflowToWhaleWallets] = useState<ChartTab>(ChartTab.First)
  const [netflowToCEX, setNetflowToCEX] = useState<ChartTab>(ChartTab.First)
  const [numberOfTransfers, setNumberOfTransfers] = useState<ChartTab>(ChartTab.First)
  const tokenAnalysisSettings = useTokenAnalysisSettings()

  const numberOfTradesNodata = useChartNoData(KYBERAI_CHART_ID.NUMBER_OF_TRADES)
  const tradingVolumeNodata = useChartNoData(KYBERAI_CHART_ID.TRADING_VOLUME)
  const netflowToWhaleWalletNodata = useChartNoData(KYBERAI_CHART_ID.NETFLOW_TO_WHALE_WALLET)
  const netflowToCEXNodata = useChartNoData(KYBERAI_CHART_ID.NETFLOW_TO_CEX)
  const numberOfTranfersNodata = useChartNoData(KYBERAI_CHART_ID.NUMBER_OF_TRANSFERS)
  const numberOfHoldersNodata = useChartNoData(KYBERAI_CHART_ID.NUMBER_OF_HOLDERS)
  const holderPieChartNodata = useChartNoData(KYBERAI_CHART_ID.HOLDER_PIE_CHART)

  useEffect(() => {
    if (!window.location.hash) return
    document.getElementById(window.location.hash.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <Wrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.numberOfTrades}
        id={KYBERAI_CHART_ID.NUMBER_OF_TRADES}
        title={t`Number of Trades & Type of Trades`}
        description={t`Indicates the number of trades and type of trades (buy or sell) over a time period. An increase in the
        number of trades may indicate more interest in the token and vice-versa. Similarly, more buy trades in a
        time period can indicate that the token is bullish and vice-versa.`}
        fullscreenButton
        shareContent={numberOfTradesNodata ? undefined : () => <NumberofTradesChart noAnimation />}
        docsLinks={['https://docs.kyberswap.com/kyberswap-solutions/kyberai/on-chain-indicators/number-of-trades']}
      >
        <NumberofTradesChart />
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.tradingVolume}
        id={KYBERAI_CHART_ID.TRADING_VOLUME}
        title={t`Trading Volume`}
        description={t`Indicates how many times a token changes hands in a given time frame. Its measured in $. Trading volume
      indicates interest in a token. The more people are buying and selling something, the higher the volume,
      which can drive even more interest in that token. Typically, high volume trading for a token can mean an
      increase in prices and low volume cryptocurrency could indicate prices falling.`}
        fullscreenButton
        shareContent={tradingVolumeNodata ? undefined : () => <TradingVolumeChart noAnimation />}
        docsLinks={['https://docs.kyberswap.com/kyberswap-solutions/kyberai/on-chain-indicators/trading-volume']}
      >
        <TradingVolumeChart />
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.netflowToWhaleWallets}
        id={KYBERAI_CHART_ID.NETFLOW_TO_WHALE_WALLET}
        title={t`to Whale Wallets`}
        description={
          <Trans>
            Netflow (Inflow - Outflow) of token to whale wallets (
            <MouseoverTooltip text={t`Wallets with more than $5m in assets across multiple chains`} placement="top">
              <Text color={theme.text} style={{ borderBottom: '1px dotted' }}>
                General Whales
              </Text>
            </MouseoverTooltip>{' '}
            and{' '}
            <MouseoverTooltip
              text={t`Wallets which hold 1% or more of the circulating supply of this token`}
              placement="top"
            >
              <Text color={theme.text} style={{ borderBottom: '1px dotted' }}>
                Token Whales
              </Text>
            </MouseoverTooltip>
            ).{' '}
            <Text color={theme.primary} as="span">
              Positive netflow
            </Text>{' '}
            generally means that whales are buying.{' '}
            <Text color={theme.red} as="span">
              Negative netflow
            </Text>{' '}
            generally means that whales are selling.
          </Trans>
        }
        shareContent={
          netflowToWhaleWalletNodata
            ? undefined
            : () => <NetflowToWhaleWallets tab={netflowToWhaleWallets} noAnimation />
        }
        fullscreenButton
        tabs={[t`Netflow`, t`Inflow`, t`Outflow`]}
        activeTab={netflowToWhaleWallets}
        onTabClick={setNetflowToWhaleWallets}
        docsLinks={[
          'https://docs.kyberswap.com/kyberswap-solutions/kyberai/on-chain-indicators/netflow-to-whale-wallets',
        ]}
      >
        <RequireConnectWalletWrapper chartType={1} tab={netflowToWhaleWallets}>
          <NetflowToWhaleWallets tab={netflowToWhaleWallets} />
        </RequireConnectWalletWrapper>
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.netflowToCEX}
        id={KYBERAI_CHART_ID.NETFLOW_TO_CEX}
        title={t`to Centralized Exchanges`}
        description={
          <Trans>
            Netflow (Inflow - Outflow) of token to centralized exchanges.{' '}
            <Text color={theme.primary} as="span">
              Positive netflow
            </Text>{' '}
            means that more traders are depositing tokens than withdrawing, most likely for selling.{' '}
            <Text color={theme.red} as="span">
              Negative netflow
            </Text>{' '}
            means that more traders are withdrawing tokens than depositing, most likely for holding or staking.
          </Trans>
        }
        shareContent={
          netflowToCEXNodata ? undefined : () => <NetflowToCentralizedExchanges tab={netflowToCEX} noAnimation />
        }
        fullscreenButton
        tabs={[t`Netflow`, t`Inflow`, t`Outflow`]}
        activeTab={netflowToCEX}
        onTabClick={setNetflowToCEX}
        docsLinks={['https://docs.kyberswap.com/kyberswap-solutions/kyberai/on-chain-indicators/netflow-to-cex']}
      >
        <RequireConnectWalletWrapper chartType={1} tab={netflowToCEX}>
          <NetflowToCentralizedExchanges tab={netflowToCEX} />
        </RequireConnectWalletWrapper>
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.volumeOfTransfers}
        title={'of Transfers'}
        description={t`Indicates on-chain transfer activity between wallets. High transfer activity indicates that more traders are transferring the token between wallets. Token with high transfer activity and high transfer volume may indicate that traders are interested in it.`}
        id={KYBERAI_CHART_ID.NUMBER_OF_TRANSFERS}
        shareContent={numberOfTranfersNodata ? undefined : () => <NumberofTransfers tab={numberOfTransfers} />}
        fullscreenButton
        tabs={[t`Number`, t`Volume`]}
        activeTab={numberOfTransfers}
        onTabClick={setNumberOfTransfers}
        docsLinks={[
          'https://docs.kyberswap.com/kyberswap-solutions/kyberai/on-chain-indicators/number-of-transfers',
          'https://docs.kyberswap.com/kyberswap-solutions/kyberai/on-chain-indicators/volume-of-transfers',
        ]}
      >
        <RequireConnectWalletWrapper chartType={2} tab={numberOfTransfers}>
          <NumberofTransfers tab={numberOfTransfers} />
        </RequireConnectWalletWrapper>
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.numberOfHolders}
        title={t`Number of Holders`}
        description={t`Indicates the number of addresses that hold a token. An increase in the number of holders may indicate more interest in the token and vice-versa. Number of holders may also indicate the distribution of the token. High number of holders may reduce the impact an individual (like a whale) can have on the price.`}
        id={KYBERAI_CHART_ID.NUMBER_OF_HOLDERS}
        shareContent={numberOfHoldersNodata ? undefined : () => <NumberofHolders />}
        fullscreenButton
        docsLinks={['https://docs.kyberswap.com/kyberswap-solutions/kyberai/on-chain-indicators/number-of-holders']}
      >
        <RequireConnectWalletWrapper chartType={2} tab={ChartTab.First}>
          <NumberofHolders />
        </RequireConnectWalletWrapper>
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.top10Holders}
        title={t`Top 10 Holders`}
        id="top10holders"
        style={{ height: 'fit-content' }}
        shareContent={
          holderPieChartNodata ? undefined : mobileMode => <Top10HoldersShareContent mobileMode={mobileMode} />
        }
        docsLinks={['https://docs.kyberswap.com/kyberswap-solutions/kyberai/on-chain-indicators/top-holders']}
      >
        <RequireConnectWalletWrapper height="800px">
          <Top10HoldersTable />
        </RequireConnectWalletWrapper>
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.top25Holders}
        title={t`Top 25 Holders`}
        id="top25holders"
        shareContent={holderPieChartNodata ? undefined : () => <HoldersChartWrapper noAnimation />}
        style={{ height: '450px' }}
        docsLinks={['https://docs.kyberswap.com/kyberswap-solutions/kyberai/on-chain-indicators/top-holders']}
      >
        <RequireConnectWalletWrapper>
          <HoldersChartWrapper />
        </RequireConnectWalletWrapper>
      </SectionWrapper>
    </Wrapper>
  )
}
