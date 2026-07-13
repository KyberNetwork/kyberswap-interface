import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { APP_PATHS } from 'constants/index'
import ActiveSubscriptionsTable from 'pages/CopyTrading/MyCopies/ActiveSubscriptionsTable'
import { AlertsFeed, OpenCopiesSummary } from 'pages/CopyTrading/MyCopies/components'
import { CopyTradingPage, CopyTradingPageHeading } from 'pages/CopyTrading/components/common'
import { OWNER_ADDRESS } from 'pages/CopyTrading/helpers'

const MyCopiesView = () => {
  const navigate = useNavigate()
  const { data: ownerSummary } = copyTradingApi.useGetOwnerCopySummaryQuery({
    ownerAddress: OWNER_ADDRESS,
  })
  const { data: activeRuns, isFetching: isActiveRunsFetching } = copyTradingApi.useGetCopyRunsQuery({
    ownerAddress: OWNER_ADDRESS,
    status: 'active',
  })
  const { data: activity, isFetching: isActivityFetching } = copyTradingApi.useGetOwnerActivityQuery({
    ownerAddress: OWNER_ADDRESS,
  })
  const { data: agents, isFetching: isAgentsFetching } = copyTradingApi.useGetAgentsQuery({ pageSize: 100 })
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
