import type { HTMLAttributes } from 'react'
import type { AgentCard, CopyRunSummary } from 'services/copyTrading/types'

import { ButtonLight } from 'components/Button'
import { Stack } from 'components/Stack'
import { AgentCell, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/common'
import { compactUsd, formatUsd, percent } from 'pages/CopyTrading/helpers'

const ActiveSubscriptionsGrid = ({ header, ...props }: HTMLAttributes<HTMLDivElement> & { header?: boolean }) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      columns="minmax(0, 2.4fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 0.9fr) minmax(0, 1.1fr)"
      {...props}
    />
  )
}

type ActiveSubscriptionsTableProps = {
  rows: CopyRunSummary[]
  agents: AgentCard[]
  onOpenSubscription: (subscription: CopyRunSummary) => void
}

const ActiveSubscriptionsTable = ({ rows, agents, onOpenSubscription }: ActiveSubscriptionsTableProps) => (
  <Stack className="overflow-hidden rounded-2xl bg-background/80">
    <Stack className="overflow-hidden">
      <ActiveSubscriptionsGrid header>
        {['Agent', 'Agent APR', 'Win Rates', 'Volume', 'Capital In', 'Positions', ''].map(item => (
          <TableCell key={item}>{item}</TableCell>
        ))}
      </ActiveSubscriptionsGrid>
      {rows.map(subscription => {
        const agent = agents.find(item => item.agentId === subscription.agentId)
        if (!agent) return null

        return (
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
              if (event.key === 'Enter' || event.key === ' ') onOpenSubscription(subscription)
            }}
            className="cursor-pointer"
          >
            <AgentCell agent={agent} className="px-3 py-2" />
            <TableCell className="text-primary">{percent(subscription.agentStats.apr30dPct)}</TableCell>
            <TableCell>{percent(subscription.agentStats.winRatePct)}</TableCell>
            <TableCell>{compactUsd(subscription.agentStats.volumeUsd)}</TableCell>
            <TableCell>{formatUsd(subscription.capitalInUsd)}</TableCell>
            <TableCell>{subscription.openPositionCount}</TableCell>
            <div className="px-3 py-2">
              <ButtonLight type="button" padding="8px 12px">
                Stop Copying
              </ButtonLight>
            </div>
          </ActiveSubscriptionsGrid>
        )
      })}
    </Stack>
  </Stack>
)

export default ActiveSubscriptionsTable
