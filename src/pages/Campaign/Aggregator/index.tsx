import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Select from 'components/Select'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { StyledInternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import banner from '../assets/banner.png'
import Information, { CampaignType } from '../components/Information'
import Leaderboard from '../components/Leaderboard'

const Wrapper = styled.div`
  max-width: 960px;
  margin-x: auto;
`

const StatCard = styled.div`
  border-radius: 20px;
  background: ${({ theme }) => theme.background};
  padding: 1rem 1.5rem;
`

const Tabs = styled.div`
  display: flex;
  gap: 1.5rem;
  font-size: 20px;
  font-weight: 500;
`

const Tab = styled.div<{ active: boolean }>`
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  cursor: pointer;
`

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

  return (
    <Wrapper>
      <img src={banner} width="100%" alt="banner" />
      <Text fontSize={24} fontWeight="500" marginTop="1.5rem">
        Aggregator Trading Campaign
      </Text>

      <Flex justifyContent="space-between" marginTop="1.5rem" alignItems="center">
        <Select
          options={weeks}
          style={{
            fontSize: '16px',
            border: `1px solid ${theme.border}`,
          }}
          optionStyle={{
            fontSize: '16px',
          }}
          onChange={value => setSelectedWeek(value)}
          value={selectedWeek}
        ></Select>
        <ButtonPrimary width="160px">Trade now</ButtonPrimary>
      </Flex>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', marginTop: '1rem', gap: '24px' }}>
        <StatCard>
          <Text fontSize={14} color={theme.subText}>
            Week {selectedWeek - 25} {isNotStart ? 'starting in' : isEnd ? 'ended at' : 'ending in'}
          </Text>
          <Text marginTop="8px" fontSize={20} fontWeight="500">
            {isEnd ? dayjs(week.end).format('MM/DD/YYYY') : getFormattedTime(duration)}
          </Text>
        </StatCard>

        <StatCard>
          <Text fontSize={14} color={theme.subText}>
            Participants
          </Text>
          <Text marginTop="8px" fontSize={20} fontWeight="500">
            {formatDisplayNumber(1234, { significantDigits: 6 })}
          </Text>
        </StatCard>

        <StatCard>
          <Text fontSize={14} color={theme.subText}>
            My Earned Points
          </Text>
          <Text marginTop="8px" fontSize={20} fontWeight="500">
            {formatDisplayNumber(1234, { significantDigits: 6 })}
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
            <Text marginLeft="4px">13.4 ARB</Text>
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
        {tab === 'information' && (
          <Information
            type={
              pathname === APP_PATHS.AGGREGATOR_CAMPAIGN
                ? CampaignType.Aggregator
                : pathname === APP_PATHS.LIMIT_ORDER_CAMPAIGN
                ? CampaignType.LimitOrder
                : CampaignType.Referrals
            }
          />
        )}
        {tab === 'leaderboard' && <Leaderboard />}
      </Flex>
    </Wrapper>
  )
}
