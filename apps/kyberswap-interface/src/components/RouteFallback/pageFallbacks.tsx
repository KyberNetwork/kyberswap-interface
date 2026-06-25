import Skeleton from 'components/Skeleton'
import { cn } from 'utils/cn'

// Detailed page-shell skeletons that mirror each real page's measured layout (container width, padding,
// grid templates, row structure) AND its responsive collapse. Each page's own internal loading skeleton
// switches grid→cards at a specific breakpoint (pools/smart-exit/market at upToMedium=992 → `max-md`;
// positions at 1300 then 768 → `max-[1300px]`/`max-sm`); these fallbacks replicate the SAME breakpoints
// and card markup so they line up with the real content at every width, not just desktop.
//
// Self-contained — grid templates are inlined and nothing is imported from the lazy page modules, so
// these stay in the main bundle without dragging page code in. The default `Skeleton` (light variant) uses
// baseColor=theme.background / highlightColor=theme.buttonGray, identical to the pages' own
// `PositionSkeleton`, so the shimmer tone matches exactly.

const POOLS_GRID = '1.7fr 0.8fr 0.9fr 0.9fr 1fr 1fr 156px 40px'
const POSITIONS_GRID =
  'minmax(260px, 2.6fr) minmax(80px, 0.8fr) minmax(90px, 0.8fr) minmax(100px, 1fr) minmax(120px, 1fr) 24px minmax(150px, 0.4fr) minmax(160px, 1.8fr) minmax(75px, auto)'
const ORDERS_GRID = '40px 1fr 1.5fr 0.5fr 0.6fr 0.4fr 0.5fr 40px'
const MARKET_HEADER_GRID = '1fr 2fr 1.2fr 100px'
// Class-based so it can flip 8-col → 3-col at max-md (992), exactly like the real Market TableRow.
const MARKET_ROW =
  'grid items-center grid-cols-[1fr_0.5fr_0.5fr_0.5fr_0.5fr_0.6fr_0.6fr_100px] max-md:grid-cols-[1fr_1fr_1fr]'

const Circle = ({ size }: { size: number }) => <Skeleton circle width={size} height={size} />

// max-w-[1500px] px-6 pt-8 gap-4 — matches PoolPageWrapper. Positions passes `sm:px-12 min-[1921px]:px-6`
// to mirror PositionPageWrapper's wider desktop gutters.
const PageWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      'flex w-full max-w-[1500px] flex-col gap-4 px-6 pb-16 pt-8 max-sm:px-4 max-sm:pb-[100px] max-sm:pt-6',
      className,
    )}
  >
    {children}
  </div>
)

const Cell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex min-w-0 flex-col justify-center gap-1 px-3 py-2', className)}>{children}</div>
)

const Right = ({ width, height = 16, className }: { width: number; height?: number; className?: string }) => (
  <div className={cn('flex items-center justify-end px-3', className)}>
    <Skeleton width={width} height={height} />
  </div>
)

// Two overlapping token logos + symbol + fee tag over a dex row — the shared "pair" cell on Earn tables.
const PairCell = () => (
  <Cell>
    <div className="flex items-center gap-2">
      <div className="flex items-end">
        <Circle size={24} />
        <div className="-ml-2">
          <Circle size={24} />
        </div>
      </div>
      <Skeleton width={88} height={16} />
      <Skeleton width={34} height={16} borderRadius={999} />
    </div>
    <div className="flex items-center gap-1">
      <Circle size={16} />
      <Skeleton width={64} height={12} />
    </div>
  </Cell>
)

const TableShell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('overflow-hidden rounded-2xl bg-background/80', className)}>{children}</div>
)

// Back control + page title. The real back control is a thin ~20px arrow icon (IconArrowLeft / a
// transparent-bg BackButton), NOT a filled circle — approximate it with a small rounded square. `rowH`
// reserves the real title-row height (36px on pools/positions/smart-exit — set by a size-9 BackButton,
// the text-[24px] title, or the 36px right-hand button) so the loaded page doesn't shift down when it
// replaces the skeleton.
const TitleRow = ({ width, rowH = 36 }: { width: number; rowH?: number }) => (
  <div className="flex items-center gap-4" style={{ height: rowH }}>
    <Skeleton width={24} height={24} borderRadius={8} />
    <Skeleton width={width} height={32} />
  </div>
)

// ─── Earn · Pools ────────────────────────────────────────────────────────────────────────────────────
// Mobile pool card — mirrors PoolListSkeleton's MobileCardSkeleton: a bg-background card with a header
// (token pair · fee · dex · favorite) over a stacked list of label/value rows + a sparkline placeholder.
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
          <div className="flex items-end">
            <Circle size={24} />
            <div className="-ml-2">
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

export const EarnPoolsFallback = () => (
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
          <Skeleton key={i} width={w} height={42} borderRadius={12} />
        ))}
      </div>
      <Skeleton width={148} height={36} borderRadius={12} />
    </div>
    {/* Chain / protocol / interval pills (gap-4) + 320px search pill + Create Pool button (h-32, r-16). */}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-4">
        <Skeleton width={148} height={36} borderRadius={999} />
        <Skeleton width={148} height={36} borderRadius={999} />
        <Skeleton width={78} height={36} borderRadius={999} />
      </div>
      <div className="flex gap-3">
        <Skeleton width={320} height={36} borderRadius={999} />
        <Skeleton width={133} height={32} borderRadius={16} />
      </div>
    </div>

    {/* Desktop table (≥993). Header is 60px tall: TableHeader p-3 + inner TableCell py-2 + text-sm line. */}
    <TableShell className="max-md:hidden">
      <div
        className="grid h-[60px] items-center border-b border-tableHeader px-3"
        style={{ gridTemplateColumns: POOLS_GRID }}
      >
        {[44, 40, 36, 36, 56, 64, 72, 0].map((w, i) => (
          <Skeleton key={i} width={w} height={14} />
        ))}
      </div>
      {Array.from({ length: 8 }, (_, r) => (
        <div key={r} className="grid items-center p-3" style={{ gridTemplateColumns: POOLS_GRID }}>
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
            <Skeleton width={120} height={32} borderRadius={8} />
          </Cell>
          <Cell className="!items-center">
            <Skeleton width={16} height={16} />
          </Cell>
        </div>
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

// ─── Earn · Positions ────────────────────────────────────────────────────────────────────────────────
// Mirrors PositionListSkeleton's single reflowing grid: desktop 9-col → tablet 3-col (≤1300) → mobile
// flex cards (≤768). Cell content matches the real skeleton (no labels — same as the page's own loader).
const POSITION_ROW = cn(
  'relative grid grid-rows-[1fr] gap-y-2 bg-background px-7 py-4',
  'after:absolute after:inset-x-7 after:bottom-0 after:h-px after:bg-tableHeader after:content-[""] last:after:hidden',
  'max-[1300px]:mb-4 max-[1300px]:!grid-cols-3 max-[1300px]:grid-rows-[1fr_1fr] max-[1300px]:justify-start max-[1300px]:rounded-[20px] max-[1300px]:bg-background/80 max-[1300px]:after:hidden',
  'max-sm:!flex max-sm:flex-col max-sm:gap-y-4 max-sm:rounded-none max-sm:!bg-background/80 max-sm:p-4 max-sm:after:inset-x-4 max-sm:after:block',
)

const PCell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex items-start pt-2', className)}>{children}</div>
)

const PositionRow = () => (
  <div className={POSITION_ROW} style={{ gridTemplateColumns: POSITIONS_GRID }}>
    <div className="flex items-center gap-2 max-[1300px]:col-span-2">
      <div className="flex items-end">
        <Skeleton circle width={28} height={28} />
        <div className="-ml-2">
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
      <Skeleton width={32} height={32} borderRadius={8} />
      <Skeleton width={32} height={32} borderRadius={8} />
    </PCell>
  </div>
)

// Mirrors PositionBanner: two gradient-bordered cards (BannerContainer) over the dark banner bg. Left card
// = 3 stats + vertical dividers (Total Value / Earned Fees / Total Unclaimed Fees); right card = rewards
// header + Claimed/In-Progress/Claimable + Claim All. Row >1200, column 769–1200 (max-lg), single merged
// card ≤768 (max-sm). Bars use the banner's baseColor (#141d1b) like the page's own BannerSkeleton.
const BANNER_BORDER = cn(
  'relative w-full overflow-hidden rounded-xl bg-clip-padding p-px',
  'before:absolute before:inset-0 before:p-px before:content-[""]',
  'before:[background:linear-gradient(90deg,rgba(162,89,255,0.6)_0%,rgba(162,89,255,0)_50%,rgba(162,89,255,0.6)_100%),radial-gradient(58.61%_54.58%_at_30.56%_0%,rgba(162,89,255,0.3)_0%,rgba(0,0,0,0)_100%)]',
  'before:[-webkit-mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] before:[mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)]',
)
// h-full so the bg fills the flex-stretched border container — otherwise the shorter (rewards) card leaves
// a gap at the bottom that exposes the purple gradient ::before.
const BANNER_BG =
  'relative z-[1] h-full rounded-xl [background:linear-gradient(119.08deg,rgba(20,29,27,1)_-0.89%,rgba(14,14,14,1)_132.3%)]'

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
      <div className={cn(BANNER_BORDER, 'flex-1')}>
        <div className={cn(BANNER_BG, 'flex flex-wrap items-center gap-[26px] px-8 py-[32.5px]')}>
          <BannerStat labelW={86} />
          <VDivider />
          <BannerStat labelW={96} />
          <VDivider />
          <BannerStat labelW={168} />
        </div>
      </div>
      <div className={cn(BANNER_BORDER, 'flex-1')}>
        <div className={cn(BANNER_BG, 'flex flex-col gap-2 px-8 py-3.5')}>
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
        </div>
      </div>
    </div>
    {/* ≤768: single merged banner card. */}
    <div className={cn(BANNER_BORDER, 'sm:hidden')}>
      <div className={cn(BANNER_BG, 'flex flex-col gap-4 p-4')}>
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
      </div>
    </div>
  </>
)

export const EarnPositionsFallback = () => (
  <PageWrapper className="sm:px-12 min-[1921px]:px-6">
    <TitleRow width={256} />

    {/* All Chains pill (left) + Explore Pools button (right) — above the banner. */}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Skeleton width={148} height={36} borderRadius={999} />
      <Skeleton width={155} height={36} borderRadius={12} />
    </div>

    <PositionSummary />

    {/* All Protocols + Position Status pills (gap-2, left) + 320px search pill (right). */}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        <Skeleton width={148} height={36} borderRadius={999} />
        <Skeleton width={152} height={36} borderRadius={999} />
      </div>
      <Skeleton width={320} height={36} borderRadius={999} />
    </div>

    {/* Table = 5 rows, NO column header: the real page hides the header while loading (it only renders
        once positions arrive), so the fallback mirrors that data-loading skeleton (PositionListSkeleton). */}
    <div className="overflow-hidden rounded-[20px] bg-background max-[1300px]:rounded-none max-[1300px]:bg-transparent max-sm:-mx-4">
      {Array.from({ length: 5 }, (_, r) => (
        <PositionRow key={r} />
      ))}
    </div>
  </PageWrapper>
)

// ─── Earn · Smart Exit Orders ────────────────────────────────────────────────────────────────────────
// Shared pieces (mirror SmartExitOrdersSkeleton's TitleSkeleton / ConditionSkeleton / ReceivedSkeleton),
// reused by both the desktop grid row and the mobile card.
const OrderTitle = () => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2">
      <div className="flex items-end">
        <Circle size={24} />
        <div className="-ml-2">
          <Circle size={24} />
        </div>
      </div>
      <Skeleton width={68} height={16} />
      <Skeleton width={54} height={18} />
    </div>
    <div className="ml-4 flex items-center gap-1">
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
  <div className="mb-4 flex flex-col gap-3 rounded-xl bg-background p-4">
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
      <Skeleton width={60} height={20} borderRadius={999} />
      <Skeleton width={32} height={32} borderRadius={12} />
    </div>
  </div>
)

export const SmartExitFallback = () => (
  <PageWrapper>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <TitleRow width={210} />
      <Skeleton width={148} height={36} borderRadius={12} />
    </div>

    {/* Chain / protocol / status pills (gap-2) + Set Up Smart Exit button (h-38, rounded-xl). */}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">
        <Skeleton width={148} height={36} borderRadius={999} />
        <Skeleton width={148} height={36} borderRadius={999} />
        <Skeleton width={148} height={36} borderRadius={999} />
      </div>
      <Skeleton width={157} height={38} borderRadius={12} />
    </div>

    {/* Desktop table (≥993). */}
    <div className="overflow-hidden rounded-2xl bg-background/80 px-5 pt-4 max-md:hidden">
      {/* Header is 78px tall: two columns wrap to 2 lines ("Est. liquidity & earned fee", "Received amount"). */}
      <div
        className="grid h-[78px] items-start gap-4 border-b border-border pt-4"
        style={{ gridTemplateColumns: ORDERS_GRID }}
      >
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
      </div>
      <div className="[&>*]:border-b [&>*]:border-border [&>:last-child]:border-b-0">
        {Array.from({ length: 5 }, (_, r) => (
          <div key={r} className="grid items-center gap-4 py-4" style={{ gridTemplateColumns: ORDERS_GRID }}>
            <Skeleton width={16} height={14} />
            <OrderTitle />
            <OrderCondition />
            <Skeleton width={56} height={16} />
            <OrderReceived />
            <Skeleton width={40} height={16} />
            <Skeleton width={60} height={20} borderRadius={999} />
            <Skeleton width={32} height={32} borderRadius={12} />
          </div>
        ))}
      </div>
    </div>

    {/* Mobile cards (≤992). */}
    <div className="flex flex-col pt-2 md:hidden">
      {Array.from({ length: 5 }, (_, r) => (
        <OrderMobileCard key={r} />
      ))}
    </div>
  </PageWrapper>
)

// ─── Market Overview ─────────────────────────────────────────────────────────────────────────────────
// max-w-[1500px] px-6 gap-5 pt-8. Table card: a 4-col top header + 8-col sub-header on desktop; on mobile
// (≤992) the row grid flips to 3 columns (Name | Buy Price | 24h Change) with a tabs + chain-logos header,
// matching the real Market TableRow's `max-md:grid-cols-[1fr_1fr_1fr]`.
export const MarketFallback = () => (
  <div className="flex w-full max-w-[1500px] flex-col gap-5 px-6 pb-12 pt-8 max-sm:px-4 max-sm:pt-6">
    {/* Title + subtitle. h-9 / py-1 reserve the real 36px + 24px line boxes so nothing below shifts down. */}
    <div>
      <div className="flex h-9 items-center">
        <Skeleton width={200} height={30} />
      </div>
      <div className="mt-2 py-1">
        <Skeleton width="90%" height={16} containerClassName="block" />
      </div>
    </div>

    {/* Category tags (h-38, gap-4) + 320px search pill. */}
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-4">
        {[52, 48, 61, 75, 47, 65, 73].map((w, i) => (
          <Skeleton key={i} width={w} height={38} borderRadius={12} />
        ))}
      </div>
      <Skeleton width={320} height={36} borderRadius={999} />
    </div>

    <div className="overflow-hidden rounded-2xl bg-background/80 p-6 max-md:-mx-4 max-md:p-4">
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
      <div className="grid h-[71px] items-center max-md:hidden" style={{ gridTemplateColumns: MARKET_HEADER_GRID }}>
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
      <div className={cn(MARKET_ROW, 'h-[46px] border-b border-tableHeader max-md:hidden')}>
        <div />
        <Right width={56} height={14} />
        <Right width={40} height={14} />
        <Right width={56} height={14} />
        <Right width={40} height={14} />
        <Right width={70} height={14} />
        <Right width={70} height={14} />
        <div />
      </div>

      {Array.from({ length: 8 }, (_, r) => (
        <div key={r} className={cn(MARKET_ROW, 'py-3')}>
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
        </div>
      ))}
    </div>
  </div>
)

// ─── Earn · Landing ──────────────────────────────────────────────────────────────────────────────────
// Container max-w-[1152px] px-4 py-[60px] (Earn landing): hero title + subtitle + the total-rewards row +
// a 3-card overview grid + two pool-section blocks. Cards collapse to 1 column at ≤768 like the real page.
export const EarnLandingFallback = () => (
  <div className="mx-auto w-full max-w-[1152px] px-4 py-[60px] max-xxs:py-9">
    <div className="flex justify-center">
      <Skeleton width={440} height={40} />
    </div>
    <div className="mx-auto mt-4 flex flex-col items-center gap-2">
      <Skeleton width={760} height={16} />
      <Skeleton width={620} height={16} />
    </div>
    <div className="mt-8 flex flex-wrap items-center justify-center gap-4 max-sm:flex-col">
      <Skeleton width={120} height={18} />
      <Skeleton width={120} height={28} />
      <Skeleton width={170} height={44} borderRadius={999} />
    </div>
    <div className="mt-16 grid grid-cols-3 gap-5 max-sm:grid-cols-1">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} height={366} borderRadius={20} />
      ))}
    </div>
    <div className="mt-16 flex flex-col gap-5">
      <Skeleton height={240} borderRadius={20} />
      <Skeleton height={240} borderRadius={20} />
    </div>
  </div>
)

// ─── KyberDAO · Stake KNC ────────────────────────────────────────────────────────────────────────────
// Two-column (w-[1224px] m-auto pt-[60px] gap-10): left = title + note + action cards; right = KNC
// illustration + Stake/Unstake/Delegate widget + info bar. Collapses to one column ≤1200 (max-lg).
export const StakeKncFallback = () => (
  <div className="m-auto flex w-[1224px] items-start gap-10 px-4 pb-40 pt-[60px] max-lg:w-full max-lg:flex-col max-lg:items-center">
    <div className="flex w-[772px] flex-col gap-4 max-lg:max-w-full max-sm:w-full">
      <div className="flex items-center justify-between">
        <Skeleton width={160} height={28} />
        <Skeleton width={110} height={20} />
      </div>
      <Skeleton width={420} height={16} />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-[20px] border border-border/40 px-4 py-6">
          <Skeleton circle width={40} height={40} />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton width={160} height={16} />
            <Skeleton width={280} height={12} />
          </div>
          <Skeleton width={90} height={36} borderRadius={999} />
        </div>
      ))}
    </div>
    <div className="flex w-[400px] shrink-0 flex-col gap-4 max-lg:w-[412px] max-sm:w-full">
      <Skeleton height={200} borderRadius={20} />
      <div className="flex flex-col gap-4 rounded-[20px] border border-border/40 p-4">
        <div className="flex gap-2">
          {[70, 70, 70].map((w, i) => (
            <Skeleton key={i} width={w} height={28} borderRadius={8} />
          ))}
        </div>
        <Skeleton height={64} borderRadius={12} />
        <Skeleton height={44} borderRadius={12} />
      </div>
      <Skeleton height={48} borderRadius={12} />
    </div>
  </div>
)

// ─── KyberDAO · Vote ─────────────────────────────────────────────────────────────────────────────────
// Single column (w-[1224px] mx-auto py-12): title + KNC price, a row of 3 stat cards, then the KIP list.
export const VoteFallback = () => (
  <div className="mx-auto flex w-[1224px] flex-col gap-3 py-12 max-lg:w-full max-lg:px-4">
    <div className="flex items-center justify-between">
      <Skeleton width={200} height={28} />
      <Skeleton width={110} height={20} />
    </div>
    <div className="mb-3 flex gap-6 max-md:flex-col">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex flex-1 flex-col gap-3 rounded-[20px] bg-buttonGray/70 px-6 py-5">
          <Skeleton width={130} height={14} />
          <Skeleton width={170} height={24} />
        </div>
      ))}
    </div>
    <div className="flex items-center justify-between">
      <Skeleton width={260} height={20} />
      <Skeleton width={220} height={36} borderRadius={12} />
    </div>
    <Skeleton width={60} height={20} />
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="flex items-center justify-between rounded-[20px] bg-background px-5 py-4">
        <Skeleton width={360} height={16} />
        <div className="flex items-center gap-3">
          <Skeleton width={70} height={22} borderRadius={999} />
          <Skeleton circle width={20} height={20} />
        </div>
      </div>
    ))}
  </div>
)

// ─── KyberDAO · KNC Utility ──────────────────────────────────────────────────────────────────────────
// max-w-[1224px] px-12 py-6: title + staked-KNC input (illustration on the right), then two equal columns
// (Gas Refund Program | How to participate). Columns stack ≤992 (max-md).
export const KncUtilityFallback = () => (
  <div className="mx-auto w-full max-w-[1224px] px-12 py-6 max-md:p-4">
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton width={160} height={28} />
        <Skeleton height={48} borderRadius={12} />
        <Skeleton width={520} height={16} />
      </div>
      <div className="max-md:hidden">
        <Skeleton width={220} height={150} borderRadius={20} />
      </div>
    </div>
    <div className="mt-8 flex justify-between gap-12 max-md:flex-col">
      <div className="flex-1 rounded-[20px] bg-buttonGray/40 p-5">
        <div className="flex gap-4">
          {[90, 70, 70].map((w, i) => (
            <Skeleton key={i} width={w} height={16} />
          ))}
        </div>
        <Skeleton width={120} height={36} containerClassName="mt-4 block" />
        <Skeleton width={120} height={36} containerClassName="mt-3 block" />
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton width={150} height={20} />
        <Skeleton width={420} height={14} />
        <Skeleton width={380} height={14} />
        <Skeleton height={120} borderRadius={12} />
      </div>
    </div>
  </div>
)

// ─── About · KyberSwap ───────────────────────────────────────────────────────────────────────────────
// Centered marketing hero (measured: max-w-[1228px] px-3). Title is 1 line at 48px ≥769 (`sm`) and 2 lines
// at 28px below; 17 supported-chain logos (size-9 / gap-5); subtitle, a 216×42 Swap Now button, and two
// trading-volume stat cards (row, ~442 each within a centered 900px block).
export const AboutKyberSwapFallback = () => (
  <div className="mx-auto flex w-full max-w-[1228px] flex-col items-center px-3 py-40 max-sm:py-[100px]">
    <div className="hidden sm:block">
      <Skeleton width={700} height={44} />
    </div>
    <div className="flex flex-col items-center gap-2 sm:hidden">
      <Skeleton width={300} height={26} />
      <Skeleton width={220} height={26} />
    </div>

    <div className="mt-8 flex max-w-[1000px] flex-wrap justify-center gap-5">
      {Array.from({ length: 17 }, (_, i) => (
        <Skeleton key={i} circle width={36} height={36} />
      ))}
    </div>

    <div className="mt-8 hidden flex-col items-center gap-2 sm:flex">
      <Skeleton width={700} height={16} />
      <Skeleton width={560} height={16} />
    </div>
    <div className="mt-8 flex flex-col items-center gap-2 sm:hidden">
      {[300, 300, 290, 200].map((w, i) => (
        <Skeleton key={i} width={w} height={13} />
      ))}
    </div>

    <Skeleton width={216} height={42} borderRadius={32} containerClassName="mt-8 block" />

    <div className="mt-10 flex w-full max-w-[900px] gap-4">
      <Skeleton height={102} borderRadius={16} containerClassName="flex-1" />
      <Skeleton height={102} borderRadius={16} containerClassName="flex-1" />
    </div>
  </div>
)

// ─── About · KNC ─────────────────────────────────────────────────────────────────────────────────────
// Centered hero (measured: max-w-[1228px] px-3). Title 1 line at 48px ≥769 (`sm`) / 2 lines at 28px below;
// subtitle (2 lines ≥769 at 20px / 4 lines below at 16px); 8 network logos; a "Token Utility" section
// label + heading (36px ≥769 / 28px below); then two utility cards.
export const AboutKncFallback = () => (
  <div className="mx-auto flex w-full max-w-[1228px] flex-col items-center px-3 py-40 max-sm:py-[100px]">
    <div className="hidden sm:block">
      <Skeleton width={640} height={44} />
    </div>
    <div className="flex flex-col items-center gap-2 sm:hidden">
      <Skeleton width={300} height={26} />
      <Skeleton width={240} height={26} />
    </div>

    <div className="mt-6 hidden flex-col items-center gap-2 sm:flex">
      <Skeleton width={700} height={18} />
      <Skeleton width={580} height={18} />
    </div>
    <div className="mt-6 flex flex-col items-center gap-2 sm:hidden">
      {[320, 300, 300, 200].map((w, i) => (
        <Skeleton key={i} width={w} height={13} />
      ))}
    </div>

    <div className="mt-6 flex max-w-[600px] flex-wrap justify-center gap-5">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} circle width={36} height={36} />
      ))}
    </div>

    <Skeleton width={120} height={20} containerClassName="mt-12 block" />
    <div className="mt-3 hidden sm:block">
      <Skeleton width={398} height={32} />
    </div>
    <div className="mt-3 sm:hidden">
      <Skeleton width={280} height={26} />
    </div>

    <div className="mt-8 grid w-full grid-cols-2 gap-5 max-sm:grid-cols-1">
      <Skeleton height={160} borderRadius={16} />
      <Skeleton height={160} borderRadius={16} />
    </div>
  </div>
)
