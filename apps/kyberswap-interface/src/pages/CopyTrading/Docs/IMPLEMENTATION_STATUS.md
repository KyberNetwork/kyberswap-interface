# Copy Trading Implementation Status

Last reviewed: 2026-09-22

This file is the frontend snapshot for the current Copy Trading implementation.
It records only current ownership, accepted product decisions, remaining gaps,
and the latest verification evidence. API details remain owned by
[FE_API_Catalog.md](/Users/neikop/Workings/Kyber/kyberswap-interface/apps/kyberswap-interface/src/pages/CopyTrading/Docs/FE_API_Catalog.md) and [openapi.yaml](/Users/neikop/Workings/Kyber/kyberswap-interface/apps/kyberswap-interface/src/pages/CopyTrading/Docs/openapi.yaml).

## Current Snapshot

| Area              | Status                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| Backend contract  | Checked-in FE_API_Catalog.md and openapi.yaml are the API inputs; live compatibility requires separate verification. |
| RTK Query service | API definitions and adapters remain centralized in services/copyTrading.                                             |
| Read UI           | Implemented for the current product surfaces; read/cache ownership remains mixed.                                    |
| Write UI          | Implemented for Start Copy, Add Capital, Stop Copy, both withdrawals, Manual Sell and Close Position.                |
| Responsive UI     | Implemented; the Action Logs filter in card layouts remains a product decision.                                      |
| Live validation   | Browser QA and controlled transaction E2E remain open.                                                               |

## Contract and Ownership

- [services/copyTrading/api/baseApi.ts](/Users/neikop/Workings/Kyber/kyberswap-interface/apps/kyberswap-interface/src/services/copyTrading/api/baseApi.ts) owns the shared RTK Query API.
- Use absolute imports from the app's src base. Keep API URLs, parameter
  mapping and response adapters in services/copyTrading, not in UI components.
- [components/InfiniteScroll](/Users/neikop/Workings/Kyber/kyberswap-interface/apps/kyberswap-interface/src/pages/CopyTrading/components/InfiniteScroll/index.tsx) and [components/CursorPagination](/Users/neikop/Workings/Kyber/kyberswap-interface/apps/kyberswap-interface/src/pages/CopyTrading/components/CursorPagination/index.tsx) own TanStack
  pagination over RTK Query requests. [useRefreshCopyTrading](/Users/neikop/Workings/Kyber/kyberswap-interface/apps/kyberswap-interface/src/pages/CopyTrading/hooks/useRefreshCopyTrading.ts) invalidates both
  caches. Retain this architecture: API declarations remain centralized, while
  TanStack owns list pagination and its loading/refetch lifecycle. Consolidating
  these caches is not planned; preserving current behavior would require custom
  refresh/subscription handling without a business benefit.
- Endpoint groups own Discovery, Agents, Copy Runs, Copy Accounts, and prepared
  actions. The prepared-actions endpoint group also owns actions:status. Shared query-parameter mapping stays in api/queryParams.ts.
- adapters and types are the compatibility boundary between API-native
  envelopes/enums and UI models.
- Copy Run list endpoints map to CopyRunListItem. The Copy Run detail endpoint
  maps to CopyRunSummary and owns detail-only Portfolio P&L and fee-breakdown.
  ROI, Copy-specific Win Rate, and classified closed-position count are shared
  by list and detail.
- Agent position endpoints map to AgentPositionSummary. Follower Copy Run and
  owner position endpoints map to PositionSummary; follower accounting and
  recovery actions must not leak into leader-position models.
- Prepared-action request and response contracts stay together in
  types/preparedActions.ts. Submitted-status types live in types/actionStatus.ts;
  statusContext is passed through verbatim as an operator-authored selector.
- Agent action logs use /action-logs. Copy Detail logs use the owner activity
  endpoint scoped by copyRunId and ACTIVITY_SURFACE_COPY_RUN_LOG.
- Copy Run lifecycle preserves ACTIVE, CLOSING, STOPPED, and CLOSED.
- Position lifecycle and quantity state remain separate typed fields.
- Renderable metric values include CURRENT and STALE. UNAVAILABLE remains
  non-renderable and continues to participate in validation.
- Cursor-paginated requests restart from page one when a non-initial cursor is
  rejected with HTTP 400/code 10 or HTTP 409.

The following API surfaces remain without standalone product UI until designs
exist:

- Closed-position execution details. The endpoint remains declared but is no
  longer used for post-receipt convergence.
- Structured Alerts Feed and Copy Run Log fields beyond the current rows.
- Copy Run cashback policy.
- Agent discovery, Agent position detail/events, owner-wide positions, and
  Copy Account list/detail/balance/position/history screens.

## Multi-contract Generations

- Generation integration is implicit by product decision. No generation labels,
  badges, selectors, extra fee rows, stale markers, modal steps or changes to
  existing fee presentation are introduced.
- Chain and agent generation arrays are retained in adapters. The existing Copy
  action uses matching generation availability. Exactly one eligible generation
  is resolved automatically; multiple eligible generations remain unavailable
  until the API/product defines a default. Never guess by ID or array ordering.
- Agent Profile and Copy Detail keep the existing agent.flatFeeRatePct field
  for fee display, independently of Start availability. Generation fee policies
  remain modeled but do not override this display. Start Review continues to
  use the authoritative preparation fee preview.
- Leaderboard, profile and Start modal share one Start eligibility resolver;
  it resolves availability and generation identity without reading fee policies.
- Start refreshes chain and agent reads inside the existing preparation flow.
  Resolution adds no separate loading state, selection prompt or review step.
  The resolved generation is pinned to the attempt and sent on every request,
  including authorization, retries and funding continuation.
- All preparation results require generationId. Start matches its pinned
  identity; existing-account actions match known run provenance. Missing run
  provenance remains unknown internally, with no new UI label.
- Executable preparation and submission refresh the catalog and validate
  lifecycle/capabilities using the existing error flow. Read-only generations
  cannot execute. Operator-authorized funding continuation can retain an
  existing-account-only generation; status observation retains its context.
- Agent position-event requests and query identity include generationId.
  This endpoint still has no product UI; a future pagination consumer must
  reset its cursor when generation changes.

## Current Read and Navigation Decisions

### Product UI guardrails

These are accepted product decisions. A future API/OpenAPI sync must preserve
them unless product explicitly approves a UI change:

- The production UI is already decided. API-only fields, statuses, enrichment,
  recovery, and retry behavior stay transparent when they do not require user
  input. A contract addition is not by itself authorization to add labels,
  cards, banners, buttons, or modal steps.
- The frontend targets the currently deployed schema. Do not add compatibility
  fallback for the retired schema unless deployment ordering changes and
  product explicitly requests it.
- Copy Detail shows four headline metrics: Total P&L, Realised P&L, ROI, and
  Net Fees. Net Fees reads feeBreakdown.netFeesUsd; an info tooltip beside its
  value shows two aligned rows for Fee charged and Rebates, with muted labels
  and emphasized right-aligned values. The formula is not displayed.
  Fee is no longer a separate headline metric. Realised P&L reads portfolioPnlUsd.
- Capital In reads capitalInUsd directly. Only the Capital In value inside the
  Agent Profile and Copy Detail capital cards shows a **Syncing** badge when
  capitalInProjectionStatus is SYNCING. Tables, timelines, and modal summaries
  render the value as normal flat text.
- Capital In metric STALE is presentation-transparent; do not branch on it or
  add a stale badge. Current Balance also renders as a normal value with no
  stale-specific component or badge.
- Position recovery presents exactly one action. Use actionKind when it is a
  recommendation; otherwise use availableActionKinds[0] in API order. Do not
  scan, reorder, or filter the response to prefer a hard-coded action.
- Prepared Action keeps the existing modal and review UI. displayEnrichment is
  modeled for contract completeness but does not add a warning banner, preview
  state, cancellation copy, or extra user step. Preparation readiness and the
  exact prepared call remain authoritative.
- TRY_PREPARE uses the existing action CTA and calls the preparation endpoint
  normally. A successful preparation continues the existing flow; an
  unavailable preparation displays the existing preparation error. Do not add
  a separate availability-check action or label.
- HTTP 409 cursor recovery and preparation transport/retry details remain
  transparent. They must not introduce new product UI unless recovery requires
  a user decision.

### Agent ownership and Copy CTA

- One owner can have at most one active Copy Run per Agent.
- Leaderboard copied state comes from the current owner's selected-chain Open
  Copy Runs sorted by startedAt descending. The lookup currently reads only
  the first 100 runs; active copies beyond that page may show Copy instead of
  My Copy. Complete lookup is deferred pending an API update.
- Agent Profile requests the Agent-filtered Open Copy Runs using startedAt
  descending and limit=1.
- The latest run produces My Copy only when its status is ACTIVE. Any other
  latest status keeps the advisory-gated Copy action.
- Start Copy completion uses submitted-action status for the confirmed
  transaction and reads copyRunId from its result. Agent CTA ownership reads
  retain their existing filters and lifecycle rules.
- Copiers and Active Copies remain backend-provided metrics; the frontend does
  not recompute them from owner Copy Run lists.

### Loading, cache, and failure behavior

- Prepared-action sync recovery uses a waiting icon and Checking transaction
  result copy. Unresolved status and HTTP errors offer Refresh status with the
  saved action/hash; they do not label the transaction failed or resubmit it.
  Unconfirmed receipts retain Transaction submitted and Check confirmation.
- Wallet- and argument-sensitive reads use currentData so a previous wallet,
  Agent, Copy, or query argument is never rendered as the current entity.
- Agent Profile and Copy Detail show one page-level LocalLoader during wallet
  restoration and required initial reads.
- Background polling keeps current content when currentData already exists.
- Initial read failures keep Agent Profile and Copy Detail on the current route.
  Retry fetches only missing reads; Copy Detail loads its Copy Run before the
  dependent Agent. A failed owner Copy Runs lookup does not make the public
  Agent unavailable.
- Missing route IDs and primary-resource HTTP 403/404 show an error without an
  inline button; the page-header Back to remains available. Neither page
  redirects automatically. The error uses the Active Copies metric icon.
- [CopyTradingReadError](/Users/neikop/Workings/Kyber/kyberswap-interface/apps/kyberswap-interface/src/pages/CopyTrading/components/common/status.tsx) takes resourceUnavailable and onRetry explicitly; callback
  presence does not determine the error state.
- Agent Profile remains public without a connected wallet. Copy Detail is
  owner-only and shows the wallet-required state when genuinely disconnected.
- My Copies and History suppress their disconnected state during wallet
  restoration.
- Navigation does not retain the previous entity and does not prefetch. An
  uncached Agent/Copy route may therefore show the page loader.
- Performance charts intentionally retain their existing chart data while a new
  window loads.

### Metrics and lifecycle presentation

- Leaderboard reads agent roiPct; My Copies and Copy Detail read run roiPct.
  APR fields, window metadata, labels, and sorts have been removed. ROI is
  rendered directly from BE, with the existing metric presentation and no new
  stale marker/tooltip. Chart Return and History Total Return remain separate.

- CURRENT and STALE values render identically; stale badges are not shown.
- The sole status exception is the Capital-card **Syncing** badge driven by
  capitalInProjectionStatus, not by the Capital In metric status.
- UNAVAILABLE values remain N/A or — and continue to block actions where the
  action contract requires availability.
- Backend CLOSING is presented to the user as Stopped Copy in the capital card,
  with stopped styling and the available stopped date and time.
- Remaining in Wallet uses the non-paginated wallet-inventory endpoint and its
  authoritative total. It never derives the total by summing visible rows.
- Copy Run rows use agentSnapshot; My Copies and History do not request a
  redundant Agent collection.

### Copy Detail tables

- Open Positions displays Token, Entry Price, Current, Value, Unrealised P&L,
  Est. Rebate, Open Since, and Action. Unrealised P&L reads only
  unrealizedPnlUsd and unrealizedPnlPct, with USD above percentage.
- Closed Positions displays Token, Closed Price, Amount, P&L, Fee, Rebate,
  Received, and Tx Hash. Its P&L reads realizedPnlUsd.
- Action Logs displays Token, Type, Amount, Closed Time, and Tx Hash. Token is
  resolved from the position, capital, or fee detail and uses N/A when absent;
  Amount uses the matching raw amount and token decimals without cross-field
  fallback.
- The Action Logs Type control is server-backed. Buy and Sell send subtype;
  Capital Events, Failed Actions, and Fee/Rebates send category; All Type Logs
  omits both parameters. The filter value participates in the infinite-query
  key so changing it restarts the cursor chain.

### Lists and responsive behavior

- Leaderboard, My Copies, and History use cursor pagination. Infinite lists keep
  independent cursor chains and reset rejected non-initial cursors to page one.
- My Copies sorting is server-backed for Copy Run ROI, Agent Volume, and
  Capital In. Win Rate reads the Copy Run metric and is not sortable because
  the API only offers agent Win Rate sorting. Header selection cycles
  descending, ascending, then default.
- Desktop and mobile rows use native links, preserving modified-click,
  context-menu, and new-tab behavior. Independent action buttons remain outside
  the row-link hit target.
- Main tables use content-specific responsive cards and the shared ScrollArea.
- Detail tables use responsive cards. Desktop headers stay inside the horizontal
  scroll region so they remain aligned with their table rows. Action Logs and its
  Type filter use the desktop header at lg and above.
- Agent Profile and Copy Detail use the shared responsive detail grid, tab bar,
  sticky desktop side column, and explicit mobile ordering.

## Current Write Decisions

| Capability          | Final behavior                                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start Copy          | Uses funded mode, API-selected Permit or Approve, a separate Create confirmation, exact-call submission, then polls actions:status for the confirmed transaction. |
| Add Capital         | Shows current/new allocation inline and prepares, validates, simulates, and submits directly without a review step.                                               |
| Stop Copy           | Loads the complete open-position cursor chain, supports zero to 32 selected position IDs, and submits the exact prepared call.                                    |
| Withdraw Quote      | Supports typed, Half, and Max. Max sends uint256.max internally while review displays the prepared token amount.                                                  |
| Withdraw All Tokens | Uses the separate indexed selection preparation, previews server balances, and permanently stops copying on submission, including zero balances.                  |
| Manual Sell         | Active-Copy skipped-sell recovery using the pending FIFO and ALIGN_SKIP context.                                                                                  |
| Close Position      | Full position recovery. Active recovery uses ALIGN_SKIP; CLOSING recovery uses STOP_COPY and returns to History.                                                  |

Cross-flow decisions:

- AVAILABLE and TRY_PREPARE expose the normal product action.
- TRY_PREPARE calls the normal preparation route; it does not expose a separate
  Check availability UI.
- PENDING, UNAVAILABLE, expired, mismatched, or unexpected prepared responses
  fail closed and never reach wallet submission.
- displayEnrichment is render-only contract metadata and intentionally does not
  change the current Prepared Action UI.
- Preparation is authoritative for owner, chain, Smart Wallet, preview, call
  kind, target, value, amount, and expiry.
- Executable preparations must include statusContext with an expectedOwner
  matching the prepared sender before review or wallet submission.
- Wallet submission uses call.to, call.data, and call.valueRaw unchanged.
- [usePreparedAction](/Users/neikop/Workings/Kyber/kyberswap-interface/apps/kyberswap-interface/src/pages/CopyTrading/modals/PreparedActionModal/usePreparedAction.ts) owns preparation response handling, wallet submission, RPC
  receipt waiting, actions:status polling, refresh milestones, and retry for all
  seven actions. Action hooks own their request inputs and domain-specific checks.
- The shared hook owns flow state and its preparation request version. Consumers
  use prepare, confirm, retry, reset and fail rather than passing state setters.
- Start Copy keeps request ID, generation, authorization and predicted account
  in one attempt; getExpected derives an independent validation snapshot.
- Start's post-authorization request uses the same preparation handler as its
  initial request. Shared validation runs before capturing the predicted account;
  READY returns to Review without submission, PENDING/UNAVAILABLE use existing
  recovery, and a valid COMPLETED response uses the common success path.
- After authorization, Start validates UNAVAILABLE with the existing validator
  without requiring a call. Unavailable responses never pin the predicted account.
  The confirm label uses Preparing during any review preparation, including after authorization.
- Action callbacks consume validated preparation data or verified submitted
  results only. Start records the returned copyRunId; Stop resolves navigation.
  No action hook owns its own status polling or cache refresh sequence.
- Each poll sends the original statusContext and the receipt's transactionHash
  to POST /users/{ownerAddress}/actions:status. The context owner must match
  the prepared sender. Context is not rebuilt from current list/detail data,
  and preparation expiry does not prevent observation.
- Success requires SUCCEEDED with a result; Stop also requires its exact
  stopIntentId. Backend status owns convergence. FE no longer compares capital,
  balances, lifecycle, source-block coverage, or closed-execution hashes to
  determine whether the submitted action completed.
- PENDING, CONFIRMING, SYNCING, and UNKNOWN/SOURCE_UNAVAILABLE poll sequentially
  for at most 11 attempts, respecting guidance.retryAfterMs. The last returned
  receipt is sent as previousReceipt within that polling attempt sequence.
  The limit is an attempt count, not a fixed 20-second timeout.
- HTTP errors, unsupported/unverifiable results, missing context, and exhausted
  polling enter the existing sync recovery. Manual retry observes the saved
  action/hash again; it never prepares or submits another transaction. HTTP
  errors end the current poll sequence rather than retrying automatically.
- A reverted RPC receipt or FAILED API status enters transaction-error recovery;
  Retry requests a fresh preparation through the existing flow.
- Both initial submission and receipt retry use receipt.transactionHash after
  receipt resolution, including replacement transactions such as wallet Speed up.
  State, explorer links, and subsequent status retries retain that resolved hash.
- Cache invalidation runs after receipt success and again after API convergence,
  refreshing both RTK Query and TanStack Copy Trading reads. Stop additionally
  reads the returned Copy Run once to choose My Copies versus History; failure
  of this navigation-only read does not invalidate verified action success.
- No automatic nextStep continuation, Start funding continuation, withdrawal
  batch controls or persistence/resume across reloads. Start retains funded
  CREATE only; submitted status success refers to the submitted call rather
  than a frontend check of ACTIVE lifecycle.

### Capital flows

- Start Copy and Add Capital share only the capital amount domain: supported
  quote token, minimums, wallet balance, 25/50/75/100 action-only presets,
  parsing, and validation.
- Start Copy keeps authorization and Create as separate user actions.
- Add Capital has no intermediate review.
- Wallet balance loading is explicit. Preparation remains the final balance and
  amount authority.

### Stop Copy and position recovery

- Stop Copy fetches its open positions once when Step 1 opens. It does not
  refetch them immediately before preparation.
- Loading blocks preparation until the full positions request completes,
  including when the Copy Run snapshot reports zero open positions.
- Empty position selection is valid. More than 32 selected positions is invalid.
- Incomplete cursor data blocks preparation rather than presenting a partial
  list.
- Unchecked tokens remain in the Smart Wallet for manual management after Stop.
- Manual Sell, active full recovery, and CLOSING recovery have distinct Step 1
  source validation but share the same Step 2 sell review and submission flow.
- Each position renders only the API-recommended action, or the first advertised
  action when no recommendation is present.
- Active partial recovery calls prepareManualSell.
- On SELL_OBLIGATION_CHANGED, Retry discards the stale preparation, reloads the
  pending FIFO and returns to the existing form for review. It does not prepare
  or submit automatically; unavailable refresh data keeps the action blocked.
- Active full recovery and CLOSING recovery call prepareClosePosition.
- CLOSING recovery uses the position already loaded by Copy Detail.
- Manual Sell and Close Position Step 2 show exact token amounts in both amount
  panels.
- Prepared token metadata is merged with the position snapshot and reused for
  amounts, rate, fee, symbol, decimals, and logo.

### Withdraw Quote

- Withdraw availability is owned by the Copy Run and can be exposed for active,
  closing, stopped, or closed runs.
- Typed and Half send a canonical positive raw amount.
- Max displays the current balance but sends uint256.max as the execution-time
  sentinel.
- Review uses the prepared sweep and normal token amount; the sentinel is never
  shown to the user.
- The modal trusts its passed Copy Run and the pinned quote balance from
  wallet-inventory. Preparation remains authoritative.

### Withdraw All Tokens

- Withdrawal hooks own inputs, preparation requests and domain checks; they
  delegate submission, convergence and retry to usePreparedAction.
  [useWithdrawalData](/Users/neikop/Workings/Kyber/kyberswap-interface/apps/kyberswap-interface/src/pages/CopyTrading/modals/WithdrawModal/useWithdrawalData.ts) groups inventory and display-preview reads; the modal owns
  option selection and navigation.
- Preview failures block execution without blocking Connect Wallet or Switch Network.

- Copy Detail Advanced has one Withdraw button. Its modal defaults to
  All Tokens and offers All Tokens / Withdraw Stable only. Both options remain
  mounted; switching preserves the Stable amount but resets prepared calls.
  Stable uses the shared inventory's matching pinned quote balance.
- Each modal instance loads a display-only prepareWithdrawTokens preview once,
  without polling or cache reuse across opens. Switching options or returning
  from review does not refetch it. Clicking Withdraw prepares a fresh call.
- Preview token rows, total USD and rebate risk have independent status checks.
  Gas estimates the exact outer call in native currency; estimate failure does
  not hide the other metrics. Cached inventory remains visible during loading.
- All Tokens sends only ALL_INDEXED_TOKENS to prepareWithdrawTokens. Review
  explains permanent Stop, pending rebate risk, and token-discovery limits.
  Preparation owns token selection, balances, recipient, and calldata.
- Exact current balances, quote-token membership, recipient, and 1–100 unique
  tokens per batch are validated. Stop Copy retains its 32-position limit. Display price/rebate availability is independent
  from readiness; zero-balance selections remain executable.
- All Tokens finishes after one transaction and SUCCEEDED submitted status,
  regardless of hasMoreTokens. There is no next-batch CTA, batch
  state, or batch-specific preview cache. To withdraw remaining eligible tokens,
  close and reopen the modal for a fresh preview and preparation. Success means
  this transaction completed; it does not assert the Smart Wallet is empty.
- The passed Copy Run and existing advisory remain the modal inputs; no extra
  detail subscription, pre-prepare detail read, or RPC balance check is added.
- Both withdrawals use shared actions:status recovery. Wallet inventory supplies
  display/input reads and is refreshed through shared cache invalidation.
  Lifecycle and list membership remain server-owned.
- History retains its existing desktop columns and mobile fields. Desktop sorting
  supports Closed Trades, Capital In, Current Balance, and Started & Stopped Time
  (by stoppedAt). Missing closed counts never fall back to open counts. The API
  adapter retains the new History metrics without adding UI fields.
- Skipped-execution activity uses backend token identity; missing amounts remain
  missing. Chart dollar and percentage series remain independent.
- Run lifecycle, Capital In, and historical P&L stay server-owned; withdrawal
  never fabricates closed trades or subtracts from gross contributions locally.

## Remaining Work

Product flows are implemented. Remaining maintenance, validation and product
work:

- TODO (2026-09-22): Update the Leaderboard copied-state lookup when the API
  supports complete ownership lookup beyond the first 100 Open Copy Runs.
  Keep the current implementation while waiting; client-side cursor traversal
  is not planned for this follow-up.
- Controlled positive E2E for All Tokens withdrawal on active and stopped runs,
  including repeated independent withdrawals, zero balances, expiry, and
  post-receipt submitted-status convergence.
- Controlled positive E2E for Start Copy, Add Capital, Stop Copy, and Withdraw
  Quote post-receipt status convergence, including replacement hashes and
  recovery after status-request failures.
- Controlled positive E2E for active Manual Sell after an Operator skip.
- Controlled positive E2E for active 100% recovery.
- Controlled positive E2E for Close Position on a CLOSING Copy.
- Browser QA for responsive layouts, loading transitions, modified-click/new-tab
  behavior, and the final modal presentation.
- Product decision for exposing the Action Logs Type filter below lg; the
  current control is owned by the desktop table header.
- Product design before exposing the API-only surfaces listed above.

The position-recovery E2E cases require controlled Agent positions and
Operator-side skip/failure injection; they cannot be created deterministically
from the frontend.

## Verification Snapshot

Latest completed static checks (2026-09-22): app TypeScript, Copy Trading ESLint,
`git diff --check`, and **169 tests across 16 files** passed. Regression coverage
includes status-context validation, explicit reset during preparation, and Start
attempt snapshots and identity across renders.
This is not browser or live transaction evidence.

Run from `apps/kyberswap-interface` after logic changes:

```sh
pnpm exec tsc --noEmit
pnpm exec eslint src/pages/CopyTrading src/services/copyTrading --ext ts,tsx
pnpm exec vitest run src/services/copyTrading src/pages/CopyTrading
```

Keep unit coverage focused on financial validation, API model semantics and
recovery/ownership regressions. Avoid duplicating static mappings or testing
presentation-only details that do not protect those behaviors.
