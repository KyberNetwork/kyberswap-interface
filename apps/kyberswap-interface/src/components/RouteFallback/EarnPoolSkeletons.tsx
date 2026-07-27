import {
  Cards,
  Cell,
  Chips,
  Circle,
  PageWrapper,
  PairCell,
  TableShell,
  TitleRow,
} from 'components/RouteFallback/common'
import Skeleton from 'components/Skeleton'
import { cn } from 'utils/cn'

const PoolTableGrid = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn('grid items-center', className)}
    style={{ gridTemplateColumns: '1.7fr 0.8fr 0.9fr 0.9fr 1fr 1fr 156px 40px' }}
  >
    {children}
  </div>
)

const POOL_MOBILE_FIELDS: Array<[label: number, value: number]> = [
  [32, 56], // APR
  [28, 64], // Fee
  [28, 64], // TVL
  [52, 64], // Volume
  [58, 70], // Rewards
]

const PoolMobileCard = () => (
  <div className="rounded-xl bg-background p-2">
    <div className="flex w-full items-start justify-between p-2">
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <div className="flex w-10 items-end gap-0">
            <Circle size={24} />
            <div className="-translate-x-2">
              <Circle size={24} />
            </div>
          </div>
          <Skeleton width={84} height={16} />
          <Skeleton width={40} height={20} />
        </div>
        <div className="flex items-center gap-1">
          <Circle size={16} />
          <Skeleton width={72} height={14} />
        </div>
      </div>
      <Skeleton width={16} height={16} />
    </div>
    <div className="flex flex-col">
      {POOL_MOBILE_FIELDS.map(([label, value], i) => (
        <div key={i} className="flex w-full items-center justify-between gap-1 p-2">
          <Skeleton width={label} height={14} />
          <Skeleton width={value} height={14} />
        </div>
      ))}
      <div className="flex w-full flex-col items-stretch p-2">
        <Skeleton width="100%" height={48} />
      </div>
    </div>
  </div>
)

export const EarnPoolsSkeleton = () => (
  <PageWrapper>
    {/* Title + subtitle share a gap-2 sub-stack (the real page wraps them in <Stack gap-2>). The subtitle
        is one long line filling the content width on desktop. */}
    <div className="flex flex-col gap-2">
      <TitleRow width={450} />
      {/* py-1 reserves the subtitle's 24px line box (16px text + leading) so nothing below shifts down. */}
      <div className="py-1">
        <Skeleton width="90%" height={16} containerClassName="block" />
      </div>
    </div>

    {/* Category tags (h-42, rounded-xl, gap-4) + My Positions button. */}
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-4">
        {[94, 50, 162, 181, 123, 152, 153].map((w, i) => (
          <Skeleton key={i} width={w} height={42} />
        ))}
      </div>
      <Skeleton width={148} height={36} />
    </div>
    {/* Chain / protocol / interval pills (gap-4) + 320px search pill + Create Pool button (h-32, r-16). */}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-4">
        <Skeleton width={148} height={36} />
        <Skeleton width={148} height={36} />
        <Skeleton width={78} height={36} />
      </div>
      <div className="flex gap-3">
        <Skeleton width={320} height={36} />
        <Skeleton width={133} height={32} />
      </div>
    </div>

    {/* Desktop table (≥993). Header is 60px tall: TableHeader p-3 + inner TableCell py-2 + text-sm line. */}
    <TableShell className="max-md:hidden">
      <PoolTableGrid className="h-[60px] border-b border-tableHeader px-3">
        {[44, 40, 36, 36, 56, 64, 72, 0].map((w, i) => (
          <Skeleton key={i} width={w} height={14} />
        ))}
      </PoolTableGrid>
      {Array.from({ length: 8 }, (_, r) => (
        <PoolTableGrid key={r} className="p-3">
          <PairCell />
          <Cell>
            <Skeleton width={56} height={16} />
          </Cell>
          <Cell>
            <Skeleton width={60} height={16} />
          </Cell>
          <Cell>
            <Skeleton width={64} height={16} />
          </Cell>
          <Cell>
            <Skeleton width={64} height={16} />
          </Cell>
          <Cell>
            <Skeleton width={70} height={16} />
          </Cell>
          <Cell>
            <Skeleton width={120} height={32} />
          </Cell>
          <Cell className="!items-center">
            <Skeleton width={16} height={16} />
          </Cell>
        </PoolTableGrid>
      ))}
    </TableShell>

    {/* Mobile cards (≤992). */}
    <div className="flex flex-col gap-4 md:hidden">
      {Array.from({ length: 8 }, (_, r) => (
        <PoolMobileCard key={r} />
      ))}
    </div>
  </PageWrapper>
)

export const EarnLandingSkeleton = () => (
  <div className="flex w-full max-w-[1152px] flex-col gap-16 px-4 py-[60px] max-xxs:py-9">
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4">
        <Skeleton width={440} height={40} />
        <div className="flex flex-col items-center gap-2">
          <Skeleton width={760} height={16} />
          <Skeleton width={620} height={16} />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 max-sm:flex-col">
        <Skeleton width={120} height={18} />
        <Skeleton width={120} height={28} />
        <Skeleton width={170} height={44} />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-5 max-sm:grid-cols-1">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} height={366} />
      ))}
    </div>
    <div className="flex flex-col gap-5">
      <Skeleton height={240} />
      <Skeleton height={240} />
    </div>
  </div>
)

export const PoolDetailSkeleton = () => (
  <div className="flex w-full max-w-[1224px] flex-col gap-5 px-6 pt-6 max-sm:px-4">
    <div className="flex items-center gap-2">
      <Skeleton circle width={32} height={32} />
      <Skeleton circle width={28} height={28} />
      <Skeleton circle width={28} height={28} />
      <Skeleton width={160} height={24} />
      <Skeleton width={60} height={22} />
    </div>
    <Cards count={4} height={72} />
    <div className="flex gap-5 max-lg:flex-col">
      <div className="flex-1">
        <Skeleton height={380} />
      </div>
      <div className="w-[400px] max-lg:w-full">
        <Skeleton height={380} />
      </div>
    </div>
  </div>
)

export const TablePageSkeleton = () => (
  <div className="flex w-full max-w-[1500px] flex-col gap-5 px-6 pb-12 pt-8 max-sm:px-4 max-sm:pt-6">
    <Skeleton width={240} height={28} />
    <Chips count={5} />
    <div className="overflow-hidden rounded-2xl bg-background/80">
      <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-4 border-b border-tableHeader p-4 max-sm:hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} width={70} height={14} />
        ))}
      </div>
      {Array.from({ length: 8 }, (_, r) => (
        <div key={r} className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] items-center gap-4 p-4 max-sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Skeleton circle width={28} height={28} />
            <Skeleton width={120} height={16} />
          </div>
          <Skeleton width={70} height={16} />
          <Skeleton width={70} height={16} />
          <Skeleton width={70} height={16} />
          <Skeleton width={70} height={16} />
        </div>
      ))}
    </div>
  </div>
)
