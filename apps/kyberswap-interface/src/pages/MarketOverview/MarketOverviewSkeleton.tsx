import Skeleton from 'components/Skeleton'
import { TableRow } from 'pages/MarketOverview/styles'
import { cn } from 'utils/cn'

const NameCell = ({ upToMedium }: { upToMedium: boolean }) => (
  <div className={cn('flex items-start gap-2', upToMedium ? 'py-3' : 'p-3')}>
    <Skeleton circle width={24} height={24} />
    <div className="flex flex-col gap-1">
      <Skeleton width={48} height={16} />
      <Skeleton width={72} height={12} />
    </div>
  </div>
)

const RightCell = ({ width, className }: { width: number; className?: string }) => (
  <div className={cn('flex items-center justify-end px-3', className)}>
    <Skeleton width={width} height={14} />
  </div>
)

// Mirrors a data TableRow: Name on the left, then right-aligned value cells. The shared TableRow grid is
// responsive (8 cols desktop / 3 cols mobile), so the skeleton must emit the matching cell count.
const RowSkeleton = ({ upToMedium }: { upToMedium: boolean }) => (
  <TableRow className="cursor-default hover:bg-transparent">
    <NameCell upToMedium={upToMedium} />
    {upToMedium ? (
      <>
        <RightCell width={60} />
        <RightCell width={50} />
      </>
    ) : (
      <>
        <RightCell width={56} />
        <RightCell width={44} className="px-6 py-3" />
        <RightCell width={56} />
        <RightCell width={44} className="px-6 py-3" />
        <RightCell width={60} />
        <RightCell width={60} />
        <div className="flex items-center justify-center gap-3">
          <Skeleton circle width={16} height={16} />
          <Skeleton circle width={16} height={16} />
        </div>
      </>
    )}
  </TableRow>
)

const MarketOverviewSkeleton = ({ rows = 8, upToMedium }: { rows?: number; upToMedium: boolean }) => (
  <>
    {Array.from({ length: rows }, (_, i) => (
      <RowSkeleton key={i} upToMedium={upToMedium} />
    ))}
  </>
)

export default MarketOverviewSkeleton
