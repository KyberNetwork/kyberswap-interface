import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useGetUserReferralTotalRewardQuery } from 'services/campaign'
import { useGetDashboardQuery, useGetParticipantQuery } from 'services/referral'

import Divider from 'components/Divider'
import Pagination from 'components/Pagination'
import { ZERO_ADDRESS } from 'constants/index'
import { useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export default function MyReferralDashboard({ price, infor }: { price: number; infor: ReactNode }) {
  const { account } = useWeb3React()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = +(searchParams.get('page') || '1')
  const theme = useTheme()
  const { data: userRefData, error: participantError } = useGetParticipantQuery(
    { wallet: account || '' },
    { skip: !account },
  )
  const userRefCode = userRefData?.data?.participant?.referralCode
  const { data: userReferralData, error } = useGetDashboardQuery(
    { referralCode: userRefCode || '', page, sort: 'createdAt:desc' },
    { skip: !userRefCode },
  )
  const { data: referralData, isLoading } = useGetUserReferralTotalRewardQuery(
    { wallet: account || '' },
    {
      skip: !account,
    },
  )
  const referralReward = referralData?.data?.totalReward
    ? CurrencyAmount.fromRawAmount(
        new Token(1, ZERO_ADDRESS, 18, 'mock'),
        referralData?.data?.totalReward.split('.')[0] || '0',
      ).toExact()
    : '0'

  const usd = +referralReward * price

  const totalItem = error || participantError ? 0 : userReferralData?.data.pagination.totalItems

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <Box marginTop="1.25rem" sx={{ borderRadius: '20px', background: theme.background }} padding="1.5rem">
      <Flex mb="24px" sx={{ gap: '1rem' }}>
        <Box flex={1}>
          <Text color={theme.subText} fontSize={14}>
            My total referrals
          </Text>
          <Text fontSize={18} fontWeight="500" color={theme.text} marginTop="8px">
            {totalItem ? formatDisplayNumber(totalItem.toFixed(3), { significantDigits: 6 }) : '--'}
          </Text>
        </Box>

        <Box flex={upToSmall ? 1 : 2}>
          <Text color={theme.subText} fontSize={14}>
            My total estimated rewards {infor}
          </Text>
          <Flex
            fontSize={18}
            fontWeight="500"
            color={theme.text}
            marginTop="8px"
            alignItems="center"
            sx={{ gap: '4px' }}
          >
            <img
              src="https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png"
              alt="arb"
              width="20px"
              height="20px"
              style={{ borderRadius: '50%' }}
            />

            {formatDisplayNumber((+referralReward).toFixed(3), { significantDigits: 6 })}
            {!!usd && (
              <Text as="span" color={theme.subText} fontSize={14}>
                {formatDisplayNumber(usd.toFixed(3), { style: 'currency', significantDigits: 4 })}
              </Text>
            )}
          </Flex>
        </Box>
      </Flex>

      <Divider />

      <Flex padding="1rem 0" color={theme.subText} fontSize="12px" fontWeight="500">
        <Text flex={1}>TIME</Text>
        <Text flex={1}>REFEREES WALLET ADDRESSES</Text>
      </Flex>

      <Divider />

      {(!userRefCode || error || !userReferralData?.data.referrals.length || participantError) && (
        <Text color={theme.subText} padding="30px" textAlign="center">
          No data found
        </Text>
      )}

      {!error &&
        !participantError &&
        userReferralData?.data.referrals.map(item => (
          <Flex padding="1rem 0" color={theme.subText} fontWeight="500" key={item.walletAddress} fontSize={14}>
            <Text flex={1}>{dayjs(item.createdAt * 1000).format('HH:mm DD MMM YYYY')}</Text>
            <Text flex={1}>
              {upToSmall
                ? `${item.walletAddress.substring(0, 4 + 2)}...${item.walletAddress.substring(42 - 4)}`
                : item.walletAddress}
            </Text>
          </Flex>
        ))}

      {!isLoading && (
        <Pagination
          onPageChange={p => {
            searchParams.set('page', p.toString())
            setSearchParams(searchParams)
          }}
          totalCount={userReferralData?.data?.pagination.totalItems || 0}
          currentPage={page}
          pageSize={10}
        />
      )}
    </Box>
  )
}
