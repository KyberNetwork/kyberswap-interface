import Skeleton from 'components/Skeleton'
import { ItemWrapper } from 'components/swapv2/LimitOrder/ListOrder/OrderItem'
import TableHeader from 'components/swapv2/LimitOrder/ListOrder/TableHeader'
import { cn } from 'utils/cn'

const Stack = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex flex-col gap-2', className)}>{children}</div>
)

// Mirrors OrderItem's 5-cell grid via the shared ItemWrapper, so the placeholders line up under the
// table headers (LIMIT ORDER(S) | RATE | CREATED·EXPIRY | FILLED%·STATUS | ACTION).
const RowSkeleton = ({ isLast }: { isLast?: boolean }) => (
  <ItemWrapper hasBorder={!isLast} className="cursor-default hover:!bg-transparent">
    <div className="flex items-center gap-2.5">
      <Skeleton width={12} height={12} />
      <Skeleton circle width={17} height={17} />
      <Stack className="gap-1.5">
        <Skeleton width={90} height={12} />
        <Skeleton width={68} height={12} />
      </Stack>
    </div>

    {/* RATE — `rate` class hides it on max-lg, matching the real row */}
    <Stack className="rate">
      <Skeleton width={80} height={12} />
    </Stack>

    {/* CREATED | EXPIRY */}
    <Stack className="gap-1.5">
      <Skeleton width={92} height={12} />
      <Skeleton width={92} height={12} />
    </Stack>

    {/* FILLED % | STATUS */}
    <Stack className="gap-1.5">
      <Skeleton width={64} height={12} />
      <Skeleton width="100%" height={11} borderRadius={6} />
    </Stack>

    {/* ACTION */}
    <div className="flex items-center justify-end gap-2">
      <Skeleton width={24} height={24} />
      <Skeleton width={24} height={24} />
    </div>
  </ItemWrapper>
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
