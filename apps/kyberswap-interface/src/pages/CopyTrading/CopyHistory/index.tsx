import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { APP_PATHS } from 'constants/index'
import ClosedSubscriptionsTable from 'pages/CopyTrading/CopyHistory/ClosedSubscriptionsTable'
import { CopyHistorySummary } from 'pages/CopyTrading/CopyHistory/components'
import CopyRunsPageHeading from 'pages/CopyTrading/components/CopyRunsPageHeading'
import useCursorPageQuery from 'pages/CopyTrading/components/CursorPagination/useCursorPageQuery'
import { CopyTradingPage, OwnerWalletRequired } from 'pages/CopyTrading/components/common'
import { useCopyTradingContext } from 'pages/CopyTrading/context'

const PAGE_SIZE = 5

const CopyHistoryView = () => {
  const navigate = useNavigate()
  const { ownerAddress } = useCopyTradingContext()
  const [getCopyRuns] = copyTradingApi.useLazyGetCopyRunsQuery()
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
  const closedRuns = closedRunsPage.items
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
