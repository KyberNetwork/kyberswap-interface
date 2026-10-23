# Unified Swap refactor TODO

Created: 2026-10-23. Aligned with the updated `refactor-code-ownership` skill,
the primary standard for this refactor, including its test-maintenance policy.
Unchecked items are planned work, not confirmed runtime bugs. Recheck the current
source and shared callers before implementing each section.

Paths below are relative to `apps/kyberswap-interface/src/`.

## Scope and constraints

- This checklist covers implementation, source audit and automated code checks.
- Improve state/logic ownership and polish UI, with preserving existing behavior as the first priority.
  Keep user flows, pair URLs, quote/approval/execution rules and shared-caller behavior intact.
  UI polish may refine spacing, alignment and presentation while preserving accepted interactions.
- Do not treat an ownership cleanup as permission to change business behavior. If existing behavior
  appears genuinely problematic, document it after the affected batch for separate evaluation rather
  than silently changing it. Distinguish a confirmed issue from a suspected issue needing verification.
  Any regression introduced by the refactor must be fixed in that batch, not deferred as an old issue.
- Keep the two History feature TODOs in [README.md](./README.md) separate from this refactor.
- Do not reintroduce the removed Cross-Chain tab, Review route chart, pool/leg drilldown,
  Fastest/reliability work, expanded fee breakdown, new analytics contract or rollout controls.
- Preserve existing tracking events while reorganizing code; do not add product requirements.
- Preserve unrelated changes and staged boundaries. Do not stage, commit or push as part of this checklist.
- Aim for cohesive files around 200 lines; review files exceeding 300–400 lines for meaningful boundaries.
  Keep feature folders shallow and follow nearby naming/import conventions. Extract for clear responsibility,
  lifecycle or actual reuse; keep small related components together. Do not split solely to reach a line
  count or create forwarding-only modules, unnecessary barrels or hook/context layers to hide props.
- Use named const-arrow components/hooks, flat props, nearby prop types and intent callbacks.
  Do not introduce `forwardRef` or `displayName`; preserve actual DOM-ref contracts through an explicit
  ref prop or React 19's supported `ref`. Render JSX directly or through module-level components.
- Arrange related logic in reading/dependency order and separate coherent groups or distinct handler
  steps with blank lines. Avoid long uninterrupted blocks without spacing every statement individually.
- Keep classes in JSX with `cn()`, not className constants, helpers or maps. Reuse a component for repeated
  styled markup. Shared components own typography, padding and internal geometry; callers own placement,
  available width and sibling gaps. Use repo tokens and reserve inline styles for runtime/library needs.
- Use parent-owned flex gaps/alignment; avoid all margins, including auto/negative margins and `space-x/y`,
  empty spacers or padding that disguises sibling spacing. Keep control size, padding and border width
  stable across hover, focus, loading and disabled states, preserving keyboard and native semantics.

## Test policy

Run relevant existing tests and prefer extending their coverage. Add cases only for meaningful business
rules, behavioral contracts or regression risks whose long-term value justifies their maintenance cost.
Keep setup and cases concise; avoid duplicate coverage, trivial extraction/style assertions and tests
coupled to implementation details. A new file/component or a verification item below does not by itself
require a new test. Choose checks by the behavior at risk, not a test-count or per-file coverage target.

## Skeleton policy for UI refactors

After polishing each UI section, check its existing skeleton/loading fallback and update
any height or vertical-spacing mismatch in the same batch. Match row/section height,
padding, gaps and responsive wrapping to avoid loading-to-content layout shift.
A line with several components can use one skeleton for the whole line; do not reproduce
every div/icon/control. Do not clip real content to force variable-length results into a
fixed skeleton height.

## 1. Single-chain route graph — first priority

Files: `components/TradeRouting/RouteGraphView.tsx`, `routeGraph.ts`, `routePaths.ts`,
`routeGeometry.ts`, `useRouteGraphLayout.ts`, `index.tsx`, `helpers.ts`.

- [x] Extract pure graph preparation: token nodes, edges, levels, split percentages and path inputs.
- [x] Extract SVG path/label geometry from JSX into typed pure functions.
- [x] Keep DOM measurement, scroll/resize subscriptions and cleanup under one layout owner.
- [x] Replace scroll-driven `forceUpdate()` and `key={node.address + force}` remounting with
      stable node identity and explicit measurement updates.
- [x] Replace the raw `setNodeRects` prop with a measurement callback owned by the layout layer.
- [x] Resolve DEX metadata using the route/token chain; remove the node renderer's implicit wallet-chain dependency.
- [x] Resolve shared DEX metadata at the appropriate route owner instead of subscribing in every card where unnecessary.
- [x] Normalize V2, V3 and cross-chain routes into one graph model and shared SVG renderer;
      keep provider interpretation at the data boundary and measurement/scrolling in one layout hook.
- [x] Replace `renderTokenInfo()` and local `swapContent` JSX with direct JSX or module-level components.
- [x] Separate pure route/DEX helpers from DOM scrolling hooks currently mixed in `helpers.ts`.
- [x] Preserve cycle protection, zero/thin percentage handling, pool links and custom-chain consumers.

- [x] After route UI polish, update its skeleton if token rows/cards no longer match loaded heights; use simple whole-line placeholders, not per-node internals.

Done when: graph calculations are independent of React, scrolling does not remount nodes,
and route metadata follows the route chain. Verify direct, multi-hop, split and cyclic graph cases.

## 2. Route layout and skeleton — together with section 1

Files: `components/TradeRouting/styled.tsx`, `RouteGraphView.tsx`,
`pages/Swap/components/TradeRoutePanel.tsx`, `SingleChainTradeRoute.tsx`, `CrossChainTradeRoute.tsx`.

- [x] Inventory pair-row, card, pool-row and bottom spacing for V2, V3 and cross-chain routes.
- [x] Use one card/pool layout and skeleton baseline for all three route types; allow content to grow naturally.
- [x] Replace `m-auto`, `mt-*`, `my-*`, `ml-*`, `mx-*` and icon/text margin selectors with parent gap/alignment.
- [x] Remove empty spacer elements from the skeleton; let its layout reserve the intended columns directly.
- [x] Match skeleton row/section heights to the corresponding loaded layout, including V3; do not duplicate its full card/body DOM.
- [x] Implement shared responsive overflow, connector measurement and horizontal scrolling;
      retain manual collapse and open Unified Swap routes by default.
- [x] Replace `smartSettlementTooltip` JSX storage and `tokenLabel()` rendering with direct JSX or local components.
- [x] Align shared route controls with the updated skill: plain components with working refs, inline `cn()`
      and one `RoutePool` owner for repeated link/label styling inside the shared renderer.
- [x] Remove superseded V2/V3 renderers, CSS connectors and per-row scroll hooks.

- [x] Complete the component/caller source audit listed in batch 1 acceptance checks; see the code-only audit and behavior findings below.
- [x] Compare skeleton and loaded layout declarations in source: row/card heights, padding, gaps
      and responsive classes. Keep a simple placeholder per content line and allow variable content to grow.

Done when: loading and loaded layout declarations use consistent fixed row heights,
padding, gaps and responsive rules.
Do not promise identical total height for arbitrary routes with different numbers of nodes/pools.

## 3. Single-chain review/execution ownership — batch 2

Files: `components/SwapForm/SingleChain/SingleChainSwap.tsx`,
`SwapActionButton/index.tsx`, `SwapActionButton/SwapOnlyButton.tsx`,
`SwapModal/index.tsx`, `hooks/useBuildRoute.tsx`, `hooks/useSwapReviewSession.ts`;
inspect `hooks/useSwapCallbackV3.ts` callers.

Status: implementation and source audit complete; static verification recorded below.
Sections 4–5 are separate scopes.

- [x] Define one owner for review session state: build result/loading, submitting, signature, hash, error and dismissal.
- [x] Keep approval/permit orchestration coherent and expose intent callbacks rather than passing `setProcessingSwap` through layers.
- [x] Remove unused `approvalSubmitted` state/effects after checking all references.
- [x] Consolidate duplicated loading/reset synchronization without losing distinct approval/build/submission phases.
- [x] Keep click-triggered operations in handlers; make slippage-driven rebuild ownership explicit and preserve its behavior.
- [x] Give build requests cancellation and stale-result handling for close, reopen, pair changes and unmount.
- [x] Audit session identity for wallet/account, chain, pair, amount, recipient and mode changes;
      check quote pause/resume and slippage changes both during build and after review opens.
- [x] Ensure late completion cannot overwrite a newer review session; retain persistence for transactions already submitted.
- [x] Check repeated confirm, wallet rejection, build failure and retry; preserve tracking and
      transaction persistence even when the originating modal is dismissed or unmounted.
- [x] Preserve router-address authority, permit behavior, native-token allowance exemptions and wrap/unwrap handling.
- [x] Move substantial tracking-payload formatting out of button JSX/orchestration where it improves readability.

Button geometry and existing loading content are unchanged in this batch; no new skeleton is needed.

Done when: review, confirm and dismiss each have one authoritative transition; reopening cannot display
an earlier request's result. Prioritize stale-session isolation, duplicate submission and submitted-transaction
persistence when selecting lifecycle regression coverage under the test policy above.

## 4. Single-chain confirmation UI

Files: `components/SwapForm/SwapModal/ConfirmSwapModalContent.tsx`,
`SwapDetails/index.tsx`, `SwapBrief.tsx`, `SwapModalAreYouSure.tsx`.

- [ ] Separate quote/build comparison, acceptance thresholds and review validation from rendering.
- [ ] Group balance, reserved Limit Order amount and honeypot acquisition into a coherent review-data boundary.
- [ ] Extract substantial amount/warning and fee/gas/recipient sections without making a file for every row.
- [ ] Replace `renderSwapBrief()`, `renderModalContent()` and amount render helpers with direct JSX/local components.
- [ ] Replace child raw setters for acceptance/confirmation with explicit intent callbacks.
- [ ] Keep slippage/retry/query-parameter mutations with their action owner and preserve current retry behavior.
- [ ] Remove margin/negative-margin layout in the touched modal sections; preserve accepted visual placement.

- [ ] After modal UI polish, update amount/summary/detail skeletons to match row and section heights; use one placeholder per line even when the line has several controls.

Done when: confirmation components display review data and emit actions; build/send lifecycle stays
with section 3's owner. Do not add a route chart to Review.

## 5. Single-chain quote ownership and page composition

Files: `components/SwapForm/SingleChain/SingleChainSwap.tsx`, `SingleChainSwapForm.tsx`,
`hooks/useGetRoute.ts`, `hooks/useRouteRequest.ts`, `pages/Swap/SwapPage.tsx`, `SwapPageContent.tsx`.

Status: quote lifecycle and refresh work below is implemented and source-reviewed.
Shared page/form quote ownership and the unchecked composition work remain pending.

- [ ] Put quote data/loading at the lowest owner shared by form and right panel.
- [ ] Remove effect-based copies of `routeSummary` and route loading into page state once both consumers share that owner.
- [ ] Keep token metadata loading distinct from quote loading and transaction processing.
- [x] Keep existing rate/quote metrics visible during refetch; use skeletons only while
      loading without a quote or at lazy/Suspense boundaries. Refresh feedback stays in the indicator.
- [x] Separate request/fee preparation into `useRouteRequest`, retaining Safe App/partner behavior.
- [x] Use TanStack Query in `useGetRoute` for quote data, loading, request deduplication and polling.
      The current input's query key isolates responses; fee lookup and price enrichment run inside its query function.
      RTK Query provides API transport. Swap enables auto-refresh; Limit Order loads automatically without polling.
      Price Alert loads through `useBaseTradeInfoWithAggregator`; its existing `RefreshButton` owns 10-second polling.
      Input debounce and review pause control query enablement. Explicit refresh callbacks remain available.
      Animation displays fetching state independently of the countdown and no longer controls polling.
      Quotes have no freshness window or inactive retention (`staleTime: 0`, `gcTime: 0`);
      RTK route calls force refetch without subscriptions and retain unused data for zero seconds.
      Cross-chain opens a new stream each refresh. Native fetch route/stream calls use `cache: 'no-store'`.
      Both Unified forms refresh every 10 seconds after completion and retain available metrics during refetch.
      Physical abort is not required for single-chain quote correctness; same-key in-flight deduplication remains.
- [ ] Replace `SwapPageContent` props inferred from entire hook return types with an explicit flat view API.
- [ ] Preserve lazy provider boundaries, pending form interaction and mounted chart state behind History.
- [ ] Keep form modules independent of `pages/Swap`; do not move page-specific UI into a domain hook.

- [ ] After form/page layout polish, update pending-form and route-panel skeleton heights, padding and gaps; keep placeholders simple at line level.

Done when: form and route panel consume the same authoritative quote state without duplicated synchronization.
Verify pair changes, refresh, review pause/resume and shared Partner/embedded Swap callers.

## 6. Currency input and token selector

Files: `components/CurrencyInputPanel/index.tsx`, `components/SwapForm/CurrencyInput/`,
`components/TokenSelectorModal/TokenRow.tsx`, `TokenSelectorContent.tsx`, `OtherChainTokens.tsx`.

- [ ] Separate substantial input controls, token selection and balance presentation from the large CurrencyInputPanel module.
- [ ] Audit actual callers before changing its broad prop API; preserve liquidity, Limit Order, partner and wallet usages.
- [ ] Replace `renderBalance()`, `rowInner`, empty-state JSX variables and similar render helpers with direct JSX/local components.
- [ ] Split substantial TokenRow balance/metric/security/action sections by responsibility.
- [ ] Keep browsing/keyboard state in the modal content and committed selection in the existing selection owner.
- [ ] Preserve wallet/form modes, non-EVM callbacks, import restrictions and one commit/dismiss sequence.
- [ ] Preserve virtualized row identity, sorting animation, scroll and focus across token-info/import overlays.
- [ ] Remove spacing margins in touched input/selector layout; avoid unrelated shared primitive changes.

- [ ] After input/selector UI polish, update token, balance and list-row skeleton heights, including virtualized row sizing; one skeleton can cover a multi-component line.

Done when: input and selector views have readable boundaries without replacing the established selection state machine.

## 7. Price Chart canvas

Files: `components/TokenPriceChart/TokenPriceChartCanvas.tsx`, `index.tsx`, `useTokenPriceChartData.ts`.

- [ ] Extract pure autoscale, formatting, option and tooltip-position calculations into cohesive helpers.
- [ ] Keep chart creation/destruction, resize and library subscriptions with one lifecycle owner.
- [ ] Separate tooltip presentation from chart-library orchestration if needed to keep files cohesive.
- [ ] Preserve cleanup, initial viewport setup, pagination triggers, token/timeframe identity and mounted state behind History.
- [ ] Keep fetching/pagination in the existing data hook; avoid a new competing cache or unnecessary hook layers.

- [ ] After chart UI polish, align the loading chart container and header-row heights with loaded content; the chart area can remain a single placeholder block.

Done when: the canvas component composes chart lifecycle and tooltip UI; library synchronization effects remain explicit.

## 8. History status ownership

Files: `pages/CrossChainSwap/components/TransactionHistoryList.tsx`,
`pages/CrossChainSwap/hooks/useTransactionHistory.ts`, `pages/Swap/components/TransactionHistoryUpdater.tsx`.

- [ ] Move terminal KyberCross `scanTxStatus()` enrichment and dispatch out of `TransactionRecord` into the status owner.
- [ ] Preserve the distinction between processing polling and terminal-status enrichment; define deduplication/retry ownership there.
- [ ] Keep row/card rendering and pagination free of transaction-fetching side effects.
- [ ] Preserve polling while History is closed and when the active swap mode changes.
- [ ] Preserve existing transaction actions, status updates and tracking; keep new detail/single-chain History work separate.

- [ ] If History row/card UI is polished, update existing skeletons to match row/card heights on desktop/mobile; do not mirror each cell child.

Done when: opening, paginating or unmounting list rows does not own transaction status acquisition.
Keep the small `TransactionHistoryUpdater` lazy lifecycle boundary; it is not a redundant wrapper.

## 9. Remaining conventions, settings and cross-chain helpers

- [ ] Convert touched `React.FC`/`function` components and hooks to typed const arrows; place named prop types beside owners.
- [ ] Apply the component, styling and file-structure constraints above to touched modules; preserve actual
      ref consumers and consolidate repeated styled markup without fragmenting the feature.
- [ ] Replace mutually exclusive Settings page booleans with a clear mode API after auditing all callers;
      retain independent display flags and accepted single-chain Settings presets.
- [ ] Clean up the slippage-highlight timeout lifecycle in `components/SwapForm/Settings/SlippageSetting.tsx`.
- [ ] Remove remaining margins and JSX render helpers in touched warnings, MEV, approval and Degen settings.
- [ ] Replace repeated non-EVM token casts/mapping in cross-chain action, confirmation and execution with typed domain helpers.
- [ ] Reuse token/tracking payload helpers where initiation and completion duplicate the same mapping, preserving emitted fields.
- [ ] Preserve current-input quote isolation, cross-chain stream cancellation, reviewed snapshots
      and execution session guards. Do not add manual cancellation/generation machinery to single-chain quote fetching.
- [ ] Do not relocate the entire cross-chain engine/adapters just because the legacy tab was removed.
- [ ] After settings/warning/summary UI polish, update any affected skeleton line and section heights; avoid detailed per-div placeholders.

## Completion checks for each batch

- [ ] Trace affected actions from handler to state owner; check close/reopen, input changes and stale async results.
- [ ] Review affected shared callers and intentional lazy/mount boundaries.
- [ ] Run appropriate formatting, package ESLint/TypeScript and relevant existing tests. Apply the test policy
      above; any added coverage should protect a meaningful behavior with concise, maintainable setup.
- [ ] Review the final tree and diff for accidental behavior changes, fragmentation, forwarding layers,
      raw setter chains, render helpers, `forwardRef`/`displayName`, className indirection and margin patterns.
- [ ] Check component/caller style ownership, stable control dimensions and skeleton/loading alignment
      after UI polish; use whole-line placeholders where sufficient and preserve focus and accessibility.
- [ ] Record checks actually performed, pre-existing failures and any remaining limitation.
- [ ] Summarize ownership/UI changes and confirm which existing behaviors were preserved.
- [ ] Record existing behavior issues discovered during the batch in the notes below, including
      reproduction/evidence, impact, affected files, proposed change and whether behavior was changed.
      Keep unresolved behavior decisions separate from completed refactor work.

Suggested order: 1–2 → 3–5 → 6 → 7 → 8. Apply section 9 during the relevant batch.

## Batch progress — 2026-10-23

### Batch 1: sections 1–2 — implementation and code audit complete

The requested route refactor and latest UI corrections are implemented. The code-only
component/caller audit below is complete.
Earlier checks missed spacing padding and an unnecessary pool minimum height, so this
audit traced source and callers rather than treating lint/types as sufficient evidence.

Current implementation:

- V2, V3 and cross-chain use `RouteGraphView`, one node/edge display model and one
  measurement/scroll lifecycle. Pure geometry lives in `routeGeometry.ts` and
  `routePaths.ts`; provider interpretation stays outside the renderer.
- V2 branch identity, quoted percentages and explorer-link exclusions are retained.
  V3 retains pool grouping, precision and bounded cycle traversal. Cross-chain uses
  provider steps without inventing tokens, amounts or percentages.
- Nodes keep stable identity/focus during scroll and resize. SVG coordinates are
  local to the graph; dense edges receive fallback endpoints. Marker IDs are unique
  per graph. Old renderers, CSS connectors and per-row scroll hooks are removed.
- Components are plain named const arrows with supported React 19 refs. Classes
  stay in JSX; shared `RoutePool` owns pool markup. No extra feature folders were added.
- `RouteContent` owns the endpoint-row/graph gap. `PairRow` and `TokenLink` have no
  spacing padding. `HopCard` uses an 8px gap, pool groups have natural height without
  a minimum, and card/group headings use medium weight.
- Skeletons use two endpoint placeholders and two blocks per card, without pool
  internals: a 20px heading and a 55px two-line / 31px one-line summary block.
  Available graphs remain visible during quote refresh.
- Unified Swap routes open by default, including the cross-chain lazy fallback;
  manual collapse remains available. PartnerSwap's explicit preference is preserved.
  Quote, approval and transaction execution behavior is outside this batch.

Current static geometry (one group/pool, single-line labels):

| Layout      | Pair row | Parent gap | Graph clearance        | Card  | Total |
| ----------- | -------- | ---------- | ---------------------- | ----- | ----- |
| V2 / V3     | 24px     | 12px       | 36px top + 36px bottom | 109px | 217px |
| Cross-chain | 24px     | 12px       | 36px top + 36px bottom | 85px  | 193px |

These are source-derived baselines. Extra nodes, groups,
pools and wrapped content may grow naturally; unknown initial composition cannot
have a guaranteed identical total height. Do not force loaded routes into these sizes.

Verification recorded:

- Latest card/spacing changes: package ESLint, `tsc --noEmit`, scoped formatting and
  diff whitespace checks passed. No new tests added for these styling-only edits.
- Unified renderer run before those styling-only edits: 21 tests passed (9 graph/
  geometry, 2 renderer lifecycle, 10 cross-chain provider mapping).
- Earlier Swap/SwapForm run: 21 passed, 2 pre-existing failures in
  `hooks/useSwapFormPair.test.tsx` clicking the removed `Cross-Chain` tab. The test
  mocks `SwapPage` and does not render the route components; do not restore the tab.

Acceptance checks:

- [x] Audit every touched route component and caller for ownership, spacing semantics,
      unnecessary dimensions/wrappers and loading alignment; inspect intent rather than
      relying on pattern searches or lint. Include shared PartnerSwap usage.

Code-only audit — 2026-10-23, against `5be1ef7d1`:

- Read the shared renderer, graph/geometry/path helpers, layout hook, styling primitives,
  route panel/skeleton, both route views and both right panels. Traced PartnerSwap,
  `useTradeComposition`, DEX metadata, ERC-8056 display amounts and provider step mapping;
  compared behavior with the parent of `977879d90`.
- Graph preparation stays independent of React. `useRouteGraphLayout` owns measurement,
  node registration, resize observation and scheduled-frame cleanup. React 19 forwards
  the card DOM ref; scroll/resize does not change node identity. Graph changes recreate
  the observer and measure the current registered nodes before paint.
- Route-chain DEX/explorer selection, V2 branch identity and pool-link exclusions,
  V3 integer percentages and bounded cycle traversal, and cross-chain provider fallback
  are preserved. Token metadata already comes from `useTradeComposition`; removing the
  old V2 per-card token lookup does not remove the caller's metadata acquisition.
- Expand/collapse stays in `TradeRoutePanel`; the click path calls `onExpand` once only
  when opening. PartnerSwap still supplies its chart-based collapse preference and
  route-chain currencies. Unified routes open by default as requested. Lazy provider
  boundaries remain, and existing route data stays visible during refresh.
- Shared cards/pools own internal geometry; parents own gaps. The source-level one-pool
  skeleton baseline matches the declared row heights and padding. Variable routes can
  grow. `routeGeometry.ts` remains a cohesive pure geometry module despite exceeding
  300 lines; no extra forwarding modules or lifecycle owners are needed.
- No new refactor regression was confirmed in this audit. A pre-existing indirect-path
  endpoint defect was reproduced with pure geometry and recorded below. Both it and
  the known all-zero V3 division were initially preserved during the audit, then fixed
  in the user-requested follow-up described below.
- Reran 21 tests across 3 suites (9 graph/geometry, 2 renderer lifecycle, 10 provider
  mapping), package `tsc --noEmit`, scoped ESLint and Prettier: all passed. The endpoint
  reproduction was an in-memory calculation.

The follow-up below addresses the two pre-existing route-display defects found during
the audit. Section 3 status is recorded below; sections 4–9 remain pending except
explicitly checked items. Preserve the current index; staging is not evidence that
a batch is accepted.

### Batch 2: review/execution ownership — implementation complete

Scope: section 3. Confirmation content and page-level quote sharing remain pending
in sections 4–5.

- [x] Centralize build/review/preparation/signature/submitted/error phases and dismissal
      in `useSwapReviewSession`, with guards against duplicate actions and stale completions.
- [x] Invalidate Review on wallet, chain, token, amount, recipient or mode changes.
      Rebuild on slippage changes during build/Review; preserve signing/submitted work.
- [x] Keep build cancellation in the review session and connect it to `useBuildRoute`.
- [x] Guard approval/permit operations and keep Review mounted when form gates change.
- [x] Use the build API's router/calldata for execution and persist submitted transactions
      independently of modal lifetime. Preserve tracking through `swapTracking.ts`.
- [x] Audit Unified/embedded forms, PartnerSwap, price-impact actions, suggested-slippage
      retry, permit-error dismissal and transaction persistence.

### Quote/refresh — implementation complete

Scope: completed quote lifecycle items in section 5. Shared page/form quote ownership
and the unchecked page composition items remain pending.

- [x] Let TanStack Query own single-chain data/loading/polling; prepare request identity,
      fee lookup and price enrichment in `useRouteRequest`, with RTK as API transport.
- [x] Isolate responses by current inputs, including debounce, source/client changes,
      review pause/resume and mode unmount/remount.
- [x] Force fresh route calls and disable inactive retention; preserve provider USD
      values in `KyberSwapAdapter` for execution build.
- [x] Keep cross-chain stream fetching under `useCrossChainQuote`.
- [x] Keep available metrics visible during refetch and drive the indicator from fetching state.
- [x] Check Limit Order, Price Alert, Unified/embedded form and PartnerSwap callers.

Decisions:

- Quotes have no freshness window or inactive retention: TanStack `staleTime: 0`,
  `gcTime: 0`; RTK `keepUnusedDataFor: 0`, `subscribe: false`, `forceRefetch: true`.
  Native fetch route/stream calls use `cache: 'no-store'`. Same-key in-flight
  deduplication is allowed; quote correctness does not require physical abort.
- Both Unified forms refresh 10 seconds after completion, throttle manual refresh
  for 2 seconds and pause automatic refresh during Review.
- Retain current quote metrics during refetch; show skeletons when loading without
  the current quote/value. Keep reviewed snapshots separate from live quote updates.
- Limit Order rate comparison does not poll. Price Alert uses `useBaseTradeInfoWithAggregator`
  and its `RefreshButton` owns a separate 10-second refresh timer.
- Keep build cancellation and execution session guards; do not add manual session
  machinery to single-chain quote fetching.

Validation status for batch 2 and quote/refresh:

- [x] 76 tests across 7 suites: 8 review lifecycle, 11 single-chain quote,
      3 cross-chain quote, 4 summary, 1 KyberSwap adapter, 25 adapter/stream,
      and 24 native ERC-20 tests.
- [x] TypeScript, ESLint and Prettier on 29 changed TypeScript files, and whitespace checks.

## Behavior issues for evaluation after each batch

### Quote behavior — deferred by decision

- **Price enrichment failure:** the existing error path returns the original response
  without `rawAmountInUsd` / `rawAmountOutUsd`, while single-chain build reads those
  fields.
- **Single-chain quote timeout:** there is no explicit overall timeout covering route
  retrieval and price enrichment; a pending request can keep the query fetching.

Decision: leave both behaviors unchanged in this refactor. Address them only in a
separately scoped change; they do not block completion of this batch.

### Batch 1 findings — current disposition

Follow-up — 2026-10-23: the user requested improvements to both reported defects.
The fixes below affect route display only. All 25 tests across the 3 route/provider
suites, package TypeScript, scoped ESLint, formatting and whitespace checks passed.

- **Indirect edge misses its target (fixed in the audit follow-up):**
  when an intermediate card blocked the direct path but part of the target's vertical
  edge remained available, `routePaths.ts` replaced the actual attachment `targetY`
  with the detour's `translateY`. The resulting path could stop outside the target card.
  Reproduction graph: input → B, B → C/D, C → D/E, D/E → F; levels 0/1/2/3/4.
  With 168px-wide cards B at (48, 102.5), height 109; C at (264, 82.5), height 149;
  D at (480, 36), height 109; E at (480, 169), height 109; F at (696, 102.5),
  height 109; and a 912×314 SVG, B → D ends at (480, 261.5), outside D's y=36–145.
  Impact: an indirect connector can misleadingly miss the pool/token it represents;
  quote and execution data are unaffected. The same target-coordinate overwrite exists
  in `TradeRouteV3.tsx` before `977879d90`; this is not a newly introduced regression.
  Fix: retain the detour waypoint and keep the final target attachment immutable.
  Existing geometry coverage now includes the reproduction and its vertical mirror,
  with a non-zero viewport offset; both previously failed and now reach the target edge.
- **All-zero V3 groups (fixed in the audit follow-up):** percentage division previously
  used a bigint denominator without a zero guard. A group containing only
  `swapAmount: "0"` could throw division-by-zero, even alongside a positive-total branch.
  Display policy: retain the group and pools, and return 0% for branch/pool ratios with
  a zero denominator. Positive-total integer precision and existing terminal labels
  remain unchanged. Two regression cases cover an entirely zero source and a zero
  pool group alongside a positive branch; both previously threw and now pass.
- **Indirect connector coordinates (addressed in the unified renderer):** geometry
  converts measured rectangles to SVG-local coordinates once, and identifies top/bottom
  attachment against the source rectangle. Offset-invariance regression coverage passes.
- **Dense indirect routes (addressed in the unified renderer):** when spaced perimeter
  points run out, remaining edges use distributed points on the source's right edge.
  Regression coverage checks that every measured edge is emitted. Dense layouts can
  still contain crossing connectors.
- **Vertical fades (superseded):** the old outer-wrapper measurement and fade overlays
  were removed together with the separate CSS renderer. Native vertical overflow and
  the shared graph's horizontal scroll surface own scrolling.

For each finding, record:

- Batch and affected files.
- Current behavior and reproduction steps or source/runtime evidence.
- User impact and confidence: confirmed or needs verification.
- Proposed behavior change and compatibility implications.
- Disposition: preserved pending evaluation, or changed with the reason and validation stated explicitly.
