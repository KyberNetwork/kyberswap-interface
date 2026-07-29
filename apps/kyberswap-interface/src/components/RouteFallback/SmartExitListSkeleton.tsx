import { TableCell, TableGrid, getSmartExitTableGridTemplateColumns } from 'components/Listing/Table'
import { TableHeaderLineSkeleton, TableValueSkeleton } from 'components/RouteFallback/common'
import TableCellSkeleton from 'components/Skeleton/TableCellSkeleton'
import { cn } from 'utils/cn'

type SmartExitListSkeletonProps = {
  rows?: number
  animated?: boolean
}

const SmartExitTableGrid = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <TableGrid className={className} columns={getSmartExitTableGridTemplateColumns()}>
    {children}
  </TableGrid>
)

const SmartExitTableCell = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <TableCell className={cn('gap-0', className)}>{children}</TableCell>
)

// Deterministic width variation keeps each render stable without making every row look repeated.
const SMART_EXIT_ROW_VARIANTS = [
  { pair: 88, protocol: 80, condition: 124, conditionSub: 84, value: 64, received: 82, status: 56 },
  { pair: 104, protocol: 72, condition: 108, conditionSub: 92, value: 72, received: 74, status: 64 },
  { pair: 80, protocol: 92, condition: 136, conditionSub: 76, value: 60, received: 88, status: 52 },
  { pair: 96, protocol: 84, condition: 116, conditionSub: 88, value: 68, received: 78, status: 60 },
] as const

const OrderTitleSkeleton = ({ index, className }: { index: number; className?: string }) => {
  const widths = SMART_EXIT_ROW_VARIANTS[index % SMART_EXIT_ROW_VARIANTS.length]

  return (
    <TableCell className={cn('gap-3', className)}>
      <div className="flex h-6 items-center gap-2">
        <TableCellSkeleton circle width={24} height={24} />
        <TableCellSkeleton className="max-w-[calc(100%_-_32px)]" width={widths.pair} height={18} />
      </div>
      <div className="flex h-5 items-center">
        <TableCellSkeleton width={widths.protocol} height={14} />
      </div>
    </TableCell>
  )
}

const OrderConditionSkeleton = ({ index, className }: { index: number; className?: string }) => {
  const widths = SMART_EXIT_ROW_VARIANTS[index % SMART_EXIT_ROW_VARIANTS.length]

  return (
    <TableCell className={cn('lg:w-[calc(50%_-_36px)]', className)}>
      <TableValueSkeleton width={widths.condition} />
      <TableValueSkeleton width={widths.conditionSub} />
    </TableCell>
  )
}

const ReceivedSkeleton = ({ index }: { index: number }) => {
  const width = SMART_EXIT_ROW_VARIANTS[index % SMART_EXIT_ROW_VARIANTS.length].received

  return <TableValueSkeleton width={width} />
}

export const SmartExitTableHeaderSkeleton = () => (
  <SmartExitTableGrid className="border-b border-tableHeader p-3 max-[992px]:hidden">
    <SmartExitTableCell>
      <TableHeaderLineSkeleton width={12} />
    </SmartExitTableCell>
    <SmartExitTableCell>
      <TableHeaderLineSkeleton width={64} />
    </SmartExitTableCell>
    <SmartExitTableCell>
      <TableHeaderLineSkeleton width={84} />
    </SmartExitTableCell>
    <SmartExitTableCell>
      <TableHeaderLineSkeleton width={76} />
      <TableHeaderLineSkeleton width={56} />
    </SmartExitTableCell>
    <SmartExitTableCell>
      <TableHeaderLineSkeleton width={68} />
      <TableHeaderLineSkeleton width={52} />
    </SmartExitTableCell>
    <SmartExitTableCell>
      <TableHeaderLineSkeleton width={56} />
    </SmartExitTableCell>
    <SmartExitTableCell>
      <TableHeaderLineSkeleton width={48} />
    </SmartExitTableCell>
    <SmartExitTableCell className="px-1" />
  </SmartExitTableGrid>
)

const SmartExitDesktopRowSkeleton = ({ index }: { index: number }) => {
  const widths = SMART_EXIT_ROW_VARIANTS[index % SMART_EXIT_ROW_VARIANTS.length]

  return (
    <SmartExitTableGrid className="p-3">
      <SmartExitTableCell />
      <OrderTitleSkeleton index={index} />
      <OrderConditionSkeleton index={index} />
      <SmartExitTableCell>
        <TableValueSkeleton width={widths.value} />
      </SmartExitTableCell>
      <SmartExitTableCell>
        <ReceivedSkeleton index={index} />
      </SmartExitTableCell>
      <SmartExitTableCell>
        <TableValueSkeleton width={48} />
      </SmartExitTableCell>
      <SmartExitTableCell>
        <TableCellSkeleton width={widths.status} height={24} circle />
      </SmartExitTableCell>
      <SmartExitTableCell className="px-1" />
    </SmartExitTableGrid>
  )
}

const MobileFieldSkeleton = ({ labelWidth, children }: { labelWidth: number; children: React.ReactNode }) => (
  <div className="flex min-h-10 items-center justify-between gap-2 p-2">
    <TableCellSkeleton width={labelWidth} height={14} />
    {children}
  </div>
)

const SmartExitMobileCardSkeleton = ({ index }: { index: number }) => {
  const widths = SMART_EXIT_ROW_VARIANTS[index % SMART_EXIT_ROW_VARIANTS.length]

  return (
    <div className="flex flex-col rounded-xl bg-background p-2">
      <OrderTitleSkeleton index={index} className="h-auto p-2" />
      <OrderConditionSkeleton index={index} className="h-auto p-2" />
      <MobileFieldSkeleton labelWidth={120}>
        <TableValueSkeleton width={widths.value} />
      </MobileFieldSkeleton>
      <MobileFieldSkeleton labelWidth={100}>
        <ReceivedSkeleton index={index} />
      </MobileFieldSkeleton>
      <MobileFieldSkeleton labelWidth={64}>
        <TableValueSkeleton width={48} />
      </MobileFieldSkeleton>
      <div className="flex min-h-12 items-center justify-between gap-2 p-2">
        <TableCellSkeleton width={widths.status} height={24} circle />
        <div className="size-8 shrink-0" />
      </div>
    </div>
  )
}

const SmartExitDesktopListSkeleton = ({ rows = 5, animated = true }: SmartExitListSkeletonProps) => (
  <div className={cn(animated && 'animate-pulse')}>
    {Array.from({ length: rows }, (_, index) => (
      <SmartExitDesktopRowSkeleton key={index} index={index} />
    ))}
  </div>
)

const SmartExitMobileListSkeleton = ({ rows = 5, animated = true }: SmartExitListSkeletonProps) => (
  <div className={cn('flex flex-col gap-4', animated && 'animate-pulse')}>
    {Array.from({ length: rows }, (_, index) => (
      <SmartExitMobileCardSkeleton key={index} index={index} />
    ))}
  </div>
)

const SmartExitListSkeleton = (props: SmartExitListSkeletonProps) => (
  <>
    <div className="max-[992px]:hidden">
      <SmartExitDesktopListSkeleton {...props} />
    </div>
    <div className="hidden max-[992px]:block">
      <SmartExitMobileListSkeleton {...props} />
    </div>
  </>
)

export default SmartExitListSkeleton
