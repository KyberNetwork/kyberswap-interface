import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'

import { ExternalLink } from 'theme'

import { StyledTable, TableWrapper, Td, Th, Tr } from './styles'
import { CampaignContent, FaqItem } from './types'

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
          Take the last 4 hex digits of the Bitcoin block hash mined closest after 23:59 UTC on 10/11 (Week 1) and 17/11
          (Week 2).
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
      <Trans>Week 1: 00:00 03/11/2025 - 23:59 10/11/2025 UTC, 5,000 KNC (~$1,500)</Trans>
    </li>
    <li>
      <Trans>Week 2: 00:00 10/11/2025 - 23:59 17/11/2025 UTC, 5,000 KNC (~$1,500)</Trans>
    </li>
  </>
)

const raffleRewards = (
  <>
    <li>
      <Trans>Trade on KyberSwap Swap feature, meet the following minimum trading volume per transaction:</Trans>
      <ul style={{ margin: 0 }}>
        <li>
          <Trans>
            <span style={{ fontWeight: 500, color: '#fff' }}>$500</span> for stablecoins and correlated pairs (
            <ExternalLink href="https://www.notion.so/Stablecoins-and-Correlated-Pairs-28d26751887e80049bb2e907e6b1b4b1?pvs=21">
              see full list
            </ExternalLink>
            ).
          </Trans>
        </li>
        <li>
          <Trans>
            <span style={{ fontWeight: 500, color: '#fff' }}>$100</span> for all other trading pairs (excluding
            stablecoins and correlated pairs).
          </Trans>
        </li>
      </ul>
    </li>
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
        from the last 4 hex digits of the Bitcoin Block Hash mined closest after 23:59 UTC on 10/11 (Week 1) and 17/11
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
  </>
)

const raffleFaq: FaqItem[] = [
  {
    q: <Trans>How are the raffle winners selected?</Trans>,
    a: (
      <Trans>
        At the end of each week, KyberSwap compares the last 4 hex digits of every eligible transaction hash with the
        selected Bitcoin block hash. The hash with the smallest absolute difference is declared the winner, following
        the calculation shown in the table above.
      </Trans>
    ),
  },
  {
    q: <Trans>Do I need to register before my trades count?</Trans>,
    a: (
      <Trans>
        Yes. Make sure you click “Join Campaign” on the Raffle Campaign page before executing eligible trades. Only
        trades submitted after joining, and that meet the minimum volume requirement, are considered.
      </Trans>
    ),
  },
  {
    q: <Trans>Do failed or cancelled transactions count?</Trans>,
    a: (
      <Trans>
        No. Only successful transactions that appear on the explorer with a “success” status are eligible for the
        raffle.
      </Trans>
    ),
  },
  {
    q: <Trans>When will I receive my rewards if I win?</Trans>,
    a: (
      <Trans>
        Rewards will be distributed to the winning wallets by 12 August 2025. EVM, Near, and Solana wallets receive USDT
        (with a minimum value of $5), while Bitcoin wallets receive BTC (minimum value $10) based on the distribution
        day’s exchange rate.
      </Trans>
    ),
  },
  {
    q: <Trans>What happens if multiple hashes produce the same closest result?</Trans>,
    a: (
      <Trans>
        If more than one transaction produces the same qualifying difference, the affected prize pool is split equally
        between the tied participants.
      </Trans>
    ),
  },
]

const renderRaffleTerms = () => (
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
          Click <Link to="/campaigns/raffle-campaign">Join Campaign</Link> on the KyberSwap UI to participate.
        </Trans>
      </li>
      <li>
        <Trans>Trade on KyberSwap Swap feature, meet the following minimum trading volume per transaction:</Trans>
        <ul style={{ margin: 0 }}>
          <li>
            <Trans>
              <span style={{ fontWeight: 500, color: '#fff' }}>$500</span> for stablecoins and correlated pairs (
              <ExternalLink href="https://www.notion.so/Stablecoins-and-Correlated-Pairs-28d26751887e80049bb2e907e6b1b4b1?pvs=21">
                see full list
              </ExternalLink>
              ).
            </Trans>
          </li>
          <li>
            <Trans>
              <span style={{ fontWeight: 500, color: '#fff' }}>$100</span> for all other trading pairs (excluding
              stablecoins and correlated pairs).
            </Trans>
          </li>
        </ul>
      </li>
      <li>
        <Text as="span" display="block" marginTop="8px">
          <Trans>
            Note: See the full stablecoin supported list{' '}
            <ExternalLink href="https://docs.google.com/spreadsheets/d/1ASuf0R4EqNslY7RYbKUIqaBmia0ASdYGF_eZCcDK0d4/edit?gid=0#gid=0">
              here
            </ExternalLink>
            .
          </Trans>
        </Text>
      </li>
      <li>
        <Trans>
          Each eligible trade generates a unique transaction hash, which serves as the participant&apos;s identifier.
          Only successful (&quot;success&quot; status on explorer) transaction hashes are counted.
        </Trans>
      </li>
    </>
  ),
  timeline: raffleTimeline,
  getRewards: (_week: number) => raffleRewards,
  faq: raffleFaq,
  getTerms: (_week: number) => renderRaffleTerms(),
}
