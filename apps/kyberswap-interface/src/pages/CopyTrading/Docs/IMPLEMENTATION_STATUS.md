# Copy Trading Implementation Status

Last reviewed: 2026-08-03

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

| Layer                  | Current status                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Checked-in OpenAPI     | Refreshed from the live `/openapi.yaml` document on 2026-08-03.                                                                                              |
| RTK Query service      | `IMPLEMENTED`: all 24 GET and 8 POST operations are declared and typed.                                                                                      |
| Read UI                | Partially implemented: 18 of 24 GET operations have a UI consumer.                                                                                           |
| Write UX               | `PROTOTYPE`: Start, Add, Stop, and Manage Position modal paths exist; legacy Withdraw is nested in Manage Position, while Smart Wallet Withdraw is disabled. |
| Real write integration | Not implemented: no Copy Trading UI calls the preparation or wallet-session mutation hooks.                                                                  |
| Live positive-path E2E | Six of eight POST operations have passed a real positive path. Manual Sell and Close Position still lack an executable positive-path fixture.                |

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
- Position `ACTIVE` and `CLOSING` both map to compatibility `status: "open"`;
  exact API lifecycle is preserved separately in `lifecycle`.

## Current UI Read Coverage

The current UI consumes these 18 GET operations:

- Chains.
- Leaderboard summary and leaderboard rows.
- Agent profile, stats, performance, positions, and action logs.
- Owner copy summary and copy runs.
- Copy Run detail, positions, and performance.
- Owner activity.
- Copy-account detail, balances, positions, and history through the stopped-run
  Copy Smart Wallet surface.

The following six GET operations are declared but have no dedicated Copy
Trading UI consumer:

- Agent discovery (`GET /agents`). The current Agent List uses the distinct
  qualification-ranked `GET /leaderboard` collection.
- Agent position detail.
- Agent position events.
- All owner positions.
- Owner copy-account list.
- Pending sell obligations.

These are product-surface gaps, not service gaps. Pending sell obligations are a
hard prerequisite for Manual Sell. Agent position detail/events and owner-wide
position/account lists need an agreed drilldown or collection owner; they are
not blanket prerequisites for every write action. Each write flow must still
refresh its own direct run/account/position state before preparation.

Current primary-screen read behavior:

- `WINDOW_ALL` uses monthly performance intervals; shorter windows use daily
  intervals.
- Copy Run badges preserve `ACTIVE`, `CLOSING`, `STOPPED`, and `CLOSED`.
- Position lifecycle and quantity state render independently from typed fields.
- Open and History remain server-owned Copy Run views. The History screen shows
  only the History Copy Run summary and one Copy History table.
- Agent Positions, Agent History, Action Logs, My Copies, Copy History, Copy Run
  positions, Alerts Feed, and Copy Smart Wallet cursor collections use infinite
  scroll inside bounded scroll containers.
- Cursor lists use TanStack `useInfiniteQuery` for the page/cursor chain and
  invoke the existing RTK lazy query trigger from `queryFn`; page components no
  longer maintain manual cursor arrays. The default container max height is
  `480px`; Alerts Feed uses `360px`.
- Copy Smart Wallet owns independent cursor chains for balances, open positions,
  and account history.
- Agent and Copy Run performance charts still request only the first page with
  `limit=100`. The Sidebar also uses bounded `limit=100` leaderboard/open-run
  snapshots rather than a cursor chain. These are documented read-pagination
  gaps, not completed infinite-scroll surfaces.
- The shared infinite-scroll hook does not yet expose an error/retry state or
  restart from page one after a rejected/expired cursor.
- Copy-run rows use their `agentSnapshot`; My Copies and History no longer issue
  a redundant `/agents?limit=100` request.
- Activity details are typed and Alerts Feed no longer parses display summary
  text for P&L direction.
- Generic `sell_unaligned` activity renders as `Owner Sell`; Stop Copy remains
  an amount-less lifecycle row separate from downstream position/execution rows.
- Summary KPI cards identify `STALE` metrics; unavailable values remain `—`.
- Agent search is debounced, Open Positions is sortable, overlapping strategy
  categories render separately, and Sidebar agent matching uses `agentId`.
- Agent Profile and Copy Detail show the logo loader only while their initial
  detail request is pending. Existing table, tab, chart, feed, and background
  refetch loading behavior is unchanged.
- Owner screens show a dedicated disconnected-wallet state.

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

| Capability     | Current UI                                                                                                                                | Required real integration                                                                                                                                                                      | Live API E2E                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Start Copy     | Subscribe modal with mock balance, local factory ABI, zero salt, optional arbitrary token, and a local two-step flow                      | Call `prepareStartCopy` repeatedly with one UUID and target; submit only the exact returned Create/Fund call; wait for receipt and projector convergence between stages                        | `PASS E2E`                      |
| Add Capital    | Modal locally calls ERC20 `transfer` for any selected token                                                                               | Use the API quote token, minimum, wallet balance, allocation preview, and exact prepared call                                                                                                  | `PASS E2E`                      |
| Stop Copy      | Modal locally pauses the account and builds one mock-signed sell per selected position                                                    | Refresh positions, send current `userPositionIds[]` and slippage to `prepareStopCopy`, review the preview, and submit only the returned call                                                   | `PASS E2E`                      |
| Withdraw Quote | Smart Wallet exposes a disabled CTA; a legacy mock action remains under Manage Position → Advanced and locally calls `withdrawQuoteToken` | Replace the nested local-ABI path, enable the account-level CTA only through the prepared flow, respect `withdrawQuoteAvailability`, and use the exact prepared max-sweep amount and recipient | `PASS E2E`                      |
| Wallet Session | No UI integration                                                                                                                         | Sign the exact SIWE message, exchange it once, keep the access token in memory, scope it to owner/chain, and discard it on expiry or `401`                                                     | `PASS E2E` for both POST routes |
| Manual Sell    | User chooses an arbitrary 25/50/100% ratio; local mock signer builds the call                                                             | Require the advertised action, current FIFO obligation count and exact ratio, a valid wallet session, and `prepareManualSell`                                                                  | `PREREQUISITE BLOCKED`          |
| Close Position | Generic local 100% sell path                                                                                                              | Require the advertised full-recovery action, valid wallet session, and `prepareClosePosition`; this is not a generic market sell                                                               | `API PASS / BUSINESS BLOCKED`   |

## Live Read Snapshot

Read-only calls were rechecked on 2026-08-03 against the configured API using
the existing Base test owner. This is diagnostic evidence as of that date, not
a stable fixture.

Observed snapshot:

- `/chains` returns only Base (`8453`) as enabled.
- Leaderboard returns five agents.
- Open view returns four Copy Runs: three `COPY_RUN_STATUS_ACTIVE` and one
  `COPY_RUN_STATUS_STOPPED`.
- The stopped Open run reports three open positions and three leftover
  positions. Its Withdraw advisory state is `PENDING`.
- History returns five Copy Runs, all
  `COPY_RUN_STATUS_CLOSED`.
- Copy-account list returns three `ACTIVE`, one `STOPPED`, and five `CLOSED`
  accounts.
- Owner positions return seven
  `POSITION_LIFECYCLE_ACTIVE / POSITION_QUANTITY_STATE_OPEN_FULL` rows and 45
  `POSITION_LIFECYCLE_CLOSED / POSITION_QUANTITY_STATE_CLOSED` rows; three of
  the active rows are marked leftover.
- No current row demonstrates `CLOSING`, `OPEN_PARTIAL`, Manual Sell
  availability, or Close Position availability.
- Active Copy Runs advertise Add Capital and Stop Copy as `AVAILABLE`; Withdraw
  is `UNAVAILABLE / ACCOUNT_NOT_STOPPED`.

Lifecycle evidence across snapshots:

```text
COPY_STOPPED
→ EXIT_STARTED when a position must be sold
→ POSITION_CLOSED / EXIT_SUCCEEDED
→ no ACTIVE / CLOSING / LEFTOVER position remains
→ the Copy Run becomes eligible for the server-owned History view

CAPITAL_RETURNED is a separate Withdraw/return activity and is not a History-membership gate
```

The current snapshot simultaneously demonstrates a `STOPPED` run with residue
positions in Open and terminal `CLOSED` runs in History. View membership is
server-owned: Open retains stopped runs while any active, closing, or leftover
position remains, and History begins when the authoritative projection reports
none. Quote balance alone does not keep a run in Open. The frontend must not
locally promote a row to `CLOSED` or move it between views.

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

- Leaderboard Copy currently ignores `startCopyAvailability`; Agent Profile
  only disables when an explicit non-available status is present.
- Add Capital partially enforces explicit non-available status, but missing or
  unspecified availability still fails open. Stop Copy does not enforce its
  run-level advisory availability and remains visible for every Open-view row,
  including `CLOSING` or `STOPPED` rows.
- Missing/unspecified/PENDING availability must disable execution.
- Read availability can lag behind chain/projector state. The newest prepare
  response remains authoritative.
- `PENDING`, `UNAVAILABLE`, or an unrecognized call kind must never reach wallet
  submission.

### P0: Prepared Smart Wallet Identity and Quote Lifetime

- The service types now include `PreparedAction.copyAccount`, per-position
  `swapQuote`, Stop Copy `totalSwapQuote`, and Manual Sell/Close Position
  `swapQuote`. The mock write UI does not consume them yet.
- For every non-Start action, `PreparedAction.copyAccount` must equal the
  selected Copy Run/Smart Wallet. For Start funding/completion, it must equal
  `startCopy.predictedCopyAccount`. It is not interchangeable with `call.to` or
  `expectedAccount`.
- Render expected/minimum quote from the returned preparation and preserve each
  metric status. Optional `effectiveSlippageBps: 0` is a real value.
- Stop Copy has per-position slippage only. Do not average it into an aggregate
  slippage for `totalSwapQuote`.
- Quote previews expire with the parent preparation at `reprepareAfter` and,
  when present, `liquidationConfigDeadline`. Discard and reprepare after expiry
  or any relevant position/account change.

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

Resolved in the current read UI:

```text
window=WINDOW_ALL
interval=PERFORMANCE_INTERVAL_MONTH
```

Both Agent Profile and Copy Detail derive the interval from the effective
window, so an active run selecting All no longer sends the invalid daily
combination.

### P1: Infinite Scroll, Errors, and Freshness

- Primary cursor-list surfaces now use bounded infinite-scroll containers backed
  by `useInfiniteQuery`. Copy Smart Wallet also owns independent cursor chains
  for balances, open positions, and account history. The six unowned GET
  operations listed above still need a product surface.
- Performance charts and the Sidebar's bounded collection snapshots do not yet
  follow cursor pages. The Stop prototype also reads only the first position
  page; the real Stop integration must load the complete selectable set before
  preparation.
- Infinite-scroll failures are not yet rendered with retry/restart behavior. In
  particular, an expired or rejected cursor must discard the sequence and
  restart from page one with the current filters.
- Initial logo loading is intentionally limited to Agent Profile and Copy
  Detail. Existing loading/error/empty behavior remains unchanged elsewhere.
- KPI cards identify stale metrics. Position-level stale valuation indication is
  still a future polish item.
- `UNAVAILABLE` must remain `—`; it must not become a fabricated zero.
- Alerts Feed no longer displays `LIVE` because it does not poll.

### P1: Typed Activity and Lifecycle Mapping

- `ActivityRow` has typed copy-lifecycle, position, capital, fee, and execution
  detail variants.
- Alerts Feed uses the typed position detail for realized P&L direction.
- Smart Wallet Activity and Alerts Feed label generic `sell_unaligned` rows as
  `Owner Sell`, and render Deposit, Add Capital, Withdraw Quote, and Returned
  Capital as distinct action labels.
- Stop Copy renders as its own amount-less lifecycle activity; token-specific
  exit/reduction/closure rows remain independent.
- Copy Detail treats only `CLOSED` as closed. `STOPPED` is not locally promoted
  to `CLOSED`, and `isCopyRunClosed` has been removed.
- `my-copies/:copyId` renders Open Copy Detail for `ACTIVE`/`CLOSING` and Copy
  Smart Wallet for `STOPPED`. A direct `CLOSED` response is redirected to the
  canonical `history/:copyId` detail route.
- Copy Smart Wallet reads direct account summary, balances, open positions, and
  account history. Position recovery buttons remain driven by advertised API
  action kinds; Withdraw remains disabled until its prepared write flow is
  integrated.
- The position adapter keeps compatibility `status: "open"` for both `ACTIVE`
  and `CLOSING`, while preserving exact lifecycle in `lifecycle`. UI status
  rendering now uses the exact lifecycle field.
- `OPEN`, `CLOSED`, and `LEFTOVER` list views are filters, not lifecycle values.

### P2: Remaining Model and UI Gaps

- Performance charts combine both series' error/loading state.
- Position-level stale valuation indication is not yet rendered.
- The six remaining discovery/drilldown GET operations need an agreed route,
  tab, drawer, or expandable-row owner before UI implementation.
- Responsive and keyboard behavior still require browser validation with
  representative multi-page data.

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
6. Add the remaining position/account drilldowns and pending-obligation reads.
7. Integrate Manual Sell and Close Position only when the API advertises them.
8. Assign UI ownership for the remaining read-only drilldowns, then implement
   their cursor, freshness, and direct-entity states.
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
  and owner positions on 2026-08-03.
- Rechecked below-minimum Start preparation without submitting its returned
  call: HTTP 200 typed `AMOUNT_BELOW_MINIMUM`.
- Inspected every current write modal, transaction helper, placeholder config,
  and mock signer.
- Implemented the primary-screen read corrections above and ran app TypeScript,
  Copy Trading ESLint, Prettier, and `git diff --check`.
- Browser-smoked Agent Profile, the All performance window, stale KPI
  indication, Open Positions sorting, and the disconnected My Copies state
  against the local app. Copy Detail and multi-page owner cursors still need a
  connected test wallet fixture.

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
