import { useLocation } from 'react-router-dom'

import Loader from 'components/LocalLoader'
import {
  AboutKncFallback,
  AboutKyberSwapFallback,
  EarnLandingFallback,
  EarnPoolsFallback,
  EarnPositionsFallback,
  KncUtilityFallback,
  MarketFallback,
  SmartExitFallback,
  StakeKncFallback,
  VoteFallback,
} from 'components/RouteFallback/pageFallbacks'
import Skeleton from 'components/Skeleton'
import { APP_PATHS } from 'constants/index'

// Lightweight, main-bundle page-shell skeletons shown while a route's lazy chunk downloads. They can't
// reuse a page's own (lazy) internal skeleton — that lives in the chunk being loaded — so they are
// standalone archetype approximations. Keep them self-contained (no imports from page modules) so they
// don't drag page code into the main bundle and defeat code-splitting.

const Chips = ({ count }: { count: number }) => (
  <div className="flex flex-wrap gap-3">
    {Array.from({ length: count }, (_, i) => (
      <Skeleton key={i} width={96} height={36} borderRadius={12} />
    ))}
  </div>
)

const Cards = ({ count, height }: { count: number; height: number }) => (
  <div className="flex gap-4 max-sm:flex-col">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex-1">
        <Skeleton height={height} borderRadius={16} />
      </div>
    ))}
  </div>
)

// Two-column swap page (max-w-1440, gap-12): the left column holds the tabs, subtitle and swap widget; the
// right column holds the trending/farming pool cards, the price chart and the route bar. Below lg the right
// column hides and the widget stays capped at 425px centered — mirroring the real
// SwapFormWrapper (`w-full max-w-[425px]`) + Container (`max-lg:items-center`). Fields use plain default
// Skeletons on the page (no bg-background card wrapper) so the whole page's tone matches.
const SwapPageSkeleton = () => (
  <div className="mx-auto w-full max-w-[1440px] px-6 pt-6 max-sm:px-4">
    <div className="flex gap-12 max-lg:flex-col max-lg:items-center max-lg:gap-6">
      <div className="flex w-full max-w-[425px] shrink-0 flex-col gap-4">
        {/* Tabs (Swap | Limit Order | Cross-Chain) on the left; info + settings icons aligned to the right. */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton width={48} height={20} />
            <Skeleton width={90} height={20} />
            <Skeleton width={96} height={20} />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton circle width={20} height={20} />
            <Skeleton circle width={20} height={20} />
          </div>
        </div>
        <Skeleton width={267} height={14} />
        {/* Swap form card — bg-background + rounded-[20px] + p-4, exactly like the real widget. Inner
            field skeletons use the darker buttonBlack base (the real input-field color) so they sit a
            shade below the lighter card, matching the tone of the page's other skeletons. */}
        <div className="rounded-[20px] bg-background p-4">
          <div className="flex flex-col gap-3">
            {/* Input + output fields (h-96), with the swap-direction arrow overlaid on the seam. */}
            <div className="relative flex flex-col gap-2">
              <Skeleton height={96} borderRadius={16} baseColor="var(--ks-buttonBlack)" />
              <Skeleton height={96} borderRadius={16} baseColor="var(--ks-buttonBlack)" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Skeleton circle width={28} height={28} baseColor="var(--ks-buttonBlack)" />
              </div>
            </div>
            {/* Max Slippage line (label + value), left-aligned. */}
            <div className="flex items-center gap-2">
              <Skeleton width={96} height={14} baseColor="var(--ks-buttonBlack)" />
              <Skeleton width={40} height={14} baseColor="var(--ks-buttonBlack)" />
            </div>
            {/* Action button (pill). */}
            <Skeleton height={42} borderRadius={999} baseColor="var(--ks-buttonBlack)" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-5 max-lg:hidden">
        {/* Trending + farming pool cards (h-78) — the farming card is wider (≈2:3). */}
        <div className="flex gap-5">
          <div className="flex-[2]">
            <Skeleton height={78} borderRadius={16} />
          </div>
          <div className="flex-[3]">
            <Skeleton height={78} borderRadius={16} />
          </div>
        </div>
        <Skeleton height={480} borderRadius={12} />
        <Skeleton height={46} borderRadius={12} />
      </div>
    </div>
  </div>
)

// Partner / user embedded swap (`/partner-swap`, `/user-swap/...`) — the iframe-embedded widget partners
// mount. It is a single centered 425px column (tabs + subtitle + form card) with NO right-hand info column:
// PartnerSwap's InfoComponents render nothing until the price chart or trade-routes panel is toggled on,
// which never happens on first paint. The form runs in omniView, so the card leads with the "Choose a chain"
// network selector. Mirrors PartnerSwap's PageWrapper/Container (`justify-center`) + SwapFormWrapper
// (`w-full max-w-[425px]`); the column self-centers because the RouteFallback slot sits in an items-start
// AppWrapper.
const PartnerSwapSkeleton = () => (
  <div className="mx-auto w-full max-w-[1464px] px-9 pt-6 max-sm:px-4 max-sm:py-5">
    <div className="flex justify-center">
      <div className="flex w-full max-w-[425px] shrink-0 flex-col gap-4">
        {/* Header: tabs (Swap | Limit Order | Cross-Chain) on the left, info + settings icons on the right,
            with the one-line subtitle below — grouped gap-2 to match the real Header's Stack. */}
        <div className="flex flex-col gap-2">
          <div className="flex min-h-9 items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton width={48} height={20} />
              <Skeleton width={90} height={20} />
              <Skeleton width={96} height={20} />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton circle width={20} height={20} />
              <Skeleton circle width={20} height={20} />
            </div>
          </div>
          <Skeleton width={260} height={14} />
        </div>
        {/* Swap form card — bg-background + rounded-[20px] + p-4 + soft shadow, like the real AppBodyWrapped.
            Inner field skeletons use the darker buttonBlack base (the real field color) so they read a shade
            below the lighter card. */}
        <div className="rounded-[20px] bg-background p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {/* Network selector row (omniView): "Choose a chain" label + network pill. */}
              <div className="flex items-center justify-between">
                <Skeleton width={92} height={16} baseColor="var(--ks-buttonBlack)" />
                <Skeleton width={132} height={32} borderRadius={999} baseColor="var(--ks-buttonBlack)" />
              </div>
              {/* Input + output fields (h-96), with the swap-direction arrow overlaid on the seam. */}
              <div className="relative flex flex-col gap-2">
                <Skeleton height={96} borderRadius={16} baseColor="var(--ks-buttonBlack)" />
                <Skeleton height={96} borderRadius={16} baseColor="var(--ks-buttonBlack)" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Skeleton circle width={28} height={28} baseColor="var(--ks-buttonBlack)" />
                </div>
              </div>
              {/* Max Slippage line (label + value pill). */}
              <div className="flex items-center gap-2">
                <Skeleton width={90} height={16} baseColor="var(--ks-buttonBlack)" />
                <Skeleton width={48} height={24} borderRadius={999} baseColor="var(--ks-buttonBlack)" />
              </div>
            </div>
            {/* Action button (pill). */}
            <Skeleton height={44} borderRadius={999} baseColor="var(--ks-buttonBlack)" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

const TablePageSkeleton = () => (
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

const DetailPageSkeleton = () => (
  <div className="flex w-full max-w-[1224px] flex-col gap-5 px-6 pt-6 max-sm:px-4">
    <div className="flex items-center gap-2">
      <Skeleton circle width={32} height={32} />
      <Skeleton circle width={28} height={28} />
      <Skeleton circle width={28} height={28} />
      <Skeleton width={160} height={24} />
      <Skeleton width={60} height={22} borderRadius={999} />
    </div>
    <Cards count={4} height={72} />
    <div className="flex gap-5 max-lg:flex-col">
      <div className="flex-1">
        <Skeleton height={380} borderRadius={20} />
      </div>
      <div className="w-[400px] max-lg:w-full">
        <Skeleton height={380} borderRadius={20} />
      </div>
    </div>
  </div>
)

// Mirrors Campaign's <Wrapper> (mx-auto max-w-screen-md p-4): banner + title/stat row + tabs + leaderboard.
const CampaignSkeleton = () => (
  <div className="mx-auto w-full max-w-screen-md p-4">
    <Skeleton height={180} borderRadius={12} />
    <div className="mt-6 flex items-center justify-between gap-4">
      <Skeleton width={240} height={28} />
      <Skeleton width={130} height={48} borderRadius={16} />
    </div>
    <div className="mt-4 flex flex-wrap gap-3">
      {[100, 100, 100].map((w, i) => (
        <Skeleton key={i} width={w} height={36} borderRadius={999} />
      ))}
    </div>
    <div className="mt-4 rounded-2xl bg-background p-5">
      <div className="flex gap-5 border-b border-tableHeader/50 pb-4">
        <Skeleton width={40} height={14} />
        <div className="flex-1">
          <Skeleton width={70} height={14} />
        </div>
        <Skeleton width={60} height={14} />
        <Skeleton width={60} height={14} />
      </div>
      {Array.from({ length: 8 }, (_, r) => (
        <div key={r} className="flex items-center gap-5 py-4">
          <Skeleton width={28} height={16} />
          <div className="flex-1">
            <Skeleton width={200} height={16} />
          </div>
          <Skeleton width={56} height={16} />
          <Skeleton width={56} height={16} />
        </div>
      ))}
    </div>
  </div>
)

const ContentPageSkeleton = () => (
  <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-6 px-6 py-12 max-sm:px-4">
    <Skeleton width={480} height={40} />
    <div className="flex flex-col items-center gap-3">
      <Skeleton width={680} height={16} />
      <Skeleton width={600} height={16} />
      <Skeleton width={520} height={16} />
    </div>
    <div className="mt-6 grid w-full grid-cols-3 gap-5 max-sm:grid-cols-1">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} height={200} borderRadius={16} />
      ))}
    </div>
  </div>
)

const startsWithAny = (pathname: string, prefixes: string[]) => prefixes.some(p => pathname.startsWith(p))

/**
 * Route-aware Suspense fallback: picks a page-shell skeleton matching the destination route while its
 * lazy chunk loads, instead of one global centered logo. Falls back to the logo loader for routes
 * without a tailored archetype.
 */
const pickSkeleton = (rawPathname: string) => {
  // Tolerate a trailing slash: a slashed cold load gives React Router `/earn/`, and the exact-match route
  // below (`=== APP_PATHS.EARN`) would otherwise fall through to the logo Loader — so the prerendered
  // overlay (EarnLandingFallback, built from `/earn`) would jump to the logo on mount. The startsWith
  // routes already tolerate the slash; normalizing here keeps every archetype consistent.
  const pathname = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, '') : rawPathname
  // Partner / user embedded swap — a single centered widget, no right info column. Checked before the swap
  // group below; `/partner-swap` and `/user-swap` are distinct prefixes from `/swap`, so order is for clarity.
  if (startsWithAny(pathname, [APP_PATHS.PARTNER_SWAP, APP_PATHS.USER_SWAP])) {
    return <PartnerSwapSkeleton />
  }

  // Swap-style widget pages.
  if (startsWithAny(pathname, [APP_PATHS.SWAP, APP_PATHS.LIMIT, APP_PATHS.CROSS_CHAIN])) {
    return <SwapPageSkeleton />
  }

  // Detail pages — pool detail (`/pools/...`) and position detail (`/earn/position/...`, singular).
  // Checked before the table archetype so the positions *list* (`/earn/positions`) still gets a table.
  if (startsWithAny(pathname, ['/pools/', '/earn/position/'])) {
    return <DetailPageSkeleton />
  }

  if (pathname === APP_PATHS.EARN) {
    return <EarnLandingFallback />
  }

  // Pages with dedicated, layout-faithful fallbacks.
  if (pathname.startsWith(APP_PATHS.EARN_POOLS)) {
    return <EarnPoolsFallback />
  }
  if (pathname.startsWith(APP_PATHS.EARN_POSITIONS)) {
    return <EarnPositionsFallback />
  }
  if (pathname.startsWith(APP_PATHS.EARN_SMART_EXIT)) {
    return <SmartExitFallback />
  }
  if (pathname.startsWith(APP_PATHS.MARKET_OVERVIEW)) {
    return <MarketFallback />
  }

  if (pathname.startsWith(APP_PATHS.MY_POOLS)) {
    return <TablePageSkeleton />
  }

  if (pathname.startsWith('/campaigns/')) {
    return <CampaignSkeleton />
  }

  // KyberDAO + About sub-pages with tailored top-of-page skeletons (checked before the generic catch).
  if (pathname.startsWith(APP_PATHS.KYBERDAO_STAKE)) {
    return <StakeKncFallback />
  }
  if (pathname.startsWith(APP_PATHS.KYBERDAO_VOTE)) {
    return <VoteFallback />
  }
  if (pathname.startsWith(APP_PATHS.KYBERDAO_KNC_UTILITY)) {
    return <KncUtilityFallback />
  }
  if (pathname.startsWith(`${APP_PATHS.ABOUT}/kyberswap`)) {
    return <AboutKyberSwapFallback />
  }
  if (pathname.startsWith(`${APP_PATHS.ABOUT}/knc`)) {
    return <AboutKncFallback />
  }

  if (startsWithAny(pathname, [APP_PATHS.ABOUT, APP_PATHS.KYBERDAO])) {
    return <ContentPageSkeleton />
  }

  return <Loader />
}

const RouteFallback = () => {
  const { pathname } = useLocation()

  // The real pages render inside App's BodyWrapper (w-full, flex-1, items-center). The Suspense fallback replaces
  // those children, so it sits directly under AppWrapper (items-start) and would otherwise left-align/fail to fill.
  return <div className="relative z-[1] flex w-full flex-1 flex-col items-center">{pickSkeleton(pathname)}</div>
}

export default RouteFallback
