import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useGetSafePalCampaignStatsQuery, useGetSafePalCampaignTransactionsQuery } from 'services/campaignSafepal'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import SearchInput from 'components/SearchInput'
import { ZERO_ADDRESS } from 'constants/index'
import { isSupportedChainId } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { useSafePalCampaignJoin } from 'pages/Campaign/hooks/useSafePalCampaignJoin'
import { resolveSelectedCampaignWeek } from 'pages/Campaign/utils'
import { isCampaignWeekActive, isCampaignWeekEnded, isSafePalCampaignWinner } from 'pages/Campaign/utils/safepalUtils'
import { ExternalLinkIcon, MEDIA_WIDTHS } from 'theme'
import { getEtherscanLink, shortenHash } from 'utils'

const Wrapper = styled.div`
  border-radius: 20px;
  padding: 20px;
  background: ${({ theme }) => theme.background};
  margin-top: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 1rem;
  `}
`

const StatusBadge = styled.div<{ $isWinner: boolean }>`
  background-color: ${({ theme, $isWinner }) => rgba($isWinner ? theme.primary : theme.subText, 0.16)};
  border-radius: 999px;
  color: ${({ theme, $isWinner }) => ($isWinner ? theme.primary : theme.subText)};
  font-size: 12px;
  min-width: 120px;
  padding: 6px 8px;
  text-align: center;
`

type Props = {
  type?: 'leaderboard' | 'owner'
  selectedWeek: number
  onRequestJoin?: () => void
}

const formatPointValue = (value?: number) => {
  if (value === undefined) return '--'
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const getTransactionExplorerLink = (chainId: number, txHash: string) => {
  if (!txHash || !isSupportedChainId(chainId)) return undefined
  return getEtherscanLink(chainId, txHash, 'transaction')
}

export default function SafePalLeaderboard({ type, selectedWeek, onRequestJoin }: Props) {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { account } = useActiveWeb3React()

  const { weeks } = campaignConfig[CampaignType.SafePal]
  const isOwner = type === 'owner'
  const selectedRange = useMemo(() => resolveSelectedCampaignWeek(weeks, selectedWeek), [selectedWeek, weeks])
  const [currentPage, setCurrentPage] = useState(1)
  const [searchAddressInput, setSearchAddressInput] = useState('')
  const [debouncedSearchAddress, setDebouncedSearchAddress] = useState('')

  const { isJoinedByWeek, userStats, isLoadingUserStats } = useSafePalCampaignJoin({ selectedWeek, enabled: true })
  const hasLeaderboardPoints = (userStats?.total_points || 0) > 0

  const isSelectedWeekAvailable = useMemo(() => isCampaignWeekActive(selectedRange), [selectedRange])
  const isSelectedWeekEnded = useMemo(() => isCampaignWeekEnded(selectedRange), [selectedRange])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchAddress(searchAddressInput.trim())
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [searchAddressInput])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedWeek, type, account, debouncedSearchAddress])

  const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useGetSafePalCampaignStatsQuery(
    {
      fromTs: selectedRange?.start || 0,
      toTs: selectedRange?.end || 0,
      page: currentPage,
      userAddress: debouncedSearchAddress || undefined,
    },
    {
      skip: isOwner || !selectedRange || !hasLeaderboardPoints,
      pollingInterval: 30_000,
    },
  )

  const { data: transactionsData, isLoading: isLoadingTransactions } = useGetSafePalCampaignTransactionsQuery(
    {
      address: account || ZERO_ADDRESS,
      fromTs: selectedRange?.start || 0,
      toTs: selectedRange?.end || 0,
      page: currentPage,
    },
    {
      skip: !isOwner || !selectedRange || !account || !hasLeaderboardPoints,
      pollingInterval: 30_000,
    },
  )

  const isLoading = isOwner ? isLoadingTransactions : isLoadingLeaderboard || (!!account && isLoadingUserStats)
  const totalCount = isOwner ? transactionsData?.total_items || 0 : leaderboardData?.total_items || 0
  const emptyStateMessage = isOwner ? t`No transactions found for this week.` : t`No participants found for this week.`

  const renderLabel = (label: ReactNode) =>
    upToSmall ? (
      <Text fontWeight="500" fontSize={13} color={theme.subText}>
        {label}
      </Text>
    ) : null

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, page))
  }

  return (
    <Wrapper>
      {!isOwner && hasLeaderboardPoints && (
        <>
          <Flex
            justifyContent="space-between"
            alignItems={upToSmall ? 'stretch' : 'center'}
            flexDirection={upToSmall ? 'column' : 'row'}
            sx={{ gap: '12px' }}
            mb="1rem"
          >
            <Text fontSize={16} color={theme.subText}>
              <Trans>Your rank</Trans>{' '}
              <Text color={theme.text} fontWeight="500" as="span" fontSize={18}>
                {userStats?.rank || '--'}
              </Text>
            </Text>

            <SearchInput
              placeholder={t`Search wallet address`}
              value={searchAddressInput}
              onChange={setSearchAddressInput}
              style={{
                width: upToSmall ? '100%' : '360px',
                background: theme.bg1,
              }}
            />
          </Flex>

          <Divider />
        </>
      )}

      {!upToSmall && (
        <>
          <Flex padding="1rem 1.25rem" fontSize={12} color={theme.subText} fontWeight="500" sx={{ gap: '1.25rem' }}>
            {isOwner ? (
              <Text width="160px">
                <Trans>NETWORK</Trans>
              </Text>
            ) : (
              <Text width="50px" textAlign="center">
                <Trans>RANK</Trans>
              </Text>
            )}
            <Text flex={1}>{isOwner ? t`TX HASH` : t`WALLET`}</Text>
            <Text width={isOwner ? '120px' : '80px'} textAlign="right">
              <Trans>POINTS</Trans>
            </Text>
            {!isOwner && (
              <Text width="120px" textAlign="center">
                <Trans>STATUS</Trans>
              </Text>
            )}
          </Flex>
          <Divider />
        </>
      )}

      {isLoading ? (
        <LocalLoader />
      ) : !isJoinedByWeek ? (
        <Flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          padding="32px 16px"
          sx={{ gap: '20px' }}
        >
          <Text textAlign="center" color={theme.subText} fontSize={14}>
            {isOwner ? (
              <Trans>Join to start tracking - only joined wallets have transactions recorded.</Trans>
            ) : (
              <Trans>You haven&apos;t joined this week yet. Join now to appear on the leaderboard.</Trans>
            )}
          </Text>
          <ButtonPrimary
            width={upToSmall ? '100%' : '160px'}
            height="40px"
            disabled={!isSelectedWeekAvailable}
            onClick={onRequestJoin}
          >
            <Trans>Join Now</Trans>
          </ButtonPrimary>
        </Flex>
      ) : !isOwner && !hasLeaderboardPoints ? (
        <Text textAlign="center" color={theme.subText} padding="24px" marginTop="12px" fontSize={14}>
          <Trans>You&apos;ve joined. Start trading this week to appear on the leaderboard.</Trans>
        </Text>
      ) : isOwner ? (
        transactionsData?.items.length ? (
          transactionsData.items.map(tx => {
            const explorerLink = getTransactionExplorerLink(tx.chain_id, tx.tx_hash)

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
                  <Text>{tx.chain_name || '--'}</Text>
                </Flex>
                <Flex flex={1} flexDirection="column">
                  {renderLabel(<Trans>TX HASH</Trans>)}
                  <Flex alignItems="center" sx={{ gap: '6px' }}>
                    <Text>{shortenHash(tx.tx_hash, 4)}</Text>
                    {explorerLink && <ExternalLinkIcon color={theme.subText} href={explorerLink} />}
                  </Flex>
                </Flex>
                <Flex
                  width={upToSmall ? '100%' : '120px'}
                  flexDirection="column"
                  textAlign={upToSmall ? 'left' : 'right'}
                >
                  {renderLabel(<Trans>POINTS</Trans>)}
                  <Text fontWeight="500">{formatPointValue(tx.point)}</Text>
                </Flex>
              </Box>
            )
          })
        ) : (
          <Text color={theme.subText} textAlign="center" padding="24px" marginTop="12px" fontSize={14}>
            {emptyStateMessage}
          </Text>
        )
      ) : leaderboardData?.entries.length ? (
        leaderboardData.entries.map((entry, index) => {
          const rank = entry.rank || index + 1 + (currentPage - 1) * 10
          const isWinner = isSelectedWeekEnded && isSafePalCampaignWinner({ rank, total_points: entry.total_points })

          return (
            <Box
              display={upToSmall ? 'grid' : 'flex'}
              key={entry.user_address}
              padding={upToSmall ? '1rem 0' : '1rem 1.25rem'}
              fontSize={14}
              color={theme.text}
              flexDirection={upToSmall ? 'column' : 'row'}
              sx={{
                gap: upToSmall ? '0.5rem' : '1.25rem',
                gridTemplateColumns: upToSmall ? 'repeat(2, minmax(0, 1fr))' : 'none',
              }}
            >
              <Flex
                width={upToSmall ? '100%' : '50px'}
                flexDirection="column"
                textAlign={upToSmall ? 'left' : 'center'}
                justifyContent="center"
              >
                {renderLabel(<Trans>RANK</Trans>)}
                <Text fontWeight="500">{rank}</Text>
              </Flex>
              <Flex flex={1} flexDirection="column" justifyContent="center">
                {renderLabel(<Trans>WALLET</Trans>)}
                <Text fontWeight="500">{shortenHash(entry.user_address, 4)}</Text>
              </Flex>
              <Flex
                width={upToSmall ? '100%' : '80px'}
                flexDirection="column"
                textAlign={upToSmall ? 'left' : 'right'}
                justifyContent="center"
              >
                {renderLabel(<Trans>POINTS</Trans>)}
                <Text>{formatPointValue(entry.total_points)}</Text>
              </Flex>
              <Flex
                width={upToSmall ? '100%' : '120px'}
                flexDirection="column"
                alignItems={upToSmall ? 'flex-start' : 'flex-end'}
              >
                {renderLabel(<Trans>STATUS</Trans>)}
                {isSelectedWeekEnded ? (
                  <StatusBadge $isWinner={isWinner}>{isWinner ? t`Winner` : t`Not a winner`}</StatusBadge>
                ) : (
                  <Text width="100%" textAlign="center" color={theme.subText}>
                    --
                  </Text>
                )}
              </Flex>
            </Box>
          )
        })
      ) : (
        <Text color={theme.subText} textAlign="center" padding="24px" marginTop="12px" fontSize={14}>
          {emptyStateMessage}
        </Text>
      )}

      {!isLoading && isJoinedByWeek && totalCount > 0 && (
        <Pagination
          onPageChange={handlePageChange}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={10}
          style={{ marginTop: '12px' }}
        />
      )}
    </Wrapper>
  )
}
