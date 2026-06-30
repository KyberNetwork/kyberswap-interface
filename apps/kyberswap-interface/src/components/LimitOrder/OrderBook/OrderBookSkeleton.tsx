import TableHeader, { RowWrapper } from 'components/LimitOrder/OrderBook/TableHeader'
import Skeleton from 'components/Skeleton'

const Amount = () => (
  <div className="flex items-center justify-end gap-2">
    <Skeleton width={56} height={12} />
  </div>
)

const RowSkeleton = () => (
  <RowWrapper className="min-h-14 px-4 py-2">
    <span className="flex items-center justify-center">
      <Skeleton width={20} height={20} />
    </span>
    <div className="flex flex-col items-end gap-1.5">
      <Skeleton width={72} height={12} />
      <Skeleton width={56} height={12} />
    </div>
    <span className="max-[640px]:hidden">
      <Amount />
    </span>
    <div className="flex flex-col items-end gap-1.5">
      <Skeleton width={72} height={12} />
      <Skeleton width={56} height={12} />
    </div>
    <Amount />
    <span className="justify-self-end max-[640px]:hidden">
      <Skeleton width={16} height={16} />
    </span>
    <span className="justify-self-end max-[640px]:hidden">
      <Skeleton width={52} height={24} borderRadius={12} />
    </span>
  </RowWrapper>
)

const Rows = ({ count }: { count: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <RowSkeleton key={i} />
    ))}
  </>
)

const OrderBookSkeleton = () => (
  <>
    <TableHeader />
    <Rows count={5} />
    <RowWrapper className="bg-background px-4 py-3">
      <span className="flex items-center justify-center">
        <Skeleton width={20} height={20} />
      </span>
      <span />
      <span className="max-[640px]:hidden" />
      <span className="justify-self-end max-[640px]:col-start-3">
        <Skeleton width={96} height={22} />
      </span>
      <span className="justify-self-start max-[640px]:col-start-4">
        <Skeleton width={72} height={14} />
      </span>
      <span className="max-[640px]:hidden" />
      <span className="max-[640px]:hidden" />
    </RowWrapper>
    <Rows count={4} />
  </>
)

export default OrderBookSkeleton
