import { type HTMLAttributes, useMemo } from 'react'
import type { AgentCard, CopyRunSummary } from 'services/copyTrading/types'

import { ButtonLight } from 'components/Button'
import { Stack } from 'components/Stack'
import { TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { CopyRunAgentCell } from 'pages/CopyTrading/components/common'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { compactUsd, formatUsd, percent } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type ActiveSubscriptionsGridProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const ActiveSubscriptionsGrid = ({ header, className, ...props }: ActiveSubscriptionsGridProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'grid-cols-[minmax(0,2.4fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.1fr)]',
        className,
      )}
      {...props}
    />
  )
}

type ActiveSubscriptionsTableProps = {
  agents: AgentCard[]
  loading?: boolean
  rows: CopyRunSummary[]
  onOpenSubscription: (subscription: CopyRunSummary) => void
}

const ActiveSubscriptionsTable = ({ rows, agents, loading, onOpenSubscription }: ActiveSubscriptionsTableProps) => {
  const agentsById = useMemo(
    () =>
      agents.reduce<Record<string, AgentCard>>((acc, agent) => {
        acc[agent.agentId] = agent
        return acc
      }, {}),
    [agents],
  )

  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack-60">
      <ActiveSubscriptionsGrid header>
        <TableCell>Agent</TableCell>
        <TableCell className="text-right">Agent APR</TableCell>
        <TableCell className="text-right">Win Rates</TableCell>
        <TableCell className="text-right">Volume</TableCell>
        <TableCell className="text-right">Capital In</TableCell>
        <TableCell className="text-right">Positions</TableCell>
        <TableCell />
      </ActiveSubscriptionsGrid>

      <TableBody
        empty={!rows.length}
        emptyIconUrl={copyTradingStatIconMap.agents.iconUrl}
        emptyMessage="No active copies found"
        loading={loading}
      >
        {rows.map(subscription => (
          <ActiveSubscriptionsGrid
            key={subscription.copyRunId}
            role="button"
            tabIndex={0}
            onClick={event => {
              if ((event.target as HTMLElement).closest('button')) return
              onOpenSubscription(subscription)
            }}
            onKeyDown={event => {
              if ((event.target as HTMLElement).closest('button')) return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenSubscription(subscription)
              }
            }}
            className="cursor-pointer"
          >
            <CopyRunAgentCell agent={agentsById[subscription.agentId]} run={subscription} className="px-3 py-2" />
            <TableCell className="text-right text-primary">{percent(subscription.agentStats.apr30dPct)}</TableCell>
            <TableCell className="text-right">{percent(subscription.agentStats.winRatePct)}</TableCell>
            <TableCell className="text-right">{compactUsd(subscription.agentStats.volumeUsd)}</TableCell>
            <TableCell className="text-right">{formatUsd(subscription.capitalInUsd)}</TableCell>
            <TableCell className="text-right">{subscription.openPositionCount}</TableCell>
            <TableCell className="flex justify-end">
              <ButtonLight type="button" padding="8px 12px">
                Stop Copying
              </ButtonLight>
            </TableCell>
          </ActiveSubscriptionsGrid>
        ))}
      </TableBody>
    </Stack>
  )
}

export default ActiveSubscriptionsTable
