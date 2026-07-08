import { CopyTradingSubscription } from 'services/copyTrading'

import { Stack } from 'components/Stack'

import { AgentCell } from '../components/AgentIdentity'
import { TableCell, TableHeader, TableRow } from '../components/Table'

const activeSubscriptionsColumns =
  'minmax(0, 2.4fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 0.9fr) minmax(0, 1.1fr)'

const ActiveSubscriptionsTable = ({
  rows,
  onOpenSubscription,
}: {
  rows: CopyTradingSubscription[]
  onOpenSubscription: (subscription: CopyTradingSubscription) => void
}) => (
  <Stack className="overflow-hidden rounded-xl bg-buttonBlack">
    <Stack className="overflow-hidden">
      <TableHeader columns={activeSubscriptionsColumns}>
        {['Agent', 'Agent APR', 'Win Rates', 'Volume', 'Capital In', 'Positions', ''].map(item => (
          <TableCell key={item}>{item}</TableCell>
        ))}
      </TableHeader>
      {rows.map(subscription => (
        <TableRow
          key={subscription.id}
          columns={activeSubscriptionsColumns}
          role="button"
          tabIndex={0}
          onClick={() => onOpenSubscription(subscription)}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') onOpenSubscription(subscription)
          }}
          className="cursor-pointer"
        >
          <AgentCell agent={subscription.agent} className="px-3 py-2" />
          <TableCell className="text-primary">{subscription.agentApr}</TableCell>
          <TableCell>{subscription.winRate}</TableCell>
          <TableCell>{subscription.volume}</TableCell>
          <TableCell>{subscription.capitalIn}</TableCell>
          <TableCell>{subscription.positions}</TableCell>
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
      ))}
    </Stack>
  </Stack>
)

export default ActiveSubscriptionsTable
