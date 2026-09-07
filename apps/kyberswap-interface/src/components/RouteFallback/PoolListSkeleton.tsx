import { TableCell, TableGrid, getPoolTableGridTemplateColumns } from 'components/Listing/Table'
import SparklineSkeleton from 'components/Skeleton/SparklineSkeleton'
import TableCellSkeleton from 'components/Skeleton/TableCellSkeleton'
import TextSkeleton from 'components/Skeleton/TextSkeleton'
import { cn } from 'utils/cn'

const PoolCircle = ({ size }: { size: number }) => <TableCellSkeleton circle width={size} height={size} />

type PoolListSkeletonProps = {
  rows?: number
  showRewards?: boolean
  showPoolPrice?: boolean
  animated?: boolean
}

const PoolTableGrid = ({
  children,
  className,
  showRewards = true,
  showPoolPrice = true,
}: {
  children: React.ReactNode
  className?: string
  showRewards?: boolean
  showPoolPrice?: boolean
}) => (
  <TableGrid className={className} columns={getPoolTableGridTemplateColumns(showRewards, showPoolPrice)}>
    {children}
  </TableGrid>
)

export const PoolTableHeaderSkeleton = ({
  showRewards = true,
  showPoolPrice = true,
}: Pick<PoolListSkeletonProps, 'showRewards' | 'showPoolPrice'>) => {
  const widths = [44, 40, 36, 36, 56, ...(showRewards ? [64] : []), ...(showPoolPrice ? [72] : []), 0]

  return (
    <PoolTableGrid
      className="h-[61px] border-b border-tableHeader p-3 max-md:hidden"
      showRewards={showRewards}
      showPoolPrice={showPoolPrice}
    >
      {widths.map((width, index) => (
        <TableCell key={index} className="justify-center">
          {width ? <TextSkeleton width={width} size="sm" /> : null}
        </TableCell>
      ))}
    </PoolTableGrid>
  )
}

// Deterministic width variation keeps each render stable without making every row look repeated.
const POOL_ROW_VARIANTS = [
  { pair: 92, protocol: 76, apr: 58, fee: 66, tvl: 76, volume: 72, rewards: 82 },
  { pair: 76, protocol: 88, apr: 64, fee: 74, tvl: 64, volume: 84, rewards: 68 },
  { pair: 104, protocol: 64, apr: 52, fee: 62, tvl: 82, volume: 68, rewards: 92 },
  { pair: 84, protocol: 96, apr: 68, fee: 78, tvl: 70, volume: 80, rewards: 76 },
] as const

const PoolPairCellSkeleton = ({ index }: { index: number }) => {
  const widths = POOL_ROW_VARIANTS[index % POOL_ROW_VARIANTS.length]

  return (
    <TableCell>
      <div className="flex items-center gap-3">
        <PoolCircle size={24} />
        <TextSkeleton width={widths.pair} size="base" />
      </div>
      <TextSkeleton width={widths.protocol} size="sm" />
    </TableCell>
  )
}

const PoolDesktopRowSkeleton = ({
  index,
  showRewards,
  showPoolPrice,
}: {
  index: number
  showRewards: boolean
  showPoolPrice: boolean
}) => {
  const widths = POOL_ROW_VARIANTS[index % POOL_ROW_VARIANTS.length]

  return (
    <PoolTableGrid className="p-3" showRewards={showRewards} showPoolPrice={showPoolPrice}>
      <PoolPairCellSkeleton index={index} />
      <TableCell>
        <TextSkeleton width={widths.apr} size="base" />
      </TableCell>
      <TableCell>
        <TextSkeleton width={widths.fee} size="base" />
      </TableCell>
      <TableCell>
        <TextSkeleton width={widths.tvl} size="base" />
      </TableCell>
      <TableCell>
        <TextSkeleton width={widths.volume} size="base" />
      </TableCell>
      {showRewards && (
        <TableCell>
          <TextSkeleton width={widths.rewards} size="base" />
        </TableCell>
      )}
      {showPoolPrice && (
        <TableCell>
          <SparklineSkeleton />
        </TableCell>
      )}
      <TableCell />
    </PoolTableGrid>
  )
}

const POOL_MOBILE_FIELDS: Array<[label: number, value: number]> = [
  [32, 56], // APR
  [28, 64], // Fee
  [28, 64], // TVL
  [52, 64], // Volume
]

const PoolMobileCardSkeleton = ({ index, showRewards }: { index: number; showRewards: boolean }) => {
  const widths = POOL_ROW_VARIANTS[index % POOL_ROW_VARIANTS.length]
  const fields = showRewards ? [...POOL_MOBILE_FIELDS, [58, 70] as [number, number]] : POOL_MOBILE_FIELDS

  return (
    <div className="rounded-xl bg-background p-2">
      <div className="flex h-20 w-full items-start justify-between p-2">
        <div className="flex items-center gap-3">
          <PoolCircle size={32} />
          <div className="flex flex-col gap-2">
            <TableCellSkeleton width={widths.pair} height={18} />
            <TableCellSkeleton width={widths.protocol} height={14} />
          </div>
        </div>
        <div className="size-5 shrink-0" />
      </div>
      <div className="flex flex-col">
        {fields.map(([label, value], i) => (
          <div key={i} className="flex h-10 w-full items-center justify-between gap-2 p-2">
            <TableCellSkeleton width={label} height={14} />
            <TableCellSkeleton width={value + ((index + i) % 3) * 8} height={16} />
          </div>
        ))}
        <div className="flex h-16 w-full flex-col items-stretch p-2">
          <SparklineSkeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}

const PoolDesktopListSkeleton = ({
  rows = 8,
  showRewards = true,
  showPoolPrice = true,
  animated = true,
}: PoolListSkeletonProps) => (
  <div className={cn(animated && 'animate-pulse')}>
    {Array.from({ length: rows }, (_, index) => (
      <PoolDesktopRowSkeleton key={index} index={index} showRewards={showRewards} showPoolPrice={showPoolPrice} />
    ))}
  </div>
)

const PoolMobileListSkeleton = ({ rows = 8, showRewards = true, animated = true }: PoolListSkeletonProps) => (
  <div className={cn('flex flex-col gap-4', animated && 'animate-pulse')}>
    {Array.from({ length: rows }, (_, index) => (
      <PoolMobileCardSkeleton key={index} index={index} showRewards={showRewards} />
    ))}
  </div>
)

const PoolListSkeleton = (props: PoolListSkeletonProps) => (
  <>
    <div className="max-md:hidden">
      <PoolDesktopListSkeleton {...props} />
    </div>
    <div className="hidden max-md:block">
      <PoolMobileListSkeleton {...props} />
    </div>
  </>
)

export default PoolListSkeleton
