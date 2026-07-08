import { CopyTradingSubscription } from 'services/copyTrading'

import { HStack, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

import { AgentCell } from '../components/AgentIdentity'
import { TableCell, TableHeader, TableRow } from '../components/Table'

const closedSubscriptionsColumns =
  'minmax(0, 2.4fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1.15fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr)'

const ClosedSubscriptionsTable = ({
  rows,
  onOpenSubscription,
}: {
  rows: CopyTradingSubscription[]
  onOpenSubscription: (subscription: CopyTradingSubscription) => void
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
      {rows.map(subscription => (
        <TableRow
          key={subscription.id}
          columns={closedSubscriptionsColumns}
          role="button"
          tabIndex={0}
          onClick={() => onOpenSubscription(subscription)}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') onOpenSubscription(subscription)
          }}
          className="cursor-pointer"
        >
          <AgentCell agent={subscription.agent} className="px-3 py-2" />
          <TableCell>{subscription.positions}</TableCell>
          <TableCell className="text-subText">{subscription.started}</TableCell>
          <TableCell className="text-subText">{subscription.stopped}</TableCell>
          <TableCell>{subscription.capitalIn}</TableCell>
          <TableCell>{subscription.capitalOut}</TableCell>
          <TableCell className={cn(subscription.realizedPnl?.startsWith('-') ? 'text-red' : 'text-primary')}>
            {subscription.realizedPnl}
          </TableCell>
          <TableCell>{subscription.feesPaid}</TableCell>
          <TableCell>{subscription.rebates}</TableCell>
        </TableRow>
      ))}
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
