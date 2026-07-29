import Skeleton, { SkeletonProps } from 'components/Skeleton'
import TableCellSkeleton from 'components/Skeleton/TableCellSkeleton'
import { Center } from 'components/Stack'
import { cn } from 'utils/cn'

const DetailSummaryCardsSkeleton = () => (
  <div className="flex gap-4 max-sm:flex-col">
    {Array.from({ length: 4 }, (_, index) => (
      <div key={index} className="flex-1">
        <Skeleton height={72} />
      </div>
    ))}
  </div>
)

export const DetailPageSkeleton = () => (
  <div className="flex w-full max-w-[1224px] flex-col gap-5 px-6 pt-6 max-sm:px-4">
    <div className="flex items-center gap-2">
      <Skeleton circle width={32} height={32} />
      <Skeleton circle width={28} height={28} />
      <Skeleton circle width={28} height={28} />
      <Skeleton width={160} height={24} />
      <Skeleton width={60} height={22} />
    </div>
    <DetailSummaryCardsSkeleton />
    <div className="flex gap-5 max-lg:flex-col">
      <div className="flex-1">
        <Skeleton height={380} />
      </div>
      <div className="w-[400px] max-lg:w-full">
        <Skeleton height={380} />
      </div>
    </div>
  </div>
)

type ControlSkeletonProps = Omit<SkeletonProps, 'width'> & {
  width: number
  wrapperClassName?: string
}

export const ControlSkeleton = ({ width, wrapperClassName, ...props }: ControlSkeletonProps) => (
  <div className={cn('shrink-0 max-sm:!w-full', wrapperClassName)} style={{ width }}>
    <Skeleton width="100%" height={36} {...props} />
  </div>
)

/** Shared 20px header text line for RouteFallback table cells. */
export const TableHeaderLineSkeleton = ({ width }: { width: number }) => (
  <div className="flex h-5 items-center">
    <TableCellSkeleton width={width} height={14} />
  </div>
)

/** Shared 24px value line for RouteFallback table cells. */
export const TableValueSkeleton = ({ width }: { width: number }) => (
  <Center className="h-6">
    <TableCellSkeleton width={width} height={18} />
  </Center>
)

export const TitleRowSkeleton = ({ width }: { width: number }) => (
  <div className="flex h-9 items-center gap-4">
    <Center className="size-9">
      <Skeleton width={24} height={24} />
    </Center>
    <Skeleton width={width} height={32} />
  </div>
)
