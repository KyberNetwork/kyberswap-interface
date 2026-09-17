# Copy Trading Implementation Status

Last reviewed: 2026-09-17

Frontend ownership, accepted behavior and remaining work for the current
implementation. API contracts belong in [FE_API_Catalog.md](FE_API_Catalog.md)
and [openapi.yaml](openapi.yaml); this document does not establish live backend
compatibility or transaction E2E.

Leaderboard, Agent Profile, My Copies, History, Copy Detail and the seven write
actions below are implemented. Browser and controlled transaction validation
remain open.

## Ownership

| Responsibility                         | Owner                                                                                                                                                                |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API transport and endpoint definitions | [baseApi.ts](../../../services/copyTrading/api/baseApi.ts) and [endpoints](../../../services/copyTrading/api/endpoints)                                              |
| API-to-UI model boundary               | [adapters](../../../services/copyTrading/adapters) and [types](../../../services/copyTrading/types); keep leader positions separate from follower accounting/actions |
| Page identity and required reads       | [AgentProfile](../AgentProfile/index.tsx), [CopyDetail](../CopyDetail/index.tsx); Copy Detail tab reads live in [CopyDetailTabs](../CopyDetail/CopyDetailTabs.tsx)   |
| Cursor collections                     | [InfiniteScroll](../components/InfiniteScroll/index.tsx) owns TanStack pagination over RTK Query requests                                                            |
| Cross-cache refresh                    | [useRefreshCopyTrading](../hooks/useRefreshCopyTrading.ts) invalidates RTK Query and TanStack Copy Trading reads                                                     |
| Start eligibility                      | [generations.ts](../generations.ts), shared by list, profile and Start modal                                                                                         |
| Write orchestration                    | [usePreparedAction](../modals/PreparedActionModal/usePreparedAction.ts) owns preparation handling, submission, receipt/status recovery and refresh                   |
| Action-specific rules                  | Action hooks/modals own inputs, request construction, domain validation and result navigation; they delegate execution to the shared flow                            |

Withdrawal inventory and display-only preview reads live in
[useWithdrawalData](../modals/WithdrawModal/useWithdrawalData.ts). Withdrawal
hooks do not own a separate submission or convergence implementation.

## Product decisions to preserve

- An API addition does not authorize new UI or steps. Generation metadata and
  `displayEnrichment` remain implicit; no generation selector, extra fee rows or
  enrichment warnings are introduced.
- Target the deployed contract. Do not restore retired-schema fallbacks without
  a deployment requirement.
- Agent Profile and Copy Detail display the static `agent.flatFeeRatePct`,
  independently of Start availability. Start Review uses the prepared fee preview.
- `AVAILABLE` and `TRY_PREPARE` use the normal action CTA and preparation flow.
  Preparation decides whether the action can execute; there is no separate
  availability-check step.

### Generation identity

- Resolve exactly one eligible generation by matching chain capabilities and
  agent availability. Multiple eligible generations remain unavailable; never
  choose by array order or generation ID.
- Start refreshes chain/agent data within preparation and pins the generation
  to its attempt. All preparation results require `generationId`; existing-account
  actions match known run provenance without inventing missing provenance.
- Executable preparation and submission recheck generation lifecycle and
  capabilities. Read-only generations cannot execute. The policy helper permits
  authoritative funding continuation during retirement, but the current Start UI
  only supports funded Create.
- Start keeps request/permit identity across retries of the same attempt and
  resets it when its scope changes. Post-authorization responses use the same
  shared preparation handler. `UNAVAILABLE` is validated without requiring a
  call and never pins the predicted Smart Wallet.

## Read behavior

### Ownership and navigation

- Copied/My Copy state comes from the current owner's latest Open Copy Run for
  that Agent. Only `ACTIVE` produces My Copy; other statuses retain the
  advisory-gated Copy action. Agent Profile queries this with `limit=1`.
- Copy Run rows use `agentSnapshot`; Copiers and Active Copies remain
  backend-provided metrics, not counts derived from an owner's list.
- Agent Profile is public. Copy Detail requires a wallet. Wallet restoration
  suppresses the disconnected state.
- Row navigation uses native links so modified-click and new-tab behavior work;
  independent action buttons stay outside the row-link hit target.

### Loading and errors

- Wallet/entity-sensitive reads use `currentData`. Never render a previous
  wallet, Agent or Copy as the current entity.
- Required initial reads show the page loader. Transient background failures
  retain current content; charts also retain their data while switching windows.
- Agent Profile and Copy Detail never redirect automatically on read failure.
  Network/server failures offer Try again for missing reads only. Copy Detail
  loads its Copy Run before retrying the dependent Agent read.
- Missing route IDs and primary-resource HTTP 403/404 show an error without an
  inline button; the page-header Back to remains available. A failed owner
  Copy Runs lookup does not make the public Agent unavailable.
- [CopyTradingReadError](../components/common/status.tsx) takes an explicit
  `resourceUnavailable` flag and an `onRetry` callback; callback presence does not
  determine the error state.
- Rejected non-initial cursors restart the collection from page one. Filter and
  sort changes get independent cursor chains; recovery does not add a UI step.

### Metric and action sources

| Display                                  | Source / rule                                                                                         |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Leaderboard ROI                          | Agent `roiPct`                                                                                        |
| My Copies / Copy Detail ROI and Win Rate | Copy Run metrics, not the Agent snapshot; Win Rate has no sort because the API sort is Agent-specific |
| Copy Detail Total P&L / Realised P&L     | `totalPnlUsd` / `portfolioPnlUsd`                                                                     |
| Copy Detail Net Fees                     | `feeBreakdown.netFeesUsd`; tooltip uses `feeChargedUsd` and `rebatesUsd`                              |
| Open / Closed Position P&L               | `unrealizedPnlUsd` and `unrealizedPnlPct` / `realizedPnlUsd`                                          |
| Capital In                               | `capitalInUsd`, independently of projection status                                                    |
| Remaining in Wallet                      | Wallet-inventory authoritative total, never a sum of visible rows                                     |

- `CURRENT` and `STALE` render alike; unavailable metrics stay N/A or —.
  The capital-card Syncing badge depends only on `capitalInProjectionStatus`.
  Tables and modal summaries do not add that badge.
- ROI, chart Return and History Total Return remain distinct. Closed-position
  counts never fall back to open counts. Lifecycle and historical metrics remain
  server-owned; a withdrawal does not fabricate closed trades or adjust totals locally.
- `CLOSING` is presented as Stopped Copy in the capital card, while recovery
  still uses the backend lifecycle.
- Position recovery uses `actionKind`, or `availableActionKinds[0]` when no
  recommendation exists. Never reorder actions to prefer a frontend default.
- Action Logs use server category/subtype filters in the query key. Token and
  amount come from their matching activity detail; missing values remain missing.

## Write behavior

| Action              | Accepted behavior                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start Copy          | Funded Create; Permit/Approve and Create are separate user actions. Start completion uses the returned `copyRunId`.                                                        |
| Add Capital         | Validates, prepares and submits directly, without an intermediate review.                                                                                                  |
| Stop Copy           | Loads the complete open-position cursor chain on opening; accepts 0–32 selected IDs. Unchecked tokens remain in the Smart Wallet.                                          |
| Withdraw Quote      | Typed/Half use a positive raw amount; Max sends `uint256.max`. Review displays the prepared amount, never the sentinel.                                                    |
| Withdraw All Tokens | Uses `ALL_INDEXED_TOKENS`, validates 1–100 unique tokens and current raw balances, and warns that execution permanently stops copying. Zero balances remain valid.         |
| Manual Sell         | Uses pending FIFO obligations and `ALIGN_SKIP` for active skipped-sell recovery.                                                                                           |
| Close Position      | Full recovery uses `ALIGN_SKIP` for active runs and `STOP_COPY` for CLOSING runs. CLOSING recovery uses the position already loaded by Copy Detail and returns to History. |

- Start and Add Capital share amount parsing, minimum/balance validation and
  percentage presets. Start authorization labels remain Permit/Approve;
  preparation displays Preparing, then Start Copying when authorization is done.
- Stop does not reload positions immediately before preparing. Incomplete cursor
  data blocks preparation. Position recovery shares the sell review but retains
  its action-specific input validation and exact token amounts.
- On `SELL_OBLIGATION_CHANGED`, Retry discards the old preparation, reloads FIFO
  and returns to the form. The user reviews quantities before preparing again;
  a failed reload leaves the action blocked.

### Withdrawal preview and execution

- One modal defaults to All Tokens and offers Stable only. Switching preserves
  the Stable amount but resets prepared calls. Each option uses its own advisory.
- The display-only All Tokens preview is scoped to the modal instance, loaded
  once without polling, and discarded on close. Switching options or returning
  from review does not refetch it. Clicking Withdraw prepares a fresh call.
- Prepared token selection, recipient and raw balances authorize execution.
  Price/rebate enrichment and gas estimates are display data. A preview failure
  blocks execution without blocking Connect Wallet or Switch Network.
- Each All Tokens action completes one transaction. `hasMoreTokens` does not
  trigger another batch; reopen the modal for another preview/preparation.
  Success does not imply that the Smart Wallet is empty.

### Shared submission and recovery

- Validate owner, chain, generation, Smart Wallet, preview, call kind, amounts
  and expiry before submission. Simulate and submit the exact prepared
  `call.to`, `call.data` and `call.valueRaw`.
- Only executable preparations reach the wallet. Pending/unavailable results
  enter recovery; expired or mismatched preparations cannot submit. A valid
  `COMPLETED` preparation uses the shared success path.
- After a successful receipt, [postReceipt](../modals/PreparedActionModal/postReceipt.ts)
  polls `actions:status` with the original `statusContext` and resolved receipt
  hash, including replacement transactions. Never rebuild context from current
  page data; preparation expiry does not block status observation.
- Backend `SUCCEEDED` plus a result establishes success; Stop also requires
  `stopIntentId`. The frontend does not infer convergence from balances, capital,
  lifecycle or closed executions. Polls are bounded, follow `retryAfterMs` and
  carry the last receipt reference within the sequence.
- Unconfirmed receipts and unresolved status retain the saved action/hash.
  Receipt/status Retry observes the submitted transaction without preparing or
  broadcasting again. HTTP errors end the poll sequence and offer manual retry.
  A reverted receipt or verified `FAILED` status instead requires fresh preparation.
- Refresh both read caches after receipt success and again after backend success.
  Refresh failure does not invalidate verified transaction success. Stop's final
  Copy Run read only chooses its navigation destination.

## Known limits and remaining work

- **Read/cache ownership remains mixed:** TanStack cursor collections wrap RTK
  Query requests. Keep invalidation of both caches until that ownership is
  consolidated; the write-flow refactor did not resolve this maintenance finding.
- No automatic `nextStep` continuation, withdrawal batching or transaction
  persistence/resume across reloads.
- Action Logs Type filtering is currently in the desktop header (`lg` and above),
  absent from card layouts. Exposing it there needs a product decision.
- API-only surfaces need product design before dedicated UI: cashback policy,
  closed-position executions, Agent position detail/events, owner-wide positions
  and Copy Account management screens.
- Browser QA remains open for responsive layouts, loading transitions, navigation
  and modal presentation. Controlled transaction E2E remains open for the seven
  actions, especially post-receipt recovery, replacement hashes and repeated
  All Tokens withdrawals. Position recovery requires Operator skip/failure fixtures.

## Verification

Latest completed static checks (2026-09-17): app TypeScript, Copy Trading ESLint,
`git diff --check`, and **156 tests across 16 files** passed. This is not browser
or live transaction evidence.

Run from `apps/kyberswap-interface` after logic changes:

```sh
pnpm exec tsc --noEmit
pnpm exec eslint src/pages/CopyTrading src/services/copyTrading --ext ts,tsx
pnpm exec vitest run src/services/copyTrading src/pages/CopyTrading
```

Keep unit coverage focused on financial validation, API model semantics and
recovery/ownership regressions. Avoid duplicating static mappings or testing
presentation-only details that do not protect those behaviors.
