# RouteFallback audit and improvement plan

## Status

Implementation was accepted as complete on 2026-07-28. The checklist below is retained as the historical audit
plan; unchecked items are not active scope and should be re-evaluated against the current page before being
picked up.

## Goal

Keep route-aware skeletons simple while matching the destination page's major geometry, spacing, and responsive
breakpoints. The fallback shown during cold load and lazy-route loading should hand off smoothly to the page
without a noticeable layout jump; detailed content fidelity is intentionally out of scope.

Keep every route fallback self-contained so improving it does not import lazy page modules or their data
dependencies into the main bundle.

## Current behavior

`RouteFallback` is the route-level `Suspense` fallback in `pages/App.tsx`. It reads the current pathname and selects a lightweight skeleton while the destination page chunk is loading.

The same component is also rendered to static markup during prerender and used for route-specific cold-load skeleton fragments. The skeletons are intentionally self-contained so importing them does not pull lazy page modules into the main bundle.

The loading sequence can currently be:

1. Static cold-load UI.
2. A route-aware skeleton from `RouteFallback` while the lazy chunk loads.
3. The page-owned skeleton while page data loads.
4. The loaded page.

Steps 2 and 3 can currently create a visible skeleton-to-skeleton transition when their container geometry,
spacing, responsive layout, or content hierarchy differs. The page-owned skeleton is the visual reference for
improving `RouteFallback`.

## Structure

- `index.tsx` owns pathname matching and selects the appropriate page skeleton.
- `common.tsx` owns small presentational skeleton primitives reused across page files.
- Page skeletons are grouped by route domain; Smart Exit has a dedicated file instead of living under the
  Position entity.
- Earn Pool and Earn Position remain separate entity groups in `EarnPoolSkeletons.tsx` and
  `EarnPositionSkeletons.tsx`; their list skeletons expose the same header/default-list API.
- Small related About and generic content skeletons are grouped in `AboutSkeletons.tsx`.

## Current fallback inventory

### `TradeSkeletons.tsx`

- `SwapPageSkeleton`: `/swap/**`, `/limit/**`, `/cross-chain/**`, `/partner-swap/**`, `/user-swap/**`.

### `EarnPoolSkeletons.tsx`

- `EarnLandingSkeleton`: `/earn`.
- `EarnPoolsSkeleton`: `/earn/pools/**`.

### `EarnPositionSkeletons.tsx`

- `EarnPositionsSkeleton`: `/earn/positions/**`.

### `SmartExitSkeletons.tsx`

- `SmartExitSkeleton`: `/earn/smart-exit/**`.

### `common.tsx`

- `DetailPageSkeleton`: `/pools/:chain/:protocol/:address` and
  `/earn/position/:positionId/:chainId/:exchange`.

### Other Header groups

- `MarketSkeleton` in `MarketSkeleton.tsx`: `/market-overview/**`.
- `AboutKyberSwapSkeleton` and `AboutKncSkeleton` in `AboutSkeletons.tsx`.

Routes without a matching skeleton fall back to the shared logo `Loader`.

## Historical concerns

- `SwapPageSkeleton` approximates three page families that can have different first-loaded layouts.
- Pool Detail and Earn Position Detail currently share the same generic detail approximation and still need to
  be aligned with their actual layouts.
- Several pages already own higher-quality loading skeletons, causing duplicated loading UI with separate implementations.
- Dedicated page skeleton files duplicate grid templates, breakpoints, spacing, and responsive card layouts from lazy page modules and can drift when those pages change.
- Route fallbacks should represent only the major page sections needed to preserve layout stability. Avoid
  detailed controls, text, charts, and other content-level approximations.
- Fallbacks must remain presentational and avoid increasing the main bundle with page code or data dependencies.

## Historical improvement plan

### Phase 1: audit and capture the visual contract

- [ ] Compare `SwapPageSkeleton` with the page-owned skeletons for Swap, Limit Order, and Cross-Chain on desktop and mobile.
- [ ] Compare `DetailPageSkeleton` with the Pool Detail and Earn Position Detail page-owned skeletons.
- [ ] Record each page's container width, primary sections, responsive breakpoints, spacing, and initial loading
      geometry.
- [ ] Check layout shift during the transition from `RouteFallback` to each page-owned skeleton.

### Phase 2: improve the highest-impact route skeletons

- [x] Align the Swap fallback's container, form, right panel, and responsive breakpoint with the current page
      while keeping its internal skeletons simple.
- [ ] Give Limit Order and Cross-Chain dedicated variants when their first-loaded layouts differ materially
      from Swap.
- [x] Match Pool Detail and Earn Position Detail as exact routes before using their shared detail skeleton.
- [ ] Align each detail skeleton with its respective page-owned layout.
- [ ] Match the page-owned skeletons' main geometry and responsive behavior without importing from lazy page
      modules.
- [ ] Preserve route matching order so detail routes cannot be captured by broader list-route prefixes.

Priority route families:

- [ ] Swap.
- [ ] Limit Order.
- [ ] Cross-Chain.
- [ ] Pool Detail.
- [ ] Earn Position Detail.

### Phase 3: improve the dedicated page fallbacks

- [ ] Align Earn Landing, Earn Pools, Earn Positions, and Smart Exit with their current page layouts.
- [ ] Align Market with its current page layout and responsive loading state.
- [ ] Align About KyberSwap and About KNC with their current page layouts.
- [ ] Keep shared presentational primitives only where multiple skeletons genuinely use the same visual
      contract.

### Phase 4: review the remaining runtime-only fallbacks

- [ ] Review Partner Swap and User Swap.

These routes are lower priority than the designated Swap, Detail, Earn, Market, and About pages. Legacy My
Pools intentionally uses the shared `Loader` instead of a maintained route-specific skeleton.

### Phase 5: verify prerender and runtime output

- [ ] Confirm enumerated prerender routes still receive the intended static cold-load content.
- [ ] Confirm `build/skeletons/swap.html` and `build/skeletons/pool.html` contain the improved skeletons used by
      the OG service.
- [ ] Test direct loads, trailing-slash URLs, client navigation, desktop, and mobile breakpoints.
- [ ] Run the prerender build and smoke tests after changing fallback behavior.
- [ ] Recheck the production artifact after deployment; local rendering alone does not validate the serving path.

## Acceptance criteria

- The skeleton communicates the same primary page structure as the destination page.
- Container dimensions, major section heights, spacing, and responsive collapse align with the page-owned
  loading state.
- Internal skeleton content stays deliberately simple and only exists where needed to preserve section geometry.
- Skeleton layout spacing uses flex/grid `gap`; avoid element-specific margin utilities.
- Do not store class names in constants; extract a presentational component when a layout contract is reused.
- The transition from static preload to `RouteFallback` and then to the page-owned skeleton has no obvious
  geometry jump at supported breakpoints.
- Skeletons remain self-contained and do not import lazy page modules, data hooks, wallet state, or translations.
- The page-owned skeleton remains the source of truth when the page layout changes.
