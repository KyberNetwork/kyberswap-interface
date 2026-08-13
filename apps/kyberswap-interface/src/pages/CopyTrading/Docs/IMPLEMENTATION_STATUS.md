# Copy Trading Implementation Status

Last reviewed: 2026-08-13

This document tracks the current frontend implementation and remaining product
or UI work. Product entities and intended flows are documented in
`Entities and Flows.md`; the current HTTP contract is documented in
`FE_API_Catalog.md`. The checked-in `openapi.yaml` is synchronized byte-for-byte
with the pre-release Swagger contract fetched on 2026-08-13.

All 26 GET and 8 POST Copy Trading API operations in the current catalog are
declared in the frontend service.

## Implementation at a Glance

| Layer              | Current status                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE API catalog     | `IMPLEMENTED`: 34 public operations are documented.                                                                                                           |
| Checked-in OpenAPI | `CURRENT`: synchronized with the live 34-operation pre-release Swagger contract, including wallet inventory and funded-authorization fields.             |
| RTK Query service  | `IMPLEMENTED`: all 26 GET and 8 POST operations are declared and typed.                                                                                       |
| Read UI            | Partially implemented: 16 of 26 GET operations have a UI consumer; pending obligations are consumed by Manual Sell rather than a standalone read-only screen. |
| Write UX           | `IMPLEMENTED`: Start, Add, Stop, Withdraw, Manual Sell, and Close Position use the prepared-action workflow.                                                  |
| Write integration  | `IMPLEMENTED`: exact API-prepared calls, receipt-success completion, Start stage continuation, wallet sessions, and asynchronous cache refresh are connected. |
| API availability   | Live Swagger exposes all 34 operations. `/chains` and `/agents` have dated read smoke; account-specific reads and write outcomes still require live E2E.       |

## Contract and Service Coverage

`services/copyTrading/index.ts` uses `fetchBaseQuery` and declares all 34 public
operations:

- 26 GET queries, including the run-scoped effective cashback policy and
  copy-account wallet inventory.
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

The current UI consumes these 16 GET operations:

- Chains.
- Leaderboard summary and leaderboard rows.
- Agent profile, stats, performance, positions, and action logs.
- Owner copy summary and copy runs.
- Copy Run detail, positions, and performance.
- Owner activity.
- Copy-account wallet inventory for the `Remaining in Wallet` rows and
  authoritative account-wide USD total.
- Pending sell obligations through the Manual Sell recovery modal. The complete
  cursor-backed FIFO is preparation input, not a user-selected sell ratio.

The following ten GET operations are declared but have no dedicated Copy
Trading UI consumer:

- Copy Run cashback policy. Its service contract is integrated, but no
  fee/cashback product surface has been defined.
- Agent discovery (`GET /agents`). The current Agent List uses the distinct
  qualification-ranked `GET /leaderboard` collection.
- Agent position detail.
- Agent position events.
- All owner positions.
- Owner copy-account list.
- Copy-account detail.
- Copy-account balances.
- Copy-account positions.
- Copy-account history.

These are product-surface gaps, not service gaps. They need an agreed route,
tab, drawer, collection, or drilldown owner before implementation.

`Remaining in Wallet` uses the non-paginated wallet-inventory endpoint. It
renders the server total only when the response is complete, its pinned stable
balance is present, and the metric is current or stale. It never sums rows,
position valuations, balance pages, or the pinned stable sidecar locally.

Current primary-screen read behavior:

- `WINDOW_ALL` uses monthly performance intervals; shorter windows use daily
  intervals.
- Copy Run badges preserve `ACTIVE`, `CLOSING`, `STOPPED`, and `CLOSED`.
- Position lifecycle and quantity state render independently from typed fields.
- Open and History remain server-owned Copy Run views. The frontend does not
  locally move rows between them.
- Agent Positions, Agent History, Action Logs, My Copies, Copy Run detail tabs,
  and Alerts Feed cursor collections use infinite scroll
  inside bounded scroll containers.
- Copy History uses cursor-backed Previous / Page N / Next pagination with 5
  rows per page. The API does not expose a total count, so the UI does not
  invent numbered last-page navigation.
- Cursor lists use TanStack `useInfiniteQuery` for the page/cursor chain and
  invoke the existing RTK lazy query trigger from `queryFn`.
- Copy Detail owns independent cursor chains for Open Positions, Closed
  Positions, and owner activity filtered by `copyRunId`.
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

- Keep the ten currently unowned GET operations documented without inventing
  routes or secondary tables.
- Keep Agent and Copy Run performance at the first API page (`limit=100`).
- Keep Sidebar Agents and Open Copies capped at 10 items.
- Open and History membership remains owned by the server response.
- Stop Copy trusts the Copy Run passed by the entry point, then the modal loads
  the complete open-position cursor chain. Manual Sell and Close Position trust
  the selected `PositionSummary`. The preparation response remains authoritative
  before any wallet submission.
- The Stop Copy modal owns loading every open-position cursor page, including
  loading, error, and Retry UI. An incomplete or invalid cursor chain prevents
  preparation rather than presenting a partial position list.
- Withdraw trusts the Copy Run and availability passed from Copy Detail or Smart
  Wallet. The modal does not reload either entity before preparation.
- A write action is successful in the UI after its submitted transaction has a
  successful receipt. Cache invalidation runs asynchronously and the UI does not
  wait for backend indexing.
- Start Copy explicitly uses `START_COPY_FUNDING_MODE_FUNDED`. When preparation
  reports insufficient quote allowance, the checkbox-gated review exposes a
  separate Approve action and keeps its loading state on that button. The UI
  follows the returned permit, approval, spender, and EIP-712 domain schemes,
  then starts a new UUID-bound attempt with the exact volatile permit bytes or
  confirmed allowance. Once that attempt returns `READY`, the review exposes a
  separate Start Copying action; approval never auto-submits Create. The UI
  submits only the returned create call and re-prepares until
  `START_COPY_STAGE_COMPLETE`. Once a create transaction hash exists, Retry
  remains sync-only and rejects any new executable preparation.

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

- Start Copy keeps one UUID, target amount, explicit funded mode, permit intent,
  and predicted Smart Wallet stable within each attempt. A diagnostic
  insufficient-allowance response does not bind its predicted Smart Wallet to
  the authorized attempt. After the checkbox-gated Approve action completes the
  exact operator-selected EIP-2612, DAI-like, standard approval, or zero-then-set
  authorization, the UI creates UUID B, validates and captures UUID B's
  predicted Smart Wallet, and returns to review. Permit bytes remain only in
  volatile component state and are reused unchanged through completion. The
  user must then press Start Copying to submit Create. The funded create amount
  must equal the full target. Only
  `PREPARED_CALL_KIND_START_COPY_CREATE` can reach wallet submission; a
  separate Fund call fails closed.
- Add Capital uses the fixed supported quote token for decimal-to-raw input,
  then reviews the API quote token, minimum, wallet balance, and resulting
  allocation.
- Stop Copy fetches and renders the complete open-position list inside the modal.
  The UI defaults at most 32 positions to selected, prevents selecting a 33rd,
  and validates the final payload length before sending `userPositionIds`. An
  empty array remains valid.
- Withdraw is exposed only when the selected Copy Run status is `STOPPED`, then
  gated by `withdrawQuoteAvailability`. It sends `{}` to preparation and
  requires the prepared amount and connected-owner recipient.
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
| Start Copy     | Uses a separate checkbox-gated Approve step when required, then a separate Start Copying submit for the authorized funded Create call. |
| Add Capital    | Reviews quote-token, minimum, balance, and allocation data, then submits the exact prepared call.                                       |
| Stop Copy      | Loads all open-position pages, supports zero to 32 selected IDs, validates the payload cap, and submits the exact prepared call.        |
| Withdraw Quote | Only a `STOPPED` Copy Detail exposes the availability-gated CTA; amount and owner recipient are server-prepared and non-editable.       |
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
→ for funded Start authorization, use a separate Approve action for the exact returned token/spender/scheme
→ re-prepare with a new UUID and require a separate Start Copying action for the READY Create call
→ validate owner, chain, preview, Smart Wallet, call kind, target, value, and expiry
→ simulate and submit call.to / call.data / call.valueRaw unchanged
→ wait for a successful receipt
→ mark the action successful
→ after the funded Start Create transaction, re-prepare until Complete; never submit a separate Fund call
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
`expectedAccount`. A diagnostic insufficient-allowance UUID does not bind the
authorized UUID's predicted account. Start captures the authorized UUID's
predicted account and rejects any later stage within that attempt that changes
it. A review is discarded after `reprepareAfter` or
`liquidationConfigDeadline`.

Wallet-session challenge tokens, signatures, and access tokens are never
persisted. The token is scoped to the signed owner/chain and retained only until
expiry, owner/chain change, or an authorization failure.

## Remaining Work

1. Add component/state-machine coverage for receipt timeout retry, account or
   chain changes during review, `PENDING` retry timing, and funded Start
   completion polling.
2. Browser-test initial and next-page infinite-scroll errors, including Retry
   restarting from page one after a rejected or expired cursor.
3. Browser-test Copy Detail and Open/History server-owned views across at least
   two cursor pages with a connected wallet and representative data.
4. Complete browser validation for responsive layout, keyboard focus,
   accessible labels and disabled states, and modal accessibility.
5. Assign UI ownership for the ten remaining read-only discovery/drilldown
   operations.
6. Render position-level stale valuation indication.

## Verification

- The checked-in `openapi.yaml` matches the live pre-release Swagger contract
  fetched on 2026-08-13: 34 paths and 134 definitions.
- The service surface contains 26 GET queries and 8 POST mutations.
- All six preparation mutations and both wallet-session mutations have an owned
  UI flow.
- The local ABI, mock signer, and mock transaction-hash path have been removed.
- Focused time tests pass.
- App TypeScript, Copy Trading ESLint, Prettier for the changed implementation,
  and `git diff --check` pass.
