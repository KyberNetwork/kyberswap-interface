import { ReactNode, useState } from 'react'
import { Minus, Plus, Star } from 'react-feather'
import { Box, Flex, Text } from 'rebass'

import Divider from 'components/Divider'
import useTheme from 'hooks/useTheme'
import { ButtonIcon } from 'pages/Pools/styleds'
import { ExternalLink } from 'theme'

export enum CampaignType {
  Aggregator = 'Aggregator',
  LimitOrder = 'LimitOrder',
  Referrals = 'Referrals',
}

const howToEarnPoints = {
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
        Category 1: ARB trading will give 10 Points per USD swapped. It can be paired with any eligible tokens from the
        list, except plsARB that falls in Category 3.
        <ul style={{ margin: 0 }}>
          <li>{'Ex: ARB <> USDC; ETH <> ARB; PENDLE <> ARB'}</li>
        </ul>
      </li>
      <li>
        Category 2: Uncorrelated tokens trading will give 5 Points per USD swapped. This section includes trading of any
        eligible token to any eligible token that do not fall in category 1; 3 and 4.
        <ul style={{ margin: 0 }}>
          <li>{'Ex: ETH <> USDT; WBTC <> WSTETH; PENDLE <>KNC'}</li>
        </ul>
      </li>
      <li>
        Category 3: ETH Derivatives trading will give 1 Point per USD swapped.
        <ul style={{ margin: 0 }}>
          <li>{'Ex: ETH <> WSTETH; EZETH <> RETH; WEETH <> ETH'}</li>
        </ul>
      </li>
      <li>
        Category 4: Stablecoins to Stablecoins trading will give 0.5 Points per USD swapped.
        <ul style={{ margin: 0 }}>
          <li>{'Ex: USDC <> USDT; FRAX <> DAI; USDC.e <> MIM'}</li>
        </ul>
      </li>
      <li>
        <Text as="span" fontWeight="500" fontStyle="bold">
          Bonus:
        </Text>{' '}
        Users that perform swaps with KyberSwap.com website directly will benefit of 25% more points on each eligible
        trade.
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
        Category 1: ARB filled orders will give 10 Points per USD. It can be paired with any eligible tokens from the
        list, except plsARB that falls in Category 3.{' '}
        <ul style={{ margin: 0 }}>
          <li>{'Ex: ARB <> USDC; ETH <> ARB; PENDLE <> ARB'}</li>
        </ul>
      </li>
      <li>
        Category 2: Uncorrelated tokens filled orders will give 5 Points per USD. This section includes orders of any
        eligible token to any eligible token that do not fall in category 1; 3 and 4.{' '}
        <ul style={{ margin: 0 }}>
          <li>{'Ex: ETH <> USDT; WBTC <> WSTETH; PENDLE <>KNC'}</li>
        </ul>
      </li>
      <li>
        Category 3: ETH Derivatives filled orders will give 1 Point per USD.
        <ul style={{ margin: 0 }}>
          <li>{'Ex: ETH <> WSTETH; EZETH <> RETH; WEETH <> ETH'}</li>
        </ul>
      </li>
      <li>
        Category 4: Stablecoins to Stablecoins filled orders will give 0.5 Points per USD.
        <ul style={{ margin: 0 }}>
          <li>{'Ex: USDC <> USDT; FRAX <> DAI; USDC.e <> MIM'}</li>
        </ul>
      </li>
    </>
  ),
  [CampaignType.Referrals]: (
    <>
      In order to join the Referral Program, users can generate their own referral link and share it with other users to
      be eligible to the referrer reward. Referrers get 10% of their referee ARB allocation. Referees will get a 5%
      bonus on their initial ARB allocation when they join the referral campaign through a referral link. Note than only
      trades made on Kyberswap.com are eligible, trades on other platforms are not eligible for this Referral Program.
      This Program is only available for the Trading Campaign.
    </>
  ),
}

const timelines = {
  [CampaignType.Aggregator]: 'The Campaign will take place over 10 weeks, from 8th July to 16th September 2024.',
  [CampaignType.LimitOrder]: 'The Campaign will take place over 10 weeks, from 8th July to 16th September 2024.',
  [CampaignType.Referrals]: 'The Campaign will take place over 10 weeks, from 8th July to 16th September 2024.',
}

const rewards = {
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
            re-allocated proportionally to other eligible traders.
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
  [CampaignType.Aggregator]: [
    {
      q: 'How can I be eligible to the trading campaign?',
      a: 'In order to be eligible, you need to make a swap from KyberSwap Aggregator API and trade any of the eligible tokens.',
    },
    {
      q: 'What are points and how do I convert it to ARB rewards?',
      a: 'Points are calculated based on the tokens and the amount you swap. It will automatically be converted to ARB after a 7 days buffer period.',
    },
    {
      q: 'Where can I trade to be eligible for the rewards?',
      a: 'You can trade on any of the whitelisted platforms that support KyberSwap Aggregator API. This includes KyberSwap.com and other interfaces that support our Aggregator. To name a few: Defillama, Pendle, Ramses… Whitelisted platforms will communicate on their eligibility for the KyberSwap STIP ARB Rewards. If no communication has been made on social medias or on their website, consider the platform as not eligible.',
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
      q: 'How long do the campaigns last?',
      a: 'The Aggregator Trading Campaign works on a weekly basis. The Campaign will last until 16th September with 10 weeks of activity. Points and Rewards are reset to 0 each Monday at 0:00 UTC, after the end of each weekly event.',
    },
    {
      q: 'When can I claim my rewards?',
      a: 'After your first week of trading (from Monday 0:00 UTC to Sunday 23h59 UTC) points and rewards are locked 7 days. During this 7 days buffer period, the team will analyze the data and exclude potential cheaters. Once this buffer period ends, ARB will be claimable on Kyberswap.com/campaigns/dashboard.',
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
      a: 'Kyberswap doesn’t charge any fee on claiming rewards,  user only need to pay gas fee on Arbitrum for transaction execution',
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
      q: 'How can I be eligible to the trading campaign?',
      a: 'In order to be eligible, you need to create a Limit Order and get it filled on https://kyberswap.com/limit/arbitrum. Only filled orders will give you points.',
    },
    {
      q: 'What are points and how do I convert it to ARB rewards?',
      a: 'Points are calculated based on the tokens and the amount you swap. It will automatically be converted to ARB after a 7 days buffer period.',
    },
    {
      q: 'Where can I trade to be eligible for the rewards?',
      a: 'Only https://kyberswap.com/limit/arbitrum is eligible.',
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
      q: 'How do you calculate the rewards?',
      a: 'The distribution of ARB rewards are based on the points distributed to users. All users will grow a Points portfolio for each week. Here’s the formula for the conversion of Points to ARB: User earned Points for the week /  Total Users Point for the week) X Amount of ARB allocation for the week.',
    },
    {
      q: 'How long do the campaigns last?',
      a: 'The Limit-Order Campaign works on a weekly basis. The Campaign will last until 16th September with 10 weeks of activity. Points and Rewards are reset to 0 each Monday at 0:00 UTC, after the end of each weekly event.',
    },
    {
      q: 'When can I claim my rewards?',
      a: 'After your first week of Limit-Order activities (from Monday 0:00 UTC to Sunday 23h59 UTC) points and rewards are locked 7 days. During this 7 days buffer period, the team will analyze the data and exclude potential cheaters. Once this buffer period ends, ARB will be claimable on Kyberswap.com/campaigns/dashboard.',
    },
  ],
  [CampaignType.Referrals]: [],
}

export default function Information({ type }: { type: CampaignType }) {
  const theme = useTheme()
  const [isShowRule, setIsShowRule] = useState(true)
  const [isShowTimeline, setIsShowTimeline] = useState(true)
  const [isShowReward, setIsShowReward] = useState(true)
  const [isShowFaq, setIsShowFaq] = useState(true)
  const [isShowTc, setIsShowTc] = useState(true)

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

      <Flex
        flexDirection="column"
        color={theme.subText}
        lineHeight="28px"
        marginLeft="12px"
        sx={{
          maxHeight: isShowRule ? '1000px' : 0,
          opacity: isShowRule ? 1 : 0,
          marginTop: isShowRule ? '1rem' : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {howToEarnPoints[type]}
      </Flex>

      <Divider style={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="20px">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          🕑️ Timeline
        </Flex>

        <ButtonIcon onClick={() => setIsShowTimeline(prev => !prev)}>
          {!isShowTimeline ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </Flex>

      <Flex
        flexDirection="column"
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
      </Flex>

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
          maxHeight: isShowTc ? '1000px' : 0,
          opacity: isShowTc ? 1 : 0,
          marginTop: isShowTc ? '1rem' : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <li>
          These Terms and Conditions{' '}
          <ExternalLink href="https://kyberswap.com/files/15022022KyberSwapTermsofUse.pdf">({'"Terms"'})</ExternalLink>{' '}
          should be read in conjunction with the KyberSwap Terms of Use, which lay out the terms and conditions that
          apply to all KyberSwap promotional activities ({'"Campaign"'}).
        </li>
        <li>
          The Campaign will run from{' '}
          <Text as="span" color="#ffffff" fontStyle="bold">
            8th July 2024 at 0:00 UTC to 15th September 2024 at 23:59 UTC UTC
          </Text>
          . KyberSwap retains the right to amend the {"Campaign's"} start and end dates with reasonable notice.
        </li>
        <li>All KyberSwap Aggregator API users from whitelisted clients are welcome to participate in the campaign.</li>
        <li>
          KyberSwap maintains the right, at its sole discretion, to disqualify any user who violates, cheats, or
          exploits the campaign.
        </li>
        <li>
          Please note that KyberSwap reserves the rights to change the rules & conditions at its sole discretion.{' '}
        </li>
        <li>
          Points & Rewards on the Leaderboard are subject to change during the buffer period before the distribution of
          ARB.{' '}
          <Text as="span" color="#ffffff" fontStyle="bold">
            Any wallet that tries to sybil or cheat in any way will have all their points and rewards forfeited.
          </Text>
        </li>
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

      <Flex
        flexDirection="column"
        color={theme.subText}
        lineHeight="28px"
        marginLeft="12px"
        sx={{
          maxHeight: isShowFaq ? '1000px' : 0,
          opacity: isShowFaq ? 1 : 0,
          marginTop: isShowReward ? '1rem' : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {faq[type].map(item => (
          <Faq q={item.q} a={item.a} key={item.q} />
        ))}
      </Flex>
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
