import Skeleton from 'components/Skeleton'
import { ItemWrapper } from 'components/swapv2/LimitOrder/OrderBook/OrderItem'
import TableHeader from 'components/swapv2/LimitOrder/OrderBook/TableHeader'

const Amount = () => (
  <div className="flex items-center gap-2">
    <Skeleton circle width={17} height={17} />
    <Skeleton width={56} height={12} />
  </div>
)

// Mirrors OrderBook's OrderItem grid (CHAIN | RATE | AMOUNT | AMOUNT | STATUS) via the shared ItemWrapper.
const RowSkeleton = () => (
  <ItemWrapper className="h-11 items-center">
    <Skeleton width={16} height={16} />
    <Skeleton width={72} height={12} />
    <Amount />
    <Amount />
    <Skeleton width={60} height={12} />
  </ItemWrapper>
)

const Rows = ({ count }: { count: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <RowSkeleton key={i} />
    ))}
  </>
)

// Full order-book loading state: a list, the current-rate divider, then a second list — matching the
// real layout (sell orders · market rate · buy orders).
const OrderBookSkeleton = () => (
  <>
    <TableHeader />
    <Rows count={5} />
    <div className="grid grid-cols-[1fr_2fr_2fr_2fr_1fr] items-center bg-white-04 px-3 py-2 max-[500px]:grid-cols-[1.2fr_1.8fr_2fr_1.8fr]">
      <Skeleton width={16} height={16} />
      <Skeleton width={110} height={22} />
    </div>
    <Rows count={4} />
  </>
)

export default OrderBookSkeleton
