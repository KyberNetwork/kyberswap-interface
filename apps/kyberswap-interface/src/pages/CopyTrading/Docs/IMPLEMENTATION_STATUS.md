# Copy Trading Implementation Status

Last reviewed: 2026-08-24

This is the single frontend-owned record for current code implementation,
accepted product decisions, ownership, and static verification evidence. The
current HTTP contract is documented in `FE_API_Catalog.md`; `openapi.yaml` is its
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
| Read UI            | `CODE-COMPLETE`: all currently defined product surfaces are connected; 17 GET operations have UI consumers and nine service-only operations have no product surface.   |
| Write UX           | `CODE-COMPLETE`: all six actions use prepared-action validation; Add Capital submits directly after preparation while the other review-bearing flows retain review.    |
| Write integration  | `CODE-COMPLETE`: exact API-prepared calls, receipt-success completion, Start Copy list polling, stateless recovery preparation, and async cache refresh are connected. |

## Changes Included Since the Previous Review

The 2026-08-24 review also includes the Copy Trading commits between the prior
status update and the current working tree:

- `155ac5ebd` scopes wallet- and argument-sensitive RTK reads to `currentData`.
  Agent actions, owner summaries, Copy Run performance, and Sidebar Open Copies
  no longer retain a previous wallet, chain, Copy Run, or performance-window
  result while the next query is pending. Open Copies also clears immediately
  when no owner wallet is available.
- `e1b98c55e` updates KPI icons and terminology, card sizing, Sidebar hierarchy
  and navigation visuals, and the capital-input empty balance display.
- `128783f4d` adds server-backed sorting to My Copies, standardizes prepared-flow
  CTA hierarchy, uses red secondary Stop actions and a secondary Withdraw
  action, shortens Agent metadata presentation, and highlights positive History
  cashback.
- `613a3757c` streamlines Add Capital into a direct prepare-and-submit flow,
  adds explicit wallet-balance loading, and keeps the inline allocation summary
  separate from backend-authoritative preparation values.
- `8414b3601` prevents Copy Detail from flashing a disconnected state while the
  wallet restores, makes Start Copy and Add Capital percentage presets
  action-only, standardizes prepared-action recovery hierarchy, and refines the
  Stop Copy selection and review presentation.
- The current working tree completes the Copy Trading semantic-text pass and
  Stop Copy empty/loading refinements. Standalone prose and status messages use
  block semantics, form labels target their inputs, and heading content no
  longer nests block rows. Stop Copy uses the Copy Run open-position count to
  stabilize its initial empty state and contextual note.

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
- Copy-account positions to refresh the selected active recovery position with
  `OPEN`, or a stopped Copy residue with `LEFTOVER`, immediately before
  position-sell preparation.
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

These are intentionally service-only until a product surface is defined. They
are not open implementation work for the current Copy Trading scope.

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
- Wallet- and argument-sensitive RTK reads consume `currentData`, so a result
  cached under previous query arguments is not rendered while the current
  request is pending. Sidebar Open Copies also requires a current owner.
- My Copies supports server-backed sorting by Agent APR, Agent Win Rate, Agent
  Volume, and Capital In. Repeated header selection cycles descending,
  ascending, then the server default; each sort state owns a separate cursor
  query chain.
- Activity details are typed and Alerts Feed does not parse display summary text
  for P&L direction.
- Summary KPI cards identify `STALE` metrics; unavailable values remain `—`.
- My Copies, History, and Copy Detail suppress their disconnected-wallet state
  while a persisted wallet connection is restoring, then show the dedicated
  state only when the wallet is genuinely disconnected.

## Accepted Product Decisions

- Keep the nine currently unowned GET operations documented without inventing
  routes or secondary tables.
- Keep Agent and Copy Run performance at the first API page (`limit=100`).
- Keep Sidebar Agents capped at 10 items for the selected network and Open
  Copies capped at 10 items independently.
- Open and History membership remains owned by the server response.
- Stop Copy trusts the Copy Run passed by the entry point and loads the complete
  open-position cursor chain once when the modal opens. It does not refetch that
  list immediately before preparation. Manual Sell refreshes the selected
  active position from `POSITION_VIEW_OPEN`; its partial and 100% variants use
  the preparation kind advertised by the backend. Close Position refreshes a
  stopped-Copy residue from `POSITION_VIEW_LEFTOVER`. The preparation response
  remains authoritative before any wallet submission.
- The Stop Copy modal owns loading every open-position cursor page. An
  incomplete or invalid cursor chain prevents preparation rather than
  presenting a partial position list. Position-load failure has no separate
  Retry control; the disabled action communicates that positions are
  unavailable, consistent with other read-query error surfaces.
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
- Start Copy and Add Capital share only the capital-entry domain: the supported
  quote-token configuration, action-specific minimums, 25/50/75/100 presets,
  wallet balance, decimal parsing, minimum/balance validation, and input UI.
  Percentage presets are action-only controls and do not render a selected or
  active state.
  Each flow still owns its availability and network guards, preparation request
  validation, authorization or ownership rules, and navigation. Add Capital
  owns its inline current/new allocation summary and has no review step.
- Add Capital displays current allocation above the amount panel and the
  client-projected new allocation below it as token amounts (`x SYMBOL`). Its
  current value uses the existing canonical `capitalInUsd` display value with
  the observed fallback because Copy Run summary has no raw allocated-token
  field. Its CTA prepares, validates, simulates, and submits the returned call
  directly.
- All six preparation capabilities use the same prepared-action recovery and
  success primitives. Review-bearing flows also use the shared review
  presentation.
  Paired recovery actions keep Back or Close outlined on the left and Retry as
  the primary action on the right; Add Capital retry keeps its direct
  prepare-and-submit behavior. Success keeps Close outlined while the primary
  destination remains flow-owned: My Copies for Start/Add/Manual Sell and
  History for Stop/Withdraw/Close Position.
- Stop Copy keeps position loading, selection, selection-cap validation, and
  selected-ID validation local. `ManagePositionModal` owns both position-sell
  flows: active Manual Sell, including its 100% special case, and stopped-Copy
  Close Position. Step 1 owns the flow-specific reason and source validation;
  Step 2, submission, and recovery are shared. These concerns are not part of
  the shared capital abstraction used by Start Copy and Add Capital. Stop and
  position actions share only the prepared-action slippage control and default
  while retaining flow-local state and request conversion to basis points.

## Current Prepared-Action Write UI

The production write path is split by ownership:

- Each action folder under `modals/` owns its modal composition, action-specific
  guards, preparation request and response validation, review or inline summary
  metrics where applicable, tests, and destination navigation.
- `modals/CapitalAmount/` owns the capital-entry state and UI shared by Start
  Copy and Add Capital: fixed supported quote-token configuration,
  action-specific minimums, wallet balance, presets, decimal parsing, and local
  minimum/balance validation.
- `modals/StartCopyModal/` owns UUID-bound attempt identity, Permit or Approve
  authorization, and post-receipt completion polling. Its target and
  completion-polling domain logic stays in `StartCopyModal/startCopy.ts`.
- `modals/StopCopyModal/` owns its complete open-position load, local selection,
  expected-count loading geometry, 32-position cap, slippage, selected-value
  estimate, contextual unchecked-token note, and selected-ID payload
  validation.
- `modals/ManagePositionModal/` owns both position-sell product flows. Its Step
  1 variant explains either a skipped Agent sell on an active Copy or a
  user-initiated leftover close after stopping. Active Manual Sell refreshes
  `OPEN` and selects the API preparation from the advertised action: partial
  recovery uses `prepareManualSell`, while the 100% special case uses
  `prepareClosePosition`. Stopped-Copy Close Position refreshes `LEFTOVER` and
  uses `prepareClosePosition`. Both variants share the same Step 2 review,
  prepared-action submission, and recovery composition.
- `modals/WithdrawQuoteModal/` owns the non-editable max-sweep composition,
  positive prepared amount and owner-recipient validation, review metrics, and
  History navigation. It does not create client-owned amount or recipient state.
- `modals/PreparedActionModal/requestPreparation.ts` owns preparation status
  handling, bounded continuation polling, response validation, and transitions
  into review, direct READY handoff, pending, unavailable, error, or
  completed states.
- `modals/PreparedActionModal/usePreparedAction.ts` owns exact wallet
  simulation/submission, receipt wait, receipt retry without rebroadcast,
  action-specific post-receipt work, and completion notification.
- `modals/PreparedActionModal/index.tsx` owns the shared idle, review, wallet,
  confirmation, syncing, unavailable, error, and success presentation,
  including review-row skeletons, recovery actions, and the reusable success
  action layout. Processing copy distinguishes wallet confirmation, submitted
  transaction, and confirmed transaction states; recovery copy avoids internal
  preparation terminology. Success uses one generic confirmation description;
  titles and destinations remain action-specific.
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
  Close and the My Copies destination.
- Add Capital shows current allocation above the capital panel and the
  client-projected new allocation below it as token-denominated values. Wallet
  balance has an explicit spinner while its RPC read is pending. The Add Capital
  CTA converts the decimal input to raw units, prepares and validates the exact
  amount/call, then proceeds directly to wallet simulation and submission with
  no intermediate review step.
- Stop Copy fetches and renders the complete open-position list inside the modal.
  It fetches once when the modal opens and does not refresh the list again before
  preparation. A Copy Run reporting zero open positions initializes directly to
  the empty state while the request resolves, and loading reserves the expected
  row geometry to avoid layout shift. The UI defaults at most 32 positions to
  selected, prevents selecting a 33rd, shows the client-estimated selected USD
  value beside slippage, and validates the final payload length before sending
  `userPositionIds`. An empty array remains valid. When the Copy Run reports at
  least one position, Step 1 explains that unchecked tokens remain in the Smart
  Wallet for manual management after stopping. A position-load failure disables
  the review action without rendering a separate Retry control. Step 2 renders
  `Positions to sell` only when the prepared preview contains at least one
  position, then shows backend-authoritative estimated position value, estimated
  cashback, and both expected and minimum total quote received.
- All six preparation capabilities use shared prepared-action recovery states.
  Flows that retain review use shared review rows and skeletons for server-owned
  values.
  Add Capital remains on its editable inline-summary view during preparation
  and proceeds directly to wallet submission when preparation returns READY.
- Withdraw is exposed only when the selected Copy Run status is `STOPPED`, then
  gated by `withdrawQuoteAvailability`. It sends `{}` to preparation and
  requires a positive prepared amount and connected-owner recipient. Review
  renders the prepared available balance, exact withdrawal amount, and recipient;
  success exposes Close and the History destination.
- Manual Sell refreshes the selected copy-account position and complete
  pending-obligation cursor chain. It uses the FIFO head ratio and total
  unresolved FIFO count. The refreshed position must still advertise Manual
  Sell before preparation. FIFO obligation count remains request validation and
  is not exposed as a user-facing review metric.
- Manual Sell owns every active-Copy skipped-sell recovery. Partial recovery
  uses the FIFO-backed Manual Sell preparation; a backend-advertised full close
  is the 100% special case and uses Close Position preparation internally. Both
  refresh `POSITION_VIEW_OPEN`, present the action as Manual Sell, and require
  `POSITION_SELL_CONTEXT_ALIGN_SKIP` in executable previews.
- Close Position is reserved for stopped-Copy leftover inventory. The stopped
  Copy detail loads `POSITION_VIEW_LEFTOVER`, refreshes that same view before
  preparation, and requires explicit leftover state, Close Position
  availability, and `POSITION_SELL_CONTEXT_STOP_COPY`.
- Both position actions use the shared four-preset/custom slippage control. The
  review renders remaining and sold base amounts, returned upfront fee, expected
  and minimum quote, quote-token cashback, effective slippage, and the prepared
  portion. Step 2 is identical for Manual Sell and Close Position. Manual Sell
  success targets My Copies, while Close Position targets History.
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

| Capability     | Current production UI                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start Copy     | Uses the API-selected Permit or Approve step, submits Create separately, then polls the Agent-filtered open Copy list and links to My Copies.        |
| Add Capital    | Shows current/new token allocation inline, then prepares, validates, simulates, and submits the exact call without a separate review step.           |
| Stop Copy      | Loads all open-position pages, supports zero to 32 selected IDs, shows selected-value/slippage guidance, and submits the exact prepared call.        |
| Withdraw Quote | Only a `STOPPED` Copy Detail exposes the availability-gated CTA; amount and owner recipient are server-prepared and non-editable.                    |
| Manual Sell    | Active-Copy skipped-sell recovery. Partial sells use FIFO-backed Manual Sell preparation; the 100% case uses Close Position preparation internally. Both require `ALIGN_SKIP`. |
| Close Position | Stopped-Copy leftover close. Loads and refreshes `LEFTOVER`, requires explicit leftover state and `STOP_COPY`, then links success to History.                  |

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

Start and Add use the fixed supported quote token for user input conversion.
Start renders its preparation-owned review values. Add renders its current/new
allocation summary before preparation, then still requires a validated READY
response before direct wallet submission. Stop accepts an empty selection.
Manual Sell has no arbitrary percentage input. Withdraw has no user-owned amount
or recipient input.

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

Manual Sell and Close Position use stateless preparation. A returned
preparation does not authorize execution by another wallet; the connected owner
still submits the exact call and the follower-account contract enforces its
caller.

## Deferred Position-Recovery TODO

Keep these two position-sell flows implemented but pending controlled
positive live E2E validation for now:

- Manual Sell on an active Copy after an Agent sell is skipped for the follower.
  The partial case requires a remaining on-chain follower balance, a non-empty
  pending-sell-obligation FIFO, advertised Manual Sell, and an executable
  `POSITION_SELL_CONTEXT_ALIGN_SKIP` preparation. The 100% special case requires
  advertised Close Position and the same `ALIGN_SKIP` context for the full
  remaining position.
- Close Position on a stopped Copy with leftover inventory requires
  `POSITION_VIEW_LEFTOVER`, explicit `isLeftover`, advertised Close Position,
  and an executable `POSITION_SELL_CONTEXT_STOP_COPY` preparation.

These states cannot be created deterministically from the frontend. A stable
positive E2E needs a controlled Agent position plus an Operator-side scoped
skip/failure injection. Stop Copy does not substitute for active Manual Sell,
and a skipped activity without recoverable unsold follower base does not create
a Manual Sell obligation.

## Implementation Completion

The currently defined Copy Trading code scope is complete. All owned read
surfaces and all six preparation-backed product flows are implemented, connected
to the typed service layer, and assigned to explicit shared or feature-local
owners. The two position-sell flows above remain TODO only for controlled
positive live E2E validation; their frontend implementation and static
verification are complete. Product surfaces that have not been defined remain
outside this code-implementation status.

## Verification

- The checked-in `openapi.yaml` matches the live pre-release Swagger contract
  fetched on 2026-08-14: 32 paths and 128 definitions.
- The service surface contains 26 GET queries and 6 POST mutations.
- All six preparation mutations have an owned UI flow.
- The local ABI, mock signer, and mock transaction-hash path have been removed.
- All 51 Copy Trading unit tests pass, including the direct READY handoff test.
- Commit review for this status covers `155ac5ebd`, `e1b98c55e`, `128783f4d`,
  `613a3757c`, and `8414b3601` in addition to the current working-tree changes.
- For the 2026-08-20 Add Capital update, app TypeScript, targeted ESLint,
  Prettier, and `git diff --check` pass. Browser QA, a production build, and a
  positive Add Capital transaction E2E were not run for this update.
- For the 2026-08-24 UI and Stop Copy update, app TypeScript, Copy Trading
  ESLint, all 51 Copy Trading unit tests, and staged/unstaged `git diff --check`
  pass. Browser QA, a production build, and positive live-transaction E2E were
  not run for this update.
- Manual Sell, including its partial and 100% variants, and stopped-Copy Close
  Position positive live E2E remain deferred until controlled eligibility
  fixtures are available.
