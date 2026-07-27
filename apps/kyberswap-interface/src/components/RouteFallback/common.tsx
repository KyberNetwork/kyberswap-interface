import Skeleton from 'components/Skeleton'
import { cn } from 'utils/cn'

export const Circle = ({ size }: { size: number }) => <Skeleton circle width={size} height={size} />

export const Chips = ({ count }: { count: number }) => (
  <div className="flex flex-wrap gap-3">
    {Array.from({ length: count }, (_, index) => (
      <Skeleton key={index} width={96} height={36} />
    ))}
  </div>
)

export const Cards = ({ count, height }: { count: number; height: number }) => (
  <div className="flex gap-4 max-sm:flex-col">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="flex-1">
        <Skeleton height={height} />
      </div>
    ))}
  </div>
)

// Shared Earn page container. Individual pages can extend the gutters through className.
export const PageWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      'flex w-full max-w-[1500px] flex-col gap-4 px-6 pb-16 pt-8 max-sm:px-4 max-sm:pb-[100px] max-sm:pt-6',
      className,
    )}
  >
    {children}
  </div>
)

export const Cell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex min-w-0 flex-col justify-center gap-1 px-3 py-2', className)}>{children}</div>
)

export const Right = ({ width, height = 16, className }: { width: number; height?: number; className?: string }) => (
  <div className={cn('flex items-center justify-end px-3', className)}>
    <Skeleton width={width} height={height} />
  </div>
)

export const PairCell = () => (
  <Cell>
    <div className="flex items-center gap-2">
      <div className="flex w-10 items-end gap-0">
        <Circle size={24} />
        <div className="-translate-x-2">
          <Circle size={24} />
        </div>
      </div>
      <Skeleton width={88} height={16} />
      <Skeleton width={34} height={16} />
    </div>
    <div className="flex items-center gap-1">
      <Circle size={16} />
      <Skeleton width={64} height={12} />
    </div>
  </Cell>
)

export const TableShell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('overflow-hidden rounded-2xl bg-background/80', className)}>{children}</div>
)

export const TitleRow = ({ width, rowH = 36 }: { width: number; rowH?: number }) => (
  <div className="flex items-center gap-4" style={{ height: rowH }}>
    <Skeleton width={24} height={24} />
    <Skeleton width={width} height={32} />
  </div>
)
