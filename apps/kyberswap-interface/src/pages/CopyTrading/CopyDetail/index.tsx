import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'
import type { PositionSummary } from 'services/copyTrading/types'

import LocalLoader from 'components/LocalLoader'
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
import CopySmartWallet from 'pages/CopyTrading/CopySmartWallet'
import {
  AgentIdentity,
  CopyTradingPage,
  OwnerWalletRequired,
  StickySideColumn,
} from 'pages/CopyTrading/components/common'
import { useCopyTradingContext } from 'pages/CopyTrading/context'

const CopyDetailView = ({ backPath }: { backPath: 'my-copies' | 'history' }) => {
  const { copyId } = useParams()
  const { ownerAddress } = useCopyTradingContext()
  const [openPositions, setOpenPositions] = useState<PositionSummary[]>([])
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

  const isClosed = run.status === 'closed'

  return (
    <CopyTradingPage backTo={{ label: backLabel, to: `${APP_PATHS.COPY_TRADING}/${backPath}` }}>
      <AgentIdentity agent={profile} status={run.status} />

      {run.status === 'stopped' ? (
        <CopySmartWallet run={run} />
      ) : (
        <>
          {!isClosed && <CopyRunStats run={run} />}

          <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4 max-xl:grid-cols-1">
            <Stack className="min-w-0 gap-4">
              {isClosed ? (
                <CopyTimeline run={run} />
              ) : (
                <OpenPositionsPanel run={run} onPositionsChange={setOpenPositions} />
              )}
              <CopyRunPerformance copyRunId={run.copyRunId} status={run.status} />
            </Stack>
            <StickySideColumn>
              <CopySidePanel agent={profile} positions={openPositions} run={run} />
            </StickySideColumn>
          </div>

          {isClosed && <ClosedPositionsPanel run={run} />}
        </>
      )}
    </CopyTradingPage>
  )
}

export default CopyDetailView
