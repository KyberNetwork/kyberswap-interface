# RouteFallback audit and improvement plan

## Goal

Keep `RouteFallback` focused on the short lazy-route loading window without showing a lower-quality page approximation before a page's own loading skeleton. Prefer the skeleton owned by the real page whenever it already matches the final layout accurately.

## Current behavior

`RouteFallback` is the route-level `Suspense` fallback in `pages/App.tsx`. It reads the current pathname and selects a lightweight skeleton while the destination page chunk is loading.

The same component is also rendered to static markup during prerender and used for route-specific cold-load skeleton fragments. The skeletons are intentionally self-contained so importing them does not pull lazy page modules into the main bundle.

The loading sequence can currently be:

1. Static cold-load UI.
2. A route-aware skeleton from `RouteFallback` while the lazy chunk loads.
3. The page-owned skeleton while page data loads.
4. The loaded page.

This is technically valid, but steps 2 and 3 can create a visible skeleton-to-skeleton transition. The transition is undesirable when the page-owned skeleton is more accurate than the approximation in `RouteFallback`.

## Current fallback inventory

### Generic skeletons in `index.tsx`

- `SwapPageSkeleton`: `/swap/**`, `/limit/**`, `/cross-chain/**`.
- `PartnerSwapSkeleton`: `/partner-swap/**`, `/user-swap/**`.
- `DetailPageSkeleton`: `/pools/**`, `/earn/position/**`.
- `TablePageSkeleton`: `/myPools/**`.
- `CampaignSkeleton`: `/campaigns/**`.
- `ContentPageSkeleton`: remaining `/about/**` and `/kyberdao/**` routes.

### Dedicated skeletons in `pageFallbacks.tsx`

- `EarnLandingFallback`: `/earn`.
- `EarnPoolsFallback`: `/earn/pools/**`.
- `EarnPositionsFallback`: `/earn/positions/**`.
- `SmartExitFallback`: `/earn/smart-exit/**`.
- `MarketFallback`: `/market-overview/**`.
- `StakeKncFallback`: `/kyberdao/stake-knc/**`.
- `VoteFallback`: `/kyberdao/vote/**`.
- `KncUtilityFallback`: `/kyberdao/knc-utility/**`.
- `AboutKyberSwapFallback`: `/about/kyberswap/**`.
- `AboutKncFallback`: `/about/knc/**`.

Routes without a matching skeleton fall back to the shared logo `Loader`.

## Current concerns

- `SwapPageSkeleton` approximates three page families that can have different first-loaded layouts.
- `DetailPageSkeleton` is shared by Pool Detail and Earn Position Detail even though their actual layouts and page-owned skeletons differ.
- Several pages already own higher-quality loading skeletons, causing duplicated loading UI with separate implementations.
- Detailed copies in `pageFallbacks.tsx` duplicate grid templates, breakpoints, spacing, and responsive card layouts from lazy page modules and can drift when those pages change.
- Generic campaign and content skeletons cover broad route groups and may not resemble every destination page.
- Improving every fallback to pixel parity increases main-bundle code and ongoing maintenance cost.

## Improvement plan

### Phase 1: audit the highest-impact routes

- [ ] Compare `SwapPageSkeleton` with the page-owned skeletons for Swap, Limit Order, and Cross-Chain on desktop and mobile.
- [ ] Compare `DetailPageSkeleton` with the page-owned skeletons for Pool Detail and Earn Position Detail.
- [ ] Record whether the route fallback is visible long enough to provide value under normal and throttled chunk loading.
- [ ] Check layout shift during the transition from `RouteFallback` to each page-owned skeleton.

### Phase 2: choose an ownership strategy per route

For each route family, choose one of these outcomes:

- [ ] Keep and improve the route skeleton when it materially improves the lazy-chunk loading state.
- [ ] Reduce it to a stable lightweight shell when exact page parity would duplicate too much code.
- [ ] Use the shared `Loader` when the page chunk loads quickly and the page already owns a better skeleton.
- [ ] Extract a small shared presentational skeleton only when it can be reused without importing the lazy page or its data dependencies into the main bundle.

Initial candidates for simplification:

- [ ] `SwapPageSkeleton`.
- [ ] `DetailPageSkeleton`.
- [ ] `CampaignSkeleton`.
- [ ] `ContentPageSkeleton`.
- [ ] `TablePageSkeleton` if My Pools already has an accurate internal skeleton.

### Phase 3: review detailed duplicated fallbacks

- [ ] Audit Earn Pools, Earn Positions, Smart Exit, and Market against their page-owned loading states.
- [ ] Remove duplicated layout details that do not improve the short lazy-chunk transition.
- [ ] Verify KyberDAO and About fallbacks against their current page layouts.
- [ ] Keep route matching order explicit so detail routes cannot be captured by list-route prefixes.

### Phase 4: verify prerender and runtime output

- [ ] Confirm enumerated prerender routes still receive the intended static cold-load content.
- [ ] Confirm `build/skeletons/swap.html` and `build/skeletons/pool.html` match the selected ownership strategy used by the OG service.
- [ ] Test direct loads, trailing-slash URLs, client navigation, desktop, and mobile breakpoints.
- [ ] Run the prerender build and smoke tests after changing fallback behavior.
- [ ] Recheck the production artifact after deployment; local rendering alone does not validate the serving path.

## Decision guideline

Do not target pixel parity in `RouteFallback` by default. Keep a route-aware skeleton only when its short appearance is visibly better than a neutral loader and its layout can remain aligned with the page at low maintenance cost. The page-owned skeleton remains the source of truth for data-loading UI.
