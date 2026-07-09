import { type HTMLAttributes, type PropsWithChildren } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import type { AgentCard, LeaderboardSortBy, SortOrder } from 'services/copyTrading/types'

import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import Pagination from 'components/Pagination'
import RefetchIndicator from 'components/RefetchIndicator'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { AgentCell, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/common'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { compactUsd, percent } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type HeaderCellProps = PropsWithChildren<{
  className?: string
  sortField?: LeaderboardSortBy
  activeSortBy?: LeaderboardSortBy
  sortOrder?: SortOrder
  onSortChange?: (sortBy: LeaderboardSortBy) => void
}>

const HeaderCell = ({ children, className, sortField, activeSortBy, sortOrder, onSortChange }: HeaderCellProps) => {
  const sortable = !!sortField
  const active = sortable && activeSortBy === sortField
  const SortIcon = active && sortOrder === 'asc' ? ChevronUp : ChevronDown
  const content = (
    <HStack
      className={cn(
        'w-full items-center gap-1 whitespace-nowrap px-3 py-2 text-xs font-medium uppercase text-subText',
        className,
        active && 'text-primary',
      )}
    >
      {children}
      {sortable && <SortIcon size={12} className="shrink-0" />}
    </HStack>
  )

  if (!sortField) return content

  return (
    <ButtonEmpty type="button" onClick={() => onSortChange?.(sortField)} padding="0">
      {content}
    </ButtonEmpty>
  )
}

const LeaderboardGrid = ({ header, ...props }: HTMLAttributes<HTMLDivElement> & { header?: boolean }) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      columns="minmax(0, 2.2fr) minmax(0, 0.9fr) minmax(0, 0.85fr) minmax(0, 0.85fr) minmax(0, 0.75fr) minmax(0, 0.85fr) minmax(0, 0.75fr) minmax(0, 0.8fr)"
      {...props}
    />
  )
}

type AgentTableProps = {
  agents: AgentCard[]
  loading?: boolean
  sortBy?: LeaderboardSortBy
  sortOrder?: SortOrder
  onSortChange: (sortBy: LeaderboardSortBy) => void
  pagination: {
    totalCount: number
    currentPage: number
    pageSize: number
    onPageChange: (page: number) => void
  }
}

const AgentTable = ({ agents, loading, sortBy, sortOrder, onSortChange, pagination }: AgentTableProps) => {
  const navigate = useNavigate()

  const openAgent = (agentId: string) => {
    navigate(`${APP_PATHS.COPY_TRADING}/${agentId}`)
  }

  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack-60">
      <LeaderboardGrid header className="bg-buttonBlack">
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
          sortOrder={sortOrder}
        >
          Position
        </HeaderCell>
        <TableCell />
      </LeaderboardGrid>

      <div className="relative h-0">
        <RefetchIndicator visible={!!loading} />
      </div>

      {agents.map(agent => (
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
          <TableCell className="text-right">{agent.stats.copiers.toLocaleString()}</TableCell>
          <TableCell className="text-right">{compactUsd(agent.stats.aumUsd)}</TableCell>
          <TableCell className="text-right">{agent.stats.openPositions}</TableCell>
          <TableCell className="flex justify-end">
            <div>
              <ButtonPrimary type="button" padding="6px 12px">
                Copy
              </ButtonPrimary>
            </div>
          </TableCell>
        </LeaderboardGrid>
      ))}

      {!loading && !agents.length && (
        <Stack className="items-center gap-3 px-6 py-8 text-center">
          <img src={copyTradingStatIconMap.agents.iconUrl} alt="" className="size-8 opacity-80" />
          <span className="text-sm font-medium text-subText">No agents found</span>
        </Stack>
      )}

      <Pagination
        className="bg-buttonGray/60"
        currentPage={pagination.currentPage}
        onPageChange={pagination.onPageChange}
        pageSize={pagination.pageSize}
        totalCount={pagination.totalCount}
      />
    </Stack>
  )
}

export default AgentTable
