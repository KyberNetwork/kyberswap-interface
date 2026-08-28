# Copy Trade API — Frontend Integration Catalog

This document describes the public HTTPS/JSON contract used by frontend
applications. It intentionally excludes service architecture, storage, and
deployment details. Use each changelog entry's status instead of assuming the
newest documented behavior is already merged or deployed.

## Changelog

### 2026-08-28 — Post-redesign availability hardening

Status: merged on `origin/main` through commit
`464df89d77680feede66cfc9e8d569bde26a35e5`. Deployment remains
environment-specific.

This release doesn't add or remove an HTTP path, but it changes response
schemas and enum vocabulary. Treat it as a frontend model migration and
regenerate the API client from the current OpenAPI or protobuf contract. Don't
reuse a client generated before this release.

#### Copy-run list and detail models

The copy-run list and detail routes now return different data types:

| Route | `data` type | Detail-only fields |
| --- | --- | --- |
| `GET /users/{ownerAddress}/copy-runs` | `CopyRunListItem[]` | None |
| `GET /users/{ownerAddress}/copy-runs/{copyRunId}` | `CopyRunSummary` | `portfolioPnlUsd`, `feeBreakdown`, `copyRunWinRatePct`, and `copyRunClassifiedClosedPositionCount` |

Both types continue to include `currentBalanceUsd`, `totalPnlUsd`,
`totalPnlPct`, action-advisory fields, and copy-run lifecycle fields. Don't cast
a list item to `CopyRunSummary`. Fetch the detail route when the selected-run
screen needs Portfolio P&L, Net Fees, or copy-run win rate.

Shared monetary fields have these semantics:

- `capitalInUsd` is the canonical Capital In projection. Use
  `capitalInProjectionStatus`: `READY` identifies the completed generation,
  `SYNCING` can carry a prior value whose metric status is `STALE`, and
  `UNAVAILABLE` authorizes no value. `capitalInUsd` can legitimately be zero
  when the projection is `READY`.
- `currentBalanceUsd` is either current or unavailable. Don't retain and label
  an older numeric balance as safely stale.
- `totalPnlUsd` is realized plus unrealized P&L. Execution economics already
  include fees and rebates, so don't subtract Net Fees again.
- `totalPnlPct` is the server-computed, cash-flow-neutral time-weighted return.
  Don't derive it as simple ROI, APR, or APY.

The following legacy copy-run fields are removed and reserved in both models:

```text
realizedPnlUsd
flatFeesCapturedUsd
cashbackReceivedUsd
netFeeCostUsd
estimatedCashbackPendingUsd
observedCapitalInUsd
```

Remove generated accessors and UI fallbacks for these fields. In particular,
don't substitute `observedCapitalInUsd` for `capitalInUsd` or
`totalAllocatedUsd`. `totalAllocatedUsd` remains a separate status-bearing
summary metric. `portfolioPnlUsd` isn't a rename or drop-in replacement for
the removed `realizedPnlUsd`.

The detail-only fields have these semantics:

- `portfolioPnlUsd` contains P&L from closed positions only. Partial realized
  gains or losses from positions that remain open stay in chart and APR inputs;
  they don't enter this headline. When there are no closed positions, the
  server returns a current zero. If any required closed-position contribution
  is unavailable, the whole metric is unavailable rather than a partial total.
- `feeBreakdown.feeChargedUsd` is the total upfront flat fee collected across
  open and closed positions.
- `feeBreakdown.rebatesUsd` combines actual rebates for closed positions with
  estimated rebates for open positions at current market prices. While a
  position remains open, refresh copy-run detail to receive price-driven
  updates; don't label the combined value **Rebates received**. After all
  positions close, this value contains actual rebates only.
- `feeBreakdown.netFeesUsd` equals `feeChargedUsd - rebatesUsd`. A negative
  value is valid and represents net rebate credit.
- `copyRunWinRatePct` is wins divided by all classified closed positions.
  Break-even positions remain in the denominator as non-wins.
- `copyRunClassifiedClosedPositionCount` is the denominator used by the win-rate
  metric.

Each monetary or count field remains a status-bearing metric. Use the returned
value only when that metric's own status permits it. Don't calculate Portfolio
P&L, Net Fees, total P&L, return percentage, or win rate in the client.
`feeChargedUsd` can remain current while an unavailable rebate estimate makes
`rebatesUsd` and `netFeesUsd` unavailable; render each component independently.

#### Agent and follower position models

The agent position routes now return `AgentPositionSummary`:

```text
GET /agents/{agentId}/positions
GET /agents/{agentId}/positions/{positionId}
```

`AgentPositionSummary` is leader-side data. It deliberately omits follower
identity and accounting fields, including `userPositionId`, `copyRunId`,
`copyAccount`, fee and rebate fields, skipped-sell and leftover state, follower
action recommendations, and `positionPnlUsd`. Use its `openedTxHash` and
`latestTxHash` only as leader-side transaction hashes.

Follower position routes continue to return `PositionSummary`:

```text
GET /users/{ownerAddress}/copy-runs/{copyRunId}/positions
GET /users/{ownerAddress}/positions
GET /copy-accounts/{chainId}/{copyAccount}/positions
```

`PositionSummary` adds `positionPnlUsd`:

- For active or closing inventory, it is realized P&L to date plus marked
  unrealized P&L plus estimated remaining cashback.
- For a closed position, it is realized P&L only.
- The metric is all-or-nothing. If any required component is unavailable, the
  headline is unavailable rather than a partial sum. If any required component
  is stale, the headline is stale and uses the oldest contributing `asOf`.

Use `positionPnlUsd` for the follower Trade ID headline. Don't cast
`AgentPositionSummary` to `PositionSummary`, combine the follower P&L
components in the client, or substitute leader transaction hashes for follower
receipts.

#### Prepared-action display enrichment

Every successful response from all six preparation routes now includes the
required `data.displayEnrichment` object:

```text
POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy
POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareAddCapital
POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareStopCopy
POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareWithdrawQuote
POST /users/{ownerAddress}/copy-runs/{copyRunId}/positions/{userPositionId}:prepareManualSell
POST /users/{ownerAddress}/copy-runs/{copyRunId}/positions/{userPositionId}:prepareClosePosition
```

Handle these enrichment statuses:

```text
ACTION_DISPLAY_ENRICHMENT_STATUS_NOT_APPLICABLE
ACTION_DISPLAY_ENRICHMENT_STATUS_COMPLETE
ACTION_DISPLAY_ENRICHMENT_STATUS_UNAVAILABLE
```

When the status is `UNAVAILABLE`, handle one of these reasons:

```text
ACTION_DISPLAY_ENRICHMENT_UNAVAILABLE_REASON_SOURCE_UNAVAILABLE
ACTION_DISPLAY_ENRICHMENT_UNAVAILABLE_REASON_BUDGET_EXHAUSTED
```

Interpret the status as follows:

| Status | Frontend behavior |
| --- | --- |
| `NOT_APPLICABLE` | No optional aggregate enrichment is needed for this preparation. Continue from the top-level action status. |
| `COMPLETE` | Render available optional preview fields according to each field's own metric or policy status. |
| `UNAVAILABLE` | Omit or degrade only the optional preview. Use `unavailableReason` for bounded diagnostics. |

Display enrichment is render-only. An unavailable enrichment doesn't change an
executable top-level status, invalidate `data.call`, or change calldata. Submit
only when both conditions are true:

- `call` is present.
- The top-level status is `READY`, or, for Start Copy only,
  `PARTIALLY_COMPLETED`.

These conditions remain authoritative when the optional preview can't be
rendered. Degrade the preview UI instead of blocking the transaction.

Allocation and preview-price degradation now use `displayEnrichment`. The
generated enum still contains `PREPARED_ACTION_WARNING_ALLOCATION_STALE` for
wire compatibility, so tolerate it when decoding, but the current aggregate
server doesn't emit it. The warnings currently emitted by this server are:

```text
PREPARED_ACTION_WARNING_INVALID_STOP_INTENT_RECOVERED
PREPARED_ACTION_WARNING_OWNER_SNAPSHOT_REQUIRES_REFRESH
```

For Start Copy, apply the same rule to `startCopy.copyConfirmPolicy`. Render
the price-deviation bounds only when `priceDeviationStatus` permits a value.
Never hard-code fallback bounds. An unavailable policy can make
`displayEnrichment` unavailable without invalidating an otherwise executable
operator-authored call.

#### Metric quality and action availability

`FIELD_GROUP_FEES` is added for `CopyRunSummary.feeBreakdown`. Freshness,
completeness, and finality remain independent dimensions. For example,
`CURRENT` with `PROVISIONAL` and `STALE` with `FINAL` are both valid
combinations. `PROVISIONAL` doesn't hide an otherwise current metric, and
`FINAL` doesn't upgrade a stale metric to current.

Handle each metric status as follows:

| Metric status | Frontend behavior |
| --- | --- |
| `METRIC_STATUS_CURRENT` | Render the value normally, then apply any separate provisional-finality indication required by the product. |
| `METRIC_STATUS_STALE` | Render the value with a stale indication when the product surface allows stale presentation. |
| `METRIC_STATUS_UNAVAILABLE` | Render no number. Don't substitute zero or a value from another field. |
| `METRIC_STATUS_NOT_APPLICABLE` | Render no number or error. Hide the metric or label it **N/A**, as appropriate for the surface. |

Apply these rendering rules:

1. Apply each `meta.fieldQualities[]` entry only to the fields in its matching
   `group`. Don't blank a page or card because an unrelated group is stale.
2. Don't replace a valid leaf value with a loading placeholder solely because
   broad `meta.status` is stale.
3. Read Add Capital, Stop Copy, and Withdraw Quote state from the matching
   leaf `AdvisoryActionAvailability`. Read position actions from `actionKind`
   and `availableActionKinds`. Unrelated projector lag no longer suppresses
   these leaves when their exact relevant evidence is ready.
4. For positions, treat `actionKind` as the recommended action and
   `availableActionKinds[]` as the complete advisory set. Don't hide a second
   allowed action just because it isn't the recommendation.
5. Treat every read-side state as advisory. Always call the matching live
   preparation route before enabling wallet submission.

Handle the four advisory statuses as follows:

| Status | Frontend behavior |
| --- | --- |
| `ADVISORY_ACTION_STATUS_AVAILABLE` | Offer the control. Call live preparation when the user confirms; don't treat the read as transaction authorization. |
| `ADVISORY_ACTION_STATUS_TRY_PREPARE` | Label the control **Check availability** or equivalent. Call live preparation on confirmation, but don't claim the action is available yet. |
| `ADVISORY_ACTION_STATUS_PENDING` | Disable the control and refresh using the normal policy. Don't convert it to available after a client-side timeout. |
| `ADVISORY_ACTION_STATUS_UNAVAILABLE` | Disable the control and display the typed reason where useful. Don't construct or submit a call. |

If the optional action-advisory lookup is temporarily unavailable, the API
keeps the base read renderable and marks the action-advisory group unavailable
or pending. Keep displaying the non-action data; disable only the affected
advisory control until a refreshed read proves it. A distinct retry affordance
can request a refresh, but it must not submit or reuse calldata.

#### Formula publication and cursor restart

The currently applied formula generation stays readable while a replacement
generation builds and validates. The API switches to the replacement
atomically; it doesn't expose a partially rebuilt generation.

After an atomic formula switch or another mutable page-target change, a
continuation request can return HTTP 409. The diagnostic message depends on the
surface. Current messages include:

```text
page target advanced; restart from the first page
pending sell obligation state changed; restart from the first page
performance projection changed; restart from the first page
closed execution history changed; restart from the first page
```

Handle any HTTP 409 from a cursor-paginated surface as a restartable result:
discard the full page chain, clear the cursor, and request page one with the
same filters and sort. Don't merge pages from the old and new targets. The
corresponding gRPC code is `ABORTED`. Branch on HTTP status or gRPC code; never
match the diagnostic message.

An HTTP 499 means the client canceled the request. Don't classify it as a
server timeout. A preparation dependency failure can return HTTP 503; discard
any earlier prepared call and request a new preparation instead of submitting
cached calldata.

#### Action logs and polling

The action-log importer now drops legitimate non-public operator entries, such
as HOLD and narrative-only decisions, without failing or stalling the public
page. The frontend receives only renderable public actions. Don't create
placeholder rows for missing sequence entries or infer actions from pagination
gaps.

This release reduces backend convergence delay. It doesn't require faster
frontend polling. Keep the existing polling policy, render returned stale data
according to its status, and don't reconstruct server formulas while waiting
for a newer generation.

Frontend migration checklist:

1. Regenerate the API client from the current contract.
2. Split copy-run list and detail view models.
3. Split agent and follower position view models.
4. Remove every reserved copy-run field listed above.
5. Add `displayEnrichment`, `FIELD_GROUP_FEES`, and the new enum handlers.
6. Make metric and field-group rendering independent.
7. Handle HTTP 409 by restarting pagination from page one.
8. Keep live preparation as the final transaction authority.

### 2026-08-26 — UI read-model contract cutover

Status: merged on `origin/main` in PR #48. Deployment remains
environment-specific; confirm that the target environment runs a compatible
image before enabling these frontend changes.

The 2026-08-28 release supersedes this release's copy-run fee and P&L fields
and its shared agent/follower position model. Integrate those surfaces from the
latest changelog entry above.

#### Performance charts

- `ListAgentPerformance` and `ListOwnerCopyRunPerformance` accept
  `WINDOW_ALL` in addition to `WINDOW_7D`, `WINDOW_30D`, and `WINDOW_90D`.
- `PERFORMANCE_SERIES_CUMULATIVE_TOTAL_PNL` is the default series when
  `series` is unspecified. It includes realized and unrealized PnL. Existing
  realized-only series remain available when explicitly requested.
- Each `PerformancePoint` adds `valuePct`. It is a non-annualized,
  cash-flow-neutral time-weighted return, not simple ROI, APR, or APY. Legacy
  series return `valuePct.status = METRIC_STATUS_UNAVAILABLE`.
- Performance responses add `effectiveWindowStart` and `evaluationAt`.
  Pagination pins both values. A projection change returns HTTP 409 (gRPC code
  `ABORTED`); restart from the first page with no cursor.
- `WINDOW_ALL` defaults to weekly points when `interval` is unspecified. It
  also accepts monthly points for cumulative equity, realized PnL, and total
  PnL. The shorter windows use daily points.
- Percentage can be unavailable while the matching USD point remains current
  or safely stale. Render each metric from its own status. Never calculate the
  percentage in the client.

Frontend migration:

1. Add **All** as a window option and send `WINDOW_ALL`.
2. Use `PERFORMANCE_SERIES_CUMULATIVE_TOTAL_PNL` for the default PnL chart.
3. Toggle between `valueUsd` and `valuePct` from the same response. Don't make
   a second request or derive percentage from USD points.
4. Label percentage as holding-period return. Don't label or annualize it as
   APR or APY.
5. On HTTP 409, discard the cursor and reload the first page.

#### Copy-run lifecycle, History, and balances

- A stopped or closed source run with an open or leftover position is exposed
  as `COPY_RUN_STATUS_CLOSING` and remains in the Open view. It doesn't enter
  History until both counts are zero.
- `CopyRunSummary.currentBalanceUsd` returns current account value. History
  uses the exact current stable-token balance; Open and Closing use the current
  complete portfolio value.
- `ListOwnerCopyRuns.sortBy` adds
  `OWNER_COPY_RUN_SORT_FIELD_CURRENT_BALANCE`. Both ascending and descending
  orders are supported.
- The cursor pins the freshness threshold, but Current Balance remains a live
  mutable sort: a newly refreshed balance can move across the keyset boundary
  between pages. A stale or missing balance is never sorted as numeric zero;
  it follows valued rows with an unavailable metric.
- Copy-run list and detail responses expose `totalPnlUsd` and `totalPnlPct`.
  List responses also continue to expose `unrealizedPnlUsd` with its own
  status.

Frontend migration:

1. Use server `status` and view membership. Don't move a run to History from a
   local stop timestamp.
2. Render History **Current Balance** from `currentBalanceUsd` only when its
   status is current.
3. Send the current-balance sort enum instead of sorting loaded pages in the
   browser.
4. Restart from the first page when the user requests a fully current ordering;
   don't merge independently refreshed pages into a frozen client-side sort.

#### Public action logs

- `ListAgentActionLogs` returns Buy and Sell actions only, including partial
  and full sells. HOLD, SKIP, and other narrative model events are suppressed.
- `limit` counts allowlisted action-log rows, not sessions. The response groups
  only the bounded rows on that page by `sessionId`, so one source session can
  appear on multiple cursor pages. Never treat one page's group as the complete
  source session.
- The copy-run log surface exposes only these category/subtype pairs:
  - Trade: Buy and Sell
  - Capital: Deposited, Capital topped up, and Capital withdrawn
  - Failed action: Skipped buy and Skipped sell
  - Fee or rebate: Flat fee captured and Rebate received

- Returned capital is normalized to Capital withdrawn. There is no separate
  Capital returned subtype.
- Public rows return token metadata and `txHash` only when canonical source
  evidence proves them. Don't reconstruct either value from `summary` text.

#### Owner alert feed

- Call `ListOwnerActivity` with
  `activitySurface = ACTIVITY_SURFACE_ALERT_FEED` for an owner-wide feed across
  copy runs. Use `ACTIVITY_SURFACE_COPY_RUN_LOG` for a copy-run log.
- Alert rows use the same public category and subtype vocabulary as copy-run
  logs and can contain leader-action plus user-action context.
- If the leader action exists before the follower outcome is known, the API
  publishes the stable alert with `PENDING`. Later canonical evidence updates
  the same `alertId`; don't create a second UI row.
- A skipped follower outcome changes the same alert to Failed action with
  Skipped buy or Skipped sell. Reorg correction can update or remove a row.
- Action-derived alert ordering uses immutable copy-action creation time.
  Late-arriving leader context updates the same alert without moving it in the
  feed; the leader's block time remains nested leader context.

Frontend migration: key alert items by `alertId`, display pending explicitly,
and replace or remove rows from refreshed server results. Don't fabricate a
success or failure after a client-side timeout.

#### Position receipts and Closed-tab executions

- Leader position rows expose leader-side `openedTxHash` and `latestTxHash`.
  Follower position rows expose follower-side hashes. Don't substitute hashes
  between sides.
- Closed follower positions add cumulative `totalBaseSoldRaw`,
  `totalQuoteReceivedRaw`, quote-token metadata, received-USD status, and final
  canonical sell transaction hash.
- `ListOwnerCopyRunPositions.includeClosedExecutions` defaults to false. The
  default response returns one position row with cumulative values and no
  nested execution page.
- Set `includeClosedExecutions = true` only when a user expands partial-sell
  details. `closedExecutionsLimit` is at most 10, and the parent position limit
  is at most 20 when expansion is enabled. One response can embed at most 100
  executions across all parents. When the parent limit is omitted, the server
  reduces it to fit that product cap; an explicit oversized combination is
  invalid.
- Use `ListOwnerCopyRunPositionClosedExecutions` for additional execution
  pages. A canonical sell-set change returns HTTP 409; reload that position's
  execution list.
- Nested execution tokens contain address, symbol, and decimals only; use the
  parent position for token name and logo. Expanded and continuation responses
  are capped at 512 KiB, so request a smaller page if the server rejects an
  unusually large encoded response.

Frontend migration: render the default Closed tab from cumulative position
fields. Fetch nested partial and final sells lazily. Display actual base sold
and net quote received; don't reinterpret gross accounting values.

#### Copy-run win rate

- `GetOwnerCopyRun` adds `copyRunWinRatePct` and
  `copyRunClassifiedClosedPositionCount` for that copy run.
- Win rate is winning closed positions divided by all classified closed
  positions. Break-even positions remain in the denominator as non-wins.
- List responses intentionally omit these detail-only metrics. Don't use the
  agent's win rate as a copy-run fallback.

#### Copy-confirm price deviation

- `PrepareStartCopy.data.startCopy.copyConfirmPolicy` returns target-fenced
  minimum and maximum price-deviation values in raw WAD, percent string, and
  basis-point forms.
- The policy is available only when the local aggregate snapshot matches a
  complete current operator target. Missing or stale target evidence returns
  an unavailable policy, not configured defaults and not a request-time
  operator fallback.
- The frontend must display the returned bounds and must not hard-code or
  calculate pair-policy values.

#### Arbitrary-token withdrawal

- This release still exposes `PrepareWithdrawQuote` only.
- Do not expose an **Other Tokens** withdrawal action. The contract's generic
  admin multicall permanently pauses the follower account and lacks the typed
  operator preparation and withdrawal-event contract required by the public
  API.
- A later backend release must add an operator-owned preparation RPC before the
  aggregate API can expose arbitrary-token withdrawal.

### 2026-08-24 — Withdraw Quote requires an explicit amount

Status: merged on `origin/main`. Don't enable the frontend change in an
environment until all operator replicas and then all aggregate API replicas
are updated.

- Adds the required `amountRaw` request field to Withdraw Quote. The API no
  longer treats an omitted amount or `{}` as a request to withdraw everything.
- Accepts a canonical positive decimal `uint256` string. Values from `1`
  through `uint256.max - 1` withdraw that exact raw quote-token amount.
- Reserves `uint256.max` as the only full-balance sentinel. It withdraws the
  quote-token balance available when the transaction executes, which can
  differ from the preparation preview.
- Returns typed reason
  `PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_BALANCE` when an exact requested
  amount exceeds the positive balance at the preparation block. The
  unavailable result doesn't contain a call, sweep amount, or recipient.
- Keeps preparation fail-closed. The aggregate API and operator bind the
  requested amount, current owner, exact-block balance, preview, recipient,
  call selector, calldata, and preflight result before returning `READY`.

Frontend migration:

1. Regenerate the client so `amountRaw` is present on every Withdraw Quote
   request. An omitted, empty, zero, signed, nondecimal, leading-zero, or
   overflowing value is invalid.
2. Send a value below `uint256.max` for an exact partial withdrawal. Send the
   decimal `uint256.max` value only when the user chooses to withdraw the full
   execution-time balance.
3. For `READY`, require `data.withdrawQuote.sweepAmountRaw` to equal the
   requested `amountRaw`, and submit the returned call unchanged.
4. Handle `PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_BALANCE` as normal product
   state. Refresh the balance and let the user enter a smaller amount or choose
   the full-balance action.

Rollout order: deploy every operator replica first, then every aggregate API
replica, and only then enable frontend requests with `amountRaw`. This order
creates a temporary preparation-availability gap instead of risking an old
replica interpreting a new request as the former implicit maximum sweep.

### 2026-08-22 — Backend verification addendum

Status: merged backend/API contract; no frontend implementation was performed.

- Regenerated protobuf/OpenAPI outputs are the wire authority for these
  backend changes in any target environment.
- Chart/performance pages may include a provisional open-tail point. Treat
  metric status and the `PERFORMANCE` field-quality group's `finality` as the
  display contract: open/reorg-risk tails are `PROVISIONAL`; finalized covered
  boundaries are `FINAL`. An empty array alone proves nothing. When the server
  proves that the selected window/cursor is an empty subset of an active
  future-scheduled projection, it returns complete current/stale quality with
  `PROVISIONAL` finality; a completed stopped projection can return `FINAL`.
  Missing required chart output remains unavailable. The backend audit repairs
  wholly lost/zero output; exact producers and repair paths handle partial
  suffix or per-trade gaps. Finality is based on rows remaining after lookahead
  trimming.
- Capital, realized PnL, flat fee, cashback, and net fee are independently
  computed monetary groups. A prior same-identity monetary value may be
  returned as `STALE` while its group is `SYNCING`; never render `UNAVAILABLE`
  as zero or use stale/provisional display data to authorize an action.
- Backend work wakes are now locally validated for faster convergence. At the
  configured 40 notifications/s database budget, PostgreSQL 18.3 tests measured
  41.48/s with two publishers and 6.02 ms p99, and 41.53/s with three
  publishers and 6.88 ms p99; both observed zero notification queue usage.
  This remains a backend hint path only; clients should continue to refresh
  from normal read metadata and preparation responses.
- The operator trade-token snapshot producer and a dormant aggregate importer
  are implemented locally, but the current API operator pin does not contain
  the generated RPCs. Until the operator revision is published, pinned, and a
  complete READY universe has been imported, the existing request-time source
  remains authoritative. No frontend cutover is included in this delivery.

### 2026-08-21 — field quality and faster convergence

- Adds a server-generated `meta.requestId` to read responses. The server
  ignores and replaces a caller- or handler-supplied value. An entropy failure
  can omit the ID, but doesn't fail an otherwise successful read.
- Adds `meta.fieldQualities[]` to read responses. Each entry describes one
  coherent field group by independent freshness, completeness, finality,
  reason, and provenance clocks. The array can be empty while producer groups
  migrate; absence doesn't prove that a group is current or complete.
- Keeps advisory wire value `2` named `ADVISORY_ACTION_STATUS_PENDING` and adds
  `ADVISORY_ACTION_STATUS_TRY_PREPARE` as wire value `4`.
- Keeps live action preparation authoritative. `PENDING` means that the
  aggregate lacks a current proof covering the latest relevant fact.
  `TRY_PREPARE` means that stale aggregate evidence covers every locally known
  relevant fact, so the UI may offer a preparation attempt, but must not claim
  that the action is available.
- Preserves a prior same-identity Capital In value as a `STALE` metric while
  `capitalInProjectionStatus` is `SYNCING`. Never render the stale value as a
  newly confirmed allocation.
- Adds field-quality groups for agent trade-token configuration, token
  metadata, and external enrichment. The staged Stage 1a target evaluates
  `GetAgent.whitelistedSymbols` as a versioned chain/leader configuration
  snapshot plus independently resolved token-symbol metadata; a proven empty
  configuration is complete, while unresolved symbols degrade only the
  token-metadata group. Until the published operator pin and READY import gate
  described above, the existing request-time source remains authoritative.
- Keeps allocation semantics deliberately asymmetric by scope. This entry's
  temporary run-level `observedCapitalInUsd` overlay is superseded by the
  2026-08-26 contract and is now removed and reserved. Use canonical
  `capitalInUsd` with `capitalInProjectionStatus`; owner and copy-account totals
  remain canonical-only.
- Computes active and closing durations from the read request clock. Terminal
  durations remain fixed at their terminal event time.
- Adds optional `CopyRunSummary.stopCopyProgress` from the newest safely
  covered, valid Stop intent. It reports selected, indexed, terminal, and
  pending position counts without waiting for price, settlement, or PnL
  materialization.
- Removes the never-populated execution-activity `token`, `displayAmountRaw`,
  and `valueUsd` fields. Their protobuf numbers and names are reserved. The
  operator fact contract does not pin one executed amount or valuation source,
  so clients must not infer these values from the latest position or price.
- Enables backend post-commit work wakes for faster convergence. This is not a
  new frontend transport contract: clients should keep using response metadata,
  metric statuses, and normal refresh behavior rather than assuming every
  backend commit produces a push event.
- Doesn't add a generic response cache. Existing data remains sourced from the
  aggregate read model and field-specific dependency behavior.

Frontend migration:

1. Keep existing handling for `ADVISORY_ACTION_STATUS_PENDING`. Regenerate or
   update clients to add wire value `4` before enabling `TRY_PREPARE`
   presentation.
2. Use `meta.fieldQualities[]` only for the matching `group`. Don't apply one
   degraded group to unrelated identity or lifecycle fields.
3. Keep rendering a metric value when its metric status is `CURRENT` or
   `STALE`. Use group completeness and reason to explain an in-progress
   recomputation. Never render an `UNAVAILABLE` metric as zero.
4. On `TRY_PREPARE`, describe the result as “check availability” or equivalent
   and call the live preparation endpoint when the user confirms. Don't enable
   an action solely from this advisory state.
5. On `PENDING`, keep the action disabled and refresh the authoritative
   read. Don't convert this state to a time-based optimistic action.
6. Remove references to execution-activity `token`, `displayAmountRaw`, and
   `valueUsd` when regenerating clients. Position, capital, and fee activity
   details retain their own source-proven token and value fields.
7. After the target environment activates the Stage 1a group, render
   `GetAgent.whitelistedSymbols` when the trade-token configuration group is
   complete. If the token-metadata group is partial or pending, keep the
   configured address set/source identity visible where the design supports
   it, but degrade unresolved labels/symbols instead of hiding the whole
   profile. Before activation, follow that environment's existing generated
   contract rather than inferring readiness from this catalog.

### 2026-08-20 — Withdraw Quote at any copy lifecycle stage

- Makes Withdraw Quote available while a copy run is active, stopping, or
  stopped. The action no longer requires a Stop Copy intent, a permanently
  paused account, terminal exits, or zero open positions.
- Keeps the request and response schema unchanged.
- Keeps preparation fail-closed. At one exact action block, the operator
  verifies the account generation and quote token, reads the current owner and
  quote-token balance, and preflights the exact call.
- Encodes `uint256.max` as a repeatable sweep request. The contract transfers
  the quote-token balance that exists when the transaction executes; the
  preview's `quoteBalance` is the balance observed during preparation.
- Returns a typed unavailable result when the connected wallet isn't the
  current owner, the quote balance is zero, the account generation or quote
  token is unsupported, or the exact call reverts during preflight.

Frontend migration:

1. Offer Withdraw Quote from both Open and History copy-run views when
   `withdrawQuoteAvailability.status` is `ADVISORY_ACTION_STATUS_AVAILABLE`.
   Don't require the user to stop copying first.
2. Prepare again when the user confirms. Treat the preparation response as the
   authoritative decision, even when the earlier advisory value was available.
3. Display `data.withdrawQuote.quoteBalance` as the prepared balance preview.
   Don't display `sweepAmountRaw` as the expected transferred amount because it
   contains the max-uint sweep sentinel.
4. Submit the returned call without modifying it, then refresh the copy-run and
   copy-account reads after confirmation.

Rollout order: deploy the operator change before the aggregate API change. If
the API change reaches an environment first, an older operator can still return
`PREPARED_ACTION_REASON_ACCOUNT_NOT_STOPPED` for an active run.

### 2026-08-16 — AUM includes open-position value

- Redefines `AgentMetrics.aumUsd` as approved-stable USD plus the current USD
  valuation of remaining base inventory in open follower positions for
  admitted active or closing copy runs.
- Counts an approved-stable wallet balance once per copy account and excludes
  stopped, closed, historical, and quarantined runs.
- Returns `UNAVAILABLE` instead of a partial value when required run or
  position coverage, token metadata, or a current price is unavailable.
- Returns `STALE` when any accepted component is stale. The metric-level
  `asOf` is the oldest contributing valuation timestamp and can differ from
  response-level freshness metadata.
- Applies the same component status and provenance semantics to
  `LeaderboardSummary.totalAumUsd`. No endpoint or response-field shape
  changes.

Frontend migration: no payload migration is required. Continue branching on
the metric status, render the value only for `CURRENT` or `STALE`, and show its
own `asOf` when the UI displays valuation recency.

### 2026-08-14 — grouped agent action logs

- Changes `GET /agents/{agentId}/action-logs` so `data[]` always contains
  session groups with `sessionId` and `logs[]`, rather than flat action logs.
- Adds exact action filtering through `type` and explicit session grouping
  through `groupBy`. Omitted `groupBy` defaults to session grouping.
- This entry's original whole-session pagination rule is superseded by the
  2026-08-26 cutover. `limit` now counts allowlisted rows, and one session can
  span pages.

Frontend migration: read each `data[]` item as an
`AgentActionLogSessionGroup` and render its nested `logs[]`. Do not continue
decoding `data[]` as flat `AgentActionLog` objects.

### 2026-08-13 — stateless Manual Sell and Close Position

- Removes `POST /wallet-session-challenges` and `POST /wallet-sessions`.
- Removes wallet-session bearer authentication from Manual Sell and Close
  Position preparation.
- Removes the Redis-backed session store and final-issuance lease. Repeated
  preparation requests are allowed and each response must be treated as a
  short-lived snapshot.
- Reduces the public HTTP surface from 34 to **32 operations**: 26 GET reads
  and six transaction-preparation POSTs.
- Does not weaken chain execution authorization. The owner wallet still submits
  the returned call; the follower-account contract enforces the owner/admin
  caller, while the operator-produced KS-signer payload remains bound to the
  account, chain, position, current unsold balance, route, minimum output, and
  deadline.
- Removes the action-specific Redis requirement. Redis is still required when
  selected as the API cache backend.

Frontend migration:

1. Delete the challenge, signature-exchange, bearer-token, expiry, and refresh
   steps from Manual Sell and Close Position dialogs.
2. Call the preparation route directly after refreshing its authoritative read
   inputs.
3. Keep `to`, `data`, and `valueRaw` unchanged and submit them from the owner
   wallet. A preparation response is not authority to execute from another
   wallet.
4. Discard stale or superseded preparations. Multiple preparations can be
   returned, but a state-changing transaction makes competing payloads stale.

Rollout order: deploy and drain the new aggregate API before removing the
operator wallet-proof RPC. The new API remains compatible with an older
operator; an older API cannot create sessions after the proof RPC is removed.

### 2026-08-13 — Historical `origin/main` baseline

This historical baseline was verified against `origin/main` commit
`1b0d9e27b60dc02e960f4557232727c50dcf724b`, the checked-in protobuf
sources, and the generated OpenAPI document. That revision pins
`copy-trade-operator` at
`v0.0.0-20260813084007-e8a0e0149d68` for the read/action contract.

The following frontend-visible semantics are merged on `origin/main`; source
status does not by itself prove that a particular environment is running the
same image.

| Surface                             | Merged contract                                                                                                                                                                                                                                                                 | Required FE behavior                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Explicit Start funding intent       | `PrepareStartCopyRequest.fundingMode` is required and is either `START_COPY_FUNDING_MODE_UNFUNDED` or `START_COPY_FUNDING_MODE_FUNDED`. `createPermitData` is optional only for funded mode and is never echoed publicly.                                                       | Choose the mode explicitly for each attempt, keep it stable with the same `startRequestId`, and never infer the mode from the presence of permit bytes.                                     |
| Start Copy onboarding               | `START_COPY_STAGE_CREATE_CONFIRMING` is implemented. It is returned with `PREPARED_ACTION_STATUS_PENDING`, `PREPARED_ACTION_REASON_SOURCE_COVERAGE_PENDING`, the predicted `copyAccount`, and no call.                                                                          | Keep polling with the same `startRequestId` and target. Do not resubmit the create call and do not fund until `START_COPY_STAGE_FUNDING_REQUIRED`.                                          |
| Capital In                          | `CopyRunSummary.capitalInProjectionStatus` is implemented with `SYNCING`, `READY`, and `UNAVAILABLE`.                                                                                                                                                                           | Render the completed value normally when the projection is `READY`. A `SYNCING` projection can carry a prior same-identity `STALE` metric; render it only with a stale/syncing indication. `UNAVAILABLE` authorizes no number. A visible funding transaction alone doesn't make a provisional value authoritative. |
| Account-effective cashback policy   | `GET /users/{ownerAddress}/copy-runs/{copyRunId}/cashback-policy` returns the operator-authored policy for that exact follower account, including typed status, optional rates, scope, provenance times, and optional formula version.                                          | Fetch it lazily for a selected run's fee/cashback panel. Branch on `status`; do not substitute an agent-level advertised rate, infer missing rates as zero, or hard-code a formula version. |
| Pinned stable balance               | The current-stable materializer reads exact quote-token balances from the operator at one canonical block anchor. A present row can use `balanceSource = "onchain_rpc"`; exact zero remains present.                                                                            | Trust the row only when `pinnedStableBalance.status` is `PRESENT`. Preserve all other typed states as unavailable rather than converting them to zero.                                      |
| Current wallet inventory            | `GET /copy-accounts/{chainId}/{copyAccount}/wallet-inventory` returns bounded current wallet rows and an account-wide `walletInventoryValueUsd` only when the source proves the response is complete and every nonzero asset is valued.                                         | Use this route for **Remaining in Wallet** on active and stopped copy runs. Never calculate the total from `/balances` pages or add the pinned stable row to the server total.              |
| Action-log chain links              | Valid mixed-case EVM addresses and hashes are canonicalized to lowercase. Invalid optional linkage claims are discarded while a safe narrative row remains renderable.                                                                                                          | Treat `txHash`, `leaderPositionId`, `blockNumber`, and `tokenAddress` as optional links. Their absence is not an action failure and must not be reconstructed from narrative text.          |
| Copy lifecycle views                | `OPEN` contains admitted runs with status `COPY_RUN_STATUS_ACTIVE` or `COPY_RUN_STATUS_CLOSING`. `HISTORY` contains admitted or readable historical-generation runs with status `COPY_RUN_STATUS_STOPPED` or `COPY_RUN_STATUS_CLOSED`. Position history is a separate universe. | Refresh from the server after lifecycle changes; do not pin local tab membership or derive it from position counts. Use owner position routes for owner-wide closed-trade history.          |
| Historical-generation compatibility | Parentless child facts explicitly classified `HISTORICAL` by the operator are consumed without creating current/actionable projections. Missing `ADMITTED` or `QUARANTINED` parent identity still fails closed.                                                                 | Historical or unavailable data must not be promoted into current dashboards or actions. Preserve typed unavailable states and direct/History reads; never infer missing values as zero.     |
| Public HTTP surface                 | This historical baseline had 26 reads, six preparations, and two wallet-session operations. The current contract removes both session operations and adds the closed-execution read. See the current operation index below.                                                    | Do not feature-gate a current route as unimplemented. Treat typed product statuses separately from HTTP availability.                                                                        |

### 2026-08-12 — Verified pre-release read smoke

`GET /chains`, `GET /agents?limit=1`, and `GET /docs/` were reachable in
pre-release. See [Current Availability and Verification Status](#current-availability-and-verification-status)
for the exact observations and limitations.

### 2026-07-30 — Historical pre-release action smoke

This evidence predates required Start funding intent and the removal of wallet
sessions. It is retained only as historical deployment evidence; do
not use it as the current payload or authentication contract.

## API Endpoint

Pre-release origin:

```text
https://pre-copy-trade-api.kyberengineering.io
```

API base path:

```text
https://pre-copy-trade-api.kyberengineering.io/api/v1
```

## Frontend Contract Notes

The current source contract defines the following UI-facing behavior. Apply
each row according to the environment status in the changelog, and update
all affected action dialogs and Smart Wallet activity rendering together.

| Surface                                  | Contract                                                                                                                                         | Required FE behavior                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manual Sell / Close Position preparation | No wallet challenge, session exchange, bearer token, or issuance lease                                                                          | Prepare directly from the latest authoritative read inputs. The owner wallet must still submit the exact returned call; preparation is not transaction authorization.                                                                                                                     |
| Withdraw Quote lifecycle and amount      | `withdrawQuoteAvailability` can be available at any copy lifecycle stage; preparation requires `amountRaw`                                      | Show the action according to advisory availability, not copy-run lifecycle. Send an exact partial amount or the explicit `uint256.max` full-balance sentinel, then prepare again on confirmation because the operator rechecks live state.                                                |
| Start Copy funding                       | `fundingMode` plus optional `createPermitData`                                                                                                   | Send `START_COPY_FUNDING_MODE_UNFUNDED` with no permit, or `START_COPY_FUNDING_MODE_FUNDED` with an optional protobuf-JSON base64 byte string. The API uses `targetCapitalRaw` as the funded create amount. Permit format/capability remains operator-authoritative.                      |
| Contract-generation routing              | No public `generationId`, factory, controller, or contract-address request field                                                                 | Do not hard-code or select deployment addresses. Start uses the currently create-enabled operator generation; existing-account actions derive generation from persisted account identity. Render `PREPARED_ACTION_REASON_UNSUPPORTED_ACCOUNT_GENERATION` as non-actionable product state. |
| Copy-run cashback policy                 | `GET .../cashback-policy`                                                                                                                        | Use this run/account-specific policy for detailed fee/cashback presentation. `COPY_RUN_CASHBACK_POLICY_STATUS_AVAILABLE`, `..._NOT_CONFIGURED`, `..._INVALIDATED`, and `..._UNAVAILABLE` are distinct states; missing optional rates or `cashbackFormulaVersion` are not zero.            |
| Prepared Smart Wallet identity           | `PreparedAction.copyAccount`                                                                                                                     | For every non-Start action, require it to equal the selected Smart Wallet. It is absent only for Start Copy creation; Start confirming, funding, and completion must equal `startCopy.predictedCopyAccount`. Do not confuse it with `call.to` or `expectedAccount`.                       |
| Manual Sell / Close Position quote       | `data.manualSell.swapQuote` or `data.closePosition.swapQuote`                                                                                    | Display `expectedQuote`, `minimumQuote`, and optional `effectiveSlippageBps`. Preserve metric status; unavailable is not zero.                                                                                                                                                            |
| Stop Copy per-position quote             | `data.stopCopy.positions[].swapQuote`                                                                                                            | Render the expected/minimum quote for each selected position. These values belong only to the returned preparation.                                                                                                                                                                       |
| Stop Copy total quote                    | `data.stopCopy.totalSwapQuote`                                                                                                                   | Render total expected/minimum quote. There is intentionally no aggregate `effectiveSlippageBps`; do not average per-position slippage.                                                                                                                                                    |
| Generic owner sell history               | `position.actionType = "sell_unaligned"` and `PositionSummary.exitKind = POSITION_EXIT_KIND_UNSPECIFIED`                                         | Label it **Owner Sell**. Do not infer Manual Sell or Close Position from sold amount, remaining amount, lifecycle, skipped obligations, or calldata shape.                                                                                                                                |
| Stop Copy activity                       | One `ACTIVITY_TYPE_COPY_STOPPED` lifecycle row plus independent downstream position/execution rows                                               | Render Stop Copy as an amount-less lifecycle row. Render each token-specific reduction, closure, or exit separately; do not attach one arbitrary token/amount/value to the lifecycle row.                                                                                                 |

All quote-preview values expire with their parent preparation at
`reprepareAfter` (and, when present, `liquidationConfigDeadline`). They are not
a quote cache. After expiry or a relevant state change, discard the response
and prepare again.

## Contract Authority and Naming

This catalog is an integration guide. The machine-readable contract remains:

- [`aggregate_read.proto`](../proto/aggregate/v1/aggregate_read.proto) for
  read routes, enums, request validation, and response models.
- [`aggregate_action.proto`](../proto/aggregate/v1/aggregate_action.proto) for
  transaction preparation.
- [`aggregate.swagger.yaml`](../proto/gen/openapi/aggregate/v1/aggregate.swagger.yaml)
  for the generated HTTP/OpenAPI surface.

HTTP JSON and query strings use lower-camel-case names:

```text
chainId
ownerAddress
sortBy
sortOrder
startRequestId
```

Use the symbolic enum names shown in this document, not their numeric protobuf
values. Unknown enum values must be handled as unsupported data rather than
silently mapped to another state.

## Screen-to-API Map

This is the recommended UI integration map. “Initial” calls are needed to
render the main screen. “Lazy” calls should be issued only when the relevant
tab, chart, drawer, or drilldown is opened.

| Screen or UI region                   | Initial APIs                                                                                        | Lazy or drilldown APIs                                                                                                       | Action APIs                                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| App bootstrap / network selector      | `GET /chains`                                                                                       | None                                                                                                                         | None                                                                                                               |
| Explore / leaderboard header          | `GET /leaderboard/summary`                                                                          | None                                                                                                                         | None                                                                                                               |
| Leaderboard table                     | `GET /leaderboard`                                                                                  | Load the next cursor page                                                                                                    | `POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy`                                                     |
| Agent discovery/search                | `GET /agents`                                                                                       | Load the next cursor page                                                                                                    | `POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy`                                                     |
| Agent profile header and KPI cards    | `GET /agents/{agentId}`, optionally `GET /agents/{agentId}/stats`                                   | None                                                                                                                         | `POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy`                                                     |
| Agent performance chart               | `GET /agents/{agentId}/performance`                                                                 | Additional cursor pages or a new request when series/window changes                                                          | None                                                                                                               |
| Agent action-log tab                  | `GET /agents/{agentId}/action-logs`                                                                 | Filter by leader position, action `type`, or time range; group by `sessionId`; load the next cursor page                     | None                                                                                                               |
| Agent open/history positions tab      | `GET /agents/{agentId}/positions`                                                                   | `GET /agents/{agentId}/positions/{positionId}` and `/events` when a row is opened                                            | None                                                                                                               |
| My Copies — Open summary              | `GET /users/{ownerAddress}/copy-summary?view=OWNER_COPY_VIEW_OPEN`                                  | None                                                                                                                         | None                                                                                                               |
| My Copies — Open rows                 | `GET /users/{ownerAddress}/copy-runs?view=OWNER_COPY_VIEW_OPEN`                                     | Load the next cursor page; selected-run detail and positions                                                                 | Prepare Add Capital, Stop Copy, or Withdraw Quote from the selected run. Withdraw doesn't require Stop Copy first. |
| History — stopped-run summary         | `GET /users/{ownerAddress}/copy-summary?view=OWNER_COPY_VIEW_HISTORY`                               | None                                                                                                                         | None                                                                                                               |
| History — stopped-run list            | `GET /users/{ownerAddress}/copy-runs?view=OWNER_COPY_VIEW_HISTORY`                                  | Load the next cursor page                                                                                                    | Prepare Withdraw Quote when advisory availability allows it                                                        |
| History — all closed positions/trades | `GET /users/{ownerAddress}/positions?view=POSITION_VIEW_CLOSED`                                     | Filter by agent/chain, paginate, or group rows by `copyRunId`                                                                | None for an already closed position                                                                                |
| History — selected stopped run        | `GET /users/{ownerAddress}/copy-runs/{copyRunId}` and `GET .../positions?view=POSITION_VIEW_CLOSED` | `GET .../performance`; `GET .../cashback-policy` when the fee panel opens; owner activity filtered by `copyRunId`            | Prepare Withdraw Quote only when advertised; historical-generation rows remain non-actionable                      |
| Copy-run detail                       | `GET /users/{ownerAddress}/copy-runs/{copyRunId}` and `GET .../positions`                           | `GET .../performance`; `GET .../cashback-policy` when fee/cashback detail is visible; owner activity filtered by `copyRunId` | Prepare Add Capital, Stop Copy, Withdraw Quote, Manual Sell, or Close Position as applicable                       |
| All owner positions                   | `GET /users/{ownerAddress}/positions`                                                               | Filter by agent, chain, view, or sort; load the next cursor page                                                             | Prepare Manual Sell or Close Position when advertised                                                              |
| Leftover positions                    | Owner or copy-run positions with `view=POSITION_VIEW_LEFTOVER`                                      | Copy-account drilldown and pending-sell obligations                                                                          | Manual Sell or Close Position when advertised                                                                      |
| Owner activity feed                   | `GET /users/{ownerAddress}/activity`                                                                | Filter by `copyRunId`, `chainId`, exact `type`, or product `group`                                                           | None                                                                                                               |
| Owner copy-account list               | `GET /users/{ownerAddress}/copy-accounts`                                                           | Load the next cursor page                                                                                                    | None                                                                                                               |
| Copy-account overview                 | `GET /copy-accounts/{chainId}/{copyAccount}`                                                        | Balances, positions, and history routes below                                                                                | Prepare Add Capital, Stop Copy, or Withdraw Quote through the associated copy run                                  |
| Copy Details — Remaining in Wallet    | `GET /copy-accounts/{chainId}/{copyAccount}/wallet-inventory`                                       | Use `/balances` only for a separately paginated asset explorer                                                               | None                                                                                                               |
| Copy-account balances                 | `GET /copy-accounts/{chainId}/{copyAccount}/balances`                                               | Load the next cursor page                                                                                                    | None                                                                                                               |
| Copy-account positions                | `GET /copy-accounts/{chainId}/{copyAccount}/positions`                                              | Pending-sell obligations for a selected `userPositionId`                                                                     | Manual Sell or Close Position                                                                                      |
| Copy-account history                  | `GET /copy-accounts/{chainId}/{copyAccount}/history`                                                | Filter by exact `type` or product `group`                                                                                    | None                                                                                                               |
| Skipped-sell recovery drawer          | Position row plus `GET .../pending-sell-obligations`                                                | Refresh the FIFO immediately before preparation                                                                              | Prepare Manual Sell or Close Position directly, then submit from the owner wallet                                  |

### Critical History Scope Rule

Copy-run lifecycle and position lifecycle are independent:

- `OWNER_COPY_VIEW_HISTORY` returns terminal copy runs. A stopped run can have
  zero closed positions.
- `POSITION_VIEW_CLOSED` returns closed positions. A still-active copy run can
  already contain many closed positions.

Therefore the page-level **Closed Positions** or **Trade History** table must
call:

```text
GET /users/{ownerAddress}/positions?view=POSITION_VIEW_CLOSED&limit=25
```

Do not build that table by first fetching
`copy-runs?view=OWNER_COPY_VIEW_HISTORY` and then fetching positions only for
those runs. That excludes closed positions belonging to active runs. Use the
run-scoped positions route only after the user selects a specific copy run; an
empty run-scoped response is valid for a stopped run that never completed a
trade. For the closed positions of one specific follower account, use:

```text
GET /copy-accounts/{chainId}/{copyAccount}/positions?view=POSITION_VIEW_CLOSED&limit=25
```

The History-view copy summary is scoped the same way as the stopped-run list.
Its `closedPositionCount` means “closed positions in terminal copy runs,” not
“all closed positions owned by this wallet.” Do not label that value as an
owner-wide closed-trade total. The current owner-wide positions list does not
return a total count; if the UI requires an exact all-pages total, that needs a
separate API contract rather than counting the first page or reusing the
History-view summary.

### Action Screen Map

All six preparation routes are implemented in the source baseline. Preparation
is read-only with respect to the chain: the frontend must submit the returned
wallet call. Environment availability still depends on the deployed image and
its operator dependencies.

| UI action      | Read before enabling the control                                                                    | Preparation route                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Start Copy     | Agent card/profile `startCopyAvailability`; refresh the direct agent profile when opening the modal | `POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy`                                     |
| Add Capital    | Direct copy-run or copy-account detail and `addCapitalAvailability`                                 | `POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareAddCapital`                               |
| Stop Copy      | Direct copy-run detail plus its current open/leftover position selection and `stopCopyAvailability` | `POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareStopCopy`                                 |
| Withdraw Quote | Direct copy-run/copy-account detail and `withdrawQuoteAvailability`; don't wait for Stop Copy       | `POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareWithdrawQuote`                            |
| Manual Sell    | Current position plus the latest pending-sell-obligation FIFO                                       | `POST /users/{ownerAddress}/copy-runs/{copyRunId}/positions/{userPositionId}:prepareManualSell`    |
| Close Position | Current position and its advertised `availableActionKinds`                                          | `POST /users/{ownerAddress}/copy-runs/{copyRunId}/positions/{userPositionId}:prepareClosePosition` |

Advisory availability controls presentation only. Always call the matching
preparation route when the user confirms, and branch on its typed
`status`/`reason`. A `PENDING`, `COMPLETED`, or `UNAVAILABLE` preparation is a
successful API response describing current product state; it does not mean the
route is missing.

### Screen Fetch Guidance

- Calls at the same screen level can be made in parallel. For example, Open
  Copies summary and rows do not depend on each other.
- Do not issue one `GET /agents/{agentId}` per leaderboard or copy-run row.
  `AgentCard` and `agentSnapshot` already contain the row-level display data.
- Use the direct detail endpoint when a user opens a row. Do not treat a cached
  list row as authoritative transaction state.
- Start a new cursor sequence when a filter, sort field, sort order, owner,
  agent, chain, view, or route changes.
- After a submitted transaction confirms, poll the relevant detail/list reads
  until their source metadata and lifecycle reflect the receipt. Then prepare
  the next stage, if any. A submitted-operation overlay may show an explicitly
  pending user delta, but it must remain separate from authoritative API data
  and action availability.

Common screen requests:

```text
# Base leaderboard, highest APR first
GET /leaderboard?chainId=8453&sortBy=LEADERBOARD_SORT_FIELD_APR_30D&sortOrder=SORT_ORDER_DESC&limit=25

# Agent 30-day daily portfolio-equity chart
GET /agents/{agentId}/performance?series=PERFORMANCE_SERIES_PORTFOLIO_EQUITY&window=WINDOW_30D&interval=PERFORMANCE_INTERVAL_DAY&limit=100

# My Copies open tab
GET /users/{ownerAddress}/copy-summary?view=OWNER_COPY_VIEW_OPEN
GET /users/{ownerAddress}/copy-runs?view=OWNER_COPY_VIEW_OPEN&limit=25

# My Copies history tab
GET /users/{ownerAddress}/copy-summary?view=OWNER_COPY_VIEW_HISTORY
GET /users/{ownerAddress}/copy-runs?view=OWNER_COPY_VIEW_HISTORY&limit=25

# Page-level closed-position history, including positions from active runs
GET /users/{ownerAddress}/positions?view=POSITION_VIEW_CLOSED&limit=25

# Copy-run open positions
GET /users/{ownerAddress}/copy-runs/{copyRunId}/positions?view=POSITION_VIEW_OPEN&limit=25

# Closed positions inside one selected copy run only
GET /users/{ownerAddress}/copy-runs/{copyRunId}/positions?view=POSITION_VIEW_CLOSED&limit=25

# Owner skipped-activity group
GET /users/{ownerAddress}/activity?group=ACTIVITY_GROUP_SKIPPED&limit=25
```

## Quick Start

Public read requests do not require an API key.

```ts
const API_ORIGIN = "https://pre-copy-trade-api.kyberengineering.io";

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ORIGIN}/api/v1${path}`, {
    headers: { Accept: "application/json" },
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message ?? `HTTP ${response.status}`);
  }
  return body as T;
}
```

POST requests use:

```http
Accept: application/json
Content-Type: application/json
```

Path variables belong in the URL and are omitted from POST bodies. URL-encode
opaque IDs:

```ts
const pathID = (value: string) => encodeURIComponent(value);

const query = new URLSearchParams({
  view: "OWNER_COPY_VIEW_OPEN",
  sortBy: "OWNER_COPY_RUN_SORT_FIELD_STARTED_AT",
  sortOrder: "SORT_ORDER_DESC",
  limit: "25",
});
```

Omit optional query parameters instead of sending an empty enum string,
`undefined`, or `null`. Send `chainId`, raw amounts, block numbers, and other
protobuf `int64` values as decimal strings when they appear in JSON.

No transaction-preparation route requires a wallet-session bearer token in the
current contract. Do not add an `Authorization` header solely for Copy Trade
preparation.

All transaction-preparation responses are emitted with `Cache-Control:
no-store` and `Pragma: no-cache`. The frontend must not place prepared calldata
or signed operator payloads in a persistent HTTP cache, service-worker cache,
analytics event, or error-report payload.

## Common Response Contract

### Envelopes

A single-resource **read** response:

```json
{
  "data": {},
  "meta": {
    "requestId": "...",
    "generatedAt": "2026-07-27T08:57:00Z",
    "dataAsOf": "2026-07-27T08:56:30Z",
    "status": "DATA_STATUS_CURRENT",
    "asOfChains": [],
    "fieldQualities": []
  }
}
```

A list **read** response:

```json
{
  "data": [],
  "pagination": {
    "nextCursor": "...",
    "hasMore": true,
    "limit": 25
  },
  "meta": {}
}
```

Default-valued JSON fields may be omitted. In particular:

- A successful empty list can omit `data`; normalize `body.data ?? []`.
- `pagination.hasMore` can be omitted when false.
- `pagination.nextCursor` can be omitted when there is no next page.
- Optional metric values are omitted when unavailable.

POST responses use `{ "data": ... }` without `meta` or cursor pagination.
Prepared actions carry their own `preparedAt`, `reprepareAfter`, and
`evidence`.

### Response Metadata

| Field              | Meaning                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requestId`        | Server request correlation ID. Include it in bug reports, but do not use it as product identity.                                                    |
| `generatedAt`      | Time this response was assembled. It is not necessarily the source-data time.                                                                       |
| `dataAsOf`         | Conservative time through which the response's aggregate data is known.                                                                             |
| `stalenessReason`  | Optional sanitized reason when data is stale or unavailable. Treat it as diagnostic text, not a stable enum.                                        |
| `asOfChains[]`     | Per-chain source coverage contributing to the response.                                                                                             |
| `status`           | Response-level `DataStatus`. Individual metrics and valuations can have more specific statuses.                                                     |
| `fieldQualities[]` | Independent quality for coherent field groups. The array can be empty during producer migration; absence doesn't prove currentness or completeness. |

Each `asOfChains[]` entry contains:

| Field             | Meaning                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `chainId`         | Chain to which this coverage applies.                                        |
| `dataAsOf`        | Source-data time at the covered boundary.                                    |
| `asOfBlockNumber` | Highest covered block represented by the response.                           |
| `safeBlockNumber` | Operator-configured reorg-safe boundary. This is **not** consensus finality. |
| `syncedAt`        | Time the source/materializer recorded the coverage.                          |
| `status`          | Per-chain `DataStatus`.                                                      |

### Freshness

Every successful read response includes `meta`.

| Status                    | FE behavior                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `DATA_STATUS_CURRENT`     | Render normally.                                                                                   |
| `DATA_STATUS_STALE`       | Render the returned data and show a stale-data indication where appropriate.                       |
| `DATA_STATUS_UNAVAILABLE` | Do not invent missing values. A response may still contain independently usable fields or metrics. |

`meta.asOfChains[]` can contain:

- `chainId`
- `dataAsOf`
- `asOfBlockNumber`
- `safeBlockNumber`
- `syncedAt`
- `status`

Use `meta.status` for the response-level state. Use each metric's own status for
the metric itself.

Do not require all timestamps in `meta` and `asOfChains[]` to be identical.
Different dependencies are folded conservatively and can be synchronized in
different rounds. The stable frontend invariants are the chain identity,
coverage block, status, and nonzero timestamps.

### Field-group quality

`meta.fieldQualities[]` keeps independent dimensions separate:

| Field          | Meaning                                                                                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group`        | Bounded coherent field group, such as `FIELD_GROUP_CAPITAL`, `FIELD_GROUP_PERFORMANCE`, `FIELD_GROUP_ACTION_ADVISORY`, `FIELD_GROUP_FEES`, `FIELD_GROUP_TRADE_TOKEN_CONFIGURATION`, `FIELD_GROUP_TOKEN_METADATA`, or `FIELD_GROUP_EXTERNAL_ENRICHMENT`. |
| `freshness`    | Whether the included value is current, stale, or unavailable.                                                                                                                                                                       |
| `completeness` | Whether every required input through the captured target is complete, partial, or pending.                                                                                                                                          |
| `finality`     | Whether the included provenance is provisional or past the service's configured reorg-safe boundary. This isn't chain consensus finality.                                                                                           |
| `reason`       | Stable bounded reason for a degraded dimension. Don't parse `stalenessReason` to infer this value.                                                                                                                                  |
| `valueAsOf`    | Latest included value-event time.                                                                                                                                                                                                   |
| `coverageAsOf` | Conservative time through which all required inputs are proven.                                                                                                                                                                     |
| `computedAt`   | Time the aggregate projection committed or the request-time derivation was computed.                                                                                                                                                |

An unspecified dimension means that the producer didn't prove it. Don't infer
`COMPLETE`, `FINAL`, or `CURRENT` from an unspecified value or a missing group.
For blended owner, account, or cross-chain results, the group reports the worst
contributing quality; clocks can therefore differ.

Use a metric's own `status` to decide whether its value can render. Use the
matching field-group quality to explain why the group is still catching up.
Metric freshness and group finality are independent: `CURRENT` with
`PROVISIONAL` finality and `STALE` with `FINAL` finality are both valid.
For example, Capital In can carry a safe prior value with
`METRIC_STATUS_STALE` while the capital group reports
`DATA_COMPLETENESS_PENDING` and
`DATA_QUALITY_REASON_DEPENDENCY_PENDING`.

### Metrics

Most numeric display values use an explicit status:

```ts
type MetricStatus =
  | "METRIC_STATUS_CURRENT"
  | "METRIC_STATUS_STALE"
  | "METRIC_STATUS_UNAVAILABLE"
  | "METRIC_STATUS_NOT_APPLICABLE";

interface DecimalMetric {
  value?: string;
  status: MetricStatus;
  asOf?: string;
}

interface CountMetric {
  // int64 values are encoded as decimal strings in JSON.
  value?: string;
  status: MetricStatus;
  asOf?: string;
}

interface RatioMetric {
  // Fixed-point integer scaled by 1e18.
  valueRaw?: string;
  status: MetricStatus;
  asOf?: string;
}
```

Rules:

- Render `CURRENT` normally.
- Render `STALE` only with an appropriate stale indication.
- Do not display a fabricated zero for `UNAVAILABLE`.
- `NOT_APPLICABLE` is a valid product state, not an error.

`AprMetric` additionally contains:

- `window`
- `nominalWindowDays`
- `actualWindowSeconds`
- `windowPolicy`
- `windowStart`
- `windowEnd`

The API can shorten an APR window when an agent or copy run has not existed for
the full nominal period. Display the returned metric and interval rather than
recomputing APR in the browser.

### Valuations

`PositionValuation` is independently status-bearing:

| Field         | Meaning                                                    |
| ------------- | ---------------------------------------------------------- |
| `valueUsd`    | Position or asset value as an exact decimal string.        |
| `priceUsd`    | Unit price used for the valuation.                         |
| `priceSource` | Sanitized source label for display/debugging.              |
| `priceAsOf`   | Observation time of the price.                             |
| `asOf`        | Time of the resulting valuation.                           |
| `isEstimated` | Value is provisional or derived from a retained price.     |
| `isFinal`     | Value belongs to a terminal/settled position and is final. |
| `status`      | `DATA_STATUS_CURRENT`, `STALE`, or `UNAVAILABLE`.          |

An unavailable valuation is not the same as a zero-valued asset. Never derive a
USD value from missing fields.

### Advisory Action Availability

Agent, copy-run, copy-account, and position reads expose compact advisory action
state:

```text
ADVISORY_ACTION_STATUS_AVAILABLE
ADVISORY_ACTION_STATUS_PENDING
ADVISORY_ACTION_STATUS_UNAVAILABLE
ADVISORY_ACTION_STATUS_TRY_PREPARE
```

The object contains `status`, a typed `reason`, and optional `asOf`. Use it to
render or disable controls. It is not authorization and must not be used to
construct calldata. The matching POST preparation route always makes the final
decision using current chain and source state.

Use the leaf advisory object even when broad response `meta.status` is
`DATA_STATUS_STALE`. An unrelated lagging field group doesn't suppress an
action whose relevant evidence is ready. The live preparation response remains
authoritative in every case.

`PENDING` and `TRY_PREPARE` are intentionally different:

- `PENDING`: The aggregate can't prove that its local evidence covers the
  latest relevant fact. Keep the action disabled and refresh.
- `TRY_PREPARE`: Stale aggregate evidence covers every locally known relevant
  fact. The UI may offer a live check, but must not label the action available.
  Call the matching preparation route when the user confirms.

Wire value `2` remains `PENDING`; wire value `4` is `TRY_PREPARE`. Regenerate
JSON/protobuf clients before enabling the new presentation. Never convert
either status to `AVAILABLE` on a timer.

For Withdraw Quote, advisory availability depends on safely covered account
identity and generation capability, not copy lifecycle or a cached balance.
An available advisory value doesn't prove that the connected wallet is still
the owner or that the account still has a positive quote-token balance. The
preparation route verifies both values at one exact action block.

### Numeric Values

Treat these as strings:

- `chainId`
- block numbers
- raw token amounts
- token prices and USD amounts
- percentages and fixed-point ratios
- int64 counts

Do not parse large values through JavaScript `number`. Use a decimal or bigint
library appropriate for the field.

Important distinctions:

- `*Raw` fields are base-unit integers. Format them with the matching
  `token.decimals`.
- `amountDecimal`, `*Usd`, `priceUsd`, APR, and percentage fields are decimal
  strings intended for decimal arithmetic and display formatting.
- `RatioMetric.valueRaw`, sell ratios, and fee rates are fixed-point integers
  scaled by `1e18`. For example, `500000000000000000` is 50%.
- `slippageBps`, `limit`, and small counts defined as `uint32`/`int32` remain
  JSON numbers.

### Addresses and Time

- Send EVM addresses as `0x` addresses.
- Lowercase addresses are canonical in responses and are recommended in URLs.
- Timestamps are RFC3339 strings.
- `ownerAddress` on owner read routes is the wallet that originally created the
  follower account. It is a read filter, not proof of current on-chain ownership
  or authority.
- Public routes accept mixed-case input and canonicalize addresses in the
  response. Lowercase input remains recommended for stable URLs and cache keys.

## Cursor Pagination

All list routes use opaque cursor pagination.

| Parameter | Behavior                                                                             |
| --------- | ------------------------------------------------------------------------------------ |
| `limit`   | Default `25`; valid range `0..100`, where `0` selects the default.                   |
| `cursor`  | Omit on the first request. Pass the exact returned `nextCursor` on the next request. |

The pending-sell-obligation FIFO is the one limit exception: it accepts
`0..200`, with `0` still selecting the default `25`.

Cursor rules:

- Treat cursors as opaque.
- Reuse a cursor only with the same route, filters, and sort values.
- Ordinary cursors expire after 72 hours.
- Five-minute cursors apply to `/leaderboard`, `/agents`, owner copy-run lists,
  owner copy-account lists, copy-account balance lists, and position pages
  sorted by current USD value. These pages pin mutable formula, balance, or
  price targets.
- If a cursor is rejected or expired, restart from the first page.
- If a pinned mutable target advances, the API returns HTTP 409. Discard the
  cursor and reload the first page; don't handle this as a malformed-cursor
  400.

The cursor is signed and scoped to the normalized request. The following all
invalidate an existing cursor:

- using it on another endpoint;
- changing `ownerAddress`, `agentId`, `copyRunId`, `chainId`, or account;
- changing any view/filter;
- changing sort field or direction;
- changing performance series/window/interval;
- changing the action-log time range, leader-position filter, action `type`, or `groupBy`.

`limit` controls page size and is not part of the logical result identity, but
the safest client behavior is to keep it stable through one sequence.

### Stable Ordering

| Collection                            | Default/effective order                                                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Leaderboard                           | APR 30D descending, with stable identity tie-breakers                                                                                              |
| Agent discovery                       | Display name ascending, nulls last                                                                                                                 |
| Performance points                    | Timestamp ascending; per-trade series also uses trade ID                                                                                           |
| Agent action-log page groups          | Matching rows use `occurredAt` descending then `actionLogId` descending; each bounded row page is grouped by session, and a session can span pages |
| Positions                             | `openedAt` descending unless explicitly changed                                                                                                    |
| Open copy runs                        | `startedAt` descending unless explicitly changed                                                                                                   |
| History copy runs                     | `stoppedAt` descending when `sortBy` is omitted                                                                                                    |
| Owner activity / copy-account history | `occurredAt` descending, then `activityId` descending                                                                                              |
| Owner copy accounts                   | Chain and copy-account ascending                                                                                                                   |
| Pending sell obligations              | Operator-authoritative FIFO order; never re-sort client-side                                                                                       |

`closedAt` and live `valueUsd` sorts place unavailable/null values last.

## Shared Query Enums

### Strategy category

```text
STRATEGY_CATEGORY_FOCUSED
STRATEGY_CATEGORY_DIVERSIFIED
STRATEGY_CATEGORY_ACTIVE
```

### Sort order

```text
SORT_ORDER_ASC
SORT_ORDER_DESC
```

### Owner copy view

```text
OWNER_COPY_VIEW_OPEN
OWNER_COPY_VIEW_HISTORY
```

`view` is required for owner copy-summary and copy-run list requests.

### Position view

```text
POSITION_VIEW_ALL
POSITION_VIEW_OPEN
POSITION_VIEW_CLOSED
POSITION_VIEW_LEFTOVER
```

`POSITION_VIEW_LEFTOVER` is supported on owner and copy-account position lists,
but not on agent position lists.

### Position sort field

```text
POSITION_SORT_FIELD_OPENED_AT
POSITION_SORT_FIELD_CLOSED_AT
POSITION_SORT_FIELD_VALUE_USD
```

Unsupported combinations:

- `POSITION_SORT_FIELD_VALUE_USD` with `POSITION_VIEW_CLOSED`
- `POSITION_SORT_FIELD_CLOSED_AT` with `POSITION_VIEW_OPEN`
- `POSITION_SORT_FIELD_CLOSED_AT` with `POSITION_VIEW_LEFTOVER`

Omitting `view` selects `POSITION_VIEW_ALL`. Omitting `sortBy` selects
`POSITION_SORT_FIELD_OPENED_AT`; omitting `sortOrder` selects
`SORT_ORDER_DESC`.

### Position state

Lifecycle:

```text
POSITION_LIFECYCLE_ACTIVE
POSITION_LIFECYCLE_CLOSING
POSITION_LIFECYCLE_CLOSED
```

Quantity state:

```text
POSITION_QUANTITY_STATE_OPEN_FULL
POSITION_QUANTITY_STATE_OPEN_PARTIAL
POSITION_QUANTITY_STATE_CLOSED
```

Exit kind, when known:

```text
POSITION_EXIT_KIND_ALIGNED
POSITION_EXIT_KIND_MANUAL
```

Available recovery actions:

```text
POSITION_ACTION_KIND_MANUAL_SELL
POSITION_ACTION_KIND_CLOSE_POSITION
```

Do not infer lifecycle from remaining quantity, timestamps, or valuations.
Render `lifecycle` and `quantityState` independently.

### Copy lifecycle

Copy-run statuses:

```text
COPY_RUN_STATUS_ACTIVE
COPY_RUN_STATUS_CLOSED
COPY_RUN_STATUS_CLOSING
COPY_RUN_STATUS_STOPPED
```

Copy-account statuses:

```text
COPY_ACCOUNT_STATUS_ACTIVE
COPY_ACCOUNT_STATUS_CLOSED
COPY_ACCOUNT_STATUS_CLOSING
COPY_ACCOUNT_STATUS_STOPPED
```

Omit the copy-account `status` query parameter to include every status.

### Performance selections

Defaults:

```text
series   = PERFORMANCE_SERIES_CUMULATIVE_TOTAL_PNL
window   = WINDOW_30D
interval = PERFORMANCE_INTERVAL_DAY
```

Supported combinations:

| Series                                       | Window                                  | Interval                                                    |
| -------------------------------------------- | --------------------------------------- | ----------------------------------------------------------- |
| `PERFORMANCE_SERIES_PORTFOLIO_EQUITY`        | `WINDOW_7D`, `WINDOW_30D`, `WINDOW_90D` | `PERFORMANCE_INTERVAL_DAY`                                  |
| `PERFORMANCE_SERIES_PORTFOLIO_EQUITY`        | `WINDOW_ALL`                            | `PERFORMANCE_INTERVAL_WEEK` or `PERFORMANCE_INTERVAL_MONTH` |
| `PERFORMANCE_SERIES_CUMULATIVE_REALIZED_PNL` | `WINDOW_7D`, `WINDOW_30D`, `WINDOW_90D` | `PERFORMANCE_INTERVAL_DAY`                                  |
| `PERFORMANCE_SERIES_CUMULATIVE_REALIZED_PNL` | `WINDOW_ALL`                            | `PERFORMANCE_INTERVAL_WEEK` or `PERFORMANCE_INTERVAL_MONTH` |
| `PERFORMANCE_SERIES_CUMULATIVE_TOTAL_PNL`    | `WINDOW_7D`, `WINDOW_30D`, `WINDOW_90D` | `PERFORMANCE_INTERVAL_DAY`                                  |
| `PERFORMANCE_SERIES_CUMULATIVE_TOTAL_PNL`    | `WINDOW_ALL`                            | `PERFORMANCE_INTERVAL_WEEK` or `PERFORMANCE_INTERVAL_MONTH` |
| `PERFORMANCE_SERIES_PERIOD_REALIZED_PNL`     | Any supported window                    | `PERFORMANCE_INTERVAL_MONTH`                                |
| `PERFORMANCE_SERIES_PER_TRADE_REALIZED_PNL`  | Any supported window                    | Omit `interval`                                             |

Agent stats currently support `WINDOW_30D`; omitting `window` selects it.

`valuePct` is meaningful for cumulative total PnL only. Treat unavailable
percentage status as unavailable, even when the matching USD value is current
or stale.

### Activity group

```text
ACTIVITY_GROUP_BUYS
ACTIVITY_GROUP_SELLS
ACTIVITY_GROUP_DEPOSITS_WITHDRAWALS
ACTIVITY_GROUP_SKIPPED
```

Groups are stable product groupings, not aliases for every related activity:

| Group                                 | Included activity types                                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ACTIVITY_GROUP_BUYS`                 | `ACTIVITY_TYPE_POSITION_OPENED`                                                                                                           |
| `ACTIVITY_GROUP_SELLS`                | `ACTIVITY_TYPE_POSITION_CLOSED`, `ACTIVITY_TYPE_EXIT_SUCCEEDED`, `ACTIVITY_TYPE_POSITION_REDUCED`                                         |
| `ACTIVITY_GROUP_DEPOSITS_WITHDRAWALS` | `ACTIVITY_TYPE_CAPITAL_DEPOSITED`, `ACTIVITY_TYPE_CAPITAL_TOPPED_UP`, `ACTIVITY_TYPE_CAPITAL_WITHDRAWN`, `ACTIVITY_TYPE_CAPITAL_RETURNED` |
| `ACTIVITY_GROUP_SKIPPED`              | `ACTIVITY_TYPE_ALIGNED_TRADE_SKIPPED`, `ACTIVITY_TYPE_EXIT_SKIPPED`                                                                       |

In-progress and failed execution rows are intentionally available only through
an exact `type` filter or the unfiltered feed. `type` and `group` are mutually
exclusive.

### Agent action-log grouping

```text
AGENT_ACTION_LOG_GROUP_BY_SESSION_ID
```

Action-log `type` is an exact filter over the row's source-owned `action`
value. It is applied before session grouping, so a grouped response contains
only matching rows. The response always uses session groups; omitted
`groupBy` defaults to `AGENT_ACTION_LOG_GROUP_BY_SESSION_ID`. `limit` counts
matching rows before grouping, not returned groups. A source session can occur
on more than one page.

### Activity type

```text
ACTIVITY_TYPE_COPY_STARTED
ACTIVITY_TYPE_COPY_STOPPED
ACTIVITY_TYPE_POSITION_OPENED
ACTIVITY_TYPE_POSITION_CLOSED
ACTIVITY_TYPE_CAPITAL_DEPOSITED
ACTIVITY_TYPE_CAPITAL_TOPPED_UP
ACTIVITY_TYPE_CAPITAL_WITHDRAWN
ACTIVITY_TYPE_CAPITAL_RETURNED
ACTIVITY_TYPE_FLAT_FEE_CAPTURED
ACTIVITY_TYPE_CASHBACK_RECEIVED
ACTIVITY_TYPE_ALIGNED_TRADE_SKIPPED
ACTIVITY_TYPE_EXIT_STARTED
ACTIVITY_TYPE_EXIT_SUCCEEDED
ACTIVITY_TYPE_EXIT_SKIPPED
ACTIVITY_TYPE_EXIT_FAILED
ACTIVITY_TYPE_EXECUTION_FAILED
ACTIVITY_TYPE_POSITION_REDUCED
```

### Pinned stable balance status

```text
PINNED_STABLE_BALANCE_STATUS_PRESENT
PINNED_STABLE_BALANCE_STATUS_REGISTRATION_PENDING
PINNED_STABLE_BALANCE_STATUS_NOT_INDEXED
PINNED_STABLE_BALANCE_STATUS_UNAVAILABLE
PINNED_STABLE_BALANCE_STATUS_TOKEN_MISMATCH
```

Only `PRESENT` guarantees that `pinnedStableBalance.balance` is the configured
stable-token row. A present row can contain an exact zero balance and can use
`balanceSource = "onchain_rpc"`. The other values are explicit
operational/data states and must not be converted to a zero balance.

## Shared Request Validation

- A supplied `chainId` must be positive.
- IDs such as `agentId`, `copyRunId`, `positionId`, and `userPositionId` are
  opaque. Preserve them exactly and URL-encode them; do not split or derive
  business meaning from their text.
- Filters are normalized server-side, but the client should trim search text
  and omit empty optional filters.
- Raw amounts are canonical positive decimal integers without signs,
  separators, decimals, or leading zeroes.
- `slippageBps` is an integer in `0..10000`.
- RFC3339 timestamps should include an explicit offset, preferably `Z`.
- Query enum names are case-sensitive.
- `type` and `group` cannot both be supplied on activity/history routes.

## Endpoint Catalog

### Chain Metadata

| Method | Path      | Parameters | `data`    |
| ------ | --------- | ---------- | --------- |
| GET    | `/chains` | None       | `Chain[]` |

A chain contains `chainId`, `slug`, `name`, `iconUrl`, and `isEnabled`.

Use this route to populate the network selector and chain metadata. Do not
hard-code chain display names or icons from `chainId`.

### Leaderboard and Agent Discovery

| Method | Path                   | Parameters                                                         | `data`               |
| ------ | ---------------------- | ------------------------------------------------------------------ | -------------------- |
| GET    | `/leaderboard/summary` | `chainId?`, `search?`, `strategyCategory?`                         | `LeaderboardSummary` |
| GET    | `/leaderboard`         | Previous filters plus `cursor?`, `limit?`, `sortBy?`, `sortOrder?` | `AgentCard[]`        |
| GET    | `/agents`              | `chainId?`, `search?`, `strategyCategory?`, `cursor?`, `limit?`    | `AgentCard[]`        |

Leaderboard sort fields:

```text
LEADERBOARD_SORT_FIELD_APR_30D
LEADERBOARD_SORT_FIELD_WIN_RATE
LEADERBOARD_SORT_FIELD_LIFETIME_VOLUME
LEADERBOARD_SORT_FIELD_COPIERS
LEADERBOARD_SORT_FIELD_AUM
LEADERBOARD_SORT_FIELD_OPEN_POSITIONS
```

The default leaderboard order is APR 30D descending. Agent discovery uses a
stable display-name order.

Filter behavior:

| Parameter          | Supported values and behavior                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `chainId`          | Optional positive chain ID. Omit for all configured chains.                                                    |
| `search`           | Optional, trimmed and case-insensitive, maximum 256 Unicode characters.                                        |
| `strategyCategory` | Optional `FOCUSED`, `DIVERSIFIED`, or `ACTIVE` enum. Categories overlap; an agent can appear in more than one. |
| `sortBy`           | Leaderboard only. Omit for APR 30D.                                                                            |
| `sortOrder`        | Leaderboard only. Omit for descending.                                                                         |
| `limit`, `cursor`  | Standard cursor pagination.                                                                                    |

Key `AgentCard` fields:

- `agentId`, `chainId`, `leaderAddress`
- `displayName`, `avatarUrl`, `modelName`, `isVerified`
- `badges`, `strategyLabel`, `strategyCategories`
- `metrics`
- `flatFeeRatePct`
- `startCopyAvailability`

`AgentCard.metrics` contains:

| Field                                                                                          | Meaning                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apr30d`                                                                                       | APR with its exact effective interval and status.                                                                                                                                    |
| `winRatePct`                                                                                   | Closed-position win rate.                                                                                                                                                            |
| `lifetimeVolumeUsd`                                                                            | Lifetime notional volume.                                                                                                                                                            |
| `copiers`                                                                                      | Unique active copier count.                                                                                                                                                          |
| `aumUsd`                                                                                       | Current follower assets under management: approved-stable USD plus the current USD valuation of remaining base inventory in open positions for admitted active or closing copy runs. |
| `openPositions`                                                                                | Current open-position count.                                                                                                                                                         |
| `totalRealizedPnlUsd`                                                                          | Lifetime realized P&L.                                                                                                                                                               |
| `maxDrawdownPct`                                                                               | Maximum drawdown percentage when available.                                                                                                                                          |
| `winningPositionCount`, `losingPositionCount`, `breakevenPositionCount`, `closedPositionCount` | Explicit terminal-position counts.                                                                                                                                                   |

`LeaderboardSummary` contains status-bearing `agentCount`, `totalAumUsd`,
`totalCopierCount`, and `lifetimeVolumeUsd`, plus `asOf`. `agentCount`,
`totalAumUsd`, and `lifetimeVolumeUsd` use the supplied leaderboard filters.
Each agent AUM counts an approved-stable wallet balance once per copy account,
then adds valued open follower positions. It excludes stopped, closed,
historical, and quarantined runs. AUM is `UNAVAILABLE` rather than partially
summed when run or position coverage, token metadata, or a required current
price is unavailable. It is `STALE` when any accepted input is stale. Its
metric-level `asOf` is the oldest contributing valuation timestamp and can
differ from the response-level `asOf`.
`totalCopierCount` is different: it is the platform-wide lifetime count of
distinct owner wallets across configured agents and intentionally ignores
leaderboard filters, including `chainId`, search, and strategy category. Every
metric still has its own status and can be unavailable independently.

### Agent Profile, Performance, and Positions

| Method | Path                                              | Parameters                                                                    | `data`                         |
| ------ | ------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------ |
| GET    | `/agents/{agentId}`                               | Path: `agentId`                                                               | `AgentProfile`                 |
| GET    | `/agents/{agentId}/stats`                         | `window?`                                                                     | `AgentMetrics`                 |
| GET    | `/agents/{agentId}/performance`                   | `series?`, `window?`, `interval?`, `cursor?`, `limit?`                        | `PerformancePoint[]`           |
| GET    | `/agents/{agentId}/action-logs`                   | `leaderPositionId?`, `type?`, `groupBy?`, `from?`, `to?`, `cursor?`, `limit?` | `AgentActionLogSessionGroup[]` |
| GET    | `/agents/{agentId}/positions`                     | `view?`, `token?`, `cursor?`, `limit?`, `sortBy?`, `sortOrder?`               | `AgentPositionSummary[]`       |
| GET    | `/agents/{agentId}/positions/{positionId}`        | Path: `agentId`, `positionId`                                                 | `AgentPositionSummary`         |
| GET    | `/agents/{agentId}/positions/{positionId}/events` | `cursor?`, `limit?`                                                           | `PositionEvent[]`              |

Action-log `from` and `to` are RFC3339 timestamps. When both are present,
`from` must not be after `to`. `type` is an exact match against the existing
allowlisted source-owned `action` value: `open`, `close_full`, or
`close_partial`. HOLD, SKIP, and every other narrative action are excluded.
`groupBy` accepts
`AGENT_ACTION_LOG_GROUP_BY_SESSION_ID`; omission currently defaults to that
value. The response `data[]` contains one group per session represented in the
bounded row page, with `sessionId` and `logs[]`. `limit` counts matching rows,
and a session can span cursor pages.

Agent-route behavior:

| Route           | Defaults and constraints                                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stats           | Omitted `window` means `WINDOW_30D`; 30D is currently the only accepted stats window.                                                                                                                                                       |
| Performance     | Uses the performance defaults/combinations above and returns points in ascending time order.                                                                                                                                                |
| Action logs     | Optional `leaderPositionId` is 1..256 characters; `type` is `open`, `close_partial`, or `close_full`; `groupBy` defaults to `SESSION_ID`; `from` and `to` are inclusive source-time bounds. `limit` counts rows before page-local grouping. |
| Positions       | Omitted view means `ALL`; `LEFTOVER` is rejected. Optional `token` is a token-address filter.                                                                                                                                               |
| Position events | Standard pagination; events preserve source lifecycle order for the selected position.                                                                                                                                                      |

Key `AgentProfile` additions over a card:

- `bio`, `liveSince`, `whitelistedSymbols`, `tags`
- `strategyExecutionItems`

`whitelistedSymbols` is a display view over the operator-owned current
trade-token configuration for the agent's `(chainId, leaderAddress)`. Treat the
configuration source and the token metadata used to label it as separate
quality dimensions:

- `FIELD_GROUP_TRADE_TOKEN_CONFIGURATION` describes whether the configured
  address snapshot is proven complete, pending, or unavailable.
- `FIELD_GROUP_TOKEN_METADATA` describes symbol/name/decimals resolution for
  those addresses and for other token-bearing fields.
- A proven empty configuration is a complete empty list, not a loading error.
- Missing token metadata should degrade labels or valuation groups only; it
  should not hide unrelated profile identity, metrics, or lifecycle fields.

The new durable snapshot path is not a deployed wire claim yet. Its operator
producer uses a target-pinned PRESENT-only full-universe walk: a registered
leader with zero tradable tokens is an explicit empty configuration, while a
deleted leader is absent from the next completed target. Partial, interrupted,
advanced, reset, or not-ready walks never authorize deletion. Aggregate
activation requires a published operator module, an exact API pin, the
generated-client adapter, and one complete READY import per chain. Until then,
continue to follow the target environment's generated schema and existing
request-time behavior; do not infer tombstone objects or a new client field.

`strategyExecutionItems[]` has `label` and `description` and is intended for
the “Strategy & Execution” section of the profile. It is configured display
content, not a machine-readable trading rule.

Key `AgentPositionSummary` fields:

- identity and routing: `positionId`, `agentId`, `chainId`, `tradeId`, `token`
- lifecycle: `lifecycle`, `quantityState`, `exitKind`, `openedAt`, `closedAt`
- amount and value: `remainingBaseRaw`, optional leader gross amounts,
  `entryValuation`, `currentValuation`, `exitValuation`
- metrics: realized and unrealized PnL
- canonical leader-side `openedTxHash` and `latestTxHash`

This agent shape deliberately omits follower account identity, fee and rebate
accounting, skipped-sell state, leftovers, recovery actions, closed executions,
and `positionPnlUsd`. Don't cast it to the follower position type or fill those
fields from another route.

Key follower `PositionSummary` fields:

- identity: `positionId`, optional `userPositionId`, optional
  `agentPositionId`, optional `copyRunId`
- routing/display: `agentId`, `chainId`, optional `copyAccount`, `tradeId`,
  `token`
- lifecycle: `lifecycle`, `quantityState`, `exitKind`, `openedAt`, `closedAt`
- amount: `remainingBaseRaw` and optional gross/net accounting fields
- value: `entryValuation`, `currentValuation`, `exitValuation`
- metrics: `positionPnlUsd`, realized/unrealized PnL, fees, cashback, skip
  counts, and ratios
- recovery UI: `actionKind`, `availableActionKinds`

Position rendering rules:

- Use `displayBaseRaw` when present for the main human-facing base amount;
  otherwise use the product-specific gross/net fields deliberately. Do not
  assume `remainingBaseRaw` and `remainingNetBaseRaw` are interchangeable.
- `isLeftover` and `leftoverReason` are explicit stopped-run residue state.
- Use `durationSeconds`/`durationAsOf` rather than recomputing a changing
  duration from browser time.
- `actionKind` is the primary suggested recovery action;
  `availableActionKinds[]` is the complete advisory set.
- A position's three valuations can have different statuses. Closed-position
  `exitValuation` can remain final even when a current price is unavailable.
- Render follower Position P&L from `positionPnlUsd`. For active or closing
  inventory, it includes realized P&L to date, marked unrealized P&L, and
  estimated remaining cashback. For a closed position, it contains realized
  P&L only. Don't reconstruct it from the component fields in the client.
- `POSITION_EXIT_KIND_MANUAL` is reserved for an explicitly proven manual
  exit.
  Generic owner-directed `sell_unaligned` history projects as
  `POSITION_EXIT_KIND_UNSPECIFIED`; render a neutral **Owner Sell** label from
  the typed activity detail rather than inferring Manual Sell versus Close
  Position from amount, lifecycle, or skip count.

An `AgentActionLogSessionGroup` contains a `sessionId` and the `logs[]` from
that source session which match the request filters and fall inside the current
row-bounded page. The same session can appear on later pages. The old flat
response field was retired in the breaking action-log contract; do not expect
raw `AgentActionLog` objects directly in response `data[]`.

An `AgentActionLog` contains the public fields `actionLogId`, `chainId`,
`occurredAt`, `summary`, `trigger`, `dataSummary`, `reasoningSummary`,
`actionSummary`, `action`, and `status`, plus optional chain links such as
`txHash`, `leaderPositionId`, `blockNumber`, and `tokenAddress`.

Action-log text is sanitized, public narrative content. Optional chain links
are populated only after canonical linkage is validated; absence does not make
the narrative row invalid. Valid fixed-width EVM addresses and hashes are
returned in canonical lowercase form even when the upstream claim used mixed
case. If any optional linkage claim is malformed or cannot be validated, the
linkage set is omitted while the safe narrative can still be returned. Do not
reconstruct omitted links from text. `model` and `strategyVersion` are optional
provenance labels. `action` and `status` are source-owned strings rather than
public enums. Do not parse `summary`, `trigger`, `status`, or reasoning strings
to derive transaction state.

A `PerformancePoint` contains `timestamp`, `series`, `interval`, a
status-bearing `valueUsd`, and optional `tradeId`/`positionId`/`token` context.
For per-trade P&L, the trade and position identifiers are suitable for opening
the related detail, while the point timestamp remains the chart order key.

### Owner Dashboard and Copy Runs

| Method | Path                                                                                   | Parameters                                                                                                  | `data`                  |
| ------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------- |
| GET    | `/users/{ownerAddress}/copy-summary`                                                   | `view` **required**, `chainId?`                                                                             | `OwnerCopySummary`      |
| GET    | `/users/{ownerAddress}/copy-runs`                                                      | `view` **required**, `agentId?`, `chainId?`, `cursor?`, `limit?`, `sortBy?`, `sortOrder?`                   | `CopyRunListItem[]`     |
| GET    | `/users/{ownerAddress}/copy-runs/{copyRunId}`                                          | Path only                                                                                                   | `CopyRunSummary`        |
| GET    | `/users/{ownerAddress}/copy-runs/{copyRunId}/cashback-policy`                          | Path only                                                                                                   | `CopyRunCashbackPolicy` |
| GET    | `/users/{ownerAddress}/copy-runs/{copyRunId}/positions`                                | `view?`, `includeClosedExecutions?`, `closedExecutionsLimit?`, `cursor?`, `limit?`, `sortBy?`, `sortOrder?` | `PositionSummary[]`     |
| GET    | `/users/{ownerAddress}/copy-runs/{copyRunId}/positions/{positionId}/closed-executions` | `cursor?`, `limit?`                                                                                         | `ClosedExecution[]`     |
| GET    | `/users/{ownerAddress}/copy-runs/{copyRunId}/performance`                              | `series?`, `window?`, `interval?`, `cursor?`, `limit?`                                                      | `PerformancePoint[]`    |
| GET    | `/users/{ownerAddress}/positions`                                                      | `agentId?`, `chainId?`, `view?`, `cursor?`, `limit?`, `sortBy?`, `sortOrder?`                               | `PositionSummary[]`     |
| GET    | `/users/{ownerAddress}/activity`                                                       | `activitySurface?`, `copyRunId?`, `chainId?`, `type?`, `group?`, `cursor?`, `limit?`                        | `ActivityRow[]`         |
| GET    | `/users/{ownerAddress}/copy-accounts`                                                  | `chainId?`, `status?`, `cursor?`, `limit?`                                                                  | `CopyAccountSummary[]`  |

Owner copy-run sort fields:

```text
OWNER_COPY_RUN_SORT_FIELD_STARTED_AT
OWNER_COPY_RUN_SORT_FIELD_STOPPED_AT
OWNER_COPY_RUN_SORT_FIELD_AGENT_APR_30D
OWNER_COPY_RUN_SORT_FIELD_AGENT_WIN_RATE
OWNER_COPY_RUN_SORT_FIELD_AGENT_LIFETIME_VOLUME
OWNER_COPY_RUN_SORT_FIELD_CAPITAL_IN
OWNER_COPY_RUN_SORT_FIELD_CURRENT_BALANCE
```

`OWNER_COPY_VIEW_OPEN` and `OWNER_COPY_VIEW_HISTORY` are server-defined product
universes, not direct aliases for one `CopyRunStatus`. Always pass the selected
view and render the returned `status`. Do not filter the page client-side by
status.

`OPEN` contains source-admitted runs that are active or still have open or
leftover positions. A stopped or closed source run with remaining open or
leftover inventory is exposed as `COPY_RUN_STATUS_CLOSING` and stays in
`OPEN`. `HISTORY` contains `COPY_RUN_STATUS_STOPPED` or
`COPY_RUN_STATUS_CLOSED` runs only after both counts are zero, plus terminal
historical-generation rows that remain readable for audit/history. An active
historical-generation run is intentionally in neither list, although an exact
direct lookup can remain readable.

The server owns list membership. A source reorg or corrected lifecycle can
move a run between the product universes, so refresh rather than retaining a
client-side tab assignment.

These run views do not define the owner-position universe. In particular,
closed positions can belong to a run that remains in `OPEN` because the copy
relationship is still active and can receive future trades. Use
`GET /users/{ownerAddress}/positions?view=POSITION_VIEW_CLOSED` for an
owner-wide closed-position screen. Use
`GET /users/{ownerAddress}/copy-runs/{copyRunId}/positions?view=POSITION_VIEW_CLOSED`
only for a selected-run drilldown.

Copy-run list behavior:

| Parameter         | Behavior                                                                                                                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `view`            | Required: `OPEN` or `HISTORY`.                                                                                                                                                          |
| `agentId`         | Optional exact agent filter.                                                                                                                                                            |
| `chainId`         | Optional positive chain filter.                                                                                                                                                         |
| `sortBy`          | Open defaults to `OWNER_COPY_RUN_SORT_FIELD_STARTED_AT`; History defaults to `OWNER_COPY_RUN_SORT_FIELD_STOPPED_AT`. History also supports `OWNER_COPY_RUN_SORT_FIELD_CURRENT_BALANCE`. |
| `sortOrder`       | Defaults to descending.                                                                                                                                                                 |
| `limit`, `cursor` | Standard cursor pagination.                                                                                                                                                             |

Copy-account status filters:

```text
COPY_ACCOUNT_STATUS_ACTIVE
COPY_ACCOUNT_STATUS_CLOSED
COPY_ACCOUNT_STATUS_CLOSING
COPY_ACCOUNT_STATUS_STOPPED
```

Shared `CopyRunListItem` and `CopyRunSummary` fields:

- `copyRunId`, `ownerAddress`, `agentId`, `chainId`, `copyAccount`
- `startedAt`, `stoppedAt`, `status`, `durationSeconds`
- `agentSnapshot`
- capital, portfolio-value, PnL, position-count, and APR metrics
- `currentBalanceUsd`, for History account value and Open/Closing portfolio
  value when current. Stale, expired, or incomplete inputs make this metric
  `UNAVAILABLE`.
- `totalPnlUsd`, `totalPnlPct`, and `unrealizedPnlUsd`, each with its own
  metric status
- `totalPnlUsd` is realized plus unrealized P&L; fees and rebates are already
  included in the net execution economics. Don't subtract Net Fees again.
  `totalPnlPct` uses the same cash-flow-neutral time-weighted-return semantics
  as the cumulative-total-PnL chart. Don't recompute either metric in the
  client.
- `capitalInProjectionStatus`. `READY` means `capitalInUsd` represents the
  completed generation. In the current contract, `SYNCING` can carry
  a prior same-identity value with metric status `STALE`; render it only with a
  syncing/stale indication and don't treat it as the newly confirmed amount.
  `UNAVAILABLE` means source, identity, or lineage can't authorize a value and
  must never be converted to zero.
- `addCapitalAvailability`, `stopCopyAvailability`,
  `withdrawQuoteAvailability`
- optional `stopCopyProgress`. It is present only when the API can prove the
  newest safely covered Stop intent. `pendingPositionCount` includes both
  selected positions whose child action hasn't been indexed and indexed child
  actions that aren't terminal yet. `status` can be `CURRENT` or `STALE`; an
  omitted object means “progress not proven,” never zero progress. Within a
  present object, treat an omitted JSON count as `0`; the gateway omits scalar
  zero values.

`CopyRunSummary` is the detail shape. It additionally contains:

- `portfolioPnlUsd`, the closed-position-only Portfolio P&L headline. Partial
  realized P&L from positions that remain open stays in charts and APR inputs.
- `feeBreakdown.feeChargedUsd`, `feeBreakdown.rebatesUsd`, and
  `feeBreakdown.netFeesUsd`. Use `FIELD_GROUP_FEES` for the breakdown's group
  quality and each metric's own status for rendering.
- `copyRunWinRatePct` and `copyRunClassifiedClosedPositionCount`.

`CopyRunListItem` deliberately omits these detail-only fields. Fetch
`GetOwnerCopyRun` when the selected-run screen needs them. Both shapes remove
and reserve `realizedPnlUsd`, `flatFeesCapturedUsd`, `cashbackReceivedUsd`,
`netFeeCostUsd`, `estimatedCashbackPendingUsd`, and `observedCapitalInUsd`.
Regenerate clients and don't use legacy accessors or synthesize replacements.

#### Account-effective cashback policy

Fetch the policy only when the selected-run UI needs its fee/cashback detail:

```text
GET /users/{ownerAddress}/copy-runs/{copyRunId}/cashback-policy
```

This route is deliberately run/account-scoped. It is the effective policy
assigned to that follower account, not the agent's current advertised policy.
The `feePolicy` inside a Start Copy preview is create-time advertised policy;
after the account exists, it is not a substitute for this endpoint.
The response contains the exact `copyRunId`, `chainId`, `copyAccount`, and
`agentId`, plus:

| Field                                       | FE meaning                                                                                                                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`                                    | Authoritative policy state: `COPY_RUN_CASHBACK_POLICY_STATUS_AVAILABLE`, `..._NOT_CONFIGURED`, `..._INVALIDATED`, or `..._UNAVAILABLE`.                                            |
| `scope`                                     | `COPY_RUN_CASHBACK_POLICY_SCOPE_DEFAULT` or `..._EXTRA` when a policy is selected. Do not infer a scope when unspecified.                                                          |
| `capCashbackRatioRaw`, `pnlRateRaw`         | Optional 1e18-scaled raw ratios. They are present or absent together; absence is not zero.                                                                                         |
| `selectionPolicyVersion`                    | Optional operator policy-selection version. Treat as opaque diagnostic/version identity.                                                                                           |
| `cashbackFormulaVersion`                    | Optional positive formula identity. Do not infer it from scope, selection version, generation, or agent data.                                                                      |
| `selectedAt`, `invalidatedAt`, `fallbackAt` | Optional provenance times for the selected, invalidated, or default-fallback state.                                                                                                |
| `unavailableReason`                         | Present for `..._STATUS_UNAVAILABLE`: `COPY_RUN_CASHBACK_POLICY_UNAVAILABLE_REASON_COVERAGE_PENDING`, `..._HISTORICAL_GENERATION_UNSUPPORTED`, or `..._POLICY_TRANSITION_PENDING`. |

Frontend shape:

```ts
interface CopyRunCashbackPolicy {
  copyRunId: string;
  chainId: string;
  copyAccount: `0x${string}`;
  agentId: string;
  capCashbackRatioRaw?: string;
  pnlRateRaw?: string;
  scope: string;
  status: string;
  selectionPolicyVersion?: string;
  cashbackFormulaVersion?: number;
  selectedAt?: string;
  invalidatedAt?: string;
  unavailableReason?: string;
  fallbackAt?: string;
}
```

The currently pinned operator emits `cashbackFormulaVersion = 2` for supported
policy outcomes. Unsupported historical-generation policy can legitimately
omit it. Treat the value as an explicit contract field, not a frontend
constant, because formula identity is independent from policy scope and
selection version.

Use these rendering rules:

- `COPY_RUN_CASHBACK_POLICY_STATUS_AVAILABLE`: render the returned rates and
  scope.
- `COPY_RUN_CASHBACK_POLICY_STATUS_NOT_CONFIGURED`: render the product's
  no-policy state; do not show zero
  rates.
- `COPY_RUN_CASHBACK_POLICY_STATUS_INVALIDATED`: render the state as
  invalidated, using `invalidatedAt` when present. Do not present the retained
  rate pair as currently selectable.
- `COPY_RUN_CASHBACK_POLICY_STATUS_UNAVAILABLE`: render an
  unavailable/pending state from `unavailableReason`; do not reuse an
  agent-level rate as a fallback.
- Use the response `meta.status` independently. A stale, renderable policy is
  not equivalent to a current policy.

`OwnerCopySummary` is already scoped to the requested `view` and contains:

- active and closed copy-run counts;
- total allocated, portfolio value, realized P&L, and unrealized P&L;
- open, closed, and leftover position counts;
- closed capital and leftover value;
- flat fees captured, actual cashback received, and net fee cost. There is no
  owner-summary pending-cashback estimate.

These summary totals are canonical aggregates. The backend does not return an
owner-level or copy-account-level observed/pending allocation subtotal. If the
complete qualified contribution set is not proven, the affected metric is
unavailable instead of presenting a partial subtotal as the total; independently
complete metrics can still render.

Fields that are not meaningful for the selected view can be
`METRIC_STATUS_NOT_APPLICABLE`; do not merge the Open and History summary
objects locally.

`ActivityRow.detail` contains exactly one typed detail object appropriate for
the activity: `copyLifecycle`, `position`, `capital`, `fee`, or `execution`.

The detail variant has this shape:

| Variant         | Used for                       | Important fields                                                                                                                                                                               |
| --------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copyLifecycle` | Copy started/stopped           | `eventId`, `eventType`, optional `beforeStatus`, `afterStatus`                                                                                                                                 |
| `position`      | Open/close/reduce position     | Tokens, raw base/quote accounting, settlement value, realized P&L, fee, cashback                                                                                                               |
| `capital`       | Deposit/top-up/withdraw/return | `movementType`, exact raw amount, token, USD metric                                                                                                                                            |
| `fee`           | Flat fee/cashback              | Exact raw amount, token, USD metric                                                                                                                                                            |
| `execution`     | Skip/exit/failure lifecycle    | Execution/action identifiers and statuses, public error, config index/rate/deadline. It has no token, amount, or USD field because the source fact does not prove one common monetary meaning. |

The top-level `summary` is display text. Business logic should switch on the
typed `type` and oneof detail, not parse the summary.

For Smart Wallet Activity and the Open Copies alerts feed, use one cursor chain
per exact `type`, product `group`, or activity surface. Render capital actions
distinctly. The public copy-run log and alert-feed surfaces normalize returned
capital to Capital withdrawn; do not show a separate Capital returned type on
those surfaces.

#### Stop Copy and downstream activity rows

Stop Copy is not one monetary trade. One request can initiate exits for zero,
one, or many positions and tokens. The activity feed therefore exposes
independent canonical facts:

| Row                                                                                                                     | What it represents                                         | Token / amount / value                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `ACTIVITY_TYPE_COPY_STOPPED`                                                                                            | The copy-account lifecycle transition to stopped/cancelled | None. Use `copyLifecycle` and the optional top-level `txHash`.                                                         |
| `ACTIVITY_TYPE_EXIT_STARTED`, `ACTIVITY_TYPE_EXIT_SUCCEEDED`, `ACTIVITY_TYPE_EXIT_SKIPPED`, `ACTIVITY_TYPE_EXIT_FAILED` | One exit-action execution transition                       | Use `execution` for lifecycle only. Use the corresponding position activity for source-proven token, amount, or value. |
| `ACTIVITY_TYPE_POSITION_REDUCED`                                                                                        | One completed sell that leaves base inventory              | Use the token and exact raw accounting from `position`.                                                                |
| `ACTIVITY_TYPE_POSITION_CLOSED`                                                                                         | One completed sell that closes the position                | Use the token and exact raw accounting from `position`.                                                                |

All such rows can share `copyRunId` and `copyAccount`. Position and execution
rows can additionally carry `userPositionId`, `followerPositionId`, `tradeId`,
or `execution.exitActionId`. The public `ACTIVITY_TYPE_COPY_STOPPED` row does
**not** expose a parent/child correlation identifier connecting it to every
downstream exit.
Do not group rows by timestamp proximity or assume that every nearby sell was
caused by that Stop Copy.

For a selected copy run, use `CopyRunSummary.stopCopyProgress` as the bounded
wind-down summary:

| Field                   | Meaning                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `selectedPositionCount` | Positions selected by the authoritative Stop parent.                  |
| `indexedPositionCount`  | Selected child actions already imported by the aggregate.             |
| `terminalPositionCount` | Imported children with terminal `COMPLETED` or `SKIPPED` outcomes.    |
| `pendingPositionCount`  | Selected minus terminal. This includes not-yet-indexed children.      |
| `status`, `asOf`        | Coverage quality and source coverage time for this progress snapshot. |

Keep the History/closed-position membership terminal-only. Progress can move
from 0/2 to 1/2 to 2/2 while the run remains in the Open/closing experience.
Don't infer completion from a missing object, timestamps, or nearby activity
rows.

Render the lifecycle row and the token-specific rows separately. In
particular, do not reproduce a mockup row such as “Stop Copy / ETH / 8.65 /
$4,750” by selecting one affected position. If the product later requires one
expandable aggregate Stop operation, that needs a new explicit correlation and
grouping contract rather than client-side inference.

There is no exact total-count contract—use `pagination.hasMore`.

### Copy Accounts

| Method | Path                                                                                         | Parameters                                            | `data`                                                                                         |
| ------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| GET    | `/copy-accounts/{chainId}/{copyAccount}`                                                     | Path only                                             | `CopyAccountSummary`                                                                           |
| GET    | `/copy-accounts/{chainId}/{copyAccount}/balances`                                            | `cursor?`, `limit?`                                   | `WalletBalanceRow[]`; response also includes `pinnedStableBalance`                             |
| GET    | `/copy-accounts/{chainId}/{copyAccount}/wallet-inventory`                                    | Path only                                             | Bounded `WalletBalanceRow[]`, `walletInventoryValueUsd`, `complete`, and `pinnedStableBalance` |
| GET    | `/copy-accounts/{chainId}/{copyAccount}/positions`                                           | `view?`, `cursor?`, `limit?`, `sortBy?`, `sortOrder?` | `PositionSummary[]`                                                                            |
| GET    | `/copy-accounts/{chainId}/{copyAccount}/positions/{userPositionId}/pending-sell-obligations` | `cursor?`, `limit?`                                   | `PendingSellObligation[]`                                                                      |
| GET    | `/copy-accounts/{chainId}/{copyAccount}/history`                                             | `type?`, `group?`, `cursor?`, `limit?`                | `ActivityRow[]`                                                                                |

`CopyAccountSummary` contains chain/account/creation-owner identity, current
copy run and agent snapshot, start/stop times, lifecycle status, capital and
portfolio totals, available balance, P&L, position counts, leftover value,
fee/cashback totals, and advisory Add/Stop/Withdraw availability.

A pending sell obligation contains:

- `leaderPositionEventId`
- `currentRatioRaw` — an exact 1e18-scaled ratio
- optional `skippedAt`
- optional display-only `publicErrorCode` and `publicErrorMessage`

Use the returned FIFO order and exact ratios when requesting Manual Sell.

`WalletBalanceRow` contains:

| Field                                    | Meaning                                                    |
| ---------------------------------------- | ---------------------------------------------------------- |
| `chainId`, `copyAccount`, `tokenAddress` | Exact inventory identity.                                  |
| `amountDecimal`                          | Human-unit decimal amount, not a base-unit `*Raw` integer. |
| `balanceSource`                          | Sanitized upstream/source label.                           |
| `freshnessStatus`                        | Source-specific freshness label.                           |
| `balanceAsOfBlock`                       | Block at which the balance was read.                       |
| `cachedAt`                               | Time the row was cached.                                   |
| `stalenessReason`                        | Optional diagnostic reason.                                |
| `token`                                  | Token metadata.                                            |
| `currentValuation`                       | Independently status-bearing USD valuation.                |

The balance endpoint also returns `pinnedStableBalance`. This is separate from
the ordinary page because the configured quote/stable token has action-critical
semantics. On `origin/main`, this sidecar is materialized from the operator's
exact quote-token balance batch at one canonical block anchor; it does not
depend on the token appearing in the ordinary paginated balance rows. A
present row can therefore report `balanceSource = "onchain_rpc"`. A
response-level `meta.status=DATA_STATUS_UNAVAILABLE` can coexist with usable
rows; check row freshness, valuation status, and
`pinnedStableBalance.status` separately.

#### Current wallet inventory

Use the following non-paginated endpoint for the **Remaining in Wallet** card
on both active and stopped copy runs:

```http
GET /copy-accounts/{chainId}/{copyAccount}/wallet-inventory
```

The endpoint returns the current token rows held by the Smart Wallet and a
server-calculated account-wide USD total. It does not include open-position
valuation, and it is not a replacement for `portfolioValueUsd`.

| Field                     | Frontend behavior                                                                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`                    | Render the returned wallet-token rows. Each row uses the existing `WalletBalanceRow` contract.                                                                                                  |
| `walletInventoryValueUsd` | Use this `DecimalMetric` as the **Remaining in Wallet** total. Do not calculate another total from `data`.                                                                                      |
| `complete`                | A value of `true` means the bounded operator request proved that all wallet rows fit in one response. A value of `false` means the rows may be rendered, but they are not a complete inventory. |
| `pinnedStableBalance`     | Render the stable row separately only when its status is `PRESENT`. The API already counts it exactly once in `walletInventoryValueUsd`.                                                        |
| `meta`                    | Apply the normal response metadata rules independently from the total metric and row-level freshness.                                                                                           |

An abbreviated complete response has the following shape:

```json
{
  "data": [
    {
      "chainId": "8453",
      "copyAccount": "0x1111111111111111111111111111111111111111",
      "tokenAddress": "0x2222222222222222222222222222222222222222",
      "amountDecimal": "2",
      "freshnessStatus": "fresh",
      "currentValuation": {
        "valueUsd": "5",
        "status": "DATA_STATUS_CURRENT"
      }
    }
  ],
  "walletInventoryValueUsd": {
    "value": "1005",
    "status": "METRIC_STATUS_CURRENT",
    "asOf": "2026-08-13T06:45:00Z"
  },
  "complete": true,
  "pinnedStableBalance": {
    "status": "PINNED_STABLE_BALANCE_STATUS_PRESENT",
    "balance": {
      "chainId": "8453",
      "copyAccount": "0x1111111111111111111111111111111111111111",
      "tokenAddress": "0x3333333333333333333333333333333333333333",
      "amountDecimal": "1000",
      "freshnessStatus": "fresh",
      "currentValuation": {
        "valueUsd": "1000",
        "status": "DATA_STATUS_CURRENT"
      }
    }
  }
}
```

Apply these rules when rendering the total:

1. Render `walletInventoryValueUsd.value` only when its status is
   `METRIC_STATUS_CURRENT` or `METRIC_STATUS_STALE`. Show the normal stale-data
   treatment for `METRIC_STATUS_STALE`.
2. When `complete` is `false` or the metric status is
   `METRIC_STATUS_UNAVAILABLE`, show an unavailable state. Do not sum `data`,
   crawl `/balances`, or treat omitted assets as zero.
3. Do not add `pinnedStableBalance.balance` to `walletInventoryValueUsd`; the
   server total already includes a present stable row exactly once.
4. Preserve an explicit value of `"0"`. It is a valid complete inventory
   result, not missing data.
5. Do not add open-position valuation or `availableBalanceUsd`. Those fields
   answer different product questions.
6. Treat a non-`PRESENT` pinned stable status as unavailable, not zero. The
   total also becomes unavailable when any nonzero wallet asset lacks a valid
   USD valuation.
7. The total becomes `METRIC_STATUS_STALE` when any included balance or price
   is stale. Its `asOf` is the oldest effective valuation time included in the
   total.

Use the cursor-paginated `/balances` endpoint only when the UI needs a
page-by-page asset browser. It cannot be used to derive a stable account-wide
total because pages are independent current reads.

Pending obligations are current operator authority, while `skippedAt` and
public error fields are optional aggregate display evidence. Never size a sell
from the error text or a locally accumulated ratio. Use the exact
`currentRatioRaw` values and current FIFO count returned immediately before
preparation.

## Transaction Preparation

These routes prepare wallet calls. They do **not** submit transactions.

Never construct or mutate calldata in the frontend. When an action is ready,
submit the returned `data.call` exactly:

```ts
interface PreparedCall {
  kind: string;
  to: `0x${string}`; // Call target; not necessarily a swap recipient.
  data: `0x${string}`;
  valueRaw: "0";
}
```

Common prepared-action statuses:

```text
PREPARED_ACTION_STATUS_READY
PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED
PREPARED_ACTION_STATUS_COMPLETED
PREPARED_ACTION_STATUS_PENDING
PREPARED_ACTION_STATUS_UNAVAILABLE
```

| Status                | Call present?        | FE behavior                                                                                                                                      |
| --------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `READY`               | Yes                  | Show the preview and request wallet submission of the exact call.                                                                                |
| `PARTIALLY_COMPLETED` | Yes, Start Copy only | The account exists and the next funding call is ready. Submit it, confirm, then prepare again.                                                   |
| `COMPLETED`           | No                   | The requested state is already complete. Refresh reads and close the action flow.                                                                |
| `PENDING`             | No                   | Current evidence is not yet sufficient or an earlier transaction is still converging. Honor `reprepareAfter` when present and retry preparation. |
| `UNAVAILABLE`         | No                   | The action cannot currently execute. Render the typed `reason`; do not submit anything.                                                          |

Prepared call kinds:

```text
PREPARED_CALL_KIND_START_COPY_CREATE
PREPARED_CALL_KIND_START_COPY_FUND
PREPARED_CALL_KIND_ADD_CAPITAL
PREPARED_CALL_KIND_STOP_COPY
PREPARED_CALL_KIND_WITHDRAW_QUOTE
PREPARED_CALL_KIND_MANUAL_SELL
PREPARED_CALL_KIND_CLOSE_POSITION
```

The response must contain the call kind expected for the route/stage. A
mismatch is a client safety error: do not submit the call.

Advisory availability fields on read responses are suitable for buttons and
empty states, but the corresponding preparation response is authoritative.

### Prepared Action Fields

| Field                       | Meaning                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `status`                    | Typed outcome described above.                                                                                   |
| `chainId`                   | Chain on which the wallet call belongs.                                                                          |
| `expectedAccount`           | Account expected to send the outer transaction. Compare it with the connected wallet/account.                    |
| `copyAccount`               | Optional Smart Wallet identity. It is absent only before a Start Copy account exists; it is not the call target. |
| `preparedAt`                | Time the preparation was produced.                                                                               |
| `reprepareAfter`            | Only public expiry/retry boundary for the preparation. Discard the result after this time.                       |
| `liquidationConfigDeadline` | Optional action-specific deadline. Do not submit after it.                                                       |
| `call`                      | Exact reviewed EVM inner call, only when executable.                                                             |
| `reason`                    | Stable typed reason for non-ready/advisory state.                                                                |
| `warnings[]`                | Allowlisted render-only qualifications. Warnings do not authorize changing calldata.                             |
| `displayEnrichment`         | Required render-only enrichment outcome. It never changes action readiness, call validity, or calldata.          |
| `evidence`                  | Exact safely covered fact boundary and fresh action block used by preparation.                                   |
| one preview                 | Exactly one of `startCopy`, `addCapital`, `stopCopy`, `withdrawQuote`, `manualSell`, or `closePosition`.         |

`displayEnrichment.status` is `NOT_APPLICABLE`, `COMPLETE`, or `UNAVAILABLE`.
An unavailable result includes reason `SOURCE_UNAVAILABLE` or
`BUDGET_EXHAUSTED`. Continue to branch transaction submission on the top-level
prepared-action `status` and `call`: a `READY` action remains executable when
render-only enrichment is unavailable. Degrade only the optional preview UI
and never change the returned call.

Swap-producing previews use this nested shape:

```ts
interface SwapQuotePreview {
  expectedQuote: RawAmountMetric;
  minimumQuote: RawAmountMetric;
  effectiveSlippageBps?: number;
}
```

`expectedQuote` and `minimumQuote` always retain an explicit metric status;
missing data is unavailable, never numeric zero. A present
`effectiveSlippageBps: 0` is a real zero and must not be treated as absent.
The Stop Copy total quote intentionally omits a synthetic aggregate slippage.
Derive human display amounts/rates from the raw quote values and token decimals.
There is no public route path, router recipient, price-impact, or server gas
estimate. Estimate gas with the connected wallet/provider for the exact call.

`evidence.evidenceAnchor` is the safely covered fact boundary (S/E), when one is
required. `evidence.actionBlock` is the fresh canonical mutable-state/preflight
block (H). The two blocks can differ. Display neither as “finalized” unless the
product explicitly labels the operator-configured safe boundary that way.

Warnings currently supported:

```text
PREPARED_ACTION_WARNING_INVALID_STOP_INTENT_RECOVERED
PREPARED_ACTION_WARNING_OWNER_SNAPSHOT_REQUIRES_REFRESH
```

Allocation and preview-price degradation are represented by
`displayEnrichment`; don't expect `PREPARED_ACTION_WARNING_ALLOCATION_STALE`
from the aggregate API.

Typed reasons currently supported:

```text
PREPARED_ACTION_REASON_ALREADY_ACTIVE
PREPARED_ACTION_REASON_NOT_CURRENT_OWNER
PREPARED_ACTION_REASON_ACCOUNT_NOT_ACTIVE
PREPARED_ACTION_REASON_ACCOUNT_NOT_STOPPED
PREPARED_ACTION_REASON_ACCOUNT_PERMANENTLY_PAUSED
PREPARED_ACTION_REASON_EXIT_IN_PROGRESS
PREPARED_ACTION_REASON_EXIT_NOT_TERMINAL
PREPARED_ACTION_REASON_SOURCE_STALE
PREPARED_ACTION_REASON_SOURCE_COVERAGE_PENDING
PREPARED_ACTION_REASON_FACTORY_PAUSED
PREPARED_ACTION_REASON_FEE_POLICY_CHANGED
PREPARED_ACTION_REASON_SIGNER_POLICY_CHANGED
PREPARED_ACTION_REASON_REQUEST_ID_CONFLICT
PREPARED_ACTION_REASON_UNSUPPORTED_ACCOUNT_GENERATION
PREPARED_ACTION_REASON_NO_QUOTE_BALANCE
PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_BALANCE
PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE
PREPARED_ACTION_REASON_CONTROLLER_PAUSED
PREPARED_ACTION_REASON_COPY_RUN_STOPPED
PREPARED_ACTION_REASON_UNSUPPORTED_QUOTE_TOKEN
PREPARED_ACTION_REASON_AMOUNT_BELOW_MINIMUM
PREPARED_ACTION_REASON_INVALID_STOP_INTENT
PREPARED_ACTION_REASON_NO_EXECUTABLE_ROUTE
PREPARED_ACTION_REASON_INNER_CALL_REVERTED
PREPARED_ACTION_REASON_NO_SELLABLE_BASE
PREPARED_ACTION_REASON_NO_PENDING_SELL_OBLIGATION
PREPARED_ACTION_REASON_SELL_OBLIGATION_CHANGED
PREPARED_ACTION_REASON_POSITION_NOT_OPEN
PREPARED_ACTION_REASON_CLOSE_NOT_ELIGIBLE
```

Treat reason names as localization keys. Do not display raw enum names to end
users or infer an executable call from a reason.

After the coordinated Withdraw Quote release,
`PREPARED_ACTION_REASON_ACCOUNT_NOT_STOPPED` is no longer an expected Withdraw
Quote result. Keep the localization key while older environments can still
return it.

### Prepare Start Copy

```http
POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy
```

```json
{
  "chainId": "8453",
  "targetCapitalRaw": "50000000",
  "startRequestId": "3d7d7b58-72b2-4b7c-bf19-4ee9db355490",
  "fundingMode": "START_COPY_FUNDING_MODE_UNFUNDED"
}
```

`startRequestId` must be a UUIDv4. Keep the same ID while progressing one Start
Copy attempt. `fundingMode` is required; omission/`UNSPECIFIED` is HTTP 400.
Keep the target, funding mode, and permit intent stable while reusing that ID,
because the canonical creation evidence is bound to the create amount and
permit hash. Start Copy can be multi-stage: prepare, submit the returned call,
wait for confirmation and refreshed reads, then prepare again until the
response is complete.

Funding modes:

| Mode                               | Request contract                                                                                                                                                                                            | Create-stage behavior                                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `START_COPY_FUNDING_MODE_UNFUNDED` | Omit `createPermitData`.                                                                                                                                                                                    | Creates the follower account without quote-token capital. A later preparation returns the separate funding call after canonical creation evidence is ready. |
| `START_COPY_FUNDING_MODE_FUNDED`   | The API uses the full `targetCapitalRaw` as the create amount. `createPermitData` is optional and, when supplied through protobuf JSON, is a base64 byte string with a maximum decoded length of 192 bytes. | Attempts account creation and full target funding in one call. Exact permit capability and format remain operator/token-policy decisions.                   |

Funded example with permit transport:

```json
{
  "chainId": "8453",
  "targetCapitalRaw": "50000000",
  "startRequestId": "3d7d7b58-72b2-4b7c-bf19-4ee9db355490",
  "fundingMode": "START_COPY_FUNDING_MODE_FUNDED",
  "createPermitData": "<base64-encoded-permit-bytes>"
}
```

Do not hex-encode `createPermitData`, include it in unfunded mode, write it to
durable browser storage or logs, or expect it to be echoed in the response. A
funded request can omit it when the wallet/token flow does not use permit;
preparation remains authoritative for whether that request is executable. A
permit-backed attempt must retain the exact bytes in volatile flow state until
the Start Copy attempt reaches completion because creation evidence is bound to
their hash.

#### Funded authorization flow

When a funded request has enough quote-token balance but not enough factory
allowance, preparation returns HTTP 200 with:

```json
{
  "data": {
    "status": "PREPARED_ACTION_STATUS_UNAVAILABLE",
    "reason": "PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE",
    "startCopy": {
      "stage": "START_COPY_STAGE_CREATE_REQUIRED",
      "createAmountRaw": "50000000",
      "allowanceRequirement": {
        "spenderAddress": "0x...generation-factory...",
        "currentAllowanceRaw": "0",
        "requiredAllowanceRaw": "50000000",
        "approvalScheme": "START_COPY_APPROVAL_SCHEME_STANDARD",
        "permitScheme": "START_COPY_PERMIT_SCHEME_ERC20_EIP2612",
        "eip712DomainName": "USD Coin",
        "eip712DomainVersion": "2",
        "eip712DomainKind": "START_COPY_EIP712_DOMAIN_KIND_CHAIN_ID"
      }
    }
  }
}
```

`allowanceRequirement` is present only with this reason. It is an exact-block
diagnostic, not authorization to submit a transaction. The UI must use the
returned `spenderAddress`; never hardcode a factory or infer it from an older
agent response. `requiredAllowanceRaw` equals `createAmountRaw`.

`permitScheme` is the operator-authoritative encoding choice. `approvalScheme`
is the operator-authoritative ERC-20 fallback behavior. Do not select either
path from a token symbol or infer it from a byte length:

- `START_COPY_PERMIT_SCHEME_ALLOWANCE_ONLY`: the token has no reviewed permit
  path. The EIP-712 domain fields are absent. Use `approvalScheme` to approve
  `spenderAddress`, then reprepare funded mode. This is how a USDT-like token
  is handled when the returned scheme says it is allowance-only; its symbol is
  not evidence of that behavior.
- `START_COPY_PERMIT_SCHEME_ERC20_EIP2612`: sign the token's EIP-712 Permit and
  encode the reviewed 160-byte payload below, using the returned domain fields
  and `eip712DomainKind`.
- `START_COPY_PERMIT_SCHEME_ERC20_DAI_LIKE`: use the reviewed DAI-like permit
  flow and its 192-byte payload with the returned domain fields and
  `eip712DomainKind`; do not reuse the EIP-2612 encoder.

For allowance-only responses:

- `START_COPY_APPROVAL_SCHEME_STANDARD`: submit one normal `approve` for the
  required amount to `spenderAddress`.
- `START_COPY_APPROVAL_SCHEME_ZERO_THEN_SET`: if the current allowance is
  nonzero, submit `approve(spenderAddress, 0)` first; then submit the normal
  required-amount approval. Track both transactions, await each receipt, and
  verify the intermediate zero and final required allowance before
  repreparing. Do not reuse the current best-effort approval fallback that
  discovers this behavior only after failed approval attempts.

The API deliberately does not expose permit payload length. The exact scheme,
not a token symbol or a numeric length, selects the encoder.

Implementation note for kyberswap-interface: reuse `signTypedDataRaw`, the
existing chain-ID and chain-ID-as-salt EIP-712 domain builders, signature
parsing, transaction submission, smart-account detection, and bounded
allowance refresh. Do not reuse the swap `usePermit` result or its Redux cache:
its saved `rawSignature` ABI-encodes `owner` and `spender` too, and its cache
identity omits this flow's spender, scheme, and domain. Start Copy needs a
small authorization adapter scoped by account, chain, token, spender, scheme,
domain, amount, nonce, and deadline/expiry, and must build the payload described
below from the parsed signature.

Native token permits carry an EOA `v/r/s` signature. When the connected owner
is a smart-contract account, skip these native permit branches and use the
returned `approvalScheme` fallback instead; do not assume EIP-1271 support from
an ERC-2612 or DAI-like response.

For `START_COPY_PERMIT_SCHEME_ERC20_EIP2612`, `createPermitData` is the
protobuf-JSON base64 encoding of these ABI bytes:

```text
abi.encode(uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
```

This is the five EIP-2612 arguments only: no function selector, owner, or
spender is included in the 160 bytes. Sign the token's EIP-712 Permit with:

```text
owner             = connected owner wallet
spender           = allowanceRequirement.spenderAddress
value             = allowanceRequirement.requiredAllowanceRaw
nonce             = current quote-token nonce for owner
deadline          = a fresh UI-selected deadline
chainId           = response chainId
verifyingContract = response startCopy.quoteToken.address
name              = allowanceRequirement.eip712DomainName
version           = allowanceRequirement.eip712DomainVersion
```

The returned `eip712DomainKind` selects the EIP-712 domain type exactly:

- `START_COPY_EIP712_DOMAIN_KIND_CHAIN_ID`: reuse `EIP712_DOMAIN_TYPE` with
  the response chain ID.
- `START_COPY_EIP712_DOMAIN_KIND_CHAIN_ID_SALT`: reuse
  `EIP712_DOMAIN_TYPE_SALT`, setting `salt` to `bytes32(chainId)`.

`ALLOWANCE_ONLY` responses carry `UNSPECIFIED` and no domain fields. Do not
infer a domain shape from a token symbol, name, version, or chain.

For the Base USDC example above, the operator response carries EIP-712 name
`USD Coin` and version `2`; `v` is encoded as `27` or `28`. The returned
domain fields and a current token nonce are signing authority. Do not replace
them with token-symbol rules or hardcoded catalog data.

For `START_COPY_PERMIT_SCHEME_ERC20_DAI_LIKE`, sign the DAI-style typed value:

```text
holder            = connected owner wallet
spender           = allowanceRequirement.spenderAddress
nonce             = current quote-token nonce for holder
expiry            = a fresh UI-selected expiry
allowed           = true
chainId           = response chainId
verifyingContract = response startCopy.quoteToken.address
name              = allowanceRequirement.eip712DomainName
version           = allowanceRequirement.eip712DomainVersion
```

Then send the protobuf-JSON base64 encoding of:

```text
abi.encode(uint256 nonce, uint256 expiry, bool allowed, uint8 v, bytes32 r, bytes32 s)
```

This is a different typed-data schema and grants the DAI-like allowance form;
it is not an EIP-2612 amount permit.

Recommended funded flow:

1. Prepare funded mode without permit using diagnostic UUID A.
2. If preparation is already `READY`, submit its create call; no permit is
   needed.
3. If the reason is `INSUFFICIENT_QUOTE_ALLOWANCE`, branch on the returned
   `allowanceRequirement` schemes:
   - `ALLOWANCE_ONLY`: perform the `STANDARD` or `ZERO_THEN_SET` approval
     sequence required by `approvalScheme`, then generate a new UUID and
     reprepare funded mode without permit bytes. This path requires one or two
     approval transactions before the create transaction.
   - `ERC20_EIP2612`: sign and ABI-encode the five values above into the
     reviewed 160-byte payload, using the returned EIP-712 domain kind.
   - `ERC20_DAI_LIKE`: use only the reviewed DAI-like 192-byte encoder and
     its returned EIP-712 domain kind.
4. For a permit-backed attempt, generate UUID B and reprepare the same target
   in funded mode with base64 `createPermitData`. Keep UUID B, target, funding
   mode, and exact permit bytes stable for that attempt.
5. Submit only the operator-authored create call returned as `READY`. A
   permit-backed attempt remains one blockchain transaction: create plus full
   initial capital.

A permit can become stale after its nonce is consumed or its deadline expires;
discard the old preparation and create a new UUID/signature pair.

Stages:

```text
START_COPY_STAGE_CREATE_REQUIRED
START_COPY_STAGE_CREATE_CONFIRMING
START_COPY_STAGE_FUNDING_REQUIRED
START_COPY_STAGE_COMPLETE
```

`CREATE_CONFIRMING` means the deterministic account exists with the exact
reviewed live deployment graph, but its canonical creation/allocation evidence
has not crossed the safe funding boundary. Do not resubmit the create call in
this stage. Continue polling with the same UUID and target until
`FUNDING_REQUIRED`, then submit only the newly returned funding call.

`targetCapitalRaw` is a positive base-unit integer with at most 78 digits.
`data.startCopy` includes the stage, request ID, predicted copy account, quote
token, requested target, credited capital, remaining deficit, minimum initial
capital, wallet quote balance, current advertised upfront-fee policy, and
optional `createAmountRaw`. `createAmountRaw` is present only for a create
stage and is `"0"` for an explicitly unfunded create. Permit bytes are never
returned.

Recommended loop:

1. Generate one UUIDv4 when the user starts the flow.
2. Prepare using that UUID, requested target, and explicit funding mode.
3. Validate `expectedAccount`, `chainId`, status, stage, and call kind.
4. Submit the exact call and wait for a successful receipt.
5. Refresh relevant reads, then prepare again with the same UUID, target,
   funding mode, and permit intent.
   If the stage is `CREATE_CONFIRMING`, do not submit another transaction.
6. Submit the funding call only after `FUNDING_REQUIRED` is returned.
7. Finish only on `COMPLETED`/`START_COPY_STAGE_COMPLETE`.

### Prepare Add Capital

```http
POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareAddCapital
```

```json
{
  "amountRaw": "10000000"
}
```

`amountRaw` is a positive base-unit integer with at most 78 digits.
`data.addCapital` contains the quote token, requested amount, minimum amount,
wallet balance, current allocated capital, and resulting allocated capital.
Every raw amount metric carries its own status.

### Prepare Stop Copy

```http
POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareStopCopy
```

```json
{
  "userPositionIds": ["user_position_..."],
  "slippageBps": 400
}
```

- At most 32 position IDs.
- The array can be empty when the current stop operation has no selected
  sellable positions; preparation remains authoritative.
- Each position ID is 1..256 characters.
- `slippageBps` is an integer from 0 to 10,000.

`data.stopCopy` contains at most 32 position previews and totals. Each row pins
the `userPositionId`, `tradeId`, base token, user base amount, cashback,
current valuation, lifecycle, unrealized P&L, and `swapQuote`. The stop-level
`totalSwapQuote` carries total expected/minimum quote metrics. If the selectable
position set changes, discard the old preparation and prepare again.

### Prepare Withdraw Quote

```http
POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareWithdrawQuote
```

```json
{
  "amountRaw": "42000000"
}
```

Withdraw Quote is independent of copy lifecycle. The user can prepare it while
the run is active, stopping, stopped, or closed. Don't require a Stop Copy
transaction, terminal positions, or an empty position list before enabling the
action.

`amountRaw` is required by the current source contract. It must be a
canonical positive decimal `uint256` string without a sign, decimal point,
whitespace, or leading zero. The API rejects an omitted or empty value, zero,
and values greater than `uint256.max` before calling an operator.

- Send a value from `1` through `uint256.max - 1` to withdraw that exact raw
  quote-token amount.
- Send
  `115792089237316195423570985008687907853269984665640564039457584007913129639935`
  (`uint256.max`) to withdraw the full balance available when the transaction
  executes.

There is no omitted-value default for a full-balance withdrawal.

`data.withdrawQuote` contains the quote token, status-bearing quote balance,
and optional sweep amount and recipient. For a ready response:

- `quoteBalance` is the exact quote-token balance observed at the preparation's
  `evidence.actionBlock`.
- `sweepAmountRaw` equals the requested `amountRaw` and is the amount encoded in
  calldata. For an exact partial withdrawal, it is the requested transfer
  amount. For `uint256.max`, the follower-account contract interprets it as
  “withdraw the current balance” when the transaction executes.
- `recipientAddress` is the owner observed at the same action block. The
  frontend can't select or replace it.
- `call` contains the exact preflighted sweep. Submit it unchanged from
  `expectedAccount` before `reprepareAfter`.
- `warnings[]` contains
  `PREPARED_ACTION_WARNING_OWNER_SNAPSHOT_REQUIRES_REFRESH`. Refresh and prepare
  again if the connected account, owner state, balance, or preparation window
  changes.

Preparation can return `PREPARED_ACTION_STATUS_UNAVAILABLE` with these common
reasons:

| Reason                                                  | Frontend behavior                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `PREPARED_ACTION_REASON_NOT_CURRENT_OWNER`              | Refresh ownership and require the current owner wallet.                                |
| `PREPARED_ACTION_REASON_NO_QUOTE_BALANCE`               | Show that no quote balance is available to withdraw. Don't treat the route as failed.  |
| `PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_BALANCE`     | Refresh the balance; let the user enter a smaller exact amount or choose full balance. |
| `PREPARED_ACTION_REASON_UNSUPPORTED_ACCOUNT_GENERATION` | Disable the action for this account generation.                                        |
| `PREPARED_ACTION_REASON_UNSUPPORTED_QUOTE_TOKEN`        | Disable the action for this account's quote token.                                     |
| `PREPARED_ACTION_REASON_INNER_CALL_REVERTED`            | Don't submit the call. Refresh state before another preparation attempt.               |

For an exact partial withdrawal, the call transfers only the requested amount
and can revert if the balance falls below it before execution. For a
`uint256.max` withdrawal, the contract reads the execution-time balance, so the
transaction can withdraw a different amount than the preview if the balance
changes after preparation. After the receipt succeeds, refresh the copy-run,
copy-account, balance, wallet-inventory, and activity reads that are visible on
the screen.

### Prepare Manual Sell

```http
POST /users/{ownerAddress}/copy-runs/{copyRunId}/positions/{userPositionId}:prepareManualSell
```

```json
{
  "slippageBps": 400,
  "expectedUnresolvedSkipCount": 1,
  "expectedSellRatioRaw": "1000000000000000000"
}
```

Obtain `expectedUnresolvedSkipCount` and `expectedSellRatioRaw` from the current
pending-sell-obligation FIFO. If it changes, refresh the obligation list and
prepare again.

`expectedSellRatioRaw` must be in `(0, 1e18]`; the unresolved count must be
positive. `data.manualSell` contains the recovery context, exact
position/trade/token identity when covered, remaining base before, user sell
amount, released upfront fee, ratio, unresolved count, cashback, and the
preparation-scoped `swapQuote`. It intentionally excludes gross route input and
router internals.

### Prepare Close Position

```http
POST /users/{ownerAddress}/copy-runs/{copyRunId}/positions/{userPositionId}:prepareClosePosition
```

```json
{
  "slippageBps": 400
}
```

Close Position uses the same `PositionSellPreview` shape. It is eligible only
for a full-position recovery close under current operator state; otherwise the
response is typed `PENDING` or `UNAVAILABLE`. Do not treat Close Position as a
generic sell endpoint.

## Preparation Authorization and Submission

The current contract has no wallet challenge or session endpoints. A successful
preparation does not prove that the caller controls `ownerAddress`, does not
authorize another wallet, and does not submit a transaction.

For Manual Sell and Close Position, the execution boundary is:

1. The aggregate API resolves the selected owner, copy run, and position and
   asks exactly one operator for a preparation.
2. The operator rechecks the live account, owner, position, and action state,
   then builds and preflights a bounded call containing its
   KS-signer-authorized payload.
3. The frontend submits the exact returned `to`, `data`, and `valueRaw` from the
   owner wallet.
4. The follower-account contract requires the owner/admin caller and verifies
   the signed payload, current state, and deadline before execution.

This submission flow supports EOA and smart-contract wallet owners through
their normal wallet transaction flow. The API no longer verifies an EOA or
ERC-1271 proof and no longer stores a Copy Trade wallet session.

Repeated preparation requests are allowed. There is no cross-replica issuance
lease:

- Treat every response as a short-lived snapshot and use only one selected
  preparation for wallet submission.
- Do not combine fields from different preparation responses.
- The first successful state-changing transaction makes competing preparations
  stale through their pinned state, nonce, amount, and deadline checks.
- If submission fails because state changed or the preparation expired, refresh
  the authoritative reads and prepare again.

## Error Handling

Non-2xx responses use:

```json
{
  "code": 3,
  "message": "invalid argument: ...",
  "details": []
}
```

Use the HTTP status as the primary control-flow signal and `message` as
display/debug context.

Common statuses observed or expected:

| HTTP | Meaning                                                             |
| ---- | ------------------------------------------------------------------- |
| 400  | Invalid parameter, unsupported enum combination, or cursor mismatch |
| 404  | Requested public resource not found                                 |
| 409  | Pinned page target changed; restart from the first page             |
| 429  | Server action-preparation capacity is exhausted                     |
| 499  | Client closed or canceled the request                              |
| 500  | Internal request failure; the response is sanitized                 |
| 503  | Temporarily unavailable; retry with bounded backoff                 |
| 504  | Request deadline exceeded; retry with bounded backoff               |

Some upstream failed-precondition responses also map to HTTP 400. Use the typed
prepared-action `status` and `reason` for normal product state; HTTP errors are
request/transport failures.

Retry guidance:

- Do not retry 400 or 404 automatically.
- On 429, honor `Retry-After` when present and reprepare; do not reuse a
  previous call.
- For 503 and 504, use a short bounded backoff and keep the UI state
  recoverable.
- A timed-out preparation request did not submit a chain transaction. It is
  safe to request a fresh preparation, but never submit stale calldata merely
  because the first HTTP response was lost.
- If a list cursor receives 400, it is malformed, expired, or mismatched.
  Discard it and restart at page one with the current filters.
- If a list cursor receives 409, its pinned mutable target advanced. Discard
  the cursor and any accumulated pages, then reload page one. Don't retry the
  same cursor.

## Frontend Integration Patterns

### Normalize list envelopes

```ts
type ListEnvelope<T> = {
  data?: T[];
  pagination?: {
    nextCursor?: string;
    hasMore?: boolean;
    limit?: number;
  };
  meta: ResponseMeta;
};

function normalizePage<T>(body: ListEnvelope<T>) {
  return {
    rows: body.data ?? [],
    nextCursor: body.pagination?.nextCursor,
    hasMore: body.pagination?.hasMore === true,
    limit: body.pagination?.limit ?? 25,
    meta: body.meta,
  };
}
```

Only append a page after the request succeeds. Deduplicate by the resource's
stable ID as a defensive UI measure, but do not re-sort server pages.

### Render a status-bearing metric

```ts
function metricText(metric?: { value?: string; status?: string }): string {
  if (!metric) return "—";
  switch (metric.status) {
    case "METRIC_STATUS_CURRENT":
    case "METRIC_STATUS_STALE":
      return metric.value ?? "—";
    case "METRIC_STATUS_NOT_APPLICABLE":
    case "METRIC_STATUS_UNAVAILABLE":
    default:
      return "—";
  }
}
```

Apply stale styling separately. Do not make `value === undefined` mean zero.

### Preparation safety checks

Before opening the wallet:

1. Require `READY` or the Start-only `PARTIALLY_COMPLETED`.
2. Require `data.call`.
3. Require the route-appropriate `call.kind`.
4. Require `chainId` to match the wallet network.
5. Require `expectedAccount` to match the sending account.
6. For non-Start actions, require `copyAccount` to match the selected Smart
   Wallet. For Start create it is absent; confirming, funding, and complete
   stages must match `startCopy.predictedCopyAccount`.
7. Require `valueRaw === "0"`.
8. Reject a response past `reprepareAfter` or
   `liquidationConfigDeadline`.
9. Submit `to`, `data`, and `valueRaw` unchanged.

The browser should never ABI-encode a Copy Trade action from preview fields.

### Refresh after a transaction

Use the transaction receipt as the start of a refresh loop, not as proof that
the aggregate API has already projected the state:

1. Wait for a successful wallet receipt.
2. Poll the direct copy-run/copy-account/position read.
3. Require lifecycle/accounting to reflect the transaction and source metadata
   to advance.
4. Refresh the containing list/summary in the background.
5. For multi-stage Start Copy, request a new preparation only after the detail
   state has converged.

Keep the loop bounded and offer a manual refresh if projection remains behind.

### Submitted-operation overlay

The UI may show a pending local delta after the wallet returns a transaction
hash. This overlay improves continuity while the operator and aggregate API
project the confirmed event; it is never canonical read data or action
authority.

- Create the overlay only after wallet submission returns a transaction hash.
  Key it by chain, transaction hash, action kind, and exact target identity.
- Keep independent pending operations as independent deltas. For example, two
  Add Capital submissions of 1 USD and 2 USD must accumulate as two pending
  deltas. Don't replace the first delta with the second preparation's
  `newAllocatedCapital` preview.
- Render the overlay with an explicit pending label. Don't merge it into the
  server metric's status, `asOf`, sorting value, pagination cursor, summary
  total, or action-availability decision.
- Reconcile a delta only when an authoritative read exposes matching source
  evidence or the exact operation outcome. A newer response timestamp alone
  isn't proof that the event was included.
- Remove or mark the overlay failed when the transaction fails, is replaced,
  expires under the product policy, or is invalidated by a reorg.
- A Stop Copy overlay can show “stopping” locally, but it must not move the run
  between Open and History tabs. Server lifecycle remains the membership
  authority.
- Always call the live preparation endpoint for the next action. Never use an
  overlay to bypass `PENDING`, `TRY_PREPARE`, or an unavailable result.

## Complete HTTP Operation Index

The current public HTTP surface contains **33 operations**:

- 27 GET reads;
- 6 transaction-preparation POSTs.

Targeted reads added after the original read surface include:

```text
GET /users/{ownerAddress}/copy-runs/{copyRunId}/cashback-policy
GET /users/{ownerAddress}/copy-runs/{copyRunId}/positions/{positionId}/closed-executions
GET /copy-accounts/{chainId}/{copyAccount}/wallet-inventory
```

There is no generated HTTP mapping for private operator transaction
preparation, projector, or execution methods. The operator contract has no
public wallet-proof verification flow. Frontend clients must use only the
aggregate routes in this document.

## Current Availability and Verification Status

At `origin/main` commit
`464df89d77680feede66cfc9e8d569bde26a35e5`, the generated OpenAPI contract
contains 33 public HTTP operations:

- 27 GET read operations;
- 6 transaction-preparation POST operations;

All operations have concrete aggregate handlers. No transaction-preparation
route should be feature-gated as “not implemented.” Preparation routes don't
broadcast transactions; they return a typed product outcome and, only when
executable, an exact wallet call. A target environment can still run an older
image, so verify its deployed OpenAPI document before enabling a newly merged
frontend integration.

PR #21 adds the current wallet-inventory read used by the **Remaining in
Wallet** card. It is merged on `origin/main`; the older live pre-release smoke
below does not prove that a particular environment has deployed it. Verify the
deployed image before enabling the UI integration in that environment.

### Live pre-release public-read smoke

At **2026-08-12 00:36 UTC**, the following non-mutating checks reached
pre-release:

| Route                        | HTTP/result                                                                |
| ---------------------------- | -------------------------------------------------------------------------- |
| `GET /api/v1/chains`         | 200 with Base (`chainId = "8453"`) and `meta.status = DATA_STATUS_CURRENT` |
| `GET /api/v1/agents?limit=1` | 200 with a cursor-paginated row and `meta.status = DATA_STATUS_CURRENT`    |
| `GET /docs/`                 | 200 HTML Swagger UI                                                        |

This proves those deployed entry points were reachable at that timestamp. It
does not prove every materializer, account-specific row, preparation outcome,
or dependency was healthy, and it does not replace the source contract above.

### Historical pre-release action smoke

This is dated deployment evidence from **2026-07-30 07:56 UTC**, not proof that
pre-release currently runs the source baseline above. No returned call was
submitted. It predates the required `fundingMode` field and must not be used as
a current Start Copy payload example. Representative requests produced:

| Route                        | HTTP/result                                                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `:prepareStartCopy`          | 200 `READY`, `START_COPY_STAGE_CREATE_REQUIRED`, `PREPARED_CALL_KIND_START_COPY_CREATE`                                                                    |
| `:prepareAddCapital`         | 200 `READY`, `PREPARED_CALL_KIND_ADD_CAPITAL`                                                                                                              |
| `:prepareStopCopy`           | 200 `READY`, `PREPARED_CALL_KIND_STOP_COPY`                                                                                                                |
| `:prepareWithdrawQuote`      | 200 typed `PREPARED_ACTION_STATUS_UNAVAILABLE` / `PREPARED_ACTION_REASON_ACCOUNT_NOT_STOPPED` for an active run under the historical stopped-only contract |
| `:prepareManualSell`         | Historically available behind a wallet-session bearer token; the current contract prepares directly                                                        |
| `:prepareClosePosition`      | Historically available behind a wallet-session bearer token; the current contract prepares directly                                                        |
| `/wallet-session-challenges` | Historical endpoint; removed from the current contract                                                                                                      |
| `/wallet-sessions`           | Historical endpoint; removed from the current contract                                                                                                      |

The historical Withdraw result is superseded first by the any-lifecycle
contract and then by the required-amount contract dated 2026-08-24. It still
demonstrates an important integration rule: HTTP 200 with a typed
`UNAVAILABLE`, `PENDING`, or `COMPLETED` result is normal product state, not an
unavailable endpoint.

### Read integration status

All 27 GET operations are implemented and exposed by the generated gateway.
Returned rows and freshness statuses depend on the selected fixture and current
materializer/source state; do not encode point-in-time row counts into the
frontend.

Current integration rules that prevent known UI mismatches:

- Use `/leaderboard` for qualification-ranked leaderboard rows and `/agents`
  for agent discovery. They are distinct product lists.
- Use owner-wide
  `/users/{ownerAddress}/positions?view=POSITION_VIEW_CLOSED` for the History
  page's complete closed-position/trade list.
- Use `copy-runs?view=OWNER_COPY_VIEW_HISTORY` only for stopped/terminal copy
  runs. It is not the source of all closed positions.
- Use a run-scoped positions route only for a selected-run drilldown. A stopped
  run that never completed a trade correctly returns an empty closed-position
  page.
- Fetch the run-scoped cashback-policy route only when the selected-run UI
  needs effective fee/cashback details. Do not issue it once per list row or
  replace it with the agent's advertised policy.
- Use copy-account routes for one follower account's current inventory,
  positions, balances, obligations, and activity.
- Render stale data according to its status. Never replace unavailable data
  with fabricated zeroes.

Live pre-release data is diagnostic rather than contractual. When a response
temporarily fails because an operator or external dependency is unavailable,
keep the screen recoverable and follow the retry/error guidance above; do not
reinterpret the operation as absent from the API.
