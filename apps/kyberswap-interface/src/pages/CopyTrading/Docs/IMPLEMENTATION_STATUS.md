# Copy Trading Implementation Status

Last reviewed: 2026-08-27

This file is the frontend snapshot for the current Copy Trading implementation.
It records only current ownership, accepted product decisions, remaining gaps,
and the latest verification evidence. API details remain owned by
FE_API_Catalog.md and openapi.yaml.

## Current Snapshot

| Area              | Status                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| Backend contract  | Current input: checked-in OpenAPI matches the 33-operation live Swagger snapshot fetched on 2026-08-27. |
| RTK Query service | Code-complete: 27 GET queries and 6 preparation mutations are declared and typed.                       |
| Read UI           | Code-complete for all currently defined product surfaces.                                               |
| Write UI          | Code-complete for Start Copy, Add Capital, Stop Copy, Withdraw Quote, Manual Sell, and Close Position.  |
| Responsive UI     | Code-complete for the defined pages; browser QA remains manual.                                         |
| Live validation   | Positive controlled E2E remains deferred for the position-recovery cases listed below.                  |

## Contract and Ownership

- services/copyTrading/api/baseApi.ts owns the shared RTK Query API.
- Endpoint groups own Discovery, Agents, Copy Runs, Copy Accounts, and prepared
  actions. Shared query-parameter mapping stays in api/queryParams.ts.
- adapters and types are the compatibility boundary between API-native
  envelopes/enums and UI models.
- Prepared-action request and response contracts stay together in
  types/preparedActions.ts.
- Owner views map to OWNER_COPY_VIEW_OPEN and OWNER_COPY_VIEW_HISTORY.
- Position views map to POSITION_VIEW_OPEN and POSITION_VIEW_CLOSED.
- Agent action logs use /action-logs.
- Copy Run lifecycle preserves ACTIVE, CLOSING, STOPPED, and CLOSED.
- Position lifecycle and quantity state remain separate typed fields.
- Renderable metric values include CURRENT and STALE. UNAVAILABLE remains
  non-renderable and continues to participate in validation.

The following service support is intentionally API-only until product designs
exist:

- Closed-position execution details and the closed-executions endpoint.
- Structured Alerts Feed and Copy Run Log fields beyond the current rows.
- Copy Run cashback policy.
- Agent discovery, Agent position detail/events, owner-wide positions, and
  Copy Account list/detail/balance/position/history screens.

## Current Read and Navigation Decisions

### Agent ownership and Copy CTA

- One owner can have at most one active Copy Run per Agent.
- Leaderboard copied state comes from the current owner's selected-chain Open
  Copy Runs sorted by startedAt descending.
- Agent Profile requests the Agent-filtered Open Copy Runs using startedAt
  descending and limit=1.
- The latest run produces My Copy only when its status is ACTIVE. Any other
  latest status keeps the advisory-gated Copy action.
- Start Copy completion polling uses the same Agent filter, startedAt
  descending order, limit=1, and accepts only ACTIVE.
- Copiers and Active Copies remain backend-provided metrics; the frontend does
  not recompute them from owner Copy Run lists.

### Loading, cache, and failure behavior

- Wallet- and argument-sensitive reads use currentData so a previous wallet,
  Agent, Copy, or query argument is never rendered as the current entity.
- Agent Profile and Copy Detail show one page-level LocalLoader during wallet
  restoration and required initial reads.
- Background polling keeps current content when currentData already exists.
- When an initial required request settles without data, Agent Profile redirects
  to Leaderboard and Copy Detail redirects to My Copies or History.
- Agent Profile remains public without a connected wallet. Copy Detail is
  owner-only and shows the wallet-required state when genuinely disconnected.
- My Copies and History suppress their disconnected state during wallet
  restoration.
- Navigation does not retain the previous entity and does not prefetch. An
  uncached Agent/Copy route may therefore show the page loader.
- Performance charts intentionally retain their existing chart data while a new
  window loads.

### Metrics and lifecycle presentation

- CURRENT and STALE values render identically; stale badges are not shown.
- UNAVAILABLE values remain N/A or — and continue to block actions where the
  action contract requires availability.
- Every available Win Rate uses the primary color. N/A remains neutral.
- Signed P&L/APR metrics keep their positive/negative semantic colors.
- Backend CLOSING is presented to the user as Stopped Copy in the capital card,
  with stopped styling and the available stopped date and time.
- Remaining in Wallet uses the non-paginated wallet-inventory endpoint and its
  authoritative total. It never derives the total by summing visible rows.
- Copy Run rows use agentSnapshot; My Copies and History do not request a
  redundant Agent collection.

### Lists and responsive behavior

- Leaderboard, My Copies, and History use cursor pagination. Infinite lists keep
  independent cursor chains and reset rejected non-initial cursors to page one.
- My Copies sorting is server-backed for Agent APR, Agent Win Rate, Agent Volume,
  and Capital In. Header selection cycles descending, ascending, then default.
- Desktop and mobile rows use native links, preserving modified-click,
  context-menu, and new-tab behavior. Independent action buttons remain outside
  the row-link hit target.
- Main tables use content-specific responsive cards and the shared ScrollArea.
- Agent Profile and Copy Detail use the shared responsive detail grid, tab bar,
  sticky desktop side column, and explicit mobile ordering.

## Current Write Decisions

| Capability     | Final behavior                                                                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start Copy     | Uses funded mode, API-selected Permit or Approve, a separate Create confirmation, exact-call submission, then polls the latest Agent-filtered active Copy Run. |
| Add Capital    | Shows current/new allocation inline and prepares, validates, simulates, and submits directly without a review step.                                            |
| Stop Copy      | Loads the complete open-position cursor chain, supports zero to 32 selected position IDs, and submits the exact prepared call.                                 |
| Withdraw Quote | Supports typed, Half, and Max. Max sends uint256.max internally while review displays the prepared token amount.                                               |
| Manual Sell    | Active-Copy skipped-sell recovery using the pending FIFO and ALIGN_SKIP context.                                                                               |
| Close Position | Full position recovery. Active recovery uses ALIGN_SKIP; CLOSING recovery uses STOP_COPY and returns to History.                                               |

Cross-flow decisions:

- AVAILABLE and TRY_PREPARE expose the normal product action.
- PENDING, UNAVAILABLE, expired, mismatched, or unexpected prepared responses
  fail closed and never reach wallet submission.
- Preparation is authoritative for owner, chain, Smart Wallet, preview, call
  kind, target, value, amount, and expiry.
- Wallet submission uses call.to, call.data, and call.valueRaw unchanged.
- A transaction is successful only after a successful receipt.
- Receipt retry waits for the existing hash and never rebroadcasts.
- A reverted receipt starts a new preparation on Retry.
- Cache invalidation starts asynchronously after receipt success; UI success
  does not wait for backend projection convergence.
- Paired modal actions keep the outlined secondary action on the left and the
  primary action on the right.
- Loading Dots are absolutely positioned so modal CTA labels do not shift.

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
- Empty position selection is valid. More than 32 selected positions is invalid.
- Incomplete cursor data blocks preparation rather than presenting a partial
  list.
- Unchecked tokens remain in the Smart Wallet for manual management after Stop.
- Manual Sell, active full recovery, and CLOSING recovery have distinct Step 1
  source validation but share the same Step 2 sell review and submission flow.
- Active partial recovery calls prepareManualSell.
- Active full recovery and CLOSING recovery call prepareClosePosition.
- CLOSING recovery uses the position already loaded by Copy Detail.
- Manual Sell and Close Position Step 2 show exact token amounts in both amount
  panels.
- Rate is one compact Rate: value row above the prepared-details card.
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

## Remaining Work

Frontend implementation is complete for the current scope. The remaining work
is validation or product-definition work:

- Controlled positive E2E for active Manual Sell after an Operator skip.
- Controlled positive E2E for active 100% recovery.
- Controlled positive E2E for Close Position on a CLOSING Copy.
- Browser QA for responsive layouts, loading transitions, modified-click/new-tab
  behavior, and the final modal presentation.
- Product design before exposing the API-only surfaces listed above.

The position-recovery E2E cases require controlled Agent positions and
Operator-side skip/failure injection; they cannot be created deterministically
from the frontend.

## Verification Snapshot

Latest checks for the current working tree:

- App TypeScript passed.
- Targeted Copy Trading ESLint passed.
- All 68 currently discovered Copy Trading unit tests passed.
- Focused formatting passed.
- git diff --check passed.
- Browser QA, production build, and positive live transaction E2E were not run.
