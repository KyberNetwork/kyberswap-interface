import { Trans } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'

import { ExternalLink } from 'theme'

import { CampaignContent, FaqItem } from './types'

const referralsTimeline = (
  <Trans>The Campaign will take place over 10 weeks, from 8th July to 16th September 2024.</Trans>
)

const referralsRewards = (
  <Text>
    <Trans>
      Up to{' '}
      <Text as="span" fontSize="24px" color="#ffffff" fontWeight="500">
        45,000 ARB
      </Text>{' '}
      are allocated for the Referral Campaign until the end of the Trading Campaign.
    </Trans>
  </Text>
)

const referralsFaq: FaqItem[] = [
  {
    q: <Trans>How can I be eligible to the Referral Program?</Trans>,
    a: (
      <>
        <li>
          <Trans>
            <span style={{ fontStyle: 'bold', color: '#ffffff' }}>To be eligible for the Referee bonus</span>, users
            must join the referral program by using a referrer&apos;s link or entering a referrer code, click on
            &quot;Confirm to join,&quot; and sign the on-chain message to confirm to join.
          </Trans>
        </li>
        <li>
          <Trans>
            <span style={{ fontStyle: 'bold', color: '#ffffff' }}>To become a Referrer</span>, users simply need to
            click on &quot;Invite your friends,&quot; sign an on-chain message to confirm their participation (if you
            were referred by a friend and have already signed the message as a referee, you won&apos;t need to sign
            again), and then generate a link ready to share.
          </Trans>
        </li>
      </>
    ),
  },
  {
    q: <Trans>How are my referee/referrer rewards calculated?</Trans>,
    a: (
      <>
        <li>
          <Trans>As a referee, you&apos;ll get a 5% bonus on your rewards from KyberSwap.com.</Trans>
        </li>
        <li>
          <Trans>
            As a referrer, when someone you referred earns ARB on a trade made on KyberSwap.com, you get 10% of their
            rewards allocation.
          </Trans>
        </li>
        <b>
          <Trans>Example:</Trans>
        </b>
        <ul style={{ marginTop: '0' }}>
          <li>
            <Trans>1. John refers Vitalik.</Trans>
          </li>
          <li>
            <Trans>2. At the end of the week, Vitalik earns 10 ARB from trading on KyberSwap.com.</Trans>
          </li>
          <li>
            <Trans>3. Vitalik gets a 5% bonus for being a referee, so he gets 10.5 ARB.</Trans>
          </li>
          <li>
            <Trans>
              4. John receives 10% bonus of Vitalik’s 10 ARB (excluding the 0.5 ARB bonus), so John gets 1 ARB.
            </Trans>
          </li>
          <li>
            <Trans>5. The 10% Bonus come from the Referral Program budget, not from the referee allocation.</Trans>
          </li>
        </ul>
        <li>
          <Trans>
            <span style={{ color: '#ffffff' }}>Note</span>: The referral bonus applies only on trades made on
            KyberSwap.com within the Aggregator Trading Campaign.
          </Trans>
        </li>
      </>
    ),
  },
  {
    q: <Trans>Where can I trade to be eligible for the referral rewards?</Trans>,
    a: (
      <span>
        <Trans>
          Trades made on <Link to="/swap/arbitrum">https://kyberswap.com/swap/arbitrum</Link> which created the rewards
          from Trading campaign will be eligible for referrals bonus.
        </Trans>
      </span>
    ),
  },
  {
    q: <Trans>Which tokens can referees trade to be eligible for the rewards?</Trans>,
    a: (
      <span>
        <Trans>
          You can find the full list of eligible tokens{' '}
          <ExternalLink href="https://docs.google.com/spreadsheets/d/1pFDIh-11SPrNGVp6i-U_mRA5ulQ47jDjRk1eTOQCtD8/edit?usp=sharing">
            here
          </ExternalLink>
        </Trans>
      </span>
    ),
  },
  {
    q: <Trans>When can I claim my rewards?</Trans>,
    a: (
      <Trans>
        The Referrers and Referees rewards will be claimable only at the end of the STIP Campaign, around 1 week after
        16th of September.
      </Trans>
    ),
  },
  {
    q: <Trans>How often is referral data updated?</Trans>,
    a: (
      <Trans>
        The referral data, including My Referrals, My Estimated Rewards, and Referees&apos; Wallet Addresses, is updated
        approximately hourly.
      </Trans>
    ),
  },
  {
    q: <Trans>When is the deadline to claim the rewards?</Trans>,
    a: (
      <Trans>
        There is no deadline to claim the rewards. All the rewards if not claimed will be airdropped at a later time.
      </Trans>
    ),
  },
  {
    q: <Trans>Do I have to pay any fee to claim the rewards?</Trans>,
    a: (
      <Trans>
        KyberSwap doesn’t charge any fee on claiming rewards, user only needs to pay gas fee on Arbitrum for transaction
        execution.
      </Trans>
    ),
  },
  {
    q: <Trans>Is there a maximum bonus limit for each wallet address?</Trans>,
    a: <Trans>There is no maximum bonus limit for each eligible wallet.</Trans>,
  },
]

const renderReferralTerms = (week: number) => (
  <>
    <li>
      <Trans>
        The Campaign will run from{' '}
        <Text as="span" color="#ffffff" fontStyle="bold">
          8th July 2024 at 0:00 UTC to 15th September 2024 at 23:59 UTC UTC
        </Text>
        . KyberSwap retains the right to amend the Campaign&apos;s start and end dates with reasonable notice.
      </Trans>
    </li>
    <li>
      <Trans>
        All KyberSwap Aggregator API users from whitelisted clients are welcome to participate in the campaign.
      </Trans>
    </li>
    <li>
      <Trans>
        KyberSwap maintains the right, at its sole discretion, to disqualify any user who violates, cheats, or exploits
        the campaign.
      </Trans>
    </li>
    <li>
      <Trans>
        Please note that KyberSwap reserves the rights to change the rules &amp; conditions at its sole discretion.
      </Trans>
    </li>
    <li>
      <Trans>
        Points & Rewards on the Leaderboard are subject to change during the buffer period before the distribution of
        ARB.{' '}
        <Text as="span" color="#ffffff" fontStyle="bold">
          Any wallet that tries to sybil or cheat in any way will have all their points and rewards forfeited.
        </Text>
      </Trans>
    </li>

    {week > 28 && (
      <>
        <li>
          <Trans>
            Heavy wash trading, sybil-attack, Just-in-time liquidity attack, flashloans attacks or other related
            activities are not allowed and will forfeit points & rewards of the identified users. KyberSwap team will
            monitor and exclude such behaviour from the STIP Campaign.
          </Trans>
        </li>
        <li>
          <Trans>
            The rules against such activities will remain unrevealed to avoid abuse from a selected group of users.
            KyberSwap team can exclude wallets from the campaign at its sole discretion.
          </Trans>
        </li>
      </>
    )}
  </>
)

export const referralsInfo: CampaignContent = {
  getHowTo: (_week: number) => (
    <span>
      <Trans>
        In order to join the Referral Program, users can generate their own referral link and share it with other users
        to be eligible to the referrer reward. Referrers get 10% of their referee ARB allocation. Referees will get a 5%
        bonus based on their initial ARB allocation for the week once they have been referred by other users. Note that
        only trades made on <Link to="/">KyberSwap.com</Link> are eligible, trades on other platforms are not eligible
        for this Referral Program.
      </Trans>
      <br />
      <Trans>
        This Program is only available for the Trading Campaign. A referrer can not become a referee, unless he was a
        referee before becoming a referrer.
      </Trans>
    </span>
  ),
  timeline: referralsTimeline,
  getRewards: (_week: number) => referralsRewards,
  faq: referralsFaq,
  getTerms: week => renderReferralTerms(week),
}
