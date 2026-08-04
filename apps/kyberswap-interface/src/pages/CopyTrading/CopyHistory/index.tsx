import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { APP_PATHS } from 'constants/index'
import ClosedSubscriptionsTable from 'pages/CopyTrading/CopyHistory/ClosedSubscriptionsTable'
import { CopyHistorySummary } from 'pages/CopyTrading/CopyHistory/components'
import CopyRunsPageHeading from 'pages/CopyTrading/components/CopyRunsPageHeading'
import useInfiniteCursorQuery from 'pages/CopyTrading/components/InfiniteScroll/useInfiniteCursorQuery'
import { CopyTradingPage, OwnerWalletRequired } from 'pages/CopyTrading/components/common'
import { useCopyTradingContext } from 'pages/CopyTrading/context'

const PAGE_SIZE = 10

const CopyHistoryView = () => {
  const navigate = useNavigate()
  const { ownerAddress } = useCopyTradingContext()
  const [getCopyRuns] = copyTradingApi.useLazyGetCopyRunsQuery()
  const {
    infiniteScroll,
    isFetching: isClosedRunsFetching,
    items: closedRuns,
  } = useInfiniteCursorQuery({
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
  const { data: ownerSummary } = copyTradingApi.useGetOwnerCopySummaryQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'history',
    },
    { skip: !ownerAddress },
  )

  return (
    <CopyTradingPage>
      <CopyRunsPageHeading activeView="history" />
      {!ownerAddress ? (
        <OwnerWalletRequired />
      ) : (
        <>
          <CopyHistorySummary summary={ownerSummary?.data} />
          <ClosedSubscriptionsTable
            infiniteScroll={infiniteScroll}
            loading={isClosedRunsFetching && !closedRuns.length}
            rows={closedRuns}
            onOpenSubscription={subscription => navigate(`${APP_PATHS.COPY_TRADING}/history/${subscription.copyRunId}`)}
          />
        </>
      )}
    </CopyTradingPage>
  )
}

export default CopyHistoryView
