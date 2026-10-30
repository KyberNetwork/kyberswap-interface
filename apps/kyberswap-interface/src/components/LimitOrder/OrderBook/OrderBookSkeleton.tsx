import TableHeader, { RowWrapper } from 'components/LimitOrder/OrderBook/TableHeader'
import Skeleton from 'components/Skeleton'

export const OrderBookRowsSkeleton = () => (
  <div data-testid="order-book-rows-skeleton">
    {Array.from({ length: 3 }, (_, index) => (
      <RowWrapper key={index} className="min-h-14 items-center px-4 py-3">
        <Skeleton height={14} width="80%" />
        <Skeleton height={14} width="80%" />
        <Skeleton height={14} width="80%" />
        <Skeleton height={14} width="80%" containerClassName="max-sm:hidden" />
        <Skeleton height={24} width={48} containerClassName="max-sm:hidden" />
      </RowWrapper>
    ))}
  </div>
)

const OrderBookSkeleton = () => (
  <div data-testid="order-book-skeleton">
    <TableHeader />
    <div className="border-b border-darkBorder px-4 py-3">
      <Skeleton height={14} width={120} />
    </div>
    <OrderBookRowsSkeleton />
    <div className="border-y border-darkBorder px-4 py-3">
      <Skeleton height={24} width={180} />
    </div>
    <div className="border-b border-darkBorder px-4 py-3">
      <Skeleton height={14} width={120} />
    </div>
    <OrderBookRowsSkeleton />
  </div>
)

export default OrderBookSkeleton
