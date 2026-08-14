import { Navigate, useParams } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'
import type { AgentProfile, CopyRunSummary } from 'services/copyTrading/types'

import LocalLoader from 'components/LocalLoader'
import { Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import CopyRunPerformance from 'pages/CopyTrading/CopyDetail/CopyRunPerformance'
import CopySidePanel from 'pages/CopyTrading/CopyDetail/CopySidePanel'
import { CopyDetailTabs, CopyRunStats, CopyTimeline } from 'pages/CopyTrading/CopyDetail/components'
import {
  AgentIdentity,
  CopyTradingPage,
  OwnerWalletRequired,
  StickySideColumn,
} from 'pages/CopyTrading/components/common'
import { useCopyTradingContext } from 'pages/CopyTrading/context'

type CopyDetailContentProps = {
  agent: AgentProfile
  backPath: 'my-copies' | 'history'
  run: CopyRunSummary
}

const CopyDetailContent = ({ agent, backPath, run }: CopyDetailContentProps) => {
  if (run.status === 'closed') {
    return (
      <>
        <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4 max-xl:grid-cols-1">
          <Stack className="min-w-0 gap-4">
            <CopyTimeline run={run} />
            <CopyRunPerformance copyRunId={run.copyRunId} status={run.status} />
          </Stack>
          <StickySideColumn>
            <CopySidePanel agent={agent} run={run} />
          </StickySideColumn>
        </div>
        <CopyDetailTabs defaultTab="closed-positions" includeOpenPositions={false} run={run} />
      </>
    )
  }

  return (
    <>
      <CopyRunStats run={run} />

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4 max-xl:grid-cols-1">
        <Stack className="min-w-0 gap-4">
          <CopyDetailTabs defaultTab={backPath === 'history' ? 'closed-positions' : 'open-positions'} run={run} />
          <CopyRunPerformance copyRunId={run.copyRunId} status={run.status} />
        </Stack>
        <StickySideColumn>
          <CopySidePanel agent={agent} run={run} />
        </StickySideColumn>
      </div>
    </>
  )
}

const CopyDetailView = ({ backPath }: { backPath: 'my-copies' | 'history' }) => {
  const { copyId } = useParams()
  const { ownerAddress } = useCopyTradingContext()

  const copyRunQuery = { ownerAddress: ownerAddress || '', copyRunId: copyId || '' }
  const {
    data: copyRun,
    isFetching,
    isLoading,
    isUninitialized,
  } = copyTradingApi.useGetCopyRunQuery(copyRunQuery, { skip: !copyId || !ownerAddress })

  const {
    data: agent,
    isFetching: isAgentFetching,
    isLoading: isAgentLoading,
  } = copyTradingApi.useGetAgentQuery({ agentId: copyRun?.data.agentId || '' }, { skip: !copyRun?.data.agentId })

  const run = copyRun?.data
  const profile = agent?.data
  const backLabel = backPath === 'history' ? 'History' : 'My Copies'

  if (!ownerAddress) {
    return (
      <CopyTradingPage backTo={{ label: backLabel, to: `${APP_PATHS.COPY_TRADING}/${backPath}` }}>
        <OwnerWalletRequired />
      </CopyTradingPage>
    )
  }

  if ((!run || !profile) && (isFetching || isLoading || isUninitialized || isAgentFetching || isAgentLoading)) {
    return (
      <CopyTradingPage>
        <LocalLoader />
      </CopyTradingPage>
    )
  }
  if (!run || !profile) return <Navigate to={`${APP_PATHS.COPY_TRADING}/${backPath}`} replace />

  return (
    <CopyTradingPage backTo={{ label: backLabel, to: `${APP_PATHS.COPY_TRADING}/${backPath}` }}>
      <AgentIdentity agent={profile} status={run.status} />
      <CopyDetailContent key={run.copyRunId} agent={profile} backPath={backPath} run={run} />
    </CopyTradingPage>
  )
}

export default CopyDetailView
