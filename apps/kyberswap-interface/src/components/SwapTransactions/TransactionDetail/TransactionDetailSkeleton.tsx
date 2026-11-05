import { t } from '@lingui/macro'
import { ArrowRight } from 'react-feather'

import Divider from 'components/Divider'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'

const TransferCardSkeleton = () => (
  <Stack className="min-w-0 flex-1 overflow-hidden rounded-xl bg-background max-sm:w-full">
    <Stack className="flex-1 gap-3 p-4">
      <HStack className="h-4 items-center">
        <Skeleton width={64} height={12} variant="muted" />
      </HStack>
      <Stack className="gap-0.5">
        <HStack className="h-7 items-center">
          <Skeleton width="75%" height={20} containerClassName="w-full" variant="muted" />
        </HStack>
        <HStack className="h-4 items-center">
          <Skeleton width="65%" height={12} containerClassName="w-full" variant="muted" />
        </HStack>
      </Stack>
    </Stack>
    <Divider className="shrink-0 opacity-50" />
    <HStack className="min-h-11 shrink-0 items-center px-4 py-3">
      <Skeleton width="100%" height={12} containerClassName="w-full" variant="muted" />
    </HStack>
  </Stack>
)

/** Shared by the lazy chunk and the initial API request. Cached refetches keep their content. */
const TransactionDetailSkeleton = () => (
  <Stack className="gap-4" role="status" aria-label={t`Loading transaction details`}>
    <HStack className="min-h-5 items-center justify-between gap-3">
      <span className="text-sm font-medium">KyberCross</span>
      <Skeleton width={88} height={20} rounded variant="muted" />
    </HStack>
    <Stack className="gap-4 rounded-xl bg-background p-4" aria-hidden>
      {[0, 1, 2, 3].map(step => (
        <Stack key={step} className="gap-1.5">
          <HStack className="h-5 items-center">
            <Skeleton width="45%" height={14} containerClassName="w-full" variant="muted" />
          </HStack>
          <HStack className="h-5 items-center">
            <Skeleton width="80%" height={12} containerClassName="w-full" variant="muted" />
          </HStack>
        </Stack>
      ))}
    </Stack>
    <HStack className="items-stretch gap-3 max-sm:flex-col" aria-hidden>
      <TransferCardSkeleton />
      <ArrowRight size={20} className="shrink-0 self-center text-subText max-sm:rotate-90" />
      <TransferCardSkeleton />
    </HStack>
    <div className="grid grid-cols-2 gap-4 rounded-xl bg-background p-4" aria-hidden>
      {[0, 1, 2, 3].map(column => (
        <Stack key={column} className="gap-1.5">
          <HStack className="h-4 items-center">
            <Skeleton width={48} height={12} variant="muted" />
          </HStack>
          <HStack className="h-5 items-center">
            <Skeleton width="75%" height={14} containerClassName="w-full" variant="muted" />
          </HStack>
        </Stack>
      ))}
    </div>
    <Stack className="overflow-hidden rounded-xl bg-background" aria-hidden>
      <span className="px-4 py-3 text-sm font-medium">{t`Transactions`}</span>
      <Divider className="opacity-50" />
      <Stack className="gap-3 p-4">
        {[0, 1, 2, 3].map(row => (
          <HStack key={row} className="h-4 items-center">
            <Skeleton width="100%" height={12} containerClassName="w-full" variant="muted" />
          </HStack>
        ))}
      </Stack>
    </Stack>
  </Stack>
)

export default TransactionDetailSkeleton
