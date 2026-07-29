import { cn } from 'utils/cn'

/**
 * Lightweight line-chart placeholder for sparkline cells.
 *
 * Defaults to the pool table chart size; use `className` to override it for
 * another container. Animation is owned by the surrounding table body or row.
 */
const SparklineSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('h-9 w-full', className)}>
    <svg aria-hidden className="size-full" preserveAspectRatio="none" viewBox="0 0 132 40">
      <path
        d="M2 31 C14 28 20 18 32 22 S50 34 64 20 S84 8 98 14 S118 27 130 10"
        fill="none"
        stroke="#a9a9a933"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  </div>
)

export default SparklineSkeleton
