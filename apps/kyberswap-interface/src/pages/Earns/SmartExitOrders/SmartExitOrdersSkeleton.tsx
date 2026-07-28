import { HStack } from 'components/Stack'
import { ORDERS_TABLE_GRID_COLUMNS } from 'pages/Earns/SmartExitOrders/constants'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'

const Circle = ({ size, style }: { size: number; style?: React.CSSProperties }) => (
  <PositionSkeleton width={size} height={size} style={{ borderRadius: '50%', ...style }} />
)

// Mirrors TitleContent: token pair (2 overlapping logos + symbol + fee badge) over a dex/protocol row.
const TitleSkeleton = () => (
  <div className="flex flex-col gap-1">
    <HStack className="items-center gap-2">
      <HStack className="items-end gap-0">
        <Circle size={24} />
        <Circle size={24} style={{ marginLeft: -8 }} />
      </HStack>
      <PositionSkeleton width={68} height={16} />
      <PositionSkeleton width={54} height={18} />
    </HStack>
    <HStack className="ml-4 items-center gap-1">
      <Circle size={14} />
      <PositionSkeleton width={56} height={12} />
      <PositionSkeleton width={64} height={18} />
    </HStack>
  </div>
)

const ConditionSkeleton = () => (
  <div className="flex flex-col gap-2">
    <PositionSkeleton width={132} height={14} />
    <PositionSkeleton width={88} height={14} />
  </div>
)

const ReceivedSkeleton = ({ alignEnd }: { alignEnd?: boolean }) => (
  <div className={`flex flex-col gap-1 ${alignEnd ? 'items-end' : 'items-start'}`}>
    <PositionSkeleton width={84} height={12} />
    <PositionSkeleton width={84} height={12} />
  </div>
)

// Mirrors OrderItem's desktop row: # | Position | Condition(s) | Est. liquidity | Received | Max gas | Status | ⏷
const DesktopRowSkeleton = () => (
  <div className="grid items-center gap-4 py-4" style={{ gridTemplateColumns: ORDERS_TABLE_GRID_COLUMNS }}>
    <PositionSkeleton width={16} height={14} />
    <TitleSkeleton />
    <ConditionSkeleton />
    <PositionSkeleton width={56} height={14} />
    <ReceivedSkeleton />
    <PositionSkeleton width={40} height={14} />
    <PositionSkeleton width={60} height={20} />
    <PositionSkeleton width={32} height={32} style={{ borderRadius: '0.75rem' }} />
  </div>
)

// Mirrors OrderItem's mobile card: title, condition, then label/value rows + status/action footer.
const MobileCardSkeleton = () => (
  <div className="mb-4 flex flex-col gap-3 rounded-xl bg-background p-4">
    <TitleSkeleton />
    <ConditionSkeleton />
    <div className="flex items-center justify-between">
      <PositionSkeleton width={120} height={14} />
      <PositionSkeleton width={56} height={14} />
    </div>
    <div className="flex items-center justify-between">
      <PositionSkeleton width={100} height={14} />
      <ReceivedSkeleton alignEnd />
    </div>
    <div className="flex items-center justify-between">
      <PositionSkeleton width={64} height={14} />
      <PositionSkeleton width={40} height={14} />
    </div>
    <div className="flex items-center justify-between">
      <PositionSkeleton width={60} height={20} />
      <PositionSkeleton width={32} height={32} style={{ borderRadius: '0.75rem' }} />
    </div>
  </div>
)

const SmartExitOrdersSkeleton = ({ rows = 5, upToMedium }: { rows?: number; upToMedium: boolean }) => {
  if (upToMedium) {
    return (
      <div className="pt-2">
        {Array.from({ length: rows }, (_, i) => (
          <MobileCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="[&>*]:border-b [&>*]:border-border [&>:last-child]:border-b-0">
      {Array.from({ length: rows }, (_, i) => (
        <DesktopRowSkeleton key={i} />
      ))}
    </div>
  )
}

export default SmartExitOrdersSkeleton
