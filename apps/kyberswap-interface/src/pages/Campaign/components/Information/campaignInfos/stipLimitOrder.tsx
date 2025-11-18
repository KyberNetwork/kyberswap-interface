import { Trans, t } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'

import { ExternalLink } from 'theme'

import { CampaignContent, FaqItem } from './types'

const limitOrderTimeline = (
  <Trans>
    The Campaign will take place over 10 weeks, from 8th July to 16th September 2024. Points and Rewards are reset to 0
    each Monday at 0:00 UTC, after the end of each weekly event.
  </Trans>
)

const limitOrderRewards = (
  <>
    <li>
      <Trans>
        <Text as="span" fontSize="24px" style={{ color: '#ffffff' }}>
          9,000 ARB
        </Text>{' '}
        is allocated for this campaign each week.
      </Trans>
    </li>
    <li>
      <Trans>How to calculate the Estimated Rewards</Trans>
      <ul style={{ margin: 0 }}>
        <li>
          <Trans>The Estimated Rewards are based on the following formula for the conversion of Points to ARB:</Trans>
        </li>
        <Text fontStyle="italic">
          <Trans>
            User earned Points for the week / Total Users Point for the week) X Amount of ARB allocation for the week.
          </Trans>
        </Text>
      </ul>
    </li>
    <li>
      <Trans>What is the Finalized Rewards compared with Estimated Rewards</Trans>
      <ul style={{ margin: 0 }}>
        <li>
          <Trans>
            The Total Claimable Rewards is the real amount of ARB that a user will get after filtering sybils, cheaters
            and potential calculation issues. All ARB allocations from recognized sybils and cheaters will be
            re-allocated proportionally to other eligible Limit-Order users.
          </Trans>
        </li>
      </ul>
    </li>
  </>
)

const limitOrderFaq: FaqItem[] = [
  {
    q: <Trans>How can I be eligible to the Limit Order campaign?</Trans>,
    a: (
      <span>
        <Trans>
          In order to be eligible, you need to create a Limit Order with eligible tokens and get it filled on{' '}
          <Link to="/limit/arbitrum">https://kyberswap.com/limit/arbitrum.</Link> Only filled orders will give you
          points.
        </Trans>
      </span>
    ),
  },
  {
    q: <Trans>Which tokens can I trade to be eligible for the rewards?</Trans>,
    a: (
      <Text as="span">
        <Trans>
          You can find the full list of eligible tokens{' '}
          <ExternalLink href="https://docs.google.com/spreadsheets/d/1pFDIh-11SPrNGVp6i-U_mRA5ulQ47jDjRk1eTOQCtD8/edit?gid=0#gid=0">
            here
          </ExternalLink>
        </Trans>
      </Text>
    ),
  },
  {
    q: <Trans>What are the different categories and how does it work?</Trans>,
    a: (
      <Trans>
        There are 4 different categories that will reward each swap with a different amount of points. Refer to “How to
        earn Points” section for a detailed explanation.
      </Trans>
    ),
  },
  {
    q: <Trans>What are points and how do I convert it to ARB rewards?</Trans>,
    a: (
      <Trans>
        Points are calculated based on the tokens and the amount you swap. It will automatically be converted to ARB
        after a 7 days buffer period.
      </Trans>
    ),
  },
  {
    q: <Trans>How do you calculate the rewards?</Trans>,
    a: (
      <Trans>
        The distribution of ARB rewards are based on the points distributed to users. All users will grow a Points
        portfolio for each week. Here’s the formula for the conversion of Points to ARB: User earned Points for the week
        / Total Users Point for the week) X Amount of ARB allocation for the week.
      </Trans>
    ),
  },
  {
    q: <Trans>When can I claim my rewards?</Trans>,
    a: (
      <span>
        <Trans>
          After your first week of Limit-Order activities (from Monday 0:00 UTC to Sunday 23h59 UTC) points and rewards
          are locked 7 days. During this 7 days buffer period, the team will analyze the data and exclude potential
          cheaters. Once this buffer period ends, ARB will be claimable on{' '}
          <Link to="/campaigns/dashboard?tab=limit-order-farming">KyberSwap.com/campaigns/dashboard.</Link>
        </Trans>
      </span>
    ),
  },
  {
    q: <Trans>How often is the data updated?</Trans>,
    a: (
      <Trans>
        My Earn Points and My Estimated Rewards data for Limit Order campaign are updated approximately hourly.
      </Trans>
    ),
  },
  {
    q: <Trans>When is the deadline to claim the rewards?</Trans>,
    a: (
      <Trans>
        There is no set deadline to claim your rewards; however, we recommend claiming them as soon as possible to make
        the most of your benefits.
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
    q: <Trans>Are there any minimum or maximum value (USD) requirements for each trade?</Trans>,
    a: <Trans>There is no minimum nor maximum value requirement for an order to earn points.</Trans>,
  },
  {
    q: <Trans>Is there a maximum allocation limit for each wallet address?</Trans>,
    a: <Trans>There is no maximum allocation for each eligible wallet.</Trans>,
  },
]

const renderLimitOrderTerms = (week: number) => (
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

export const limitOrderInfo: CampaignContent = {
  getHowTo: week => (
    <>
      <li>
        <Trans>
          Points are earned each time a Maker Order is filled on KyberSwap Limit-Order. Eligible tokens are indexed in 4
          different categories, giving different amount of points per USD amount filled. Eligible tokens can be found on{' '}
          <ExternalLink href="https://docs.google.com/spreadsheets/d/1pFDIh-11SPrNGVp6i-U_mRA5ulQ47jDjRk1eTOQCtD8/edit?gid=0#gid=0">
            this list
          </ExternalLink>
        </Trans>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          <Trans>Category 1</Trans>
        </Text>
        :{' '}
        {t`ARB filled orders will give 10 Points per USD. It can be paired with any eligible tokens from the list, except plsARB that falls in Category 3.`}{' '}
        <ul style={{ margin: 0 }}>
          <li>{t`Ex: ARB <> USDC; ETH <> ARB; PENDLE <> ARB`}</li>
        </ul>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          <Trans>Category 2</Trans>
        </Text>
        :{' '}
        {t`Uncorrelated tokens filled orders will give 5 Points per USD. This section includes orders of any eligible token to any eligible token that do not fall in category 1; 3 and 4.`}{' '}
        <ul style={{ margin: 0 }}>
          <li>{t`Ex: ETH <> USDT; WBTC <> WSTETH; PENDLE <> KNC`}</li>
        </ul>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          <Trans>Category 3</Trans>
        </Text>
        : {t`ETH Derivatives filled orders will give 1 Point per USD.`}
        <ul style={{ margin: 0 }}>
          <li>{t`Ex: ETH <> WSTETH; EZETH <> RETH; WEETH <> ETH`}</li>
        </ul>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          <Trans>Category 4</Trans>
        </Text>
        :{' '}
        {week > 28
          ? t`Stablecoins to Stablecoins filled orders will give 0.25 Points per USD.`
          : t`Stablecoins to Stablecoins filled orders will give 0.5 Points per USD.`}
        <ul style={{ margin: 0 }}>
          <li>{t`Ex: USDC <> USDT; FRAX <> DAI; LUSD <> MIM`}</li>
        </ul>
      </li>
    </>
  ),
  timeline: limitOrderTimeline,
  getRewards: (_week: number) => limitOrderRewards,
  faq: limitOrderFaq,
  getTerms: week => renderLimitOrderTerms(week),
}
