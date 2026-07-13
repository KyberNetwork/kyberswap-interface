import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { APP_PATHS } from 'constants/index'
import ClosedSubscriptionsTable from 'pages/CopyTrading/CopyHistory/ClosedSubscriptionsTable'
import { CopyHistorySummary } from 'pages/CopyTrading/CopyHistory/components'
import { CopyTradingPage, CopyTradingPageHeading } from 'pages/CopyTrading/components/common'
import { OWNER_ADDRESS } from 'pages/CopyTrading/helpers'

const CopyHistoryView = () => {
  const navigate = useNavigate()
  const { data: closedRuns, isFetching: isClosedRunsFetching } = copyTradingApi.useGetCopyRunsQuery({
    ownerAddress: OWNER_ADDRESS,
    status: 'closed',
  })
  const { data: agents, isFetching: isAgentsFetching } = copyTradingApi.useGetAgentsQuery({ pageSize: 100 })
  const closedRunData = closedRuns?.data || []

  return (
    <CopyTradingPage>
      <CopyTradingPageHeading title="History" description="Review all closed copy runs and settled performance." />
      <CopyHistorySummary rows={closedRunData} />
      <ClosedSubscriptionsTable
        agents={agents?.data || []}
        loading={isClosedRunsFetching || isAgentsFetching}
        rows={closedRunData}
        onOpenSubscription={subscription => navigate(`${APP_PATHS.COPY_TRADING}/history/${subscription.copyRunId}`)}
      />
    </CopyTradingPage>
  )
}

export default CopyHistoryView
