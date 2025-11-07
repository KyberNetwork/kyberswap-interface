import { Trans, t } from '@lingui/macro'
import { ReactNode, useState } from 'react'
import { Minus, Plus, Star } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import Divider from 'components/Divider'
import useTheme from 'hooks/useTheme'
import { ButtonIcon } from 'pages/Pools/styleds'
import { ExternalLink } from 'theme'

import nearCampaignGuide from '../assets/near_campaign_guide.png'
import { CampaignType } from '../constants'

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

const TableWrapper = styled.div`
  overflow-x: auto;
`

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`

const Th = styled.th`
  border: 1px solid ${({ theme }) => theme.border};
  padding: 8px 12px;
  text-align: center;
`

const Td = styled.td<{ center?: boolean }>`
  border: 1px solid ${({ theme }) => theme.border};
  padding: 8px 12px;
  text-align: ${props => (props.center ? 'center' : 'left')};
`

const Tr = styled.tr`
  &:hover {
    background-color: ${props => props.theme.buttonBlack};
  }
`

const howToEarnPoints = (week: number) => ({
  [CampaignType.NearIntents]: (
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
  [CampaignType.MayTrading]: (
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
  [CampaignType.Aggregator]: (
    <>
      <li>
        <Trans>
          Points are earned each time a user swap eligible tokens on KyberSwap Aggregator API. Eligible tokens are
          indexed in 4 different categories, giving different amount of points per USD swapped. Eligible tokens can be
          found on{' '}
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
        {t`ARB trading will give 10 Points per USD swapped. It can be paired with any eligible tokens from the list, except plsARB that falls in Category 3.`}
        <ul style={{ margin: 0 }}>
          <li>{t`Ex: ARB <> USDC; ETH <> ARB; PENDLE <> ARB`}</li>
        </ul>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          <Trans>Category 2</Trans>
        </Text>
        :{' '}
        {t`Uncorrelated tokens trading will give 5 Points per USD swapped. This section includes trading of any eligible token to any eligible token that do not fall in category 1; 3 and 4.`}
        <ul style={{ margin: 0 }}>
          <li>{t`Ex: ETH <> USDT; WBTC <> WSTETH; PENDLE <> KNC`}</li>
        </ul>
      </li>
      <li>
        <Text as="span" fontStyle="bold" color="#ffffff">
          <Trans>Category 3</Trans>
        </Text>
        : {t`ETH Derivatives trading will give 1 Point per USD swapped.`}
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
          ? t`Stablecoins to Stablecoins trading will give 0.25 Points per USD swapped.`
          : t`Stablecoins to Stablecoins trading will give 0.5 Points per USD swapped.`}
        <ul style={{ margin: 0 }}>
          <li>{t`Ex: USDC <> USDT; FRAX <> DAI; LUSD <> MIM`}</li>
        </ul>
      </li>
      <li>
        <Text as="span" color="#ffffff" fontStyle="bold">
          <Trans>Bonus:</Trans>
        </Text>{' '}
        <Trans>
          Users that perform swaps with <Link to="/">KyberSwap.com</Link> website directly will benefit of 25% more
          points on each eligible trade.
        </Trans>
      </li>
      <li>
        <Text as="span" color="#ffffff" fontStyle="bold">
          <Trans>Note:</Trans>
        </Text>{' '}
        {week > 28 ? (
          <ul style={{ margin: 0 }}>
            <li>
              {t`The transaction needs to be executed in the 20 minutes after clicking the “Swap” button in order to receive points & rewards.`}
            </li>
            <li>{t`Please ensure you thoroughly read our Terms & Conditions before you begin earning points.`}</li>
          </ul>
        ) : (
          t`The transaction needs to be executed in the 20 minutes after clicking the “Swap” button in order to receive points & rewards.`
        )}
      </li>
    </>
  ),
  [CampaignType.LimitOrder]: (
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
  [CampaignType.Referrals]: (
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
})

const timelines = {
  [CampaignType.NearIntents]: (
    <>
      <Trans>The campaign will take place over 2 weeks:</Trans>
      <li>
        <Trans>Week 1: 0h00 UTC 21st July - 23h59 UTC 27th July.</Trans>
      </li>
      <li>
        <Trans>Week 2: 0h00 UTC 28th July - 23h59 UTC 3rd August.</Trans>
      </li>
    </>
  ),

  [CampaignType.MayTrading]: <Trans>The campaign will start from 00h00, 27/05 - 23h59, 01/06 in UTC timezone</Trans>,
  [CampaignType.Aggregator]: (
    <Trans>
      The Campaign will take place over 10 weeks, from 8th July to 16th September 2024. Points and Rewards are reset to
      0 each Monday at 0:00 UTC, after the end of each weekly event.
    </Trans>
  ),
  [CampaignType.LimitOrder]: (
    <Trans>
      The Campaign will take place over 10 weeks, from 8th July to 16th September 2024. Points and Rewards are reset to
      0 each Monday at 0:00 UTC, after the end of each weekly event.
    </Trans>
  ),
  [CampaignType.Referrals]: (
    <Trans>The Campaign will take place over 10 weeks, from 8th July to 16th September 2024.</Trans>
  ),
}

const rewards = {
  [CampaignType.NearIntents]: (
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
            <b>Bitcoin L1 winning wallets</b> will only receive an airdrop <b>if the reward value ≥ $10</b>, and the
            prize distributed in <b>BTC</b>, calculated at the airdrop date exchange rate.
          </Trans>
        </li>
      </ul>
    </>
  ),
  [CampaignType.MayTrading]: (
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
          Rank 1), the corresponding rewards for that rank and the following rank will be combined and equally
          distributed among the tied participants.
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
  ),
  [CampaignType.Aggregator]: (
    <>
      <li>
        <Trans>
          <Text as="span" fontSize="24px" style={{ color: '#ffffff' }}>
            31,500 ARB
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
              The Total Claimable Rewards is the real amount of ARB that a user will get after filtering sybils,
              cheaters and potential calculation issues. All ARB allocations from recognized sybils and cheaters will be
              re-allocated proportionally to other eligible traders.
            </Trans>
          </li>
        </ul>
      </li>
    </>
  ),
  [CampaignType.LimitOrder]: (
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
              The Total Claimable Rewards is the real amount of ARB that a user will get after filtering sybils,
              cheaters and potential calculation issues. All ARB allocations from recognized sybils and cheaters will be
              re-allocated proportionally to other eligible Limit-Order users.
            </Trans>
          </li>
        </ul>
      </li>
    </>
  ),
  [CampaignType.Referrals]: (
    <Text>
      <Trans>
        Up to{' '}
        <Text as="span" fontSize="24px" color="#ffffff" fontWeight="500">
          45,000 ARB
        </Text>{' '}
        are allocated for the Referral Campaign until the end of the Trading Campaign.
      </Trans>
    </Text>
  ),
}

const faq = {
  [CampaignType.NearIntents]: [
    {
      q: (
        <Trans>
          If I swap $1 volume from EVM to Near L1, is the volume counted for my EVM wallet or my Near wallet?
        </Trans>
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
  ],
  [CampaignType.MayTrading]: [
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
  ],
  [CampaignType.Aggregator]: [
    {
      q: <Trans>How can I be eligible to the trading campaign?</Trans>,
      a: (
        <span>
          <Trans>
            In order to be eligible, you need to make a swap from KyberSwap Aggregator API and trade any of the eligible
            tokens. You can trade on any of the whitelisted platforms that support KyberSwap Aggregator API. This
            includes <Link to="/">KyberSwap.com</Link> and other interfaces that support our Aggregator. To name a few:
            Defillama, Pendle, Ramses… Whitelisted platforms will communicate on their eligibility for the KyberSwap
            STIP ARB Rewards. If no communication has been made on social medias or on their website, consider the
            platform as not eligible.
          </Trans>
        </span>
      ),
    },
    {
      q: <Trans>Which tokens can I trade to be eligible for the rewards?</Trans>,
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
      q: <Trans>What are the different categories and how does it work?</Trans>,
      a: (
        <Trans>
          There are 4 different categories that will reward each swap with a different amount of points. Refer to “How
          to earn Points” section for a detailed explanation.
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
        <Text>
          <Trans>
            The distribution of ARB rewards are based on the points distributed to users. All users will grow a Points
            portfolio for each week. Here’s the formula for the conversion of Points to ARB: User earned Points for the
            week / Total Users Point for the week) X Amount of ARB allocation for the week.
          </Trans>
        </Text>
      ),
    },
    {
      q: <Trans>When can I claim my rewards?</Trans>,
      a: (
        <span>
          <Trans>
            After your first week of trading (from Monday 0:00 UTC to Sunday 23h59 UTC) points and rewards are locked 7
            days. During this 7 days buffer period, the team will analyze the data and exclude potential cheaters. Once
            this buffer period ends, ARB will be claimable on{' '}
            <Link to="/campaigns/dashboard">KyberSwap.com/campaigns/dashboard.</Link>
          </Trans>
        </span>
      ),
    },
    {
      q: <Trans>How often is the data updated?</Trans>,
      a: <Trans>The Points and Rewards Estimation data for Trading & LO campaigns are updating hourly.</Trans>,
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
          KyberSwap doesn’t charge any fee on claiming rewards, user only needs to pay gas fee on Arbitrum for
          transaction execution.
        </Trans>
      ),
    },
    {
      q: <Trans>Are there any minimum or maximum value (USD) requirements for each trade?</Trans>,
      a: <Trans>There is no minimum nor maximum value requirement for a trade to earn points.</Trans>,
    },
    {
      q: <Trans>Are there a maximum allocation limit for each wallet address?</Trans>,
      a: <Trans>There is no maximum allocation for each eligible wallet.</Trans>,
    },
  ],
  [CampaignType.LimitOrder]: [
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
          There are 4 different categories that will reward each swap with a different amount of points. Refer to “How
          to earn Points” section for a detailed explanation.
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
          portfolio for each week. Here’s the formula for the conversion of Points to ARB: User earned Points for the
          week / Total Users Point for the week) X Amount of ARB allocation for the week.
        </Trans>
      ),
    },
    {
      q: <Trans>When can I claim my rewards?</Trans>,
      a: (
        <span>
          <Trans>
            After your first week of Limit-Order activities (from Monday 0:00 UTC to Sunday 23h59 UTC) points and
            rewards are locked 7 days. During this 7 days buffer period, the team will analyze the data and exclude
            potential cheaters. Once this buffer period ends, ARB will be claimable on{' '}
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
          There is no set deadline to claim your rewards; however, we recommend claiming them as soon as possible to
          make the most of your benefits.
        </Trans>
      ),
    },
    {
      q: <Trans>Do I have to pay any fee to claim the rewards?</Trans>,
      a: (
        <Trans>
          KyberSwap doesn’t charge any fee on claiming rewards, user only needs to pay gas fee on Arbitrum for
          transaction execution.
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
  ],
  [CampaignType.Referrals]: [
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
            Trades made on <Link to="/swap/arbitrum">https://kyberswap.com/swap/arbitrum</Link> which created the
            rewards from Trading campaign will be eligible for referrals bonus.
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
          The referral data, including My Referrals, My Estimated Rewards, and Referees&apos; Wallet Addresses, is
          updated approximately hourly.
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
          KyberSwap doesn’t charge any fee on claiming rewards, user only needs to pay gas fee on Arbitrum for
          transaction execution.
        </Trans>
      ),
    },
    {
      q: <Trans>Is there a maximum bonus limit for each wallet address?</Trans>,
      a: <Trans>There is no maximum bonus limit for each eligible wallet.</Trans>,
    },
  ],
}

const stipTerms = (week: number, type: CampaignType) => (
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
        {type === CampaignType.Aggregator && (
          <li>
            <Trans>Only trades made through whitelisted router contracts such as KyberSwap Router are eligible.</Trans>
          </li>
        )}
      </>
    )}
  </>
)

const nearIntentsTerms = (
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

const mayTradingTerms = (
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

const termAndConds = (week: number, type: CampaignType) =>
  type === CampaignType.NearIntents
    ? nearIntentsTerms
    : type === CampaignType.MayTrading
    ? mayTradingTerms
    : stipTerms(week, type)

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
          {type === CampaignType.NearIntents ? t`How to participate?` : t`How to earn points`}
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
          maxHeight: isShowRule ? '10000px' : 0,
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
          {t`🕑️ Timeline`}
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
          {t`🏆 Rewards`}
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
              {t`☑️ Eligibility`}
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
          </Text>
        </>
      )}

      <Divider style={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="20px">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          {t`📄 Terms & Conditions`}
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
          <Trans>
            These Terms and Conditions{' '}
            <ExternalLink href="https://kyberswap.com/files/Kyber%20-%20Terms%20of%20Use%20-%2020%20November%202023.pdf">
              ({'"Terms"'})
            </ExternalLink>{' '}
            should be read in conjunction with the KyberSwap Terms of Use, which lay out the terms and conditions that
            apply to all KyberSwap promotional activities ({'"Campaign"'}).
          </Trans>
        </li>
        {termAndConds(week, type)}
      </Text>

      <Divider style={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="20px">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          {t`❓ FAQ`}
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
        {faq[type].map((item, index) => (
          <Faq q={item.q} a={item.a} key={index} />
        ))}
      </Box>
    </Box>
  )
}

const Faq = ({ q, a }: { q: ReactNode; a: ReactNode }) => {
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
