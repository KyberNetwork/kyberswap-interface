import { ChainId, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useGetLeaderboardQuery, useGetUserReferralTotalRewardQuery, useGetUserRewardQuery } from 'services/campaign'
import { useGetDashboardQuery, useGetParticipantQuery } from 'services/referral'

import { ButtonPrimary } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import Select from 'components/Select'
import { APP_PATHS, ZERO_ADDRESS } from 'constants/index'
import { useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { MEDIA_WIDTHS, StyledInternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import loBanner from './assets/limit_order.png'
import referralBanner from './assets/referral.png'
import tradingBanner from './assets/trading.png'
import Information, { CampaignType } from './components/Information'
import JoinReferral from './components/JoinReferral'
import Leaderboard from './components/Leaderboard'
import { StatCard, Tab, Tabs, Wrapper } from './styles'

function getCurrentWeek(): number {
  const currentDate: Date = new Date()
  const startOfYear: Date = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1))

  // Calculate the day of the week for the start of the year in UTC
  const dayOfWeek: number = startOfYear.getUTCDay()

  // Adjust the start of the year to the nearest Monday in UTC
  let firstMonday: Date
  if (dayOfWeek <= 4) {
    firstMonday = new Date(startOfYear.setUTCDate(startOfYear.getUTCDate() - dayOfWeek + 1))
  } else {
    firstMonday = new Date(startOfYear.setUTCDate(startOfYear.getUTCDate() + (8 - dayOfWeek)))
  }

  // Calculate the difference in days from the first Monday of the year in UTC
  const diffInMs: number = currentDate.getTime() - firstMonday.getTime()
  const diffInDays: number = Math.floor(diffInMs / (24 * 60 * 60 * 1000))

  // Calculate the week number
  const weekNumber: number = Math.ceil((diffInDays + 1) / 7)

  return weekNumber
}

const weeks = [
  {
    value: 37,
    label: (
      <Text>
        <Text as="span" color="#ffffff">
          Week 10
        </Text>{' '}
        Sep 09 - Sep 15
      </Text>
    ),
    start: 1725840000,
    end: 1726444800,
  },
  {
    value: 36,
    label: (
      <Text>
        <Text as="span" color="#ffffff">
          Week 9
        </Text>{' '}
        Sep 02 - Sep 08
      </Text>
    ),
    start: 1725235200,
    end: 1725840000,
  },
  {
    value: 35,
    label: (
      <Text>
        <Text as="span" color="#ffffff">
          Week 8
        </Text>{' '}
        Aug 26 - Sep 01
      </Text>
    ),
    start: 1724630400,
    end: 1725235200,
  },
  {
    value: 34,
    label: (
      <Text>
        <Text as="span" color="#ffffff">
          Week 7
        </Text>{' '}
        Aug 19 - Aug 25
      </Text>
    ),
    start: 1724025600,
    end: 1724630400,
  },
  {
    value: 33,
    label: (
      <Text>
        <Text as="span" color="#ffffff">
          Week 6
        </Text>{' '}
        Aug 12 - Aug 18
      </Text>
    ),
    start: 1723420800,
    end: 1724025600,
  },
  {
    value: 32,
    label: (
      <Text>
        <Text as="span" color="#ffffff">
          Week 5
        </Text>{' '}
        Aug 05 - Aug 11
      </Text>
    ),
    start: 1722816000,
    end: 1723420800,
  },
  {
    value: 31,
    label: (
      <Text>
        <Text as="span" color="#ffffff">
          Week 4
        </Text>{' '}
        July 29 - Aug 04
      </Text>
    ),
    start: 1722211200,
    end: 1722816000,
  },
  {
    value: 30,
    label: (
      <Text>
        <Text as="span" color="#ffffff">
          Week 3
        </Text>{' '}
        July 22 - July 28
      </Text>
    ),
    start: 1721606400,
    end: 1722211200,
  },
  {
    value: 29,
    label: (
      <Text>
        <Text as="span" color="#ffffff">
          Week 2
        </Text>{' '}
        July 15 - July 21
      </Text>
    ),
    start: 1721001600,
    end: 1721606400,
  },
  {
    value: 28,
    label: (
      <Text>
        <Text as="span" color="#ffffff">
          Week 1
        </Text>{' '}
        July 08 - July 14
      </Text>
    ),
    start: 1720396800,
    end: 1721001600,
  },
].reverse()

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
  const navigate = useNavigate()
  const w = getCurrentWeek()
  const [selectedWeek, setSelectedWeek] = useState(w <= 37 ? w : 37)
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
      : 'referral-program'
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

  const { data } = useGetLeaderboardQuery(
    {
      week: selectedWeek,
      year: 2024,
      campaign,
      pageSize: 10,
      pageNumber: page,
    },
    {
      skip: campaign === 'referral-program',
    },
  )

  const { data: totalReferralData } = useGetDashboardQuery({ referralCode: '', page })
  const totalParticipant = totalReferralData?.data.pagination.totalItems

  const { data: userRefData } = useGetParticipantQuery({ wallet: account || '' }, { skip: !account })
  const userRefCode = userRefData?.data?.participant?.referralCode
  const { data: userReferralData } = useGetDashboardQuery(
    { referralCode: userRefCode || '', page: 1 },
    { skip: !userRefCode },
  )
  const myTotalRefer = userReferralData?.data?.pagination?.totalItems

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

  const marketPriceMap = useTokenPrices(['0x912CE59144191C1204E64559FE8253a0e49E6548'], ChainId.ARBITRUM)
  const price = marketPriceMap?.['0x912CE59144191C1204E64559FE8253a0e49E6548'] || 0

  const rewardAmount = CurrencyAmount.fromRawAmount(
    new Token(1, ZERO_ADDRESS, 18, 'mock'),
    userData?.data?.reward?.split('.')[0] || '0',
  )
  const rewardNumber = rewardAmount ? rewardAmount.toSignificant(4) : '0'
  const rewardUsd = price * +rewardAmount?.toExact() || 0

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const { data: referralData } = useGetUserReferralTotalRewardQuery(
    { wallet: account || '' },
    {
      skip: !account || campaign !== 'referral-program',
    },
  )

  const referralRewardAmount = CurrencyAmount.fromRawAmount(
    new Token(1, ZERO_ADDRESS, 18, 'mock'),
    referralData?.data?.totalReward.split('.')[0] || '0',
  )
  const referralReward = referralRewardAmount ? referralRewardAmount.toSignificant(4) : '0'
  const referralRewardUsd = price * +referralRewardAmount?.toExact() || 0

  const usd = campaign === 'referral-program' ? referralRewardUsd : rewardUsd

  useEffect(() => {
    searchParams.set('page', '1')
    setSearchParams(searchParams)
    // eslint-disable-next-line
  }, [campaign])
  const info = (
    <InfoHelper
      text={
        <Text>
          The Estimated Rewards will vary based on the points earned by you and all campaign participants during the
          week. Check out how they are calculated in the{' '}
          <StyledInternalLink
            to={
              campaign === 'trading-incentive'
                ? '/campaigns/aggregator?tab=information'
                : campaign === 'limit-order-farming'
                ? '/campaigns/limit-order?tab=information'
                : '/campaigns/referrals?tab=information'
            }
          >
            Information
          </StyledInternalLink>{' '}
          tab.
        </Text>
      }
    />
  )

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
      <Flex justifyContent="space-between" alignItems="center" marginTop="1.5rem">
        <Text fontSize={24} fontWeight="500">
          {type === CampaignType.Aggregator
            ? 'Aggregator Trading'
            : type === CampaignType.LimitOrder
            ? 'Limit Order'
            : 'Referral'}{' '}
          Campaign
        </Text>

        {campaign === 'referral-program' && <JoinReferral />}
      </Flex>

      {campaign !== 'referral-program' && (
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
              width: upToExtraSmall ? '100%' : '260px',
            }}
            optionStyle={{
              fontSize: '16px',
              width: upToExtraSmall ? 'calc(100vw - 48px)' : undefined,
            }}
            onChange={value => setSelectedWeek(value)}
            value={selectedWeek}
            optionRender={value => (
              <Text
                color={value?.value === selectedWeek ? theme.primary : theme.subText}
                display="flex"
                alignItems="center"
              >
                {value?.label}{' '}
                {value?.value === w ? (
                  <Text as="span" color={theme.red1} fontSize={12} ml="4px">
                    Active
                  </Text>
                ) : (
                  ''
                )}
              </Text>
            )}
          ></Select>
          <ButtonPrimary
            width={upToExtraSmall ? '100%' : '160px'}
            height="40px"
            onClick={() => {
              navigate(campaign === 'trading-incentive' ? '/swap/arbitrum/eth-to-arb' : '/limit/arbitrum')
            }}
          >
            {campaign === 'trading-incentive' ? 'Trade now' : 'Place order'}
          </ButtonPrimary>
        </Flex>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: upToExtraSmall
            ? '1fr'
            : upToSmall
            ? '1fr 1fr'
            : campaign !== 'referral-program'
            ? '1fr 1fr 1fr 1fr'
            : '1fr 1fr 1fr',
          marginTop: '1rem',
          gap: '12px',
        }}
      >
        {campaign !== 'referral-program' && (
          <StatCard>
            <Text fontSize={14} color={theme.subText}>
              Week {selectedWeek - 27} {isNotStart ? 'starting in' : isEnd ? 'ended at' : 'ending in'}
            </Text>
            <Text marginTop="8px" fontSize={20} fontWeight="500">
              {isEnd ? dayjs(week.end * 1000).format('MMM DD YYYY') : getFormattedTime(duration)}
            </Text>
          </StatCard>
        )}

        <StatCard>
          <Text fontSize={14} color={theme.subText}>
            Participants
          </Text>
          <Text marginTop="8px" fontSize={20} fontWeight="500">
            {campaign === 'referral-program'
              ? formatDisplayNumber(totalParticipant, { significantDigits: 6 })
              : data?.data?.participantCount
              ? formatDisplayNumber(data?.data.participantCount, { significantDigits: 6 })
              : '--'}
          </Text>
        </StatCard>

        <StatCard>
          <Text fontSize={14} color={theme.subText}>
            {campaign === 'referral-program' ? 'My referrals' : 'My Earned Points'}
          </Text>
          <Text marginTop="8px" fontSize={20} fontWeight="500">
            {campaign === 'referral-program'
              ? formatDisplayNumber(myTotalRefer || 0, { significantDigits: 4 })
              : userData?.data?.point
              ? formatDisplayNumber(Math.floor(userData?.data.point), { significantDigits: 6 })
              : '--'}
          </Text>
        </StatCard>

        <StatCard>
          <Text fontSize={14} color={theme.subText}>
            My Estimated Rewards {info}
          </Text>
          <Flex marginTop="8px" fontSize={20} fontWeight="500" alignItems="center">
            <img
              src="https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png"
              alt="arb"
              width="20px"
              height="20px"
              style={{ borderRadius: '50%' }}
            />
            <Text marginLeft="4px" fontSize={16}>
              {campaign === 'referral-program' ? referralReward : rewardNumber} ARB
            </Text>
            <Text ml="4px" fontSize={14} color={theme.subText}>
              {formatDisplayNumber(usd, { style: 'currency', significantDigits: 4 })}
            </Text>
          </Flex>
        </StatCard>
      </Box>

      <Flex justifyContent="space-between" alignItems="center" marginTop="1rem">
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

        <StyledInternalLink to={`${APP_PATHS.MY_DASHBOARD}?tab=${campaign}`}>[ My Dashboard ]</StyledInternalLink>
      </Flex>

      {tab === 'information' && <Information type={type} week={selectedWeek} />}

      {tab === 'leaderboard' && <Leaderboard type={type} week={selectedWeek} year={2024} />}
    </Wrapper>
  )
}
