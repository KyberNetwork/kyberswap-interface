import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Box, Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight, ButtonOutlined } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Icon from 'components/Icons/Icon'
import { RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'

import HoldersPieChart from './HoldersPieChart'
import LineChart from './LineChart'
import StackedBarChart from './StackedBarChart'
import chartsvg from './chart.svg'

const Wrapper = styled.div`
  padding: 20px 0;
  width: 100%;
`
const SectionTitle = styled.div`
  font-size: 16px;
  line-height: 20px;
  margin-bottom: 12px;
  margin-top: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`
const SectionDescription = styled.div`
  font-size: 12px;
  line-height: 16px;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.subText};
`
const TableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border-radius: 20px;
  overflow: hidden;
  padding: 0;
  font-size: 12px;
  margin-bottom: 40px;
`

const gridTemplateColumns = '3fr 1fr 1fr 1fr 1fr'
const TableHeader = styled.div`
  display: grid;
  grid-template-columns: ${gridTemplateColumns};
  align-items: center;
  height: 48px;
  text-transform: uppercase;

  ${({ theme }) => css`
    background-color: ${theme.tableHeader};
    color: ${theme.subText};
  `};

  & > *:last-child {
    justify-content: end;
  }
`
const TableRow = styled(TableHeader)`
  height: 72px;
  font-size: 14px;
  ${({ theme }) => css`
    background-color: ${theme.background};
    color: ${theme.text};
    border-bottom: 1px solid ${theme.border};
  `};
`
const TableCell = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 4px;
`

const ActionButton = styled(ButtonLight)<{ color: string }>`
  display: flex;
  align-items: center;
  height: 28px;
  width: 28px;

  ${({ theme, color }) => css`
    color: ${color || theme.primary};
    background-color: ${color ? rgba(color, 0.2) : rgba(theme.primary, 0.2)};
  `}
`
const ChartWrapper = styled.div`
  padding: 10px 0;
  border-radius: 20px;
  height: 400px;
  ${({ theme }) => `background-color: ${theme.background};`}
`
export default function OnChainAnalysis() {
  const theme = useTheme()
  return (
    <Wrapper>
      <SectionTitle>
        <Trans>Number of Trades / Type of Trade</Trans>
      </SectionTitle>
      <SectionDescription>
        <Trans>
          Indicates the number of trades and type of trades (buy or sell) over a time period. An increase in the number
          of trades may indicate more interest in the token and vice-versa. Similarly, more buy trades in a timeperiod
          can indicate that the token is bullish and vice-versa.
        </Trans>
      </SectionDescription>
      <ChartWrapper>
        <StackedBarChart />
      </ChartWrapper>
      <SectionTitle>
        <Trans>Trading Volume</Trans>
      </SectionTitle>
      <SectionDescription>
        <Trans>
          Indicates how many times a token changes hands in a given time frame. Its measured in $. Trading volume
          indicates interest in a token. The more people are buying and selling something, the higher the volume, which
          can drive even more interest in that token. Typically, high volume trading for a token can mean an increase in
          prices and low volume cryptocurrency could indicate prices falling.
        </Trans>
      </SectionDescription>
      <ChartWrapper>
        <LineChart />
      </ChartWrapper>
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
      <ChartWrapper>
        <StackedBarChart />
      </ChartWrapper>
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
          transferring the token between wallets. Token with high transfer activity and high transfer volume mayindicate
          that traders are interested in it.
        </Trans>
      </SectionDescription>
      <ChartWrapper>
        <StackedBarChart />
      </ChartWrapper>
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
      <ChartWrapper>
        <LineChart />
      </ChartWrapper>
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
      <ChartWrapper>
        <LineChart />
      </ChartWrapper>
      <SectionTitle>
        <Trans>Top 10 Holders</Trans>
      </SectionTitle>
      <TableWrapper>
        <TableHeader>
          <TableCell>Address</TableCell>
          <TableCell>Supply owned</TableCell>
          <TableCell>Amount held</TableCell>
          <TableCell>AVG AQUISITION PRICE</TableCell>
          <TableCell>Action</TableCell>
        </TableHeader>
        {[...Array(10)].map((_, i) => (
          <TableRow key={i}>
            <TableCell>0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651</TableCell>
            <TableCell>75.26%</TableCell>
            <TableCell>1,000,0000</TableCell>
            <TableCell>
              <AutoColumn gap="4px">
                <Text>$1.2</Text>
                <Text fontSize={12} color={theme.primary}>
                  +20.23%
                </Text>
              </AutoColumn>
            </TableCell>
            <TableCell>
              <RowFit gap="8px">
                <ActionButton color={theme.subText}>
                  <Icon id="copy" size={16} />
                </ActionButton>
                <ActionButton color={theme.subText}>
                  <Icon id="open-link" size={16} />
                </ActionButton>
              </RowFit>
            </TableCell>
          </TableRow>
        ))}
      </TableWrapper>
      <SectionTitle>
        <Trans>Top 25 Holders</Trans>
      </SectionTitle>
      <ChartWrapper>
        <HoldersPieChart />
      </ChartWrapper>
    </Wrapper>
  )
}
