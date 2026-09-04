# Copy Trading Implementation Status

Last reviewed: 2026-09-03

This file is the frontend snapshot for the current Copy Trading implementation.
It records only current ownership, accepted product decisions, remaining gaps,
and the latest verification evidence. API details remain owned by
FE_API_Catalog.md and openapi.yaml.

## Current Snapshot

| Area              | Status                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| Backend contract  | Current input: checked-in OpenAPI byte-matches the live 33-path, 155-definition Swagger fetched on 2026-08-28. |
| RTK Query service | Code-complete: 27 GET queries and 6 preparation mutations are declared and typed.                              |
| Read UI           | Code-complete for all currently defined product surfaces.                                                      |
| Write UI          | Code-complete for Start Copy, Add Capital, Stop Copy, Withdraw Quote, Manual Sell, and Close Position.         |
| Responsive UI     | Code-complete for the defined layouts; Action Logs mobile filter remains a product decision.                   |
| Live validation   | Positive controlled E2E remains deferred for the post-receipt convergence and position-recovery cases below.   |

## Contract and Ownership

- services/copyTrading/api/baseApi.ts owns the shared RTK Query API.
- Endpoint groups own Discovery, Agents, Copy Runs, Copy Accounts, and prepared
  actions. Shared query-parameter mapping stays in api/queryParams.ts.
- adapters and types are the compatibility boundary between API-native
  envelopes/enums and UI models.
- Copy Run list endpoints map to CopyRunListItem. The Copy Run detail endpoint
  maps to CopyRunSummary and owns detail-only Portfolio P&L, fee-breakdown, and
  Copy-specific Win Rate fields.
- Agent position endpoints map to AgentPositionSummary. Follower Copy Run and
  owner position endpoints map to PositionSummary; follower accounting and
  recovery actions must not leak into leader-position models.
- Prepared-action request and response contracts stay together in
  types/preparedActions.ts.
- Owner views map to OWNER_COPY_VIEW_OPEN and OWNER_COPY_VIEW_HISTORY.
- Position views map to POSITION_VIEW_OPEN and POSITION_VIEW_CLOSED.
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

- Closed-position execution details. The closed-executions endpoint is consumed
  internally for Manual Sell and Close Position post-receipt convergence.
- Structured Alerts Feed and Copy Run Log fields beyond the current rows.
- Copy Run cashback policy.
- Agent discovery, Agent position detail/events, owner-wide positions, and
  Copy Account list/detail/balance/position/history screens.

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
- Copy Detail keeps the existing labels. **Realised P&L** reads
  portfolioPnlUsd, **Fee** reads feeBreakdown.feeChargedUsd, and **Rebate**
  reads feeBreakdown.rebatesUsd. Do not add a **Net Fees** card.
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
- The sole status exception is the Capital-card **Syncing** badge driven by
  capitalInProjectionStatus, not by the Capital In metric status.
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
- Transaction hashes are shortened, use neutral styling, include an external
  link icon, and open the matching chain explorer when supported.
- The Open Positions Action header is centered. Other numeric headers and cells
  remain right-aligned.

### Lists and responsive behavior

- Leaderboard, My Copies, and History use cursor pagination. Infinite lists keep
  independent cursor chains and reset rejected non-initial cursors to page one.
- My Copies sorting is server-backed for Agent APR, Agent Win Rate, Agent Volume,
  and Capital In. Header selection cycles descending, ascending, then default.
- Desktop and mobile rows use native links, preserving modified-click,
  context-menu, and new-tab behavior. Independent action buttons remain outside
  the row-link hit target.
- Main tables use content-specific responsive cards and the shared ScrollArea.
- Copy Detail switches Action Logs to cards below md, Open Positions below lg,
  and Closed Positions below xl. Desktop headers stay inside the horizontal
  scroll region so they remain aligned with their table rows.
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
- TRY_PREPARE calls the normal preparation route; it does not expose a separate
  Check availability UI.
- PENDING, UNAVAILABLE, expired, mismatched, or unexpected prepared responses
  fail closed and never reach wallet submission.
- displayEnrichment is render-only contract metadata and intentionally does not
  change the current Prepared Action UI.
- Preparation is authoritative for owner, chain, Smart Wallet, preview, call
  kind, target, value, amount, and expiry.
- Wallet submission uses call.to, call.data, and call.valueRaw unchanged.
- A transaction is successful only after a successful receipt.
- Receipt retry waits for the existing hash and never rebroadcasts.
- A reverted receipt starts a new preparation on Retry.
- Add Capital, Stop Copy, Withdraw Quote, Manual Sell, and Close Position keep
  the modal in its syncing phase after receipt success and poll one direct API
  read per attempt for up to 20 seconds. Add Capital requires the exact Copy
  Detail Capital In to increase; Stop Copy requires its lifecycle to leave
  Active; Withdraw Quote requires Remaining in Wallet to differ from its
  prepared snapshot; and position sells require a closed execution with the
  submitted transaction hash. Projection-backed checks also require
  source-block receipt coverage. A timeout remains recoverable through Refresh
  status.
- For the five non-Start actions, cache invalidation starts after receipt
  success and runs again after the action-specific direct read converges so
  containing lists and summaries refetch from the new projection. Start Copy
  invalidates after receipt and retains its existing Agent-filtered polling.
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
- Each position renders only the API-recommended action, or the first advertised
  action when no recommendation is present.
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

- Controlled positive E2E for Add Capital, Stop Copy, and Withdraw Quote
  post-receipt convergence.
- Controlled positive E2E for active Manual Sell after an Operator skip.
- Controlled positive E2E for active 100% recovery.
- Controlled positive E2E for Close Position on a CLOSING Copy.
- Browser QA for responsive layouts, loading transitions, modified-click/new-tab
  behavior, and the final modal presentation.
- Product decision for exposing the Action Logs Type filter below md; the
  current control is owned by the desktop table header.
- Product design before exposing the API-only surfaces listed above.

The position-recovery E2E cases require controlled Agent positions and
Operator-side skip/failure injection; they cannot be created deterministically
from the frontend.

## Verification Snapshot

Latest checks for the current working tree:

- App TypeScript passed.
- Targeted Copy Trading modal ESLint passed.
- All 87 currently discovered Copy Trading unit tests across 13 files passed.
- Focused formatting passed.
- git diff --check and git diff --cached --check passed.
- The checked-in OpenAPI byte-matched the live 33-path, 155-definition schema;
  SHA-256: b763fcec14aef8f43e78386597b4a8d2842a1b2c69d89ae994f79b1969795933.
- Browser QA, production build, and positive live transaction E2E were not run.
