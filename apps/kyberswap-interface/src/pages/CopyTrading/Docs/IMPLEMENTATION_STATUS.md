# Copy Trading Implementation Status

Last reviewed: 2026-08-04

This document tracks the current frontend implementation and remaining product
or UI work. Product entities and intended flows are documented in
`Entities and Flows.md`; the HTTP contract is documented in `FE_API_Catalog.md`
and `openapi.yaml`.

All 24 GET and 8 POST Copy Trading API operations are operational.

## Implementation at a Glance

| Layer              | Current status                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checked-in OpenAPI | `IMPLEMENTED`: 32 public operations are documented.                                                                                                           |
| RTK Query service  | `IMPLEMENTED`: all 24 GET and 8 POST operations are declared and typed.                                                                                       |
| Read UI            | Partially implemented: 19 of 24 GET operations have a UI consumer; pending obligations are consumed by Manual Sell rather than a standalone read-only screen. |
| Write UX           | `IMPLEMENTED`: Start, Add, Stop, Withdraw, Manual Sell, and Close Position use the prepared-action workflow.                                                  |
| Write integration  | `IMPLEMENTED`: exact API-prepared calls, receipt-success completion, Start stage continuation, wallet sessions, and asynchronous cache refresh are connected. |
| API availability   | `OPERATIONAL`: all declared read, preparation, and wallet-session operations are working.                                                                     |

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

The current UI consumes these 19 GET operations:

- Chains.
- Leaderboard summary and leaderboard rows.
- Agent profile, stats, performance, positions, and action logs.
- Owner copy summary and copy runs.
- Copy Run detail, positions, and performance.
- Owner activity.
- Copy-account detail, balances, positions, and history through the stopped-run
  Copy Smart Wallet surface.
- Pending sell obligations through the Manual Sell recovery modal. The complete
  cursor-backed FIFO is preparation input, not a user-selected sell ratio.

The following five GET operations are declared but have no dedicated Copy
Trading UI consumer:

- Agent discovery (`GET /agents`). The current Agent List uses the distinct
  qualification-ranked `GET /leaderboard` collection.
- Agent position detail.
- Agent position events.
- All owner positions.
- Owner copy-account list.

These are product-surface gaps, not service gaps. They need an agreed route,
tab, drawer, collection, or drilldown owner before implementation.

Current primary-screen read behavior:

- `WINDOW_ALL` uses monthly performance intervals; shorter windows use daily
  intervals.
- Copy Run badges preserve `ACTIVE`, `CLOSING`, `STOPPED`, and `CLOSED`.
- Position lifecycle and quantity state render independently from typed fields.
- Open and History remain server-owned Copy Run views. The frontend does not
  locally move rows between them.
- Agent Positions, Agent History, Action Logs, My Copies, Copy Run positions,
  Alerts Feed, and Copy Smart Wallet cursor collections use infinite scroll
  inside bounded scroll containers.
- Copy History uses cursor-backed Previous / Page N / Next pagination with 5
  rows per page. The API does not expose a total count, so the UI does not
  invent numbered last-page navigation.
- Cursor lists use TanStack `useInfiniteQuery` for the page/cursor chain and
  invoke the existing RTK lazy query trigger from `queryFn`.
- Copy Smart Wallet owns independent cursor chains for balances, open positions,
  and account history.
- Agent and Copy Run performance charts intentionally request only the first
  page with `limit=100`.
- Sidebar Agents and Open Copies are product-capped snapshots with `limit=10`.
- Infinite-scroll Retry resets the exact TanStack query, discards the failed
  cursor sequence, and restarts from page one with the current query key.
- Copy-run rows use their `agentSnapshot`; My Copies and History do not issue a
  redundant agent collection request.
- Activity details are typed and Alerts Feed does not parse display summary text
  for P&L direction.
- Summary KPI cards identify `STALE` metrics; unavailable values remain `—`.
- Owner screens show a dedicated disconnected-wallet state.

## Accepted Product Decisions

- Keep the five currently unowned GET operations documented without inventing
  routes or secondary tables.
- Keep Agent and Copy Run performance at the first API page (`limit=100`).
- Keep Sidebar Agents and Open Copies capped at 10 items.
- Open and History membership remains owned by the server response.
- Stop Copy trusts the Copy Run and loaded positions passed to the modal. Manual
  Sell and Close Position trust the selected `PositionSummary`. These flows do
  not reload their input entities before preparation; the preparation response
  remains authoritative before any wallet submission.
- Every Stop Copy entry point supplies open positions before opening the modal.
  Copy Detail reuses its loaded position list; My Copies loads the complete
  cursor chain at the table action boundary.
- Withdraw trusts the Copy Run and availability passed from Copy Detail or Smart
  Wallet. The modal does not reload either entity before preparation.
- A write action is successful in the UI after its submitted transaction has a
  successful receipt. Cache invalidation runs asynchronously and the UI does not
  wait for backend indexing.
- Start Copy is the only multi-stage exception: after the Create receipt it
  re-prepares with the same UUID, target amount, and predicted Smart Wallet to
  obtain and submit the Fund stage.

## Current Prepared-Action Write UI

The production write path is split by ownership:

- Each feature modal owns its editable input and action-specific preparation
  inputs.
- `write/usePreparedAction.ts` owns preparation status handling, safety
  validation, exact wallet submission, receipt wait, receipt retry without
  rebroadcast, Start stage continuation, and completion.
- `write/PreparedActionModal.tsx` owns the shared idle, review, wallet,
  confirmation, syncing, unavailable, error, and success presentation.
- `write/preparedAction.ts` owns pure parsing, formatting, typed reason copy,
  preparation validation, and retry timing.
- `write/WriteContext.tsx` owns modal routing, the in-memory wallet session, RTK
  tag invalidation, and TanStack cursor-query invalidation.

Implemented behavior:

- Start Copy keeps one UUID, target amount, and predicted Smart Wallet across
  `CREATE_REQUIRED -> FUNDING_REQUIRED -> COMPLETE`. Every stage validates the
  response preview, request ID, account, predicted/copy-account identity, chain,
  stage, and call kind before submission.
- Add Capital uses the fixed supported quote token for decimal-to-raw input,
  then reviews the API quote token, minimum, wallet balance, and resulting
  allocation.
- Stop Copy uses the loaded positions passed to the modal, sends at most 32
  selected `userPositionIds`, and permits an empty array.
- Withdraw is exposed for stopped Smart Wallets and closed Copy Runs, gated by
  `withdrawQuoteAvailability`. It sends `{}` to preparation and requires the
  prepared amount and connected-owner recipient.
- Manual Sell trusts the selected position props and reloads the complete
  pending-obligation cursor chain. It uses the FIFO head ratio and total
  unresolved FIFO count.
- Close Position trusts the selected position props and is exposed only when
  those props advertise the full-recovery action.
- Manual Sell and Close Position sign the exact SIWE challenge, store the Bearer
  session only in React memory, and clear/re-authorize it on owner/chain change,
  expiry, or `401`.
- `call.to`, `call.data`, and `call.valueRaw` are simulated and submitted
  unchanged through the gated wallet client.
- A receipt retry waits for the already-submitted hash and never sends the
  prepared call again.
- A submitted transaction is shown as confirmed only after a successful receipt.
- A user retry from `PENDING` waits until `reprepareAfter` before preparing again.
- Successful flows enter success state, then asynchronously invalidate the
  shared Copy Trading RTK tag and TanStack cursor-query family.

## Action Integration Matrix

| Capability     | Current production UI                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Start Copy     | Reuses one UUID, target amount, and predicted account through Create, Fund, and Complete; each exact call waits for receipt.            |
| Add Capital    | Reviews quote-token, minimum, balance, and allocation data, then submits the exact prepared call.                                       |
| Stop Copy      | Trusts loaded position props, supports zero to 32 selected IDs, reviews recovery totals, and submits the exact prepared call.           |
| Withdraw Quote | Stopped and closed Copy Detail views expose an availability-gated CTA; amount and owner recipient are server-prepared and non-editable. |
| Wallet Session | Exact SIWE challenge/signature exchange with an owner/chain-scoped, expiring in-memory Bearer session; `401` forces re-authorization.   |
| Manual Sell    | Trusts selected position props, requires the authoritative FIFO head ratio/count, then prepares through the wallet session.             |
| Close Position | Trusts selected position props, requires the advertised full-recovery action, then prepares through the wallet session.                 |

## Implemented Write Invariants

Every connected action follows this boundary:

```text
read advisory availability
→ collect the action-owned inputs
→ call the matching preparation endpoint
→ inspect status, reason, preview, evidence, and exact call
→ validate owner, chain, preview, Smart Wallet, call kind, target, value, and expiry
→ simulate and submit call.to / call.data / call.valueRaw unchanged
→ wait for a successful receipt
→ mark the action successful
→ for Start Create only, re-prepare the same request and continue to Fund
→ invalidate affected RTK and TanStack reads asynchronously
```

The implementation fails closed when advisory availability is missing,
unspecified, pending, or unavailable. Preparation remains authoritative, and
`PENDING`, `UNAVAILABLE`, expired results, unexpected previews/stages/call kinds,
or mismatched ownership never reach wallet submission.

Start and Add use the fixed supported quote token for user input conversion;
the preparation response owns token identity, minimums, balances, fees, and
review values. Stop accepts an empty selection. Manual Sell has no arbitrary
percentage input. Withdraw has no user-owned amount or recipient input.

Prepared Smart Wallet identity is distinct from both `call.to` and
`expectedAccount`. Start stores the predicted account returned by the first
preparation and rejects any later stage that changes it. A review is discarded
after `reprepareAfter` or `liquidationConfigDeadline`.

Wallet-session challenge tokens, signatures, and access tokens are never
persisted. The token is scoped to the signed owner/chain and retained only until
expiry, owner/chain change, or an authorization failure.

## Remaining Work

1. Add component/state-machine coverage for receipt timeout retry, account or
   chain changes during review, `PENDING` retry timing, and the two-stage Start
   continuation.
2. Browser-test initial and next-page infinite-scroll errors, including Retry
   restarting from page one after a rejected or expired cursor.
3. Browser-test Copy Detail and Open/History server-owned views across at least
   two cursor pages with a connected wallet and representative data.
4. Complete browser validation for responsive layout, keyboard focus,
   accessible labels and disabled states, and modal accessibility.
5. Assign UI ownership for the five remaining read-only discovery/drilldown
   operations.
6. Render position-level stale valuation indication.

## Verification

- The service surface contains 24 GET queries and 8 POST mutations.
- All six preparation mutations and both wallet-session mutations have an owned
  UI flow.
- The local ABI, mock signer, and mock transaction-hash path have been removed.
- Focused time tests pass.
- App TypeScript, Copy Trading ESLint, Prettier for the changed implementation,
  and `git diff --check` pass.
