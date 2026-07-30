# Copy Trading Implementation Status

Last reviewed: 2026-07-31

This document is the source of truth for the current frontend implementation,
live API verification, E2E evidence, and integration concerns. Product entities
and intended flows are documented in `Entities and Flows.md`; the HTTP contract
is documented in `FE_API_Catalog.md` and `openapi.yaml`.

The configured pre-release API is:

```text
https://pre-copy-trade-api.kyberengineering.io/api/v1
```

Live values, action availability, lifecycle distribution, minimum amounts, and
freshness can change. Recheck the service before using a fixture as acceptance
evidence.

## Status Definitions

| Status                        | Meaning                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `IMPLEMENTED`                 | The current frontend calls the real API and handles the required response lifecycle.                                                                   |
| `PROTOTYPE`                   | The UX exists, but uses mock/local behavior and is not a real API integration.                                                                         |
| `PASS E2E`                    | The operation's real positive path was verified end to end; prepared transactions also require the exact call, successful receipt, and indexed result. |
| `API PASS / BUSINESS BLOCKED` | The API returned the expected typed response, but no executable call was available for the current business state.                                     |
| `PREREQUISITE BLOCKED`        | A required live resource such as a pending sell obligation or eligible recovery position was unavailable.                                              |
| `NEEDS RECHECK`               | The result was observed previously but has not been reproduced against the current deployment.                                                         |

## Implementation at a Glance

| Layer                  | Current status                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Checked-in OpenAPI     | Matches the live `/openapi.yaml` document as of 2026-07-31.                                                                                   |
| RTK Query service      | `IMPLEMENTED`: all 24 GET and 8 POST operations are declared and typed.                                                                       |
| Read UI                | Partially implemented: 15 of 24 GET operations have a UI consumer.                                                                            |
| Write UX               | `PROTOTYPE`: Start, Add, Stop, Withdraw, Manual Sell, and Close modals are reachable.                                                         |
| Real write integration | Not implemented: no Copy Trading UI calls the preparation or wallet-session mutation hooks.                                                   |
| Live positive-path E2E | Six of eight POST operations have passed a real positive path. Manual Sell and Close Position still lack an executable positive-path fixture. |

## Contract and Service Coverage

`services/copyTrading/index.ts` uses `fetchBaseQuery` and declares all 32 public
operations:

- 24 GET queries.
- Six transaction-preparation mutations:
  - Start Copy.
  - Add Capital.
  - Stop Copy.
  - Withdraw Quote.
  - Manual Sell.
  - Close Position.
- Two wallet-session mutations:
  - Create Wallet Session Challenge.
  - Create Wallet Session.

`services/copyTrading/adapters.ts` is the compatibility boundary between
API-native envelopes/enums and the existing UI models.

Confirmed service behavior:

- Owner views map to `OWNER_COPY_VIEW_OPEN` and
  `OWNER_COPY_VIEW_HISTORY`.
- Position filters map to `POSITION_VIEW_OPEN`, `CLOSED`, and `LEFTOVER`.
- Agent action logs use `/action-logs`.
- Empty pending-sell obligations normalize `data: null` to an empty list.
- Status-bearing metrics preserve their raw metric objects while renderable
  values are exposed only for `CURRENT` and `STALE`.
- Position display amount prefers `displayBaseRaw`.
- Copy Run lifecycle preserves `ACTIVE`, `CLOSING`, `STOPPED`, and `CLOSED`.
- Position `ACTIVE` and `CLOSING` currently both map to compatibility
  `status: "open"`; the API lifecycle remains available in `trackingStatus`.

## Current UI Read Coverage

The current UI consumes these 15 GET operations:

- Chains.
- Leaderboard summary and leaderboard rows.
- Agent discovery, profile, stats, performance, positions, and action logs.
- Owner copy summary and copy runs.
- Copy Run detail, positions, and performance.
- Owner activity.

The following nine GET operations are declared but have no dedicated Copy
Trading UI consumer:

- Agent position detail.
- Agent position events.
- All owner positions.
- Owner copy-account list.
- Copy-account detail.
- Copy-account balances.
- Copy-account positions.
- Pending sell obligations.
- Copy-account history.

These missing drilldowns are not service gaps. They become blockers for a safe
recovery UX because Manual Sell requires the current pending-obligation FIFO and
all write flows require fresh direct state before preparation.

## Current Write UI: Mock Prototype

The current branch contains:

- `write/WriteContext.tsx`.
- `write/CopyTradeTxModal.tsx`.
- `write/useCopyTradeTx.ts`.
- `modals/SubscribeModal.tsx`.
- `modals/AddCapitalModal.tsx`.
- `modals/StopCopyModal.tsx`.
- `modals/ManagePositionModal.tsx`.

The prototype is connected to leaderboard, agent profile, active copies, Copy
Detail, and position action buttons. It is not connected to the aggregate
preparation API:

- `COPY_TRADE_MOCK_WRITE` is `true`.
- Mock mode generates a fake transaction hash and broadcasts nothing.
- Factory and controller addresses are zero-address placeholders.
- Manual Sell/Close use `mockSigner.ts`, which returns zero swapper/calldata
  values and a fake signature.
- Modals locally ABI-encode calls instead of submitting the exact API-prepared
  call.
- No UI imports or invokes `usePrepareStartCopyMutation`,
  `usePrepareAddCapitalMutation`, `usePrepareStopCopyMutation`,
  `usePrepareWithdrawQuoteMutation`, `usePrepareManualSellMutation`,
  `usePrepareClosePositionMutation`, or either wallet-session hook.
- `useCopyTradeTx` marks a real-mode step complete after broadcast and does not
  wait for a receipt. A multi-step flow could advance before the preceding
  state exists on-chain or in the read model.
- Success closes without polling direct reads or invalidating the affected
  summary/list/detail data.

### Do Not Enable Real Mode as Written

Changing `COPY_TRADE_MOCK_WRITE` to `false` is unsafe:

- Subscribe would target a zero-address factory placeholder.
- The local funding step can transfer a selected token to the placeholder
  factory rather than the API-predicted Copy Account.
- Stop, Manual Sell, Close, and Withdraw would use locally assembled calldata
  that bypasses current server evidence, route construction, authorization,
  deadlines, and typed availability.
- The mock signer is not valid authorization.
- The transaction state labelled `confirmed` is not backed by a receipt wait.

The mock write layer must be replaced by the prepared-action workflow, not
activated by changing one flag.

## Action Integration Matrix

| Capability     | Current UI                                                                                                           | Required real integration                                                                                                                                               | Live API E2E                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Start Copy     | Subscribe modal with mock balance, local factory ABI, zero salt, optional arbitrary token, and a local two-step flow | Call `prepareStartCopy` repeatedly with one UUID and target; submit only the exact returned Create/Fund call; wait for receipt and projector convergence between stages | `PASS E2E`                      |
| Add Capital    | Modal locally calls ERC20 `transfer` for any selected token                                                          | Use the API quote token, minimum, wallet balance, allocation preview, and exact prepared call                                                                           | `PASS E2E`                      |
| Stop Copy      | Modal locally pauses the account and builds one mock-signed sell per selected position                               | Refresh positions, send current `userPositionIds[]` and slippage to `prepareStopCopy`, review the preview, and submit only the returned call                            | `PASS E2E`                      |
| Withdraw Quote | Hidden under the position modal's Advanced section and locally calls `withdrawQuoteToken`                            | Expose at Copy Run/account level, respect `withdrawQuoteAvailability`, and use the exact prepared max-sweep amount and recipient                                        | `PASS E2E`                      |
| Wallet Session | No UI integration                                                                                                    | Sign the exact SIWE message, exchange it once, keep the access token in memory, scope it to owner/chain, and discard it on expiry or `401`                              | `PASS E2E` for both POST routes |
| Manual Sell    | User chooses an arbitrary 25/50/100% ratio; local mock signer builds the call                                        | Require the advertised action, current FIFO obligation count and exact ratio, a valid wallet session, and `prepareManualSell`                                           | `PREREQUISITE BLOCKED`          |
| Close Position | Generic local 100% sell path                                                                                         | Require the advertised full-recovery action, valid wallet session, and `prepareClosePosition`; this is not a generic market sell                                        | `API PASS / BUSINESS BLOCKED`   |

## Live Read Snapshot

Read-only calls were rechecked on 2026-07-31 against the configured API using
the existing Base test owner.

Observed current data:

- `/chains` returns only Base (`8453`) as enabled.
- Leaderboard returns five agents.
- Open view returns four Copy Runs, all
  `COPY_RUN_STATUS_ACTIVE`.
- History returns five Copy Runs, all
  `COPY_RUN_STATUS_CLOSED`.
- Copy-account list returns four `ACTIVE` and five `CLOSED` accounts.
- Owner positions return one
  `POSITION_LIFECYCLE_ACTIVE / POSITION_QUANTITY_STATE_OPEN_FULL` row and eight
  `POSITION_LIFECYCLE_CLOSED / POSITION_QUANTITY_STATE_CLOSED` rows.
- The eight closed rows use `POSITION_EXIT_KIND_ALIGNED`.
- No current row demonstrates `CLOSING`, `STOPPED`, `OPEN_PARTIAL`, `LEFTOVER`,
  Manual Sell availability, or Close Position availability.
- Active Copy Runs advertise Add Capital and Stop Copy as `AVAILABLE`; Withdraw
  is `UNAVAILABLE / ACCOUNT_NOT_STOPPED`.

Lifecycle evidence across snapshots:

```text
COPY_STOPPED
→ EXIT_STARTED when a position must be sold
→ POSITION_CLOSED / EXIT_SUCCEEDED
→ CAPITAL_RETURNED when quote balance is swept
→ the same Copy Run is now returned in History as CLOSED
```

Earlier reads returned `STOPPED` rows in Open while History was empty. The
current reads return those same runs as `CLOSED` in History. The frontend must
therefore treat `STOPPED`/`CLOSING` and view membership as server-owned
convergence state, not locally promote a row to `CLOSED`.

## Live POST E2E Results

The E2E runs used a dedicated burner wallet on Base. Private keys and
wallet-session tokens were kept local and were never written to the repository
or documentation.

| Operation                       | Verified result                                                                                                                                                   | Status                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Create Wallet Session Challenge | HTTP 200 returned the exact SIWE message, opaque challenge token, and expiry                                                                                      | `PASS E2E`                    |
| Create Wallet Session           | Exact message signature exchanged for a Bearer session scoped to owner and chain                                                                                  | `PASS E2E`                    |
| Start Copy                      | Create and Fund calls were broadcast, receipts succeeded, the same UUID/target reached `START_COPY_STAGE_COMPLETE`, and the API indexed an active funded Copy Run | `PASS E2E`                    |
| Add Capital                     | Four exact USDC transfer calls succeeded; activity indexed three `CAPITAL_DEPOSITED` and one `CAPITAL_TOPPED_UP` event                                            | `PASS E2E`                    |
| Stop Copy                       | Five exact Stop calls succeeded, covering zero-position, funded zero-position, and active-position runs                                                           | `PASS E2E`                    |
| Withdraw Quote                  | Vortex returned `1 USDC`; Quantum returned `2.000745 USDC`; both indexed `CAPITAL_RETURNED`                                                                       | `PASS E2E`                    |
| Manual Sell                     | Wallet session and a real position existed, but the authoritative pending-sell-obligation FIFO was empty                                                          | `PREREQUISITE BLOCKED`        |
| Close Position                  | A real active position returned typed `UNAVAILABLE / CLOSE_NOT_ELIGIBLE` with no call                                                                             | `API PASS / BUSINESS BLOCKED` |

Representative on-chain evidence:

| Flow                              | Transaction                                                                                                     |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Start Copy Create                 | [0x1ecf726a…eca9c](https://basescan.org/tx/0x1ecf726aea4b23b31cb4c68f1304d308409b2d0c4b3bee178f6ff10f118eca9c)  |
| Start Copy Fund                   | [0x86a646f0…c9b61c](https://basescan.org/tx/0x86a646f0a6660d8b3a93b849e91f92aa613db86eb0eede96e5b7d47cc6c9b61c) |
| Add Capital                       | [0x74523277…28968](https://basescan.org/tx/0x745232773f8df3788b0e8f1757b693a2faa29e541a29a1aef98b6ad22dc28968)  |
| Stop Copy with an active position | [0xca337bda…20ce9](https://basescan.org/tx/0xca337bdad198d1b7c02d006dc73ae4d715d211113de1052e4a975c861a620ce9)  |
| Position exit                     | [0x966355ba…d732](https://basescan.org/tx/0x966355ba1b7b67175f87391914f8fc26adb20ce48b3f966925890ee2c176d732)   |
| Withdraw Quote                    | [0x6bfa633b…b4c4](https://basescan.org/tx/0x6bfa633b7f319dcdcd98a1611ef8db0e4602d23c9a37d89294049a22f3b7b4c4)   |

These transactions prove API and on-chain behavior. They are not stable test
fixtures and must not be required by frontend tests.

## Integration Concerns

### P0: Replace Local Writes With Prepared Calls

Every real action must follow:

```text
read advisory availability
→ refresh direct entity/account/position state
→ call the matching preparation endpoint
→ inspect status, reason, preview, evidence, and exact call
→ validate account, chain, call kind, target, value, and deadlines
→ submit call.to / call.data / call.valueRaw unchanged
→ wait for a successful receipt
→ poll until the read model advances
→ refetch affected lists and summaries
```

Never reconstruct calldata from preview fields or keep the current local ABI
path as a fallback.

### P0: Match Product Input Semantics

- Start and Add use the fixed quote token returned by preparation. The current
  arbitrary token selector implies a swap-in path that does not exist.
- The live service currently advertises only Base, while the local prototype
  lists Ethereum, BNB Chain, and Base.
- Minimum amounts and wallet quote balance come from preparation; do not
  hard-code `1 USDC` as a permanent rule.
- The prototype hard-codes an `8%` fee label, while preparation returns a typed
  fee policy. Do not conflate an upfront fee policy with a performance-fee label.
- Stop Copy allows an empty `userPositionIds[]` selection. The current modal
  disables Stop when there are zero positions.
- Manual Sell ratio is not a user-selected percentage. It must come from the
  current pending-obligation FIFO.
- Withdraw recipient and sweep amount are prepared server state, not arbitrary
  client fields.

### P0: Fail Closed on Availability and Prepared Status

- Leaderboard Copy currently ignores `startCopyAvailability`.
- Add and Stop buttons do not enforce their run-level advisory availability.
- Missing/unspecified/PENDING availability must disable execution.
- Read availability can lag behind chain/projector state. The newest prepare
  response remains authoritative.
- `PENDING`, `UNAVAILABLE`, or an unrecognized call kind must never reach wallet
  submission.

### P0: Receipt, Convergence, and Idempotency

- Do not label a broadcast transaction as confirmed before its receipt succeeds.
- Multi-stage Start must wait for receipt and read-model convergence before
  preparing the next stage.
- Re-prepare after convergence; never rebroadcast an earlier prepared stage.
- Add Capital completion must use receipt, transaction hash/nonce, capital
  activity, and allocated capital. Copy-account token balance is not an
  idempotency guard because the execution engine can spend deposited quote
  immediately.
- Bound polling and expose retry/manual refresh when source coverage remains
  behind.

### P0: Wallet Session Security

- Manual Sell and Close Position require a wallet session; the other actions do
  not.
- Sign the exact server-provided SIWE message as an Ethereum personal message.
- Keep challenge tokens, signatures, and access tokens out of local storage,
  URLs, analytics, telemetry, service-worker caches, and error reports.
- Store the access token in memory only and discard it on expiry, owner/chain
  change, or `401`.

### P1: Performance Query Compatibility

Agent Profile and active Copy Detail can still send:

```text
window=WINDOW_ALL
interval=PERFORMANCE_INTERVAL_DAY
```

The API accepts `WINDOW_ALL` only with weekly or monthly intervals for the
portfolio-equity and cumulative-realised-PnL series. Copy Detail already forces
monthly for a closed run, but its active window selector and Agent Profile still
allow the invalid combination.

Affected files:

- `AgentProfile/AgentStats.tsx`.
- `CopyDetail/CopyRunPerformance.tsx`.
- `components/PerformanceCharts.tsx`.

### P1: Pagination, Errors, and Freshness

- Only the leaderboard implements cursor navigation. Most other list consumers
  request one page.
- Read screens often render a failed request as an empty state or redirect as if
  data were not found.
- Stale metrics/valuations are preserved but usually look identical to current
  data.
- `UNAVAILABLE` must remain `—`; it must not become a fabricated zero.
- Alerts Feed displays `LIVE` without polling.

### P1: Typed Activity and Lifecycle Mapping

- `ActivityRow` models typed detail variants as `Record<string, unknown>`.
- Alerts Feed parses display summary text to infer P&L direction; business logic
  must use `type` and the typed detail payload.
- `isCopyRunClosed` treats both `STOPPED` and `CLOSED` as closed and drives the
  Copy Detail layout and chart query. The live API later moved observed
  `STOPPED` runs to `CLOSED`; components needing exact lifecycle or action
  eligibility must not use this compatibility helper as authoritative state.
- The position adapter collapses API `ACTIVE` and `CLOSING` into compatibility
  `status: "open"`. Components needing exact lifecycle must use
  `trackingStatus`, and action logic must use the direct API entity.
- `OPEN`, `CLOSED`, and `LEFTOVER` list views are filters, not lifecycle values.

### P2: Remaining Model and UI Gaps

- OpenAPI supports `LEADERBOARD_SORT_FIELD_OPEN_POSITIONS`, but the frontend
  sort type/map/header omit it.
- Strategy categories can overlap, while some UI surfaces show only one badge.
- Sidebar active-agent matching uses display name rather than canonical
  `agentId`.
- Leaderboard search is not debounced.
- Performance charts combine both series' error/loading state.
- Agent portfolio equity is labelled `Assets Under Management ($)`, although
  portfolio equity and follower AUM are distinct API metrics.
- Disconnected owner screens render empty content instead of a dedicated wallet
  state.

## API Behavior and Open Concerns

| Observation                                                                | Current assessment                                                                                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Start Copy below minimum previously returned HTTP 500                      | Resolved in the 2026-07-31 recheck: HTTP 200 typed `UNAVAILABLE / AMOUNT_BELOW_MINIMUM`, minimum `1000000` raw     |
| Stopped runs previously remained in Open and History was empty             | Converged: the same runs now return `CLOSED` in History; FE must still rely on server-owned views                  |
| Manual Sell with synthetic inputs and no real obligation returned HTTP 500 | `NEEDS RECHECK`; a compliant FE must block before preparation when the FIFO is empty                               |
| Prepare calls temporarily returned HTTP 500 while projectors converged     | Integration concern; retry only after an appropriate retryable response/time and never rebroadcast an earlier call |
| Read advisory availability lagged behind authoritative preparation         | Expected integration concern; prepare response wins                                                                |
| Close Position returned `UNAVAILABLE / CLOSE_NOT_ELIGIBLE`                 | Correct typed negative path; positive E2E remains blocked on a genuinely eligible position                         |

## Recommended Implementation Order

1. Keep mock mode enabled until the local ABI/signer path is removed.
2. Build one shared prepared-action runner with validation, receipt waiting,
   bounded re-preparation, convergence polling, and refetch.
3. Integrate Start Copy's Create/Fund/Complete loop.
4. Integrate Add Capital, Stop Copy, and Withdraw Quote using their exact
   prepared previews and calls.
5. Implement in-memory wallet-session management.
6. Add copy-account/position drilldowns and pending-obligation reads.
7. Integrate Manual Sell and Close Position only when the API advertises them.
8. Fix performance interval selection, typed activity details, pagination,
   freshness, errors, and disconnected-wallet states.
9. Add unit tests for prepared-call validation and integration tests for
   receipt/convergence state machines.
10. Run positive-path Manual Sell and Close Position E2E when genuine business
    fixtures become available.

## Verification Performed During This Review

- Compared checked-in `openapi.yaml` with the live `/openapi.yaml`: no diff.
- Recounted the service surface: 24 GET queries and 8 POST mutations.
- Searched the Copy Trading UI for preparation/wallet-session hook consumers:
  none.
- Rechecked live `/chains`, leaderboard, Open/History copy runs, copy accounts,
  and owner positions.
- Rechecked below-minimum Start preparation without submitting its returned
  call: HTTP 200 typed `AMOUNT_BELOW_MINIMUM`.
- Inspected every current write modal, transaction helper, placeholder config,
  and mock signer.

No prepared transaction was submitted and no on-chain state was changed during
this documentation review.

## Write-Flow Test Safety

- Never paste, print, or commit a private key.
- Use a dedicated burner wallet with minimal funds for E2E.
- Keep wallet-session access tokens in memory only.
- Validate every prepared call before wallet submission and submit it unchanged.
- A successful preparation is not a completed action. Require a successful
  receipt and indexed read-model evidence.
- Requery live state after every transaction before updating a point-in-time E2E
  report.
