import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { useGetRaffleCampaignStatsQuery } from 'services/campaignRaffle'
import styled from 'styled-components'

import { isRaffleStarted } from 'pages/Campaign/constants'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import { StyledTable, TableWrapper, Td, Th, Tr } from './styles'
import { CampaignContent, FaqItem } from './types'

const Quote = styled('div')`
  position: relative;
  margin: 0px;
  margin-left: 40px;
  &::before {
    content: '';
    background-color: #a9a9a9a9;
    width: 2px;
    position: absolute;
    left: -12px;
    top: 6px;
    bottom: 6px;
  }
`

const raffleRewardSteps: { step: ReactNode; example: ReactNode }[] = [
  {
    step: (
      <>
        <Text as="span" fontWeight="500">
          <Trans>Step 1:</Trans>
        </Text>{' '}
        <Trans>Take the last 4 hex digits from each eligible transaction hash.</Trans>
      </>
    ),
    example: (
      <>
        <Trans>Assume only 2 eligible transaction hashes:</Trans>
        <ul style={{ margin: 0 }}>
          <li>
            <Trans>Full hash #1: 0x...B987A5F → last 4 hex digits = 7A5F</Trans>
          </li>
          <li>
            <Trans>Full hash #2: 0x...D345555 → last 4 hex digits = 5555</Trans>
          </li>
        </ul>
      </>
    ),
  },
  {
    step: (
      <>
        <Text as="span" fontWeight="500">
          <Trans>Step 2:</Trans>
        </Text>{' '}
        <Trans>
          Take the last 4 hex digits of the Bitcoin block hash, mined closest after 23:59 UTC on 25/11 (Week 1) and
          02/12 (Week 2).
        </Trans>
      </>
    ),
    example: (
      <ul style={{ margin: 0 }}>
        <li>
          <Trans>
            Full Bitcoin hash #1: 0x000...C676B5E (mined at 00:01 UTC 11/11) → Selected. Last 4 digits: 6B5E.
          </Trans>
        </li>
        <li>
          <Trans>Full Bitcoin hash #2: 0x000...B987A5F (mined at 00:02 UTC 11/11) → Not selected</Trans>
        </li>
      </ul>
    ),
  },
  {
    step: (
      <>
        <Text as="span" fontWeight="500">
          <Trans>Step 3:</Trans>
        </Text>{' '}
        <Trans>Calculate the absolute numerical difference.</Trans>
      </>
    ),
    example: (
      <ul style={{ margin: 0 }}>
        <li>
          <Trans>Hash 1 difference: |7A5F - 6B5E| = 0x0F01 = 3,841 (decimal)</Trans>
        </li>
        <li>
          <Trans>Hash 2 difference: |5555 - 6B5E| = 0x1609 = 5,641 (decimal)</Trans>
        </li>
        <Trans>→ Hash 1 is chosen for promotional rewards.</Trans>
      </ul>
    ),
  },
]

const raffleTimeline = (
  <>
    <li>
      <Trans>Week 1: 00:00 19/11/2025 - 23:59 25/11/2025 UTC, 5,000 KNC</Trans>
    </li>
    <li>
      <Trans>Week 2: 00:00 26/11/2025 - 23:59 02/12/2025 UTC, 5,000 KNC</Trans>
    </li>
  </>
)

const RaffleTimeline = () => {
  const { data: campaignStats } = useGetRaffleCampaignStatsQuery(undefined, { skip: !isRaffleStarted })
  return (
    <>
      {campaignStats?.weeks.map((week, index) => {
        const startTime = dayjs.unix(week.start).utc().format('HH:mm DD/MM/YYYY')
        const endTime = dayjs.unix(week.end).utc().format('HH:mm DD/MM/YYYY')
        const reward = week.reward * 1
        return (
          <li key={index}>
            <Trans>
              Week {index + 1}: {startTime} - {endTime} UTC, {formatDisplayNumber(reward, { significantDigits: 6 })} KNC
              {`(~${formatDisplayNumber(reward * 0.3, { significantDigits: 6, style: 'currency' })})`}
            </Trans>
          </li>
        )
      })}
    </>
  )
}

const raffleRewards = (
  <>
    <Text color="white" fontWeight="500" marginBottom="8px">
      <Trans>Reward Allocation Mechanism</Trans>
    </Text>
    <li>
      <Trans>
        After the campaign period ends, KyberSwap will determine results using a{' '}
        <Text as="span" fontWeight="500">
          fully transparent, on-chain verifiable computation
        </Text>
        .
      </Trans>
    </li>
    <li>
      <Trans>
        The transaction hash whose last 4 hex digits have the{' '}
        <Text as="span" fontWeight="500">
          SMALLEST absolute numerical difference
        </Text>{' '}
        from the last 4 hex digits of the Bitcoin Block Hash mined closest after 23:59 UTC on 25/11 (Week 1) and 02/12
        (Week 2), will receive the promotional reward.
      </Trans>
      <Text as="span" display="block" fontStyle="italic">
        <Trans>
          Hex (often as hexadecimal) is a base-16 numbering system, 0-9 represent the same values as in decimal (0-9).
          <br />
          A-F represent decimal values 10-15.
        </Trans>
      </Text>
      <Text as="span" display="block">
        <Trans>For example:</Trans>
      </Text>
      <TableWrapper>
        <StyledTable>
          <thead>
            <Tr>
              <Th>
                <Trans>Step</Trans>
              </Th>
              <Th style={{ width: '66%' }}>
                <Trans>Example</Trans>
              </Th>
            </Tr>
          </thead>
          <tbody>
            {raffleRewardSteps.map((row, index) => (
              <Tr key={index}>
                <Td>{row.step}</Td>
                <Td>{row.example}</Td>
              </Tr>
            ))}
          </tbody>
        </StyledTable>
      </TableWrapper>
    </li>
    <li style={{ marginTop: '8px' }}>
      <Trans>Note:</Trans>
      <ul style={{ margin: 0 }}>
        <li>
          <Trans>
            All data used in this process (transaction hashes and Bitcoin block hash) are publicly verifiable on-chain.
          </Trans>
        </li>
        <li>
          <Trans>All computations and results are deterministic and can be independently verified by anyone.</Trans>
        </li>
        <li>
          <Trans>No element of chance, randomness or gambling is involved.</Trans>
        </li>
        <li>
          <Trans>
            You can verify Bitcoin Block Hash{' '}
            <ExternalLink href="https://btcscan.org/block/00000000000000000000a82a97d2c92db3dc2344476665f5c0d4b15172a24cec">
              here
            </ExternalLink>
            .
          </Trans>
        </li>
      </ul>
    </li>
    <li>
      <Trans>
        In the event that multiple hashes have the same qualifying result, the reward pool will be divided equally among
        them.
      </Trans>
    </li>
    <Text color="white" fontWeight="500" marginY="8px">
      <Trans>Reward Distribution</Trans>
    </Text>
    <li>
      <Trans>The full campaign results will be published on KyberSwap by:</Trans>
      <ul style={{ margin: 0 }}>
        <li>
          <Trans>Nov 28, 2025 for Week 1 results.</Trans>
        </li>
        <li>
          <Trans>Dec 05, 2025 for Week 2 results.</Trans>
        </li>
      </ul>
    </li>
    <li>
      <Trans>Rewards will be airdropped to qualifying wallet in KNC token on Base by Dec 12, 2025.</Trans>
    </li>
    <li>
      <Trans>Each wallet may have multiple reward-qualifying transaction hashes.</Trans>
    </li>
  </>
)

const raffleFaq: FaqItem[] = [
  {
    q: (
      <Trans>
        I made 1 swap on KyberSwap between 01/11/2024 and 30/10/2025 on a supported chain. How do I become eligible for
        the campaign?
      </Trans>
    ),
    a: (
      <Trans>
        You must click &quot;Join Now&quot; first. Only eligible transactions made after you click &quot;Join Now&quot;
        will be counted.
      </Trans>
    ),
  },
  {
    q: <Trans>Is there any minimum or maximum value requirements for each trade?</Trans>,
    a: <Trans>There is no minimum nor maximum value requirement for a trade.</Trans>,
  },
  {
    q: <Trans>My wallet generates 100 eligible transaction hashes. Are only the first 50 counted?</Trans>,
    a: <Trans>Yes. We only count the first 50 eligible hashes per wallet.</Trans>,
  },
  {
    q: (
      <Trans>
        If a campaign has 10 reward-qualifying hashes and my wallet owns 5, how is my reward share calculated?
      </Trans>
    ),
    a: <Trans>Your wallet&apos;s reward = 5 ÷ 10 = 50% of the total prize pool.</Trans>,
  },
  {
    q: <Trans>Where can I see my eligible transactions?</Trans>,
    a: <Trans>You can check it under the &quot;Your Transactions&quot; tab on the campaign page.</Trans>,
  },
  {
    q: (
      <Trans>
        Why have I made a successful swap transaction, but it&apos;s not counted even after I successfully clicked
        &quot;Join Now&quot;?
      </Trans>
    ),
    a: (
      <Trans>
        Because your swap might fall under excluded cases - such as wrapping or unwrapping native tokens (e.g., ETH ↔
        WETH, BNB ↔ WBNB…), cross-chain swaps, or limit orders during the campaign period.
      </Trans>
    ),
  },
]

export const renderRaffleTerms = () => (
  <>
    <li>
      <Trans>
        KyberSwap reserves the right to disqualify any address found to engage in manipulative or abusive behavior,
        including but not limited to wash trading, sybil attacks, flashloan-based volume inflation, just-in-time
        liquidity attack, and any other behavior deemed manipulative or abusive by KyberSwap.
      </Trans>
    </li>
    <li>
      <Trans>
        KyberSwap may modify the campaign mechanics, eligibility, or rewards at any time without prior notice.
      </Trans>
    </li>
    <li>
      <Trans>
        All decisions regarding eligibility, rewards and disqualification are final and at the sole discretion of
        KyberSwap.
      </Trans>
    </li>
    <li>
      <Trans>
        KyberSwap reserves the right to shorten, extend, suspend, or terminate the Campaign at any time, at its sole
        discretion.
      </Trans>
    </li>
    <li>
      <Trans>
        This Campaign is a marketing promotion designed to reward user participation, and does not constitute a lottery,
        raffle, sweepstake or gambling activity in any jurisdiction.
      </Trans>
    </li>
  </>
)

export const raffleInfo: CampaignContent = {
  getHowTo: (_week: number) => (
    <>
      <li>
        <Trans>
          Click <Link to="/campaigns/weekly-rewards">Join Now</Link> on the KyberSwap UI to participate.
        </Trans>
        <Quote>
          Note: Wallet addresses must have at least one successful swap transaction on KyberSwap between 01/11/2024 and
          30/10/2025 (UTC) to be eligible, excluding cross-chain, limit orders, and deprecated chains swaps.
        </Quote>
      </li>
      <li>
        <Trans>Make swaps on the the KyberSwap UI.</Trans>
        <Quote>
          Note: Excluding wrapping and unwrapping of native tokens (e.g., ETH ↔ WETH, BNB ↔ WBNB…), cross-chain swaps
          and limit orders.
        </Quote>
      </li>
      <li>
        <Trans>
          Each eligible swap generates a unique transaction hash, which serves as the participant&apos;s identifier.
        </Trans>
        <ul style={{ margin: 0 }}>
          <li>
            <Trans>Only successful (&quot;success&quot; status on explorer) transaction hash is counted.</Trans>
          </li>
          <li>
            <Trans>Eligible transaction hashes per wallet per week are capped at the first 50 eligible hashes.</Trans>
          </li>
        </ul>
      </li>
    </>
  ),
  timeline: raffleTimeline || <RaffleTimeline />,
  getRewards: (_week: number) => raffleRewards,
  faq: raffleFaq,
  getTerms: (_week: number) => renderRaffleTerms(),
}
