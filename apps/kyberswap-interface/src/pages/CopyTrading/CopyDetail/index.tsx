import { Navigate, useParams } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { Center, HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { CopyPositionsTable, TradeHistoryTable } from 'pages/CopyTrading/CopyDetail/Tables'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { AgentIdentity, CopyTradingPage, LineChartMock, ProfileSidePanel } from 'pages/CopyTrading/components/common'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { OWNER_ADDRESS, formatDate, formatUsd, percent, signedPercent, signedUsd } from 'pages/CopyTrading/helpers'

const CopyDetailView = ({ backPath }: { backPath: 'my-copies' | 'history' }) => {
  const { copyId } = useParams()
  const copyRunQuery = { ownerAddress: OWNER_ADDRESS, copyRunId: copyId || '' }
  const {
    data: copyRun,
    isFetching,
    isLoading,
    isUninitialized,
  } = copyTradingApi.useGetCopyRunQuery(copyRunQuery, { skip: !copyId })
  const { data: positions } = copyTradingApi.useGetCopyRunPositionsQuery(
    { ...copyRunQuery, status: 'open' },
    { skip: !copyId },
  )
  const { data: closedPositions } = copyTradingApi.useGetCopyRunPositionsQuery(
    { ...copyRunQuery, status: 'closed' },
    { skip: !copyId },
  )
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
  const activeStats: LeaderboardStat[] = [
    {
      label: 'Total Realised P&L',
      value: signedUsd(run.realizedPnlUsd),
      icon: copyTradingStatIconMap.money,
    },
    {
      label: isClosed ? 'Status' : 'APR Since Copy',
      value: isClosed ? 'Closed' : signedPercent(run.myAprSinceCopyPct),
      icon: isClosed ? copyTradingStatIconMap.positionClose : copyTradingStatIconMap.positionOpen,
    },
    {
      label: 'Agent Win Rate',
      value: percent(run.agentStats.winRatePct),
      icon: copyTradingStatIconMap.users,
    },
    {
      label: 'Fees Paid',
      value: formatUsd(run.feesPaidUsd),
      icon: copyTradingStatIconMap.volume,
    },
    {
      label: 'Est. Rebate Pending',
      value: formatUsd(run.estimatedRebatePendingUsd),
      icon: copyTradingStatIconMap.money,
    },
  ]

  return (
    <CopyTradingPage backTo={{ label: backLabel, to: `${APP_PATHS.COPY_TRADING}/${backPath}` }}>
      <AgentIdentity agent={profile} />

      {isClosed ? (
        <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-1">
          <Stack className="col-span-2 min-w-0 gap-5 max-xl:col-span-1">
            <HStack className="items-center justify-between gap-5 rounded-xl bg-buttonBlack p-5 max-2xl:flex-col max-2xl:items-start">
              <HStack className="items-center gap-5">
                <Center className="h-14 rounded-xl bg-primary-12 px-6 text-lg font-medium text-primary">
                  Started Copy
                </Center>
                <Stack>
                  <span className="text-sm text-subText">{formatDate(run.startedAt)}</span>
                  <span className="text-lg font-medium text-text">In: {formatUsd(run.capitalInUsd)}</span>
                </Stack>
              </HStack>
              <div className="h-0.5 w-56 bg-gradient-to-r from-primary to-red max-2xl:hidden" />
              <HStack className="items-center gap-5">
                <Stack className="items-end max-2xl:items-start">
                  <span className="text-sm text-subText">{formatDate(run.stoppedAt)}</span>
                  <span className="text-lg font-medium text-text">Out: {formatUsd(run.capitalOutUsd)}</span>
                </Stack>
                <Center className="h-14 rounded-xl bg-red-20 px-6 text-lg font-medium text-red">Stopped Copy</Center>
              </HStack>
            </HStack>
            <LineChartMock />
          </Stack>
          <Stack className="min-w-0 gap-5">
            <Leaderboard items={activeStats.slice(0, 1)} size="sm" />
            <ProfileSidePanel
              copiedCapital={formatUsd(run.capitalInUsd)}
              isCopied={false}
              wishlistTokens={profile.whitelistedSymbols}
            />
          </Stack>
        </div>
      ) : (
        <>
          <Leaderboard items={activeStats} size="sm" />
          <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-1">
            <Stack className="col-span-2 min-w-0 gap-5 max-xl:col-span-1">
              <Stack className="overflow-hidden rounded-2xl bg-background/80">
                <HStack className="flex-wrap items-center justify-between gap-4 border-b border-tableHeader px-6 py-5">
                  <HStack className="items-center gap-2">
                    <h2 className="text-base font-medium text-text">My Positions</h2>
                    <Center className="size-5 rounded-full bg-primary-12 text-xs text-primary">
                      {run.openPositionCount}
                    </Center>
                  </HStack>
                  <HStack className="flex-wrap gap-5 text-sm">
                    <span className="text-subText">Realised P&L</span>
                    <span className="font-medium text-primary">{signedUsd(run.realizedPnlUsd)}</span>
                    <span className="text-subText">APR Since Copy</span>
                    <span className="font-medium text-primary">{signedPercent(run.myAprSinceCopyPct)}</span>
                  </HStack>
                </HStack>
                <div className="overflow-hidden">
                  <CopyPositionsTable rows={positions?.data || []} />
                </div>
              </Stack>
              <LineChartMock />
            </Stack>
            <ProfileSidePanel
              copiedCapital={formatUsd(run.capitalInUsd)}
              isCopied
              wishlistTokens={profile.whitelistedSymbols}
            />
          </div>
        </>
      )}

      {isClosed && (
        <Stack className="overflow-hidden rounded-2xl bg-background/80">
          <HStack className="items-center gap-2 border-b border-tableHeader px-8 py-5">
            <h2 className="text-lg font-medium text-text">Full Closed Positions</h2>
            <Center className="h-6 rounded-full bg-subText-20 px-3 text-xs text-text">{run.closedTradeCount}</Center>
          </HStack>
          <div className="overflow-hidden">
            <TradeHistoryTable rows={closedPositions?.data || []} />
          </div>
        </Stack>
      )}
    </CopyTradingPage>
  )
}

export default CopyDetailView
