import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useGetLeaderboardQuery, useGetUserRewardQuery } from 'services/campaign'

import { ButtonPrimary } from 'components/Button'
import Select from 'components/Select'
import { APP_PATHS, ZERO_ADDRESS } from 'constants/index'
import { useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS, StyledInternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import loBanner from './assets/limit_order.png'
import referralBanner from './assets/referral.png'
import tradingBanner from './assets/trading.png'
import Information, { CampaignType } from './components/Information'
import Leaderboard from './components/Leaderboard'
import { StatCard, Tab, Tabs, Wrapper } from './styles'

const weeks = [
  {
    value: 27,
    label: 'Week 3: July 01 - July 07',
    start: 1719792000,
    end: 1720310400,
  },
  {
    value: 26,
    label: 'Week 2: June 24 - June 30',
    start: 1719187200,
    end: 1719792000,
  },
  {
    value: 25,
    label: 'Week 1: June 17 - June 24',
    start: 1718582400,
    end: 1719187200,
  },
]

const getFormattedTime = (totalSeconds: number): string => {
  // const totalSeconds = Math.floor(milliseconds / 1000);
  const totalDays = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  const minutes = (totalMinutes % 60).toString().padStart(2, '0')

  return `${totalDays}D ${hours}H ${minutes}M ${seconds}S`
}

export default function Aggregator() {
  const theme = useTheme()
  const [selectedWeek, setSelectedWeek] = useState(27)
  const [searchParams, setSearchParams] = useSearchParams()
  const { pathname } = useLocation()
  const type =
    pathname === APP_PATHS.AGGREGATOR_CAMPAIGN
      ? CampaignType.Aggregator
      : pathname === APP_PATHS.LIMIT_ORDER_CAMPAIGN
      ? CampaignType.LimitOrder
      : CampaignType.Referrals

  const campaign =
    type === CampaignType.Aggregator
      ? 'trading-incentive'
      : type === CampaignType.LimitOrder
      ? 'limit-order-farming'
      : 'referral'
  const { account } = useWeb3React()
  const { data: userData } = useGetUserRewardQuery(
    {
      week: selectedWeek,
      year: 2024,
      wallet: account || '',
      campaign,
    },
    {
      skip: !account,
    },
  )
  const page = +(searchParams.get('page') || '1')

  const { data } = useGetLeaderboardQuery({
    week: selectedWeek,
    year: 2024,
    campaign,
    pageSize: 10,
    pageNumber: page,
  })

  const week = weeks.find(w => w.value === selectedWeek) || weeks[0]
  const now = Math.floor(Date.now() / 1000)

  const isNotStart = now < week.start
  const isEnd = now >= week.end

  const duration = isNotStart ? week.start - now : week.end - now
  const [counter, setCounter] = useState(duration)

  useEffect(() => {
    let i: NodeJS.Timeout | undefined
    if (counter > 0) {
      i = setTimeout(() => setCounter(prev => prev - 1), 1000)
    }
    return () => i && clearTimeout(i)
  }, [counter])

  const tab = searchParams.get('tab') || 'leaderboard'

  const rewardNumber = userData?.data?.reward
    ? CurrencyAmount.fromRawAmount(
        new Token(1, ZERO_ADDRESS, 18, 'mock'),
        userData.data.reward.split('.')[0],
      ).toSignificant(6)
    : '0'

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  return (
    <Wrapper>
      <img
        src={
          type === CampaignType.Aggregator
            ? tradingBanner
            : type === CampaignType.LimitOrder
            ? loBanner
            : referralBanner
        }
        width="100%"
        alt="banner"
        style={{ borderRadius: '12px' }}
      />
      <Text fontSize={24} fontWeight="500" marginTop="1.5rem">
        {type === CampaignType.Aggregator
          ? 'Aggregator Trading'
          : type === CampaignType.LimitOrder
          ? 'Limit Order'
          : 'Referral'}{' '}
        Campaign
      </Text>

      <Flex
        justifyContent="space-between"
        marginTop="1.5rem"
        alignItems="center"
        flexDirection={upToExtraSmall ? 'column' : 'row'}
        sx={{ gap: '1rem' }}
      >
        <Select
          options={weeks}
          style={{
            fontSize: '16px',
            border: `1px solid ${theme.border}`,
            width: upToExtraSmall ? '100%' : undefined,
          }}
          optionStyle={{
            fontSize: '16px',
          }}
          onChange={value => setSelectedWeek(value)}
          value={selectedWeek}
        ></Select>
        <ButtonPrimary width={upToExtraSmall ? '100%' : '160px'}>Trade now</ButtonPrimary>
      </Flex>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: upToSmall ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
          marginTop: '1rem',
          gap: '12px',
        }}
      >
        <StatCard>
          <Text fontSize={14} color={theme.subText}>
            Week {selectedWeek - 24} {isNotStart ? 'starting in' : isEnd ? 'ended at' : 'ending in'}
          </Text>
          <Text marginTop="8px" fontSize={20} fontWeight="500">
            {isEnd ? dayjs(week.end * 1000).format('MMM DD YYYY') : getFormattedTime(duration)}
          </Text>
        </StatCard>

        <StatCard>
          <Text fontSize={14} color={theme.subText}>
            Participants
          </Text>
          <Text marginTop="8px" fontSize={20} fontWeight="500">
            {data?.data?.participantCount
              ? formatDisplayNumber(data?.data.participantCount, { significantDigits: 6 })
              : '--'}
          </Text>
        </StatCard>

        <StatCard>
          <Text fontSize={14} color={theme.subText}>
            My Earned Points
          </Text>
          <Text marginTop="8px" fontSize={20} fontWeight="500">
            {userData?.data?.point ? formatDisplayNumber(userData?.data.point, { significantDigits: 6 }) : '--'}
          </Text>
        </StatCard>

        <StatCard>
          <Text fontSize={14} color={theme.subText}>
            My Estimated Rewards
          </Text>
          <Flex marginTop="8px" fontSize={20} fontWeight="500" alignItems="center">
            <img
              src="https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png"
              alt="arb"
              width="20px"
              height="20px"
              style={{ borderRadius: '50%' }}
            />
            <Text marginLeft="4px">{rewardNumber} ARB</Text>
          </Flex>
        </StatCard>
      </Box>

      <Flex justifyContent="space-between" alignItems="center" marginTop="1.5rem">
        <Tabs>
          <Tab
            role="button"
            active={tab === 'information'}
            onClick={() => {
              searchParams.set('tab', 'information')
              setSearchParams(searchParams)
            }}
          >
            Information
          </Tab>
          <Tab
            role="button"
            active={tab === 'leaderboard'}
            onClick={() => {
              searchParams.set('tab', 'leaderboard')
              setSearchParams(searchParams)
            }}
          >
            Leaderboard
          </Tab>
        </Tabs>

        <StyledInternalLink to={APP_PATHS.MY_DASHBOARD}>[ My Dashboard ]</StyledInternalLink>
      </Flex>

      {tab === 'information' && <Information type={type} />}

      {tab === 'leaderboard' && <Leaderboard type={type} week={selectedWeek} year={2024} />}
    </Wrapper>
  )
}
