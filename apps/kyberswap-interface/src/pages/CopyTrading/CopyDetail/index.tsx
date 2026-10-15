import { Navigate, useParams } from 'react-router-dom'
import agentApi from 'services/copyTrading/api/endpoints/agents'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { AgentProfile } from 'services/copyTrading/types/agents'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'

import LocalLoader from 'components/LocalLoader'
import { HStack, Stack } from 'components/Stack'
import useIsWalletRestoring from 'hooks/useIsWalletRestoring'
import { CopyDetailTabs } from 'pages/CopyTrading/CopyDetail/CopyDetailTabs'
import CopyRunPerformance from 'pages/CopyTrading/CopyDetail/CopyRunPerformance'
import CopySidePanel from 'pages/CopyTrading/CopyDetail/CopySidePanel'
import CopyTimeline from 'pages/CopyTrading/CopyDetail/CopyTimeline'
import { copyDetailResponsiveOrder } from 'pages/CopyTrading/CopyDetail/responsiveOrder'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { AgentIdentity, CopyRunAgentCell } from 'pages/CopyTrading/components/common/agentIdentity'
import {
  CopyTradingPage,
  ResponsiveDetailGrid,
  ResponsiveDetailItem,
  StickySideColumn,
} from 'pages/CopyTrading/components/common/layout'
import {
  CopyRunStatusBadge,
  CopyTradingReadError,
  OwnerWalletRequired,
} from 'pages/CopyTrading/components/common/status'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import {
  formatUsd,
  getSignedMetricClassName,
  isMissingOrForbiddenError,
  signedPercent,
  signedUsd,
} from 'pages/CopyTrading/helpers'
import { useCopyTradingRoutes } from 'pages/CopyTrading/hooks/useCopyTradingRoutes'

const getCopyRunStats = (run: CopyRunSummary): LeaderboardStat[] => {
  return [
    {
      label: 'Total P&L',
      value: signedUsd(run.totalPnlUsd),
      valueClassName: getSignedMetricClassName(run.totalPnlUsd),
      icon: copyTradingStatIconMap.pnl,
    },
    {
      label: 'Realised P&L',
      value: signedUsd(run.portfolioPnlUsd),
      valueClassName: getSignedMetricClassName(run.portfolioPnlUsd),
      icon: copyTradingStatIconMap.cash,
    },
    {
      label: 'ROI',
      value: signedPercent(run.roiPct),
      valueClassName: getSignedMetricClassName(run.roiPct),
      icon: copyTradingStatIconMap.winRate,
    },
    {
      label: 'Net Fees',
      value: formatUsd(run.feeBreakdown?.netFeesUsd),
      valueClassName: 'text-text',
      valueTooltip: (
        <dl className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 text-sm">
          <dt className="text-subText">Fee charged</dt>
          <dd className="m-0 text-right font-medium tabular-nums text-text">
            {formatUsd(run.feeBreakdown?.feeChargedUsd)}
          </dd>
          <dt className="text-subText">Rebates</dt>
          <dd className="m-0 text-right font-medium tabular-nums text-blue">
            {formatUsd(run.feeBreakdown?.rebatesUsd)}
          </dd>
        </dl>
      ),
      icon: copyTradingStatIconMap.moneyPrimary,
    },
  ]
}

const CopyRunStats = ({ run }: { run: CopyRunSummary }) => <Leaderboard items={getCopyRunStats(run)} size="sm" />

const CopyDetailContent = ({ agent, run }: { agent?: AgentProfile; run: CopyRunSummary }) => {
  const { chains } = useCopyTradingContext()
  const quoteTokenSymbol = chains.find(chain => chain.chainId === run.chainId)?.quoteToken?.symbol
  const isTerminal = run.status === 'stopped' || run.status === 'closed'

  return (
    <>
      {!isTerminal && <CopyRunStats run={run} />}

      <ResponsiveDetailGrid>
        <ResponsiveDetailItem
          className={isTerminal ? 'max-xl:contents' : undefined}
          responsiveOrder={copyDetailResponsiveOrder.mainContent}
        >
          {isTerminal ? (
            <Stack className="gap-4 max-xl:contents">
              <ResponsiveDetailItem className="max-xl:order-first">
                <CopyTimeline run={run} quoteTokenSymbol={quoteTokenSymbol} />
              </ResponsiveDetailItem>
              <ResponsiveDetailItem responsiveOrder={copyDetailResponsiveOrder.mainContent}>
                <CopyRunPerformance
                  copyRunId={run.copyRunId}
                  status={run.status}
                  realizedPnlUsd={run.portfolioPnlUsd}
                />
              </ResponsiveDetailItem>
            </Stack>
          ) : (
            <Stack className="gap-4">
              <CopyDetailTabs run={run} />
              <CopyRunPerformance copyRunId={run.copyRunId} status={run.status} />
            </Stack>
          )}
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
  const copyTradingPath = useCopyTradingRoutes()
  const { copyId } = useParams()
  const { ownerAddress } = useCopyTradingContext()
  const isRestoringWallet = useIsWalletRestoring()

  const copyRunQuery = { ownerAddress: ownerAddress || '', copyRunId: copyId || '' }
  const {
    currentData: copyRun,
    isFetching,
    isLoading,
    isUninitialized,
    error: copyRunError,
    refetch: refetchCopyRun,
  } = copyRunApi.useGetCopyRunQuery(copyRunQuery, { pollingInterval: 10_000, skip: !copyId || !ownerAddress })

  const { currentData: agent } = agentApi.useGetAgentQuery(
    { agentId: copyRun?.data.agentId || '' },
    { pollingInterval: 10_000, skip: !copyRun?.data.agentId },
  )

  const run = copyRun?.data
  const profile = agent?.data
  const identity = profile || run?.agentSnapshot
  const backLabel = backPath === 'history' ? 'History' : 'My Copies'
  const copyRunPending = !run && (isFetching || isLoading || isUninitialized)

  if (isRestoringWallet) {
    return (
      <CopyTradingPage>
        <LocalLoader />
      </CopyTradingPage>
    )
  }

  if (!ownerAddress) {
    return (
      <CopyTradingPage backTo={{ label: backLabel, to: copyTradingPath(backPath) }}>
        <OwnerWalletRequired />
      </CopyTradingPage>
    )
  }

  const resourceUnavailable = !copyId || isMissingOrForbiddenError(copyRunError)

  if (resourceUnavailable) {
    return <Navigate to={copyTradingPath(backPath)} replace />
  }

  if (copyRunPending) {
    return (
      <CopyTradingPage>
        <LocalLoader />
      </CopyTradingPage>
    )
  }

  if (!run) {
    return (
      <CopyTradingPage backTo={{ label: backLabel, to: copyTradingPath(backPath) }}>
        <CopyTradingReadError
          resourceUnavailable={false}
          onRetry={() => {
            if (!run) void refetchCopyRun()
          }}
        />
      </CopyTradingPage>
    )
  }

  return (
    <CopyTradingPage backTo={{ label: backLabel, to: copyTradingPath(backPath) }}>
      {identity ? (
        <AgentIdentity
          agent={identity}
          copyStatus={run.status === 'active' ? undefined : run.status}
          copyView={backPath === 'history' ? 'history' : 'open'}
        />
      ) : (
        <HStack className="items-center gap-4">
          <CopyRunAgentCell run={run} />
          {run.status !== 'active' && <CopyRunStatusBadge status={run.status} />}
        </HStack>
      )}
      <CopyDetailContent key={run.copyRunId} agent={profile} run={run} />
    </CopyTradingPage>
  )
}

export default CopyDetailView
