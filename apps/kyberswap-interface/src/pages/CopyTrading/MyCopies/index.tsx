import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { APP_PATHS } from 'constants/index'
import ActiveSubscriptionsTable from 'pages/CopyTrading/MyCopies/ActiveSubscriptionsTable'
import { AlertsFeed, OpenCopiesSummary } from 'pages/CopyTrading/MyCopies/components'
import CopyRunsPageHeading from 'pages/CopyTrading/components/CopyRunsPageHeading'
import useInfiniteCursorQuery from 'pages/CopyTrading/components/InfiniteScroll/useInfiniteCursorQuery'
import { CopyTradingPage, OwnerWalletRequired } from 'pages/CopyTrading/components/common'
import { useCopyTradingContext } from 'pages/CopyTrading/context'

const PAGE_SIZE = 10

const MyCopiesView = () => {
  const navigate = useNavigate()
  const { ownerAddress } = useCopyTradingContext()
  const [getCopyRuns] = copyTradingApi.useLazyGetCopyRunsQuery()
  const [getOwnerActivity] = copyTradingApi.useLazyGetOwnerActivityQuery()
  const {
    infiniteScroll: activeRunsInfiniteScroll,
    isFetching: isActiveRunsFetching,
    items: activeRuns,
  } = useInfiniteCursorQuery({
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
  const { data: ownerSummary } = copyTradingApi.useGetOwnerCopySummaryQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'open',
    },
    { skip: !ownerAddress },
  )
  const summary = ownerSummary?.data

  return (
    <CopyTradingPage>
      <CopyRunsPageHeading activeView="open" />
      {!ownerAddress ? (
        <OwnerWalletRequired />
      ) : (
        <>
          <OpenCopiesSummary summary={summary} fallbackActiveCopies={activeRuns.length} />
          <ActiveSubscriptionsTable
            infiniteScroll={activeRunsInfiniteScroll}
            loading={isActiveRunsFetching && !activeRuns.length}
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
