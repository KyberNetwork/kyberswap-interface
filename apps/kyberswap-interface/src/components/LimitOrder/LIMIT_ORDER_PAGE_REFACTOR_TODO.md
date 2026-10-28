# Limit Order and Stop Market page refactor TODO

Reviewed: 2026-10-29

Status: reviewed page-wide ownership and consistency plan for both features. This file separates proposed behavior fixes, structural refactors and existing contracts to preserve; it does not authorize a business-rule rewrite. Updating this plan does not mark implementation or runtime verification complete.

Review outcome: keep this as an execution map, but implement it in small batches. The low-risk preparation batch below precedes correctness work. The first correctness batch is draft lifetime plus Set Price identity; processing stale-run guards are a separate correctness batch. Cross-Chain flags and unrelated product work stay outside this plan; presentation changes in this batch are confined to the shared order panel and its fallback.

## Scope

The page boundary is the shared trade surface, not only the `components/LimitOrder` folder:

- `/limit/:network/:currency?` and `/stop-market/:network/:currency?`, both rendered by [`LimitPage`](../../pages/Swap/LimitPage.tsx).
- The shared shell, provider, navigation and settings/info panels in [`SwapLayout`](../../pages/Swap/layout/SwapLayout.tsx), [`LimitOrderContext`](LimitOrderContext.tsx) and [`useTradeController`](../../pages/Swap/hooks/useTradeController.ts).
- The left-side Limit Order and Stop Market forms, pair/amount state, validation, warnings, review, wrapping, approval, signing and processing.
- The right-side chart, price markers, Order Book, take-order flow, Active/History lists, order-kind tabs, filters, pagination, Cancel All, cancellation, editing and recreation.
- URL/query/deep-link behavior, custom-chain embedded usage in [`PartnerSwap`](../../pages/PartnerSwap/index.tsx), tracking, notifications, RTK Query data and loading fallbacks.

The campaign page, unrelated Swap/Cross-Chain business logic, backend contract changes and a visual redesign remain out of scope. Existing API contracts, fee semantics, pair URLs, shared pair/sell amount, wrap/approve/sign/submit behavior and supported-chain gates must remain stable.

In particular, do not bundle changes such as toggling `constants/env.ts:71` (`KYBERCROSS`) into this page refactor.

Although this file lives under `components/LimitOrder`, its authority covers the shared Limit/Stop page surface described above. Move it to a neutral page/docs location only if it becomes the long-lived cross-feature implementation backlog.

Proposed fixes to draft loss, Set Price replay and stale operation completions are explicit behavior changes. Keep their before/after contract and regression coverage separate from behavior-preserving extractions. P0 below means correctness work to address before structural cleanup; it is not a production incident severity claim.

## Consistency between Limit Order and Stop Market

Equivalent interactions should have consistent UI and flow behavior across both products. When their contracts are the same, use one shared implementation and update both callers in the same batch. Preserve product-specific rules through explicit composition and typed inputs/callbacks. Consistency is a requirement in every phase, not a final styling pass.

Existing reuse is the starting point: Stop Market already consumes `LimitOrderInputTokenPanel` and `LimitOrderExpirySection`; both price sections use `PercentPresetSelector`, both forms use `useBalanceAmountShortcuts`, and execution uses `useProcessingSteps`/`ProcessingStepsModal`. Audit these owners before extracting replacements.

| Area | Shared UI / flow contract to align | Product-specific behavior to retain |
| --- | --- | --- |
| Token and sell amount | Token selection controls, amount input, balance/Max shortcuts, labels, focus and disabled/loading presentation; one selection/commit owner. | Pair transitions, balance/reservation inputs and amount derivation remain with the relevant form controller; do not assume rotation has identical business semantics. |
| Limit rate / trigger price | Input geometry, typography, percent-preset interaction, helper/warning placement and loading feedback for equivalent controls. | Limit-rate/output math versus oracle-based trigger and minimum-receive math; their price sources, units and validation must remain explicit. |
| Expiry and custom date | Shared expiry control, picker interaction and presentation-state ownership. | Supported presets, defaults, validity constraints and persisted fields supplied by each product. |
| Review and processing | Review captures a snapshot; equivalent connect/switch/review actions use consistent placement and feedback. Share modal structure and wrap/approve/sign progress, dismiss/retry and stale-result handling where applicable. | Terms acceptance, fee/slippage disclosures, review rows, approval targets, signing payloads, submit APIs and actual step sequences. |
| Orders and cancellation | Active/History toolbar, filters, row-action placement, status presentation, loading/error/empty states and Cancel All feedback; consistent operation lifetime rules. | Status sets, cursor versus page pagination, cancellation mechanisms, available row actions and service cache contracts. |
| Chart and navigation | Marker interactions, selected-order feedback and navigation to the requested order kind/status; preserve current pair and supported-chain behavior. | Order Book/Take belongs to Limit Order; Stop Market edit/recreate and other product-only capabilities stay available only where supported. |

- [ ] Compare both implementations for each touched area and record what is shared, what differs for a business reason, and the owner of the common contract.
- [ ] Consolidate equivalent behavior into existing shared components/hooks first. Keep a separate product implementation where inputs, transitions or lifecycle differ meaningfully; matching names or markup alone is insufficient.
- [ ] Give genuinely shared order UI/logic neutral names and a cohesive location usable by both features. Move existing feature-named exports only as their shared contract is clarified, update both callers directly, and avoid compatibility barrels or forwarding-only wrappers.
- [ ] Keep shared UI independent of either product's stores, service mutations and tracking schema. Pass authoritative values and named intents; retain product-specific validation, API payloads and tracking in their owners.
- [ ] Use flat typed props or explicit composition for differing content. Avoid a universal order form/controller with many `isLimit`/`isStop` switches, a new global context, or a parallel cache merely to share code.
- [ ] Align equivalent controls using existing components and semantic tokens: height, typography, padding, gap, borders, focus, disabled/error/loading states and responsive wrapping. Do not force different content into identical fixed-height cards.

Acceptance: changing a common control or flow contract updates both products through its shared owner; any remaining divergence has an explicit product reason. Shared mechanics have one implementation, while business rules and independent draft state remain with their respective owners.

## Existing contracts to preserve

These behaviors are already present in the source reviewed on 2026-10-29. They are regression checks, not new implementation tasks or proof of runtime correctness:

- `SwapLayout` places the provider and right panel outside the conditional form/Settings/Info content. The remaining draft issue is the form's lifetime, not moving the provider again.
- `OrderBook.handleTakeOrder` selects an order and opens its modal; wallet-connect gating belongs to the Take modal.
- Stop Market Recreate stages its draft after a successful network switch; rejection leaves the existing draft untouched.
- Order Book and Limit/Stop price-marker queries use `currentData`; Order Book inversion is scoped by its pair key. Preserve these protections while auditing the remaining identity boundaries.
- Stop Market creation captures a review snapshot, gates the session by account/chain and dismisses processing on unmount. Reuse the applicable pattern, while auditing the shared processing hook separately.
- `useOpenOrderCounts` intentionally fetches counts for both supported order kinds, regardless of the selected list. The toolbar needs both badges, and the initial Limit list shares its cached request.

## Lifetime and reset contract

Complete the field-level keep/reset decisions before changing state placement. Shell visibility, form drafts, list filters and execution sessions have different lifetimes; do not key the whole page by a combined route/product/pair/chain/account identity.

| Event | Keep / reset contract to establish | Owner |
| --- | --- | --- |
| Settings/Info round trip | Proposed fix: retain business draft fields; an open date picker may close. The Limit form currently unmounts and loses local rate/output/expiry fields. | Draft owner above the conditional view; control owns transient UI. |
| Product switch | Preserve intentional shared pair/sell amount. Record which product-specific rate, trigger, expiry and slippage fields survive; do not infer a blanket reset from the route change. | Each product's draft owner; page owns navigation. |
| Pair change or rotation | Preserve the explicit amount/rate rotation behavior. Record resets for other pair changes, invalidate stale Set Price intents, and preserve unrelated list filters/preferences. | Form controller and pair-scoped market state. |
| Chain or embedded `customChainId` change | Reject intents for the previous chain. Specify draft-field resets and list filter/cursor transitions separately; preserve existing supported-chain gates. | Draft, market and list owners within their own boundaries. |
| Account change | Invalidate the old review/operation and reset account-scoped cursors. Explicitly decide draft-field retention; do not clear unrelated preferences automatically. | Operation session and account-scoped list state. |
| Modal close/reopen or late completion | Invalidate the old operation's UI callbacks. Retain persistence for submitted work; reset a draft only when it still belongs to that operation and has not been replaced by a newer draft. | Operation owner with originating draft identity/revision. |

- Limit Order currently keeps rate, output and expiry in the form hook, so those fields are lost when `LimitPage` switches to Settings/Info. Shared pair and sell amount remain in `state/limit`.
- Stop Market keeps trigger, slippage, expiry and custom date in its existing Redux state; its local picker/seed/typed-output state has different lifetime rules. Do not apply the Limit retention fix by copying all Stop Market fields into a new shared store.

### Field-level baseline and decisions for subsequent correctness batches

These decisions specify the intended boundaries; the preparation batch does **not** implement draft retention, Set Price consumption or operation guards. Preserve current behavior unless a difference is explicitly listed below.

| Fields / authoritative owner | Current behavior traced in source | Keep/reset decision |
| --- | --- | --- |
| Main-route pair and sell amount: `state/limit` delegates to `state/swap` and the route updater | Shared by Swap, Limit and Stop. Form-local reset does not own token URLs; successful create clears the shared sell amount. | Keep across Settings/Info and product switches. Token/chain URLs remain with the existing route owner. Preserve each form's explicit rotation amount semantics; never duplicate these values in a new draft store. |
| Embedded pair and chain: Partner Swap query params; sell amount: shared swap state | `chainId`, `inputCurrency` and `outputCurrency` drive the embedded form; token handlers update query params. Switching away from the Limit tab unmounts the form. | Keep URL authority and preserve unrelated query params. `customChainId` defines the embedded market/draft identity even when wallet chain differs. A wallet-account change alone does not erase the draft. |
| Limit `rateInfo`, `outputAmount`: `useLimitOrderFormState` | Local values are lost on Settings/Info or product unmount. Ordinary token selection clears the rate and re-enables market seeding; rotation swaps amounts and recalculates rate. The current Set Price request can replay on remount. | Proposed view-only fix: retain both fields across Settings/Info. Preserve the existing product-switch reset of these Limit-local fields. Preserve explicit selection/rotation math. For an externally replaced pair/chain, invalidate the old rate/output and seed only from the new identity; implement this as correctness work, not a side effect of moving state. |
| Limit `expire`, `customDateExpire`: form hook | Defaults to 30 days on remount; selecting a preset clears the custom date. Pair selection/rotation does not reset expiry. Preset deadline is calculated from current time; custom date is absolute. | Retain across Settings/Info; retain existing reset on product switch and explicit successful-create reset. Keep across pair/chain/account changes. Preserve relative-preset versus absolute-date semantics and let validation reject an expired custom date. |
| Stop `triggerPrice`, `triggerPair`: `state/stopMarket` | Survives view/product unmount. Only read for the matching chain and directional wrapped-token pair; a different pair reads empty and seeds from its oracle. | Preserve identity gating and seeding, including on rotation. Keep the matching trigger across Settings/Info/product switches/account changes. Do not transplant the Limit inverse-rate rule into Stop. |
| Stop staged `slippage`: `state/stopMarket`; preferred slippage: `state/user` | Recreate's staged value wins over user preference, then pair default. Explicit selection clears staged slippage; successful reset clears it too. | Preserve this precedence and existing retention across view/product/pair/chain/account changes. A draft reset must not erase the user's preference. |
| Stop `expire`, `customDateExpire`: Redux; `expiryStart`: form-local | Preset/custom values survive unmount. The local preset anchor is recreated on mount, and reset when expiry changes or the form resets. Custom date is absolute. | Preserve existing behavior in this scope, including re-anchoring on remount. Changing Stop deadline anchoring requires a separately stated behavior change; do not couple it to the Limit retention fix. |
| Stop `typedOutput`, `seededPair`: form-local | Typed text is used only while pair, sell amount and trigger match its captured identity; otherwise output is derived. Both local values are lost on remount. | Keep transient typed text local; preserve re-derivation on identity changes/remount and never overwrite an existing matching trigger while seeding. |
| Expiry expansion/date picker and rate inversion: presentation controls | Local state resets on unmount. | May close/reset across Settings/Info and product switches; it must not determine business-draft retention. |
| Review/processing: operation owner | Stop creation captures a snapshot and gates the session by wallet/chain, with cleanup on unmount. Limit/shared processing gaps remain in item 5. | Close/invalidate on account/chain changes or unmount. Dismissal never erases a draft. Completion may reset only its originating, unchanged draft; submitted transaction/cache persistence must finish independently. |

List selection, search and cursor state have separate ownership: the main panel owns `tab`/`orderTab`, while embedded market/list selection remains local. Each mounted product list keeps its status/chain filters and pager; switching the selected product list currently unmounts it and resets its local filters. The shared `search` query survives that switch. Preserve these rules in preparation work. Reset account-scoped pagination on account change without clearing unrelated preferences; changes to list mount/query behavior belong to item 3.

- [x] Record the concrete field-level decisions and current behavior for main Limit, Stop Market and embedded Partner Swap; distinguish the proposed fixes from existing behavior.
- [ ] Use a keyed boundary only when all state inside it shares the same reset policy; otherwise use a narrower owner or explicit transition.

## Ownership model

Every page area must name three separate owners. The UI owner renders and reports intent, the state owner stores the authoritative value or query state, and the flow owner performs transitions and async work. A component may own more than one layer only when those lifecycles are inseparable; do not pass setters through a view just because it is nearby.

| Area | UI ownership | State/data ownership | Flow/logic ownership |
| --- | --- | --- | --- |
| Page shell and product switch | `LimitPage`, `SwapLayout`, `OrderTypeSubTabs`, Settings/Info panels | `useTradeController`, route/query params, `LimitOrderContext` identity | Page/session coordinator: choose product, preserve panel visibility rules, handle back/deep-link transitions and reset boundaries. |
| Limit Order draft | `LimitOrderForm` and its token/rate/expiry sections | `useLimitOrderFormState` plus intentional shared pair/sell amount in `state/limit`; Partner Swap URL params | Form controller: apply token/pair/amount/rate/expiry transitions, derive validation inputs and reset by identity. |
| Stop Market draft | `StopMarketForm` and its trigger/receive/fee sections | `useStopMarketFormState` and its Redux/URL-backed fields | Stop Market form controller: apply trigger/slippage/expiry/pair transitions and produce a review snapshot. |
| Market/chart/book | `OrdersPriceChart`, `OrderBook`, marker details and table rows | Pair/chain-scoped RTK Query data plus presentation-only collapse/inversion/modal state | Market-data coordinator: refresh pair data, validate Set Price identity, open Take intent and reconcile marker/table cancellation feedback. |
| Orders toolbar and lists | `OrderListComponents`, `MyOrders`/`StopMarkets` tables, filters and pagination controls | One page-level tab/order-kind selection; one list controller per product for query args, filters, cursors and cancellation state | Orders coordinator: activate only the selected list, route show-orders/Recreate intents and compose toolbar actions without DOM portals. |
| Review and processing | Confirm/review modals, processing-step modal, connect/switch controls | Immutable reviewed snapshot and operation identity | Operation session: wrap/approve/sign/send, wallet/chain checks, cleanup, stale-result suppression and post-submit persistence. |
| Cancel/edit/recreate | Cancel/Edit modals and row/chart actions | Selected order(s), operation state and local immediate feedback | Cancellation/edit coordinator: chain selection/switch, signature/transaction flow, invalidation and guarded callbacks; Recreate coordinator stages form state only after a valid switch. |
| Server data and freshness | Loading/error/empty states and refresh controls | `services/limitOrder.ts`, `services/stopMarket.ts`, RTK Query cache keys/tags and polling | Query/service boundary: transform API data, preserve pagination metadata, invalidate dependent scopes and define reservation freshness. |
| Notifications and tracking | Toast/announcement summaries and tracking call sites | Subscription refs, seen IDs, acknowledgement state | Notification/tracking owner: subscribe/unsubscribe by account/chain, deduplicate events, acknowledge and navigate through the shared route contract. |

### Flow ownership rules

- **Create:** form owns the draft → review session captures an immutable snapshot → processing session owns wrap/approve/sign/submit → service, transaction and notification layers persist the result → form reset runs only if the originating session is still current.
- **Take:** Order Book owns row selection intent → Take modal owns wallet-connect and review → processing owns approval/encoding/send → transaction/cache invalidation owns persistence; the table must not execute the flow.
- **Cancel:** table/chart emits selected order intent → cancel session owns chain choice, network switch, signature/send and operation identity → cache invalidation and local feedback update all consumers without a second cache.
- **Recreate:** row emits a draft intent → page coordinator validates the target chain/switch → form controller stages the draft → navigation opens the form; a rejected switch must leave the previous draft unchanged.
- **Set Price:** Order Book emits a typed pair/chain-scoped intent → form controller validates identity and applies it once → the context must not retain an unbounded replayable command.

These findings are a refactor map, not a request to create a controller, context or file for every row. Extract only a cohesive lifecycle or a real reuse boundary.

## Refactor backlog

### 1. Establish separate page, draft, list and operation lifetimes

Priority: P0 prerequisite, lifetime/reset contract; structural extraction follows only where needed.

Sources: [`LimitPage`](../../pages/Swap/LimitPage.tsx), [`SwapLayout`](../../pages/Swap/layout/SwapLayout.tsx), [`useTradeController`](../../pages/Swap/hooks/useTradeController.ts), [`PartnerSwap`](../../pages/PartnerSwap/index.tsx), [`OrderTypeSubTabs`](../StopMarket/OrderTypeSubTabs.tsx).

- [ ] Complete the lifetime/reset matrix above; define separate identities for shell navigation, product drafts, list queries and operations.
- [ ] Preserve the existing provider/right-panel lifetime and locate the draft owner outside view-only unmounts; keep transient UI such as an open date picker local to its control.
- [ ] Apply product, pair, chain, wallet and embedded `customChainId` transitions only to the fields owned by that boundary.
- [ ] Keep main-route query synchronization separate from embedded Partner Swap local tab state without duplicating the same transition in both layers.
- [ ] Preserve current route redirects, canonical pair URLs, `tab`/`orderTab` deep links and the existing settings/info back behavior.

Acceptance: each field has an explicit keep/reset policy. The draft-retention fix in item 2 satisfies the Settings/Info round trip without resetting unrelated filters/preferences or keeping execution sessions alive accidentally.

### 2. Make form draft ownership explicit

Priority: P0 for the draft-retention fix; P1 for behavior-preserving form extraction.

Sources: [`LimitOrderForm`](Form/LimitOrderForm.tsx), [`useLimitOrderFormState`](Form/useLimitOrderFormState.ts), [`useStopMarketFormState`](../StopMarket/Form/useStopMarketFormState.ts), [`state/limit`](../../state/limit/hooks.ts).

- [ ] Fix Limit draft loss on Settings/Info round trips as an explicit behavior change: retain local business fields across view changes, with a regression test against the current unmount behavior.
- [ ] Keep business draft transitions in the form controller: token selection, pair rotation, input/output, rate/trigger, expiry and reset.
- [ ] Treat shared pair and sell amount as deliberate Swap/Limit state; do not copy them into a second local source of truth.
- [ ] Define when rate, output, expiry, trigger, slippage and custom date survive view changes, and when they reset on pair/chain/account/product changes.
- [ ] Keep URL-backed Partner Swap token/chain values in the URL owner; do not mirror them into state solely to make a child easier to call.
- [ ] Keep validation and warnings derived from the authoritative draft and current query data.
- [ ] Align shared token/amount, percent-preset and expiry interactions across both forms using the consistency matrix; share control mechanics without merging Limit rate and Stop trigger calculations or duplicating draft state.

Acceptance: a draft has one owner, reset behavior is testable by identity, and form visibility changes do not recreate or partially preserve fields by accident.

### 3. Consolidate right-panel navigation and list coordination

Priority: P1, structural cleanup.

Sources: [`OrderList`](OrderList/index.tsx), [`MyOrders`](MyOrders/index.tsx), [`StopMarkets`](../StopMarket/MyOrders/index.tsx), [`useTab`](../../hooks/useTab.ts), [`useOrderListNavigation`](hooks/useOrderListNavigation.ts).

- [ ] Keep one authority for market tab, Active/History and order kind; remove local mirrors and synchronization effects where the host already owns that choice.
- [ ] Let each list controller own its detailed status filter, search, chain filter, pagination cursor and list query inputs.
- [ ] Keep query activation explicit so unused list-content queries do not start merely because an extracted controller mounted. Preserve queries consumed by visible badges, warnings and chart markers even when their product's list is not selected.
- [ ] Compose the persistent toolbar directly from supplied data and intent callbacks. Remove the DOM-container prop and portal used only to place Cancel All beside the tabs.
- [ ] Use the same toolbar/filter/action presentation for equivalent Limit and Stop list controls; keep status options, pagination state and available actions product-specific.
- [ ] Move cross-panel intents such as `show orders`, scroll-to-orders and Recreate to the page/list coordinator; table rows should report intent rather than navigate and mutate form state themselves.

Acceptance: Active/History, order kind, query params and list filters have one owner each; direct navigation, notification links and `View my open orders` still land on the same list and status.

### 4. Scope Order Book, chart and price selection by identity

Priority: P0 for Set Price replay/identity fixes; P1 for market-data ownership cleanup.

Sources: [`LimitOrderContext`](LimitOrderContext.tsx), [`OrderBook`](OrderBook/index.tsx), [`useLimitOrderFormState`](Form/useLimitOrderFormState.ts), [`OrdersPriceChart`](OrderList/OrdersPriceChart.tsx), [`useLimitOrderPriceMarkers`](hooks/useLimitOrderPriceMarkers.tsx), [`useStopMarketPriceMarkers`](../StopMarket/hooks/useStopMarketPriceMarkers.tsx).

- [ ] Fix Set Price replay together with draft lifetime: the context currently retains a request without chain/pair identity, while the form's consumed-request ref resets on remount.
- [ ] Keep the context, if needed for the chart-to-form boundary, as a typed one-shot intent transport only. The form controller validates and applies the intent; it owns the resulting draft mutation.
- [ ] Include chain and pair identity in the intent; reject and clear a selection for a different identity.
- [ ] Consume and clear the intent at one form-controller boundary. If the form is hidden, define an expiry/cleanup rule tied to product, pair and chain transitions; a remount must not replay an old request.
- [ ] Keep chart/book queries scoped to the current pair and chain, and keep inversion preferences scoped to that pair key.
- [ ] Share cancellation feedback between chart markers and the table through the existing cache or a narrowly scoped feature controller, without adding a second server cache.

Acceptance: a late Set Price from pair A cannot change pair B or a new draft; chart/book and marker data cannot render for a previous pair after identity changes.

### 5. Give every create/take/edit/cancel operation a session owner

Priority: P0, async correctness.

Sources: [`useProcessingSteps`](../ProcessingSteps/useProcessingSteps.ts), [`CreateOrderFlow`](CreateOrder/CreateOrderFlow.tsx), [`useCreateLimitOrder`](CreateOrder/useCreateLimitOrder.tsx), [`TakeOrderConfirmModal`](TakeOrder/TakeOrderConfirmModal.tsx), [`useTakeLimitOrder`](TakeOrder/useTakeLimitOrder.ts), [`CancelOrderModal`](CancelOrder/CancelOrderModal.tsx), [`StopMarketFlow`](../StopMarket/CreateOrder/StopMarketFlow.tsx), [`StopMarketEditModal`](../StopMarket/EditOrder/StopMarketEditModal.tsx), [`CancelStopMarketModal`](../StopMarket/CancelOrder/CancelStopMarketModal.tsx).

Observed gap: `useProcessingSteps` already has a run ID and checks between steps, but some continuations inside steps are unguarded. For example, dismissal while `checkApprovalManually()` is pending can still be followed by `approveCallback()`, and wrap/final-step completions can still update UI state. Modal cleanup alone does not close these gaps.

- [ ] Audit and fix shared processing continuations first: recheck the run after awaited reads before starting another wallet action, and guard late success/failure/loading callbacks within each step.
- [ ] Reuse the existing run identity rather than adding a competing processing state machine. Trace all shared callers and test their affected contract when changing this hook.
- [ ] Capture the reviewed order, account, chain and pair at the moment a session starts; do not let later form edits alter the submitted snapshot.
- [ ] Make the operation owner create and dismiss its processing controller, with cleanup on unmount, close/reopen and account/chain identity changes.
- [ ] Ignore stale UI completions from an old session, including reset-form, dismiss, error, loading and cancelled callbacks.
- [ ] Guard form reset with the originating draft identity/revision as well as operation lifetime, so completion cannot clear a newer draft in a still-mounted owner.
- [ ] Preserve persistence for work already submitted: transaction tracking, notification acknowledgements and cache invalidation must still run when the modal closes.
- [ ] Apply the established Stop Market creation session pattern to Limit Order creation where behavior is equivalent.
- [ ] Consolidate equivalent review/processing lifecycle mechanics for both products in the lowest shared owner. Keep product-specific review content, terms, step definitions, validation, signing and submission explicit; do not copy a second session implementation or force every operation through the same sequence.
- [ ] Give cancellation A/B and edit/recreate runs an operation identity so a late result cannot update a newly opened modal or row.

Acceptance: changing wallet/chain, closing a modal, leaving the page or reopening a modal cannot let an old completion reset, dismiss or report success for a newer session. Dismissing during an allowance read must prevent a subsequent approval request; late wrap/final-step success or failure must not update a new run, while persistence for submitted work still completes.

### 6. Align server-data ownership and freshness

Priority: P1, consistency.

Sources: [`services/limitOrder.ts`](../../services/limitOrder.ts), [`services/stopMarket.ts`](../../services/stopMarket.ts), [`MyOrders`](MyOrders/index.tsx), [`StopMarkets`](../StopMarket/MyOrders/index.tsx), [`useStopMarketReservedBalance`](../StopMarket/hooks/useStopMarketReservedBalance.ts), [`useCreateStopMarket`](../StopMarket/CreateOrder/useCreateStopMarket.tsx), [`useCreateLimitOrder`](CreateOrder/useCreateLimitOrder.tsx).

- [ ] Document the query key and refresh owner for account totals, filtered list pages, pair-specific book data, chart markers, active-making amounts, fee estimates and oracle prices.
- [ ] Keep backend pagination authority (`hasMore`, cursor and `totalOrder`) at the service/query boundary; views should not reconstruct a competing pagination model. Preserve the current split: active Limit requests keep the supported `chainIds` list for exact totals, while history All Chains uses the backend's omitted-chain filter path.
- [ ] Define one freshness policy for reserved/active-making amounts used by validation and approval, including external cancellation, expiry and execution notifications.
- [ ] Align refresh triggers for equivalent user actions in both products while retaining their distinct reservation calculations, cache tags, endpoints and pagination contracts.
- [ ] Use existing RTK Query invalidation and polling scopes; do not introduce a parallel event bus or global cache.
- [ ] Skip unused list-content queries according to their consumers, not the selected product alone. Preserve both supported order-kind counts in [`useOpenOrderCounts`](hooks/useOpenOrderCounts.ts), plus queries needed by visible warnings/markers, supported-chain filters and API parameter contracts.

Acceptance: a mutation or execution notification refreshes every surface that depends on it, while unrelated pair/account queries remain independent and deduplicated.

### 7. Keep notifications and tracking at the feature seams

Priority: P1, ownership clarity.

Sources: [`useLimitOrderTracking`](hooks/useLimitOrderTracking.ts), [`useStopMarketTracking`](../StopMarket/hooks/useStopMarketTracking.ts), [`useNotificationLimitOrder`](hooks/useNotificationLimitOrder.tsx), [`useStopMarketExecutedNotifications`](../StopMarket/hooks/useStopMarketExecutedNotifications.tsx), [`useMyOrdersNotifications`](MyOrders/useMyOrdersNotifications.ts).

- [ ] Keep page-view and form interaction tracking at the shared form owner, guarded against ordinary rerenders. Define whether a Settings/Info remount is a new page view or the same page session before changing the current mount-local guard.
- [ ] Keep operation success/failure tracking with the operation session, and list refresh/notification acknowledgement with the notification owner.
- [ ] Align tracking lifecycle boundaries across equivalent interactions, preserving each product's event names/payloads and acknowledgement rules outside shared presentation components.
- [ ] Define account/chain cleanup for Firebase subscriptions, polling and seen-ID refs.
- [ ] Ensure notification deep links use the shared navigation contract and do not fight the page's current query selection.
- [ ] Sweep the page surface for stale debug artifacts (`console.log`, `debugger`, obsolete TODO/FIXME, unsafe casts or suppressions) before implementation work is considered complete.

Preparation cleanup: removed the two `console.log` calls in `LimitOrder/utils.ts` and `LimitOrder/Form/LimitOrderRateSection.tsx`, preserving their zero-rate/empty-comparison fallbacks. This does not mark the wider notification/tracking audit complete.
Acceptance: each event/subscription has one lifecycle owner, does not duplicate after remount, and points to the same route/query contract as the visible list.

### 8. Align presentation, responsive geometry and loading fallbacks

Priority: P1, UI stability.

Sources: [`OrderListComponents`](OrderList/OrderListComponents.tsx), [`OrderListSkeleton`](OrderList/OrderListSkeleton.tsx), [`SegmentedControl`](../SegmentedControl/index.tsx), [`OrderBookSkeleton`](OrderBook/OrderBookSkeleton.tsx), [`RowsSkeleton`](MyOrders/RowsSkeleton.tsx), Stop Market list skeletons.

- [x] Preserve the order-kind label's `w-36` contract so count/warning badges do not shift the segment horizontally. Share the toolbar's padding/gap/wrapping between loaded and fallback panels without changing the global primitive.
- [x] Share search/filter geometry and control placement using the Limit Order base surface (`bg-background`/`text-subText`) while retaining distinct status options, chain lists and debounce/query behavior.
- [x] Align the table-header surface; keep product-specific column templates because Limit and Stop render different fields.
- [x] Use `TableCellSkeleton` for Limit and Stop row placeholders, with one body-level pulse animation instead of per-cell shimmer instances; keep the standalone USD-loading placeholder animated as well.
- [ ] Keep the toolbar mounted while the selected order kind changes; inactive list content may switch or be skipped without moving the controls.
- [ ] Make loaded and fallback cards share tab height, toolbar height, padding, gaps, badge space and responsive wrapping.
- [ ] Compare Limit and Stop forms, review/cancel modals and list states side by side for equivalent UI. Fix shared geometry in the owning component and update both consumers and their skeletons together; retain space for product-specific content.
- [ ] Check narrow screens, long translations, large counts, no-account state, error state, Cancel All loading and chart/book visibility.
- [ ] Keep presentation components rendering supplied data and reporting intent; transient hover, collapse and picker state may remain local to the surface.

Acceptance: loading-to-content transitions do not shift the page materially, controls keep their hit area and focus, and mobile layouts do not rely on margins or spacer elements.

### 9. Keep the file structure cohesive while refactoring

Priority: P1, maintainability.

- [ ] Split only by a meaningful lifecycle: page coordinator, form draft, list controller, market data, operation session and presentation views.
- [ ] Review files above roughly 300–400 lines for a real boundary, especially `OrderList`, `MyOrders`, Stop Market list/form and execution modals; do not fragment cohesive flows into forwarding-only files.
- [ ] Keep feature-private types/helpers beside their owner and preserve directional imports: domain/query logic must not import UI.
- [ ] Use typed intent callbacks and flat props for extracted components; do not add generic context or action/state bags just to shorten signatures.
- [ ] Keep shared primitives unchanged unless the page scope reveals a genuine shared contract problem.
- [ ] Keep common order components/helpers in one cohesive shared boundary with directional imports; product modules consume it, and it must not import their controllers or service-specific types solely to branch by product.
- [ ] Do not include Cross-Chain feature flags or unrelated shared-primitive changes in a Limit/Stop ownership batch. A shared primitive change needs its own caller inventory and visual verification.

Acceptance: a routine change to one flow requires opening its owner and, at most, the intentional coordinator boundary; no duplicate state or re-export-only layer remains.

## Refactor handoff contract

Every implementation batch should document the three ownership columns before editing:

| Layer | Required contract | Examples in this feature |
| --- | --- | --- |
| UI | Renders authoritative props/data, owns presentation-only state, and emits named intents. It must not start requests or mutate another layer's state indirectly through effects. | `onSelectOrder`, `onSetMarketPrice`, `onTake`, `onCancel`, `onRecreate`, `onChangeTab`. |
| State | Owns one source of truth for draft fields, identity, query inputs, cache data or operation status. It derives values from that source and defines reset/remount behavior. | Form draft, page/query tabs, list filters/cursors, pair-scoped query keys, reviewed snapshot. |
| Flow logic | Owns transitions, validation sequencing, network/wallet calls, cancellation, retries, cleanup, stale-result guards, invalidation and persistence. | Create/Take/Cancel sessions, Recreate network switch, Set Price consumption, notification acknowledgement. |

Before marking a batch complete, confirm:

- [ ] Identify whether the batch fixes observed behavior or preserves behavior while moving ownership; document the before/after contract for each fix.
- [ ] Recheck the existing contracts above for the touched flows; do not treat already-present protections as unfinished implementations.
- [ ] For a shared change, review and update both Limit and Stop callers in the same batch. Record any intentional UI/flow difference and its business reason; verify applicable embedded callers as well.
- [ ] Every changed UI component has an explicit intent callback rather than a raw state setter or hidden request trigger.
- [ ] Every changed state value has one authoritative owner and a documented identity/reset boundary.
- [ ] Every async flow has one operation owner, an immutable input snapshot, cleanup and stale-result handling.
- [ ] UI, state and flow modules keep directional imports; a presentation component does not import a service mutation only to handle a click.
- [ ] Tests cover the contract at the flow boundary, not implementation details of a presentational extraction.

## Suggested implementation order

- [x] Preparation 0 (documentation): record field-level owners and retention/reset decisions for main Limit, Stop and embedded Partner Swap above. No state-placement or business-rule change.
- [x] Preparation 1 (cleanup): remove the two identified debug logs while retaining error fallbacks.
- [ ] Preparation 2 (pure contracts): the previously added Limit `utils.test.ts` and `MyOrders/utils.test.ts` are no longer present in the current checkout. Do not count their 13 historical cases as current coverage. Existing history-pager, service-pagination and Stop utility tests remain; these do not verify form remounts or async sessions.
- [x] Preparation 3 (local presentation): preserve the fixed order-kind label width, share the loaded/fallback toolbar, and align fallback filters/table headers with the selected Limit/Stop layout. Keep the existing Cancel All portal and all query/operation owners. Visual verification remains separate from static checks.
- [x] Preparation 4 (list presentation): share Limit/Stop filter geometry and trigger styling while preserving product-specific options/query semantics; align table-header surface styling and use `TableCellSkeleton` for both row skeletons.
- [ ] Batch 1 (P0, draft correctness): implement the recorded lifetime decisions, retain Limit business draft across Settings/Info, and make Set Price a pair/chain-scoped one-shot intent. Add focused regression tests before any broad extraction.
- [ ] Batch 2 (P0, operation correctness): close stale continuations in `useProcessingSteps`, then add operation/draft identity guards to Limit create and the affected Stop/Take/Cancel/Edit flows. Keep submitted-work persistence intact.
- [ ] Batch 3 (P1, list ownership): consolidate URL/list ownership, remove toolbar DOM-container plumbing, and move Recreate coordination. Preserve product-specific pagination/actions plus badge/warning/marker query consumers.
- [ ] Batch 4 (P1, data and lifecycle): finish market-data ownership, cache invalidation, reservation freshness, notification/tracking lifecycles and chart/table cancellation feedback.
- [ ] Batch 5 (P1, presentation): finish the cross-product skeleton/responsive/file-boundary audit. Treat `SegmentedControl` or other shared primitive changes as separately reviewable when they affect callers outside this page.

Do not combine phases with unrelated Swap, Cross-Chain, backend or contract work.

## Verification plan and limits

The planning review was source-based. Browser, live-service and wallet E2E verification are not included in this TODO update and remain pending for implementation work.

Preparation 0–4 validation (2026-10-29): targeted Vitest passed 3 files / 156 tests for the list-related verification run; the earlier preparation run passed 5 files / 169 tests including 13 new pure-contract cases. Targeted ESLint, TypeScript and diff checks passed. Browser/visual and wallet E2E checks have not run. The checked preparation items record implementation, not proof of responsive rendering or async correctness.

For each implementation batch, verify separately:

- [ ] Exercise both product callers for each changed shared contract, including equivalent selection/review/dismiss/retry transitions. Keep regression tests at meaningful behavior boundaries and use product-specific cases for differences; avoid duplicated tests of presentation extraction.
- [ ] Trace that Limit rate/price and Stop oracle/trigger, fee/slippage/terms, signing/cancellation and pagination semantics remain separate where required.
- [ ] When browser verification is authorized, compare equivalent UI states at the same viewport: focus/disabled/loading/error, review/processing, list filters and skeleton-to-content transitions. Report this separately from source/test checks.
- [ ] Focused unit/regression tests for draft reset, pagination metadata, Set Price identity, operation sessions and cancellation/recreate contracts.
- [ ] Settings/Info round trip retains the draft; Set Price is consumed once, does not replay after remount and cannot cross pair/chain identity.
- [ ] Controlled async tests cover dismissal during allowance lookup, late wrap/final-step success and failure after reopen, and completion after the originating draft was replaced; submitted-work persistence remains intact.
- [ ] Switching the selected list skips unused content queries while both supported order-kind badges remain current and existing shared requests stay deduplicated.
- [ ] Targeted ESLint/Prettier and `pnpm --filter @kyberswap/interface exec tsc --noEmit --pretty false`.
- [ ] `git diff --check` and a final file-tree/diff review against this ownership plan.
- [ ] Source trace for main Limit, Stop Market and Partner Swap entry points, including inactive-query skips and deep links.
- [ ] Runtime scenarios: Settings/Info round trip, pair/chain/account changes, late completion after close, modal reopen, rejected network switch, chart/table cancellation freshness and loading geometry.
- [ ] Browser and wallet E2E only when explicitly authorized for the implementation batch; report those results separately from static checks.

Current diff review (2026-10-29): preserve the original transparent Limit filter-bar wrapper, search classes and dropdown defaults; use 3 skeleton rows for both Limit and Stop as requested. Filter fallback widths include the dropdown arrow and padding. Revert the unrelated Limit row-wrapper props expansion. `TableCellSkeleton` renders a div, so its Stop wrappers use divs; USD-only loading retains its own pulse. Browser/visual verification remains pending.

Final source-review validation (2026-10-29): targeted ESLint for all seven changed TSX files, TypeScript and diff checks passed. Existing tests passed 6 files / 168 cases: Limit history pager/service, Stop utilities/service, expiry formatting and sell-amount rendering. The diff preserves list query arguments, debounce, filter callbacks, pagination resets and operation handlers. These checks do not verify browser colors, responsive geometry or wallet E2E; the missing preparation-2 tests remain unchecked above.
