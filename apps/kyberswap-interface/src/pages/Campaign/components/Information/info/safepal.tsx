import { Trans } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'

import { ExternalLink } from 'theme'

import CampaignFaqSection from './CampaignFaqSection'
import { StyledTable, TableWrapper, Td, Th, Tr } from './styles'
import { CampaignContent, CampaignSectionComponent, FaqItem } from './types'

const SafePalHardwareWallet = ({ link }: { link?: boolean }) => {
  if (link) {
    return <ExternalLink href="https://www.safepal.com/en/store/x1">SafePal X1 Hardware Wallets</ExternalLink>
  }
  return (
    <Text as="span" color="#fff">
      SafePal X1 Hardware Wallets
    </Text>
  )
}

const SafePalHowToSection = (): CampaignSectionComponent => {
  const pointsTable = [
    { product: <Trans>Swap</Trans>, category: <Trans>Correlated group 1</Trans>, points: '0.05' },
    { product: '', category: <Trans>Correlated group 2</Trans>, points: '0.5' },
    { product: '', category: <Trans>All categories, exclude &quot;Stable&quot;</Trans>, points: '10' },
    { product: <Trans>Zap</Trans>, category: <Trans>Stable</Trans>, points: '1' },
    { product: '', category: <Trans>Correlated</Trans>, points: '5' },
    { product: '', category: <Trans>Common</Trans>, points: '26' },
    { product: '', category: <Trans>Exotic</Trans>, points: '65' },
    { product: <Trans>Cross-Chain</Trans>, category: <Trans>Stable</Trans>, points: '5' },
    { product: '', category: <Trans>Common</Trans>, points: '25' },
    { product: '', category: <Trans>Exotic</Trans>, points: '65' },
    { product: '', category: <Trans>High-volatility</Trans>, points: '120' },
    { product: <Trans>Limit Order</Trans>, category: <Trans>Stable</Trans>, points: '1' },
    { product: '', category: <Trans>Correlated Group 1, exclude &quot;Stable&quot;</Trans>, points: '2' },
    { product: '', category: <Trans>Common</Trans>, points: '10' },
    { product: '', category: <Trans>Exotic</Trans>, points: '30' },
    { product: '', category: <Trans>High Volatility</Trans>, points: '50' },
    { product: <Trans>Smart Exit</Trans>, category: <Trans>Stable pair</Trans>, points: '2' },
    { product: '', category: <Trans>Correlated pair</Trans>, points: '5' },
    { product: '', category: <Trans>Common pair</Trans>, points: '15' },
    { product: '', category: <Trans>Exotic pair</Trans>, points: '30' },
    { product: '', category: <Trans>High volatility pair</Trans>, points: '75' },
  ]

  return (
    <>
      <li>
        <Trans>
          Click <Link to="/campaigns/safepal">Join Now</Link> on{' '}
          <ExternalLink href="https://kyberswap.com">kyberswap.com</ExternalLink> to participate. Rewards are subject to
          successful redemption via the reward website, with applicable shipping fees paid by participants.
        </Trans>
      </li>
      <li>
        <Trans>
          Participants receive points from activities with Swap, Zap, Cross-Chain, and Limit Order on{' '}
          <ExternalLink href="https://kyberswap.com">kyberswap.com</ExternalLink>.
        </Trans>
      </li>
      <li>
        <Trans>
          The campaign takes place on 6 chains: Ethereum, BNB Chain, Base, Arbitrum, Polygon, and Avalanche.
        </Trans>
      </li>
      <li>
        <Trans>To appear on the leaderboard, participants must have trading volume greater than 0.</Trans>
      </li>
      <li>
        <Trans>For every $100 volume, participants earn points based on the following distribution:</Trans>
      </li>

      <TableWrapper style={{ marginBlock: '1rem' }}>
        <StyledTable>
          <thead>
            <Tr>
              <Th>
                <Trans>Product</Trans>
              </Th>
              <Th>
                <Trans>Token/Pair Category</Trans>
              </Th>
              <Th>
                <Trans>Points</Trans>
              </Th>
            </Tr>
          </thead>
          <tbody>
            {pointsTable.map((row, index) => (
              <Tr key={index}>
                <Td>{row.product}</Td>
                <Td>{row.category}</Td>
                <Td center>{row.points}</Td>
              </Tr>
            ))}
          </tbody>
        </StyledTable>
      </TableWrapper>

      <li>
        <Trans>Swap</Trans>
        <ul style={{ margin: 0 }}>
          <li>
            <Trans>Eligible chains: Ethereum, BNB Chain, Base, Arbitrum.</Trans>
          </li>
          <li>
            <Trans>
              Eligible tokens: all whitelisted tokens on KyberSwap. Whitelisted tokens are default tokens available on
              kyberswap.com and do not require manual &quot;import&quot; to swap.
            </Trans>
          </li>
          <li>
            <Trans>Excluded activities: Wrap ↔ Unwrap, Stake ↔ Unstake, Mint ↔ Burn (these do not earn points).</Trans>
          </li>
        </ul>
      </li>
      <li>
        <Trans>Zap: Both Zap In and Zap Out volumes are counted toward points.</Trans>
      </li>
      <li>
        <Trans>Cross-Chain: Only the sender&apos;s volume is counted for points.</Trans>
      </li>
      <li>
        <Trans>
          Limit Order: Only filled order volume is counted (unfilled or canceled orders do not earn points).
        </Trans>
      </li>
      <li>
        <Trans>
          Participants can earn an additional 170 bonus points weekly by using multiple KyberSwap products in the same
          week:
        </Trans>
        <ul style={{ margin: 0 }}>
          <li>
            <Trans>Use any 2 different products: +20 points</Trans>
          </li>
          <li>
            <Trans>Use any 3 different products: +50 points</Trans>
          </li>
          <li>
            <Trans>Use all 4 products (Swap, Zap, Cross-Chain, Limit Order): +100 points</Trans>
          </li>
          <li>
            <Trans>Weekly reset: Product usage and bonus progress reset after each weekly event ends.</Trans>
          </li>
        </ul>
      </li>
    </>
  )
}

const SafePalTimelineSection = (): CampaignSectionComponent => (
  <>
    <li>
      <Trans>The campaign will take place over 6 weeks, from 9th March 2026 to 19th April 2026.</Trans>
    </li>
    <li>
      <Trans>Points and registrations are reset each Monday at 0:00 UTC, after each weekly event ends.</Trans>
    </li>
  </>
)

const SafePalRewardsSection = (): CampaignSectionComponent => (
  <>
    <li>
      <Trans>
        Total rewards:{' '}
        <Text as="span" color="#fff">
          4,000 <SafePalHardwareWallet link />
        </Text>
        , valued at{' '}
        <Text as="span" color="#fff">
          $280,000
        </Text>{' '}
        ($70 per wallet).
      </Trans>
    </li>
    <li>
      <Trans>
        Each week,{' '}
        <Text as="span" color="#fff">
          667 <SafePalHardwareWallet />
        </Text>{' '}
        are allocated for 2 participant groups:
      </Trans>
      <ul style={{ margin: 0 }}>
        <li>
          <Trans>
            Leaderboard: <b>500 X1 Wallets</b> reserved for top 500 participants on the weekly leaderboard.
          </Trans>
        </li>
        <li>
          <Trans>
            First-Come, First-Served (FCFS): <b>167 X1 Wallets</b> reserved for remaining eligible participants on a
            FCFS basis, excluding the top 500 participants.
          </Trans>
        </li>
      </ul>
    </li>
    <li>
      <Trans>
        The <SafePalHardwareWallet /> are provided free of charge. Participants only need to cover shipping fees, which
        vary by delivery location.
      </Trans>
    </li>
  </>
)

const SafePalClaimingAndShippingSection = (): CampaignSectionComponent => (
  <>
    <li>
      <Trans>
        Within 48 hours after each week ends, KyberSwap publishes the eligible list on{' '}
        <ExternalLink href="https://x.com/KyberNetwork">KyberSwap&apos;s X</ExternalLink>, along with the claim portal
        links for both the Leaderboard and FCFS participants.
      </Trans>
    </li>
    <li>
      <Trans>
        Each week, eligible participants have approximately 7 days to claim their reward. If the deadline is missed,
        eligibility will expire and the reward will no longer be available.
      </Trans>
    </li>
    <li>
      <Trans>
        This campaign is only eligible for destinations listed in{' '}
        <ExternalLink href="https://safepalsupport.zendesk.com/hc/en-us/articles/20151246730011-Countries-and-Regions-Available-for-Shipping">
          SafePal shipping countries and regions
        </ExternalLink>
        . Users with shipping addresses from countries not included in our shipping list will not be eligible to receive
        the reward.
      </Trans>
    </li>
    <li>
      <Trans>
        Please note that shipping fees will be calculated at checkout, and participants will be responsible for any
        customs taxes.
      </Trans>
    </li>
  </>
)

export const SafePalTermsSection = (): CampaignSectionComponent => (
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
    <li>
      <Trans>
        Users are solely responsible for accessing the SafePal&apos;s platform to claim and receive rewards and must
        comply with all its applicable terms and policies.
      </Trans>
    </li>
    <li>
      <Trans>
        Users are fully responsible for all costs related to receiving rewards, including shipping fees, customs duties,
        taxes, and any other applicable charges.
      </Trans>
    </li>
    <li>
      <Trans>
        This program is limited to the jurisdictions listed in{' '}
        <ExternalLink href="https://safepalsupport.zendesk.com/hc/en-us/articles/20151246730011-Countries-and-Regions-Available-for-Shipping">
          SafePal shipping countries and regions
        </ExternalLink>
        . Users from countries or territories outside this list are not eligible to receive rewards.
      </Trans>
    </li>
    <li>
      <Trans>
        No alternative rewards, substitutions, or compensation will be provided for users who are unable to claim or
        receive rewards due to SafePal&apos;s policies, geographic restrictions, or user non-compliance.
      </Trans>
    </li>
  </>
)

const SafePalFaqListSection = (): CampaignSectionComponent => {
  const faqItems: FaqItem[] = [
    {
      q: <Trans>Which activities earn points?</Trans>,
      a: (
        <Trans>
          Points are earned from eligible trading activity using Swap, Zap, Cross-Chain Swap, and Limit Order on
          kyberswap.com.
        </Trans>
      ),
    },
    {
      q: <Trans>What is the First-Come, First-Served (FCFS) round?</Trans>,
      a: (
        <Trans>
          he FCFS round rewards participants ranked outside of top 500, with 167 SafePal X1 Hardware Wallet available on
          a first-come, first-served basis.
        </Trans>
      ),
    },
    {
      q: <Trans>Can I participate in multiple weeks?</Trans>,
      a: <Trans>Yes, you can participate in multiple weeks.</Trans>,
    },
    {
      q: <Trans>How do I claim my SafePal X1 Hardware Wallet?</Trans>,
      a: (
        <Trans>
          Visit the claim portal, connect your eligible wallet address, and complete the shipping information and
          checkout.
        </Trans>
      ),
    },
    {
      q: <Trans>Is the SafePal X1 Hardware Wallet free?</Trans>,
      a: (
        <Trans>
          Yes, the wallet is free, and participants only need to pay the shipping fee, which varies by location.
        </Trans>
      ),
    },
    {
      q: <Trans>What happens if I don&apos;t claim in time?</Trans>,
      a: (
        <Trans>
          If you miss the claiming deadline, your eligibility will expire and the reward will no longer be available.
        </Trans>
      ),
    },
  ]

  return <CampaignFaqSection items={faqItems} />
}

export const safepalInfo: CampaignContent = {
  HowTo: SafePalHowToSection,
  Timeline: SafePalTimelineSection,
  Rewards: SafePalRewardsSection,
  customSections: [
    {
      title: <Trans>🚚 Claiming and Shipping</Trans>,
      Content: SafePalClaimingAndShippingSection,
    },
  ],
  Terms: SafePalTermsSection,
  Faq: SafePalFaqListSection,
}
