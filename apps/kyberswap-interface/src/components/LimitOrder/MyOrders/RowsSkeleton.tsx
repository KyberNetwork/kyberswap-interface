import { RowWrapper, RowWrapperLayout } from 'components/LimitOrder/MyOrders/TableHeader'
import Skeleton from 'components/Skeleton'

const RowsSkeleton = ({ isActiveTab }: { isActiveTab: boolean }) => (
  <div data-testid="limit-orders-skeleton">
    {Array.from({ length: 3 }, (_, index) => (
      <RowWrapper
        key={index}
        layout={isActiveTab ? RowWrapperLayout.ACTIVE : RowWrapperLayout.HISTORY}
        className="min-h-14 px-4 py-2"
      >
        <Skeleton circle height={20} width={20} />
        <Skeleton height={14} width="80%" />
        <Skeleton height={14} width="80%" />
        {isActiveTab && <Skeleton height={14} width="80%" containerClassName="max-sm:hidden" />}
        <Skeleton height={14} width="80%" containerClassName="max-sm:hidden" />
        <Skeleton height={14} width="80%" containerClassName="max-sm:col-start-2" />
        <Skeleton height={20} width={20} containerClassName="max-sm:hidden" />
      </RowWrapper>
    ))}
  </div>
)

export default RowsSkeleton
