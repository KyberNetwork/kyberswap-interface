import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetLeaderboardQuery, useGetUserRewardQuery } from 'services/campaign'
import { useGetDashboardQuery } from 'services/referral'
import styled from 'styled-components'

import Divider from 'components/Divider'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import { CampaignType } from './Information'

const Wrapper = styled.div`
  border-radius: 20px;
  padding: 20px;
  background: ${({ theme }) => theme.background};
  margin-top: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  padding: 1rem;
  `}
`

export default function Leaderboard({ type, week, year }: { type: CampaignType; week: number; year: number }) {
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = +(searchParams.get('page') || '1')

  const campaign =
    type === CampaignType.Aggregator
      ? 'trading-incentive'
      : type === CampaignType.LimitOrder
      ? 'limit-order-farming'
      : 'referral-program'

  const { isLoading, data } = useGetLeaderboardQuery(
    {
      week,
      year,
      campaign,
      pageSize: 10,
      pageNumber: page,
    },
    {
      skip: campaign === 'referral-program',
    },
  )

  const { account } = useActiveWeb3React()
  const { data: referralData } = useGetDashboardQuery({ referralCode: '', page })

  const { data: userData } = useGetUserRewardQuery(
    {
      week,
      year,
      wallet: account || '',
      campaign,
    },
    {
      skip: !account,
    },
  )

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <Wrapper>
      {campaign !== 'referral-program' && (
        <>
          <Text fontSize={16} color={theme.subText} mb="1rem">
            Your rank{' '}
            <Text color={theme.text} fontWeight="500" as="span" fontSize={18}>
              {userData?.data?.rank || '--'}
            </Text>
          </Text>

          <Divider />
        </>
      )}

      <Flex padding={upToSmall ? '1rem 0' : '1rem 1.25rem'} fontSize={12} fontWeight="500" color={theme.subText}>
        {campaign !== 'referral-program' && (
          <Text width="50px" textAlign="center">
            RANK
          </Text>
        )}

        <Text flex={1} marginLeft={campaign === 'referral-program' ? 0 : '1.25rem'}>
          WALLET
        </Text>

        <Text width="150px" marginLeft="1.25rem" textAlign="right">
          {campaign === 'referral-program' ? 'NUMBER OF REFERRALS' : 'POINTS'}
        </Text>
      </Flex>

      <Divider />

      {isLoading ? (
        <LocalLoader />
      ) : campaign !== 'referral-program' ? (
        data?.data?.leaderBoards.map((item, index) => (
          <Flex padding={upToSmall ? '1rem 0' : '1rem 1.25rem'} key={item.wallet} fontSize={14} color={theme.text}>
            <Text width="50px" fontWeight="500" textAlign="center">
              {index + (page - 1) * 10 + 1}
            </Text>

            <Text fontWeight="500" flex={1} marginLeft="1.25rem" overflow="hidden">
              {upToSmall ? `${item.wallet.substring(0, 4 + 2)}...${item.wallet.substring(42 - 4)}` : item.wallet}
            </Text>

            <Text width="100px" fontWeight="500" marginLeft="1.25rem" textAlign="right">
              {formatDisplayNumber(Math.floor(item.point), { significantDigits: 4 })}
            </Text>
          </Flex>
        ))
      ) : (
        referralData?.data.referrals.map(item => {
          return (
            <Flex padding="1.25rem" key={item.id} fontSize={14} color={theme.subText}>
              <Text fontWeight="500" flex={1} overflow="hidden">
                {upToSmall
                  ? `${item.walletAddress.substring(0, 4 + 2)}...${item.walletAddress.substring(42 - 4)}`
                  : item.walletAddress}
              </Text>

              <Text width="100px" fontWeight="500" marginLeft="1.25rem" textAlign="right">
                {formatDisplayNumber(item.referralsNumber, { significantDigits: 6 })}
              </Text>
            </Flex>
          )
        })
      )}

      {!isLoading &&
        (campaign === 'referral-program' ? !referralData?.data.referrals.length : !data?.data?.leaderBoards.length) && (
          <Text color={theme.subText} textAlign="center" padding="24px" marginTop="24px">
            No data found
          </Text>
        )}

      {!isLoading && (
        <Pagination
          onPageChange={p => {
            searchParams.set('page', p.toString())
            setSearchParams(searchParams)
          }}
          totalCount={
            (campaign === 'referral-program'
              ? referralData?.data.pagination.totalItems
              : data?.data?.participantCount) || 0
          }
          currentPage={page}
          pageSize={10}
        />
      )}
    </Wrapper>
  )
}
