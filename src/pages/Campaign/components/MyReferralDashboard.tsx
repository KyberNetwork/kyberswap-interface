import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { Box, Flex, Text } from 'rebass'
import { useGetUserReferralTotalRewardQuery } from 'services/campaign'
import { useGetDashboardQuery, useGetParticipantQuery } from 'services/referral'

import Divider from 'components/Divider'
import { ZERO_ADDRESS } from 'constants/index'
import { useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

export default function MyReferralDashboard({ price }: { price: number }) {
  const { account } = useWeb3React()
  const theme = useTheme()
  const { data: userRefData } = useGetParticipantQuery({ wallet: account || '' }, { skip: !account })
  const userRefCode = userRefData?.data?.participant?.referralCode
  const { data: userReferralData } = useGetDashboardQuery(
    { referralCode: userRefCode || '', page: 1 },
    { skip: !userRefCode },
  )
  const { data: referralData } = useGetUserReferralTotalRewardQuery(
    { wallet: account || '' },
    {
      skip: !account,
    },
  )
  const referralReward = referralData?.data?.totalReward
    ? CurrencyAmount.fromRawAmount(
        new Token(1, ZERO_ADDRESS, 18, 'mock'),
        referralData?.data?.totalReward.split('.')[0] || '0',
      ).toSignificant(6)
    : '0'

  const usd = +referralReward * price

  const totalItem = userReferralData?.data.pagination.totalItems

  return (
    <Box marginTop="1.25rem" sx={{ borderRadius: '20px', background: theme.background }} padding="1.5rem">
      <Flex mb="24px" sx={{ gap: '1rem' }}>
        <Box>
          <Text color={theme.subText} fontSize={14}>
            My total referrals
          </Text>
          <Text fontSize={18} fontWeight="500" color={theme.text} marginTop="8px">
            {totalItem ? formatDisplayNumber(totalItem, { significantDigits: 6 }) : '--'}
          </Text>
        </Box>

        <Box>
          <Text color={theme.subText} fontSize={14}>
            My total estimated rewards
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

            {formatDisplayNumber(referralReward, { significantDigits: 6 })}
            {!!usd && (
              <Text as="span" color={theme.subText} fontSize={14}>
                {formatDisplayNumber(usd, { style: 'currency', significantDigits: 4 })}
              </Text>
            )}
          </Flex>
        </Box>
      </Flex>

      <Divider />

      <Flex padding="1rem" color={theme.subText} fontSize="12px" fontWeight="500">
        <Text flex={2}>TIME</Text>
        <Text flex={3}>REFEREES WALLET ADDRESSES</Text>
      </Flex>

      <Divider />

      {!userRefCode && (
        <Text color={theme.subText} padding="30px" textAlign="center">
          No data found
        </Text>
      )}

      {userReferralData?.data.referrals.map(item => (
        <Flex padding="1rem" color={theme.subText} fontWeight="500" key={item.walletAddress} fontSize={14}>
          <Text flex={2}>{dayjs(item.createdAt * 1000).format('DD/MM/YYYY HH:mm')}</Text>
          <Text flex={3}>{item.walletAddress}</Text>
        </Flex>
      ))}
    </Box>
  )
}
