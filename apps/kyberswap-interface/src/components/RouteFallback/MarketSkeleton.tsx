import Skeleton from 'components/Skeleton'
import { cn } from 'utils/cn'

const Circle = ({ size }: { size: number }) => <Skeleton circle width={size} height={size} />

const Right = ({ width, height = 16, className }: { width: number; height?: number; className?: string }) => (
  <div className={cn('flex items-center justify-end px-3', className)}>
    <Skeleton width={width} height={height} />
  </div>
)

const MarketRow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      'grid grid-cols-[1fr_0.5fr_0.5fr_0.5fr_0.5fr_0.6fr_0.6fr_100px] items-center max-md:grid-cols-[1fr_1fr_1fr]',
      className,
    )}
  >
    {children}
  </div>
)

const MarketSkeleton = () => (
  <div className="flex min-h-[calc(100vh-80px)] w-full max-w-[1500px] flex-col gap-5 px-6 pb-12 pt-8 max-sm:px-4 max-sm:pt-6">
    {/* Title + subtitle. h-9 / py-1 reserve the real 36px + 24px line boxes so nothing below shifts down. */}
    <div className="flex flex-col gap-2">
      <div className="flex h-9 items-center">
        <Skeleton width={200} height={30} />
      </div>
      <div className="py-1">
        <Skeleton width="80%" height={16} containerClassName="block max-w-5xl" />
      </div>
    </div>

    {/* Category tags (h-38, gap-4) + 320px search pill. */}
    <div className="flex flex-wrap justify-between gap-4">
      <div className="flex flex-wrap gap-4">
        {[52, 48, 61, 75, 47, 65, 73].map((w, i) => (
          <Skeleton key={i} width={w} height={38} />
        ))}
      </div>
      <Skeleton width={320} height={36} rounded />
    </div>

    <div className="overflow-hidden rounded-2xl bg-background/80 p-6 max-md:w-[calc(100%+2rem)] max-md:self-center max-md:p-4">
      {/* Mobile header (≤992): tabs + chain logos + 3-col labels. */}
      <div className="flex flex-col gap-3 pb-3 md:hidden">
        <div className="flex gap-4">
          <Skeleton width={110} height={16} />
          <Skeleton width={130} height={16} />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 16 }, (_, i) => (
            <Circle key={i} size={24} />
          ))}
        </div>
        <div className="grid grid-cols-[1fr_1fr_1fr] items-center pt-1">
          <Skeleton width={50} height={14} />
          <div className="flex justify-end">
            <Skeleton width={70} height={14} />
          </div>
          <div className="flex justify-end">
            <Skeleton width={80} height={14} />
          </div>
        </div>
      </div>

      {/* Desktop top header (≥993) — 71px: Name | "On-chain Price" + chain logos | Market Overview. */}
      <div className="grid h-[71px] items-center max-md:hidden" style={{ gridTemplateColumns: '1fr 2fr 1.2fr 100px' }}>
        <div className="px-3">
          <Skeleton width={50} height={16} />
        </div>
        <div className="flex items-center justify-end gap-1.5 px-4">
          <Skeleton width={110} height={16} />
          <div className="flex max-w-[60%] flex-wrap justify-end gap-1.5">
            {Array.from({ length: 16 }, (_, i) => (
              <Circle key={i} size={20} />
            ))}
          </div>
        </div>
        <div className="flex justify-end px-4">
          <Skeleton width={120} height={16} />
        </div>
        <div />
      </div>
      {/* Desktop sub-header (≥993) — 46px (the 24H period select boxes set the height). */}
      <MarketRow className="h-[46px] border-b border-tableHeader max-md:hidden">
        <div />
        <Right width={56} height={14} />
        <Right width={40} height={14} />
        <Right width={56} height={14} />
        <Right width={40} height={14} />
        <Right width={70} height={14} />
        <Right width={70} height={14} />
        <div />
      </MarketRow>

      {Array.from({ length: 8 }, (_, r) => (
        <MarketRow key={r} className="py-3">
          <div className="flex items-center gap-2 p-3 max-md:px-0">
            <Circle size={24} />
            <div className="flex flex-col gap-1">
              <Skeleton width={70} height={14} />
              <Skeleton width={48} height={12} />
            </div>
          </div>
          {/* Desktop value cells (≥993). */}
          <Right width={56} height={14} className="max-md:hidden" />
          <Right width={48} height={14} className="max-md:hidden" />
          <Right width={56} height={14} className="max-md:hidden" />
          <Right width={48} height={14} className="max-md:hidden" />
          <Right width={64} height={14} className="max-md:hidden" />
          <Right width={64} height={14} className="max-md:hidden" />
          <div className="flex items-center justify-center gap-3 max-md:hidden">
            <Circle size={16} />
            <Circle size={16} />
          </div>
          {/* Mobile value cells (≤992): Buy Price | 24h Change. */}
          <Right width={60} height={14} className="md:hidden" />
          <Right width={50} height={14} className="md:hidden" />
        </MarketRow>
      ))}
    </div>
  </div>
)

export default MarketSkeleton
