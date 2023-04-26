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
import { Top10HoldersTable } from '../components/table'
import { ChartTab } from '../types'

const Wrapper = styled.div`
  padding: 20px 0;
  width: 100%;
`

export default function OnChainAnalysis({ onShareClick }: { onShareClick: (url: string) => void }) {
  const theme = useTheme()
  const [netflowToWhaleWallets, setNetflowToWhaleWallets] = useState<ChartTab>(ChartTab.First)
  const [netflowToCEX, setNetflowToCEX] = useState<ChartTab>(ChartTab.First)
  const [numberOfTransfers, setNumberOfTransfers] = useState<ChartTab>(ChartTab.First)
  const tokenAnalysisSettings = useTokenAnalysisSettings()
  useEffect(() => {
    if (!window.location.hash) return
    document.getElementById(window.location.hash.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' })
  }, [])
  const handleShareClick = (tag?: string) => {
    const { origin, pathname, search } = window.location
    onShareClick(origin + pathname + search + (!!tag ? `#${tag}` : ''))
  }

  return (
    <Wrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.numberOfTrades}
        id="numberoftrades"
        title={t`Number of Trades & Type of Trades`}
        description={t`Indicates the number of trades and type of trades (buy or sell) over a time period. An increase in the
        number of trades may indicate more interest in the token and vice-versa. Similarly, more buy trades in a
        timeperiod can indicate that the token is bullish and vice-versa.`}
        shareButton
        fullscreenButton
        onShareClick={handleShareClick}
      >
        <NumberofTradesChart />
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.tradingVolume}
        id="tradingvolume"
        title={t`Trading Volume`}
        description={t`Indicates how many times a token changes hands in a given time frame. Its measured in $. Trading volume
      indicates interest in a token. The more people are buying and selling something, the higher the volume,
      which can drive even more interest in that token. Typically, high volume trading for a token can mean an
      increase in prices and low volume cryptocurrency could indicate prices falling.`}
        shareButton
        fullscreenButton
        onShareClick={handleShareClick}
      >
        <TradingVolumeChart />
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.netflowToWhaleWallets}
        id={'netflowwhalewallets'}
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
        shareButton
        fullscreenButton
        onShareClick={handleShareClick}
        tabs={[t`Netflow`, t`Inflow`, t`Outflow`]}
        activeTab={netflowToWhaleWallets}
        onTabClick={setNetflowToWhaleWallets}
      >
        <RequireConnectWalletWrapper chartType={1} tab={netflowToWhaleWallets}>
          <NetflowToWhaleWallets tab={netflowToWhaleWallets} />
        </RequireConnectWalletWrapper>
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.netflowToCEX}
        id={'netflowtocex'}
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
        shareButton
        fullscreenButton
        onShareClick={handleShareClick}
        tabs={[t`Netflow`, t`Inflow`, t`Outflow`]}
        activeTab={netflowToCEX}
        onTabClick={setNetflowToCEX}
      >
        <RequireConnectWalletWrapper chartType={1} tab={netflowToCEX}>
          <NetflowToCentralizedExchanges tab={netflowToCEX} />
        </RequireConnectWalletWrapper>
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.volumeOfTransfers}
        title={'of Transfers'}
        description={t`Indicates on-chain transfer activity between wallets. High transfer activity indicates that more traders are transferring the token between wallets. Token with high transfer activity and high transfer volume may indicate that traders are interested in it.`}
        id="numberoftransfers"
        shareButton
        fullscreenButton
        onShareClick={handleShareClick}
        tabs={[t`Number`, t`Volume`]}
        activeTab={numberOfTransfers}
        onTabClick={setNumberOfTransfers}
      >
        <RequireConnectWalletWrapper chartType={2} tab={numberOfTransfers}>
          <NumberofTransfers tab={numberOfTransfers} />
        </RequireConnectWalletWrapper>
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.numberOfHolders}
        title={t`Number of Holders`}
        description={t`Indicates the number of addresses that hold a token. An increase in the number of holders may indicate more interest in the token and vice-versa. Number of holders may also indicate the distribution of the token. High number of holders may reduce the impact an individual (like a whale) can have on the price.`}
        id="numberofholders"
        shareButton
        fullscreenButton
        onShareClick={handleShareClick}
      >
        <RequireConnectWalletWrapper chartType={2} tab={ChartTab.First}>
          <NumberofHolders />
        </RequireConnectWalletWrapper>
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.top10Holders}
        title={t`Top 10 Holders`}
        id="top10holders"
        shareButton
        onShareClick={handleShareClick}
        style={{ height: 'fit-content' }}
      >
        <RequireConnectWalletWrapper height="800px">
          <Top10HoldersTable />
        </RequireConnectWalletWrapper>
      </SectionWrapper>
      <SectionWrapper
        show={tokenAnalysisSettings?.top25Holders}
        title={t`Top 25 Holders`}
        id="top25holders"
        shareButton
        onShareClick={handleShareClick}
        style={{ height: '450px' }}
      >
        <RequireConnectWalletWrapper>
          <HoldersChartWrapper />
        </RequireConnectWalletWrapper>
      </SectionWrapper>
    </Wrapper>
  )
}
