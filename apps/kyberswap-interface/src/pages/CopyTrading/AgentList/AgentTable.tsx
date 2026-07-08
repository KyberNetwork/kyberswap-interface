import { type HTMLAttributes, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Zap } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import type { AgentCard, LeaderboardSortBy, SortOrder } from 'services/copyTrading/types'

import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { AgentCell, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/common'
import { compactUsd, percent } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const HeaderCell = ({
  children,
  className,
  sortField,
  activeSortBy,
  sortOrder,
  onSortChange,
}: {
  children: ReactNode
  className?: string
  sortField?: LeaderboardSortBy
  activeSortBy?: LeaderboardSortBy
  sortOrder?: SortOrder
  onSortChange?: (sortBy: LeaderboardSortBy) => void
}) => {
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
      {sortable && <SortIcon size={12} className={cn('shrink-0', !active && 'opacity-50')} />}
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

const AgentTable = ({
  agents,
  sortBy,
  sortOrder,
  onSortChange,
}: {
  agents: AgentCard[]
  sortBy?: LeaderboardSortBy
  sortOrder?: SortOrder
  onSortChange: (sortBy: LeaderboardSortBy) => void
}) => {
  const navigate = useNavigate()

  const openAgent = (agentId: string) => {
    navigate(`${APP_PATHS.COPY_TRADING}/${agentId}`)
  }

  return (
    <Stack className="overflow-hidden">
      <LeaderboardGrid header className="normal-case">
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
        <TableCell className="text-right" />
      </LeaderboardGrid>

      {agents.map(agent => (
        <LeaderboardGrid
          key={agent.agentId}
          onKeyDown={event => {
            if ((event.target as HTMLElement).closest('button')) return
            if (event.key === 'Enter' || event.key === ' ') {
              openAgent(agent.agentId)
            }
          }}
          role="button"
          tabIndex={0}
          className="cursor-pointer text-base"
          onClick={event => {
            if ((event.target as HTMLElement).closest('button')) return
            openAgent(agent.agentId)
          }}
        >
          <AgentCell agent={agent} className="px-3 py-2" />
          <HStack className="items-center justify-end gap-1.5 whitespace-nowrap px-3 py-2 text-right text-primary">
            <Zap size={14} className="fill-warning text-warning" />
            <span>{percent(agent.stats.apr30dPct)}</span>
          </HStack>
          <TableCell className="whitespace-nowrap text-right">{percent(agent.stats.winRatePct)}</TableCell>
          <TableCell className="whitespace-nowrap text-right">{compactUsd(agent.stats.volumeUsd)}</TableCell>
          <TableCell className="whitespace-nowrap text-right">{agent.stats.copiers.toLocaleString()}</TableCell>
          <TableCell className="whitespace-nowrap text-right">{compactUsd(agent.stats.aumUsd)}</TableCell>
          <TableCell className="whitespace-nowrap text-right">{agent.stats.openPositions}</TableCell>
          <div className="flex justify-end px-3 py-2">
            <div className="w-fit">
              <ButtonPrimary type="button" padding="8px 12px">
                Copy
              </ButtonPrimary>
            </div>
          </div>
        </LeaderboardGrid>
      ))}

      {!agents.length && (
        <Stack className="items-center gap-2 px-6 py-10 text-center">
          <span className="text-base font-medium text-text">No agents found</span>
          <span className="text-sm text-subText">Try another strategy or search term.</span>
        </Stack>
      )}
    </Stack>
  )
}

export default AgentTable
