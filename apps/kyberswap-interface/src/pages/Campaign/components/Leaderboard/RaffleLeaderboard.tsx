import { Trans, t } from '@lingui/macro'
import { ReactNode, useEffect, useState } from 'react'
import { useMedia } from 'react-use'
import { useGetRaffleCampaignTransactionsQuery } from 'services/campaignRaffle'

import Divider from 'components/Divider'
import Pagination from 'components/Pagination'
import Skeleton from 'components/Skeleton'
import { NETWORKS_INFO, isSupportedChainId } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { MEDIA_WIDTHS } from 'theme'
import { shortenHash } from 'utils/address'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const PAGE_SIZE = 10

type Props = {
  type?: 'leaderboard' | 'owner'
  selectedWeek: number
}

// Mirrors the raffle row layout (wallet/network · tx hash · difference · rewards).
const RaffleRowsSkeleton = ({ rows = 8, upToSmall }: { rows?: number; upToSmall: boolean }) => (
  <>
    {Array.from({ length: rows }, (_, i) => (
      <div
        key={i}
        className={cn('text-sm', upToSmall ? 'grid grid-cols-2 gap-2 py-4' : 'flex flex-row gap-5 px-5 py-4')}
      >
        <div className={cn('flex flex-col', upToSmall ? 'w-full' : 'w-40')}>
          <Skeleton width={100} height={16} />
        </div>
        <div className="flex flex-1 flex-col">
          <Skeleton width={120} height={16} />
        </div>
        <div className={cn('flex flex-col', upToSmall ? 'w-full items-start' : 'w-40 items-end')}>
          <Skeleton width={56} height={16} />
        </div>
        <div className={cn('flex flex-col', upToSmall ? 'w-full items-start' : 'w-40 items-end')}>
          <Skeleton width={70} height={16} />
        </div>
      </div>
    ))}
  </>
)

export default function RaffleLeaderboard({ type, selectedWeek }: Props) {
  const { account } = useActiveWeb3React()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const isOwner = type === 'owner'
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedWeek, type, account])

  const { data, isLoading } = useGetRaffleCampaignTransactionsQuery(
    {
      page: currentPage,
      limit: PAGE_SIZE,
      week: Math.max(selectedWeek + 1, 1),
      address: isOwner ? account : undefined,
    },
    {
      skip: isOwner ? !account : false,
      pollingInterval: 10_000,
    },
  )

  const transactions = data?.txs ?? []
  const pagination = data?.pagination
  const totalCount = pagination ? pagination.totalOfPages * pagination.pageSize : 0

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, page))
  }

  const renderLabel = (label: ReactNode) =>
    upToSmall ? <span className="text-[13px] font-medium text-subText">{label}</span> : null

  return (
    <div className="mt-5 rounded-[20px] bg-background p-5 max-sm:p-4">
      {!upToSmall && (
        <>
          <div className="flex gap-5 px-5 py-4 text-xs font-medium text-subText">
            {isOwner ? (
              <span className={cn(upToSmall ? 'w-full' : 'w-40')}>
                <Trans>NETWORK</Trans>
              </span>
            ) : (
              <span className={cn(upToSmall ? 'w-full' : 'w-40')}>
                <Trans>WALLET</Trans>
              </span>
            )}
            <span className="flex-1">
              <Trans>TX HASH</Trans>
            </span>
            <span className={cn('text-right', upToSmall ? 'w-[120px]' : 'w-40')}>
              <Trans>DIFFERENCE</Trans>
            </span>
            <span className={cn('text-right', upToSmall ? 'w-[120px]' : 'w-40')}>
              <Trans>REWARDS</Trans>
            </span>
          </div>
          <Divider />
        </>
      )}

      {isLoading ? (
        <RaffleRowsSkeleton upToSmall={upToSmall} />
      ) : transactions.length ? (
        transactions.map(tx => {
          const networkName = isSupportedChainId(tx.chain) ? NETWORKS_INFO[tx.chain].name : '-'
          return (
            <div
              key={tx.id}
              className={cn(
                'text-sm text-text',
                upToSmall ? 'grid grid-cols-2 flex-col gap-2 py-4' : 'flex flex-row gap-5 px-5 py-4',
              )}
            >
              {isOwner ? (
                <div className={cn('flex flex-col', upToSmall ? 'w-full' : 'w-40')}>
                  {renderLabel(<Trans>NETWORK</Trans>)}
                  <span>{networkName}</span>
                </div>
              ) : (
                <div className={cn('flex flex-col', upToSmall ? 'w-full' : 'w-40')}>
                  {renderLabel(<Trans>WALLET</Trans>)}
                  <span>{shortenHash(tx.user_address, 4)}</span>
                </div>
              )}
              <div className="flex flex-1 flex-col">
                {renderLabel(<Trans>TX HASH</Trans>)}
                <span>{shortenHash(tx.tx, 4)}</span>
              </div>
              <div className={cn('flex flex-col', upToSmall ? 'w-full text-left' : 'w-40 text-right')}>
                {renderLabel(<Trans>DIFFERENCE</Trans>)}
                {tx.bit_block ? (
                  <span className="font-medium">{formatDisplayNumber(tx.diff, { significantDigits: 6 })}</span>
                ) : (
                  <span>TBU</span>
                )}
              </div>
              <div className={cn('flex flex-col', upToSmall ? 'w-full text-left' : 'w-40 text-right')}>
                {renderLabel(<Trans>REWARDS</Trans>)}
                {tx.bit_block ? (
                  <span>{formatDisplayNumber(tx.rewarded, { significantDigits: 6 })} KNC</span>
                ) : (
                  <span>TBU</span>
                )}
              </div>
            </div>
          )
        })
      ) : (
        <div className="mt-3 p-6 text-center text-subText">{t`No data found`}</div>
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
    </div>
  )
}
