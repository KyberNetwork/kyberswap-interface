import type { HTMLAttributes } from 'react'
import type { AgentCard, CopyRunSummary } from 'services/copyTrading/types'

import { ButtonEmpty, ButtonLight } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { AgentCell, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/common'
import { formatDate, formatUsd, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const ClosedSubscriptionsGrid = ({ header, ...props }: HTMLAttributes<HTMLDivElement> & { header?: boolean }) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      columns="minmax(0, 2.4fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1.15fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr)"
      {...props}
    />
  )
}

const ClosedSubscriptionsTable = ({
  rows,
  agents,
  onOpenSubscription,
}: {
  rows: CopyRunSummary[]
  agents: AgentCard[]
  onOpenSubscription: (subscription: CopyRunSummary) => void
}) => (
  <Stack className="overflow-hidden rounded-2xl bg-background/80">
    <Stack className="overflow-hidden">
      <ClosedSubscriptionsGrid header>
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
      </ClosedSubscriptionsGrid>
      {rows.map(subscription => {
        const agent = agents.find(item => item.agentId === subscription.agentId)
        if (!agent) return null

        const realizedPnl = signedUsd(subscription.realizedPnlUsd)

        return (
          <ClosedSubscriptionsGrid
            key={subscription.copyRunId}
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
          </ClosedSubscriptionsGrid>
        )
      })}
    </Stack>
    <HStack className="justify-center gap-2 bg-subText-04 p-3">
      {['‹', '1', '2', '...', '99', '100', '›'].map(item => {
        const PageButton = item === '2' ? ButtonLight : ButtonEmpty

        return (
          <PageButton key={item} type="button" padding="8px 12px">
            {item}
          </PageButton>
        )
      })}
    </HStack>
  </Stack>
)

export default ClosedSubscriptionsTable
