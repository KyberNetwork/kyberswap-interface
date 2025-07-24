import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
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

import Information from './components/Information'
import JoinReferral from './components/JoinReferral'
import Leaderboard from './components/Leaderboard'
import { NearIntentCampaignStats } from './components/NearIntentCampaignStats'
import { CampaignType, campaignConfig } from './constants'
import { useNearIntentSelectedWallet } from './hooks/useNearIntentSelectedWallet'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { pathname } = useLocation()
  const type =
    pathname === APP_PATHS.AGGREGATOR_CAMPAIGN
      ? CampaignType.Aggregator
      : pathname === APP_PATHS.LIMIT_ORDER_CAMPAIGN
      ? CampaignType.LimitOrder
      : pathname === APP_PATHS.MAY_TRADING_CAMPAIGN
      ? CampaignType.MayTrading
      : pathname === APP_PATHS.NEAR_INTENTS_CAMPAIGN
      ? CampaignType.NearIntents
      : CampaignType.Referrals

  const { campaign, weeks, ctaText, program, ctaLink, year, reward, banner, title, url } = campaignConfig[type]

  const startWeek = weeks[0].value
  const endWeek = weeks[weeks.length - 1].value

  const [selectedWeek, setSelectedWeek] = useState(startWeek <= w && w <= endWeek ? w : startWeek)

  useEffect(() => {
    if (selectedWeek < startWeek || selectedWeek > endWeek) {
      setSelectedWeek(endWeek)
    }
  }, [selectedWeek, startWeek, endWeek])

  const { account } = useWeb3React()
  const { data: userData } = useGetUserRewardQuery(
    {
      program,
      week: selectedWeek,
      year: year,
      wallet: account || '',
      campaign,
      url,
    },
    {
      skip: !account,
    },
  )
  const page = +(searchParams.get('page') || '1')

  const { data } = useGetLeaderboardQuery(
    {
      url,
      program,
      week: selectedWeek,
      year: year,
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

  const tab = searchParams.get('tab') || 'information'

  const marketPriceMap = useTokenPrices([reward.address], reward.chainId)
  const price = marketPriceMap?.[reward.address] || 0

  const rewardAmount = CurrencyAmount.fromRawAmount(
    new Token(1, ZERO_ADDRESS, reward.decimals, 'mock'),
    userData?.data?.reward?.split('.')[0] || '0',
  )
  const rewardNumber = rewardAmount ? rewardAmount.toSignificant(4) : '0'
  const rewardUsd = price * +rewardAmount?.toExact() || 0

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const { data: referralData } = useGetUserReferralTotalRewardQuery(
    { program, wallet: account || '' },
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

  const startEndIn =
    type === CampaignType.MayTrading
      ? `${isNotStart ? 'Starting in' : isEnd ? 'Ended at' : 'Ending in'}`
      : `Week ${selectedWeek - startWeek + 1} ${isNotStart ? 'starting in' : isEnd ? 'ended at' : 'ending in'}`
  const estRewardText = 'My Est. Rewards'

  useEffect(() => {
    searchParams.set('page', '1')
    setSearchParams(searchParams)
    // eslint-disable-next-line
  }, [campaign])

  const params = useNearIntentSelectedWallet()

  const info = (
    <InfoHelper
      text={
        <Text>
          The Estimated Rewards will vary based on the points earned by you and all campaign participants during the
          week. Check out how they are calculated in the{' '}
          <StyledInternalLink
            to={
              campaign === 'trading-incentive'
                ? type === CampaignType.Aggregator
                  ? '/campaigns/aggregator?tab=information'
                  : '/campaigns/may-trading?tab=information'
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
      <img src={banner} width="100%" alt="banner" style={{ borderRadius: '12px' }} />
      <Flex justifyContent="space-between" alignItems="center" marginTop="1.5rem">
        <Text fontSize={24} fontWeight="500">
          {title}
        </Text>

        {campaign === 'referral-program' && <JoinReferral />}
        {type === CampaignType.MayTrading && (
          <ButtonPrimary
            width={upToExtraSmall ? '100%' : '160px'}
            height="40px"
            onClick={() => {
              navigate(ctaLink)
            }}
          >
            {ctaText}
          </ButtonPrimary>
        )}
      </Flex>

      {campaign !== 'referral-program' && type != CampaignType.MayTrading && (
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
                {value?.value === w && year === new Date().getFullYear() ? (
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
              navigate(ctaLink)
            }}
          >
            {ctaText}
          </ButtonPrimary>
        </Flex>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns:
            type === CampaignType.NearIntents
              ? upToMedium
                ? '1fr'
                : '1fr 1.2fr'
              : upToSmall
              ? '1fr'
              : campaign !== 'referral-program'
              ? '1fr 1fr'
              : '1fr 2fr',
          marginTop: '1rem',
          gap: '12px',
        }}
      >
        <Flex width="100%" sx={{ gap: '12px' }} flexDirection={upToSmall ? 'column' : 'row'}>
          {campaign !== 'referral-program' && (
            <StatCard style={{ flex: 1 }}>
              <Text fontSize={14} color={theme.subText}>
                {startEndIn}
              </Text>
              <Text marginTop="8px" fontSize={20} fontWeight="500">
                {isEnd ? dayjs(week.end * 1000).format('MMM DD YYYY') : getFormattedTime(duration)}
              </Text>
            </StatCard>
          )}

          <StatCard style={{ flex: 1 }}>
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
        </Flex>

        {type === CampaignType.NearIntents ? (
          <NearIntentCampaignStats
            selectedWeek={selectedWeek}
            year={year}
            reward={reward}
            selectedWalletParams={params}
          />
        ) : (
          <Flex width="100%" sx={{ gap: '12px' }} flexDirection={upToSmall ? 'column' : 'row'}>
            <StatCard style={{ flex: 1 }}>
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
            <StatCard style={{ flex: 1 }}>
              <Text fontSize={14} color={theme.subText}>
                {estRewardText} {info}
              </Text>
              <Flex marginTop="8px" fontSize={20} fontWeight="500" alignItems="center">
                <img src={reward.logo} alt={reward.symbol} width="20px" height="20px" style={{ borderRadius: '50%' }} />
                <Text marginLeft="4px" fontSize={16}>
                  {campaign === 'referral-program' ? referralReward : rewardNumber} {reward.symbol}
                </Text>
                <Text ml="4px" fontSize={14} color={theme.subText}>
                  {formatDisplayNumber(usd, { style: 'currency', significantDigits: 4 })}
                </Text>
              </Flex>
            </StatCard>
          </Flex>
        )}
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

        <StyledInternalLink to={`${APP_PATHS.MY_DASHBOARD}?tab=${type}`}>[ My Dashboard ]</StyledInternalLink>
      </Flex>

      {tab === 'information' && <Information type={type} week={selectedWeek} />}

      {tab === 'leaderboard' && (
        <Leaderboard
          type={type}
          week={selectedWeek}
          year={year}
          wallet={
            type === CampaignType.NearIntents && params.selectedWallet && params.address[params.selectedWallet]
              ? params.address[params.selectedWallet] || undefined
              : undefined
          }
        />
      )}
    </Wrapper>
  )
}
