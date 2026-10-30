import useSkeletonWidth, { type SkeletonWidthProps } from 'components/Skeleton/useSkeletonWidth'
import { cn } from 'utils/cn'

type Props = SkeletonWidthProps & {
  width: number | string
  height: number
  circle?: boolean
  className?: string
}

/**
 * Lightweight static placeholder for content inside a table cell.
 *
 * Wrap the table body or row with `animate-pulse` so all cells animate in sync
 * without rendering an individual shimmer for each placeholder.
 */
const TableCellSkeleton = ({ width, randomWidth, widthSeed, height, circle = false, className }: Props) => {
  const resolvedWidth = useSkeletonWidth({ width, randomWidth, widthSeed })

  return (
    <div
      className={cn('shrink-0 bg-text-12', circle ? 'rounded-full' : 'rounded', className)}
      style={{ width: resolvedWidth, height }}
    />
  )
}

export default TableCellSkeleton
