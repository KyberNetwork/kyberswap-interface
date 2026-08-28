import { type HTMLAttributes, useMemo } from 'react'
import { Link } from 'react-router-dom'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { AgentCard } from 'services/copyTrading/types/agents'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'
import type { LeaderboardSortBy, SortOrder } from 'services/copyTrading/types/primitives'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import ScrollArea from 'components/ScrollArea'
import { Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import CursorPagination, { type CursorPaginationState } from 'pages/CopyTrading/components/CursorPagination'
import {
  HeaderCell,
  TableBody,
  TableCardField,
  TableCardGrid,
  TableCell,
  TableHeader,
  TableRow,
  TableRowLink,
} from 'pages/CopyTrading/components/Table'
import { AgentCell } from 'pages/CopyTrading/components/common/agentIdentity'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import {
  canAttemptPreparation,
  compactUsd,
  formatCount,
  getPreparedReasonMessage,
  getSignedMetricClassName,
  getWinRateClassName,
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
  const { ownerAddress, selectedChainId } = useCopyTradingContext()
  const { openStartCopy } = useCopyTradingModal()

  const { currentData: openCopyRuns } = copyRunApi.useGetCopyRunsQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'open',
      chainId: selectedChainId,
      sortBy: 'started_at',
      sortOrder: 'desc',
      limit: 100,
    },
    { pollingInterval: 10_000, skip: !ownerAddress },
  )

  const latestRunsByAgentId = useMemo(
    () =>
      (openCopyRuns?.data || []).reduce<Record<string, CopyRunListItem>>((latestRuns, run) => {
        if (!latestRuns[run.agentId]) latestRuns[run.agentId] = run
        return latestRuns
      }, {}),
    [openCopyRuns?.data],
  )

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
          <HeaderCell className="justify-end text-right" />
        </LeaderboardGrid>

        <TableBody
          className="min-w-[1024px]"
          empty={!agents.length}
          emptyIconUrl={copyTradingStatIconMap.agents.iconUrl}
          emptyMessage={pagination.error ? 'Unable to load agents' : 'No agents found'}
          loading={loading}
        >
          {agents.map(agent => {
            const latestRun = latestRunsByAgentId[agent.agentId]
            const copiedRun = latestRun?.status === 'active' ? latestRun : undefined
            const canStartCopy = canAttemptPreparation(agent.startCopyAvailability)

            return (
              <LeaderboardGrid key={agent.agentId} className="relative cursor-pointer">
                <TableRowLink label={`View ${agent.displayName}`} to={`${APP_PATHS.COPY_TRADING}/${agent.agentId}`} />
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
                <TableCell className="flex items-center justify-center">
                  {copiedRun ? (
                    <ButtonLight
                      as={Link}
                      to={`${APP_PATHS.COPY_TRADING}/my-copies/${copiedRun.copyRunId}`}
                      padding="6px 12px"
                      className="w-fit whitespace-nowrap"
                    >
                      My Copy
                    </ButtonLight>
                  ) : (
                    <div>
                      <ButtonPrimary
                        type="button"
                        altDisabledStyle
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
          const latestRun = latestRunsByAgentId[agent.agentId]
          const copiedRun = latestRun?.status === 'active' ? latestRun : undefined
          const canStartCopy = canAttemptPreparation(agent.startCopyAvailability)

          return (
            <Stack
              key={agent.agentId}
              className="relative cursor-pointer gap-0 overflow-hidden rounded-xl bg-buttonBlack outline-none transition-colors hover:bg-primary-10"
            >
              <TableRowLink label={`View ${agent.displayName}`} to={`${APP_PATHS.COPY_TRADING}/${agent.agentId}`} />
              <div className="flex items-center gap-3 p-3">
                <AgentCell agent={agent} className="flex-1 gap-3" />
                {copiedRun ? (
                  <ButtonLight
                    as={Link}
                    to={`${APP_PATHS.COPY_TRADING}/my-copies/${copiedRun.copyRunId}`}
                    padding="6px 12px"
                    className="w-fit shrink-0 whitespace-nowrap"
                  >
                    My Copy
                  </ButtonLight>
                ) : (
                  <ButtonPrimary
                    type="button"
                    altDisabledStyle
                    padding="6px 12px"
                    className="w-fit shrink-0 whitespace-nowrap"
                    disabled={!canStartCopy}
                    title={!canStartCopy ? getPreparedReasonMessage(agent.startCopyAvailability?.reason) : undefined}
                    onClick={() => openStartCopy(agent)}
                  >
                    Copy
                  </ButtonPrimary>
                )}
              </div>

              <TableCardGrid className="border-t border-tableHeader p-3">
                <TableCardField label="Agent APR 30D" valueClassName={getSignedMetricClassName(agent.stats.apr30dPct)}>
                  {percent(agent.stats.apr30dPct)}
                </TableCardField>
                <TableCardField
                  align="right"
                  label="Win Rate"
                  valueClassName={getWinRateClassName(agent.stats.winRatePct)}
                >
                  {percent(agent.stats.winRatePct)}
                </TableCardField>
                <TableCardField label="Volume">{compactUsd(agent.stats.volumeUsd)}</TableCardField>
                <TableCardField align="right" label="Copiers">
                  {formatCount(agent.stats.copiers)}
                </TableCardField>
                <TableCardField label="AUM">{compactUsd(agent.stats.aumUsd)}</TableCardField>
                <TableCardField align="right" label="Positions">
                  {formatCount(agent.stats.openPositions)}
                </TableCardField>
              </TableCardGrid>
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
