import { ReactNode, useState } from 'react'
import { Minus, Plus, Star } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import Divider from 'components/Divider'
import useTheme from 'hooks/useTheme'
import { ButtonIcon } from 'pages/Pools/styleds'
import { ExternalLink } from 'theme'

export enum CampaignType {
  MayTrading = 'MayTrading',
  Aggregator = 'Aggregator',
  LimitOrder = 'LimitOrder',
  Referrals = 'Referrals',
}

const howToEarnPoints = (week: number) => ({
  [CampaignType.MayTrading]: (
    <>
      <li>
        Go to <Link to="/">KyberSwap.com</Link>, open the Swap feature, and switch the network to Base
      </li>
      <li>
        You may freely trade any pair composed of{' '}
        <ExternalLink href="https://docs.google.com/spreadsheets/d/1WOTmuXgIGGYMagz9ziCK-Z_dm_WBSdjAkvz1nrADt2U/edit?gid=0#gid=0">
          eligible tokens
        </ExternalLink>{' '}
        , excluding WETH-ETH, WETH-USDC, and ETH-USDC.
        <ul style={{ margin: 0 }}>
          <li>{'Examples of eligible pairs: AIXBT-VVV, AIXBT-USDC…'}</li>
        </ul>
      </li>
      <li>
        For $1 in trading volume, you earn 1 point
        <ul style={{ margin: 0 }}>
          <li>
            {
              'Example: You trade $100 of AIXBT for USDC. If you receive $99 worth of USDC, then your trade volume is counted as $99 ~ 99 points.'
            }
          </li>
        </ul>
      </li>
      <li>
        Rewards will be distributed at the end of the campaign based on the leaderboard
        <ul style={{ margin: 0 }}>
          <li>Higher points, higher rank, bigger reward.</li>
        </ul>
      </li>
    </>
  ),
  [CampaignType.Aggregator]: (
    <>
      <li>
        Points are earned each time a user swap eligible tokens on KyberSwap Aggregator API. Eligible tokens are indexed
        in 4 different categories, giving different amount of points per USD swapped. Eligible tokens can be found on{' '}
        <ExternalLink href="https://docs.google.com/spreadsheets/d/1pFDIh-11SPrNGVp6i-U_mRA5ulQ47jDjRk1eTOQCtD8/edit?gid=0#gid=0">
          this list
        </ExternalLink>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          Category 1
        </Text>
        : ARB trading will give 10 Points per USD swapped. It can be paired with any eligible tokens from the list,
        except plsARB that falls in Category 3.
        <ul style={{ margin: 0 }}>
          <li>{'Ex: ARB <> USDC; ETH <> ARB; PENDLE <> ARB'}</li>
        </ul>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          Category 2
        </Text>
        : Uncorrelated tokens trading will give 5 Points per USD swapped. This section includes trading of any eligible
        token to any eligible token that do not fall in category 1; 3 and 4.
        <ul style={{ margin: 0 }}>
          <li>{'Ex: ETH <> USDT; WBTC <> WSTETH; PENDLE <>KNC'}</li>
        </ul>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          Category 3
        </Text>
        : ETH Derivatives trading will give 1 Point per USD swapped.
        <ul style={{ margin: 0 }}>
          <li>{'Ex: ETH <> WSTETH; EZETH <> RETH; WEETH <> ETH'}</li>
        </ul>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          Category 4
        </Text>
        :{' '}
        {week > 28
          ? ' Stablecoins to Stablecoins trading will give 0.25 Points per USD swapped.'
          : 'Stablecoins to Stablecoins trading will give 0.5 Points per USD swapped.'}
        <ul style={{ margin: 0 }}>
          <li>{'Ex: USDC <> USDT; FRAX <> DAI; LUSD <> MIM'}</li>
        </ul>
      </li>
      <li>
        <Text as="span" color="#ffffff" fontStyle="bold">
          Bonus:
        </Text>{' '}
        Users that perform swaps with <Link to="/">KyberSwap.com</Link> website directly will benefit of 25% more points
        on each eligible trade.
      </li>
      <li>
        <Text as="span" color="#ffffff" fontStyle="bold">
          Note:
        </Text>{' '}
        {week > 28 ? (
          <ul style={{ margin: 0 }}>
            <li>{`The transaction needs to be executed in the 20 minutes after clicking the “Swap” button in order to receive points & rewards.`}</li>
            <li>Please ensure you thoroughly read our Terms & Conditions before you begin earning points.</li>
          </ul>
        ) : (
          `the transaction needs to be executed in the 20 minutes after clicking the “Swap” button in order to receive
        points & rewards.`
        )}
      </li>
    </>
  ),
  [CampaignType.LimitOrder]: (
    <>
      <li>
        Points are earned each time a Maker Order is filled on KyberSwap Limit-Order. Eligible tokens are indexed in 4
        different categories, giving different amount of points per USD amount filled. Eligible tokens can be found on{' '}
        <ExternalLink href="https://docs.google.com/spreadsheets/d/1pFDIh-11SPrNGVp6i-U_mRA5ulQ47jDjRk1eTOQCtD8/edit?gid=0#gid=0">
          this list
        </ExternalLink>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          Category 1
        </Text>
        : ARB filled orders will give 10 Points per USD. It can be paired with any eligible tokens from the list, except
        plsARB that falls in Category 3.{' '}
        <ul style={{ margin: 0 }}>
          <li>{'Ex: ARB <> USDC; ETH <> ARB; PENDLE <> ARB'}</li>
        </ul>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          Category 2
        </Text>
        : Uncorrelated tokens filled orders will give 5 Points per USD. This section includes orders of any eligible
        token to any eligible token that do not fall in category 1; 3 and 4.{' '}
        <ul style={{ margin: 0 }}>
          <li>{'Ex: ETH <> USDT; WBTC <> WSTETH; PENDLE <>KNC'}</li>
        </ul>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          Category 3
        </Text>
        : ETH Derivatives filled orders will give 1 Point per USD.
        <ul style={{ margin: 0 }}>
          <li>{'Ex: ETH <> WSTETH; EZETH <> RETH; WEETH <> ETH'}</li>
        </ul>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          Category 4
        </Text>
        :{' '}
        {week > 28
          ? 'Stablecoins to Stablecoins filled orders will give 0.25 Points per USD.'
          : 'Stablecoins to Stablecoins filled orders will give 0.5 Points per USD.'}
        <ul style={{ margin: 0 }}>
          <li>{'Ex: USDC <> USDT; FRAX <> DAI; LUSD <> MIM'}</li>
        </ul>
      </li>
    </>
  ),
  [CampaignType.Referrals]: (
    <span>
      In order to join the Referral Program, users can generate their own referral link and share it with other users to
      be eligible to the referrer reward. Referrers get 10% of their referee ARB allocation. Referees will get a 5%
      bonus based on their initial ARB allocation for the week once they have been referred by other users. Note than
      only trades made on <Link to="/">KyberSwap.com</Link> are eligible, trades on other platforms are not eligible for
      this Referral Program.
      <br />
      This Program is only available for the Trading Campaign. A referrer can not become a referee, unless he was a
      referee before becoming a referrer.
    </span>
  ),
})

const timelines = {
  [CampaignType.MayTrading]: 'The campaign will start from 00h00, 27/05 - 23h59, 01/06 in UTC timezone',
  [CampaignType.Aggregator]:
    'The Campaign will take place over 10 weeks, from 8th July to 16th September 2024. Points and Rewards are reset to 0 each Monday at 0:00 UTC, after the end of each weekly event.',
  [CampaignType.LimitOrder]:
    'The Campaign will take place over 10 weeks, from 8th July to 16th September 2024. Points and Rewards are reset to 0 each Monday at 0:00 UTC, after the end of each weekly event.',
  [CampaignType.Referrals]: 'The Campaign will take place over 10 weeks, from 8th July to 16th September 2024.',
}

const rewards = {
  [CampaignType.MayTrading]: (
    <>
      <li>
        Leaderboard:
        <ul style={{ margin: 0 }}>
          <li>Ranked based on cumulative points during the campaign period.</li>
        </ul>
        <ul style={{ margin: 0 }}>
          <li>Each wallet address can ONLY receive a reward ONCE.</li>
        </ul>
      </li>
      <li>
        Trade more to earn more points to climb the leaderboard - the higher your rank, the greater your rewards.
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
        In the event that multiple participants achieve the same score for a ranked position (e.g., two users tied for
        Rank 1), the corresponding rewards for that rank and the following rank will be combined and equally distributed
        among the tied participants.
        <ul style={{ margin: 0 }}>
          <li>
            For example: If two users tie for Rank 1, the rewards for Rank 1 and Rank 2 (in Rank 2-5) will be added
            together and split equally between the two → Each receives (1050 + 550) ÷ 2 = 800 KNC
          </li>
        </ul>
      </li>
      <li>
        Rewards will be distributed in KNC tokens on Ethereum.
        <ul style={{ margin: 0 }}>
          <li>Winners can claim their rewards directly on the KyberSwap UI after 7 days when the campaign ends.</li>
        </ul>
        <ul style={{ margin: 0 }}>
          <li>Rewards must be claimed within 30 days from the claim start date.</li>
        </ul>
      </li>
    </>
  ),
  [CampaignType.Aggregator]: (
    <>
      <li>
        <Text as="span" fontSize="24px" style={{ color: '#ffffff' }}>
          31,500 ARB
        </Text>{' '}
        is allocated for this campaign each week.{' '}
      </li>
      <li>
        How to calculate the Estimated Rewards
        <ul style={{ margin: 0 }}>
          <li>The Estimated Rewards are based on the following formula for the conversion of Points to ARB:</li>
          <Text fontStyle="italic">
            User earned Points for the week / Total Users Point for the week) X Amount of ARB allocation for the week.
          </Text>
        </ul>
      </li>
      <li>
        What is the Finalized Rewards compared with Estimated Rewards
        <ul style={{ margin: 0 }}>
          <li>
            The Total Claimable Rewards is the real amount of ARB that a user will get after filtering sybils, cheaters
            and potential calculation issues. All ARB allocations from recognized sybils and cheaters will be
            re-allocated proportionally to other eligible traders.
          </li>
        </ul>
      </li>
    </>
  ),
  [CampaignType.LimitOrder]: (
    <>
      <li>
        <Text as="span" fontSize="24px" style={{ color: '#ffffff' }}>
          9,000 ARB
        </Text>{' '}
        is allocated for this campaign each week.{' '}
      </li>
      <li>
        How to calculate the Estimated Rewards
        <ul style={{ margin: 0 }}>
          <li>The Estimated Rewards are based on the following formula for the conversion of Points to ARB:</li>
          <Text fontStyle="italic">
            User earned Points for the week / Total Users Point for the week) X Amount of ARB allocation for the week.
          </Text>
        </ul>
      </li>
      <li>
        What is the Finalized Rewards compared with Estimated Rewards
        <ul style={{ margin: 0 }}>
          <li>
            The Total Claimable Rewards is the real amount of ARB that a user will get after filtering sybils, cheaters
            and potential calculation issues. All ARB allocations from recognized sybils and cheaters will be
            re-allocated proportionally to other eligible Limit-Order users.
          </li>
        </ul>
      </li>
    </>
  ),
  [CampaignType.Referrals]: (
    <Text>
      Up to{' '}
      <Text as="span" fontSize="24px" color="#ffffff" fontWeight="500">
        45,000 ARB
      </Text>{' '}
      are allocated for the Referral Campaign until the end of the Trading Campaign.
    </Text>
  ),
}

const faq = {
  [CampaignType.MayTrading]: [
    {
      q: 'How can I be eligible for the campaign?',
      a: (
        <span>
          To be eligible, you must make a swap on <Link to="/">KyberSwap.com</Link> using trading pairs composed of
          eligible tokens from the list, excluding WETH-ETH, WETH-USDC, and ETH-USDC.
        </span>
      ),
    },
    {
      q: 'How are points calculated?',
      a: (
        <span>
          Points are calculated based on the trading volume of eligible tokens — you earn 1 point for every $1 of
          eligible trading volume.
        </span>
      ),
    },
    {
      q: 'Are there any activities that may lead to disqualification?',
      a: (
        <span>
          Any wallet engaging in cheating, such as wash trading, sybil attacks, flashloan-based volume inflation, and
          any other behavior deemed manipulative or abusive by the KyberSwap team will be disqualified.
        </span>
      ),
    },
    {
      q: 'How can I claim my reward?',
      a: (
        <span>
          KNC rewards will be available to claim on the “My Dashboard” page starting from 00:00 UTC on June 9. Rewards
          are claimable on Ethereum, and claiming will require a gas fee. Users must claim their rewards before 00:00
          UTC on July 9; unclaimed rewards after this time will no longer be available.
        </span>
      ),
    },
    {
      q: 'How can I check my current rank?',
      a: <span>You can view your total points earned and current rank by going to the “Leaderboard” tab.</span>,
    },
    {
      q: 'How often is the data updated?',
      a: <span>The points data are updated hourly.</span>,
    },
    {
      q: 'Are there any minimum or maximum value (USD) requirements for each trade?',
      a: <span>There is no minimum nor maximum value requirement for a trade to earn points.</span>,
    },
  ],
  [CampaignType.Aggregator]: [
    {
      q: 'How can I be eligible to the trading campaign?',
      a: (
        <span>
          In order to be eligible, you need to make a swap from KyberSwap Aggregator API and trade any of the eligible
          tokens. You can trade on any of the whitelisted platforms that support KyberSwap Aggregator API. This includes{' '}
          <Link to="/">KyberSwap.com</Link> and other interfaces that support our Aggregator. To name a few: Defillama,
          Pendle, Ramses… Whitelisted platforms will communicate on their eligibility for the KyberSwap STIP ARB
          Rewards. If no communication has been made on social medias or on their website, consider the platform as not
          eligible.
        </span>
      ),
    },
    {
      q: 'Which tokens can I trade to be eligible for the rewards?',
      a: (
        <span>
          You can find the full list of eligible tokens{' '}
          <ExternalLink href="https://docs.google.com/spreadsheets/d/1pFDIh-11SPrNGVp6i-U_mRA5ulQ47jDjRk1eTOQCtD8/edit?usp=sharing">
            here
          </ExternalLink>
        </span>
      ),
    },
    {
      q: 'What are the different categories and how does it work?',
      a: 'There are 4 different categories that will reward each swap with a different amount of points. Refer to “How to earn Points” section for a detailed explanation.',
    },
    {
      q: 'What are points and how do I convert it to ARB rewards?',
      a: 'Points are calculated based on the tokens and the amount you swap. It will automatically be converted to ARB after a 7 days buffer period.',
    },
    {
      q: 'How do you calculate the rewards?',
      a: (
        <Text>
          The distribution of ARB rewards are based on the points distributed to users. All users will grow a Points
          portfolio for each week. Here’s the formula for the conversion of Points to ARB: User earned Points for the
          week / Total Users Point for the week) X Amount of ARB allocation for the week.
        </Text>
      ),
    },
    {
      q: 'When can I claim my rewards?',
      a: (
        <span>
          After your first week of trading (from Monday 0:00 UTC to Sunday 23h59 UTC) points and rewards are locked 7
          days. During this 7 days buffer period, the team will analyze the data and exclude potential cheaters. Once
          this buffer period ends, ARB will be claimable on{' '}
          <Link to="/campaigns/dashboard">KyberSwap.com/campaigns/dashboard.</Link>
        </span>
      ),
    },
    {
      q: 'How often is the data updated?',
      a: 'The Points and Rewards Estimation data for Trading & LO campaigns are updating hourly',
    },
    {
      q: 'When is the deadline to claim the rewards?',
      a: 'There is no deadline to claim the rewards. All the rewards if not claimed will be airdropped at a later time.',
    },
    {
      q: 'Do I have to pay any fee to claim the rewards?',
      a: 'KyberSwap doesn’t charge any fee on claiming rewards,  user only need to pay gas fee on Arbitrum for transaction execution',
    },
    {
      q: 'Are there any minimum or maximum value (USD) requirements for each trade?',
      a: 'There is no minimum nor maximum value requirement for a trade to earn points.',
    },
    {
      q: 'Are there a maximum allocation limit for each wallet address?',
      a: 'There is no maximum allocation for each eligible wallet.',
    },
  ],
  [CampaignType.LimitOrder]: [
    {
      q: 'How can I be eligible to the Limit Order campaign?',
      a: (
        <span>
          In order to be eligible, you need to create a Limit Order with eligible tokens and get it filled on{' '}
          <Link to="/limit/arbitrum">https://kyberswap.com/limit/arbitrum.</Link> Only filled orders will give you
          points.
        </span>
      ),
    },
    {
      q: 'Which tokens can I trade to be eligible for the rewards?',
      a: (
        <Text as="span">
          You can find the full list of eligible tokens{' '}
          <ExternalLink href="https://docs.google.com/spreadsheets/d/1pFDIh-11SPrNGVp6i-U_mRA5ulQ47jDjRk1eTOQCtD8/edit?gid=0#gid=0">
            here
          </ExternalLink>
        </Text>
      ),
    },
    {
      q: 'What are the different categories and how does it work?',
      a: 'There are 4 different categories that will reward each swap with a different amount of points. Refer to “How to earn Points” section for a detailed explanation.',
    },
    {
      q: 'What are points and how do I convert it to ARB rewards?',
      a: 'Points are calculated based on the tokens and the amount you swap. It will automatically be converted to ARB after a 7 days buffer period.',
    },
    {
      q: 'How do you calculate the rewards?',
      a: 'The distribution of ARB rewards are based on the points distributed to users. All users will grow a Points portfolio for each week. Here’s the formula for the conversion of Points to ARB: User earned Points for the week /  Total Users Point for the week) X Amount of ARB allocation for the week.',
    },
    {
      q: 'When can I claim my rewards?',
      a: (
        <span>
          After your first week of Limit-Order activities (from Monday 0:00 UTC to Sunday 23h59 UTC) points and rewards
          are locked 7 days. During this 7 days buffer period, the team will analyze the data and exclude potential
          cheaters. Once this buffer period ends, ARB will be claimable on{' '}
          <Link to="/campaigns/dashboard?tab=limit-order-farming">KyberSwap.com/campaigns/dashboard.</Link>
        </span>
      ),
    },
    {
      q: 'How often is the data updated?',
      a: 'My Earn Points and My Estimated Rewards data for Limit Order campaign are updated approximately hourly.',
    },
    {
      q: 'When is the deadline to claim the rewards?',
      a: 'There is no set deadline to claim your rewards; however, we recommend claiming them as soon as possible to make the most of your benefits.',
    },
    {
      q: 'Do I have to pay any fee to claim the rewards?',
      a: 'KyberSwap doesn’t charge any fee on claiming rewards, user only needs to pay gas fee on Arbitrum for transaction execution.',
    },
    {
      q: 'Are there any minimum or maximum value (USD) requirements for each trade?',
      a: 'There is no minimum nor maximum value requirement for an order to earn points.',
    },
    {
      q: 'Is there a maximum allocation limit for each wallet address?',
      a: 'There is no maximum allocation for each eligible wallet.',
    },
  ],
  [CampaignType.Referrals]: [
    {
      q: 'How can I be eligible to the Referral Program?',
      a: (
        <>
          <li>
            <span style={{ fontStyle: 'bold', color: '#ffffff' }}>To be eligible for the Referee bonus</span>, users
            must join the referral program by using a referrer&apos;s link or entering a referrer code, click on
            &quot;Confirm to join,&quot; and sign the on-chain message to confirm to join.
          </li>
          <li>
            <span style={{ fontStyle: 'bold', color: '#ffffff' }}>To become a Referrer</span>, users simply need to
            click on &quot;Invite your friends,&quot; sign an on-chain message to confirm their participation (if you
            were referred by a friend and have already signed the message as a referee, you won&apos;t need to sign
            again), and then generate a link ready to share.
          </li>
        </>
      ),
    },
    {
      q: 'How are my referee/referrer rewards calculated?',
      a: (
        <>
          <li>As a referee, you&apos;ll get a 5% bonus on your rewards from KyberSwap.com.</li>
          <li>
            As a referrer, when someone you referred earns ARB on a trade made on KyberSwap.com, you get 10% of their
            rewards allocation.
          </li>
          <b>Example:</b>
          <ul style={{ marginTop: '0' }}>
            <li>1. John refers Vitalik.</li>
            <li>2. At the end of the week, Vitalik earns 10 ARB from trading on KyberSwap.com.</li>
            <li>3. Vitalik gets a 5% bonus for being a referee, so he gets 10.5 ARB.</li>
            <li>4. John receives 10% bonus of Vitalik’s 10 ARB (excluding the 0.5 ARB bonus), so John gets 1 ARB.</li>
            <li>5. The 10% Bonus come from the Referral Program budget, not from the referee allocation.</li>
          </ul>
          <li>
            <span style={{ color: '#ffffff' }}>Note</span>: The referral bonus applies only on trades made on
            KyberSwap.com within the Aggregator Trading Campaign.
          </li>
        </>
      ),
    },
    {
      q: 'Where can I trade to be eligible for the referral rewards?',
      a: (
        <span>
          Trades made on <Link to="/swap/arbitrum">https://kyberswap.com/swap/arbitrum</Link> which created the rewards
          from Trading campaign will be eligible for referrals bonus
        </span>
      ),
    },
    {
      q: 'Which tokens can referees trade to be eligible for the rewards?',
      a: (
        <span>
          You can find the full list of eligible tokens{' '}
          <ExternalLink href="https://docs.google.com/spreadsheets/d/1pFDIh-11SPrNGVp6i-U_mRA5ulQ47jDjRk1eTOQCtD8/edit?usp=sharing">
            here
          </ExternalLink>
        </span>
      ),
    },
    {
      q: 'When can I claim my rewards?',
      a: 'The Referrers and Referees rewards will be claimable only at the end of the STIP Campaign, around 1 week after 16th of September.',
    },
    {
      q: 'How often is referral data updated?',
      a: "The referral data, including My Referrals, My Estimated Rewards, and Referees' Wallet Addresses, is updated approximately hourly.",
    },
    {
      q: 'When is the deadline to claim the rewards?',
      a: 'There is no deadline to claim the rewards. All the rewards if not claimed will be airdropped at a later time.',
    },
    {
      q: 'Do I have to pay any fee to claim the rewards?',
      a: 'KyberSwap doesn’t charge any fee on claiming rewards, user only needs to pay gas fee on Arbitrum for transaction execution',
    },
    {
      q: 'Is there a maximum bonus limit for each wallet address?',
      a: 'There is no maximum bonus limit for each eligible wallet.',
    },
  ],
}

const stipTerms = (week: number, type: CampaignType) => (
  <>
    <li>
      The Campaign will run from{' '}
      <Text as="span" color="#ffffff" fontStyle="bold">
        8th July 2024 at 0:00 UTC to 15th September 2024 at 23:59 UTC UTC
      </Text>
      . KyberSwap retains the right to amend the {"Campaign's"} start and end dates with reasonable notice.
    </li>
    <li>All KyberSwap Aggregator API users from whitelisted clients are welcome to participate in the campaign.</li>
    <li>
      KyberSwap maintains the right, at its sole discretion, to disqualify any user who violates, cheats, or exploits
      the campaign.
    </li>
    <li>Please note that KyberSwap reserves the rights to change the rules & conditions at its sole discretion. </li>
    <li>
      Points & Rewards on the Leaderboard are subject to change during the buffer period before the distribution of ARB.{' '}
      <Text as="span" color="#ffffff" fontStyle="bold">
        Any wallet that tries to sybil or cheat in any way will have all their points and rewards forfeited.
      </Text>
    </li>

    {week > 28 && (
      <>
        <li>
          Heavy wash trading, sybil-attack, Just-in-time liquidity attack, flashloans attacks or other related
          activities are not allowed and will forfeit points & rewards of the identified users. KyberSwap team will
          monitor and exclude such behaviour from the STIP Campaign.
        </li>
        <li>
          The rules against such activities will remain unrevealed to avoid abuse from a selected group of users.
          KyberSwap team can exclude wallets from the campaign at its sole discretion.
        </li>
        {type === CampaignType.Aggregator && (
          <li>Only trades made through whitelisted router contracts such as KyberSwap Router are eligible.</li>
        )}
      </>
    )}
  </>
)

const mayTradingTerms = (
  <>
    <li>
      KyberSwap reserves the right to disqualify any address found to engage in the following:
      <ul style={{ margin: 0 }}>
        <li>Wash trading</li>
        <li>Sybil attacks (e.g., using multiple addresses controlled by the same user or funded by the same source)</li>
        <li>Flashloan-based volume inflation</li>
        <li>Any other behavior deemed manipulative or abusive by the KyberSwap team.</li>
      </ul>
    </li>

    <li>
      Rights Reserved by KyberSwap:
      <ul style={{ margin: 0 }}>
        <li> KyberSwap may modify the campaign mechanics, eligibility, or rewards at any time without prior notice.</li>
        <li>The campaign may be suspended or cancelled in case of unforeseen technical issues or vulnerabilities.</li>
        <li>
          All decisions regarding rewards and disqualification are final and at the sole discretion of the KyberSwap
          team.
        </li>
      </ul>
    </li>
    <li>
      Trading loss:
      <ul style={{ margin: 0 }}>
        <li>KyberSwap does not provide compensation for trading losses or slippage on eligible pairs.</li>
        <li>
          KyberSwap does not endorse or promote any specific tokens in this campaign. All trading decisions are made at
          the user&apos;s own risk.
        </li>
      </ul>
    </li>
  </>
)

const termAndConds = (week: number, type: CampaignType) =>
  type === CampaignType.MayTrading ? mayTradingTerms : stipTerms(week, type)

export default function Information({ type, week }: { type: CampaignType; week: number }) {
  const theme = useTheme()
  const [isShowRule, setIsShowRule] = useState(true)
  const [isShowTimeline, setIsShowTimeline] = useState(true)
  const [isShowReward, setIsShowReward] = useState(true)
  const [isShowFaq, setIsShowFaq] = useState(true)
  const [isShowTc, setIsShowTc] = useState(true)
  const [isShowEligible, setIsShowEligible] = useState(true)

  const upTo450 = useMedia(`(max-width: 450px)`)
  const upTo400 = useMedia(`(max-width: 400px)`)

  return (
    <Box
      marginTop="1.25rem"
      padding="1.5rem"
      sx={{
        background: theme.background,
        borderRadius: '20px',
      }}
    >
      <Flex justifyContent="space-between">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          <Star color={theme.warning} fill={theme.warning} />
          How to earn points
        </Flex>

        <ButtonIcon onClick={() => setIsShowRule(prev => !prev)}>
          {!isShowRule ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </Flex>

      <Box
        color={theme.subText}
        lineHeight="28px"
        paddingLeft="12px"
        width="95%"
        sx={{
          maxHeight: isShowRule ? '1000px' : 0,
          opacity: isShowRule ? 1 : 0,
          marginTop: isShowRule ? '1rem' : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {howToEarnPoints(week)[type]}
      </Box>

      <Divider style={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="20px">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          🕑️ Timeline
        </Flex>

        <ButtonIcon onClick={() => setIsShowTimeline(prev => !prev)}>
          {!isShowTimeline ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </Flex>

      <Box
        color={theme.subText}
        lineHeight="28px"
        marginLeft="12px"
        sx={{
          maxHeight: isShowTimeline ? '1000px' : 0,
          opacity: isShowTimeline ? 1 : 0,
          marginTop: isShowTimeline ? '1rem' : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {timelines[type]}
      </Box>

      <Divider style={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="20px">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          🏆 Rewards
        </Flex>

        <ButtonIcon onClick={() => setIsShowReward(prev => !prev)}>
          {!isShowReward ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </Flex>

      <Text
        color={theme.subText}
        lineHeight="28px"
        marginLeft="12px"
        sx={{
          maxHeight: isShowReward ? '1000px' : 0,
          opacity: isShowReward ? 1 : 0,
          marginTop: isShowReward ? '1rem' : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {rewards[type]}
      </Text>

      {type === CampaignType.MayTrading && (
        <>
          <Divider style={{ marginTop: '20px' }} />

          <Flex justifyContent="space-between" marginTop="20px">
            <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
              ☑️ Eligibility
            </Flex>

            <ButtonIcon onClick={() => setIsShowEligible(prev => !prev)}>
              {!isShowEligible ? <Plus size={14} /> : <Minus size={14} />}
            </ButtonIcon>
          </Flex>

          <Text
            color={theme.subText}
            lineHeight="28px"
            marginLeft="12px"
            sx={{
              maxHeight: isShowEligible ? '2000px' : 0,
              opacity: isShowEligible ? 1 : 0,
              marginTop: isShowEligible ? '1rem' : 0,
              transition: 'all 0.3s ease',
              overflow: 'hidden',
            }}
          >
            <li>
              Only trading volume from pairs composed of{' '}
              <ExternalLink href="https://docs.google.com/spreadsheets/d/1WOTmuXgIGGYMagz9ziCK-Z_dm_WBSdjAkvz1nrADt2U/edit?gid=0#gid=0">
                eligible tokens
              </ExternalLink>{' '}
              will be counted, excluding WETH-ETH, WETH-USDC, and ETH-USDC.
            </li>
            <li>
              Only trading volume via KyberSwap Aggregator (Swap feature) and executed on{' '}
              <ExternalLink href="https://kyberswap.com">kyberswap.com</ExternalLink> is counted.
            </li>
            <li>
              Only trades executed after 00:00 UTC, 27 May 2025, and before 23:59 UTC, 01 June 2025, will be eligible.
            </li>
          </Text>
        </>
      )}

      <Divider style={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="20px">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          📄 Terms & Conditions
        </Flex>

        <ButtonIcon onClick={() => setIsShowTc(prev => !prev)}>
          {!isShowTc ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </Flex>

      <Text
        color={theme.subText}
        lineHeight="28px"
        marginLeft="12px"
        sx={{
          maxHeight: isShowTc ? '2000px' : 0,
          opacity: isShowTc ? 1 : 0,
          marginTop: isShowTc ? '1rem' : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <li>
          These Terms and Conditions{' '}
          <ExternalLink href="https://kyberswap.com/files/Kyber%20-%20Terms%20of%20Use%20-%2020%20November%202023.pdf">
            ({'"Terms"'})
          </ExternalLink>{' '}
          should be read in conjunction with the KyberSwap Terms of Use, which lay out the terms and conditions that
          apply to all KyberSwap promotional activities ({'"Campaign"'}).
        </li>
        {termAndConds(week, type)}
      </Text>

      <Divider style={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="20px">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          ❓ FAQ
        </Flex>

        <ButtonIcon onClick={() => setIsShowFaq(prev => !prev)}>
          {!isShowFaq ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </Flex>

      <Box
        color={theme.subText}
        lineHeight="28px"
        paddingLeft="12px"
        maxWidth={upTo400 ? '300px' : upTo450 ? '350px' : undefined}
        sx={{
          maxHeight: isShowFaq ? '5000px' : 0,
          opacity: isShowFaq ? 1 : 0,
          marginTop: isShowReward ? '1rem' : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {faq[type].map(item => (
          <Faq q={item.q} a={item.a} key={item.q} />
        ))}
      </Box>
    </Box>
  )
}

const Faq = ({ q, a }: { q: string; a: string | ReactNode }) => {
  const [show, setShow] = useState(false)
  const theme = useTheme()
  return (
    <>
      <Flex justifyContent="space-between" marginTop="1rem">
        <li style={{ flex: 1 }}>{q}</li>
        <ButtonIcon onClick={() => setShow(prev => !prev)}>
          {show ? <Minus size={14} /> : <Plus size={14} />}
        </ButtonIcon>
      </Flex>

      <Text
        color={theme.subText}
        marginX="16px"
        marginRight="32px"
        fontStyle="italic"
        sx={{
          maxHeight: show ? '1000px' : 0,
          opacity: show ? 1 : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {a}
      </Text>
    </>
  )
}
