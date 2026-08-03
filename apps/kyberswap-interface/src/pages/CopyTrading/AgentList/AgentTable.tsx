import { type HTMLAttributes, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'
import type { AgentCard, CopyRunSummary, LeaderboardSortBy, SortOrder } from 'services/copyTrading/types'

import { ButtonPrimary } from 'components/Button'
import { Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import InfiniteScroll, { type InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'
import { HeaderCell, TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { AgentCell } from 'pages/CopyTrading/components/common'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { compactUsd, percent } from 'pages/CopyTrading/helpers'
import { useCopyTradeWrite } from 'pages/CopyTrading/write/WriteContext'
import { cn } from 'utils/cn'

type LeaderboardGridProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
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

type AgentTableProps = {
  agents: AgentCard[]
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  sortBy?: LeaderboardSortBy
  sortOrder?: SortOrder
  onSortChange: (sortBy: LeaderboardSortBy) => void
}

const AgentTable = ({ agents, infiniteScroll, loading, sortBy, sortOrder, onSortChange }: AgentTableProps) => {
  const navigate = useNavigate()
  const { ownerAddress } = useCopyTradingContext()
  const { openSubscribe } = useCopyTradeWrite()

  const { data: activeCopyRuns } = copyTradingApi.useGetCopyRunsQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'open',
      limit: 100,
    },
    { skip: !ownerAddress },
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

  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack-60">
      <InfiniteScroll {...infiniteScroll}>
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
          emptyMessage="No agents found"
          loading={loading}
        >
          {agents.map(agent => {
            const copiedRun = copiedRunsByAgentId?.[agent.agentId]

            return (
              <LeaderboardGrid
                key={agent.agentId}
                role="button"
                onClick={event => {
                  if ((event.target as HTMLElement).closest('button')) return
                  openAgent(agent.agentId)
                }}
              >
                <AgentCell agent={agent} className="px-3 py-2" />
                <TableCell className="text-right text-primary">{percent(agent.stats.apr30dPct)}</TableCell>
                <TableCell className="text-right">{percent(agent.stats.winRatePct)}</TableCell>
                <TableCell className="text-right">{compactUsd(agent.stats.volumeUsd)}</TableCell>
                <TableCell className="text-right">{agent.stats.copiers?.toLocaleString() || '—'}</TableCell>
                <TableCell className="text-right">{compactUsd(agent.stats.aumUsd)}</TableCell>
                <TableCell className="text-right">{agent.stats.openPositions || '—'}</TableCell>
                <TableCell className="flex justify-center">
                  {copiedRun ? (
                    <span className="text-sm font-medium text-primary">Copied</span>
                  ) : (
                    <div>
                      <ButtonPrimary type="button" padding="6px 12px" onClick={() => openSubscribe(agent)}>
                        Copy
                      </ButtonPrimary>
                    </div>
                  )}
                </TableCell>
              </LeaderboardGrid>
            )
          })}
        </TableBody>
      </InfiniteScroll>
    </Stack>
  )
}

export default AgentTable
