import { Trans, t } from '@lingui/macro'
import { Link } from 'react-router-dom'

import { ExternalLink } from 'theme'

import { CampaignContent, FaqItem } from './types'

const renderMayTradingTerms = () => (
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
        KyberSwap does not endorse or promote any specific tokens in this campaign. All trading decisions are made at
        the user&apos;s own risk.
      </Trans>
    </li>
  </>
)

const mayTradingTimeline = <Trans>The campaign will start from 00h00, 27/05 - 23h59, 01/06 in UTC timezone</Trans>

const mayTradingRewards = (
  <>
    <li>
      <Trans>
        Trade more to earn more points to climb the leaderboard - the higher your rank, the greater your rewards.
      </Trans>
      <ul style={{ margin: 0, color: '#fff' }}>
        <li>Rank 1: 1050 KNC</li>
      </ul>
      <ul style={{ margin: 0, color: '#fff' }}>
        <li>Rank 2-5: 550 KNC</li>
      </ul>
      <ul style={{ margin: 0, color: '#fff' }}>
        <li>Rank 6-20: 250 KNC</li>
      </ul>
      <ul style={{ margin: 0, color: '#fff' }}>
        <li>Rank 21-100: 100 KNC</li>
      </ul>
    </li>
    <li>
      <Trans>
        In the event that multiple participants achieve the same score for a ranked position (e.g., two users tied for
        Rank 1), the corresponding rewards for that rank and the following rank will be combined and equally distributed
        among the tied participants.
      </Trans>
      <ul style={{ margin: 0 }}>
        <li>
          <Trans>
            For example: If two users tie for Rank 1, the rewards for Rank 1 and Rank 2 (in Rank 2-5) will be added
            together and split equally between the two → Each receives (1050 + 550) ÷ 2 = 800 KNC
          </Trans>
        </li>
      </ul>
    </li>
    <li>
      <Trans>Rewards will be distributed in KNC tokens on Ethereum.</Trans>
      <ul style={{ margin: 0 }}>
        <li>
          <Trans>
            KNC rewards will be available to claim on the “My Dashboard” page starting from 00:00 UTC on June 9.
          </Trans>
        </li>
      </ul>
      <ul style={{ margin: 0 }}>
        <li>
          <Trans>
            Claiming will require a gas fee. Users must claim their rewards before 00:00 UTC on July 9; unclaimed
            rewards after this time will no longer be available.
          </Trans>
        </li>
      </ul>
    </li>
  </>
)

const mayTradingFaq: FaqItem[] = [
  {
    q: <Trans>How can I be eligible for the campaign?</Trans>,
    a: (
      <span>
        <Trans>
          To be eligible, you must make a swap on <Link to="/swap/base">KyberSwap.com</Link> using trading pairs
          composed of eligible tokens from the list, excluding WETH-ETH, WETH-USDC, and ETH-USDC.
        </Trans>
      </span>
    ),
  },
  {
    q: <Trans>How are points calculated?</Trans>,
    a: (
      <span>
        <Trans>
          Points are calculated based on the trading volume of eligible tokens — you earn 1 point for every $1 of
          eligible trading volume.
        </Trans>
      </span>
    ),
  },
  {
    q: <Trans>Are there any activities that may lead to disqualification?</Trans>,
    a: (
      <span>
        <Trans>
          Any wallet engaging in cheating, such as wash trading, sybil attacks, flashloan-based volume inflation, and
          any other behavior deemed manipulative or abusive by the KyberSwap team will be disqualified.
        </Trans>
      </span>
    ),
  },
  {
    q: <Trans>How can I claim my reward?</Trans>,
    a: (
      <span>
        <Trans>
          KNC rewards will be available to claim on the “My Dashboard” page starting from 00:00 UTC on June 9. Rewards
          are claimable on Ethereum, and claiming will require a gas fee. Users must claim their rewards before 00:00
          UTC on July 9; unclaimed rewards after this time will no longer be available.
        </Trans>
      </span>
    ),
  },
  {
    q: <Trans>How can I check my current rank?</Trans>,
    a: (
      <span>
        <Trans>You can view your total points earned and current rank by going to the “Leaderboard” tab.</Trans>
      </span>
    ),
  },
  {
    q: <Trans>How often is the data updated?</Trans>,
    a: (
      <span>
        <Trans>The points data are updated hourly.</Trans>
      </span>
    ),
  },
  {
    q: <Trans>Are there any minimum or maximum value (USD) requirements for each trade?</Trans>,
    a: (
      <span>
        <Trans>There is no minimum nor maximum value requirement for a trade to earn points.</Trans>
      </span>
    ),
  },
]

const mayTradingEligibility = (
  <>
    <li>
      <Trans>
        Only trading volume from pairs composed of{' '}
        <ExternalLink href="https://docs.google.com/spreadsheets/d/1WOTmuXgIGGYMagz9ziCK-Z_dm_WBSdjAkvz1nrADt2U/edit?gid=0#gid=0">
          eligible tokens
        </ExternalLink>{' '}
        will be counted, excluding WETH-ETH, WETH-USDC, and ETH-USDC.
      </Trans>
    </li>
    <li>
      <Trans>
        Only trading volume executed on <Link to="/swap/base">kyberswap.com/swap/base</Link> is counted.
      </Trans>
    </li>
    <li>
      <Trans>
        Only trades executed after 00:00 UTC, 27 May 2025, and before 23:59 UTC, 01 June 2025, will be eligible.
      </Trans>
    </li>
  </>
)

export const mayTradingInfo: CampaignContent = {
  getHowTo: (_week: number) => (
    <>
      <Trans>The campaign takes place entirely on Base chain.</Trans>
      <li>
        <Trans>
          Go to <Link to="/swap/base">kyberswap.com/swap/base</Link>
        </Trans>
      </li>
      <li>
        <Trans>
          You may freely trade any pair composed of{' '}
          <ExternalLink href="https://docs.google.com/spreadsheets/d/1WOTmuXgIGGYMagz9ziCK-Z_dm_WBSdjAkvz1nrADt2U/edit?gid=0#gid=0">
            eligible tokens
          </ExternalLink>
          , excluding WETH-ETH, WETH-USDC, and ETH-USDC.
        </Trans>
        <ul style={{ margin: 0 }}>
          <li>{t`Examples of eligible pairs: AIXBT-VVV, AIXBT-USDC…`}</li>
        </ul>
      </li>
      <li>
        {t`For $1 in trading volume, you earn 1 point`}
        <ul style={{ margin: 0 }}>
          <li>{t`Example: You trade $100 of AIXBT for USDC. If you receive $99 worth of USDC, then your trade volume is counted as $99 ~ 99 points.`}</li>
        </ul>
      </li>
      <li>
        {t`Rewards are distributed based on the points leaderboard - the more points you earn, the higher your rank and the bigger your reward.`}
      </li>
    </>
  ),
  timeline: mayTradingTimeline,
  getRewards: (_week: number) => mayTradingRewards,
  faq: mayTradingFaq,
  getTerms: (_week: number) => renderMayTradingTerms(),
  eligibility: mayTradingEligibility,
}
