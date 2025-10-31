import { Trans, t } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'

import nearCampaignGuide from 'pages/Campaign/assets/near_campaign_guide.png'

import { StyledTable, TableWrapper, Td, Th, Tr } from './styles'
import { CampaignContent, FaqItem } from './types'

const nearIntentTableData = [
  {
    pair: <Trans>Non-EVM → Near L1 (excl same chain)</Trans>,
    stable: 6,
    other: 6,
  },
  {
    pair: <Trans>Non-EVM ← Near L1 (excl same chain)</Trans>,
    stable: 4,
    other: 4,
  },
  {
    pair: <Trans>EVM → Near L1</Trans>,
    stable: 2.5,
    other: 5,
  },
  {
    pair: <Trans>EVM ← Near L1</Trans>,
    stable: 1.5,
    other: 3,
  },
  {
    pair: <Trans>EVM ↔ Bitcoin L1</Trans>,
    stable: 5,
    other: 5,
  },
  {
    pair: <Trans>EVM ↔ Solana L1</Trans>,
    stable: 2,
    other: 4,
  },
  {
    pair: <Trans>Bitcoin L1 ↔ Solana L1</Trans>,
    stable: 5,
    other: 5,
  },
  {
    pair: <Trans>EVM ↔ EVM (excl same chain)</Trans>,
    stable: 1,
    other: 3,
  },
]

const nearIntentTimeline = (
  <>
    <Trans>The campaign will take place over 2 weeks:</Trans>
    <li>
      <Trans>Week 1: 0h00 UTC 21st July - 23h59 UTC 27th July.</Trans>
    </li>
    <li>
      <Trans>Week 2: 0h00 UTC 28th July - 23h59 UTC 3rd August.</Trans>
    </li>
  </>
)

const nearIntentRewards = (
  <>
    <li>
      <Trans>
        Week 1:{' '}
        <Text as="span" color="#fff">
          20,000 USDT
        </Text>
      </Trans>
    </li>
    <li>
      <Trans>
        Week 2:{' '}
        <Text as="span" color="#fff">
          30,000 USDT
        </Text>
      </Trans>
    </li>
    <li>
      <Trans>Rewards will be airdropped directly to the winners wallets by August 12th.</Trans>
    </li>
    <ul style={{ margin: 0 }}>
      <li>
        <Trans>
          <b>EVM, Near L1, Solana L1 winning wallets</b> will receive the airdrop <b>if the reward value is ≥ $5</b>,
          distributed in <b>USDT</b>. For EVM wallets, the reward will be sent on the Base chain.
        </Trans>
      </li>
      <li>
        <Trans>
          <b>Bitcoin L1 winning wallets</b> will only receive an airdrop <b>if the reward value ≥ $10</b>, and the prize
          distributed in <b>BTC</b>, calculated at the airdrop date exchange rate.
        </Trans>
      </li>
    </ul>
  </>
)

const nearIntentsFaq: FaqItem[] = [
  {
    q: (
      <Trans>If I swap $1 volume from EVM to Near L1, is the volume counted for my EVM wallet or my Near wallet?</Trans>
    ),
    a: <Trans>The volume is counted for the Near wallet (destination wallet), not the EVM wallet.</Trans>,
  },
  {
    q: <Trans>My Bitcoin wallet has a reward share of $5. Will I receive the airdrop?</Trans>,
    a: <Trans>No. Bitcoin wallets will only receive an airdrop if the reward share is ≥ $10.</Trans>,
  },
  {
    q: <Trans>Are pairs that include the same POL, ETH, or BNB counted as stable pairs in this campaign?</Trans>,
    a: (
      <Trans>
        Yes. Pairs of the same native asset - POL, ETH, or BNB - and their official wrapped versions are counted as
        stable pairs, along with stablecoin pairs.
      </Trans>
    ),
  },
  {
    q: <Trans>If I swap a derivatives pair of ETH, POL, or BNB, do I receive 1 or 3 points?</Trans>,
    a: <Trans>You will receive 3 points for swapping these derivatives pairs.</Trans>,
  },
]

const renderNearIntentsTerms = () => (
  <>
    <li>
      <Trans>
        Points & Rewards on the Leaderboard are subject to change during the buffer period before the distribution of
        rewards. Any wallet that tries to sybil or cheat in any way will have all their points and rewards forfeited.
      </Trans>
    </li>
    <li>
      <Trans>
        KyberSwap reserves the right to disqualify any address found to engage in the following: wash trading, sybil
        attacks, flashloan-based volume inflation, just-in-time liquidity attack and any other behavior deemed
        manipulative or abusive by the KyberSwap team.
      </Trans>
    </li>
    <li>
      <Trans>
        KyberSwap may modify the campaign mechanics, eligibility, or rewards at any time without prior notice. All
        decisions regarding rewards and disqualification are final and at the sole discretion of the KyberSwap team.
      </Trans>
    </li>
    <li>
      <Trans>
        KyberSwap Cross-Chain leverages Near Intent infrastructure. Please note that any infrastructure-related issues
        are not under KyberSwap’s responsibility.
      </Trans>
    </li>
  </>
)

export const nearIntentsInfo: CampaignContent = {
  getHowTo: (_week: number) => (
    <>
      <li>
        <Trans>
          Go to <Link to="/cross-chain">KyberSwap Cross-Chain</Link> feature.
        </Trans>
      </li>
      <li>
        <Trans>
          Click on <b>Route Options</b> and select <b>NEAR Intents.</b>
        </Trans>
        <img src={nearCampaignGuide} width="100%" />
      </li>
      <li>{t`For every $1 bridged via NEAR Intents on KyberSwap, users earn points based on the following scale:`}</li>
      <TableWrapper>
        <StyledTable>
          <thead>
            <Tr>
              <Th></Th>
              <Th>
                <Trans>Stable Pair</Trans>
              </Th>
              <Th>
                <Trans>Any Other Pairs</Trans>
              </Th>
            </Tr>
          </thead>
          <tbody>
            {nearIntentTableData.map((row, index) => (
              <Tr key={index}>
                <Td>{row.pair}</Td>
                <Td center>{row.stable}</Td>
                <Td center>{row.other}</Td>
              </Tr>
            ))}
          </tbody>
        </StyledTable>
      </TableWrapper>
      <ul style={{ marginBottom: 0 }}>
        <li>
          <b>
            <Trans>Stable Pairs:</Trans>
          </b>
          <ul>
            <li>{t`Both tokens must be stablecoins (e.g., USDC-USDC, USDT-USDT, USDC-USDT…)`}</li>
            <li>
              {t`Both tokens must be the same native tokens including ETH-ETH, BNB-BNB, POL-POL. Wrapped versions of ETH, BNB, and POL are also eligible (e.g., ETH-WETH, WETH-WETH, BNB-WBNB…)`}
            </li>
          </ul>
        </li>
        <li>
          <b>
            <Trans>Any Other Pairs:</Trans>
          </b>{' '}
          {t`Refers to any trading pairs that are not classified as Stable Pairs.`}
        </li>
      </ul>
      <span>
        <i>
          <Trans>Note:</Trans>
        </i>{' '}
        <Trans>
          Volume is measured based on the value of tokens received on the <b>destination chain</b>, and attributed to
          the <b>destination wallet.</b>
        </Trans>
      </span>
      <li>
        <b>
          <Trans>User reward = (User Points/Total Points) * Weekly Prize Pool</Trans>
        </b>
        <ul style={{ margin: 0 }}>
          <li>{t`User Points: Points earned within the $100,000 volume cap`}</li>
          <li>{t`Total Points: Combined points from all participants`}</li>
          <li>
            {t`Example: A user earns 100 points. Total participant points = 1,000. Weekly reward pool = $20,000. User reward = (100 / 1,000) × 20,000 = $2,000.`}
          </li>
        </ul>
      </li>
      <li>
        <Trans>
          Each user’s eligible trading volume is capped at $100,000 per week in Week 1 and{' '}
          <b>$50,000 per week in Week 2</b>
        </Trans>
      </li>
      <li>
        {t`Users can freely choose pairs and routes to optimize their points within the $50,000 volume cap in Week 2. For example:`}
        <ul style={{ margin: 0 }}>
          <li>{t`Trade $50,000 between EVM Chains and Stable Pairs earns 50,000 points.`}</li>
          <li>{t`Trade $50,000 from Arbitrum to Near L1 and Stable Pairs earns 125,000 points.`}</li>
        </ul>
      </li>
    </>
  ),
  timeline: nearIntentTimeline,
  getRewards: (_week: number) => nearIntentRewards,
  faq: nearIntentsFaq,
  getTerms: (_week: number) => renderNearIntentsTerms(),
}
