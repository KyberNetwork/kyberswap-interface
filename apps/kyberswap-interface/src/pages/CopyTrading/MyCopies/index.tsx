import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { APP_PATHS } from 'constants/index'
import ActiveSubscriptionsTable from 'pages/CopyTrading/MyCopies/ActiveSubscriptionsTable'
import { AlertsFeed, OpenCopiesSummary } from 'pages/CopyTrading/MyCopies/components'
import { CopyTradingPage, CopyTradingPageHeading } from 'pages/CopyTrading/components/common'
import { useCopyTradingContext } from 'pages/CopyTrading/context'

const MyCopiesView = () => {
  const navigate = useNavigate()
  const { ownerAddress } = useCopyTradingContext()
  const { data: ownerSummary } = copyTradingApi.useGetOwnerCopySummaryQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'open',
    },
    { skip: !ownerAddress },
  )
  const { data: activeRuns, isFetching: isActiveRunsFetching } = copyTradingApi.useGetCopyRunsQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'open',
      limit: 100,
    },
    { skip: !ownerAddress },
  )
  const { data: activity, isFetching: isActivityFetching } = copyTradingApi.useGetOwnerActivityQuery(
    {
      ownerAddress: ownerAddress || '',
      limit: 100,
    },
    { skip: !ownerAddress },
  )
  const { data: agents, isFetching: isAgentsFetching } = copyTradingApi.useGetAgentsQuery({ limit: 100 })
  const summary = ownerSummary?.data

  return (
    <CopyTradingPage>
      <CopyTradingPageHeading
        title={
          <>
            Open <span className="text-primary">Copies</span>
          </>
        }
        description="Monitor and manage all your active copy positions."
      />
      <OpenCopiesSummary summary={summary} fallbackActiveCopies={activeRuns?.data.length} />
      <ActiveSubscriptionsTable
        agents={agents?.data || []}
        loading={isActiveRunsFetching || isAgentsFetching}
        rows={activeRuns?.data || []}
        onOpenSubscription={subscription => navigate(`${APP_PATHS.COPY_TRADING}/my-copies/${subscription.copyRunId}`)}
      />
      <AlertsFeed loading={isActivityFetching} rows={activity?.data || []} />
    </CopyTradingPage>
  )
}

export default MyCopiesView
