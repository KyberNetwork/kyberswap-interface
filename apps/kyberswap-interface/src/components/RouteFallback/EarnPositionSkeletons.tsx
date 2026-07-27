import { Cards, Circle, PageWrapper, TitleRow } from 'components/RouteFallback/common'
import Skeleton from 'components/Skeleton'
import { cn } from 'utils/cn'

const PCell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex items-start pt-2', className)}>{children}</div>
)

const PositionRow = () => (
  <div
    className={cn(
      'relative grid grid-rows-[1fr] gap-y-2 bg-background px-7 py-4',
      'after:absolute after:inset-x-7 after:bottom-0 after:h-px after:bg-tableHeader after:content-[""] last:after:hidden',
      'max-[1300px]:!grid-cols-3 max-[1300px]:grid-rows-[1fr_1fr] max-[1300px]:justify-start max-[1300px]:rounded-[20px] max-[1300px]:bg-background/80 max-[1300px]:after:hidden',
      'max-sm:!flex max-sm:flex-col max-sm:gap-y-4 max-sm:rounded-none max-sm:!bg-background/80 max-sm:p-4 max-sm:after:inset-x-4 max-sm:after:block',
    )}
    style={{
      gridTemplateColumns:
        'minmax(260px, 2.6fr) minmax(80px, 0.8fr) minmax(90px, 0.8fr) minmax(100px, 1fr) minmax(120px, 1fr) 24px minmax(150px, 0.4fr) minmax(160px, 1.8fr) minmax(75px, auto)',
    }}
  >
    <div className="flex items-center gap-2 max-[1300px]:col-span-2">
      <div className="flex w-12 items-end gap-0">
        <Skeleton circle width={28} height={28} />
        <div className="-translate-x-2">
          <Skeleton circle width={28} height={28} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={12} />
      </div>
    </div>
    <PCell>
      <Skeleton width={64} height={16} />
    </PCell>
    <PCell>
      <Skeleton width={52} height={16} />
    </PCell>
    <PCell>
      <Skeleton width={56} height={16} />
    </PCell>
    <PCell>
      <Skeleton width={56} height={16} />
    </PCell>
    <div className="max-[1300px]:hidden" />
    <PCell>
      <Skeleton width={72} height={16} />
    </PCell>
    <PCell className="items-center">
      <Skeleton width="90%" height={6} />
    </PCell>
    <PCell className="justify-end gap-2">
      <Skeleton width={32} height={32} />
      <Skeleton width={32} height={32} />
    </PCell>
  </div>
)

// Mirrors PositionBanner: two gradient-bordered cards (BannerContainer) over the dark banner bg. Left card
// = 3 stats + vertical dividers (Total Value / Earned Fees / Total Unclaimed Fees); right card = rewards
// header + Claimed/In-Progress/Claimable + Claim All. Row >1200, column 769–1200 (max-lg), single merged
// card ≤768 (max-sm). Bars use the banner's baseColor (#141d1b) like the page's own BannerSkeleton.
const BannerCard = ({
  children,
  className,
  contentClassName,
}: {
  children: React.ReactNode
  className?: string
  contentClassName?: string
}) => (
  <div
    className={cn(
      'relative w-full overflow-hidden rounded-xl bg-clip-padding p-px',
      'before:absolute before:inset-0 before:p-px before:content-[""]',
      'before:[background:linear-gradient(90deg,rgba(162,89,255,0.6)_0%,rgba(162,89,255,0)_50%,rgba(162,89,255,0.6)_100%),radial-gradient(58.61%_54.58%_at_30.56%_0%,rgba(162,89,255,0.3)_0%,rgba(0,0,0,0)_100%)]',
      'before:[-webkit-mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] before:[mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)]',
      className,
    )}
  >
    <div
      className={cn(
        'relative z-[1] h-full rounded-xl [background:linear-gradient(119.08deg,rgba(20,29,27,1)_-0.89%,rgba(14,14,14,1)_132.3%)]',
        contentClassName,
      )}
    >
      {children}
    </div>
  </div>
)

const BannerBar = ({ width, height, circle }: { width: number; height: number; circle?: boolean }) => (
  <Skeleton width={width} height={height} circle={circle} baseColor="#141d1b" highlightColor="rgba(41,41,41,0.6)" />
)

const VDivider = ({ h = 60 }: { h?: number }) => <div className="w-px shrink-0 bg-tabActive" style={{ height: h }} />

const BannerStat = ({ labelW, valueW = 90, valueH = 28 }: { labelW: number; valueW?: number; valueH?: number }) => (
  <div className="flex flex-col gap-2">
    <BannerBar width={labelW} height={14} />
    <BannerBar width={valueW} height={valueH} />
  </div>
)

const PositionSummary = () => (
  <>
    <div className="flex gap-5 max-lg:flex-col max-sm:hidden">
      <BannerCard className="flex-1" contentClassName="flex flex-wrap items-center gap-[26px] px-8 py-[32.5px]">
        <BannerStat labelW={86} />
        <VDivider />
        <BannerStat labelW={96} />
        <VDivider />
        <BannerStat labelW={168} />
      </BannerCard>
      <BannerCard className="flex-1" contentClassName="flex flex-col gap-2 px-8 py-3.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BannerBar circle width={24} height={24} />
            <BannerBar width={96} height={16} />
          </div>
          <BannerBar width={110} height={28} />
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <BannerStat labelW={56} valueW={80} valueH={24} />
          <VDivider />
          <BannerStat labelW={78} valueW={80} valueH={24} />
          <VDivider />
          <BannerStat labelW={68} valueW={80} valueH={24} />
          <BannerBar width={100} height={40} />
        </div>
      </BannerCard>
    </div>
    {/* ≤768: single merged banner card. */}
    <BannerCard className="sm:hidden" contentClassName="flex flex-col gap-4 p-4">
      {[86, 96, 168].map((w, i) => (
        <div key={i} className="flex items-center justify-between">
          <BannerBar width={w} height={14} />
          <BannerBar width={90} height={24} />
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
        <BannerBar width={96} height={16} />
        <BannerBar width={80} height={24} />
      </div>
      {[56, 78, 68].map((w, i) => (
        <div key={i} className="flex items-center justify-between">
          <BannerBar width={w} height={14} />
          <BannerBar width={80} height={24} />
        </div>
      ))}
      <BannerBar width={100} height={40} />
    </BannerCard>
  </>
)

export const EarnPositionsSkeleton = () => (
  <PageWrapper className="sm:px-12 min-[1921px]:px-6">
    <TitleRow width={256} />

    {/* All Chains pill (left) + Explore Pools button (right) — above the banner. */}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Skeleton width={148} height={36} />
      <Skeleton width={155} height={36} />
    </div>

    <PositionSummary />

    {/* All Protocols + Position Status pills (gap-2, left) + 320px search pill (right). */}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        <Skeleton width={148} height={36} />
        <Skeleton width={152} height={36} />
      </div>
      <Skeleton width={320} height={36} />
    </div>

    {/* Table = 5 rows, NO column header: the real page hides the header while loading (it only renders
        once positions arrive), so the fallback mirrors that data-loading skeleton (PositionListSkeleton). */}
    <div className="overflow-hidden rounded-[20px] bg-background max-[1300px]:flex max-[1300px]:flex-col max-[1300px]:gap-4 max-[1300px]:rounded-none max-[1300px]:bg-transparent max-sm:w-[calc(100%+2rem)] max-sm:self-center">
      {Array.from({ length: 5 }, (_, r) => (
        <PositionRow key={r} />
      ))}
    </div>
  </PageWrapper>
)

export const EarnPositionDetailSkeleton = () => (
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

const OrderGrid = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn('grid items-center gap-4', className)}
    style={{ gridTemplateColumns: '40px 1fr 1.5fr 0.5fr 0.6fr 0.4fr 0.5fr 40px' }}
  >
    {children}
  </div>
)

const OrderTitle = () => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2">
      <div className="flex w-10 items-end gap-0">
        <Circle size={24} />
        <div className="-translate-x-2">
          <Circle size={24} />
        </div>
      </div>
      <Skeleton width={68} height={16} />
      <Skeleton width={54} height={18} />
    </div>
    <div className="flex items-center gap-1 pl-4">
      <Circle size={14} />
      <Skeleton width={56} height={12} />
      <Skeleton width={64} height={18} />
    </div>
  </div>
)

const OrderCondition = () => (
  <div className="flex flex-col gap-2">
    <Skeleton width={132} height={14} />
    <Skeleton width={88} height={14} />
  </div>
)

const OrderReceived = ({ alignEnd }: { alignEnd?: boolean }) => (
  <div className={cn('flex flex-col gap-1', alignEnd ? 'items-end' : 'items-start')}>
    <Skeleton width={84} height={12} />
    <Skeleton width={84} height={12} />
  </div>
)

const OrderMobileCard = () => (
  <div className="flex flex-col gap-3 rounded-xl bg-background p-4">
    <OrderTitle />
    <OrderCondition />
    <div className="flex items-center justify-between">
      <Skeleton width={120} height={14} />
      <Skeleton width={56} height={14} />
    </div>
    <div className="flex items-center justify-between">
      <Skeleton width={100} height={14} />
      <OrderReceived alignEnd />
    </div>
    <div className="flex items-center justify-between">
      <Skeleton width={64} height={14} />
      <Skeleton width={40} height={14} />
    </div>
    <div className="flex items-center justify-between">
      <Skeleton width={60} height={20} />
      <Skeleton width={32} height={32} />
    </div>
  </div>
)

export const SmartExitSkeleton = () => (
  <PageWrapper>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <TitleRow width={210} />
      <Skeleton width={148} height={36} />
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">
        <Skeleton width={148} height={36} />
        <Skeleton width={148} height={36} />
        <Skeleton width={148} height={36} />
      </div>
      <Skeleton width={157} height={38} />
    </div>

    <div className="overflow-hidden rounded-2xl bg-background/80 px-5 pt-4 max-md:hidden">
      <OrderGrid className="h-[78px] items-start border-b border-border pt-4">
        <Skeleton width={16} height={14} />
        <Skeleton width={64} height={14} />
        <Skeleton width={80} height={14} />
        <div className="flex flex-col gap-1.5">
          <Skeleton width={70} height={14} />
          <Skeleton width={50} height={14} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton width={64} height={14} />
          <Skeleton width={48} height={14} />
        </div>
        <Skeleton width={56} height={14} />
        <Skeleton width={50} height={14} />
        <div />
      </OrderGrid>
      <div className="[&>*]:border-b [&>*]:border-border [&>:last-child]:border-b-0">
        {Array.from({ length: 5 }, (_, r) => (
          <OrderGrid key={r} className="py-4">
            <Skeleton width={16} height={14} />
            <OrderTitle />
            <OrderCondition />
            <Skeleton width={56} height={16} />
            <OrderReceived />
            <Skeleton width={40} height={16} />
            <Skeleton width={60} height={20} />
            <Skeleton width={32} height={32} />
          </OrderGrid>
        ))}
      </div>
    </div>

    <div className="flex flex-col gap-4 pt-2 md:hidden">
      {Array.from({ length: 5 }, (_, r) => (
        <OrderMobileCard key={r} />
      ))}
    </div>
  </PageWrapper>
)
