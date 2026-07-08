import type { AgentCard, CopyRunSummary } from 'services/copyTrading/types'

import { Stack } from 'components/Stack'
import { AgentCell } from 'pages/CopyTrading/components/AgentIdentity'
import { TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { compactUsd, formatUsd, percent } from 'pages/CopyTrading/helpers'

const activeSubscriptionsColumns =
  'minmax(0, 2.4fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 0.9fr) minmax(0, 1.1fr)'

const ActiveSubscriptionsTable = ({
  rows,
  agents,
  onOpenSubscription,
}: {
  rows: CopyRunSummary[]
  agents: AgentCard[]
  onOpenSubscription: (subscription: CopyRunSummary) => void
}) => (
  <Stack className="overflow-hidden rounded-xl bg-buttonBlack">
    <Stack className="overflow-hidden">
      <TableHeader columns={activeSubscriptionsColumns}>
        {['Agent', 'Agent APR', 'Win Rates', 'Volume', 'Capital In', 'Positions', ''].map(item => (
          <TableCell key={item}>{item}</TableCell>
        ))}
      </TableHeader>
      {rows.map(subscription => {
        const agent = agents.find(item => item.agentId === subscription.agentId)
        if (!agent) return null

        return (
          <TableRow
            key={subscription.copyRunId}
            columns={activeSubscriptionsColumns}
            role="button"
            tabIndex={0}
            onClick={() => onOpenSubscription(subscription)}
            onKeyDown={event => {
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
              <button
                type="button"
                onClick={event => event.stopPropagation()}
                className="h-9 w-full cursor-pointer rounded-xl border-0 bg-primary-12 text-sm font-semibold text-primary hover:bg-primary-20"
              >
                Stop Copying
              </button>
            </div>
          </TableRow>
        )
      })}
    </Stack>
  </Stack>
)

export default ActiveSubscriptionsTable
