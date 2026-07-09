import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import ClosedSubscriptionsTable from 'pages/CopyTrading/CopyHistory/ClosedSubscriptionsTable'
import { CopyHistorySummary } from 'pages/CopyTrading/CopyHistory/components'
import { CopyTradingPage } from 'pages/CopyTrading/components/common'
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
      <Stack className="gap-2">
        <h1 className="text-4xl font-medium text-text max-md:text-3xl">History</h1>
        <p className="text-lg text-subText">Review all closed copy runs and settled performance.</p>
      </Stack>
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
