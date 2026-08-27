import { Navigate, useParams } from 'react-router-dom'
import agentApi from 'services/copyTrading/api/endpoints/agents'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { AgentProfile } from 'services/copyTrading/types/agents'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'

import LocalLoader from 'components/LocalLoader'
import { Center, HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import useIsWalletRestoring from 'hooks/useIsWalletRestoring'
import { CopyDetailTabs } from 'pages/CopyTrading/CopyDetail/CopyDetailTabs'
import CopyRunPerformance from 'pages/CopyTrading/CopyDetail/CopyRunPerformance'
import CopySidePanel from 'pages/CopyTrading/CopyDetail/CopySidePanel'
import { copyDetailResponsiveOrder } from 'pages/CopyTrading/CopyDetail/responsiveOrder'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { AgentIdentity } from 'pages/CopyTrading/components/common/agentIdentity'
import {
  CopyTradingPage,
  ResponsiveDetailGrid,
  ResponsiveDetailItem,
  StickySideColumn,
} from 'pages/CopyTrading/components/common/layout'
import { OwnerWalletRequired } from 'pages/CopyTrading/components/common/status'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import {
  formatDisplayCapitalInUsd,
  formatUsd,
  getSignedMetricClassName,
  signedPercent,
  signedUsd,
} from 'pages/CopyTrading/helpers'
import { formatDateTime } from 'utils/time'

type CopyDetailContentProps = {
  agent: AgentProfile
  backPath: 'my-copies' | 'history'
  run: CopyRunSummary
}

const getCopyRunStats = (run: CopyRunSummary): LeaderboardStat[] => {
  return [
    {
      label: 'Total P&L',
      value: signedUsd(run.totalPnlUsd),
      valueClassName: getSignedMetricClassName(run.totalPnlUsd),
      icon: copyTradingStatIconMap.pnl,
      status: run.metrics.totalPnlUsd?.status,
    },
    {
      label: 'Realised P&L',
      value: signedUsd(run.realizedPnlUsd),
      valueClassName: getSignedMetricClassName(run.realizedPnlUsd),
      icon: copyTradingStatIconMap.cash,
      status: run.metrics.realizedPnlUsd?.status,
    },
    {
      label: 'APR Since Copy',
      value: signedPercent(run.myAprSinceCopyPct),
      valueClassName: getSignedMetricClassName(run.myAprSinceCopyPct),
      icon: copyTradingStatIconMap.winRate,
      status: run.metrics.myAprSinceCopy?.status,
    },
    {
      label: 'Fee',
      value: formatUsd(run.flatFeesCapturedUsd),
      icon: copyTradingStatIconMap.volumePrimary,
      status: run.metrics.flatFeesCapturedUsd?.status,
    },
    {
      label: 'Rebate',
      value: formatUsd(run.cashbackReceivedUsd),
      icon: copyTradingStatIconMap.moneyPrimary,
      status: run.metrics.cashbackReceivedUsd?.status,
    },
  ]
}

const CopyRunStats = ({ run }: { run: CopyRunSummary }) => <Leaderboard items={getCopyRunStats(run)} size="sm" />

const CopyTimeline = ({ run }: { run: CopyRunSummary }) => {
  return (
    <HStack className="items-center justify-between gap-5 rounded-xl bg-buttonBlack p-6 max-md:flex-col max-md:items-stretch max-sm:p-4">
      <HStack className="items-center gap-5 max-sm:flex-col max-sm:items-stretch max-sm:gap-2">
        <Center className="min-h-12 rounded-xl bg-primary-12 px-6 py-2 text-lg font-medium text-primary max-sm:min-h-10 max-sm:px-4 max-sm:text-base">
          Started Copy
        </Center>
        <Stack className="min-w-0">
          <span className="text-sm text-subText">{formatDateTime(run.startedAt)}</span>
          <span className="break-words text-lg font-medium text-text max-sm:text-base">
            In: {formatDisplayCapitalInUsd(run)}
          </span>
        </Stack>
      </HStack>
      <div className="h-0.5 min-w-16 flex-1 bg-gradient-to-r from-primary to-red max-md:hidden" />
      <HStack className="items-center justify-end gap-5 max-md:justify-start max-sm:flex-col-reverse max-sm:items-stretch max-sm:gap-2">
        <Stack className="min-w-0 items-end max-md:items-start">
          <span className="text-right text-sm text-subText">{formatDateTime(run.stoppedAt)}</span>
          <span className="break-words text-lg font-medium text-text max-sm:text-base">
            Out: {formatUsd(run.capitalOutUsd)}
          </span>
        </Stack>
        <Center className="min-h-12 rounded-xl bg-red-20 px-6 py-2 text-lg font-medium text-red max-sm:min-h-10 max-sm:px-4 max-sm:text-base">
          {run.status === 'closed' ? 'Closed Copy' : 'Stopped Copy'}
        </Center>
      </HStack>
    </HStack>
  )
}

const CopyDetailContent = ({ agent, backPath, run }: CopyDetailContentProps) => {
  const isTerminal = run.status === 'stopped' || run.status === 'closed'
  const defaultTab = isTerminal && backPath === 'history' ? 'closed-positions' : 'open-positions'

  return (
    <>
      <CopyRunStats run={run} />

      <ResponsiveDetailGrid>
        <ResponsiveDetailItem responsiveOrder={copyDetailResponsiveOrder.mainContent}>
          <Stack className="gap-4">
            {isTerminal ? <CopyTimeline run={run} /> : <CopyDetailTabs defaultTab={defaultTab} run={run} />}
            <CopyRunPerformance copyRunId={run.copyRunId} status={run.status} />
          </Stack>
        </ResponsiveDetailItem>
        <StickySideColumn>
          <CopySidePanel agent={agent} run={run} />
        </StickySideColumn>
      </ResponsiveDetailGrid>

      {isTerminal && <CopyDetailTabs defaultTab="closed-positions" includeOpenPositions={false} run={run} />}
    </>
  )
}

const CopyDetailView = ({ backPath }: { backPath: 'my-copies' | 'history' }) => {
  const { copyId } = useParams()
  const { ownerAddress } = useCopyTradingContext()
  const isRestoringWallet = useIsWalletRestoring()

  const copyRunQuery = { ownerAddress: ownerAddress || '', copyRunId: copyId || '' }
  const {
    currentData: copyRun,
    isFetching,
    isLoading,
    isUninitialized,
  } = copyRunApi.useGetCopyRunQuery(copyRunQuery, { pollingInterval: 10_000, skip: !copyId || !ownerAddress })

  const {
    currentData: agent,
    isFetching: isAgentFetching,
    isLoading: isAgentLoading,
  } = agentApi.useGetAgentQuery(
    { agentId: copyRun?.data.agentId || '' },
    { pollingInterval: 10_000, skip: !copyRun?.data.agentId },
  )

  const run = copyRun?.data
  const profile = agent?.data
  const backLabel = backPath === 'history' ? 'History' : 'My Copies'

  if (isRestoringWallet) return null

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
      <AgentIdentity agent={profile} />
      <CopyDetailContent key={run.copyRunId} agent={profile} backPath={backPath} run={run} />
    </CopyTradingPage>
  )
}

export default CopyDetailView
