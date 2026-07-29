import { TableCell, TableGrid, getPositionTableGridTemplateColumns } from 'components/Listing/Table'
import { TableHeaderLineSkeleton, TableValueSkeleton } from 'components/RouteFallback/common'
import TableCellSkeleton from 'components/Skeleton/TableCellSkeleton'
import { Center, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

type PositionListSkeletonProps = {
  rows?: number
  animated?: boolean
}

const PositionTableGrid = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <TableGrid className={className} columns={getPositionTableGridTemplateColumns()}>
    {children}
  </TableGrid>
)

// Deterministic width variation keeps each render stable without making every row look repeated.
const POSITION_ROW_VARIANTS = [
  { pair: 104, protocol: 104, value: 64, apr: 52, fees: 64, rewards: 68, balance: 76 },
  { pair: 88, protocol: 116, value: 72, apr: 60, fees: 56, rewards: 76, balance: 68 },
  { pair: 112, protocol: 96, value: 60, apr: 56, fees: 72, rewards: 64, balance: 84 },
  { pair: 96, protocol: 108, value: 68, apr: 64, fees: 60, rewards: 72, balance: 72 },
] as const

const PositionTableCell = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <TableCell className={cn('flex-row max-sm:w-full max-sm:justify-between max-sm:p-2', className)}>
    {children}
  </TableCell>
)

const PositionTableHeaderCell = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={cn('box-border flex h-full min-w-0 flex-col px-3 py-2', className)}>{children}</div>
)

export const PositionTableHeaderSkeleton = () => (
  <PositionTableGrid className="border-b border-tableHeader p-3 max-[1300px]:hidden">
    <PositionTableHeaderCell>
      <TableHeaderLineSkeleton width={64} />
    </PositionTableHeaderCell>
    <PositionTableHeaderCell>
      <TableHeaderLineSkeleton width={52} />
    </PositionTableHeaderCell>
    <PositionTableHeaderCell>
      <TableHeaderLineSkeleton width={64} />
    </PositionTableHeaderCell>
    <PositionTableHeaderCell>
      <div className="flex flex-col gap-1">
        <TableHeaderLineSkeleton width={76} />
        <TableHeaderLineSkeleton width={48} />
      </div>
    </PositionTableHeaderCell>
    <PositionTableHeaderCell className="flex-row gap-1">
      <TableCellSkeleton circle width={24} height={24} />
      <div className="flex flex-col">
        <TableHeaderLineSkeleton width={76} />
        <TableHeaderLineSkeleton width={64} />
      </div>
    </PositionTableHeaderCell>
    <PositionTableHeaderCell className="items-center">
      <TableHeaderLineSkeleton width={52} />
    </PositionTableHeaderCell>
    <PositionTableHeaderCell>
      <TableHeaderLineSkeleton width={80} />
    </PositionTableHeaderCell>
    <PositionTableHeaderCell className="items-end overflow-visible">
      <TableHeaderLineSkeleton width={68} />
    </PositionTableHeaderCell>
  </PositionTableGrid>
)

const ResponsiveLabelSkeleton = ({ width }: { width: number }) => (
  <TableCellSkeleton className="mt-1 hidden max-[1300px]:block" width={width} height={14} />
)

const PositionOverviewSkeleton = ({ index }: { index: number }) => {
  const widths = POSITION_ROW_VARIANTS[index % POSITION_ROW_VARIANTS.length]

  return (
    <TableCell className="gap-3 max-[1300px]:col-span-2 max-sm:w-full max-sm:p-2">
      <div className="flex items-center gap-3">
        <TableCellSkeleton circle width={24} height={24} />
        <TableCellSkeleton width={widths.pair} height={18} />
      </div>
      <div className="flex h-5 items-center">
        <TableCellSkeleton width={widths.protocol} height={16} />
      </div>
    </TableCell>
  )
}

const PositionActionSlot = ({ tablet = false }: { tablet?: boolean }) => (
  <PositionTableCell
    className={cn(
      'justify-end',
      tablet
        ? 'hidden max-[1300px]:flex max-sm:!absolute max-sm:right-2 max-sm:top-2 max-sm:p-2'
        : 'max-[1300px]:hidden',
    )}
  />
)

const PositionRowSkeleton = ({ index = 0 }: { index?: number }) => {
  const widths = POSITION_ROW_VARIANTS[index % POSITION_ROW_VARIANTS.length]

  return (
    <PositionTableGrid
      className={cn(
        'relative grid-rows-[1fr] p-3',
        'max-[1300px]:!grid-cols-3 max-[1300px]:grid-rows-none max-[1300px]:justify-start max-[1300px]:rounded-xl max-[1300px]:bg-background/80',
        'max-sm:!flex max-sm:flex-col max-sm:rounded-xl max-sm:p-2',
      )}
    >
      <PositionOverviewSkeleton index={index} />
      <PositionActionSlot tablet />

      <PositionTableCell>
        <ResponsiveLabelSkeleton width={36} />
        <TableValueSkeleton width={widths.value} />
      </PositionTableCell>
      <PositionTableCell>
        <ResponsiveLabelSkeleton width={28} />
        <TableValueSkeleton width={widths.apr} />
      </PositionTableCell>
      <PositionTableCell>
        <ResponsiveLabelSkeleton width={96} />
        <TableValueSkeleton width={widths.fees} />
      </PositionTableCell>
      <PositionTableCell className="min-[1301px]:justify-center">
        <ResponsiveLabelSkeleton width={116} />
        <TableValueSkeleton width={widths.rewards} />
      </PositionTableCell>

      <PositionTableCell>
        <ResponsiveLabelSkeleton width={52} />
        <Stack className="items-start gap-1 max-sm:flex-row">
          <TableValueSkeleton width={widths.balance} />
          <TableValueSkeleton width={widths.balance + 8} />
        </Stack>
      </PositionTableCell>
      <PositionTableCell>
        <Center className="h-8 w-full max-sm:my-[30px] max-sm:mb-5 max-sm:h-1">
          <TableCellSkeleton width="100%" height={6} />
        </Center>
      </PositionTableCell>
      <PositionActionSlot />
    </PositionTableGrid>
  )
}

const PositionListSkeleton = ({ rows = 5, animated = true }: PositionListSkeletonProps) => (
  <div className={cn('max-[1300px]:flex max-[1300px]:flex-col max-[1300px]:gap-4', animated && 'animate-pulse')}>
    {Array.from({ length: rows }, (_, index) => (
      <PositionRowSkeleton key={index} index={index} />
    ))}
  </div>
)

export default PositionListSkeleton
