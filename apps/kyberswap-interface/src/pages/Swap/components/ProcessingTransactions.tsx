import { t } from '@lingui/macro'
import { Maximize } from 'react-feather'

import Badge, { BadgeVariant } from 'components/Badge'
import IconButton from 'components/Button/IconButton'
import ScrollableWithSignal from 'components/ScrollableWithSignal'
import { HStack, Stack } from 'components/Stack'
import { localTransactionKey } from 'pages/CrossChainSwap/transactions/model'
import ProcessingTransactionItem from 'pages/Swap/components/ProcessingTransactionItem'
import { useProcessingTransactions } from 'pages/Swap/hooks/useProcessingTransactions'
import { cn } from 'utils/cn'

const ProcessingTransactions = ({ onOpenHistory }: { onOpenHistory: () => void }) => {
  const transactions = useProcessingTransactions()
  if (!transactions.length) return null

  return (
    <Stack
      as="section"
      aria-label="Your processing orders"
      className="w-full gap-1 rounded-xl border border-white/[0.04] p-3"
    >
      <HStack className="items-center justify-between gap-2">
        <HStack className="items-center gap-2">
          <span className="text-sm leading-5 text-subText">{t`Your processing orders`}</span>
          <Badge variant={BadgeVariant.WARNING} className="h-5 min-w-5 px-1.5 py-0 text-xs">
            {transactions.length}
          </Badge>
        </HStack>
        <IconButton
          aria-label="Open transaction history"
          aria-controls="swap-right-panel"
          onClick={onOpenHistory}
          className="size-5 rounded p-0.5"
        >
          <Maximize size={16} className="shrink-0 text-subText" aria-hidden />
        </IconButton>
      </HStack>
      {/* Reserve space for the signal, including its bounce, outside the rows. */}
      <div className={cn('relative w-full', transactions.length > 3 && 'pb-7')}>
        <ScrollableWithSignal
          data-open="true"
          showArrow
          showBackground
          className="max-h-[92px] overflow-x-hidden"
          tabIndex={0}
          role="region"
          aria-label="Processing transactions"
        >
          {/* Three 28px rows and two 4px gaps. */}
          <Stack as="ul" className="gap-1">
            {transactions.map(tx => (
              <ProcessingTransactionItem key={localTransactionKey(tx)} tx={tx} />
            ))}
          </Stack>
        </ScrollableWithSignal>
      </div>
    </Stack>
  )
}

export default ProcessingTransactions
