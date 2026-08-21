import { useNavigate } from 'react-router-dom'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { OwnerCopySummary } from 'services/copyTrading/types/copyRuns'

import { APP_PATHS } from 'constants/index'
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

const CopyHistorySummary = ({ summary }: { summary?: OwnerCopySummary }) => {
  const historyStats: LeaderboardStat[] = [
    {
      label: 'Realised P&L (All time)',
      value: signedUsd(summary?.realizedPnlUsd),
      valueClassName: getSignedMetricClassName(summary?.realizedPnlUsd),
      icon: copyTradingStatIconMap.money,
      status: summary?.metrics.realizedPnlUsd?.status,
    },
    {
      label: 'Closed Capital (Returned)',
      value: formatUsd(summary?.closedCapitalUsd),
      icon: copyTradingStatIconMap.volume,
      status: summary?.metrics.closedCapitalUsd?.status,
    },
    {
      label: 'Closed Positions',
      value: formatCount(summary?.closedPositions),
      icon: copyTradingStatIconMap.positionClose,
      status: summary?.metrics.closedPositionCount?.status,
    },
  ]

  return <Leaderboard items={historyStats} />
}

const CopyHistoryView = () => {
  const navigate = useNavigate()
  const { ownerAddress } = useCopyTradingContext()
  const isRestoringWallet = useIsWalletRestoring()
  const [getCopyRuns] = copyRunApi.useLazyGetCopyRunsQuery()

  const closedRunsPage = useCursorPageQuery({
    enabled: !!ownerAddress,
    queryKey: ['copy-trading', 'copy-runs', ownerAddress, 'history'],
    queryFn: cursor =>
      getCopyRuns({
        ownerAddress: ownerAddress || '',
        view: 'history',
        cursor,
        limit: PAGE_SIZE,
      }).unwrap(),
  })

  const { currentData: ownerSummary } = copyRunApi.useGetOwnerCopySummaryQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'history',
    },
    { pollingInterval: 10_000, skip: !ownerAddress },
  )

  const closedRuns = closedRunsPage.items

  return (
    <CopyTradingPage>
      <CopyRunsPageHeading activeView="history" />
      {isRestoringWallet ? null : !ownerAddress ? (
        <OwnerWalletRequired />
      ) : (
        <>
          <CopyHistorySummary summary={ownerSummary?.data} />
          <ClosedSubscriptionsTable
            loading={closedRunsPage.loading}
            pagination={closedRunsPage}
            rows={closedRuns}
            onOpenSubscription={subscription => navigate(`${APP_PATHS.COPY_TRADING}/history/${subscription.copyRunId}`)}
          />
        </>
      )}
    </CopyTradingPage>
  )
}

export default CopyHistoryView
