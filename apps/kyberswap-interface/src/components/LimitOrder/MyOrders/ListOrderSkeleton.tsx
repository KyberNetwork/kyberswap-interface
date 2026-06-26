import { ReactNode } from 'react'

import TableHeader, { RowWrapper } from 'components/LimitOrder/MyOrders/TableHeader'
import Skeleton from 'components/Skeleton'
import { cn } from 'utils/cn'

const Stack = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('flex flex-col gap-1.5', className)}>{children}</div>
)

const RowSkeleton = ({ isLast }: { isLast?: boolean }) => (
  <RowWrapper className={cn('min-h-16 border-b border-darkBorder px-4 py-2', isLast && 'border-b-0')}>
    <span className="flex items-center justify-center">
      <Skeleton width={20} height={20} />
    </span>
    <Stack className="items-end">
      <Skeleton width={90} height={12} />
      <Skeleton width={68} height={12} />
    </Stack>
    <Stack className="items-end max-[640px]:hidden">
      <Skeleton width={84} height={12} />
    </Stack>
    <Stack className="items-end">
      <Skeleton width={80} height={12} />
      <Skeleton width={56} height={12} />
    </Stack>
    <Stack className="items-end">
      <Skeleton width={90} height={12} />
    </Stack>
    <span className="justify-self-end max-[640px]:hidden">
      <Skeleton width={104} height={26} />
    </span>
    <div className="flex items-center justify-end gap-1 max-[640px]:hidden">
      <Skeleton width={28} height={28} />
      <Skeleton width={28} height={28} />
    </div>
  </RowWrapper>
)

const ListOrderSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div>
    <TableHeader />
    {Array.from({ length: rows }, (_, i) => (
      <RowSkeleton key={i} isLast={i === rows - 1} />
    ))}
  </div>
)

export default ListOrderSkeleton
