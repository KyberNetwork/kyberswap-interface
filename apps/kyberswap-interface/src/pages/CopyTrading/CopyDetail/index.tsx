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
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { AgentIdentity } from 'pages/CopyTrading/components/common/agentIdentity'
import { CopyTradingPage, StickySideColumn } from 'pages/CopyTrading/components/common/layout'
import { OwnerWalletRequired } from 'pages/CopyTrading/components/common/status'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import {
  formatApproximateUsd,
  formatUsd,
  getDisplayCapitalInUsd,
  getSignedMetricClassName,
  signedPercent,
  signedUsd,
  sumUsdValues,
} from 'pages/CopyTrading/helpers'
import { formatDateTime } from 'utils/time'

type CopyDetailContentProps = {
  agent: AgentProfile
  backPath: 'my-copies' | 'history'
  run: CopyRunSummary
}

const getCopyRunStats = (run: CopyRunSummary): LeaderboardStat[] => {
  const totalPnlUsd = sumUsdValues(run.realizedPnlUsd, run.unrealizedPnlUsd)
  const totalPnlStatus =
    run.metrics.realizedPnlUsd?.status === 'METRIC_STATUS_STALE' ||
    run.metrics.unrealizedPnlUsd?.status === 'METRIC_STATUS_STALE'
      ? 'METRIC_STATUS_STALE'
      : run.metrics.realizedPnlUsd?.status === 'METRIC_STATUS_CURRENT' &&
        run.metrics.unrealizedPnlUsd?.status === 'METRIC_STATUS_CURRENT'
      ? 'METRIC_STATUS_CURRENT'
      : undefined

  return [
    {
      label: 'Total P&L',
      value: signedUsd(totalPnlUsd),
      valueClassName: getSignedMetricClassName(totalPnlUsd),
      icon: copyTradingStatIconMap.pnl,
      status: totalPnlStatus,
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
      label: 'Fee Paid',
      value: formatUsd(run.flatFeesCapturedUsd),
      icon: copyTradingStatIconMap.volumePrimary,
      status: run.metrics.flatFeesCapturedUsd?.status,
    },
    {
      label: 'Est. Cashback Pending',
      value: formatApproximateUsd(run.estimatedCashbackPendingUsd),
      icon: copyTradingStatIconMap.moneyPrimary,
      status: run.metrics.estimatedCashbackPendingUsd?.status,
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
            In: {formatUsd(getDisplayCapitalInUsd(run))}
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
          Stopped Copy
        </Center>
      </HStack>
    </HStack>
  )
}

const CopyDetailContent = ({ agent, backPath, run }: CopyDetailContentProps) => {
  if (run.status === 'closed') {
    return (
      <>
        <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4 max-xl:grid-cols-1">
          <Stack className="min-w-0 gap-4 max-xl:order-4">
            <CopyTimeline run={run} />
            <CopyRunPerformance copyRunId={run.copyRunId} status={run.status} />
          </Stack>
          <StickySideColumn className="max-xl:contents">
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
        <Stack className="min-w-0 gap-4 max-xl:order-4">
          <CopyDetailTabs
            defaultTab={run.status === 'stopped' || backPath !== 'history' ? 'open-positions' : 'closed-positions'}
            run={run}
          />
          <CopyRunPerformance copyRunId={run.copyRunId} status={run.status} />
        </Stack>
        <StickySideColumn className="max-xl:contents">
          <CopySidePanel agent={agent} run={run} />
        </StickySideColumn>
      </div>
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
      <AgentIdentity agent={profile} status={run.status} />
      <CopyDetailContent key={run.copyRunId} agent={profile} backPath={backPath} run={run} />
    </CopyTradingPage>
  )
}

export default CopyDetailView
