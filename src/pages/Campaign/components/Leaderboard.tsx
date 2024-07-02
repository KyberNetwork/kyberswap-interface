import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetLeaderboardQuery, useGetUserRewardQuery } from 'services/campaign'
import styled from 'styled-components'

import Divider from 'components/Divider'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import { useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import { CampaignType } from './Information'

const Wrapper = styled.div`
  border-radius: 20px;
  padding: 20px;
  background: ${({ theme }) => theme.background};
  margin-top: 20px;
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
      : 'referral'

  const { isLoading, data } = useGetLeaderboardQuery({
    week,
    year,
    campaign,
    pageSize: 10,
    pageNumber: page,
  })

  const { account } = useWeb3React()
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
      <Text fontSize={14} color={theme.subText} mb="1rem">
        Your rank{' '}
        <Text color={theme.text} fontWeight="500" as="span">
          {userData?.data?.rank || '--'}
        </Text>
      </Text>

      <Divider />

      <Flex padding="1rem 1.25rem">
        <Text width="50px" color={theme.subText} fontWeight="500" textAlign="center">
          RANK
        </Text>

        <Text color={theme.subText} fontWeight="500" flex={1} marginLeft="1.25rem">
          WALLET
        </Text>

        <Text width="100px" color={theme.subText} fontWeight="500" marginLeft="1.25rem" textAlign="right">
          POINTS
        </Text>
      </Flex>

      <Divider />

      {isLoading ? (
        <LocalLoader />
      ) : (
        data?.data?.leaderBoards.map((item, index) => (
          <Flex padding="1rem 1.25rem" key={item.wallet}>
            <Text width="50px" color={theme.subText} fontWeight="500" textAlign="center">
              {index + (page - 1) * 10 + 1}
            </Text>

            <Text color={theme.subText} fontWeight="500" flex={1} marginLeft="1.25rem" overflow="hidden">
              {upToSmall ? `${item.wallet.substring(0, 4 + 2)}...${item.wallet.substring(42 - 4)}` : item.wallet}
            </Text>

            <Text width="100px" color={theme.subText} fontWeight="500" marginLeft="1.25rem" textAlign="right">
              {formatDisplayNumber(item.point, { significantDigits: 6 })}
            </Text>
          </Flex>
        ))
      )}

      {!isLoading && (
        <Pagination
          onPageChange={p => {
            searchParams.set('page', p.toString())
            setSearchParams(searchParams)
          }}
          totalCount={data?.data?.participantCount || 0}
          currentPage={page}
          pageSize={10}
        />
      )}
    </Wrapper>
  )
}
