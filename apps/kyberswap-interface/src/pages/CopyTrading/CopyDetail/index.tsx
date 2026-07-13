import { Navigate, useParams } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import CopyRunPerformance from 'pages/CopyTrading/CopyDetail/CopyRunPerformance'
import CopySidePanel from 'pages/CopyTrading/CopyDetail/CopySidePanel'
import {
  ClosedPositionsPanel,
  CopyRunStats,
  CopyTimeline,
  OpenPositionsPanel,
} from 'pages/CopyTrading/CopyDetail/components'
import { AgentIdentity, CopyTradingPage } from 'pages/CopyTrading/components/common'
import { OWNER_ADDRESS } from 'pages/CopyTrading/helpers'

const CopyDetailView = ({ backPath }: { backPath: 'my-copies' | 'history' }) => {
  const { copyId } = useParams()
  const copyRunQuery = { ownerAddress: OWNER_ADDRESS, copyRunId: copyId || '' }
  const {
    data: copyRun,
    isFetching,
    isLoading,
    isUninitialized,
  } = copyTradingApi.useGetCopyRunQuery(copyRunQuery, { skip: !copyId })
  const {
    data: agent,
    isFetching: isAgentFetching,
    isLoading: isAgentLoading,
  } = copyTradingApi.useGetAgentQuery({ agentId: copyRun?.data.agentId || '' }, { skip: !copyRun?.data.agentId })

  const run = copyRun?.data
  const profile = agent?.data

  if ((!run || !profile) && (isFetching || isLoading || isUninitialized || isAgentFetching || isAgentLoading)) {
    return null
  }
  if (!run || !profile) return <Navigate to={`${APP_PATHS.COPY_TRADING}/${backPath}`} replace />

  const isClosed = run.status === 'closed'
  const backLabel = backPath === 'history' ? 'History' : 'My Copies'

  return (
    <CopyTradingPage backTo={{ label: backLabel, to: `${APP_PATHS.COPY_TRADING}/${backPath}` }}>
      <AgentIdentity agent={profile} />

      {!isClosed && <CopyRunStats run={run} />}

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4 max-xl:grid-cols-1">
        <Stack className="min-w-0 gap-4">
          {isClosed ? <CopyTimeline run={run} /> : <OpenPositionsPanel run={run} />}
          <CopyRunPerformance copyRunId={run.copyRunId} status={run.status} />
        </Stack>
        <CopySidePanel agent={profile} run={run} />
      </div>

      {isClosed && <ClosedPositionsPanel run={run} />}
    </CopyTradingPage>
  )
}

export default CopyDetailView
