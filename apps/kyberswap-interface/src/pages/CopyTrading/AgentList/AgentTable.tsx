import { type HTMLAttributes, type MouseEvent, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { AgentCard } from 'services/copyTrading/types/agents'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { LeaderboardSortBy, SortOrder } from 'services/copyTrading/types/primitives'

import { ButtonPrimary } from 'components/Button'
import ScrollArea from 'components/ScrollArea'
import { Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import CursorPagination, { type CursorPaginationState } from 'pages/CopyTrading/components/CursorPagination'
import {
  HeaderCell,
  TableBody,
  TableCardField,
  TableCell,
  TableHeader,
  TableRow,
} from 'pages/CopyTrading/components/Table'
import { AgentCell } from 'pages/CopyTrading/components/common/agentIdentity'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import {
  compactUsd,
  formatCount,
  getPreparedReasonMessage,
  getSignedMetricClassName,
  getWinRateClassName,
  isActionAvailable,
  percent,
} from 'pages/CopyTrading/helpers'
import { useCopyTradingModal } from 'pages/CopyTrading/modals/context'
import { cn } from 'utils/cn'

type LeaderboardGridProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

type AgentTableProps = {
  agents: AgentCard[]
  loading?: boolean
  pagination: CursorPaginationState
  sortBy?: LeaderboardSortBy
  sortOrder?: SortOrder
  onSortChange: (sortBy: LeaderboardSortBy) => void
}

const LeaderboardGrid = ({ header, className, ...props }: LeaderboardGridProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1024px] grid-cols-[minmax(0,2.2fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.75fr)_minmax(0,0.85fr)_minmax(0,0.75fr)_minmax(0,0.8fr)]',
        className,
      )}
      {...props}
    />
  )
}

const AgentTable = ({ agents, loading, pagination, sortBy, sortOrder, onSortChange }: AgentTableProps) => {
  const navigate = useNavigate()
  const { ownerAddress } = useCopyTradingContext()
  const { openStartCopy } = useCopyTradingModal()

  const { currentData: activeCopyRuns } = copyRunApi.useGetCopyRunsQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'open',
      limit: 100,
    },
    { pollingInterval: 10_000, skip: !ownerAddress },
  )

  const copiedRunsByAgentId = useMemo(
    () =>
      (activeCopyRuns?.data || []).reduce<Record<string, CopyRunSummary>>((acc, run) => {
        acc[run.agentId] = run
        return acc
      }, {}),
    [activeCopyRuns?.data],
  )

  const openAgent = (agentId: string) => {
    navigate(`${APP_PATHS.COPY_TRADING}/${agentId}`)
  }

  const handleAgentRowClick = (event: MouseEvent<HTMLElement>, agentId: string) => {
    if ((event.target as HTMLElement).closest('button')) return
    openAgent(agentId)
  }

  return (
    <Stack className="gap-2 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:bg-buttonBlack-60">
      <ScrollArea className="relative hidden max-h-[480px] lg:block">
        <LeaderboardGrid header className="sticky top-0 z-[1]">
          <HeaderCell>Agent</HeaderCell>
          <HeaderCell
            activeSortBy={sortBy}
            className="justify-end text-right"
            onSortChange={onSortChange}
            sortField="apr_30d_pct"
            sortOrder={sortOrder}
          >
            Agent APR <span className="rounded-md bg-background px-2 py-1">30D</span>
          </HeaderCell>
          <HeaderCell
            activeSortBy={sortBy}
            className="justify-end text-right"
            onSortChange={onSortChange}
            sortField="win_rate_pct"
            sortOrder={sortOrder}
          >
            Win Rates
          </HeaderCell>
          <HeaderCell
            activeSortBy={sortBy}
            className="justify-end text-right"
            onSortChange={onSortChange}
            sortField="volume_usd"
            sortOrder={sortOrder}
          >
            Volume
          </HeaderCell>
          <HeaderCell
            activeSortBy={sortBy}
            className="justify-end text-right"
            onSortChange={onSortChange}
            sortField="copiers"
            sortOrder={sortOrder}
          >
            Copiers
          </HeaderCell>
          <HeaderCell
            activeSortBy={sortBy}
            className="justify-end text-right"
            onSortChange={onSortChange}
            sortField="aum_usd"
            sortOrder={sortOrder}
          >
            AUM
          </HeaderCell>
          <HeaderCell
            activeSortBy={sortBy}
            className="justify-end text-right"
            onSortChange={onSortChange}
            sortField="open_positions"
            sortOrder={sortOrder}
          >
            Position
          </HeaderCell>
          <TableCell />
        </LeaderboardGrid>

        <TableBody
          className="min-w-[1024px]"
          empty={!agents.length}
          emptyIconUrl={copyTradingStatIconMap.agents.iconUrl}
          emptyMessage={pagination.error ? 'Unable to load agents' : 'No agents found'}
          loading={loading}
        >
          {agents.map(agent => {
            const copiedRun = copiedRunsByAgentId?.[agent.agentId]
            const canStartCopy = isActionAvailable(agent.startCopyAvailability)

            return (
              <LeaderboardGrid
                key={agent.agentId}
                role="button"
                onClick={event => handleAgentRowClick(event, agent.agentId)}
              >
                <AgentCell agent={agent} className="px-3 py-2" />
                <TableCell className={cn('text-right', getSignedMetricClassName(agent.stats.apr30dPct))}>
                  {percent(agent.stats.apr30dPct)}
                </TableCell>
                <TableCell className={cn('text-right', getWinRateClassName(agent.stats.winRatePct))}>
                  {percent(agent.stats.winRatePct)}
                </TableCell>
                <TableCell className="text-right">{compactUsd(agent.stats.volumeUsd)}</TableCell>
                <TableCell className="text-right">{formatCount(agent.stats.copiers)}</TableCell>
                <TableCell className="text-right">{compactUsd(agent.stats.aumUsd)}</TableCell>
                <TableCell className="text-right">{formatCount(agent.stats.openPositions)}</TableCell>
                <TableCell className="flex justify-center">
                  {copiedRun ? (
                    <span className="text-sm font-medium text-primary">Copied</span>
                  ) : (
                    <div>
                      <ButtonPrimary
                        type="button"
                        padding="6px 12px"
                        disabled={!canStartCopy}
                        title={
                          !canStartCopy ? getPreparedReasonMessage(agent.startCopyAvailability?.reason) : undefined
                        }
                        onClick={() => openStartCopy(agent)}
                      >
                        Copy
                      </ButtonPrimary>
                    </div>
                  )}
                </TableCell>
              </LeaderboardGrid>
            )
          })}
        </TableBody>
      </ScrollArea>

      <TableBody
        className="grid gap-2 bg-transparent lg:hidden"
        empty={!agents.length}
        emptyIconUrl={copyTradingStatIconMap.agents.iconUrl}
        emptyMessage={pagination.error ? 'Unable to load agents' : 'No agents found'}
        loading={loading}
      >
        {agents.map(agent => {
          const copiedRun = copiedRunsByAgentId?.[agent.agentId]
          const canStartCopy = isActionAvailable(agent.startCopyAvailability)

          return (
            <Stack
              key={agent.agentId}
              role="button"
              className="gap-3 rounded-xl bg-buttonBlack-60 p-3 outline-none transition-colors hover:bg-primary-10"
              onClick={event => handleAgentRowClick(event, agent.agentId)}
            >
              <AgentCell agent={agent} className="gap-3" />

              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <TableCardField label="Agent APR 30D" valueClassName={getSignedMetricClassName(agent.stats.apr30dPct)}>
                  {percent(agent.stats.apr30dPct)}
                </TableCardField>
                <TableCardField label="Win Rate" valueClassName={getWinRateClassName(agent.stats.winRatePct)}>
                  {percent(agent.stats.winRatePct)}
                </TableCardField>
                <TableCardField label="Volume">{compactUsd(agent.stats.volumeUsd)}</TableCardField>
                <TableCardField label="Copiers">{formatCount(agent.stats.copiers)}</TableCardField>
                <TableCardField label="AUM">{compactUsd(agent.stats.aumUsd)}</TableCardField>
                <TableCardField label="Positions">{formatCount(agent.stats.openPositions)}</TableCardField>
              </div>

              {copiedRun ? (
                <span className="flex min-h-9 items-center justify-center text-sm font-medium text-primary">
                  Copied
                </span>
              ) : (
                <ButtonPrimary
                  type="button"
                  padding="6px 12px"
                  disabled={!canStartCopy}
                  title={!canStartCopy ? getPreparedReasonMessage(agent.startCopyAvailability?.reason) : undefined}
                  onClick={() => openStartCopy(agent)}
                >
                  Copy
                </ButtonPrimary>
              )}
            </Stack>
          )
        })}
      </TableBody>

      <div className="overflow-hidden rounded-xl lg:rounded-none">
        <CursorPagination {...pagination} />
      </div>
    </Stack>
  )
}

export default AgentTable
