import { Trans, t } from '@lingui/macro'
import { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useGetRaffleCampaignTransactionsQuery } from 'services/campaignRaffle'
import styled from 'styled-components'

import Divider from 'components/Divider'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import { NETWORKS_INFO, isSupportedChainId } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { shortenHash } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

const Wrapper = styled.div`
  border-radius: 20px;
  padding: 20px;
  background: ${({ theme }) => theme.background};
  margin-top: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 1rem;
  `}
`

const PAGE_SIZE = 10

type Props = {
  type?: 'leaderboard' | 'owner'
  selectedWeek: number
}

export default function RaffleLeaderboard({ type, selectedWeek }: Props) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [searchParams, setSearchParams] = useSearchParams()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const pageFromQuery = Number(searchParams.get('page') || '1')
  const currentPage = Number.isFinite(pageFromQuery) && pageFromQuery > 0 ? pageFromQuery : 1

  const { data, isLoading } = useGetRaffleCampaignTransactionsQuery(
    {
      page: currentPage,
      limit: PAGE_SIZE,
      week: selectedWeek + 1,
      address: type === 'owner' ? account : undefined,
    },
    {
      skip: type === 'owner' ? !account : false,
      pollingInterval: 10_000,
    },
  )

  const transactions = data?.txs ?? []
  const pagination = data?.pagination
  const totalCount = pagination ? pagination.totalOfPages * pagination.pageSize : 0

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    setSearchParams(params)
  }

  const renderLabel = (label: ReactNode) =>
    upToSmall ? (
      <Text fontWeight="500" fontSize={13} color={theme.subText}>
        {label}
      </Text>
    ) : null

  return (
    <Wrapper>
      {!upToSmall && (
        <>
          <Flex padding="1rem 1.25rem" fontSize={12} color={theme.subText} fontWeight="500" sx={{ gap: '1.25rem' }}>
            <Text width={upToSmall ? '100%' : '160px'}>
              <Trans>NETWORK</Trans>
            </Text>
            <Text flex={1}>
              <Trans>TX HASH</Trans>
            </Text>
            <Text width={upToSmall ? '120px' : '160px'} textAlign="right">
              <Trans>DIFFERENCE</Trans>
            </Text>
            <Text width={upToSmall ? '120px' : '160px'} textAlign="right">
              <Trans>REWARDS</Trans>
            </Text>
          </Flex>
          <Divider />
        </>
      )}

      {isLoading ? (
        <LocalLoader />
      ) : transactions.length ? (
        transactions.map(tx => {
          const networkName = isSupportedChainId(tx.chain) ? NETWORKS_INFO[tx.chain].name : '-'
          return (
            <Box
              display={upToSmall ? 'grid' : 'flex'}
              key={tx.id}
              padding={upToSmall ? '1rem 0' : '1rem 1.25rem'}
              fontSize={14}
              color={theme.text}
              flexDirection={upToSmall ? 'column' : 'row'}
              sx={{
                gap: upToSmall ? '0.5rem' : '1.25rem',
                gridTemplateColumns: upToSmall ? 'repeat(2, minmax(0, 1fr))' : 'none',
              }}
            >
              <Flex width={upToSmall ? '100%' : '160px'} flexDirection="column">
                {renderLabel(<Trans>NETWORK</Trans>)}
                <Text>{networkName}</Text>
              </Flex>
              <Flex flex={1} flexDirection="column">
                {renderLabel(<Trans>TX HASH</Trans>)}
                <Text>{shortenHash(tx.tx, 4)}</Text>
              </Flex>
              <Flex
                width={upToSmall ? '100%' : '160px'}
                flexDirection="column"
                textAlign={upToSmall ? 'left' : 'right'}
              >
                {renderLabel(<Trans>DIFFERENCE</Trans>)}
                <Text fontWeight="500">{formatDisplayNumber(tx.diff, { significantDigits: 6 })}</Text>
              </Flex>
              <Flex
                width={upToSmall ? '100%' : '160px'}
                flexDirection="column"
                textAlign={upToSmall ? 'left' : 'right'}
              >
                {renderLabel(<Trans>REWARDS</Trans>)}
                <Text>{formatDisplayNumber(tx.rewarded, { significantDigits: 6 })} KNC</Text>
              </Flex>
            </Box>
          )
        })
      ) : (
        <Text color={theme.subText} textAlign="center" padding="24px" marginTop="12px">
          {t`No data found`}
        </Text>
      )}

      {!isLoading && totalCount > 0 && (
        <Pagination
          onPageChange={handlePageChange}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pagination?.pageSize ?? PAGE_SIZE}
          style={{ marginTop: '12px' }}
        />
      )}
    </Wrapper>
  )
}
