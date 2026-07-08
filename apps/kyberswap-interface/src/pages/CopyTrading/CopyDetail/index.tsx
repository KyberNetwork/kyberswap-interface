import { ArrowLeft } from 'react-feather'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { Center, HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { CopyPositionsTable, TradeHistoryTable } from 'pages/CopyTrading/CopyDetail/Tables'
import { AgentIdentity } from 'pages/CopyTrading/components/AgentIdentity'
import LineChartMock from 'pages/CopyTrading/components/LineChartMock'
import ProfileSidePanel from 'pages/CopyTrading/components/ProfileSidePanel'
import { ProfileStatCard, type ProfileStatItem } from 'pages/CopyTrading/components/Stats'
import { OWNER_ADDRESS, formatDate, formatUsd, percent, signedPercent, signedUsd } from 'pages/CopyTrading/helpers'

const CopyDetailView = ({ backPath }: { backPath: 'my-copies' | 'history' }) => {
  const navigate = useNavigate()
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
  const activeStats: ProfileStatItem[] = [
    {
      icon: 'pnl',
      value: signedUsd(run.realizedPnlUsd),
      label: 'Total Realised P&L',
    },
    {
      icon: 'aum',
      value: isClosed ? 'Closed' : signedPercent(run.myAprSinceCopyPct),
      label: isClosed ? 'Status' : 'APR Since Copy',
    },
    {
      icon: 'winRate',
      value: percent(run.agentStats.winRatePct),
      label: 'Agent Win Rate',
    },
    {
      icon: 'copiers',
      value: formatUsd(run.feesPaidUsd),
      label: 'Fees Paid',
    },
    {
      icon: 'aum',
      value: formatUsd(run.estimatedRebatePendingUsd),
      label: 'Est. Rebate Pending',
    },
  ]

  return (
    <main className="min-w-0 flex-1 px-10 py-9 max-md:px-4">
      <Stack className="w-full gap-7">
        <button
          type="button"
          onClick={() => navigate(`${APP_PATHS.COPY_TRADING}/${backPath}`)}
          className="flex h-8 w-fit cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-sm text-subText hover:text-text"
        >
          <ArrowLeft size={14} />
          Back to {backPath === 'history' ? 'History' : 'My Copies'}
        </button>
        <AgentIdentity agent={profile} />

        {isClosed ? (
          <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-1">
            <Stack className="col-span-2 min-w-0 gap-5 max-xl:col-span-1">
              <HStack className="items-center justify-between gap-5 rounded-xl bg-buttonBlack p-5 max-2xl:flex-col max-2xl:items-start">
                <HStack className="items-center gap-5">
                  <Center className="h-14 rounded-xl bg-primary-12 px-6 text-lg font-semibold text-primary">
                    Started Copy
                  </Center>
                  <Stack>
                    <span className="text-sm text-subText">{formatDate(run.startedAt)}</span>
                    <span className="text-lg font-semibold text-text">In: {formatUsd(run.capitalInUsd)}</span>
                  </Stack>
                </HStack>
                <div className="h-0.5 w-56 bg-gradient-to-r from-primary to-red max-2xl:hidden" />
                <HStack className="items-center gap-5">
                  <Stack className="items-end max-2xl:items-start">
                    <span className="text-sm text-subText">{formatDate(run.stoppedAt)}</span>
                    <span className="text-lg font-semibold text-text">Out: {formatUsd(run.capitalOutUsd)}</span>
                  </Stack>
                  <Center className="h-14 rounded-xl bg-red-20 px-6 text-lg font-semibold text-red">
                    Stopped Copy
                  </Center>
                </HStack>
              </HStack>
              <LineChartMock />
            </Stack>
            <Stack className="min-w-0 gap-5">
              <Center className="h-24 rounded-xl bg-buttonBlack px-6 text-right text-2xl font-semibold text-primary">
                Total Realised P&L&nbsp;&nbsp; {signedUsd(run.realizedPnlUsd)}
              </Center>
              <ProfileSidePanel
                copiedCapital={formatUsd(run.capitalInUsd)}
                isCopied={false}
                wishlistTokens={profile.whitelistedSymbols}
              />
            </Stack>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-1">
            <Stack className="col-span-2 min-w-0 gap-5 max-xl:col-span-1">
              <div className="grid grid-cols-5 gap-4 max-2xl:grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1">
                {activeStats.map(item => (
                  <ProfileStatCard key={item.label} item={item} />
                ))}
              </div>
              <Stack className="overflow-hidden rounded-xl bg-buttonBlack">
                <HStack className="flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-5">
                  <HStack className="items-center gap-2">
                    <h2 className="m-0 text-base font-semibold text-text">My Positions</h2>
                    <Center className="size-5 rounded-full bg-primary-12 text-xs text-primary">
                      {run.openPositionCount}
                    </Center>
                  </HStack>
                  <HStack className="flex-wrap gap-5 text-sm">
                    <span className="text-subText">Realised P&L</span>
                    <span className="font-semibold text-primary">{signedUsd(run.realizedPnlUsd)}</span>
                    <span className="text-subText">APR Since Copy</span>
                    <span className="font-semibold text-primary">{signedPercent(run.myAprSinceCopyPct)}</span>
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
        )}

        {isClosed && (
          <Stack className="overflow-hidden rounded-xl bg-buttonBlack">
            <HStack className="items-center gap-2 border-b border-border px-8 py-5">
              <h2 className="m-0 text-lg font-semibold text-text">Full Closed Positions</h2>
              <Center className="h-6 rounded-full bg-subText-20 px-3 text-xs text-text">{run.closedTradeCount}</Center>
            </HStack>
            <div className="overflow-hidden">
              <TradeHistoryTable rows={closedPositions?.data || []} />
            </div>
          </Stack>
        )}
      </Stack>
    </main>
  )
}

export default CopyDetailView
