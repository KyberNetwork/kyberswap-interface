# Copy Trading Implementation Status

Last reviewed: 2026-08-14

This is the single frontend-owned record for current implementation, accepted
product decisions, verification evidence, and remaining work. The current HTTP
contract is documented in `FE_API_Catalog.md`; `openapi.yaml` is its
machine-readable API source. Both contract files are backend-owned inputs. The
checked-in `openapi.yaml` is synchronized byte-for-byte with the pre-release
Swagger contract fetched on 2026-08-14.

All 26 GET and 6 POST Copy Trading API operations in the current catalog are
declared in the frontend service.

## Implementation at a Glance

| Layer              | Current status                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE API catalog     | `CURRENT INPUT`: 32 public operations are documented.                                                                                                                  |
| Checked-in OpenAPI | `CURRENT INPUT`: synchronized with the live 32-operation pre-release Swagger contract; wallet-session routes and Bearer security are removed.                          |
| RTK Query service  | `CODE-COMPLETE`: all 26 GET and 6 POST operations are declared and typed.                                                                                              |
| Read UI            | `PARTIAL`: 17 of 26 GET operations have a UI consumer; position/FIFO refreshes are consumed by recovery actions rather than standalone screens.                        |
| Write UX           | `CODE-COMPLETE`: Start, Add, Stop, Withdraw, Manual Sell, and Close Position use the prepared-action workflow.                                                         |
| Write integration  | `CODE-COMPLETE`: exact API-prepared calls, receipt-success completion, Start Copy list polling, stateless recovery preparation, and async cache refresh are connected. |
| Live evidence      | Swagger exposes all 32 operations. `/chains` and `/agents` have dated read smoke; account-specific reads and write outcomes still require live E2E.                    |

## Contract and Service Coverage

`services/copyTrading/api/baseApi.ts` owns the shared `createApi` and
`fetchBaseQuery` configuration, reducer, and middleware. Discovery, Agents,
Copy Runs, Copy Accounts, and prepared actions each inject their endpoints
directly into that shared API. Consumers import the endpoint group that owns
the hook they use instead of relying on a later group as an endpoint superset.
Together these endpoint groups declare all 32 public operations:

- 26 GET queries, including the run-scoped effective cashback policy and
  copy-account wallet inventory.
- Six transaction-preparation mutations:
  - Start Copy.
  - Add Capital.
  - Stop Copy.
  - Withdraw Quote.
  - Manual Sell.
  - Close Position.

Domain files under `services/copyTrading/adapters/` and
`services/copyTrading/types/` own the compatibility boundary between API-native
envelopes/enums and the existing UI models. Consumers import those ownership
files directly; there are no top-level adapter or type re-export barrels.
Shared request parameter normalization stays in `api/queryParams.ts`. Prepared
action response and request contracts stay together in
`types/preparedActions.ts`; activity and Agent action-log normalization stay
together in `adapters/activity.ts`.

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

The current UI consumes these 17 GET operations:

- Chains.
- Leaderboard summary and leaderboard rows.
- Agent profile, stats, performance, positions, and action logs.
- Owner copy summary and copy runs.
- Copy Run detail, positions, and performance.
- Owner activity.
- Copy-account wallet inventory for the `Remaining in Wallet` rows and
  authoritative account-wide USD total.
- Copy-account positions to refresh the selected recovery position immediately
  before Manual Sell or Close Position preparation.
- Pending sell obligations through the Manual Sell recovery modal. The complete
  cursor-backed FIFO is preparation input, not a user-selected sell ratio.

The following nine GET operations are declared but have no dedicated Copy
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
- Sidebar Agents is a selected-chain snapshot with `limit=10`; Open Copies is
  independently capped at `limit=10`.
- Infinite-scroll collections intentionally have no manual Retry action. They
  keep the error state until the query refetches or the surface remounts.
- Copy-run rows use their `agentSnapshot`; My Copies and History do not issue a
  redundant agent collection request.
- Activity details are typed and Alerts Feed does not parse display summary text
  for P&L direction.
- Summary KPI cards identify `STALE` metrics; unavailable values remain `—`.
- Owner screens show a dedicated disconnected-wallet state.

## Accepted Product Decisions

- Keep the nine currently unowned GET operations documented without inventing
  routes or secondary tables.
- Keep Agent and Copy Run performance at the first API page (`limit=100`).
- Keep Sidebar Agents capped at 10 items for the selected network and Open
  Copies capped at 10 items independently.
- Open and History membership remains owned by the server response.
- Stop Copy trusts the Copy Run passed by the entry point and loads the complete
  open-position cursor chain once when the modal opens. It does not refetch that
  list immediately before preparation. Manual Sell and Close Position use the
  selected `PositionSummary` only to open the modal, then refresh the current
  copy-account position before preparation. The preparation response remains
  authoritative before any wallet submission.
- The Stop Copy modal owns loading every open-position cursor page, including
  loading, error, and Retry UI. An incomplete or invalid cursor chain prevents
  preparation rather than presenting a partial position list.
- Infinite-scroll read surfaces show their error state without a manual Retry
  button. Recovery is owned by a later query refetch or remount.
- Withdraw trusts the Copy Run and availability passed from Copy Detail or Smart
  Wallet. The modal does not reload either entity before preparation.
- A write action is successful in the UI after its submitted transaction has a
  successful receipt. Cache invalidation runs asynchronously and the UI does not
  wait for backend indexing.
- Start Copy explicitly uses `START_COPY_FUNDING_MODE_FUNDED`. When preparation
  reports insufficient quote allowance, the checkbox-gated review exposes a
  separate API-selected Permit or Approve action. Loading uses `Dots` without
  changing that CTA label. The UI follows the returned permit, approval,
  spender, and EIP-712 domain schemes, then starts a new UUID-bound attempt with
  the exact volatile permit bytes or confirmed allowance. Once that attempt
  returns `READY`, the review exposes a separate Start Copying action; approval
  never auto-submits Create. The UI submits only the returned create call, then
  polls the Agent-filtered open Copy list after its successful receipt. Every
  list request is an independent bounded attempt; polling does not classify API
  errors as retryable or non-retryable.

## Current Prepared-Action Write UI

The production write path is split by ownership:

- Each folder under `modals/` owns its modal UI, editable input, tests, and
  action-specific preparation logic. `modals/StartCopyModal/` also owns its
  amount state, UUID-bound attempt identity, Permit or Approve authorization,
  and post-receipt completion polling. Its shared target, capital-preset, and
  completion-polling domain logic stays in `StartCopyModal/startCopy.ts`.
- `modals/PreparedActionModal/requestPreparation.ts` owns preparation status
  handling, bounded continuation polling, response validation, and transitions
  into review, pending, unavailable, error, or completed states.
- `modals/PreparedActionModal/usePreparedAction.ts` owns exact wallet
  simulation/submission, receipt wait, receipt retry without rebroadcast,
  action-specific post-receipt work, and completion notification.
- `modals/PreparedActionModal/index.tsx` owns the shared idle, review, wallet,
  confirmation, syncing, unavailable, error, and success presentation.
- `modals/PreparedActionModal/preparedAction.ts` owns the shared phase shape,
  superseded-request versioning, pure parsing, formatting, preparation
  validation, and retry timing. `helpers.ts` owns stateless formatting, reason
  copy, and availability helpers shared with read screens.
- Within `modals/StartCopyModal/`, `authorization.ts` validates the API-selected
  allowance scheme, `permit.ts` builds and encodes supported EIP-712 permits,
  `useApproval.ts` owns standard and zero-then-set approval lifecycles, and
  `useAuthorization.ts` dispatches the selected Permit or Approve path.
- `modals/context.tsx` owns only modal routing. `hooks/useRefreshCopyTrading.ts`
  owns fire-and-forget RTK/TanStack invalidation of active Copy Trading reads.

Implemented behavior:

- Start Copy keeps one UUID, target amount, explicit funded mode, permit intent,
  and predicted Smart Wallet stable within each attempt. A diagnostic
  insufficient-allowance response does not bind its predicted Smart Wallet to
  the authorized attempt. After the checkbox-gated Permit or Approve action
  completes the exact operator-selected EIP-2612, DAI-like, standard approval,
  or zero-then-set authorization, the UI creates UUID B, validates and captures
  UUID B's predicted Smart Wallet, and returns to review. Permit bytes remain
  only in volatile component state and are reused unchanged through completion.
  The user must then press Start Copying to submit Create. The funded create
  amount must equal the full target. Only
  `PREPARED_CALL_KIND_START_COPY_CREATE` can reach wallet submission; a
  separate Fund call fails closed. After the Create receipt, the UI polls the
  open Copy Run list filtered by the exact Agent every two seconds for at most
  twenty seconds; it does not call Start preparation again. Success exposes
  Close and a direct My Copy link for that returned run.
- Add Capital uses the fixed supported quote token for decimal-to-raw input,
  then reviews the API quote token, minimum, wallet balance, and resulting
  allocation.
- Stop Copy fetches and renders the complete open-position list inside the modal.
  It fetches once when the modal opens and does not refresh the list again before
  preparation. The UI defaults at most 32 positions to selected, prevents
  selecting a 33rd, and validates the final payload length before sending
  `userPositionIds`. An empty array remains valid.
- Withdraw is exposed only when the selected Copy Run status is `STOPPED`, then
  gated by `withdrawQuoteAvailability`. It sends `{}` to preparation and
  requires the prepared amount and connected-owner recipient.
- Manual Sell refreshes the selected copy-account position and complete
  pending-obligation cursor chain. It uses the FIFO head ratio and total
  unresolved FIFO count.
- Close Position refreshes the selected copy-account position before direct
  preparation; the original row controls the initial CTA presentation only.
- Manual Sell and Close Position call their preparation routes directly without
  a challenge, access token, or Authorization header. The owner wallet still
  simulates and submits the exact returned call.
- `call.to`, `call.data`, and `call.valueRaw` are simulated and submitted
  unchanged through the gated wallet client.
- A receipt retry waits for the already-submitted hash and never sends the
  prepared call again.
- A reverted receipt keeps its hash for display, but Retry starts a fresh
  preparation and does not treat the reverted transaction as post-receipt
  continuation.
- A submitted transaction is shown as confirmed only after a successful receipt.
- A user retry from `PENDING` waits until `reprepareAfter` before preparing again.
- Immediately after a successful receipt, flows invalidate active RTK and
  TanStack Copy Trading reads so their network refetches start without blocking
  post-receipt synchronization or success UI. Agent Stats and Agent Performance
  participate in the same RTK invalidation.

## Action Integration Matrix

| Capability     | Current production UI                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start Copy     | Uses the API-selected Permit or Approve step, submits Create separately, then polls the Agent-filtered open Copy list and links the returned My Copy. |
| Add Capital    | Reviews quote-token, minimum, balance, and allocation data, then submits the exact prepared call.                                                     |
| Stop Copy      | Loads all open-position pages when opened, supports zero to 32 selected IDs, validates the payload cap, and submits the exact prepared call.          |
| Withdraw Quote | Only a `STOPPED` Copy Detail exposes the availability-gated CTA; amount and owner recipient are server-prepared and non-editable.                     |
| Manual Sell    | Refreshes the current position and authoritative FIFO head ratio/count, then prepares directly.                                                       |
| Close Position | Refreshes the current position after the advertised CTA is selected, then prepares directly.                                                          |

## Implemented Write Invariants

Every connected action follows this boundary:

```text
read advisory availability
→ collect the action-owned inputs
→ call the matching preparation endpoint
→ inspect status, reason, preview, evidence, and exact call
→ for funded Start authorization, use a separate Permit or Approve action for the exact returned token/spender/scheme
→ re-prepare with a new UUID and require a separate Start Copying action for the READY Create call
→ validate owner, chain, preview, Smart Wallet, call kind, target, value, and expiry
→ simulate and submit call.to / call.data / call.valueRaw unchanged
→ wait for a successful receipt
→ invalidate affected RTK and TanStack reads asynchronously
→ after the funded Start Create transaction, poll the Agent-filtered open Copy list every 2s for at most 20s
→ mark the action successful after its action-specific completion work
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

Repeated stateless preparation calls are allowed, but the UI keeps only the
latest request's response. An older response that resolves after a newer
request is discarded, and starting wallet submission invalidates any competing
preparation snapshot.

Manual Sell and Close Position preparation is stateless. A returned preparation
does not authorize execution by another wallet; the connected owner still
submits the exact call and the follower-account contract enforces its caller.

## Remaining Work

1. Add component/state-machine integration coverage for receipt timeout retry,
   account or chain changes during review, `PENDING` retry timing, and the full
   funded Start authorization-to-completion handoff. Pure Start list polling is
   already unit-tested.
2. Browser-test initial and next-page infinite-scroll error presentation and
   recovery after refetch or remount.
3. Browser-test Copy Detail and Open/History server-owned views across at least
   two cursor pages with a connected wallet and representative data.
4. Complete browser validation for responsive layout, keyboard focus,
   accessible labels and disabled states, and modal accessibility.
5. Assign UI ownership for the nine remaining read-only discovery/drilldown
   operations.
6. Render position-level stale valuation indication.

## Verification

- The checked-in `openapi.yaml` matches the live pre-release Swagger contract
  fetched on 2026-08-14: 32 paths and 128 definitions.
- The service surface contains 26 GET queries and 6 POST mutations.
- All six preparation mutations have an owned UI flow.
- The local ABI, mock signer, and mock transaction-hash path have been removed.
- All 45 Copy Trading unit tests pass.
- App TypeScript, Copy Trading ESLint, Prettier for the changed implementation,
  Vite production build, and `git diff --check` pass.
- Browser QA and positive live transaction E2E were not rerun for this contract
  migration.
