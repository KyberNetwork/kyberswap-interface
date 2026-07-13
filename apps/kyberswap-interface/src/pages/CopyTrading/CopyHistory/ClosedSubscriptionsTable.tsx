import { type HTMLAttributes, useMemo } from 'react'
import type { AgentCard, CopyRunSummary } from 'services/copyTrading/types'

import { Stack } from 'components/Stack'
import { HeaderCell, TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { CopyRunAgentCell } from 'pages/CopyTrading/components/common'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatDate, formatUsd, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type ClosedSubscriptionsGridProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const ClosedSubscriptionsGrid = ({ header, className, ...props }: ClosedSubscriptionsGridProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]',
        className,
      )}
      {...props}
    />
  )
}

type ClosedSubscriptionsTableProps = {
  agents: AgentCard[]
  loading?: boolean
  rows: CopyRunSummary[]
  onOpenSubscription: (subscription: CopyRunSummary) => void
}

const ClosedSubscriptionsTable = ({ rows, agents, loading, onOpenSubscription }: ClosedSubscriptionsTableProps) => {
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
      <ClosedSubscriptionsGrid header>
        <HeaderCell>Agent</HeaderCell>
        <HeaderCell className="justify-end text-right">Closed Trades</HeaderCell>
        <HeaderCell className="justify-end text-right">Started</HeaderCell>
        <HeaderCell className="justify-end text-right">Stopped</HeaderCell>
        <HeaderCell className="justify-end text-right">Capital In</HeaderCell>
        <HeaderCell className="justify-end text-right">Capital Out</HeaderCell>
        <HeaderCell className="justify-end text-right">Realised P&amp;L</HeaderCell>
        <HeaderCell className="justify-end text-right">Fees Paid</HeaderCell>
        <HeaderCell className="justify-end text-right">Rebates</HeaderCell>
      </ClosedSubscriptionsGrid>

      <TableBody
        empty={!rows.length}
        emptyIconUrl={copyTradingStatIconMap.positionClose.iconUrl}
        emptyMessage="No closed copies found"
        loading={loading}
      >
        {rows.map(subscription => {
          const realizedPnl = signedUsd(subscription.realizedPnlUsd)

          return (
            <ClosedSubscriptionsGrid
              key={subscription.copyRunId}
              role="button"
              tabIndex={0}
              onClick={() => onOpenSubscription(subscription)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpenSubscription(subscription)
                }
              }}
              className="cursor-pointer"
            >
              <CopyRunAgentCell agent={agentsById[subscription.agentId]} run={subscription} className="px-3 py-2" />
              <TableCell className="text-right">
                {subscription.closedTradeCount || subscription.openPositionCount}
              </TableCell>
              <TableCell className="text-right text-subText">{formatDate(subscription.startedAt)}</TableCell>
              <TableCell className="text-right text-subText">{formatDate(subscription.stoppedAt)}</TableCell>
              <TableCell className="text-right">{formatUsd(subscription.capitalInUsd)}</TableCell>
              <TableCell className="text-right">{formatUsd(subscription.capitalOutUsd)}</TableCell>
              <TableCell className={cn('text-right', realizedPnl.startsWith('-') ? 'text-red' : 'text-primary')}>
                {realizedPnl}
              </TableCell>
              <TableCell className="text-right">{formatUsd(subscription.feesPaidUsd)}</TableCell>
              <TableCell className="text-right">{formatUsd(subscription.rebatesReceivedUsd)}</TableCell>
            </ClosedSubscriptionsGrid>
          )
        })}
      </TableBody>
    </Stack>
  )
}

export default ClosedSubscriptionsTable
