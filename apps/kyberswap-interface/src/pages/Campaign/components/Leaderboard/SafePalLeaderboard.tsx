import { Trans, t } from '@lingui/macro'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { useGetSafePalCampaignStatsQuery, useGetSafePalCampaignTransactionsQuery } from 'services/campaignSafepal'

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
import { cn } from 'utils/cn'

const StatusBadge = ({ isWinner, children }: { isWinner: boolean; children: ReactNode }) => (
  <div
    className={cn(
      'min-w-[120px] rounded-full px-2 py-1.5 text-center text-xs',
      isWinner ? 'bg-primary-15 text-primary' : 'bg-subText-20 text-subText',
    )}
  >
    {children}
  </div>
)

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
      skip: isOwner || !selectedRange,
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
  const hasLeaderboardEntries = !isOwner && !!leaderboardData?.entries.length

  const renderLabel = (label: ReactNode) =>
    upToSmall ? <span className="text-[13px] font-medium text-subText">{label}</span> : null

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, page))
  }

  const rowClass = cn('gap-5', upToSmall ? 'grid grid-cols-2 gap-2 py-4' : 'flex flex-row px-5 py-4')

  return (
    <div className="mt-5 rounded-[20px] bg-background p-5 max-sm:p-4">
      {!isOwner && (
        <>
          <div
            className={cn(
              'mb-4 flex justify-between gap-3',
              upToSmall ? 'flex-col items-stretch' : 'flex-row items-center',
            )}
          >
            <span className="text-base text-subText">
              <Trans>Your rank</Trans> <span className="text-lg font-medium text-text">{userStats?.rank || '--'}</span>
            </span>

            <SearchInput
              placeholder={t`Search wallet address`}
              value={searchAddressInput}
              onChange={setSearchAddressInput}
              style={{
                width: upToSmall ? '100%' : '360px',
                background: theme.bg1,
              }}
            />
          </div>

          <Divider />
        </>
      )}

      {!upToSmall && (
        <>
          <div className="flex gap-5 px-5 py-4 text-xs font-medium text-subText">
            {isOwner ? (
              <span className="w-[160px]">
                <Trans>NETWORK</Trans>
              </span>
            ) : (
              <span className="w-[50px] text-center">
                <Trans>RANK</Trans>
              </span>
            )}
            <span className="flex-1">{isOwner ? t`TX HASH` : t`WALLET`}</span>
            <span className={cn('text-right', isOwner ? 'w-[120px]' : 'w-20')}>
              <Trans>POINTS</Trans>
            </span>
            {!isOwner && (
              <span className="w-[120px] text-center">
                <Trans>STATUS</Trans>
              </span>
            )}
          </div>
          <Divider />
        </>
      )}

      {isLoading ? (
        <LocalLoader />
      ) : !isOwner && hasLeaderboardEntries ? (
        leaderboardData.entries.map((entry, index) => {
          const rank = entry.rank || index + 1 + (currentPage - 1) * 10
          const isWinner = isSelectedWeekEnded && isSafePalCampaignWinner({ rank, total_points: entry.total_points })

          return (
            <div key={entry.user_address} className={cn(rowClass, 'text-sm text-text')}>
              <div
                className={cn('flex flex-col justify-center', upToSmall ? 'w-full text-left' : 'w-[50px] text-center')}
              >
                {renderLabel(<Trans>RANK</Trans>)}
                <span className="font-medium">{rank}</span>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                {renderLabel(<Trans>WALLET</Trans>)}
                <span className="font-medium">{shortenHash(entry.user_address, 4)}</span>
              </div>
              <div className={cn('flex flex-col justify-center', upToSmall ? 'w-full text-left' : 'w-20 text-right')}>
                {renderLabel(<Trans>POINTS</Trans>)}
                <span>{formatPointValue(entry.total_points)}</span>
              </div>
              <div className={cn('flex flex-col', upToSmall ? 'w-full items-start' : 'w-[120px] items-end')}>
                {renderLabel(<Trans>STATUS</Trans>)}
                {isSelectedWeekEnded ? (
                  <StatusBadge isWinner={isWinner}>{isWinner ? t`Winner` : t`Not a winner`}</StatusBadge>
                ) : (
                  <span className="w-full text-center text-subText">--</span>
                )}
              </div>
            </div>
          )
        })
      ) : !isJoinedByWeek ? (
        <div className="flex flex-col items-center justify-center gap-5 px-4 py-8">
          <span className="text-center text-sm text-subText">
            {isOwner ? (
              <Trans>Join to start tracking - only joined wallets have transactions recorded.</Trans>
            ) : (
              <Trans>You haven&apos;t joined this week yet. Join now to appear on the leaderboard.</Trans>
            )}
          </span>
          <ButtonPrimary
            width={upToSmall ? '100%' : '160px'}
            height="40px"
            disabled={!isSelectedWeekAvailable}
            onClick={onRequestJoin}
          >
            <Trans>Join Now</Trans>
          </ButtonPrimary>
        </div>
      ) : !isOwner && !hasLeaderboardPoints ? (
        <span className="mt-3 block p-6 text-center text-sm text-subText">
          <Trans>You&apos;ve joined. Start trading this week to appear on the leaderboard.</Trans>
        </span>
      ) : isOwner ? (
        transactionsData?.items.length ? (
          transactionsData.items.map(tx => {
            const explorerLink = getTransactionExplorerLink(tx.chain_id, tx.tx_hash)

            return (
              <div key={tx.id} className={cn(rowClass, 'text-sm text-text')}>
                <div className={cn('flex flex-col', upToSmall ? 'w-full' : 'w-[160px]')}>
                  {renderLabel(<Trans>NETWORK</Trans>)}
                  <span>{tx.chain_name || '--'}</span>
                </div>
                <div className="flex flex-1 flex-col">
                  {renderLabel(<Trans>TX HASH</Trans>)}
                  <div className="flex items-center gap-1.5">
                    <span>{shortenHash(tx.tx_hash, 4)}</span>
                    {explorerLink && <ExternalLinkIcon color={theme.subText} href={explorerLink} />}
                  </div>
                </div>
                <div className={cn('flex flex-col', upToSmall ? 'w-full text-left' : 'w-[120px] text-right')}>
                  {renderLabel(<Trans>POINTS</Trans>)}
                  <span className="font-medium">{formatPointValue(tx.point)}</span>
                </div>
              </div>
            )
          })
        ) : (
          <span className="mt-3 block p-6 text-center text-sm text-subText">{emptyStateMessage}</span>
        )
      ) : (
        <span className="mt-3 block p-6 text-center text-sm text-subText">{emptyStateMessage}</span>
      )}

      {!isLoading && totalCount > 0 && (
        <Pagination
          onPageChange={handlePageChange}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={10}
          style={{ marginTop: '12px' }}
        />
      )}
    </div>
  )
}
