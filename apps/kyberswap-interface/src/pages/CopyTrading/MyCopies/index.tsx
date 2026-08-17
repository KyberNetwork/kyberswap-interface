import { useNavigate } from 'react-router-dom'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'

import { APP_PATHS } from 'constants/index'
import useIsWalletRestoring from 'hooks/useIsWalletRestoring'
import ActiveSubscriptionsTable from 'pages/CopyTrading/MyCopies/ActiveSubscriptionsTable'
import { AlertsFeed, OpenCopiesSummary } from 'pages/CopyTrading/MyCopies/components'
import CopyRunsPageHeading from 'pages/CopyTrading/components/CopyRunsPageHeading'
import { useCursorPageQuery } from 'pages/CopyTrading/components/CursorPagination'
import { useInfiniteCursorQuery } from 'pages/CopyTrading/components/InfiniteScroll'
import { CopyTradingPage } from 'pages/CopyTrading/components/common/layout'
import { OwnerWalletRequired } from 'pages/CopyTrading/components/common/status'
import { useCopyTradingContext } from 'pages/CopyTrading/context'

const PAGE_SIZE = 10

const MyCopiesView = () => {
  const navigate = useNavigate()
  const { ownerAddress } = useCopyTradingContext()
  const isRestoringWallet = useIsWalletRestoring()
  const [getCopyRuns] = copyRunApi.useLazyGetCopyRunsQuery()
  const [getOwnerActivity] = copyRunApi.useLazyGetOwnerActivityQuery()

  const activeRunsPage = useCursorPageQuery({
    enabled: !!ownerAddress,
    queryKey: ['copy-trading', 'copy-runs', ownerAddress, 'open'],
    queryFn: cursor =>
      getCopyRuns({
        ownerAddress: ownerAddress || '',
        view: 'open',
        cursor,
        limit: PAGE_SIZE,
      }).unwrap(),
  })

  const {
    infiniteScroll: activityInfiniteScroll,
    isFetching: isActivityFetching,
    items: activityRows,
  } = useInfiniteCursorQuery({
    enabled: !!ownerAddress,
    queryKey: ['copy-trading', 'owner-activity', ownerAddress],
    queryFn: cursor =>
      getOwnerActivity({
        ownerAddress: ownerAddress || '',
        cursor,
        limit: PAGE_SIZE,
      }).unwrap(),
  })

  const { data: ownerSummary } = copyRunApi.useGetOwnerCopySummaryQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'open',
    },
    { pollingInterval: 10_000, skip: !ownerAddress },
  )

  const activeRuns = activeRunsPage.items
  const summary = ownerSummary?.data

  return (
    <CopyTradingPage>
      <CopyRunsPageHeading activeView="open" />
      {isRestoringWallet ? null : !ownerAddress ? (
        <OwnerWalletRequired />
      ) : (
        <>
          <OpenCopiesSummary summary={summary} fallbackActiveCopies={activeRuns.length} />
          <ActiveSubscriptionsTable
            loading={activeRunsPage.loading}
            pagination={activeRunsPage}
            rows={activeRuns}
            onOpenSubscription={subscription =>
              navigate(`${APP_PATHS.COPY_TRADING}/my-copies/${subscription.copyRunId}`)
            }
          />
          <AlertsFeed
            infiniteScroll={activityInfiniteScroll}
            loading={isActivityFetching && !activityRows.length}
            rows={activityRows}
          />
        </>
      )}
    </CopyTradingPage>
  )
}

export default MyCopiesView
