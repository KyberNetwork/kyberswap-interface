import { useState } from 'react'
import { Minus, Plus, Star } from 'react-feather'
import { Box, Flex, Text } from 'rebass'

import Divider from 'components/Divider'
import useTheme from 'hooks/useTheme'
import { ButtonIcon } from 'pages/Pools/styleds'

export enum CampaignType {
  Aggregator = 'Aggregator',
  LimitOrder = 'LimitOrder',
  Referrals = 'Referrals',
}

const howToEarnPoints = {
  [CampaignType.Aggregator]: [
    'Points are earned each time a user swap eligible tokens on KyberSwap Aggregator API. Eligible tokens are indexed in 4 different categories, giving different amount of points per USD swapped.',
    'Category 1: ARB trading will give 10 Points per USD swapped. It can be paired with any eligible tokens from the list, except plsARB that falls in Category 3.',
    'Ex: ARB <> USDC; ETH <> ARB; PENDLE <> ARB',
    'Category 2: Uncorrelated tokens trading will give 5 Points per USD swapped. This section includes trading of any eligible token to any eligible token that do not fall in category 1; 3 and 4.',
    'Ex: ETH <> USDT; WBTC <> WSTETH; PENDLE <>KNC',
    'Category 3: ETH Derivatives trading will give 1.5 Points per USD swapped.',
    'Ex: ETH <> WSTETH; EZETH <> RETH; WEETH <> ETH',
    'Category 4: Stablecoins to Stablecoins trading will give 0.5 Points per USD swapped.',
    'Ex: USDC <> USDT; FRAX <> DAI; USDC.e <> MIM',
  ],
  [CampaignType.LimitOrder]: [],
  [CampaignType.Referrals]: [],
}

const timelines = {
  [CampaignType.Aggregator]: 'The Campaign will take place over 12 weeks, from xxx to xxx 2024.',
  [CampaignType.LimitOrder]: 'The Campaign will take place over 12 weeks, from xxx to xxx 2024.',
  [CampaignType.Referrals]: 'The Campaign will take place over 12 weeks, from xxx to xxx 2024.',
}

const rewards = {
  [CampaignType.Aggregator]: 45000,
  [CampaignType.LimitOrder]: 45000,
  [CampaignType.Referrals]: 45000,
}

const faq = {
  [CampaignType.Aggregator]: [
    {
      q: 'How can I be eligible to the trading campaign?',
      a: 'In order to be eligible, you need to make a swap from KyberSwap Aggregator API and trade any of the eligible tokens.',
    },
    {
      q: 'What are points and how do I convert it to ARB rewards?',
      a: 'xyz',
    },
  ],
  [CampaignType.LimitOrder]: [],
  [CampaignType.Referrals]: [],
}

export default function Information({ type }: { type: CampaignType }) {
  const theme = useTheme()
  const [isShowRule, setIsShowRule] = useState(true)
  const [isShowTimeline, setIsShowTimeline] = useState(true)
  const [isShowReward, setIsShowReward] = useState(true)
  const [isShowFaq, setIsShowFaq] = useState(true)
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

        <ButtonIcon onClick={() => setIsShowRule(prev => !prev)}>{!isShowRule ? <Plus /> : <Minus />}</ButtonIcon>
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
        {howToEarnPoints[type].map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </Flex>

      <Divider style={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="20px">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          🕑️ Timeline
        </Flex>

        <ButtonIcon onClick={() => setIsShowTimeline(prev => !prev)}>
          {!isShowTimeline ? <Plus /> : <Minus />}
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

        <ButtonIcon onClick={() => setIsShowReward(prev => !prev)}>{!isShowReward ? <Plus /> : <Minus />}</ButtonIcon>
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
        <Text color={theme.text} fontSize={20} fontWeight="500" as="span">
          {rewards[type]} ARB
        </Text>{' '}
        is allocated for this campaign each week.
      </Text>

      <Divider style={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="20px">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          ❓ FAQ
        </Flex>

        <ButtonIcon onClick={() => setIsShowFaq(prev => !prev)}>{!isShowFaq ? <Plus /> : <Minus />}</ButtonIcon>
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

const Faq = ({ q, a }: { q: string; a: string }) => {
  const [show, setShow] = useState(false)
  const theme = useTheme()
  return (
    <>
      <Flex justifyContent="space-between" marginTop="1rem">
        <li style={{ flex: 1 }}>{q}</li>
        <ButtonIcon onClick={() => setShow(prev => !prev)}>{show ? <Minus /> : <Plus />}</ButtonIcon>
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
