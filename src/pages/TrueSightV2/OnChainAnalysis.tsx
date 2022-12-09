import { Trans } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined } from 'components/Button'
import Icon from 'components/Icons/Icon'
import { RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { useTokenAnalysisSettings } from 'state/user/hooks'

import { SectionDescription, SectionTitle, SectionWrapper } from './components'
import {
  HoldersChartWrapper,
  NetflowToCentralizedExchanges,
  NetflowToWhaleWallets,
  NumberofHolders,
  NumberofTradesChart,
  NumberofTransfers,
  TradingVolumeChart,
} from './components/chart'
import { Top10HoldersTable } from './components/table'

const Wrapper = styled.div`
  padding: 20px 0;
  width: 100%;
`

export default function OnChainAnalysis() {
  const theme = useTheme()
  const tokenAnalysisSettings = useTokenAnalysisSettings()

  return (
    <Wrapper>
      <SectionWrapper show={tokenAnalysisSettings?.numberOfTrades}>
        <SectionTitle>
          <Trans>Number of Trades / Type of Trade</Trans>
        </SectionTitle>
        <SectionDescription>
          <Trans>
            Indicates the number of trades and type of trades (buy or sell) over a time period. An increase in the
            number of trades may indicate more interest in the token and vice-versa. Similarly, more buy trades in a
            timeperiod can indicate that the token is bullish and vice-versa.
          </Trans>
        </SectionDescription>
        <NumberofTradesChart />
      </SectionWrapper>
      <SectionWrapper show={tokenAnalysisSettings?.tradingVolume}>
        <SectionTitle>
          <Trans>Trading Volume</Trans>
        </SectionTitle>
        <SectionDescription>
          <Trans>
            Indicates how many times a token changes hands in a given time frame. Its measured in $. Trading volume
            indicates interest in a token. The more people are buying and selling something, the higher the volume,
            which can drive even more interest in that token. Typically, high volume trading for a token can mean an
            increase in prices and low volume cryptocurrency could indicate prices falling.
          </Trans>
        </SectionDescription>
        <TradingVolumeChart />
      </SectionWrapper>
      <SectionWrapper show={tokenAnalysisSettings?.netflowToWhaleWallets}>
        <SectionTitle>
          <Trans>Netflow to Whale Wallets</Trans>
        </SectionTitle>
        <SectionDescription>
          <Trans>
            Netflow (Inflow - Outflow) of token to whale wallets. <span color={theme.primary}>Positive</span> netflow
            generally means that whales are buying. <span color={theme.red}>Negative</span> netflow generally means that
            whales are selling.
          </Trans>
        </SectionDescription>
        <NetflowToWhaleWallets />
      </SectionWrapper>
      <SectionWrapper show={tokenAnalysisSettings?.netflowToCEX}>
        <SectionTitle>
          <RowFit gap="6px">
            <ButtonOutlined gap="6px" width="fit-content" height="36px" baseColor={theme.primary}>
              Netflow
            </ButtonOutlined>
            <ButtonOutlined gap="6px" width="fit-content" height="36px" disabled>
              <Icon id="download" size={16} />
              Inflow
            </ButtonOutlined>
            <ButtonOutlined gap="6px" width="fit-content" height="36px" disabled>
              <Icon id="upload" size={16} />
              Outflow
            </ButtonOutlined>
            <Text>to Centralized Exchanges</Text>
          </RowFit>
        </SectionTitle>
        <SectionDescription>
          <Trans>
            Indicates on-chain transfer activity between wallets. High transfer activity indicates that more traders are
            transferring the token between wallets. Token with high transfer activity and high transfer volume
            mayindicate that traders are interested in it.
          </Trans>
        </SectionDescription>
        <NetflowToCentralizedExchanges />
      </SectionWrapper>
      <SectionWrapper show={tokenAnalysisSettings?.volumeOfTransfers}>
        <SectionTitle>
          <RowFit gap="6px">
            <ButtonOutlined gap="6px" width="fit-content" height="36px" baseColor={theme.primary}>
              Number
            </ButtonOutlined>
            <ButtonOutlined gap="6px" width="fit-content" height="36px" disabled>
              Volume ($)
            </ButtonOutlined>
            <Text>of Transfers</Text>
          </RowFit>
        </SectionTitle>
        <SectionDescription>
          <Trans>
            Indicates on-chain transfer activity between wallets. High transfer activity indicates that more traders are
            transferring the token between wallets. Token with high transfer activity and high transfer volume may
            indicate that traders are interested in it.
          </Trans>
        </SectionDescription>
        <NumberofTransfers />
      </SectionWrapper>
      <SectionWrapper show={tokenAnalysisSettings?.numberOfHolders}>
        <SectionTitle>
          <Trans>Number of Holders</Trans>
        </SectionTitle>
        <SectionDescription>
          <Trans>
            Indicates the number of addresses that hold a token. An increase in the number of holders may indicate more
            interest in the token and vice-versa. Number of holders may also indicate the distribution of thetoken. High
            number of holders may reduce the impact an individual (like a whale) can have on the price.
          </Trans>
        </SectionDescription>
        <NumberofHolders />
      </SectionWrapper>
      <SectionWrapper show={tokenAnalysisSettings?.top10Holders}>
        <SectionTitle>
          <Trans>Top 10 Holders</Trans>
        </SectionTitle>
        <Top10HoldersTable />
      </SectionWrapper>
      <SectionWrapper show={tokenAnalysisSettings?.top25Holders}>
        <SectionTitle>
          <Trans>Top 25 Holders</Trans>
        </SectionTitle>
        <HoldersChartWrapper />
      </SectionWrapper>
    </Wrapper>
  )
}
