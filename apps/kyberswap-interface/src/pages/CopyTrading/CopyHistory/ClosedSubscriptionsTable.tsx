import type { AgentCard, CopyRunSummary } from 'services/copyTrading/types'

import { HStack, Stack } from 'components/Stack'
import { AgentCell } from 'pages/CopyTrading/components/AgentIdentity'
import { TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { formatDate, formatUsd, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const closedSubscriptionsColumns =
  'minmax(0, 2.4fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1.15fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr)'

const ClosedSubscriptionsTable = ({
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
      <TableHeader columns={closedSubscriptionsColumns}>
        {[
          'Agent',
          'Closed Trades',
          'Started',
          'Stopped',
          'Capital In',
          'Capital Out',
          'Realised P&L',
          'Fees Paid',
          'Rebates',
        ].map(item => (
          <TableCell key={item}>{item}</TableCell>
        ))}
      </TableHeader>
      {rows.map(subscription => {
        const agent = agents.find(item => item.agentId === subscription.agentId)
        if (!agent) return null

        const realizedPnl = signedUsd(subscription.realizedPnlUsd)

        return (
          <TableRow
            key={subscription.copyRunId}
            columns={closedSubscriptionsColumns}
            role="button"
            tabIndex={0}
            onClick={() => onOpenSubscription(subscription)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') onOpenSubscription(subscription)
            }}
            className="cursor-pointer"
          >
            <AgentCell agent={agent} className="px-3 py-2" />
            <TableCell>{subscription.closedTradeCount || subscription.openPositionCount}</TableCell>
            <TableCell className="text-subText">{formatDate(subscription.startedAt)}</TableCell>
            <TableCell className="text-subText">{formatDate(subscription.stoppedAt)}</TableCell>
            <TableCell>{formatUsd(subscription.capitalInUsd)}</TableCell>
            <TableCell>{formatUsd(subscription.capitalOutUsd)}</TableCell>
            <TableCell className={cn(realizedPnl.startsWith('-') ? 'text-red' : 'text-primary')}>
              {realizedPnl}
            </TableCell>
            <TableCell>{formatUsd(subscription.feesPaidUsd)}</TableCell>
            <TableCell>{formatUsd(subscription.rebatesReceivedUsd)}</TableCell>
          </TableRow>
        )
      })}
    </Stack>
    <HStack className="justify-center gap-2 border-t border-border p-4">
      {['‹', '1', '2', '...', '99', '100', '›'].map(item => (
        <button
          key={item}
          type="button"
          className={cn(
            'size-9 cursor-pointer rounded-full border-0 bg-background text-sm text-subText transition-colors hover:bg-primary-12 hover:text-primary',
            item === '2' && 'bg-primary-20 text-primary',
          )}
        >
          {item}
        </button>
      ))}
    </HStack>
  </Stack>
)

export default ClosedSubscriptionsTable
