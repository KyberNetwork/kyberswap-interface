import { POSITION_GRID, POSITION_GRID_TEMPLATE_COLUMNS } from 'pages/Earns/UserPositions/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { cn } from 'utils/cn'

// Mirrors PositionRow's grid + responsive collapse (desktop 9-col → tablet 3-col → mobile flex),
// minus the interactive/link/hover bits, so the skeleton cells line up under the table headers.
const ROW_LAYOUT = cn(
  POSITION_GRID,
  'relative grid-rows-[1fr] gap-y-2 bg-background px-7 py-4',
  'after:absolute after:inset-x-7 after:bottom-0 after:h-px after:bg-tableHeader after:content-[""] last:after:hidden',
  'max-[1300px]:mb-4 max-[1300px]:!grid-cols-3 max-[1300px]:grid-rows-[1fr_1fr] max-[1300px]:justify-start max-[1300px]:rounded-[20px] max-[1300px]:bg-background/80 max-[1300px]:after:hidden',
  'max-sm:!flex max-sm:flex-col max-sm:gap-y-4 max-sm:rounded-none max-sm:!bg-background/80 max-sm:p-4 max-sm:after:inset-x-4 max-sm:after:block',
)

const Cell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex items-start pt-2', className)}>{children}</div>
)

const PositionRowSkeleton = () => (
  <div className={ROW_LAYOUT} style={{ gridTemplateColumns: POSITION_GRID_TEMPLATE_COLUMNS }}>
    {/* Overview: token logos + pair name */}
    <div className="flex items-center gap-2 max-[1300px]:col-span-2">
      <div className="flex items-end">
        <PositionSkeleton width={28} height={28} style={{ borderRadius: '50%' }} />
        <PositionSkeleton width={28} height={28} style={{ borderRadius: '50%', marginLeft: -8 }} />
      </div>
      <div className="flex flex-col gap-1.5">
        <PositionSkeleton width={120} height={16} />
        <PositionSkeleton width={80} height={12} />
      </div>
    </div>

    {/* Value / APR / Unclaimed fees / Unclaimed rewards */}
    <Cell>
      <PositionSkeleton width={64} height={16} />
    </Cell>
    <Cell>
      <PositionSkeleton width={52} height={16} />
    </Cell>
    <Cell>
      <PositionSkeleton width={56} height={16} />
    </Cell>
    <Cell>
      <PositionSkeleton width={56} height={16} />
    </Cell>

    {/* 24px spacer column (desktop only) */}
    <div className="max-[1300px]:hidden" />

    {/* Balance */}
    <Cell>
      <PositionSkeleton width={72} height={16} />
    </Cell>

    {/* Price range */}
    <Cell className="items-center">
      <PositionSkeleton width="90%" height={6} />
    </Cell>

    {/* Actions */}
    <Cell className="justify-end gap-2">
      <PositionSkeleton width={32} height={32} style={{ borderRadius: '0.5rem' }} />
      <PositionSkeleton width={32} height={32} style={{ borderRadius: '0.5rem' }} />
    </Cell>
  </div>
)

const PositionListSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <>
    {Array.from({ length: rows }, (_, i) => (
      <PositionRowSkeleton key={i} />
    ))}
  </>
)

export default PositionListSkeleton
