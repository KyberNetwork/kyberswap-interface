import { useState } from 'react'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { OwnerCopySummary } from 'services/copyTrading/types/copyRuns'
import type { CopyRunSortBy, SortOrder } from 'services/copyTrading/types/primitives'

import useIsWalletRestoring from 'hooks/useIsWalletRestoring'
import ClosedSubscriptionsTable from 'pages/CopyTrading/CopyHistory/ClosedSubscriptionsTable'
import CopyRunsPageHeading from 'pages/CopyTrading/components/CopyRunsPageHeading'
import { useCursorPageQuery } from 'pages/CopyTrading/components/CursorPagination'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { CopyTradingPage } from 'pages/CopyTrading/components/common/layout'
import { OwnerWalletRequired } from 'pages/CopyTrading/components/common/status'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { formatCount, formatUsd, getSignedMetricClassName, signedUsd } from 'pages/CopyTrading/helpers'

const PAGE_SIZE = 5

const CopyHistorySummary = ({ loading, summary }: { loading?: boolean; summary?: OwnerCopySummary }) => {
  const historyStats: LeaderboardStat[] = [
    {
      label: 'Realised P&L (All time)',
      value: signedUsd(summary?.realizedPnlUsd),
      valueClassName: getSignedMetricClassName(summary?.realizedPnlUsd),
      icon: copyTradingStatIconMap.money,
      mobileSpan: 2,
    },
    {
      label: 'Closed Capital (Returned)',
      value: formatUsd(summary?.closedCapitalUsd),
      icon: copyTradingStatIconMap.volume,
    },
    {
      label: 'Closed Positions',
      value: formatCount(summary?.closedPositions),
      icon: copyTradingStatIconMap.positionClose,
    },
  ]

  return <Leaderboard items={historyStats} loading={loading} />
}

const CopyHistoryView = () => {
  const { ownerAddress } = useCopyTradingContext()
  const isRestoringWallet = useIsWalletRestoring()
  const [sortBy, setSortBy] = useState<CopyRunSortBy>()
  const [sortOrder, setSortOrder] = useState<SortOrder>()
  const [getCopyRuns] = copyRunApi.useLazyGetCopyRunsQuery()

  const closedRunsPage = useCursorPageQuery({
    enabled: !!ownerAddress,
    queryKey: ['copy-trading', 'copy-runs', ownerAddress, 'history', sortBy, sortOrder],
    queryFn: cursor =>
      getCopyRuns({
        ownerAddress: ownerAddress || '',
        view: 'history',
        sortBy,
        sortOrder,
        cursor,
        limit: PAGE_SIZE,
      }).unwrap(),
  })

  const { currentData: ownerSummary, isFetching: isOwnerSummaryFetching } = copyRunApi.useGetOwnerCopySummaryQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'history',
    },
    { pollingInterval: 10_000, skip: !ownerAddress },
  )

  const closedRuns = closedRunsPage.items

  const handleSortChange = (nextSortBy: CopyRunSortBy) => {
    if (sortBy !== nextSortBy) {
      setSortBy(nextSortBy)
      setSortOrder('desc')
      return
    }
    if (sortOrder === 'desc') {
      setSortOrder('asc')
      return
    }
    setSortBy(undefined)
    setSortOrder(undefined)
  }

  return (
    <CopyTradingPage>
      <CopyRunsPageHeading activeView="history" />
      {isRestoringWallet ? null : !ownerAddress ? (
        <OwnerWalletRequired />
      ) : (
        <>
          <CopyHistorySummary loading={!ownerSummary && isOwnerSummaryFetching} summary={ownerSummary?.data} />
          <ClosedSubscriptionsTable
            loading={closedRunsPage.loading}
            onSortChange={handleSortChange}
            pagination={closedRunsPage}
            rows={closedRuns}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </>
      )}
    </CopyTradingPage>
  )
}

export default CopyHistoryView
