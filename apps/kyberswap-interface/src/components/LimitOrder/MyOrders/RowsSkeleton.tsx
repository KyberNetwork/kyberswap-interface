import { RowWrapper, RowWrapperLayout } from 'components/LimitOrder/MyOrders/TableHeader'
import TableCellSkeleton from 'components/Skeleton/TableCellSkeleton'
import { cn } from 'utils/cn'

// Match OrderRow's 64px minimum. Mobile adds a 20px status row below the 44px size/rate
// cells: 44px + 4px grid gap + 20px + 16px vertical padding = 84px.
const RowsSkeleton = ({ isActiveTab }: { isActiveTab: boolean }) => (
  <div className="animate-pulse motion-reduce:animate-none" data-testid="limit-orders-skeleton">
    {Array.from({ length: 3 }, (_, index) => (
      <RowWrapper
        key={index}
        layout={isActiveTab ? RowWrapperLayout.ACTIVE : RowWrapperLayout.HISTORY}
        className="min-h-16 px-4 py-2 max-sm:min-h-[84px] max-sm:grid-rows-[44px_20px]"
      >
        <TableCellSkeleton
          className="justify-self-center max-sm:row-span-2 max-sm:row-start-1"
          circle
          height={20}
          width={20}
        />
        <TableCellSkeleton className="max-sm:col-start-2 max-sm:row-start-1" height={14} width="80%" />
        <TableCellSkeleton className="justify-self-end max-sm:col-start-3 max-sm:row-start-1" height={14} width="80%" />
        {isActiveTab && (
          <TableCellSkeleton
            className="justify-self-end max-sm:col-start-3 max-sm:row-start-2"
            height={14}
            width="80%"
          />
        )}
        <TableCellSkeleton className="justify-self-end max-sm:hidden" height={14} width="80%" />
        <TableCellSkeleton
          className={cn('max-sm:col-start-2 max-sm:row-start-2', !isActiveTab && 'max-sm:col-span-2')}
          height={14}
          width="80%"
        />
        <div
          className={cn(
            'flex size-7 items-center justify-center justify-self-end',
            isActiveTab ? 'max-sm:col-start-4 max-sm:row-span-2 max-sm:row-start-1' : 'max-sm:hidden',
          )}
        >
          <TableCellSkeleton height={20} width={20} />
        </div>
      </RowWrapper>
    ))}
  </div>
)

export default RowsSkeleton
