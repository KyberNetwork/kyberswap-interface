import { Trans } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'

import safePalPoints from 'pages/Campaign/assets/safepal_points.png'
import { ExternalLink } from 'theme'

import CampaignFaqSection from './CampaignFaqSection'
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
  return (
    <>
      <li>
        <Trans>
          Click <Link to="/campaigns/safepal">Join Now</Link> to participate.
        </Trans>
      </li>
      <li>
        <Trans>
          Rewards are subject to successful redemption via the reward website, with applicable shipping fees paid by
          participants.
        </Trans>
      </li>
      <li>
        <Trans>
          Each address can participate across multiple weeks, but can only claim a maximum of one SafePal wallet
          throughout the entire campaign.
        </Trans>
      </li>
      <li>
        <Trans>
          Participants receive points from activities with Swap, Zap, Cross-Chain, Limit Order and Smart Exit Orders on{' '}
          <ExternalLink href="https://kyberswap.com">kyberswap.com</ExternalLink>.
        </Trans>
      </li>
      <li>
        <Trans>The campaign takes place on 6 chains: Ethereum, BNB Chain, Base, Arbitrum, Polygon, Avalanche.</Trans>
      </li>
      <li>
        <Trans>To appear on the leaderboard, participants must have a trading volume greater than 0.</Trans>
      </li>
      <li>
        <Trans>For every $100 volume, participants earn points based on the following distribution:</Trans>
      </li>

      <div style={{ display: 'flex', justifyContent: 'center', marginBlock: 8 }}>
        <img style={{ maxWidth: 600, borderRadius: 12 }} src={safePalPoints} width="100%" />
      </div>

      <li>
        <Trans>
          Participants can earn an additional 170 bonus points weekly by using multiple KyberSwap products within the
          same week:
        </Trans>
        <ul style={{ margin: 0 }}>
          <li>
            <Trans>Use any 2 different products: +20 points</Trans>
          </li>
          <li>
            <Trans>Use any 3 different products: +50 points</Trans>
          </li>
          <li>
            <Trans>Use any 4 different products: +100 points</Trans>
          </li>
          <li>
            <Trans>Weekly reset: Product usage and bonus progress reset after the weekly event ends.</Trans>
          </li>
        </ul>
      </li>

      <Text fontWeight={600} style={{ textDecoration: 'underline' }} mt={2}>
        <Trans>Note</Trans>
      </Text>
      <ul style={{ margin: 0 }}>
        <li>
          <Trans>Data on the campaign site may take up to 10 minutes to update after a transaction is made.</Trans>
        </li>
        <li>
          <Trans>
            Trading volume is rounded down to the nearest $100. For example, if your trading volume is $199, it will be
            counted as $100.
          </Trans>
        </li>
        <li>
          <Trans>High Volatility tokens are newly listed tokens that experience significant price swings.</Trans>
        </li>
        <li>
          <Trans>
            Exotic tokens are generally lower-liquidity or lesser-known assets that do not meet the criteria for Stable,
            Common, or High Volatility categories.
          </Trans>
        </li>
      </ul>

      <Text fontWeight={600} style={{ textDecoration: 'underline' }} mt={2}>
        <Trans>Important Rules Per Product</Trans>
      </Text>
      <ul style={{ margin: 0 }}>
        <li>
          <Trans>Swap</Trans>
          <ul style={{ margin: 0 }}>
            <li>
              <Trans>
                Eligible tokens: All whitelisted tokens on KyberSwap. Whitelisted tokens are default tokens available on
                kyberswap.com and do not require manual &quot;import&quot; to swap.
              </Trans>
            </li>
            <li>
              <Trans>Excluded activities: Wrap ↔ Unwrap.</Trans>
            </li>
          </ul>
        </li>
        <li>
          <Trans>Zap: Zap In, Zap Out, Migrate and Reposition volumes are counted toward points.</Trans>
        </li>
        <li>
          <Trans>Cross-Chain: Only the sender&apos;s volume is counted for points.</Trans>
        </li>
        <li>
          <Trans>
            Limit Order: Only filled order volume is counted (unfilled or canceled orders do not earn points).
          </Trans>
        </li>
      </ul>
    </>
  )
}

const SafePalTimelineSection = (): CampaignSectionComponent => (
  <>
    <li>
      <Trans>The Campaign will take place over 6 weeks, from March 16 at 8:00 AM UTC.</Trans>
    </li>
    <li>
      <Trans>Points and registration are reset each Monday at 8:00 AM UTC, after each weekly event ends.</Trans>
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
    <ul style={{ margin: 0 }}>
      <li>
        <Trans>
          <Text as="span" color="#fff">
            667 x <SafePalHardwareWallet />
          </Text>{' '}
          are reserved for the Top 667 participants on the weekly leaderboard. Any rewards that remain unclaimed after
          the leaderboard claim period will move to a First-Come, First-Served (FCFS) round in the following week.
        </Trans>
      </li>
      <li>
        <Trans>
          The FCFS round is open to eligible participants who were not in the Top 667, and rewards will be distributed
          in the order of successful claims until fully claimed or expired.
        </Trans>
      </li>
      <li>
        <Trans>
          For example, in Week 1, 667 participants are eligible to claim rewards. If only 400 wallets are claimed, the
          remaining 267 unclaimed wallets will move to the FCFS round in the following week. These 267 wallets will then
          be available for eligible participants who were not in the Top 667 of Week 1, distributed on a FCFS basis
          until fully claimed or expired.
        </Trans>
      </li>
    </ul>
    <li>
      <Trans>
        Within 48 hours after each week ends, KyberSwap will publish the claim portal links on KyberSwap&apos;s{' '}
        <ExternalLink href="https://x.com/KyberNetwork">X</ExternalLink>,{' '}
        <ExternalLink href="https://t.me/officialkybernetwork">Telegram</ExternalLink>, and{' '}
        <ExternalLink href="https://discord.gg/kyberswap">Discord</ExternalLink> for both the top 667 and FCFS
        participants. Participants should turn on notifications for these channels to receive the latest updates.
      </Trans>
    </li>
    <li>
      <Trans>
        The <SafePalHardwareWallet /> are provided free of charge. Participants are only required to cover the shipping
        fee, which varies depending on the delivery location.
      </Trans>
    </li>
  </>
)

const SafePalClaimingAndShippingSection = (): CampaignSectionComponent => (
  <>
    <li>
      <Trans>
        Each week, eligible participants have approximately 7 days to claim their reward. If the deadline is missed,
        eligibility will expire and the reward will no longer be available.
      </Trans>
    </li>
    <li>
      <Trans>
        This campaign is only eligible for the countries listed in{' '}
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
      q: <Trans>Is the SafePal X1 Hardware Wallet free?</Trans>,
      a: (
        <Trans>
          Yes, the wallet is free, and participants only need to pay the shipping fee, which varies by location.
        </Trans>
      ),
    },
    {
      q: <Trans>Which activities earn points?</Trans>,
      a: (
        <Trans>
          Points are earned from eligible trading activity using Swap, Zap, Cross-Chain Swap, Limit Order and Smart Exit
          Orders on kyberswap.com
        </Trans>
      ),
    },
    {
      q: <Trans>What is the First-Come, First-Served (FCFS) round?</Trans>,
      a: (
        <Trans>
          The FCFS round is open to eligible participants who were not in the Top 667 to claim the remaining rewards,
          and rewards will be distributed in the order of successful claims until fully claimed or expired.
        </Trans>
      ),
    },
    {
      q: <Trans>Can I participate in multiple weeks?</Trans>,
      a: (
        <Trans>
          Yes, each address can participate across multiple weeks, but can only claim a maximum of one SafePal wallet
          throughout the entire campaign.
        </Trans>
      ),
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
