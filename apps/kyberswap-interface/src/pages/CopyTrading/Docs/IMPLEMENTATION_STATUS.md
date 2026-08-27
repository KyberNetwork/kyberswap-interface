# Copy Trading Implementation Status

Last reviewed: 2026-08-27

This is the single frontend-owned record for current code implementation,
accepted product decisions, ownership, and static verification evidence. The
current HTTP contract is documented in `FE_API_Catalog.md`; `openapi.yaml` is its
machine-readable API source. Both contract files are backend-owned inputs. The
checked-in `openapi.yaml` is synchronized byte-for-byte with the live Swagger
contract fetched on 2026-08-27.

All 27 GET and 6 POST Copy Trading API operations in the current catalog are
declared in the frontend service.

## Implementation at a Glance

| Layer              | Current status                                                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE API catalog     | `CURRENT INPUT`: 33 public operations are documented.                                                                                                                                  |
| Checked-in OpenAPI | `CURRENT INPUT`: synchronized with the live 33-operation Swagger contract; wallet-session routes and Bearer security are removed.                                                      |
| RTK Query service  | `CODE-COMPLETE`: all 27 GET and 6 POST operations are declared and typed.                                                                                                              |
| Read UI            | `CODE-COMPLETE` for currently defined designs. The activity structured fields and Closed Position execution details below are API-only and remain pending Figma review before UI work. |
| Write UX           | `CODE-COMPLETE`: all six actions use prepared-action validation; Add Capital submits directly after preparation while the other review-bearing flows retain review.                    |
| Write integration  | `CODE-COMPLETE`: exact API-prepared calls, receipt-success completion, Start Copy list polling, stateless recovery preparation, and async cache refresh are connected.                 |
| Responsive UI      | `CODE-COMPLETE`: all defined main Copy Trading pages use content-specific responsive navigation, aligned card metrics, opt-in scroll areas, tables, tabs, side panels, and charts.     |
| Code organization  | `REVIEWED`: all 87 TypeScript and TSX files under `pages/CopyTrading` follow the reviewed ownership boundaries; shared presentation is centralized while queries and flows stay local. |

## Changes Included Since the Previous Review

The 2026-08-25 review also includes the Copy Trading commits between the prior
status update and the current working tree:

- `155ac5ebd` scopes wallet- and argument-sensitive RTK reads to `currentData`.
  Agent actions, owner summaries, and Sidebar Open Copies do not retain a
  previous wallet, chain, or Copy Run result while the next query is pending.
  Performance charts intentionally retain their last data while a new window
  loads. Open Copies clears immediately when no owner wallet is available.
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
- `0f638409e` completes the Copy Trading semantic-text pass and
  Stop Copy empty/loading refinements. Standalone prose and status messages use
  block semantics, form labels target their inputs, and heading content no
  longer nests block rows. Stop Copy uses the Copy Run open-position count to
  stabilize its initial empty state and contextual note.
- `d041bab8a` adds the first responsive-layout pass. It adds
  a mobile Sidebar drawer with a sticky, horizontally scrollable breadcrumb;
  converts the Agent Leaderboard and the three Agent Profile data tabs to card
  layouts below the table breakpoint; compacts KPI cards, Agent identity,
  controls, and performance charts by content type; and keeps side-panel
  layouts from squeezing their primary content.
- `c527e3e48` completes responsive presentation for Open Copies, Copy History,
  Copy Detail tables, side panels, timelines, and independently controlled
  Agent and Copy Run performance charts.
- `1bfda56bf` adds the reusable application-level `ScrollArea`. Copy Trading
  desktop tables opt into visible horizontal scrolling, while `InfiniteScroll`
  supports horizontal, vertical, or both axes and defaults to both. The shared
  component overrides the global hidden-scrollbar reset only where it is used,
  retains native browser track and thumb styling, and exposes `sm` and `md`
  thicknesses.
- `877982db6` standardizes responsive table-card content through
  shared `TableCardGrid` and `TableCardField` primitives. Agent Leaderboard, My
  Copies, Copy History, Agent Positions and Trade History, and Copy Detail Open
  Positions, Trade History, and Action Logs use the same two-column rhythm.
  Right-column labels and values align together, full-width identifiers and
  details use an explicit span, status badges align with the Token value, and
  long values remain bounded by the card. The same commit introduces shared
  responsive-detail layout primitives and explicit Agent/Copy Detail ordering.
- `b74aa9a73` refines desktop position-table geometry for a Full HD baseline,
  keeps numeric values unbroken, aligns headers with body cells, combines paired
  Opened/Closed timestamps, and keeps the Agent Profile side column sticky only
  while the two-column layout is active.
- `43d955d8b` removes the redundant Status column from open-position tables,
  moves History Current Balance to the final column, places the Manual Sell rate
  below Portion to sell, and introduces the shared Copy Trading token-logo
  fallback used by Manual Sell and Remaining in Wallet.
- The current 2026-08-26 UI follow-up derives copied-Agent state from the current
  owner's selected-chain Open Copy Runs, replaces passive `Copied` text with a
  compact `My Copy` link, and gives Leaderboard, My Copies, and Copy History rows
  native links on both desktop and mobile. Row links support browser new-tab
  behavior while independent action buttons remain outside the link hit target.
- The current code extends the completed readability audit to all 87
  TypeScript and TSX files under `pages/CopyTrading`. Agent and Copy Detail now
  share `DetailTabBar`; prepared-action review rows share their metric fallback;
  strategy, lifecycle status, data-quality status, and risk presentation use
  explicit mappings; capital amount validation is separated from hook
  orchestration; and Stop Copy position loading, row rendering, and
  selection-list composition are grouped locally. Query keys and cursor
  ownership remain local to their existing consumers, while API request and
  prepared-action behavior reflect the current contract described below.

## Contract and Service Coverage

`services/copyTrading/api/baseApi.ts` owns the shared `createApi` and
`fetchBaseQuery` configuration, reducer, and middleware. Discovery, Agents,
Copy Runs, Copy Accounts, and prepared actions each inject their endpoints
directly into that shared API. Consumers import the endpoint group that owns
the hook they use instead of relying on a later group as an endpoint superset.
Together these endpoint groups declare all 33 public operations:

- 27 GET queries, including the run-scoped effective cashback policy,
  copy-account wallet inventory, and position-scoped closed executions.
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
- Position filters map to `POSITION_VIEW_OPEN` and `POSITION_VIEW_CLOSED`.
- Agent action logs use `/action-logs`.
- Empty pending-sell obligations normalize `data: null` to an empty list.
- Response metadata preserves freshness, completeness, finality, and reason as
  independent field-group quality dimensions without inferring missing values.
- Status-bearing metrics preserve their raw metric objects while renderable
  values are exposed only for `CURRENT` and `STALE`.
- Position display amount prefers `displayBaseRaw`.
- Copy Run lifecycle preserves `ACTIVE`, `CLOSING`, `STOPPED`, and `CLOSED`.
- Position `ACTIVE` and `CLOSING` both map to compatibility `status: "open"`;
  exact API lifecycle is preserved separately in `lifecycle`.

## API-Only Updates Pending Figma Review

The following contract changes are integrated through query parameters, types,
adapters, endpoints, and focused service tests. Their existing UI presentation
is intentionally unchanged. Review the corresponding Figma designs before
adding, removing, or rearranging any user-facing content:

- **Alerts Feed and Copy Run Logs:** existing consumers send the appropriate
  `activitySurface` (`ALERT_FEED` or `COPY_RUN_LOG`). The service layer maps the
  stable `category`, `subtype`, `alertId`, leader context, user outcome, and
  structured alert summaries. The UI does not yet use those new fields to
  change row identity, labels, details, colors, or Pending/Succeeded/Skipped
  presentation.
- **Closed Positions:** cumulative base sold, cumulative quote received, final
  transaction hash, the optional bounded `closedExecutionPage`, and the
  cursor-backed position-scoped `closed-executions` endpoint are typed and
  adapted. The existing Closed Positions table does not yet expose these
  fields or an execution-detail expansion. Its columns, responsive layout,
  interaction, loading, and pagination presentation require Figma review first.

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
- Pending sell obligations when an active position-recovery Step 1 opens. The
  complete cursor-backed FIFO is displayed by both partial and full recovery;
  partial Manual Sell also reuses it as preparation input.

The following eleven GET operations are declared but have no dedicated Copy
Trading UI consumer:

- Copy Run cashback policy. Its service contract is integrated, but no
  fee/cashback product surface has been defined.
- Copy Run position closed executions. Its service contract is integrated, but
  execution-detail UI remains pending Figma review.
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
- Agent Positions, Agent History, Action Logs, Copy Run detail tabs, and Alerts
  Feed cursor collections use infinite scroll inside bounded scroll containers.
- Leaderboard, My Copies, and Copy History use cursor-backed Previous / Page N /
  Next pagination with 5, 10, and 5 rows per page respectively. The API does
  not expose a total count, so the UI does not invent numbered last-page
  navigation.
- Infinite-scroll lists use TanStack `useInfiniteQuery`; paged Leaderboard, My
  Copies, and Copy History use `useCursorPageQuery`. Both invoke the existing
  RTK lazy query trigger from `queryFn` and pass opaque cursors unchanged.
- Copy Detail owns independent cursor chains for Open Positions, Closed
  Positions, and owner activity filtered by `copyRunId`. Open Positions is the
  single non-terminal collection and always requests `POSITION_VIEW_OPEN`.
- A rejected or expired non-initial cursor resets that collection to page one;
  cursorless HTTP 400 requests remain normal request errors.
- Agent and Copy Run performance charts intentionally request only the first
  page with `limit=100`.
- Sidebar Agents is a selected-chain snapshot with `limit=10`; Open Copies is
  independently capped at `limit=10`.
- Infinite-scroll collections intentionally have no manual Retry action. They
  keep the error state until the query refetches or the surface remounts.
- Copy-run rows use their `agentSnapshot`; My Copies and History do not issue a
  redundant agent collection request.
- Leaderboard copied state comes from the current owner's selected-chain Open
  Copy Runs. An existing run exposes a compact `My Copy` link to its detail;
  otherwise the advisory-gated `Copy` action remains available.
- Navigable Leaderboard, My Copies, and Copy History desktop rows and mobile
  cards use native links. Ctrl/Cmd-click, middle-click, and browser context-menu
  new-tab behavior work without nesting row links around action buttons.
- Wallet- and argument-sensitive non-chart RTK reads consume `currentData`, so
  a result cached under previous query arguments is not rendered while the
  current request is pending. Performance charts use `data` by product decision
  to keep the previous chart visible during a window change. Sidebar Open
  Copies also requires a current owner.
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

## Responsive Layout Coverage

Responsive behavior follows the shared application breakpoints by content
type. Tailwind minimum-width screens are configured one pixel above the
inclusive `MEDIA_WIDTHS` values, so CSS variants and JavaScript media queries
meet at the same boundaries:

- Up to `768px` (`max-sm` / `MEDIA_WIDTHS.upToSmall`): long tab labels use
  their short forms; Agent identity and chart titles use compact typography;
  Agent Profile and Copy Detail performance charts can collapse with animated
  height and opacity; and the chart window control stays inside the collapsible
  content.
- Up to `992px` (`max-md`): KPI collections use two columns, with an odd final
  item spanning the row. Agent Profile and Copy Detail performance cards use
  reduced padding, square full-bleed mobile surfaces, and compact icons and
  gaps. Copy Detail's start/stop timeline stacks vertically, and its Action
  Logs use cards instead of the 900px table.
- Up to `1200px` (`max-lg`): the desktop Sidebar becomes a drawer; the sticky
  breadcrumb replaces page-local Back links; Copy Trading page padding is
  reduced; and the Agent Leaderboard, Agent Profile data tabs, Open Copies,
  Copy History, and Copy Detail Open Positions use card-oriented layouts
  instead of wide tables.
- Up to `1400px` (`max-xl`): primary-content and 340px side-panel grids stack
  into one column. Agent Detail keeps Leaderboard first, followed by Capital
  In / Copy This Agent, performance charts, Positions / Trade History / Action
  Log, Agent Risk, Strategy & Execution, and Whitelisted Tokens. Copy Detail
  orders Capital In, Agent Risk, Remaining in Wallet, Withdraw when available,
  main tabs and performance, then Strategy & Execution and Whitelisted Tokens.
  Copy Detail Trade History also uses cards instead of its 1320px table.

Above `1400px`, Agent and Copy Detail retain independent two-column sticky side
columns. The side column uses `top-4 self-start` and does not continue scrolling
past its own content; below that breakpoint its grouping wrapper becomes
`contents` so every card participates in the explicit single-column priority.

Responsive table cards follow one content hierarchy: identity or Token and
status first; full-width Trade ID or Details next; paired performance, price,
balance, P&L, fee, and time metrics after that; and row actions last. The left
column aligns left and the right column aligns right. My Copies intentionally
lets its unmatched final Positions metric span the full row instead of leaving
an empty half-row.

Scrollable table surfaces use the generic `ScrollArea` instead of feature-
specific scrollbar classes. Desktop table wrappers request horizontal
scrolling; bounded `InfiniteScroll` collections retain both-axis overflow by
default. Scrollbars keep the browser-native colors and appear only on surfaces
that opt into the shared component.

Desktop position tables use Full HD-oriented minimum widths and explicit local
column tracks. Numeric and identifier values remain unbroken; only intentional
time columns may wrap or stack. Header and body alignment follow the same rule:
identity/text left, numeric values right, and dedicated action columns centered
or right-aligned by their local table definition. Open-position tables omit the
redundant always-active Status column.

All defined main read surfaces now have responsive presentation. Desktop table
layouts and their bounded horizontal scrolling remain unchanged above each
content-specific card breakpoint. Responsive browser QA is still intentionally
left for manual verification and is not claimed here.

## Accepted Product Decisions

- Keep the eleven currently unowned GET operations documented without inventing
  routes or secondary tables.
- Keep Agent and Copy Run performance at the first API page (`limit=100`).
- Keep Sidebar Agents capped at 10 items for the selected network and Open
  Copies capped at 10 items independently.
- Open and History membership remains owned by the server response.
- Stop Copy trusts the Copy Run passed by the entry point and loads the complete
  open-position cursor chain once when the modal opens. It does not refetch that
  list immediately before preparation. Both active recovery variants similarly
  load their complete pending-sell FIFO once when Step 1 opens; partial Manual
  Sell reuses that snapshot as preparation input. Stop Copy Close Position
  performs no modal-owned read before preparation. The preparation response
  remains authoritative before wallet submission.
- The Stop Copy modal owns loading every open-position cursor page. An
  incomplete or invalid cursor chain prevents preparation rather than
  presenting a partial position list. Position-load failure has no separate
  Retry control; the disabled action communicates that positions are
  unavailable, consistent with other read-query error surfaces.
- Infinite-scroll read surfaces show their error state without a manual Retry
  button. Recovery is owned by a later query refetch or remount.
- Withdraw trusts the Copy Run and availability passed from Copy Detail or Smart
  Wallet. The modal does not reload either entity before preparation. It reads
  the pinned quote-token balance from the existing wallet-inventory cache for
  Half/Max and early insufficient-balance feedback. A typed positive amount can
  still proceed when that cache has no balance yet; preparation remains the
  authoritative balance validation.
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
  destination remains flow-owned: My Copies for Start/Add/Manual Sell and an
  active or closing Withdraw; History for Stop/Close Position and a stopped or
  closed Withdraw.
- Stop Copy keeps position loading, selection, selection-cap validation, and
  selected-ID validation local. `ManagePositionModal` owns three position-sell
  Step 1 contexts: active partial Manual Sell, active full-recovery Close
  Position, and closing-Copy Close Position. Step 1 owns their distinct
  reason and source validation; Step 2, submission, and recovery use the same
  token-sell review composition. These concerns are not part of the shared
  capital abstraction used by Start Copy and Add Capital. Stop and position
  actions share only the prepared-action slippage control and default while
  retaining flow-local state and request conversion to basis points.

## Current Prepared-Action Write UI

The production write path is split by ownership:

- Each action folder under `modals/` owns its modal composition, action-specific
  guards, preparation request and response validation, review or inline summary
  metrics where applicable, tests, and destination navigation.
- `components/common/TokenLogo.tsx` owns Copy Trading token-logo normalization.
  It preserves API `logoUrl` metadata, then lets the shared `CurrencyLogo`
  derive a chain/address URL, and finally falls back to the unknown-token image.
  It performs no per-row token-service request. Manual Sell and Remaining in
  Wallet use this shared path; capital inputs continue through
  `CurrencyInputPanel` and its existing `CurrencyLogo` integration.
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
- `modals/ManagePositionModal/` owns three position-sell Step 1 contexts. Active
  partial and full recovery share one pending-sell FIFO load and display path.
  Partial recovery uses that snapshot with `prepareManualSell`; active full
  recovery and closing-Copy recovery use `prepareClosePosition`.
  All three contexts share the same Step 2 token-sell review, prepared-action
  submission, and recovery composition. `positionSellFlow.ts` keeps their
  labels, source contexts, destinations, and Step 1 variants in one typed flow
  map, with the two backend preparation contracts in a separate typed map.
  Remaining amount uses `displayBaseRaw` rather than substituting a gross or
  net field.
- `modals/WithdrawQuoteModal/` owns an Add Capital-style amount panel with
  action-only `Half` and `Max` presets. Typed and Half amounts use a canonical
  positive raw amount below `uint256.max`; Max displays the current balance in
  the input but sends `uint256.max` as the execution-time sentinel. Review
  derives Max from the prepared `sweepAmountRaw` and displays the prepared quote
  balance as a normal token amount, keeping sentinel semantics transparent to
  the user. The flow binds the request to the prepared sweep, validates owner
  recipient and prepared balance evidence, and routes success to the current
  Open or History view without changing lifecycle membership locally.
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
  preparation terminology. Prepared `warnings[]` remain transport data and are
  not rendered; blocking conditions use typed status and reason states. Success
  uses one generic confirmation description; titles and destinations remain
  action-specific.
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
- Add Capital shows the available run-level Capital In estimate above the
  capital panel and a client-projected new estimate below it using the configured
  quote-token label. These values are derived from USD display data because the
  run summary has no raw allocated-token amount. The service adapter accepts
  canonical `capitalInUsd` only when the projection is `READY`, otherwise the UI
  can use `observedCapitalInUsd` as its display fallback. Projection status is
  not propagated into the UI model and does not add a user-facing qualifier to
  the amount. Wallet balance has an explicit spinner while its RPC read is
  pending. The Add Capital CTA converts the decimal input to raw units, prepares
  and validates the exact amount/call, then proceeds directly to wallet
  simulation and submission with no intermediate review step.
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
  values. `AVAILABLE` and `TRY_PREPARE` use the same product CTA; preparation is
  transparent and its response is authoritative. `PENDING` and `UNAVAILABLE`
  remain typed non-executable states with backend reason copy. Add Capital stays
  on its editable inline-summary view during preparation and proceeds directly
  to wallet submission when preparation returns READY.
- Withdraw is exposed independently of active, closing, stopped, or closed
  lifecycle when `withdrawQuoteAvailability` is present. `AVAILABLE` and
  `TRY_PREPARE` both expose the normal Withdraw CTA; `PENDING` and `UNAVAILABLE`
  remain disabled. Its balance-derived Half/Max controls depend only on the
  pinned quote balance cached from `wallet-inventory`, not wallet connection or
  current network. A typed positive amount does not depend on that cache;
  cached balance, when present, provides an early insufficient-balance error.
  Preparation always sends required `amountRaw` and remains authoritative.
  READY must return the same `sweepAmountRaw`; typed/Half amounts also require
  sufficient prepared balance. Max remains `uint256.max` internally while
  review always displays a normal prepared token amount.
- Across all write forms, wallet connection owns only Connect Wallet and
  owner-bound execution, while current network owns only Switch Network and
  transaction execution. Form/advisory validation blocks the action CTA only
  after those prerequisites are met. Balance presets depend only on their
  balance source, and in-flight preparation independently locks interaction.
- Both active recovery variants load the complete pending-obligation cursor
  chain when Step 1 opens and display every skipped sell action. Partial Manual
  Sell uses the same FIFO head ratio and unresolved count for preparation
  without another read.
- On an active Copy, an advertised Manual Sell uses the FIFO-backed Manual Sell
  preparation, while an advertised Close Position uses full Close Position
  preparation. Both require `POSITION_SELL_CONTEXT_ALIGN_SKIP` in executable
  previews.
- Copy Detail has no separate residual-position collection. Its Open Positions
  tab always loads `POSITION_VIEW_OPEN`; each returned position's
  `actionKind`/`availableActionKinds` decides whether an action is rendered.
  A Close Position advertised while the Copy Run is `CLOSING` uses
  `POSITION_SELL_CONTEXT_STOP_COPY`.
- Both position actions use the shared four-preset/custom slippage control. The
  review renders remaining and sold base amounts, returned upfront fee, expected
  and minimum quote, quote-token cashback, effective slippage, and the prepared
  portion. Rate is grouped immediately below Portion to sell. Prepared base-token
  metadata is merged with the position snapshot once and reused for the sell
  amount, rate, returned upfront fee, symbol, decimals, and logo. Step 2 is
  identical for Manual Sell and Close Position. Active recovery success targets
  My Copies, while Stop Copy Close Position targets History.
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

| Capability     | Current production UI                                                                                                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start Copy     | Uses the API-selected Permit or Approve step, submits Create separately, then polls the Agent-filtered open Copy list and links to My Copies.                                                                                                                                                                                         |
| Add Capital    | Shows current/new token allocation inline, then prepares, validates, simulates, and submits the exact call without a separate review step.                                                                                                                                                                                            |
| Stop Copy      | Loads all open-position pages, supports zero to 32 selected IDs, shows selected-value/slippage guidance, and submits the exact prepared call.                                                                                                                                                                                         |
| Withdraw Quote | Copy Detail exposes the advisory-gated CTA across active, closing, stopped, and closed runs. Its amount panel offers action-only Half and Max presets; Max sends the explicit full-balance sentinel internally while review shows the prepared quote balance as a normal amount. The prepared recipient and call remain server-owned. |
| Manual Sell    | Position-advertised active-Copy skipped-sell recovery. Loads the pending FIFO and requires `ALIGN_SKIP`.                                                                                                                                                                                                                          |
| Close Position | Position-advertised full close. A `CLOSING` Copy uses `STOP_COPY` and links success to History; active recovery keeps `ALIGN_SKIP`.                                                                                                                                                                                                        |

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
  the same FIFO display evidence, advertised Close Position, and the same
  `ALIGN_SKIP` context for the full remaining position.
- Close Position advertised by an open position on a `CLOSING` Copy uses an
  executable `POSITION_SELL_CONTEXT_STOP_COPY` preparation.

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
outside this code-implementation status. Responsive implementation is
code-complete for all currently defined main read surfaces at the surface level
described in `Responsive Layout Coverage`; responsive browser QA remains
deferred as documented below. The current page-layer source has also completed
a full maintainability review without changing service or transaction-flow
contracts.

## Verification

- The checked-in `openapi.yaml` matches the live Swagger contract fetched on
  2026-08-27: 33 paths and 149 definitions.
- The service surface contains 27 GET queries and 6 POST mutations.
- All six preparation mutations have an owned UI flow.
- The local ABI, mock signer, and mock transaction-hash path have been removed.
- All 87 Copy Trading unit tests pass, including cursor recovery, API contract
  adaptation, the direct READY handoff, and
  explicit Withdraw Quote amount-binding tests.
- Commit review for this status covers the Copy Trading sequence from
  `155ac5ebd` through `877982db6` in addition to the current working-tree
  readability changes.
- For the 2026-08-20 Add Capital update, app TypeScript, targeted ESLint,
  Prettier, and `git diff --check` pass. Browser QA, a production build, and a
  positive Add Capital transaction E2E were not run for this update.
- For the 2026-08-24 UI and Stop Copy update, app TypeScript, Copy Trading
  ESLint, all 51 Copy Trading unit tests, and staged/unstaged `git diff --check`
  pass. Browser QA, a production build, and positive live-transaction E2E were
  not run for this update.
- For the 2026-08-24 responsive updates, app TypeScript, targeted ESLint,
  Prettier, all 51 Copy Trading unit tests, and staged/unstaged
  `git diff --check` pass. Responsive browser QA was intentionally left for
  manual verification and is not claimed here.
- For the 2026-08-25 scroll-area and responsive card-alignment updates, app
  TypeScript, targeted ESLint, Prettier, all 51 Copy Trading unit tests, and
  `git diff --check` pass. Browser QA was unavailable in the current session;
  responsive visual verification remains manual and is not claimed here.
- For the 2026-08-25 full-source readability audit, Copy Trading ESLint, app
  TypeScript, Prettier, all 51 Copy Trading unit tests, and staged/unstaged
  `git diff --check` pass. The audit covered all 80 TypeScript and TSX files in
  `pages/CopyTrading`; no browser QA or positive live transaction E2E is claimed
  by this code-organization pass.
- For the 2026-08-25 API-contract and write-flow ownership update, the live
  OpenAPI hash and YAML shape, app TypeScript, full Copy Trading ESLint, all 80
  Copy Trading unit tests, focused formatting, and `git diff --check` pass. The
  review removed the temporary wallet-inventory delay wrapper, kept Capital In
  projection status inside the service adapter, left optional Stop Copy progress
  outside the UI because it is not part of the current design, removed
  low-value adapter tests, decoupled typed Withdraw from the inventory cache,
  centralized data-quality status in `DataQualityStatusBadge`, made prepared
  warnings transparent, and aligned CTA/preset ownership across all write
  flows. Browser QA, production build, and a positive typed/Half/Max Withdraw
  Quote transaction E2E were not run.
- For the 2026-08-26 position-display, shared token-logo, Leaderboard action,
  and native row-link updates, app TypeScript, targeted Copy Trading ESLint, and
  `git diff --check` pass. These checks cover code structure and types only;
  responsive/browser visual QA, context-menu and modified-click browser QA, a
  production build, and positive live-transaction E2E were not run.
- For the 2026-08-27 contract integration and maintainability review, app
  TypeScript, full Copy Trading ESLint, all 87 Copy Trading unit tests, focused
  formatting, and staged/unstaged `git diff --check` pass. Browser QA, a
  production build, and positive live-transaction E2E were not run.
- Manual Sell, including its partial and 100% variants, and stopped-Copy Close
  Position positive live E2E remain deferred until controlled eligibility
  fixtures are available.
