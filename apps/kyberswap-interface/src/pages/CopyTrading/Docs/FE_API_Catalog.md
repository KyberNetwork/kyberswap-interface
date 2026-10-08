# Copy Trade API frontend integration catalog

Use this catalog to integrate frontend applications with the public HTTPS/JSON
API and internal admin tools with the VPN-only admin API. Use the endpoint
reference for request fields, agent registry management, action availability,
transaction preparation, and submitted transaction status.

Last updated: October 7, 2026.

## Changelog

### October 7, 2026: RPC failures and preparation retries

This contract ships in [API PR #111](https://github.com/KyberNetwork/copy-trade-api/pull/111)
with [operator PR #239](https://github.com/KyberNetwork/copy-trade-operator/pull/239).
Deployment is not verified by this catalog update. Deploy the API consumer
before the operator emits the new diagnostics. No request fields, endpoints or
generated application enums change; update the frontend's HTTP error handling.

- All seven preparation routes can identify blockchain RPC failures through
  `google.rpc.ErrorInfo` in `details[]`, with `domain: "copy-trade-api"`.
  `RPC_RATE_LIMITED` returns HTTP 429; `RPC_UNAVAILABLE` and `RPC_TIMEOUT`
  return HTTP 503. Read the typed reason instead of matching message text.
- Show the returned `ActionGuidance.message` and **Retry preparation** control.
  Respect `guidance.retryAfterMs` and `Retry-After`; use bounded retries that
  request a fresh preparation. Do not submit cached calldata after a failure.
- RPC endpoint rotation and quarantine are handled by the operator. Keep using
  the same API route. Do not add frontend RPC selection or an extra retry loop
  per provider, and do not disable independent actions because one attempt failed.
- Distinguish these request errors from HTTP 200 aggregator/simulation outcomes.
  A generic HTTP 429 without the recognized RPC detail is not proof of an RPC
  rate limit. Older operators can still return generic dependency guidance.

See [RPC preparation errors](#rpc-preparation-errors) for the wire format and
retry rules. After a transaction is submitted, retry status observation with
its saved hash and context; never resubmit it to recover an RPC status failure.

### October 7, 2026: copy-run metrics, filtered totals, and activity links

These additions ship in [API PR #110](https://github.com/KyberNetwork/copy-trade-api/pull/110).
Regenerate clients for the new fields and enums after deployment.

- Render copy-run Volume from `copyRunVolumeUsd`; sort with
  `OWNER_COPY_RUN_SORT_FIELD_VOLUME`. `agentSnapshot.metrics.lifetimeVolumeUsd`
  continues to describe the agent and must not populate the copy-run column.
- Existing runs can initially return unavailable volume or `currentBalanceUsd`
  while background updates catch up. Follow each metric's status and refresh
  normally; do not substitute zero or agent volume. No frontend replay or
  transaction resubmission is needed.
- Send the same `chainId`, `strategyCategory`, and `search` filters to the
  leaderboard summary and table. `totalCopierCount` now follows those filters
  and counts an owner once across matching agents. `totalAumUsd` can contain
  the available subtotal marked `METRIC_STATUS_STALE`; show its partial-data
  indication. A nonempty selection with no usable AUM remains unavailable.
- Use returned follower `positionPnlUsd` directly. Open/closing positions now
  include actual fee economics and received cashback, excluding estimated
  cashback. Do not add estimated cashback or subtract `netFeeCostUsd` again.
- Copy-run activity `tradeId` and follower position/preparation `tradeId` now
  identify the follower position. A skipped buy without a follower position
  has no trade link. Keep missing execution hashes and unstored attempt amounts
  absent; do not use leader amounts or hashes as replacements.
- Render `ACTIVITY_CATEGORY_COPY_LIFECYCLE` with subtypes
  `ACTIVITY_SUBTYPE_COPY_STARTED` and `ACTIVITY_SUBTYPE_COPY_STOPPED` in copy-run
  logs. Start Copy can include `copyLifecycle.amountRaw`, `tokenAddress`, and
  `token` for the canonical opening allocation. Later funding remains a
  deposit/top-up row.
- After observing an app-submitted token withdrawal with `actions:status`,
  refresh the activity log. Non-quote transfers appear as
  `ACTIVITY_TYPE_CAPITAL_WITHDRAWN` with `capital.movementType=token_withdrawal`,
  the actual `amountRaw`, token, and `txHash`. Render token units;
  `capital.valueUsd` stays unavailable without a historical price. Quote
  withdrawals retain their existing separate rows. Token withdrawals already
  completed before this feature are not automatically added to the log; a
  missing row does not prove that no withdrawal occurred.
- After receipt-first Stop observation, refresh positions. A returned Close
  Position with `ADVISORY_ACTION_STATUS_TRY_PREPARE` allows live preparation
  while projections catch up. Selected positions still being liquidated stay
  pending with `EXIT_IN_PROGRESS`. Submit only a fresh READY preparation.

### October 7, 2026: opening metrics, wallet retries, and recovery actions

These UI behaviors apply after
[API PR #110](https://github.com/KyberNetwork/copy-trade-api/pull/110) and the
action fixes in [operator PR #238](https://github.com/KyberNetwork/copy-trade-operator/pull/238)
are deployed. Requests, JSON fields, and enums are unchanged; no client
regeneration is required for these changes.

1. For a new copy run, render returned `totalPnlUsd` and `roiPct` values of
   `"0"` with `METRIC_STATUS_STALE` as opening values. Keep the stale indication
   and the returned creation-time `asOf`. Do not substitute zero for absent
   data or a later unavailable metric. See [ROI and chart return](#roi-and-chart-return).
2. Handle HTTP 409 from wallet inventory and wallet-balance reads as **Updating**.
   Show the returned message and retry with bounded backoff. Do not replace
   missing balances or USD totals with zero. See
   [Current wallet inventory](#current-wallet-inventory).
3. Use `actionKind`, `availableActionKinds`, `manualSellAvailability`, and
   `closePositionAvailability` for position recovery buttons. Two or more
   distinct unresolved partial skips can recommend **Close Position**. A
   cumulative 100% recovery also recommends **Close Position**, even after one
   missed sell; Manual Sell remains a supported alternative. Do not count
   repeated activity entries to decide which button to show. See
   [Prepare Close Position](#prepare-close-position).
4. A selected-position Stop Copy can return HTTP 200 with
   `PREPARED_ACTION_STATUS_UNAVAILABLE` and `failureDetails.code = "route_unfulfillable"`.
   Show `failureDetails.message` and the returned `guidance`; there is no call
   to submit. Keep the user's selection and slippage unchanged. If the user
   chooses the offered Stop-with-existing-settings alternative, prepare that
   action separately. See [Preparation failures](#manual-sell-and-close-preparation-failures).

### October 6, 2026: action success and related data status

Show provisional call success as soon as `data.receiptResult` is present, and
let the user dismiss the dialog. Fetch the affected page immediately. The
backend tracks verified pending effects, so ordinary GETs report syncing data
after a reload or from another session without a saved action observer.

1. Send `resultMode: "SUBMITTED_ACTION_RESULT_MODE_RECEIPT_FIRST"` with the
   preparation's unchanged `statusContext` and wallet transaction hash.
2. Show the verified effect from `receiptResult`. Use `data.status = SUCCEEDED`
   for completed-call success and `nextStep` for a remaining preparation stage.
3. Invalidate the affected client read cache and fetch again. Render numbers
   from the GET's metric statuses and `meta.fieldQualities`; show **Syncing**
   when its group has `completeness = DATA_COMPLETENESS_PENDING`.
4. Use `meta.pendingActions` to identify affected rows or a new copy run that
   has not appeared yet. No action-readiness map needs to be stored in the UI.
5. A verified new-run detail can return HTTP 200 with `meta` and absent `data`.
   Show a syncing placeholder and refetch. Never invent a zero-valued run.
6. Replace observations after a reorg or changed receipt. Keep the transaction
   context only to reopen the dialog or continue a staged/batched action.

`actions:status.readiness[]` has been removed from this proposed contract.
Regenerate the client from [API #108](https://github.com/KyberNetwork/copy-trade-api/pull/108)
and enable this integration with its matching deployment. See
[Related-read status](#related-read-status), [Action UI flows](#action-ui-flows),
and [Refresh after a transaction](#refresh-after-a-transaction).

### October 4, 2026: wallet totals, closed Amount Out, and activity details

[API PR #102](https://github.com/KyberNetwork/copy-trade-api/pull/102), verified
at `2612c14c4a24ad6255e16dc305821449cfe60065`, is open at this update. Deployment
has not been verified. The PR #102 rules below describe the new response
semantics once deployed. Requests, routes, JSON field names, and enums are
unchanged; existing clients need rendering changes only where they enforce
the older rules.

1. Render a closed copy run's **Amount Out** from `capitalOutUsd` as soon as
   that metric is available. Do not wait for token withdrawal. For a proven
   quote-only closure, it includes quote still held plus prior withdrawals;
   it is not a withdrawal receipt. See [Closed-run Amount Out](#closed-run-amount-out).
2. In `ACTIVITY_SURFACE_ALERT_FEED`, render deposit, top-up, and withdrawal
   amounts from the row's `capital` detail when present. Keep raw amounts as
   strings and use token decimals and the USD metric's own status. See
   [Capital amounts in Alert Feed](#capital-amounts-in-alert-feed).
3. Link skipped copy-run activity to its returned `tradeId` independently of
   `txHash`. A skip without a submitted execution has no follower transaction
   hash; a skipped buy need not have a follower position. Both links remain
   optional. See [Skipped-trade links](#skipped-trade-links).
4. Use `walletInventoryValueUsd` for **Remaining in Wallet** and
   `withdrawTokens.totalCurrentValueUsd` for **Est. USD from selected**. They
   sum available valuations; an unpriced token remains N/A without hiding the
   subtotal. A complete, entirely unpriced selection can return `"0"`; that
   does not mean its tokens are worthless. See
   [Current wallet inventory](#current-wallet-inventory) and
   [Prepare Withdraw Tokens](#prepare-withdraw-tokens).
5. Render a returned zero `cashbackForfeitedUsd` even when a selected token's
   price is unavailable. Price-independent zero cases include proven
   quote-only/zero-nonquote inventory and fully settled residual positions with
   coverage through the preparation block. Other available estimates can also
   be zero; follow the returned metric status. Unresolved liability remains
   unavailable; do not default every missing estimate to zero.

Missing-price lookup is handled by the API for wallet and withdrawal displays.
No frontend price-service call or extra retry loop is required. Render each
available metric independently of response-level or display-enrichment status;
price availability does not determine whether a prepared call is executable.

### September 29, 2026: all-chain leaderboard and corrected position reporting

[API PR #97](https://github.com/KyberNetwork/copy-trade-api/pull/97) is merged
at `f5a6e11e6e33cb51ab23f63863bdd6e5a40dfee2`. Deployment of the API,
[operator PR #205](https://github.com/KyberNetwork/copy-trade-operator/pull/205),
and companion configuration was confirmed by the service maintainer. The
contracts below were checked against the merged source and generated OpenAPI;
this catalog update is not a live-data convergence audit.

Frontend integration changes:

1. Regenerate the client from the merged
   [OpenAPI contract](https://github.com/KyberNetwork/copy-trade-api/blob/f5a6e11e6e33cb51ab23f63863bdd6e5a40dfee2/proto/gen/openapi/aggregate/v1/aggregate.swagger.yaml).
   The HTTP operation count remains **38: 35 public and 3 VPN-only admin**.
2. Omit `chainId` on `/leaderboard/summary`, `/leaderboard`, and `/agents` for
   all enabled chains. Keep one global cursor sequence and use the returned
   row's `chainId` for chain-specific UI and actions.
3. Send the connected wallet as `ownerAddress` on `/leaderboard`. Render
   **My copy** when a row has `myCopyRunId`; otherwise render **Copy** with the
   normal Start availability checks. Reset the cursor and owner-specific cache
   on wallet change or disconnect. See [Copy and My copy buttons](#copy-and-my-copy-buttons).
4. Display leader and follower execution prices from `entryValuation.priceUsd`
   and `exitValuation.priceUsd`. The backend corrects follower prices for fees;
   remove any frontend fee multiplier or reconstruction from net token amounts.
   See [Entry and exit execution prices](#entry-and-exit-execution-prices).
5. Keep **estimated** and **received** rebates distinct. Formula 3 corrects
   beta-5 cashback estimates; older supported generations can still use
   formula 2. Use the returned values and statuses rather than hard-coding a
   formula. See [Estimated and received rebates](#estimated-and-received-rebates).
6. Render valid stale Total Return values with their status. Historical prices
   up to 12 hours old can now support a valuation; missing evidence can still
   make a value unavailable. Existing rows recover in the background.
7. After Stop or full withdrawal, follow action-status guidance and refresh
   copy-run lists. Faster balance-proof continuation does not bypass chain
   confirmations or make History membership immediate. See
   [History after Stop or withdrawal](#history-after-stop-or-withdrawal).

The price and rebate corrections use existing response fields. Fee accounting,
actual received rebates, and realized P&L remain server-owned. No frontend
backfill or transaction replay is required.

### September 25, 2026: VPN-only agent registry APIs

Documented the admin registry contract introduced by
[PR #87](https://github.com/KyberNetwork/copy-trade-api/pull/87), verified against
the checked-in protobuf, generated OpenAPI, handlers, and repository behavior.
The generated surface now contains **38 operations: 35 public operations and
3 VPN-only admin operations**. This catalog update does not verify deployment.

- List all registered agents, including new, inactive, suspended, and hidden
  agents, using `GET /admin/agents`.
- Register a new aggregate agent with `POST /admin/agents`; explicitly choose
  whether it is listed, suspended, or hidden.
- Edit display details and visibility with `PATCH /admin/agents/{agentId}` and
  an explicit `updateMask`. Agent ID, chain, and leader address are immutable.
- Admin access relies on the VPN-only ingress; no application API key or
  bearer token is required. Admin responses are `Cache-Control: no-store`.
- Hiding an agent removes public discovery access, but must not hide its
  existing user copy runs or prevent their supported actions. Render those
  pages from owner/copy-run responses, including their `agentSnapshot`.

See [Admin agent registry](#admin-agent-registry-vpn-only) for route prefixes,
request/response examples, field-mask rules, and visibility behavior.

### September 22, 2026: display readiness for every submitted action

`actions:status` returns `data.display` independently of `data.status`.

- On display `READY`, render the returned values with their metric status and
  `display.finality`, then refresh the named copy run or position.
- Action `SUCCEEDED` can arrive before display `READY`. Show call success
  immediately and keep the affected data marked as updating.
- Replace display state on each successful poll. An omitted or unknown display
  status does not preserve an earlier readiness claim.

The [receipt-first lifecycle](#when-to-show-success) also lets you show a
verified provisional result before either status is ready.

### September 22, 2026: live ROI, cached prices, and preparation diagnostics

Copy-run `roiPct` uses `totalPnlUsd / capitalInUsd × 100` from the same response.
Both fields can update after a background price refresh. Historical chart
points keep their existing formulas and refresh schedule.

Current-price availability uses the last successful fetch of each token,
including an unchanged price. The provider observation time remains in `asOf`;
do not override the server's metric status by comparing that timestamp with
the browser clock. Accept value changes even when `asOf` is unchanged. A failed
refresh or omitted token does not renew its age.

Preparation responses can include `data.failureDetails` with a stable code,
stage, safe message, and retryability. Aggregator failures also carry the original
numeric `aggregatorCode`, `aggregatorHttpStatus`, and a provider `retryAfterMs`
when available. Routing or simulation outages can return
HTTP 200 with a non-callable `PENDING` result. A prepared response that fails
contract validation returns HTTP 400, preventing automatic gateway retries.
See [preparation failures](#manual-sell-and-close-preparation-failures).

### September 21, 2026: funding-token discovery

`GET /chains` returns an optional `quoteToken` on each chain. Use it to initialize
Start Copy and Add Capital before entering an amount, replacing hard-coded
funding-token addresses and decimals. The API still has 35 operations; this
change adds a response field to an existing endpoint.

- Match the selected agent's chain for Start Copy or the copy run's chain for
  Add Capital. Use `quoteToken.decimals` to calculate raw amounts exactly.
- A present token always supplies its chain, address, and decimals. Missing
  symbol, name, or logo must not block amount entry or preparation.
- If the token itself is absent, show a token-information retry control without
  guessing a token. Preparation still determines action availability.
- Recheck the prepared token against the form before signing.

See [Funding token for Start Copy and Add Capital](#funding-token-for-start-copy-and-add-capital)
for examples, field rules, and UI behavior. Regenerate the client from the
[OpenAPI contract containing this field](https://github.com/KyberNetwork/copy-trade-api/blob/3f6b234462c2c77818bb5b1049062565814a94aa/proto/gen/openapi/aggregate/v1/aggregate.swagger.yaml).

### September 16, 2026: multi-contract generation integration

Verified against API `main` at `780b800846ba63b0edca59a1253fec83eeba11c1`,
including the [multi-contract baseline, PR #17](https://github.com/KyberNetwork/copy-trade-api/pull/17).
The HTTP surface remains **35 operations: 27 GET reads, 7 preparation POSTs,
and 1 observational status POST**. Regenerate the client from the current
[OpenAPI contract](../proto/gen/openapi/aggregate/v1/aggregate.swagger.yaml).

Required UI changes:

1. Discover each chain's `accountGenerations` from `GET /chains`. Treat
   `generationId` as an opaque, chain-scoped identity, not a contract version
   number or a deployment address.
2. Use agent `startCopyAvailabilities[]` and `feePolicies[]` for the selected
   generation. Join entries by `generationId`. The existing singleton
   `startCopyAvailability` and `flatFeeRatePct` cannot represent multiple
   create-enabled generations.
3. **Send `generationId` in every Start Copy preparation**, including retries
   and funding continuation. Missing, malformed, or unknown IDs return HTTP
   400. This supersedes the catalog's previous instruction that preparation
   takes no client-selected generation.
4. Display the returned optional `generationId` on copy runs and Smart Wallets.
   Existing-account actions still route by their account/run identity; they do
   not accept a generation override. Verify every preparation's returned
   `data.generationId` before submission.
5. Keep older generations' reads visible during retirement. Distinguish
   `EXISTING_ACCOUNTS_ONLY` from `READ_ONLY`, and use each action's availability
   and guidance instead of treating retirement as account closure.
6. Pass `generationId` to agent position-event reads when the controller has
   multiple compatible generations. Restart pagination when it changes.

See [Multi-contract integration](#multi-contract-integration) for the complete
field mapping, selection flow, lifecycle rules, and integration checks. V5 is
the current pre-release cohort; this contract does not promise V4 compatibility
or mean that every configured chain already has a leader. The recovery in
[PR #78](https://github.com/KyberNetwork/copy-trade-api/pull/78) restores sync
without adding a frontend recovery endpoint; continue using normal reads and
their freshness metadata.

### September 14, 2026: action recovery and reliable status polling

- Use each action's advisory status and guidance. Offer preparation for
  `TRY_PREPARE`; don't disable independent actions because another field is
  stale or another action failed.
- Distinguish [Manual Sell and Close preparation failures](#manual-sell-and-close-preparation-failures):
  no route is an HTTP 200 product outcome; aggregator dependency failures are
  sanitized HTTP errors with retry guidance.
- Keep `statusContext` and the submitted EVM transaction hash. After a failed
  status request, retry observation with the same values. Do not submit another
  transaction to recover a status check.
- Render the verified transaction result independently of optional Stop
  progress. Missing progress is unavailable; stale progress retains its label.
- A successful Manual Sell can leave new skipped-sell obligations. Refresh the
  position after success instead of comparing its current skip count with the
  count from preparation.

Follow [Action guidance](#action-guidance), [Submitted action status](#submitted-action-status),
and [Refresh after a transaction](#refresh-after-a-transaction) when updating
the frontend client.

For offline integration, use the [response field rules](#action-response-field-rules),
[status and reason matrix](#status-and-reason-matrix), and
[action response examples](#action-response-examples). The examples include
the full JSON enum names and distinguish an omitted field from a known zero.

### September 12, 2026: action guidance and submitted status

The API has **35 operations: 27 GET reads, 7 preparation POSTs,
and 1 observational status POST**. Regenerate the client from OpenAPI.

- Executable preparations include `statusContext`; every blocked advisory or
  preparation has bounded guidance. Status and error responses are no-store.
- Add Capital and Stop offer a live attempt for trusted targets during optional
  local lag. Position rows expose independent `manualSellAvailability` and
  `closePositionAvailability` leaves.
- Manual Sell can review current quantities with both optimistic pins omitted;
  supply both returned pins to request executable calldata.
- Empty Stop and Withdraw Tokens retain existing liquidation settings and
  disclose their observed root/details when available. Empty Stop does not
  promise that remaining assets will never be sold.
- POST context plus EVM hash to `actions:status`. Success applies to that call,
  stage, or batch; funding continuation, exit children, and further withdrawal
  batches remain explicit. Every poll rechecks canonicality.

See [Submitted action status](#submitted-action-status) for observation and
continuation behavior.

### September 10, 2026: ROI and copy-run metrics

[PR #69](https://github.com/KyberNetwork/copy-trade-api/pull/69) is merged and
deployed, as confirmed by the service maintainer. This release replaces APR
with lifetime ROI, adds copy-run win rate to list responses, preserves earned
chart returns after full withdrawal, and repairs Capital In publication.
The HTTP surface remains **34 operations: 27 GET reads and 7 preparation POSTs**.

#### Migrate the frontend client

1. Regenerate the client from the current
   [OpenAPI contract](../proto/gen/openapi/aggregate/v1/aggregate.swagger.yaml).
2. Replace the removed fields and sort values using the following table. Label
   the new metric **ROI**. Do not reuse an APR value as ROI.
3. Read `roiPct`, `copyRunWinRatePct`, and
   `copyRunClassifiedClosedPositionCount` directly from each copy-run list item
   or detail response. Copy-run `agentSnapshot.metrics` omits agent `roiPct`
   and `winRatePct`; it still includes `lifetimeVolumeUsd`.
4. Remove APR window labels and `AprMetric` handling. ROI is a `DecimalMetric`
   with `value`, `status`, and optional `asOf`. `AprMetric` and `WindowPolicy`
   are removed from the schema.
5. Clear saved APR sorts and cached APR models. Start pagination from the first
   page after changing the sort. If the server rejects a cursor during formula
   publication, restart the same query without its cursor.

| Previous contract | Current contract |
| --- | --- |
| Agent `metrics.apr30d` | Agent `metrics.roiPct` |
| Copy-run `myAprSinceCopy` | Copy-run `roiPct` |
| `LEADERBOARD_SORT_FIELD_APR_30D` | `LEADERBOARD_SORT_FIELD_ROI_PCT` |
| `OWNER_COPY_RUN_SORT_FIELD_AGENT_APR_30D` | `OWNER_COPY_RUN_SORT_FIELD_ROI_PCT`, ordered by the copy run's ROI |
| Detail-only copy-run win rate | `copyRunWinRatePct` and `copyRunClassifiedClosedPositionCount` on both list and detail responses |

The removed APR fields and enum values have no compatibility aliases. The
leaderboard defaults to ROI descending. Copy-run list defaults remain start
time for Open and stop time for History, both descending. The existing
`OWNER_COPY_RUN_SORT_FIELD_AGENT_WIN_RATE` still sorts by the agent's win rate;
it does not sort by `copyRunWinRatePct`.

See [ROI and chart return](#roi-and-chart-return) for the formula, metric
status rules, and the distinction between ROI and the percentage chart.

#### Render capital and withdrawal recovery

Capital In remains cumulative opening allocation, deposits, and top-ups.
Withdrawals do not subtract from it. The publication repair lets retained
capital evidence resume processing; it adds no frontend endpoint or retry
action. Continue rendering `capitalInUsd`, `capitalInProjectionStatus`, and
`FIELD_GROUP_CAPITAL` according to their returned status and finality. A
provisional Capital In value does not make ROI available.

A full withdrawal preserves previously earned time-weighted chart returns.
Later funding continues from that history when the source evidence is valid.
Do not clear the chart, reset its return to zero, or derive ROI from the current
wallet balance. Dollar P&L can remain available while ROI or chart percentages
lack sufficient evidence; render each metric independently.

### 2026-09-09 — Eligible-token withdrawal batches

Source-contract update: operator PR [#147](https://github.com/KyberNetwork/copy-trade-operator/pull/147)
merged at `c8653394d7a16c8c27efb0d96efed6631100d011` on September 9. Aggregate
API PR [#68](https://github.com/KyberNetwork/copy-trade-api/pull/68) merged at
`ae9bcf3bd85ce874c4de22c3c4a3181da2e2b81d` on September 9 at 15:48:21 UTC,
including the merged operator pin. The service maintainer confirmed these
changes are deployed on September 10, 2026. Regenerate the client from the
current aggregate OpenAPI contract.

#### Required UI changes

1. **All Tokens** still calls `:prepareWithdrawTokens` with
   `selection: "WITHDRAW_TOKEN_SELECTION_ALL_INDEXED_TOKENS"`. The operator
   selects at most 100 tokens per transaction, including the configured quote
   token and up to 99 positive nonquote balances in canonical address order.
   Zero nonquote balances are omitted; the quote token remains selected even at
   zero. `Stop Copy`'s separate limit remains 32 positions.
2. Use `data.withdrawTokens.hasMoreTokens` to detect remaining positive eligible
   tokens. After a successful receipt, refresh reads and prepare the same route
   again for the next batch. Do not prepare batches concurrently or replay an
   old call. The first batch permanently stops copying; full-withdrawal closure
   requires all residual run assets to be cleared.
3. Token eligibility is the configured quote token plus the union of the
   leader's canonical registration history and indexed traded tokens. Removed
   or disabled registered tokens remain eligible, and a direct deposit of an
   eligible token is visible/withdrawable even if the follower never bought it.
   Unrelated airdrops and tokens outside both sources are excluded. The client
   does not construct or filter this list.
4. Withdrawal preparation reads the eligible addresses from operator storage and
   exact balances through the operator's action-block RPC preflight. It does
   not use paginated KyberData wallet discovery. Wallet display inventory keeps
   its existing token-filtered KyberData path and batches of up to 50; that
   display path does not impose the withdrawal batch count.
5. Each selected batch is preflighted atomically. A reverting or unacknowledged
   eligible token makes the entire batch unavailable; do not submit a partial
   batch or skip the failing token. Gas estimation remains the connected
   wallet/provider's responsibility for the returned outer call.

This supersedes the 2026-09-08 wording that described `tokens[]` as an
indexed-inventory snapshot capped at 32 and exposed
`PREPARED_ACTION_REASON_TOKEN_INVENTORY_TOO_LARGE` as a current withdrawal
outcome. The route, request body, selection enum, no-store response, and exact
receipt refresh loop remain unchanged.

### 2026-09-08 — Token withdrawal, History, and recovery updates

Source baseline: local `main` at
`93021d4177e1aa418caf0befbd6afda3104c0732`, including
[token withdrawal #62](https://github.com/KyberNetwork/copy-trade-api/pull/62),
[advisory/recovery fixes #64](https://github.com/KyberNetwork/copy-trade-api/pull/64),
[sync recovery #61](https://github.com/KyberNetwork/copy-trade-api/pull/61), and
[capital/withdrawal recovery #65](https://github.com/KyberNetwork/copy-trade-api/pull/65).
This is source-contract verification, not a new deployment smoke test.

#### Required UI changes

1. Regenerate the client from the current OpenAPI. There are now **34 HTTP
   operations: 27 GET reads and 7 preparation POSTs**.
2. Separate the two withdrawal choices. **Withdraw Stable only** continues to
   call `:prepareWithdrawQuote` with `amountRaw`; it preserves the account's
   existing pause state. **All Tokens** calls `:prepareWithdrawTokens` with
   `selection: "WITHDRAW_TOKEN_SELECTION_ALL_INDEXED_TOKENS"`; the submitted
   transaction permanently stops copying. Explain that effect before signing,
   and do not submit when the preparation is unavailable because every selected
   balance is zero. Neither action is an alias for the other.
3. Read `withdrawTokensAvailability` on copy-run list/detail and copy-account
   summaries for the new button. Keep `withdrawQuoteAvailability` for stable
   withdrawal. Use the matching live preparation response for execution.
4. Add the History row metrics and server-side sorts below. Don't reuse the
   detail rebate estimate for a History **Rebates received** column.
5. Use server lifecycle/view membership after Stop or withdrawal. Full
   withdrawal can close a run while its underlying positions remain open;
   don't synthesize closed trades or reset Capital In.
6. Refresh detail, inventory, activity, lists/summaries, and visible performance
   after receipts. A receipt does not prove aggregate convergence. Restart a
   rejected cursor from page one after lifecycle/withdrawal evidence changes.

#### History columns and sorting

`CopyRunListItem` adds three status-bearing metrics. They are separate from the
detail-only `CopyRunSummary.feeBreakdown` and `portfolioPnlUsd` fields.

| History column | List field | `sortBy` |
| --- | --- | --- |
| Closed trades | `closedPositionCount` (existing) | `OWNER_COPY_RUN_SORT_FIELD_CLOSED_TRADES` |
| Realized P&L | `netRealizedPnlUsd` — closed-position-only net realized P&L | `OWNER_COPY_RUN_SORT_FIELD_REALIZED_PNL` |
| Fee paid | `feeChargedUsd` — upfront flat fees across the run | `OWNER_COPY_RUN_SORT_FIELD_FEE_PAID` |
| Rebates received | `rebatesUsd` — actual closed-position rebates, not pending estimates | `OWNER_COPY_RUN_SORT_FIELD_REBATES` |

These four sorts require `view=OWNER_COPY_VIEW_HISTORY`; using them with Open
is an invalid request. The existing `OWNER_COPY_RUN_SORT_FIELD_CURRENT_BALANCE`
is also History-only. Both sort directions are supported. Keep status-bearing
unavailable values unavailable, not zero, and let the server order the page.

#### Withdrawal-aware lifecycle and accounting

A stopped run stays `COPY_RUN_STATUS_CLOSING` until either position-based
closure is covered or a full-withdrawal zero-balance proof is valid, with no
relevant active repair. It then becomes `COPY_RUN_STATUS_CLOSED` and enters
History. The full-withdrawal proof covers the quote token and all canonical
run base tokens, including tokens from closed positions; it does not require
discovery of every unsolicited wallet token.

The zero observation is at a canonical covered block at or after Stop, not
necessarily the withdrawal transaction's block. Ordinary subsequent feed
progress or a later direct deposit does not reopen the run. A reorg or late
fact that invalidates its closure evidence can return it to Closing. Position
lifecycle and raw quantities remain independent and are not rewritten.

- Capital In remains gross opening/deposit/top-up contributions; withdrawals
  no longer subtract from it. Continue using `capitalInProjectionStatus` and
  the metric status while corrected values publish.
- For withdrawn unsold holdings, copy-run Total P&L and Return use historical
  valuation at the first Stop once the corresponding chart generation is
  published. Later live prices do not change that historical endpoint.
  Dollar P&L can be available while Return lacks capital-denominator evidence.
- Residual follower `positionPnlUsd` similarly uses canonical state and a
  historical mark at the first Stop, excluding later trades and estimated
  rebates. Price corrections can revise it; live price changes cannot.
- Withdrawn base holdings no longer contribute to live portfolio value,
  leftovers, unrealized P&L, or pending rebate estimates. Position current and
  leftover values are zero at the proven observation; unrealized P&L and
  estimated rebates are `NOT_APPLICABLE`. Actual realized P&L, fees, received
  rebates, and trade counts remain independent. Current quote balance can
  still include later deposits.

See [Withdraw Tokens](withdraw_tokens_api.md) for the maintained lifecycle and
valuation contract. Never use these display values to construct withdrawal
amounts; the preparation owns the token set and raw balances.

#### Activity and recovery behavior

`ExecutionActivityDetail` adds optional `baseTokenAddress` and
`quoteTokenAddress`, plus `baseToken` and `quoteToken` metadata. Use these for
skipped-sell token identity when present; absence is not an empty token or zero
amount. These fields do not add an execution amount or USD valuation.

The recovery fixes restore account-level action advisories without requiring
position-level evidence, preserve quote-balance publication when optional
closure checks stall, and allow capital/performance projections to catch up.
They don't add an FE retry endpoint or authorize optimistic numeric defaults.
Continue rendering each metric/advisory independently and use bounded polling.

Capital In can now be `SYNCING` with either a server-published `CURRENT`
provisional candidate or a retained `STALE` value. Render the metric according
to its status, with syncing/provisional context from `FIELD_GROUP_CAPITAL`;
don't require `READY` to display every number. `UNAVAILABLE` still authorizes
no number. USD P&L/chart values can remain usable while percentage/APR inputs
are unavailable; don't hide the dollar series or derive the percentage locally.

Invalid/unavailable optional action-advisory evidence degrades that field group
instead of failing the independent base row. Preserve the row and use the
returned advisory status for controls. No new recovery-specific enum is added.

Agent `whitelistedSymbols` now reads the applied aggregate trade-token
configuration. A proven empty configuration is a valid empty list; missing
symbol metadata degrades labels separately. No new FE endpoint or fallback to
an operator request is required. This supersedes the older staged-import notes.

### 2026-08-28 — Post-redesign availability hardening

Historical release entry. The September 10 ROI release supersedes its APR and
detail-only win-rate guidance. The 2026-09-08 entry supersedes its
preparation-route count and extends the lifecycle and withdrawal accounting
rules.

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

- For active or closing inventory, it is settled quote received plus current
  remaining token value minus original quote spent. This includes actual fee
  economics and received cashback, and excludes estimated cashback.
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
server timeout. Preparation dependency failures can return HTTP 503, or HTTP
429 for a recognized RPC rate limit. Follow the [RPC error guidance](#rpc-preparation-errors),
discard any earlier prepared call, and request a new preparation instead of
submitting cached calldata.

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

The zero-position-count membership rule below describes this historical
release; the 2026-09-08 withdrawal-aware closure rules supersede it.

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
- With the October 7 additions, the copy-run log surface exposes these
  category/subtype pairs:
  - Trade: Buy and Sell
  - Capital: Deposited, Capital topped up, and Capital withdrawn
  - Failed action: Skipped buy and Skipped sell
  - Fee or rebate: Flat fee captured and Rebate received
  - Copy lifecycle: Copy started and Copy stopped

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

Historical behavior: the September 10 release also adds these metrics to list
responses. Use the current [copy-run reference](#owner-dashboard-and-copy-runs).

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

Superseded by the 2026-09-08 contract and [Prepare Withdraw Tokens](#prepare-withdraw-tokens).

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
- Historical staging note: this release had a dormant aggregate trade-token
  importer. That limitation is superseded: the current source reads the
  applied aggregate configuration as described in the 2026-09-08 entry.

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
  token-metadata group. The staged request-time source described by this old
  release has since been replaced by the applied aggregate configuration.
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
| Current wallet inventory            | This baseline required complete inventory and a price for every nonzero asset. PR #102 replaces the price requirement with a subtotal of available valuations; see [Current wallet inventory](#current-wallet-inventory). | Use this route for **Remaining in Wallet** on active and stopped copy runs. Never calculate the total from `/balances` pages or add the pinned stable row to the server total. |
| Action-log chain links              | Valid mixed-case EVM addresses and hashes are canonicalized to lowercase. Invalid optional linkage claims are discarded while a safe narrative row remains renderable.                                                                                                          | Treat `txHash`, `leaderPositionId`, `blockNumber`, and `tokenAddress` as optional links. Their absence is not an action failure and must not be reconstructed from narrative text.          |
| Copy lifecycle views                | `OPEN` contains admitted runs with status `COPY_RUN_STATUS_ACTIVE` or `COPY_RUN_STATUS_CLOSING`. `HISTORY` contains admitted or readable historical-generation runs with status `COPY_RUN_STATUS_STOPPED` or `COPY_RUN_STATUS_CLOSED`. Position history is a separate universe. | Refresh from the server after lifecycle changes; do not pin local tab membership or derive it from position counts. Use owner position routes for owner-wide closed-trade history.          |
| Historical-generation compatibility | Parentless child facts explicitly classified `HISTORICAL` by the operator are consumed without creating current/actionable projections. Missing `ADMITTED` or `QUARANTINED` parent identity still fails closed.                                                                 | Historical or unavailable data must not be promoted into current dashboards or actions. Preserve typed unavailable states and direct/History reads; never infer missing values as zero.     |
| Public HTTP surface                 | This historical baseline had 26 reads, six preparations, and two wallet-session operations. The current contract removes both session operations and adds the closed-execution read. See the current operation index below.                                                    | Do not feature-gate a current route as unimplemented. Treat typed product statuses separately from HTTP availability.                                                                        |

### 2026-08-12 — Verified pre-release read smoke

`GET /chains`, `GET /agents?limit=1`, and `GET /docs/` were reachable in
pre-release. See [Historical pre-release public-read smoke](#historical-pre-release-public-read-smoke)
for the exact observations and limitations.

### 2026-07-30 — Historical pre-release action smoke

This evidence predates required Start funding intent and the removal of wallet
sessions. It is retained only as historical deployment evidence; do
not use it as the current payload or authentication contract.

## API endpoint

Pre-release origin:

```text
https://pre-copy-trade-api.kyberengineering.io
```

API base path:

```text
https://pre-copy-trade-api.kyberengineering.io/api/v1
```

These are public API addresses. Admin tools must use the environment's
VPN-only API base; see [Admin access and paths](#admin-access-and-paths).

## Frontend contract notes

Use the current fields below for frontend integration. The September 10
release replaces APR with ROI and exposes copy-run win rate on list and detail
responses. Update metric labels, saved sorts, action dialogs, and Smart Wallet
activity rendering to match the current contract.

| Surface                                  | Contract                                                                                                                                         | Required FE behavior                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manual Sell / Close Position preparation | No wallet challenge, session exchange, bearer token, or issuance lease                                                                          | Prepare directly from the latest authoritative read inputs. The owner wallet must still submit the exact returned call; preparation is not transaction authorization.                                                                                                                     |
| Withdraw Quote lifecycle and amount      | `withdrawQuoteAvailability` can be available at any copy lifecycle stage; preparation requires `amountRaw`                                      | Show the action according to advisory availability, not copy-run lifecycle. Send an exact partial amount or the explicit `uint256.max` full-balance sentinel, then prepare again on confirmation because the operator rechecks live state.                                                |
| All Tokens withdrawal | `withdrawTokensAvailability` and `:prepareWithdrawTokens` with `ALL_INDEXED_TOKENS` | Explain that submitting the transaction permanently stops copying. Do not route stable-only withdrawal here or build a token list in the client. |
| Start Copy funding                       | `fundingMode` plus optional `createPermitData`                                                                                                   | Send `START_COPY_FUNDING_MODE_UNFUNDED` with no permit, or `START_COPY_FUNDING_MODE_FUNDED` with an optional protobuf-JSON base64 byte string. The API uses `targetCapitalRaw` as the funded create amount. Permit format/capability remains operator-authoritative.                      |
| Contract-generation routing | Start Copy requires a catalog `generationId`. Existing-account actions derive generation from account identity. Every preparation returns `generationId`. | Select by chain and generation, use matching availability and fees, and preserve the selection throughout Start. Do not supply factory/controller addresses or override an existing account's generation. Preserve submitted status context verbatim. See [Multi-contract integration](#multi-contract-integration). |
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

## Contract authority and naming

This catalog is an integration guide. The machine-readable contract remains:

- [`aggregate_read.proto`](../proto/aggregate/v1/aggregate_read.proto) for
  read routes, enums, request validation, and response models.
- [`aggregate_action.proto`](../proto/aggregate/v1/aggregate_action.proto) for
  transaction preparation.
- [`aggregate_action_common.proto`](../proto/aggregate/v1/aggregate_action_common.proto) for
  shared action guidance.
- [`aggregate_action_status.proto`](../proto/aggregate/v1/aggregate_action_status.proto) for
  submitted transaction observation.
- [`aggregate_admin.proto`](../proto/aggregate/v1/aggregate_admin.proto) for
  VPN-only agent registration, inventory, details, and visibility management.
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

## Multi-contract integration

A generation identifies a reviewed contract deployment combination. Different
factories can share a controller or other modules. The API exposes generation
identity and supported product actions; the operator owns addresses, ABI
selection, and transaction construction.

Use `(chainId, generationId)` to key generation-specific state. Do not parse an
ID to derive a factory, contract release, or ABI. In particular, `v1` inside a
generation ID does not mean the smart contract is beta-1. Optional
`cashbackFormulaVersion` identifies fee arithmetic, not the deployment version.

### Fields to integrate

| Surface | JSON fields | UI behavior |
| --- | --- | --- |
| `GET /chains` | `data[].accountGenerations[]`: `generationId`, `lifecycle`, `capabilities[]` | Populate the supported generation choices for each chain. Refresh when opening a new action flow. |
| Agent cards from `/agents` and `/leaderboard`, and `/agents/{agentId}` profile | `startCopyAvailabilities[]`: `generationId`, `availability` | Use the entry for the selected generation. Its `status`, `reason`, and `guidance` are advisory; preparation is authoritative. |
| The same agent cards and profile | `feePolicies[]`: `generationId`, `flatFeeRatePct`, optional `cashbackFormulaVersion` | Display the selected generation's advertised fee with its metric status. Missing policy or formula identity is unknown, not zero. |
| Copy-run list/detail and copy-account list/detail | Optional `generationId` | Display the account's canonical generation. An absent field means provenance is unknown; do not substitute the newest or currently create-enabled generation. |
| Start Copy request | Required `generationId` | Send the selected ID on initial preparation, retries, and funding continuation. |
| Every preparation response | `data.generationId` | Match the Start selection or the existing account's known generation before using the response. |
| Agent position-event request | Optional `generationId` query parameter | Supply it when controller identity alone cannot select one compatible generation; preserve it across cursor pages. |

Join the catalog, availability, and fee arrays by `generationId`, never array
index. Their ordering is not a newest-version or recommended-version policy.
An unavailable fee must not fall back to a fee from another generation.

The singleton `startCopyAvailability` is unavailable when there is no unique
create-enabled generation. Scalar `flatFeeRatePct` is unavailable unless there
is exactly one create-enabled generation and it supports the fee-policy read.
Per-generation entries can remain usable when these singleton fields are
unavailable. Use the arrays for generation selection even when only one choice
is currently deployed.

Agent choices do not mean that a leader has one exclusive contract version.
The API has no agent-level `contractVersion` or single `generationId` field.
`AgentSnapshot` and `PositionSummary` also do not expose a generation ID. Show
the selected generation in Start, and the returned generation on account/run
records. A product label such as “V5” must come from a maintained label mapping;
use the opaque ID as a fallback instead of guessing from its spelling.

### Lifecycle and capabilities

Lifecycle applies to the generation. Account admission, quarantine, copy-run
status, and factory/controller pause are separate concepts. A supported older
generation is not automatically a historical-only or quarantined account.
Keep using server-defined list membership and action availability.

| Full lifecycle value | New Start | Existing accounts and reads |
| --- | --- | --- |
| `ACCOUNT_GENERATION_LIFECYCLE_CREATE_ENABLED` | Offer generation selection when Start capability and the selected agent's advisory allow it. | Use the individual action advisories and live preparation. |
| `ACCOUNT_GENERATION_LIFECYCLE_EXISTING_ACCOUNTS_ONLY` | Do not offer new account creation. | Supported existing-account actions remain possible. An already-created Start attempt can continue funding if the operator permits it. Keep its original generation and request ID. Reads remain available. |
| `ACCOUNT_GENERATION_LIFECYCLE_READ_ONLY` | Do not offer creation. | No executable actions, including Stop and withdrawal. Keep supported historical reads and submitted transaction observation available. Do not mark the account closed or remove it from history just because its generation retired. |

Supported capability enum values are:

```text
ACCOUNT_GENERATION_PRODUCT_CAPABILITY_START_COPY
ACCOUNT_GENERATION_PRODUCT_CAPABILITY_ADD_CAPITAL
ACCOUNT_GENERATION_PRODUCT_CAPABILITY_STOP_COPY
ACCOUNT_GENERATION_PRODUCT_CAPABILITY_WITHDRAW_QUOTE
ACCOUNT_GENERATION_PRODUCT_CAPABILITY_MANUAL_SELL
ACCOUNT_GENERATION_PRODUCT_CAPABILITY_CLOSE_POSITION
ACCOUNT_GENERATION_PRODUCT_CAPABILITY_WITHDRAW_TOKENS
```

Capabilities describe supported product operations, not a live authorization
to execute them. Read-only generations expose no executable capabilities; an
empty array can be omitted in protobuf JSON. Treat unknown lifecycle/capability
values as unsupported for execution. Use the matching action advisory, then
prepare again before signing. `AVAILABLE` and `TRY_PREPARE` permit an attempt;
neither permits submission without an executable preparation.

### Start selection and existing-account actions

1. Resolve the chain, load its catalog, and refresh the agent profile. For a
   new account, offer create-enabled generations with `START_COPY` capability
   and use each entry's advisory to render availability. If multiple choices
   are eligible, let the user select one; do not assume the last array entry
   is the newest. With one eligible choice, select its actual ID explicitly.
2. Display `feePolicies` for that same ID. Keep unknown or stale fee values
   labeled; use the live preparation's reviewed preview for confirmation.
3. Send `generationId` with the other
   [Start Copy request fields](#prepare-start-copy). Persist the chain,
   generation, agent, owner, and `startRequestId` as one flow identity. Keep
   funding mode, target, and permit intent stable during continuation.
4. Require `data.generationId` to match the selected ID. Use the returned
   allowance spender, call target, and calldata; never derive them from the
   ID. A generation change starts a new review flow and invalidates the old
   preparation and permit assumptions.
5. For an existing account, use its run/account endpoint and returned
   `generationId`. Add Capital, Stop, Withdraw Quote, Withdraw Tokens, Manual
   Sell, and Close Position take no generation override. Preserve unknown
   provenance as unknown; let live preparation establish or reject the exact
   target rather than assigning it to today's creation generation.
6. Preserve `statusContext` and the submitted hash unchanged. A later lifecycle
   change does not authorize changing the context to a different generation
   or submitting the same operation again.

`PREPARED_ACTION_REASON_UNSUPPORTED_ACCOUNT_GENERATION` is a typed unavailable
product outcome. Follow its guidance; do not retry against another generation
automatically. Missing, malformed, or unknown Start IDs are HTTP 400 request
errors. Refresh the catalog and require a valid selection instead of retrying
the same invalid request.

For existing-account fees, use the run's
[`cashback-policy` endpoint](#account-effective-cashback-policy). Agent
`feePolicies` are advertisements for pre-Start display and do not replace an
account's effective fee policy.

### Position-event pagination and retirement

`GET /agents/{agentId}/positions/{positionId}/events` accepts `generationId`.
Omission works only when the position's controller resolves to one unambiguous
catalog generation. With shared controllers, retain the relevant generation
from the viewing context or require an explicit selection; the server validates
that it matches the position. Do not guess by array order. The response does
not echo this selection, so retain it with the query and cursor.

Changing generation invalidates that pagination context. Restart from page one
without a cursor. Other discovery, copy-run, and position-list endpoints do not
add a `generationId` filter; render their server-selected rows and identities.

Support these transitions without replacing account identities:

- **Two versions running:** show both eligible Start choices and their own fees.
  Existing accounts continue using their creation generation.
- **Retiring a version:** remove it from new Start choices when it becomes
  existing-accounts-only. Retain reads, supported account actions, and original
  Start continuation. A capability or lifecycle change requires fresh reads and
  preparation, not a client-side switch to another contract.
- **Keeping an old version read-only:** retain its readable history and status
  observations, and disable execution according to the returned policy. Read-only
  does not provide an exception for exits or withdrawals; those require an
  action-capable stage before retirement.

The baseline does not expose a public `DISABLED` or `QUARANTINED` generation
lifecycle. Backend retirement must retain the catalog and read support needed
for old data. Frontends must not treat disappearance from new Start choices as
permission to delete account history or reinterpret old records.

## Screen-to-API map

This is the recommended UI integration map. “Initial” calls are needed to
render the main screen. “Lazy” calls should be issued only when the relevant
tab, chart, drawer, or drilldown is opened.

| Screen or UI region                   | Initial APIs                                                                                        | Lazy or drilldown APIs                                                                                                       | Action APIs                                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| App bootstrap / network selector      | `GET /chains`                                                                                       | None                                                                                                                         | None                                                                                                               |
| Explore / leaderboard header          | `GET /leaderboard/summary`                                                                          | None                                                                                                                         | None                                                                                                               |
| Leaderboard table                     | `GET /leaderboard`, with `ownerAddress` when connected                                                | Load the next cursor page; open `myCopyRunId` for **My copy**                                                                 | **Copy**: `POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy` with the selected generation              |
| Agent discovery/search                | `GET /agents`                                                                                       | Load the next cursor page                                                                                                    | `POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy`                                                     |
| Agent profile header and KPI cards    | `GET /agents/{agentId}`, optionally `GET /agents/{agentId}/stats`                                   | None                                                                                                                         | `POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy`                                                     |
| Agent performance chart               | `GET /agents/{agentId}/performance`                                                                 | Additional cursor pages or a new request when series/window changes                                                          | None                                                                                                               |
| Agent action-log tab                  | `GET /agents/{agentId}/action-logs`                                                                 | Filter by leader position, action `type`, or time range; group by `sessionId`; load the next cursor page                     | None                                                                                                               |
| Agent open/history positions tab      | `GET /agents/{agentId}/positions`                                                                   | `GET /agents/{agentId}/positions/{positionId}` and `/events` when a row is opened                                            | None                                                                                                               |
| My Copies — Open summary              | `GET /users/{ownerAddress}/copy-summary?view=OWNER_COPY_VIEW_OPEN`                                  | None                                                                                                                         | None                                                                                                               |
| My Copies — Open rows                 | `GET /users/{ownerAddress}/copy-runs?view=OWNER_COPY_VIEW_OPEN`                                     | Load the next cursor page; selected-run detail and positions                                                                 | Prepare Add Capital, Stop Copy, Withdraw Quote, or Withdraw Tokens. Stable-only preserves pause state; All Tokens permanently stops copying. |
| History — stopped-run summary         | `GET /users/{ownerAddress}/copy-summary?view=OWNER_COPY_VIEW_HISTORY`                               | None                                                                                                                         | None                                                                                                               |
| History — stopped-run list            | `GET /users/{ownerAddress}/copy-runs?view=OWNER_COPY_VIEW_HISTORY`                                  | Load the next cursor page; use History column sorts                                                                          | Prepare Withdraw Quote or Withdraw Tokens according to the matching advisory                                       |
| History — all closed positions/trades | `GET /users/{ownerAddress}/positions?view=POSITION_VIEW_CLOSED`                                     | Filter by agent/chain, paginate, or group rows by `copyRunId`                                                                | None for an already closed position                                                                                |
| History — selected stopped run        | `GET /users/{ownerAddress}/copy-runs/{copyRunId}` and `GET .../positions` | Choose `POSITION_VIEW_CLOSED` only for closed trades; load performance, cashback policy, and activity as needed | Prepare Withdraw Quote or Withdraw Tokens only when advertised; historical-generation rows remain non-actionable |
| Copy-run detail                       | `GET /users/{ownerAddress}/copy-runs/{copyRunId}` and `GET .../positions`                           | `GET .../performance`; `GET .../cashback-policy` when fee/cashback detail is visible; owner activity filtered by `copyRunId` | Prepare Add Capital, Stop Copy, Withdraw Quote, Withdraw Tokens, Manual Sell, or Close Position as applicable |
| All owner positions                   | `GET /users/{ownerAddress}/positions`                                                               | Filter by agent, chain, view, or sort; load the next cursor page                                                             | Prepare Manual Sell or Close Position when advertised                                                              |
| Leftover positions                    | Owner or copy-run positions with `view=POSITION_VIEW_LEFTOVER`                                      | Copy-account drilldown and pending-sell obligations                                                                          | Manual Sell or Close Position when advertised                                                                      |
| Owner activity feed                   | `GET /users/{ownerAddress}/activity`                                                                | Filter by `copyRunId`, `chainId`, exact `type`, or product `group`                                                           | None                                                                                                               |
| Owner copy-account list               | `GET /users/{ownerAddress}/copy-accounts`                                                           | Load the next cursor page                                                                                                    | None                                                                                                               |
| Copy-account overview                 | `GET /copy-accounts/{chainId}/{copyAccount}`                                                        | Balances, positions, and history routes below                                                                                | Prepare Add Capital, Stop Copy, Withdraw Quote, or Withdraw Tokens through the associated copy run |
| Copy Details — Remaining in Wallet    | `GET /copy-accounts/{chainId}/{copyAccount}/wallet-inventory`                                       | Use `/balances` only for a separately paginated asset explorer                                                               | None                                                                                                               |
| Copy-account balances                 | `GET /copy-accounts/{chainId}/{copyAccount}/balances`                                               | Load the next cursor page                                                                                                    | None                                                                                                               |
| Copy-account positions                | `GET /copy-accounts/{chainId}/{copyAccount}/positions`                                              | Pending-sell obligations for a selected `userPositionId`                                                                     | Manual Sell or Close Position                                                                                      |
| Copy-account history                  | `GET /copy-accounts/{chainId}/{copyAccount}/history`                                                | Filter by exact `type` or product `group`                                                                                    | None                                                                                                               |
| Skipped-sell recovery drawer          | Position row plus `GET .../pending-sell-obligations`                                                | Refresh the FIFO immediately before preparation                                                                              | Prepare Manual Sell or Close Position directly, then submit from the owner wallet                                  |

### History scope rule

Copy-run lifecycle and position lifecycle are independent:

- `OWNER_COPY_VIEW_HISTORY` returns terminal copy runs. A stopped run can have
  zero closed positions. A fully withdrawn run can enter History while its
  underlying position records remain open; withdrawal is not a sale.
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

### Action screen map

All seven routes prepare wallet calls. Use the matching advisory status to
offer preparation, then use the preparation response to decide whether to open
the wallet. The API does not submit the call.

| UI action      | Read before preparation                                                                             | Preparation route                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Start Copy     | Chain `accountGenerations` and agent `startCopyAvailabilities`/`feePolicies` for the selected `generationId`; refresh the profile when opening the modal | `POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy`                                     |
| Add Capital    | Direct copy-run or copy-account detail and `addCapitalAvailability`                                 | `POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareAddCapital`                               |
| Stop Copy      | Direct copy-run detail plus its current open/leftover position selection and `stopCopyAvailability` | `POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareStopCopy`                                 |
| Withdraw Quote | Direct copy-run/copy-account detail and `withdrawQuoteAvailability`; don't wait for Stop Copy       | `POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareWithdrawQuote`                            |
| Withdraw Tokens | Direct copy-run/copy-account detail and `withdrawTokensAvailability`; explain permanent Stop | `POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareWithdrawTokens` |
| Manual Sell    | `manualSellAvailability` on the current position; review current quantities through preparation or the pending-sell-obligation FIFO | `POST /users/{ownerAddress}/copy-runs/{copyRunId}/positions/{userPositionId}:prepareManualSell` |
| Close Position | `closePositionAvailability` on the current position                                                 | `POST /users/{ownerAddress}/copy-runs/{copyRunId}/positions/{userPositionId}:prepareClosePosition` |

Advisory availability controls presentation only. Always call the matching
preparation route when the user confirms, and branch on its typed
`status`/`reason`. A `PENDING`, `COMPLETED`, or `UNAVAILABLE` preparation is a
successful API response describing current product state; it does not mean the
route is missing.

### Screen fetch guidance

- Calls at the same screen level can be made in parallel. For example, Open
  Copies summary and rows do not depend on each other.
- Do not issue one `GET /agents/{agentId}` per leaderboard or copy-run row.
  `AgentCard` and `agentSnapshot` already contain the row-level display data.
- Use the direct detail endpoint when a user opens a row. Do not treat a cached
  list row as authoritative transaction state.
- Start a new cursor sequence when a filter, sort field, sort order, owner,
  agent, chain, view, route, or position-event `generationId` changes.
- After wallet submission, use `actions:status` to check the exact transaction.
  Show `receiptResult` immediately as a provisional successful effect and let
  the user dismiss the dialog. Render `display` values only when ready and
  follow each fresh GET's [related-read status](#related-read-status). On action `SUCCEEDED`, handle `nextStep`.
  Pending UI state remains separate from server totals and action availability.

Common screen requests:

```text
# All-chain summary and connected-wallet leaderboard
GET /leaderboard/summary
GET /leaderboard?ownerAddress={ownerAddress}&sortBy=LEADERBOARD_SORT_FIELD_ROI_PCT&sortOrder=SORT_ORDER_DESC&limit=25

# Base leaderboard, highest ROI first
GET /leaderboard?chainId=8453&sortBy=LEADERBOARD_SORT_FIELD_ROI_PCT&sortOrder=SORT_ORDER_DESC&limit=25

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

## Quick start

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

## Common response contract

### Envelopes

A single-resource public **read** response:

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

A public list **read** response:

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

Admin reads also omit `meta`. Admin POST/PATCH responses add `changed` beside
`data`; see [Admin response fields](#admin-response-fields).

### Response metadata

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
It can also carry `METRIC_STATUS_CURRENT` while
`capitalInProjectionStatus` is `SYNCING` and capital finality is
`DATA_FINALITY_PROVISIONAL`. This is a server-published candidate, not a
client-side funding overlay. Keep the syncing/provisional indication rather
than hiding the number or relabeling it as a completed generation.
After a verified submitted action, fresh reads include its pending effects in
these field qualities. Follow [related-read status](#related-read-status); no
client action-readiness map is needed.

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

### ROI and chart return

`roiPct` is a lifetime return on cumulative deposits:

```text
ROI (%) = lifetime Total P&L / cumulative deposits × 100
```

For copy-run list and detail responses, the numerator is `totalPnlUsd` in the
same response, including marked open positions. The denominator is its
canonical `capitalInUsd`. Both P&L and ROI respond to a live price refresh;
there is no wait for a historical chart point or midnight refresh.

Cumulative deposits include opening allocation, deposits, and top-ups.
Withdrawals do not reduce this denominator. It is not
`capitalInUsd - capitalOutUsd` or the current wallet balance. Agent ROI uses
the agent's own deposit history and retained lifetime P&L. Historical copy-run
chart points retain their existing formulas and can differ from the live
headline between refreshes.

For example, deposits of $100 and a $50 top-up give a $150 denominator. If
Total P&L is $30, ROI is 20%, even after a $60 withdrawal. Render the
server-published metric and its status. Do not combine fields from different
responses to recompute it:

```json
{
  "roiPct": {
    "value": "20",
    "status": "METRIC_STATUS_CURRENT",
    "asOf": "2026-09-10T00:00:00Z"
  }
}
```

The example is illustrative. `value: "20"` means 20%, not 0.20%. ROI has no
annualization, rolling window, or minimum account age. The stats route still
accepts only `WINDOW_30D`; that request constraint does not turn ROI into a
30-day metric.

Use these display rules:

- Show a server-published zero when cumulative deposits are confirmed to be
  zero. An empty wallet after withdrawal does not establish zero deposits.
- A copy run proven to have no position facts can publish zero Total P&L and
  ROI even while unrelated capital data is catching up. An empty response
  page does not establish that proof.
- After [API PR #110](https://github.com/KyberNetwork/copy-trade-api/pull/110)
  is deployed, the API also returns zero Total P&L and ROI for an
  eligible new run while its first metrics are updating, with
  `METRIC_STATUS_STALE` and `asOf` set to its creation time. Show the stale
  indication: this describes the opening value while later coverage catches
  up. Render the returned metrics; do not synthesize this zero in the client
  or replace a later `UNAVAILABLE` result with it.
- Missing, invalid, or provisional deposit evidence does not authorize a
  calculated ROI. Follow the metric status; do not substitute zero or a
  cached APR value. The proven no-position case above is independent.
- Show an available `STALE` ROI with a stale indication. Its `asOf` identifies
  the supporting evidence, not the browser's refresh time.
- Render dollar P&L independently when ROI is `UNAVAILABLE`.

`totalPnlPct` and `PerformancePoint.valuePct` remain cash-flow-neutral,
time-weighted returns. They can differ from ROI when capital changes over
time. Label the percentage chart **Return**, and label `roiPct` **ROI**.
Preserve the server's earned return history across full withdrawals and later
funding; do not reset or annualize it.

Historical Return can recover without a new trade or wallet action. The backend
now accepts a valid settlement observation at or before the valuation boundary
when it is at most 12 hours old. An accepted older mark retains its provenance
and can produce `METRIC_STATUS_STALE`; it is not made current by the browser's
refresh. Missing, invalid, future, or over-age evidence remains unavailable.
This historical-price rule does not define the freshness window for live prices.

Render a returned stale `totalPnlPct` or `PerformancePoint.valuePct` with a stale
indication. If it is unavailable, keep independently available `totalPnlUsd` and
other fields visible. Background price recovery can update stopped runs too;
`UNAVAILABLE` is not a permanent failure and must not become a fabricated zero.
History membership does not depend on these financial values becoming available.

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

For an open agent position, read its unit price from
`currentValuation.priceUsd` and its remaining holding value from
`currentValuation.valueUsd`. Render both `CURRENT` and `STALE` values, with a
stale indication for the latter. Follow `status` for availability; do not hide
a price solely because `priceAsOf` is old. The server refreshes each token in
the background and measures freshness from its last successful fetch while
preserving the provider observation time in `priceAsOf`.

### Advisory action availability

Agent, copy-run, copy-account, and position reads expose compact advisory action
state:

```text
ADVISORY_ACTION_STATUS_AVAILABLE
ADVISORY_ACTION_STATUS_PENDING
ADVISORY_ACTION_STATUS_UNAVAILABLE
ADVISORY_ACTION_STATUS_TRY_PREPARE
```

The object contains `status`, a typed `reason`, optional `asOf`, and `guidance`
for a blocked or live-check outcome. Use it to render the action and its next
step. It is not authorization and must not be used to
construct calldata. The matching POST preparation route always makes the final
decision using current chain and source state.

Use the leaf advisory object even when broad response `meta.status` is
`DATA_STATUS_STALE`. An unrelated lagging field group doesn't suppress an
action whose relevant evidence is ready. The live preparation response remains
authoritative in every case.

Enum values in this table omit the `ADVISORY_ACTION_STATUS_` prefix.

| Status | Control behavior |
| --- | --- |
| `AVAILABLE` | Offer preparation. Request wallet submission only after an executable preparation returns. |
| `TRY_PREPARE` | Offer a live preparation check. The target is trusted, but the read response cannot establish readiness. |
| `PENDING` | Explain the missing evidence and offer the refresh or review step from `guidance`. |
| `UNAVAILABLE` | Explain the reason and offer any retry, alternative action, or support step from `guidance`. |

Do not convert a status to `AVAILABLE` on a timer. A failed request or a
temporary no-route result must not become a permanent client-side disable flag.
Keep recovery controls available and check each alternative through its own
preparation route. Position rows have separate `manualSellAvailability` and
`closePositionAvailability` objects; don't infer either from the other.

For Withdraw Quote, advisory availability depends on safely covered account
identity and generation capability, not copy lifecycle or a cached balance.
An available advisory value doesn't prove that the connected wallet is still
the owner or that the account still has a positive quote-token balance. The
preparation route verifies both values at one exact action block.

`withdrawTokensAvailability` is a separate capability advisory. It does not
prove that all wallet tokens were discovered or that any selected balance is
positive. Live token withdrawal returns
`PREPARED_ACTION_REASON_NO_WITHDRAWABLE_BALANCE` when the quote and every
eligible nonquote balance are zero; it does not return a stop-only transaction.
Add Capital is unavailable after permanent Stop/closure; do not offer a deposit
merely because the wallet still holds tokens.

### Action guidance

Advisory objects, prepared actions, and submitted-status data use the same
`guidance` shape. Action HTTP errors carry it in `details[]`; see
[Error handling](#error-handling).

| Field | Frontend use |
| --- | --- |
| `message` | Display the explanation as text. Do not use message text for control flow. |
| `retryAfterMs` | Optional minimum delay before retrying the same operation. It does not extend calldata validity. |
| `nextSteps[]` | Up to three suggested controls, identified by `kind` and labeled by `label`. |
| `nextSteps[].action` | Optional target action: `start_copy`, `add_capital`, `stop_copy`, `withdraw_quote`, `withdraw_tokens`, `manual_sell`, or `close_position`. |
| `nextSteps[].copyRunId`, `userPositionId` | Optional target overrides. Otherwise, use the containing response's target. |
| `nextSteps[].tokenAddress`, `amountRaw`, `spenderAddress` | Optional token approval or amount inputs. Keep raw amounts as strings. |

Step enum values have the `ACTION_GUIDANCE_STEP_KIND_` prefix:

| Kind | Frontend behavior |
| --- | --- |
| `TRY_PREPARE` | Request a fresh preparation for the selected action. |
| `RETRY` | Retry preparation or status observation according to the endpoint that returned the guidance. |
| `REVIEW_UPDATED_PREPARATION` | Show the updated inputs or preview for review before submission. |
| `REFRESH_SELL_DETAILS` | Refresh the position and pending-sell obligations. |
| `ADJUST_AMOUNT` | Let the user review an amount supported by the action. |
| `APPROVE_QUOTE` | Review the supplied token, spender, and allowance before using the wallet's approval flow; then prepare again. |
| `SWITCH_OWNER_WALLET` | Ask the user to connect the owning wallet. |
| `VIEW_EXISTING_RESULT` | Open or refresh the relevant account, position, or submitted result. |
| `CHECK_ALTERNATIVE_ACTION` | Offer a separate preparation check for `action`; do not modify or submit the original call. |
| `CONTACT_SUPPORT` | Show a support control with the request reference. |

Guidance never authorizes a transaction. Unknown step kinds must not trigger
wallet actions. In particular, `RETRY` from `actions:status` means **check status**,
not **prepare or submit again**.

Resolve a step's target from the screen's saved operation first, then apply any
explicit `copyRunId` or `userPositionId` override. Use `action` only to select
one of the seven documented preparation routes; it is not a URL or calldata.
For example, an empty-Stop alternative uses `action: "stop_copy"`, the indicated
copy run, and a new request with `userPositionIds: []`. Explain the retained
exit settings before the user confirms this different request.

`nextSteps` and `retryAfterMs` serve different purposes. A pending status can
have a retry delay with no steps. An invalid status request can have a `RETRY`
step with no retry delay. Render the step as a control; use the HTTP status and
the [status and reason matrix](#status-and-reason-matrix) to decide whether
automatic polling is appropriate. Do not start a retry loop merely because a
`RETRY` step is present.

### Numeric values

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
- `amountDecimal`, `*Usd`, `priceUsd`, ROI, and percentage fields are decimal
  strings intended for decimal arithmetic and display formatting.
- `RatioMetric.valueRaw`, sell ratios, and fee rates are fixed-point integers
  scaled by `1e18`. For example, `500000000000000000` is 50%.
- `slippageBps`, `limit`, and small counts defined as `uint32`/`int32` remain
  JSON numbers.

### Addresses and time

- Send EVM addresses as `0x` addresses.
- Lowercase addresses are canonical in responses and are recommended in URLs.
- Timestamps are RFC3339 strings.
- `ownerAddress` on owner read routes is the wallet that originally created the
  follower account. It is a read filter, not proof of current on-chain ownership
  or authority.
- Public routes accept mixed-case input and canonicalize addresses in the
  response. Lowercase input remains recommended for stable URLs and cache keys.

## Cursor pagination

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

### Stable ordering

| Collection                            | Default/effective order                                                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Leaderboard                           | ROI descending, with stable identity tie-breakers                                                                                              |
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

## Shared query enums

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

## Shared request validation

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

## Endpoint catalog

### Chain metadata

| Method | Path      | Parameters | `data`    |
| ------ | --------- | ---------- | --------- |
| GET    | `/chains` | None       | `Chain[]` |

A chain contains `chainId`, `slug`, `name`, `iconUrl`, `isEnabled`,
`accountGenerations[]`, and optional `quoteToken`. Each generation has
`generationId`, `lifecycle`, and `capabilities[]`; see
[Multi-contract integration](#multi-contract-integration).

Use this route to populate the network selector and chain metadata. Do not
hard-code chain display names or icons from `chainId`. An enabled chain can have
no configured agents. Its empty discovery response can report
`DATA_STATUS_UNAVAILABLE` while `meta.asOfChains[]` reports current source data;
this alone does not mean that chain sync has failed.

#### Funding token for Start Copy and Add Capital

Read `data[].quoteToken` from `/chains` before asking the user for an amount.
Match the agent's `chainId` for Start Copy or the copy run's `chainId` for Add
Capital. This is one required funding token per chain, not a selectable token
list. Neither preparation request accepts a different funding token.

| Field | Meaning and presence |
| --- | --- |
| `quoteToken.chainId` | Present with the token; decimal string matching the enclosing chain's `chainId`. |
| `quoteToken.address` | Present with the token; canonical lowercase ERC-20 address from the operator. |
| `quoteToken.decimals` | Present with the token; JSON integer from 1 through 255 for converting the input to raw units. Never default a missing value to zero or six. |
| `quoteToken.symbol`, `.name`, `.logoUrl` | Optional display metadata; may be omitted or empty. |

The following synthetic `GET /api/v1/chains` response is a complete example.
Its token address and generation ID are illustrative, not frontend defaults.

```json
{
  "data": [
    {
      "chainId": "8453",
      "slug": "base",
      "name": "Base",
      "isEnabled": true,
      "accountGenerations": [
        {
          "generationId": "example-generation",
          "lifecycle": "ACCOUNT_GENERATION_LIFECYCLE_CREATE_ENABLED",
          "capabilities": [
            "ACCOUNT_GENERATION_PRODUCT_CAPABILITY_START_COPY",
            "ACCOUNT_GENERATION_PRODUCT_CAPABILITY_ADD_CAPITAL"
          ]
        }
      ],
      "quoteToken": {
        "chainId": "8453",
        "address": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
        "decimals": 6,
        "symbol": "USDC",
        "name": "USD Coin"
      }
    }
  ],
  "meta": {
    "requestId": "req_quote_discovery_example",
    "generatedAt": "2026-09-21T10:05:00Z",
    "dataAsOf": "2026-09-21T10:05:00Z",
    "status": "DATA_STATUS_CURRENT",
    "asOfChains": [
      {
        "chainId": "8453",
        "dataAsOf": "2026-09-21T10:05:00Z",
        "syncedAt": "2026-09-21T10:05:00Z",
        "status": "DATA_STATUS_CURRENT"
      }
    ]
  }
}
```

Each enabled chain includes `quoteToken` with its chain, address, and decimals.
The API retains this operator-provided identity in memory; a later operator or
metadata outage does not remove it.

Identify the token by `(chainId, address)`. If only display metadata is missing,
show the address and use the returned decimals. Missing metadata does not make
the funding token unavailable. If `quoteToken` is unexpectedly absent, show a retryable
token-information message; do not assume a token or decimals. A valid preparation
response remains another source of token information. `whitelistedSymbols`
describes tradable base tokens and must not populate the funding-token selector.

Use exact decimal arithmetic to produce `targetCapitalRaw` or `amountRaw`:
`1.25` with six decimals becomes `"1250000"`. Do not use JavaScript floating-point
multiplication. Discovery does not guarantee action availability, minimums,
balance, or allowance. Prepare normally and follow its status and guidance.
Before signing, compare its quote-token identity with the form; on a mismatch,
refresh `/chains` and ask the user to review the amount. If preparation lacks
display metadata, reuse discovery decimals only for the same chain and address.

Use these response rules for the funding form:

| Response condition | UI behavior |
| --- | --- |
| Token identity, decimals, and metadata are present | Show the token and initialize the amount input. |
| `symbol`, `name`, or `logoUrl` is omitted or empty | Show the address or a generic icon. Keep the amount input and preparation available. |
| `quoteToken` is unexpectedly omitted | Show “Funding token information is unavailable” with a retry control. Keep other reads and independently available actions usable. Do not submit a dummy preparation to discover decimals. |
| `/chains` returns an HTTP error | Apply the catalog's normal read-error handling and retry discovery. This is not a preparation result. |
| The prepared token has another chain or address, or provides different decimals | Do not open the wallet with that result. Refresh discovery and have the user review the amount before preparing again. |

`meta.status: DATA_STATUS_CURRENT` describes the chain response. Optional
display fields can still be absent; check them directly. Treat a missing
`quoteToken` as an incomplete response and retry discovery. Missing quote-token discovery has no dedicated `reason` or
`guidance` object in this response.

When the selected chain or funding-token identity changes, discard the old
raw amount and prepared call. Recalculate from the user's decimal input only
after the new token and decimals are known. For Start Copy continuation, keep
the original request ID, generation, and raw target; a token mismatch requires
review rather than silently rewriting that attempt.

### Leaderboard and agent discovery

| Method | Path                   | Parameters                                                         | `data`               |
| ------ | ---------------------- | ------------------------------------------------------------------ | -------------------- |
| GET    | `/leaderboard/summary` | `chainId?`, `search?`, `strategyCategory?`                         | `LeaderboardSummary` |
| GET    | `/leaderboard`         | Previous filters plus `ownerAddress?`, `cursor?`, `limit?`, `sortBy?`, `sortOrder?` | `AgentCard[]`        |
| GET    | `/agents`              | `chainId?`, `search?`, `strategyCategory?`, `cursor?`, `limit?`    | `AgentCard[]`        |

Leaderboard sort fields:

```text
LEADERBOARD_SORT_FIELD_ROI_PCT
LEADERBOARD_SORT_FIELD_WIN_RATE
LEADERBOARD_SORT_FIELD_LIFETIME_VOLUME
LEADERBOARD_SORT_FIELD_COPIERS
LEADERBOARD_SORT_FIELD_AUM
LEADERBOARD_SORT_FIELD_OPEN_POSITIONS
```

The default leaderboard order is ROI descending. Agent discovery uses a
stable display-name order. The removed APR sort value is unsupported.

Filter behavior:

| Parameter          | Supported values and behavior                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `chainId`          | Optional positive chain ID. Omit for all enabled chains. Explicit `0` or a negative value is invalid.           |
| `ownerAddress`     | Leaderboard only. Optional connected-owner EVM address; enriches rows with `myCopyRunId` without filtering the agent list. Omit when disconnected. |
| `search`           | Optional, trimmed and case-insensitive, maximum 256 Unicode characters.                                        |
| `strategyCategory` | Optional `FOCUSED`, `DIVERSIFIED`, or `ACTIVE` enum. Categories overlap; an agent can appear in more than one. |
| `sortBy`           | Leaderboard only. Omit for ROI.                                                                            |
| `sortOrder`        | Leaderboard only. Omit for descending.                                                                         |
| `limit`, `cursor`  | Standard cursor pagination.                                                                                    |

All-chain requests use one globally sorted and paginated result. Do not fetch
one page per chain and merge or re-sort those pages in the browser. Apply the
same chain, search, and strategy filters to the table and summary. `/agents` remains
the discovery list and has different qualification/order rules from the
leaderboard. Neither `/agents` nor `/leaderboard/summary` accepts `ownerAddress`.

Key `AgentCard` fields:

- `agentId`, `chainId`, `leaderAddress`
- `displayName`, `avatarUrl`, `modelName`, `isVerified`
- `badges`, `strategyLabel`, `strategyCategories`
- `metrics`
- `flatFeeRatePct`
- `startCopyAvailability`
- `startCopyAvailabilities[]` and `feePolicies[]`, keyed by `generationId`
- optional `myCopyRunId` on owner-enriched leaderboard rows

Use the per-generation arrays for Start selection and fee display. The scalar
fields are convenience values for an unambiguous creation generation; see
[Fields to integrate](#fields-to-integrate).

`AgentCard.metrics` contains:

| Field                                                                                          | Meaning                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `roiPct`                                                                                       | Lifetime Total P&L divided by cumulative deposits, multiplied by 100. Uses `DecimalMetric`; see [ROI and chart return](#roi-and-chart-return).                                                                                                                                    |
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
`totalCopierCount` counts lifetime distinct owner wallets in the selected chain,
search, and strategy scope. An owner copying multiple matching agents counts
once, including closed-run history. Every metric has its own status.

`totalAumUsd` sums usable AUM from selected agents. If some selected agents have
no usable AUM, show the returned subtotal and stale/partial indication. If none
of a nonempty selection is usable, the total is unavailable; a proven empty
selection returns zero. This does not change each agent's completeness rules.

#### Copy and My copy buttons

With a connected wallet, request the existing leaderboard once with
`ownerAddress`. The response includes the owner's association alongside each
agent; no second owner-list request is needed just to label these buttons.

```text
GET /leaderboard?ownerAddress=0x0000000000000000000000000000000000000001&limit=25
```

Illustrative identity/button fields from two rows; metrics and other card fields
are omitted from this example:

```json
{
  "data": [
    {
      "agentId": "agt_example_base",
      "chainId": "8453",
      "myCopyRunId": "copy_run_example"
    },
    {
      "agentId": "agt_example_ethereum",
      "chainId": "1"
    }
  ],
  "pagination": { "limit": 25 },
  "meta": { "status": "DATA_STATUS_CURRENT" }
}
```

| Row/request state | Frontend behavior |
| --- | --- |
| Connected owner and `myCopyRunId` is present | Show **My copy**. Open the detail using `GET /users/{ownerAddress}/copy-runs/{myCopyRunId}` and the row's chain context. |
| Connected owner and `myCopyRunId` is absent | Show **Copy**, subject to the selected generation's Start availability and normal preparation checks. |
| No connected owner was sent | The association is unknown. Use the disconnected-wallet flow; do not interpret omission as a checked absence of existing runs. |

The ID selects the newest admitted active or closing run for that owner, agent,
and chain, ordered by start time and then run ID for ties. Selection is across
the agent's generations; this is one shortcut, not the full set of historical
runs or every row in the Open tab.
Stopped, closed, and non-admitted runs do not qualify. There is no additional
copy-status field on the card; read the selected run for its current status and
actions. An absent ID is not proof that the wallet has never copied the agent,
and it is not permission to start copying.

Use the lowercase owner address in the leaderboard cache key along with chain,
filters, and sort. On wallet switch/disconnect, discard the previous owner's
rows and cursor, cancel or ignore in-flight responses for that owner, and fetch
page one again. The backend cursor is bound to the normalized owner. Copy-run
association is looked up on each page request, so it can change while the metric
ordering remains pinned. Refresh the leaderboard after Start or Stop changes.

Keep My Copies independent of public leaderboard membership. Hidden agents can
be absent here while their existing copy runs remain readable; use owner routes
and `agentSnapshot` as described in [Visibility and existing copy runs](#visibility-and-existing-copy-runs).

### Agent profile, performance, and positions

| Method | Path                                              | Parameters                                                                    | `data`                         |
| ------ | ------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------ |
| GET    | `/agents/{agentId}`                               | Path: `agentId`                                                               | `AgentProfile`                 |
| GET    | `/agents/{agentId}/stats`                         | `window?`                                                                     | `AgentMetrics`                 |
| GET    | `/agents/{agentId}/performance`                   | `series?`, `window?`, `interval?`, `cursor?`, `limit?`                        | `PerformancePoint[]`           |
| GET    | `/agents/{agentId}/action-logs`                   | `leaderPositionId?`, `type?`, `groupBy?`, `from?`, `to?`, `cursor?`, `limit?` | `AgentActionLogSessionGroup[]` |
| GET    | `/agents/{agentId}/positions`                     | `view?`, `token?`, `cursor?`, `limit?`, `sortBy?`, `sortOrder?`               | `AgentPositionSummary[]`       |
| GET    | `/agents/{agentId}/positions/{positionId}`        | Path: `agentId`, `positionId`                                                 | `AgentPositionSummary`         |
| GET    | `/agents/{agentId}/positions/{positionId}/events` | `generationId?` (required for an ambiguous shared controller), `cursor?`, `limit?` | `PositionEvent[]`              |

`AgentProfile` includes the same generation-scoped Start availability and fee
arrays as `AgentCard`. Position-event selection and cursor rules are described
under [Position-event pagination and retirement](#position-event-pagination-and-retirement).

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

The current public API reads the applied local aggregate configuration, not a
request-time operator lookup. A registered leader with zero tradable tokens is
an explicit empty configuration; a deleted leader is absent from the next
completed target. Partial/not-ready imports do not authorize deletion. Follow
the returned trade-token and metadata quality groups; don't infer a new client
field, tombstone object, or a complete empty list from unavailable evidence.

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
  inventory, it equals net quote received plus current remaining value minus
  original quote spent. Actual fee costs and received cashback are already
  included; estimated cashback is excluded. Closed positions use canonical
  realized P&L. Do not reconstruct it or subtract Net Fees again in the client.
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

A `PerformancePoint` contains `timestamp`, `series`, `interval`,
status-bearing `valueUsd` and `valuePct`, and optional
`tradeId`/`positionId`/`token` context. For cumulative Total P&L, `valuePct` is
the time-weighted chart return, not `roiPct`. Use each value's own status.
For per-trade P&L, the trade and position identifiers are suitable for opening
the related detail, while the point timestamp remains the chart order key.

#### Entry and exit execution prices

Use the existing valuation objects on both `AgentPositionSummary` and follower
`PositionSummary`:

| UI value | Response field | Rendering rule |
| --- | --- | --- |
| Entry price | `entryValuation.priceUsd` | Display the server's execution price with the valuation's `DATA_STATUS_*`. |
| Exit price | `exitValuation.priceUsd` | Render for a closed position when its valuation status permits. Partial sells alone do not make it final. |
| Current market price | `currentValuation.priceUsd` | Independent current mark; it does not replace either execution price. |

There are no new top-level `entryPriceUsd` or `exitPriceUsd` fields. Execution
prices are materialized in the backend and can be corrected by background
replay. Available execution valuations use `priceSource: "operator_execution"`;
their timestamps describe execution evidence, not the time the page was loaded.
Keep rendering their individual statuses while retained data catches up.

Amounts are normalized using each token's decimals before calculating ratios:

- Leader entry uses opening quote spent divided by base bought. Leader exit
  uses total quote received divided by total base sold.
- Follower entry uses opening quote spent divided by **gross base bought**,
  including the upfront-fee portion. Dividing by only the net base delivered to
  the follower incorrectly makes the entry look more expensive.
- Follower exit uses summed **gross quote received / gross base sold** when
  every sell has both gross amounts. Gross base means actual router consumption
  after unused input is returned. If a historical sell lacks either gross
  amount, the backend consistently uses net amounts for the whole position's
  exit price; it does not mix gross and net events in one ratio.

Render the backend result rather than implementing those ratios in the UI.
`exitValuation.valueUsd` still represents actual net quote received, while its
unit price can use gross execution amounts. Fees, actual rebates, realized P&L,
and received quantities retain their existing accounting. Do not reconstruct
P&L from the corrected entry/exit prices or subtract fees a second time.

#### Estimated and received rebates

Follower position rows expose separate status-bearing metrics:

| Field | Meaning and label |
| --- | --- |
| `estimatedCashbackUsd` | **Estimated remaining rebate** for unsold inventory. It depends on the effective account policy and selected price, and is not guaranteed proceeds. |
| `cashbackReceivedUsd` | **Received rebate** from canonical settled events. It can be nonzero after a partial sell while an estimate remains for the unsold balance. |

On a closed position, the remaining estimate is
`METRIC_STATUS_NOT_APPLICABLE`; use `cashbackReceivedUsd` for the actual rebate.
Do not carry the last open-position estimate forward as a settled amount or
sum it into the received field. A valid zero estimate is different from
`METRIC_STATUS_UNAVAILABLE`; display stale estimates with a stale indication.

The beta-5 formula-3 cap is the maximum **refundable** share of the upfront fee.
For an illustrative six-decimal quote-token settlement with an upfront quote
portion of `0.124633`, a 97% cap and no profit fee produce `0.120894` cashback
and `0.003739` retained protocol fee. These are separate amounts. The old
estimate applied formula-2 semantics to beta-5 and reversed them in this
example. Formula 2 remains correct for its supported legacy generation. Market
movement and execution can still make an estimate differ from the settlement.

Use the returned metrics, not an agent-wide advertised fee or a hard-coded
formula. Account policy details come from the [account-effective cashback
policy](#account-effective-cashback-policy). For run-level displays, History-list
`rebatesUsd` contains actual closed-position rebates, while detail
`feeBreakdown.rebatesUsd` combines actual closed-position and estimated open
rebates. Those fields are not interchangeable.

### Owner dashboard and copy runs

`CopyRunListItem` and `CopyRunSummary` expose optional `generationId` for the
account's canonical creation generation. Keep it with the run's identity and
display it independently of lifecycle or current Start choices. Missing
provenance is unknown; `agentSnapshot` does not supply a replacement generation.

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
OWNER_COPY_RUN_SORT_FIELD_ROI_PCT
OWNER_COPY_RUN_SORT_FIELD_AGENT_WIN_RATE
OWNER_COPY_RUN_SORT_FIELD_AGENT_LIFETIME_VOLUME
OWNER_COPY_RUN_SORT_FIELD_VOLUME
OWNER_COPY_RUN_SORT_FIELD_CAPITAL_IN
OWNER_COPY_RUN_SORT_FIELD_CURRENT_BALANCE
OWNER_COPY_RUN_SORT_FIELD_CLOSED_TRADES
OWNER_COPY_RUN_SORT_FIELD_REALIZED_PNL
OWNER_COPY_RUN_SORT_FIELD_FEE_PAID
OWNER_COPY_RUN_SORT_FIELD_REBATES
```

`OWNER_COPY_RUN_SORT_FIELD_ROI_PCT` orders by the copy run's `roiPct` and is
available in both Open and History, in either direction. Unavailable values
sort last. ROI cursors retain the price generations used on the first page,
so a background price refresh does not move rows between pages. Restart from
the first page if the cursor expires or reports a changed target.
`OWNER_COPY_RUN_SORT_FIELD_AGENT_WIN_RATE` still orders by the
agent's win rate, even though copy-run snapshots omit that metric. There is
no copy-run win-rate sort field. Do not label the agent sort as a sort of
`copyRunWinRatePct` or reorder a cursor page locally.

`OWNER_COPY_VIEW_OPEN` and `OWNER_COPY_VIEW_HISTORY` are server-defined product
universes, not direct aliases for one `CopyRunStatus`. Always pass the selected
view and render the returned `status`. Do not filter the page client-side by
status.

`OPEN` contains admitted active/closing runs and stopped runs whose closure is
not yet proven. A stopped run is exposed as `COPY_RUN_STATUS_CLOSING` until
either its covered Stop has no residual position work or full withdrawal has
valid zero-balance evidence, with no relevant active repair. It then becomes
`COPY_RUN_STATUS_CLOSED` and enters `HISTORY`, even if withdrawn positions
remain open in the operator records. Readable historical-generation terminal
runs follow the same closure gate. Active historical-generation runs remain
outside both lists, although direct lookup can remain readable.

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
| `sortBy`          | Open defaults to `OWNER_COPY_RUN_SORT_FIELD_STARTED_AT`; History defaults to `OWNER_COPY_RUN_SORT_FIELD_STOPPED_AT`. `CURRENT_BALANCE`, `CLOSED_TRADES`, `REALIZED_PNL`, `FEE_PAID`, and `REBATES` are History-only; Open requests using them fail validation. |
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
- `agentSnapshot`. Within copy-run responses, `metrics` omits the agent's
  `roiPct` and `winRatePct` and retains `lifetimeVolumeUsd`.
- `copyRunVolumeUsd`, this run's lifetime executed buy-plus-sell quote volume.
  Deposits, withdrawals, skipped trades, and agent volume do not contribute.
  Existing runs populate in the background after deployment. Respect its
  `DecimalMetric.status` while unavailable; do not fall back to agent volume
  or zero. Refresh the list or detail normally.
- `roiPct`, the copy run's lifetime ROI. See
  [ROI and chart return](#roi-and-chart-return).
- `copyRunWinRatePct` and `copyRunClassifiedClosedPositionCount`, based on this
  run's classified closed follower positions. Wins form the numerator;
  wins, losses, and break-even positions form the denominator. Use the metric
  status when the denominator is unavailable or no positions are classified.
- capital, portfolio-value, P&L, position-count, and ROI metrics
- `currentBalanceUsd`, for History account value and Open/Closing portfolio
  value when current. Stale, expired, or incomplete inputs make this metric
  `UNAVAILABLE`. Keep the value unavailable while indexing catches up and
  refresh normally; unrelated available metrics can still render. This does
  not mean the wallet is empty or that an earlier transaction failed.
- `totalPnlUsd`, `totalPnlPct`, and `unrealizedPnlUsd`, each with its own
  metric status
- `totalPnlUsd` is realized plus unrealized P&L; fees and rebates are already
  included in the net execution economics. Don't subtract Net Fees again.
  After a proven in-kind withdrawal, Total P&L uses the historical valuation
  at the first Stop, once that chart generation is published; it does not
  follow later live prices for the withdrawn holdings.
  `totalPnlPct` uses the same cash-flow-neutral time-weighted-return semantics
  as the cumulative-total-PnL chart. Don't recompute either metric in the
  client.
- `capitalInUsd`, cumulative opening allocation, deposits, and top-ups.
- `capitalOutUsd`, the **Amount Out** display. Under PR #102, a proven closed
  run can include quote still held before withdrawal. See
  [Closed-run Amount Out](#closed-run-amount-out). Do not subtract it from
  Capital In to derive the ROI denominator.
- `capitalInProjectionStatus`. `READY` means `capitalInUsd` represents the
  completed generation. `SYNCING` can carry a server-published `CURRENT`
  provisional candidate or a prior same-identity `STALE` value. Render using
  the metric status and capital-group finality, with a syncing/provisional or
  stale indication; don't label either as the completed generation.
  `UNAVAILABLE` means source, identity, or lineage can't authorize a value and
  must never be converted to zero.
- `addCapitalAvailability`, `stopCopyAvailability`,
  `withdrawQuoteAvailability`, `withdrawTokensAvailability`
- optional `stopCopyProgress`. It is present only when the API can prove the
  newest safely covered Stop intent. `pendingPositionCount` includes both
  selected positions whose child action hasn't been indexed and indexed child
  actions that aren't terminal yet. `status` can be `CURRENT` or `STALE`; an
  omitted object means “progress not proven,” never zero progress. Within a
  present object, treat an omitted JSON count as `0`; the gateway omits scalar
  zero values.

`CopyRunSummary` is the detail shape. It additionally contains:

- `portfolioPnlUsd`, the closed-position-only Portfolio P&L headline. Partial
  realized P&L from positions that remain open stays in charts and ROI inputs.
- `feeBreakdown.feeChargedUsd`, `feeBreakdown.rebatesUsd`, and
  `feeBreakdown.netFeesUsd`. Use `FIELD_GROUP_FEES` for the breakdown's group
  quality and each metric's own status for rendering.

`CopyRunListItem` omits `portfolioPnlUsd` and `feeBreakdown`. Fetch
`GetOwnerCopyRun` when the selected-run screen needs them. The list instead
adds `netRealizedPnlUsd` (closed-position-only), `feeChargedUsd` (upfront fees),
and `rebatesUsd` (actual closed-position rebates). Render their own statuses;
list `rebatesUsd` is not the detail breakdown's actual-plus-estimated value.
Both shapes remove
and reserve `realizedPnlUsd`, `flatFeesCapturedUsd`, `cashbackReceivedUsd`,
`netFeeCostUsd`, `estimatedCashbackPendingUsd`, and `observedCapitalInUsd`.
Regenerate clients and don't use legacy accessors or synthesize replacements.

Neither shape contains the action's `receiptResult` or submitted `status`.
Use `actions:status` for transaction success, then render fresh list/detail
responses with their metric statuses, `meta.fieldQualities`, and
`meta.pendingActions`. The backend preserves pending effects across reloads.
Discard cached responses and requests started before verified success; they
cannot establish the new action's adoption.

#### Closed-run Amount Out

Under PR #102, both `CopyRunListItem.capitalOutUsd` and
`CopyRunSummary.capitalOutUsd` include quote still held when the server proves
the run is `COPY_RUN_STATUS_CLOSED`, has zero open and leftover positions, and
has no in-kind withdrawal. The backend derives this amount from canonical
deposits plus finalized net realized P&L, covering closure. Other runs continue
to expose recorded withdrawals and returned capital.

Render the metric when `CURRENT` or `STALE`, preserving its qualifier. Closure
alone does not guarantee a numeric value: missing or invalidated accounting
can still make Amount Out unavailable. Do not calculate it from wallet balances
or add a withdrawal to the returned value.

For example, a quote-only run with $10 deposited and net realized P&L of
-$2.677224 shows Amount Out of $7.322776 before withdrawal. Withdrawing $3 and
then the remaining quote does not increase that Amount Out. These are display
semantics, not proof that any funds reached the owner's wallet.

After an action, refresh the copy-run response for its Amount Out card.
`actions:status` returns `data.display.capitalOutUsd` from actual canonical
withdrawals, so it can differ from the closed-run card. Keep it associated with
the submitted action rather than overwriting the card with it. Continue using
receipt/status evidence to determine whether a withdrawal completed.

#### History after Stop or withdrawal

Show a verified Stop or withdrawal result without waiting for the run to move
to History. Call success and tab membership are separate: a Stop can still
have positions exiting, and a withdrawal batch can leave tokens behind.

Refresh the run detail and Open/History lists after the action. Let the returned
view and run status determine tab membership. Neither `receiptResult`, display
`READY`, nor an elapsed timeout should move a run locally. Keep following
[submitted-action status](#submitted-action-status) for the call and any
returned Stop progress for its exits.

Financial fields such as Total Return can remain unavailable after the run
appears in History. Render each available metric independently.

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

The deployed beta-5 generation advertises `cashbackFormulaVersion = 3`; the
supported legacy generation retains version `2`. Unsupported
historical-generation policy can legitimately omit it. Formula identity is
independent of scope and selection version. Do not infer it from a generation
name or treat all generations as version 3. Render the server-computed estimates
and actual rebates using [Estimated and received rebates](#estimated-and-received-rebates).

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

The protobuf `ActivityRow.detail` oneof holds at most one typed detail object:
`copyLifecycle`, `position`, `capital`, `fee`, or `execution`. In HTTP JSON,
that object appears directly on the row, such as `row.capital`; there is no
`row.detail` wrapper. Alert rows can carry `alert` context without a detail
object. PR #102 populates `capital` for capital alerts with proven amounts.

The detail variant has this shape:

| Variant         | Used for                       | Important fields                                                                                                                                                                               |
| --------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copyLifecycle` | Copy started/stopped           | `eventId`, `eventType`, optional `beforeStatus`, `afterStatus`; Start Copy can also include `amountRaw`, `tokenAddress`, and `token` for its canonical opening allocation. Render a missing amount as unknown, not zero. |
| `position`      | Open/close/reduce position     | Tokens, raw base/quote accounting, settlement value, realized P&L, fee, cashback                                                                                                               |
| `capital`       | Deposit/top-up/withdraw/return | `movementType`, exact raw amount, token, USD metric                                                                                                                                            |
| `fee`           | Flat fee/cashback              | Exact raw amount, token, USD metric                                                                                                                                                            |
| `execution`     | Skip/exit/failure lifecycle    | Execution/action identifiers and statuses, public error, config index/rate/deadline; optional `baseTokenAddress`, `quoteTokenAddress`, `baseToken`, and `quoteToken` for token identity. Attempt amounts are absent when no authoritative follower amount was recorded; never infer them from leader amounts. |

The top-level `summary` is display text. Business logic should switch on the
typed `type` and oneof detail, not parse the summary.

For Smart Wallet Activity and the Open Copies alerts feed, use one cursor chain
per exact `type`, product `group`, or activity surface. Render capital actions
distinctly. The public copy-run log and alert-feed surfaces normalize returned
capital to Capital withdrawn; do not show a separate Capital returned type on
those surfaces.

#### Capital amounts in Alert Feed

Under PR #102, capital rows returned with
`activitySurface=ACTIVITY_SURFACE_ALERT_FEED` include the existing `capital`
detail when the exact quote amount and token identity are known:

| JSON field | Frontend behavior |
| --- | --- |
| `capital.amountRaw` | Exact token amount as a string. Use decimal-safe arithmetic and `capital.token.decimals` for display; never convert the raw integer to a JavaScript `number`. |
| `capital.tokenAddress`, `capital.token` | Token identity and available metadata. Missing decimals do not make the raw amount zero; retain an unavailable formatted amount until metadata is available. |
| `capital.valueUsd` | Optional renderable value according to its `DecimalMetric.status`. Missing metadata can leave USD unavailable while the raw amount remains known. |
| `capital.movementType` | Canonical `deposit`, `top_up`, `withdrawal`, or `returned_capital`. Continue using the row's public category/subtype for product labels; returned capital is displayed as Capital withdrawn. |
| `alert.user.quoteAmountRaw` | The same canonical amount in the existing alert outcome context. It is not an additional movement to add to `capital.amountRaw`. |

Render amounts without parsing `summary` or fallback text. A missing `capital`
object on older servers or incomplete rows is unknown, not a zero deposit or
withdrawal. Keep the row and its `alert.alertId` through refreshes.

Replace each alert from the latest response, including its status, finality,
amounts, and transaction links. A correction or reorg can withdraw earlier
success evidence; remove omitted amounts and links instead of retaining an old
success row. A provisional alert can remain visible with its finality label.
Use `actions:status` to observe the submitted operation independently.

The copy-run log continues to normalize `capital.movementType` to `withdrawal`
for returned capital; the Alert Feed detail preserves `returned_capital`.

App-verified token withdrawals also appear in copy-run logs and account history
as `ACTIVITY_TYPE_CAPITAL_WITHDRAWN`, with `capital.movementType` set to
`token_withdrawal`. Each nonzero non-quote transfer has its exact `amountRaw`,
token address, and transaction hash. Observe the submitted operation through
`actions:status` so the backend can verify it. These rows become visible after
the matching canonical pause is indexed; an external withdrawal without app
verification does not produce this activity. Reorgs can remove a row, so replace
the log from refreshed results. The token amount does not imply a USD peg:
`capital.valueUsd` is unavailable for these rows. They are separate from quote
withdrawals and do not change `capitalOutUsd`.

Historical coverage is limited: token withdrawals completed before this
feature are not automatically added, and external withdrawals remain outside
this app-verified log. An absent row is not proof that no withdrawal occurred.
Refresh after status observation, but do not resubmit a transaction to create
its activity row. Existing Start Copy and quote-funding records do not require
the frontend to replay any action.

#### Skipped-trade links

Copy-run activity uses the follower position's `tradeId` consistently for
executed and skipped trades. A skipped buy that never opened a follower
position has no `tradeId`, `userPositionId`, or `followerPositionId`. Do not link
such a row to an agent trade through the top-level `tradeId`. A canonical
follower position can supply the link later when its facts arrive.

`txHash` remains optional follower execution evidence. Local skips that never
submitted an execution have no hash. Hide only the transaction link when it is
missing; preserve the skipped row and any trade link. A present execution hash
does not turn a skipped outcome into a successful trade. Never substitute a
leader transaction hash for a missing follower hash.

Links can appear when parent facts arrive or disappear after a reorg. Replace
them from refreshed server rows. Alert Feed keeps its separate context shape:
use `alert.leader.leaderPositionId` for an available leader-trade link and the
explicitly named leader, attempted-user, or canonical-follower hash for the
corresponding explorer link. PR #102 does not add top-level `tradeId` to alert
rows.

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

### Copy accounts

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
fee/cashback totals, advisory Add/Stop/Withdraw availability, and optional
`generationId`. The generation belongs to this account; it does not change when
another generation becomes available for new Start requests.

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

#### Refresh token balances with RPC

After `actions:status` verifies a receipt effect, you can use the UI's chain RPC client
to read `balanceOf(copyAccount)` for the affected ERC-20 tokens. This can update
token quantities while backend portfolio totals are syncing.

- Read the Smart Wallet (`copyAccount`), not the connected owner's wallet.
- Use a fresh block at least as recent as the observed receipt. Read related
  token balances at one block when displaying them together.
- Keep raw quantities as integers or strings and format them using matching
  token decimals. A failed read is unavailable; a successful zero is zero.
- Batch affected tokens and reuse the client's request deduplication. Refresh
  after the action, changed receipt inclusion, or reopening the view rather
  than polling the whole wallet continuously.
- Treat these quantities as provisional. Use `actions:status` to verify the
  action and each ordinary GET's quality to render its data; a balance does not
  establish action success.

Continue using wallet inventory to discover held tokens and published reads
for USD totals. Do not add receipt deltas to balances or combine new quantities
with older prices to invent a portfolio total. A failed RPC read leaves the
balance syncing or unavailable without changing verified call success.

#### Current wallet inventory

Use the following non-paginated endpoint for the **Remaining in Wallet** card
on both active and stopped copy runs:

```http
GET /copy-accounts/{chainId}/{copyAccount}/wallet-inventory
```

The endpoint returns the current token rows held by the Smart Wallet. Under
PR #102, its server-calculated USD total sums available valuations across the
complete inventory. It does not add a separate open-position valuation and is
not a replacement for `portfolioValueUsd`.

After [API PR #110](https://github.com/KyberNetwork/copy-trade-api/pull/110)
is deployed, wallet reads can return HTTP 409 (gRPC `code: 10`, `ABORTED`):
`"Wallet balances are updating. Please retry shortly."` Keep the wallet in a
syncing state and retry with bounded backoff. Do not replace balances or totals
with zero. This applies to paginated wallet balances too, and responses remain
`no-store`.

| Field                     | Frontend behavior                                                                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`                    | Render the returned wallet-token rows. Each row uses the existing `WalletBalanceRow` contract.                                                                                                  |
| `walletInventoryValueUsd` | Use this `DecimalMetric` as the **Remaining in Wallet** total. Under PR #102 it sums available valuations; an unpriced row does not suppress it. Do not calculate another total from `data`. |
| `complete`                | A value of `true` means the bounded operator request proved that all wallet rows fit in one response. A value of `false` means the rows may be rendered, but they are not a complete inventory. |
| `pinnedStableBalance`     | Render the stable row separately only when its status is `PRESENT`. The API already counts it exactly once in `walletInventoryValueUsd`.                                                        |
| `meta`                    | Apply the normal response metadata rules independently from the total metric and row-level freshness.                                                                                           |

An abbreviated PR #102 response with complete inventory and one unpriced
token has the following shape. The unpriced row stays unavailable while the
server subtotal includes the other token and the pinned stable balance:

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
    },
    {
      "chainId": "8453",
      "copyAccount": "0x1111111111111111111111111111111111111111",
      "tokenAddress": "0x4444444444444444444444444444444444444444",
      "amountDecimal": "0.1",
      "freshnessStatus": "fresh",
      "currentValuation": {
        "status": "DATA_STATUS_UNAVAILABLE"
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
4. Preserve an explicit value of `"0"`. Under PR #102 it can mean that a
   complete inventory has no available valuations. It does not establish an
   empty wallet or zero token prices.
5. Do not add open-position valuation or `availableBalanceUsd`. Those fields
   answer different product questions.
6. Treat a non-`PRESENT` pinned stable status as unavailable, not zero. Under
   PR #102, missing token prices alone do not make the total unavailable.
   Keep those token USD rows as N/A, show the returned subtotal, and indicate
   that unpriced tokens are excluded. `complete=true` proves inventory
   coverage, not complete pricing; `CURRENT` is a freshness status, not proof
   that every token is priced.
7. Preserve the server's stale status and `asOf`. The timestamp reflects the
   oldest contributing balance/valuation evidence, including balance evidence
   for unpriced rows. Do not infer a zero token price or override an available
   total because response-level metadata is unavailable.

For example, $7.32 of valued stablecoin plus an unpriced CASHCAT balance shows
a $7.32 subtotal and N/A on CASHCAT. The API attempts missing prices on demand
for this route; no frontend price-service request is needed. A provider miss
can still leave the token unavailable. Use ordinary refresh behavior and each
metric's returned status.

Use the cursor-paginated `/balances` endpoint only when the UI needs a
page-by-page asset browser. It cannot be used to derive a stable account-wide
total because pages are independent current reads.

Pending obligations are current operator authority, while `skippedAt` and
public error fields are optional aggregate display evidence. Never size a sell
from the error text or a locally accumulated ratio. Use the exact
`currentRatioRaw` values and current FIFO count returned immediately before
preparation.

## Admin agent registry (VPN only)

Use these endpoints for an internal agent-management UI. They manage the
aggregate registry and display metadata. Registering an agent here does not
deploy a leader contract, register it on-chain, or submit a transaction.

### Admin access and paths

The access boundary is the VPN-only ingress. No application API key, bearer
token, wallet signature, or wallet session is required. The admin routes must
remain unavailable through an unrestricted public ingress.

Paths below are relative to the configured admin API base. The generated
OpenAPI uses `basePath: /api/v1`, so the service HTTP path is
`/api/v1/admin/agents`. If the VPN ingress exposes `/admin/agents` directly, use
its configured prefix rewrite. Set `ADMIN_API_BASE` to the VPN-only base for
the environment, including any API prefix; do not assume the public base is
the admin entry point.

| Method | Path | Purpose | Success response |
| --- | --- | --- | --- |
| GET | `/admin/agents` | List registry entries with optional filters. | `200`, `{ "data": [...], "pagination": {...} }` |
| POST | `/admin/agents` | Register an immutable identity and initial details. | `200`, `{ "data": {...}, "changed": true }` |
| PATCH | `/admin/agents/{agentId}` | Update selected details or listing state. | `200`, `{ "data": {...}, "changed": boolean }` |

There is no admin single-agent GET, DELETE, or bulk-update operation. All
admin responses, including errors, are no-store. Refresh the registry list
after mutations rather than reusing a cached public agent list.

### List registered agents

`GET /admin/agents` includes entries regardless of operational activation,
public listing, or metric readiness. New agents can appear here before their
public metrics have synchronized.

| Query field | Rules |
| --- | --- |
| `chainId` | Optional positive chain ID; omit for all registered chains. |
| `listingState` | Optional symbolic enum from the visibility table below. Omitted or `ADMIN_AGENT_LISTING_STATE_UNSPECIFIED` means all states. |
| `limit` | Integer `1..100`; omitted or `0` uses `50`. |
| `cursor` | Opaque signed `pagination.nextCursor` from the preceding response; at most 4,096 bytes. |

Results are ordered by `agentId` ascending. Keep the same filters when using a
cursor. Restart from the first page after changing a filter or receiving an
invalid/expired cursor. Admin cursors cannot be used on public agent routes;
there are no search or client-selected sort parameters on this endpoint.

```sh
curl --get "${ADMIN_API_BASE}/admin/agents" \
  --data-urlencode 'chainId=8453' \
  --data-urlencode 'listingState=ADMIN_AGENT_LISTING_STATE_HIDDEN' \
  --data-urlencode 'limit=50'
```

### Register a new agent

`POST /admin/agents` requires `agentId`, `chainId`, `leaderAddress`, `details`,
and `details.listingState`. The chain must already be configured and enabled.
The identity must be new: both the agent ID and the chain/leader pair are
unique. Registration is not an upsert.

- `agentId` must match `^agt_[a-zA-Z0-9_-]+$`. Choose a stable ID and preserve it.
- `chainId` is a positive protobuf `int64`; use a decimal string in JSON.
- `leaderAddress` must match `^0x[0-9a-f]{40}$`; use the actual leader address
  on the selected chain, not a controller or follower account.
- Choose `LISTED` to publish or `HIDDEN` to stage the new registry entry. New
  rows are operationally active (`isActive: true`), but public readiness still
  depends on normal source synchronization and action availability.

Example body for `POST /admin/agents` (synthetic identity and metadata):

```json
{
  "agentId": "agt_base_example",
  "chainId": "8453",
  "leaderAddress": "0x1111111111111111111111111111111111111111",
  "details": {
    "displayName": "Example Agent",
    "bio": "Agent description for the management UI.",
    "isVerified": false,
    "tags": ["example"],
    "listingState": "ADMIN_AGENT_LISTING_STATE_HIDDEN"
  }
}
```

Creation returns the registry entry immediately and schedules background
metadata/metric work. Success does not establish that Start Copy is ready.
Check the normal public availability fields after publishing the agent.
A repeated registration returns `409`, even if its payload is identical; if
the first response was lost, inspect the admin inventory before retrying.

### Edit details and visibility

`PATCH /admin/agents/{agentId}` requires a `details` object and a nonempty
`updateMask`. Put the identity only in the URL. Sending `agentId`, `chainId`, or
`leaderAddress` anywhere in the JSON body is rejected, even if unchanged.
`isActive`, `listingStateOwner`, `adminManagedFields`, and `updatedAt` are also
not writable through this API.

`updateMask` uses protobuf FieldMask JSON encoding: a **comma-separated string
of lower-camel-case paths**, such as
`"details.displayName,details.listingState"`. Do not send an array or a
`{"paths": [...]}` object. Protobuf clients use the corresponding snake-case
paths, such as `details.display_name`.

| Mutable `details` field / JSON mask suffix | Validation |
| --- | --- |
| `displayName` | Optional trimmed string, at most 256 UTF-8 bytes. |
| `avatarUrl` | Optional absolute HTTP(S) URL without credentials, at most 2,048 bytes. |
| `bio` | Optional trimmed string, at most 4,096 bytes. |
| `modelName` | Optional trimmed string, at most 256 bytes. |
| `isVerified` | Optional boolean; explicit `false` differs from clearing the value. |
| `strategyExecutionItems` | At most 64 objects with nonempty, trimmed `label` (64 bytes) and `description` (512 bytes). |
| `badges` | At most 64 unique, nonempty, trimmed strings, each at most 64 bytes. |
| `tags` | Same limits as `badges`; order is preserved. |
| `listingState` | One of the three explicit states below; cannot be cleared or set to `UNSPECIFIED`. |

Only masked fields change. Unmasked fields remain unchanged even if included
in `details`. Selecting a nullable text field and sending `""` or omitting it
clears its override value. Selecting `isVerified` and omitting it clears its
optional value; send `false` to explicitly mark it unverified. Masked arrays
replace the entire list; `[]` or omission clears it. Clearing metadata does
not relinquish admin ownership of that field. Do not send duplicate, wildcard,
identity, or unsupported paths.

Example body for `PATCH /admin/agents/agt_base_example`:

```json
{
  "details": {
    "displayName": "Updated Example Agent",
    "bio": "",
    "tags": [],
    "isVerified": false
  },
  "updateMask": "details.displayName,details.bio,details.tags,details.isVerified"
}
```

Hide an agent:

```json
{
  "details": {
    "listingState": "ADMIN_AGENT_LISTING_STATE_HIDDEN"
  },
  "updateMask": "details.listingState"
}
```

To publish it again, send the same mask with
`ADMIN_AGENT_LISTING_STATE_LISTED`.

### Visibility and existing copy runs

| `details.listingState` | Behavior |
| --- | --- |
| `ADMIN_AGENT_LISTING_STATE_LISTED` | Eligible for public discovery, subject to activation, chain, and endpoint-specific readiness rules. |
| `ADMIN_AGENT_LISTING_STATE_SUSPENDED` | Excluded from public agent discovery and direct public agent reads. This state alone does not pause on-chain copying. |
| `ADMIN_AGENT_LISTING_STATE_HIDDEN` | Excluded from public agent discovery and direct public agent reads. Existing user copy-run data remains available. |

Listing state is independent of `isActive`. Neither hiding nor suspending an
agent deletes copy runs, stops a follower account, or changes ownership.
Existing owner-scoped copy-run reads, positions, history, and supported
preparation routes remain usable, subject to their normal action checks.

For My Copies and copy-run details, render the returned `agentSnapshot` and
copy-run fields. **Do not filter user copy runs by membership in `GET /agents`
or require `GET /agents/{agentId}` to succeed before showing them.** A public
agent `404` after hiding is expected and must not remove a copy run or disable
its recovery controls. Use copy-run/account-specific availability and
preparation routes for existing actions.

### Admin response fields

List responses contain `data: AdminAgent[]` and `pagination`; mutation
responses contain `data: AdminAgent` and `changed`. These envelopes do not
include public-read `meta` or transaction-preparation fields. Normalize
omitted empty arrays to `[]`; an omitted `changed` or `hasMore` means `false`.

| `AdminAgent` field | Meaning |
| --- | --- |
| `agentId`, `chainId`, `leaderAddress` | Immutable registry identity; `chainId` is a decimal string. |
| `details` | Current metadata and explicit listing state. Optional scalar metadata can be absent. |
| `isActive` | Operational activation, separate from visibility; read-only here. |
| `listingStateOwner` | `ADMIN_AGENT_LISTING_STATE_OWNER_CONFIG` or `ADMIN_AGENT_LISTING_STATE_OWNER_ADMIN`. An admin listing override survives later configuration reconciliation. |
| `adminManagedFields` | Admin-owned field names in snake case, without the `details.` prefix, for example `display_name` and `listing_state`. Configuration/enrichment must not overwrite these overrides. |
| `updatedAt` | Registry update timestamp in RFC3339 format. |

`changed` includes changes to managed-field ownership. A PATCH that repeats a
displayed value can therefore return `true` when first taking admin ownership;
a subsequent identical update returns `false`. These APIs do not expose a
reset-to-config ownership operation.

Example mutation response (synthetic):

```json
{
  "data": {
    "agentId": "agt_base_example",
    "chainId": "8453",
    "leaderAddress": "0x1111111111111111111111111111111111111111",
    "details": {
      "displayName": "Example Agent",
      "listingState": "ADMIN_AGENT_LISTING_STATE_HIDDEN"
    },
    "isActive": true,
    "adminManagedFields": ["display_name", "listing_state"],
    "updatedAt": "2026-09-25T07:00:00Z",
    "listingStateOwner": "ADMIN_AGENT_LISTING_STATE_OWNER_ADMIN"
  },
  "changed": true
}
```

### Admin errors

| HTTP status | Typical cause / client behavior |
| --- | --- |
| `400` | Invalid identity, disabled/unconfigured registration chain, invalid metadata/enum, missing or invalid mask, immutable-field edit, or invalid/expired cursor. Correct the request; restart invalid pagination without a cursor. |
| `404` | PATCH target is not registered. Refresh admin inventory. A `404` on the public host may instead indicate that its ingress does not expose admin routes. |
| `409` | Agent ID or chain/leader identity already exists. Inspect inventory and use PATCH for mutable details. |
| `503` | Admin service unavailable. Retry with backoff; for a registration whose outcome is uncertain, check inventory first. |

Errors use the common gRPC-gateway error body described under
[Error handling](#error-handling). VPN/ingress denials occur before the
application and may use a different response body.

## Transaction preparation

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
| `PENDING`             | No                   | Follow `guidance` to review missing information or retry preparation after `guidance.retryAfterMs`, when present. |
| `UNAVAILABLE`         | No                   | The action cannot currently execute. Render `reason` and `guidance`, including any recovery controls; do not submit anything. |

Prepared call kinds:

```text
PREPARED_CALL_KIND_START_COPY_CREATE
PREPARED_CALL_KIND_START_COPY_FUND
PREPARED_CALL_KIND_ADD_CAPITAL
PREPARED_CALL_KIND_STOP_COPY
PREPARED_CALL_KIND_WITHDRAW_QUOTE
PREPARED_CALL_KIND_WITHDRAW_TOKENS
PREPARED_CALL_KIND_MANUAL_SELL
PREPARED_CALL_KIND_CLOSE_POSITION
```

The response must contain the call kind expected for the route/stage. A
mismatch is a client safety error: do not submit the call.

Advisory availability fields on read responses are suitable for buttons and
empty states, but the corresponding preparation response is authoritative.

### Prepared action fields

| Field                       | Meaning                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `status`                    | Typed outcome described above.                                                                                   |
| `chainId`                   | Chain on which the wallet call belongs.                                                                          |
| `generationId`              | Required generation identity. Must match the selected Start generation, or the existing account's known generation; never replace it with a creation default. |
| `expectedAccount`           | Account expected to send the outer transaction. Compare it with the connected wallet/account.                    |
| `copyAccount`               | Optional Smart Wallet identity. It is absent only before a Start Copy account exists; it is not the call target. |
| `preparedAt`                | Time the preparation was produced.                                                                               |
| `reprepareAfter`            | Last validity boundary for submitting this preparation. Obtain a fresh preparation before submitting after this time. An already submitted hash keeps its original status context. |
| `liquidationConfigDeadline` | Optional action-specific deadline. Do not submit after it.                                                       |
| `call`                      | Exact reviewed EVM inner call, only when executable.                                                             |
| `reason`                    | Stable typed reason for non-ready/advisory state.                                                                |
| `warnings[]`                | Allowlisted render-only qualifications. Warnings do not authorize changing calldata.                             |
| `displayEnrichment`         | Required render-only enrichment outcome. It never changes action readiness, call validity, or calldata.          |
| `evidence`                  | Safely covered fact boundary when required and fresh action block H. Direct canonical target proof does not fabricate indexed coverage. |
| `guidance`                  | Bounded explanation, optional retry delay, and actionable next steps. |
| `statusContext`             | Present for each executable call. Preserve with the EVM hash for observational status; it carries no calldata, permit, or signature. |
| one preview                 | Exactly one of `startCopy`, `addCapital`, `stopCopy`, `withdrawQuote`, `withdrawTokens`, `manualSell`, or `closePosition`. |

`displayEnrichment.status` is `NOT_APPLICABLE`, `COMPLETE`, or `UNAVAILABLE`.
An unavailable result includes reason `SOURCE_UNAVAILABLE` or
`BUDGET_EXHAUSTED`. Continue to branch transaction submission on the top-level
prepared-action `status` and `call`: a `READY` action remains executable when
render-only enrichment is unavailable. Degrade only the optional preview UI
and never change the returned call. Its guidance explains the missing display
estimates or token details.

The enrichment summary is not atomic field availability: a current or stale
preview field remains usable even when another field makes the summary
`UNAVAILABLE`. Always inspect each display metric's own status.

#### Action response field rules

JSON uses lower camel case. Default non-optional enums, numeric zeroes, false
booleans, and empty arrays can be omitted. Explicit optional values, such as
`effectiveSlippageBps: 0` or `valueRaw: "0"`, retain their meaning when present.
Use nullish checks (`value == null` or `value ?? fallback`), not truthiness, to
test presence. Keep the saved `statusContext` unchanged; normalize only the
fields used for rendering.

| Response field | Presence and handling |
| --- | --- |
| Preparation `data.status` | Required. Unknown or missing status is an unsupported response; do not open the wallet. |
| Preparation `data.generationId` | Required on all preparation results. Keep it with chain/account identity; reject a missing or mismatched value before submission. |
| Preparation `data.call` and `data.statusContext` | Both are required for `READY` and Start-only `PARTIALLY_COMPLETED`. Neither is available for a non-executable result. Treat an executable response missing either field as invalid. |
| Preparation `data.reason` | Usually omitted for an executable result. Interpret absence as `PREPARED_ACTION_REASON_UNSPECIFIED`, not as evidence of readiness. |
| Preparation `data.failureDetails` | Optional diagnostics for a non-callable `PENDING` or `UNAVAILABLE` result. An omitted `retryable` inside a present object means `false`; it does not disable later user-triggered preparation. |
| Preparation preview | Exactly one action-specific preview. In a blocked result, individual identities, amounts, and quote fields can be absent or unavailable. Do not copy them from an older preparation. |
| `guidance.nextSteps` | Omitted or empty means no suggested controls. It does not mean success or prohibit polling when `retryAfterMs` and the status allow it. |
| `guidance.retryAfterMs` | Omitted means no automatic retry interval is supplied. Do not treat omission as a zero-delay retry. |
| Status `data.transaction.receipt` | Absent when no canonical receipt is established; `UNKNOWN` can have a receipt or omit it. An omitted receipt is not a failed transaction. |
| Status `data.transaction.outcome` | `ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS` or `ACTION_TRANSACTION_RECEIPT_OUTCOME_REVERTED` describes the outer receipt. Absence means unspecified; outer success alone does not prove the requested action succeeded. |
| Status `data.transaction.safeBlockNumber` | Decimal string when supplied. It can be `"0"` or absent when evidence is unavailable. It is not a frontend confirmation target. |
| Status `data.transaction.verifiedActor` | Optional. Absence means the response does not provide an independently verified actor. Do not infer it from the request owner. |
| Status `data.result` | Present only for `SUCCEEDED`. Replace the latest observation as a whole; never merge an old result into a newer response that omits it. |
| Status `data.receiptResult` | Optional verified effects for receipt-first mode. Show provisional call success and allow dialog dismissal when present. It contains no cumulative totals or permission to submit another call. Replace it when a later poll omits or changes it; a current `SUCCEEDED`/`result` remains valid. |
| Read `meta.pendingActions` and `meta.fieldQualities` | Ordinary GETs report pending effects and data quality. Follow [Related-read status](#related-read-status); no `actions:status.readiness[]` handling is required. |
| Status `data.display` | Added by the submitted-action display contract on normal status responses; absent on older servers and request-error envelopes. Missing or unknown display readiness proves nothing and must not reuse a prior `READY`. |
| Status `data.display.status` | `SUBMITTED_ACTION_DISPLAY_STATUS_PENDING`, `SUBMITTED_ACTION_DISPLAY_STATUS_READY`, or `SUBMITTED_ACTION_DISPLAY_STATUS_SYNCING`. Independent of `data.status`; inspect both. An omitted or `UNSPECIFIED` value is not ready. |
| Status `data.display.copyRunId`, `readOwnerAddress` | Supplied when `READY`; they can also identify the target while pending. Use this read owner for resource links, not as a replacement for the saved request owner. |
| Status `data.display.userPositionId` | Present for a resolved sell/close position; use it only with the matching copy run and saved chain. |
| Status `data.display.capitalInUsd`, `capitalOutUsd` | Optional `DecimalMetric` objects, populated only when `READY` and applicable. Keep `value` as a decimal string, preserve `status` and `asOf`, and treat an omitted metric as unknown rather than zero. See the action table below. |
| Status `data.display.finality` | Qualifies the displayed data as `DATA_FINALITY_PROVISIONAL` or `DATA_FINALITY_FINAL` when ready. Usually omitted while pending. It does not change the strict action status or authorize another action. |
| Status `data.display.reason` | Explains why display data is pending or syncing, such as source indexing, source unavailability, or repair. Use the enum for control flow; do not parse the message text. |
| Status `data.reason`, `data.nextStep` | Default `UNSPECIFIED` values are normally omitted. A normal successful sale can omit both fields. |
| Status receipt/effect indexes | `transactionIndex` and `logIndex` are JSON numbers and can be omitted when zero. Default to zero only inside a present receipt or effect object. |
| `data.result.stop` | A successful Stop identifies its exact accepted or reused parent. A Withdraw Tokens result can omit optional related Stop information. A missing required Stop result needs a fresh status check, not a claim that all exits finished. |
| `data.result.stop.*PositionCount` | JSON numbers; zeroes can be omitted. Use `progressStatus` to qualify completed, skipped, and pending counts before defaulting them to zero. `selectedPositionCount` describes the matched parent. |
| `data.result.openingAllocationRaw` | Supplied for a funded Start CREATE when its allocation is published. Absence is not an opening allocation of zero. |

The public status response has no `directCallMatched` field. Use `status`,
`reason`, and the typed effects instead of attempting to infer private proof
details.

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
PREPARED_ACTION_WARNING_RETAINED_LIQUIDATION_SETTINGS
PREPARED_ACTION_WARNING_RETAINED_LIQUIDATION_DETAILS_UNAVAILABLE
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
PREPARED_ACTION_REASON_TOKEN_INVENTORY_TOO_LARGE
PREPARED_ACTION_REASON_TOKEN_TRANSFER_NOT_ACKNOWLEDGED
PREPARED_ACTION_REASON_NO_WITHDRAWABLE_BALANCE
PREPARED_ACTION_REASON_REVIEW_REQUIRED
PREPARED_ACTION_REASON_ACTION_SETUP_UNAVAILABLE
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
  "generationId": "ks-follower-account-v1-factory-523219b471d28a69d1f81f5787afe81cc5262ef0",
  "targetCapitalRaw": "50000000",
  "startRequestId": "3d7d7b58-72b2-4b7c-bf19-4ee9db355490",
  "fundingMode": "START_COPY_FUNDING_MODE_UNFUNDED"
}
```

Initialize the funding token and `targetCapitalRaw` with
[chain funding-token discovery](#funding-token-for-start-copy-and-add-capital).

Use the selected `generationId` from this chain's catalog; the example ID is not
a frontend default. It is required even when only one generation exists.
Missing, malformed, or unknown IDs return HTTP 400. Its syntax is
`^[a-z0-9][a-z0-9._-]{0,127}$`; syntax alone does not establish catalog support.

`startRequestId` must be a UUIDv4. Keep the same ID and generation while
progressing one Start Copy attempt. `fundingMode` is required;
omission/`UNSPECIFIED` is HTTP 400.
Keep the target, funding mode, and permit intent stable while reusing that ID,
because the canonical creation evidence is bound to the create amount and
permit hash. Start Copy can be multi-stage: prepare, submit the returned call,
observe that stage through `actions:status`, then follow `PREPARE_START_COPY`
after `SUCCEEDED`. Prepare again until the preparation reports completion.
Keep related totals syncing independently; they do not control continuation.

Funding modes:

| Mode                               | Request contract                                                                                                                                                                                            | Create-stage behavior                                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `START_COPY_FUNDING_MODE_UNFUNDED` | Omit `createPermitData`.                                                                                                                                                                                    | Creates the follower account without quote-token capital. A later preparation returns the separate funding call after canonical creation evidence is ready. |
| `START_COPY_FUNDING_MODE_FUNDED`   | The API uses the full `targetCapitalRaw` as the create amount. `createPermitData` is optional and, when supplied through protobuf JSON, is a base64 byte string with a maximum decoded length of 192 bytes. | Attempts account creation and full target funding in one call. Exact permit capability and format remain operator/token-policy decisions.                   |

Funded example with permit transport:

```json
{
  "chainId": "8453",
  "generationId": "ks-follower-account-v1-factory-523219b471d28a69d1f81f5787afe81cc5262ef0",
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
    "generationId": "ks-follower-account-v1-factory-523219b471d28a69d1f81f5787afe81cc5262ef0",
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

`CREATE_CONFIRMING` means the account has been observed, but preparation is
still waiting for the creation/allocation evidence needed to continue. It
returns `PENDING` with no call. Do not resubmit CREATE or infer permission to
fund. Retry preparation according to guidance with the same flow inputs until
it returns an executable `FUNDING_REQUIRED` stage or reports `COMPLETE`.

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
4. Submit the exact call and observe it with `actions:status`. Show the
   verified receipt effect early; wait for `SUCCEEDED` before continuation.
5. Follow `PREPARE_START_COPY` with the same UUID, target, generation,
   funding mode, and permit intent. Refresh related reads independently.
   If the stage is `CREATE_CONFIRMING`, do not submit another transaction.
6. Submit a newly reviewed funding call only when preparation is
   `PARTIALLY_COMPLETED` with `FUNDING_REQUIRED` and an executable FUND call.
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

Initialize the funding token and convert the input using
[chain funding-token discovery](#funding-token-for-start-copy-and-add-capital).

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
- An empty array explicitly requests permanent pause while retaining existing
  liquidation settings. A selected Stop never silently becomes an empty Stop.
- Each position ID is 1..256 characters.
- `slippageBps` is an integer from 0 to 10,000.

`data.stopCopy` contains at most 32 position previews and totals. Each row pins
the `userPositionId`, `tradeId`, base token, user base amount, cashback,
current valuation, lifecycle, unrealized P&L, and `swapQuote`. The stop-level
`totalSwapQuote` carries total expected/minimum quote metrics. If the selectable
position set changes, discard the old preparation and prepare again.

For an empty selection, `totalCurrentValueUsd`, `totalSwapQuote.expectedQuote`,
`totalSwapQuote.minimumQuote`, and `totalCashback` are current `"0"` metrics,
including when optional metadata or retained-settings disclosure is unavailable.
These totals describe the empty selection; retained settings can still cause
future sales and remain disclosed separately.

Both empty and selected Stop requests can remain executable while factory or
controller trading is paused. Use the preparation response; don't add a
client-side trading-pause gate. `retainedSettings` has optional `root`, `observedAt`, and verified
`configs`, plus `detailsAvailable`. Missing disclosure adds a warning; remaining
assets may still be sold under retained settings. Reasserting pause may reuse an
older Stop parent, reported as `PAUSE_REASSERTED` by submitted status.

When required evidence, setup, fee, signer, or routing checks block a selected
Stop, guidance can offer `CHECK_ALTERNATIVE_ACTION` with `action: "stop_copy"` on the same
run. This offers a separate empty-Stop preparation check; it does not assert
readiness or remove positions from the selected request.

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

This is the **Withdraw Stable only** flow. It preserves the existing pause
state; it neither stops an active run nor resumes a stopped one. Even a full
quote sweep is not the All Tokens action.

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

### Prepare Withdraw Tokens

```http
POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareWithdrawTokens
```

```json
{
  "selection": "WITHDRAW_TOKEN_SELECTION_ALL_INDEXED_TOKENS"
}
```

This is the **All Tokens** flow. Submission permanently stops copying in the
same transaction, even with open positions. An all-zero selected balance set
returns `PREPARED_ACTION_STATUS_UNAVAILABLE` with reason
`PREPARED_ACTION_REASON_NO_WITHDRAWABLE_BALANCE`; it does not produce a
stop-only transaction.
Preparation itself does not submit or stop anything. Require
`PREPARED_CALL_KIND_WITHDRAW_TOKENS`; do not accept a quote-withdrawal call kind.

`selection` is required. Only `WITHDRAW_TOKEN_SELECTION_ALL_INDEXED_TOKENS` is
accepted. Unspecified, unknown, and retired `WITHDRAW_TOKEN_SELECTION_STABLE_ONLY`
are rejected. Do not send token addresses, amounts, or a recipient. The operator
selects the configured quote token plus up to 99 positive nonquote balances from
the leader's canonical registration-history and indexed-trade union, in
canonical address order. Removed or disabled registered tokens and eligible
direct deposits remain included; unrelated airdrops remain excluded. Native
assets are excluded; wrapped native tokens are ordinary ERC-20s.

`data.withdrawTokens` contains:

| Field | FE use |
| --- | --- |
| `selection` | Echo of the supported indexed selection. |
| `tokens[]` | One atomic batch of 1–100 selected tokens, including quote; each has `token`, exact action-block `balance`, and display-only `currentValuation`. Positive nonquote balances are selected, while zero nonquote balances are omitted. |
| `quoteToken` | Identifies the quote token within the selection. |
| `balanceSetRevision` | Opaque revision for the token identities selected in this batch; not a balance snapshot, chain watermark, or proof of complete wallet discovery. It can remain present on a non-executable result. |
| `recipientAddress` | Current owner at the action block, present only when executable. Never replace it. |
| `totalCurrentValueUsd` | Use for **Est. USD from selected**. Under PR #102 it sums available valuations in this exact-balance batch; unpriced rows stay N/A. A complete selection with no available valuations yields current `0`; missing balance proof remains unavailable. |
| `cashbackForfeitedUsd` | Use its own metric status for **Cash-back forfeited**. Proven quote-only/zero-nonquote inventory yields current `0`. PR #102 also returns `0` for fully settled residual positions when coverage reaches the prepared block, independently of token price. Unresolved liability remains unavailable. This is an estimate, not a guaranteed on-chain loss. |
| `hasMoreTokens` | `true` when additional eligible nonquote balances were positive at the action block. After submitted status is `SUCCEEDED`, follow `CHECK_WITHDRAWAL_REMAINDER` with a fresh preparation. |

The token list is nonempty, sorted by canonical token address, unique, and no
larger than 100. Unavailable balances must not be displayed as zero. The
operator preflights the entire batch; the API does not split a batch or return a
partial success.

Render available preview fields independently of `displayEnrichment.status`.
Missing price/rebate enrichment does not invalidate a `READY` call. Explain
that withdrawal can forfeit pending rebates; it does not erase rebate escrow
or prove the final rebate amount.

For the selected **All Tokens** option and **Est. USD from selected**, use the
returned `totalCurrentValueUsd` rather than requiring all `tokens[]` to have
prices. It values this prepared batch only; `hasMoreTokens=true` means it is
not a whole-wallet total. Keep each unpriced token's USD value N/A and preserve
an explicit `"0"` cashback estimate. A missing price is not a reason to force
cashback to N/A, and a missing cashback estimate must not default to zero.
The API owns the optional missing-price lookup; no additional FE request is
needed.

| Typed reason | FE behavior |
| --- | --- |
| `PREPARED_ACTION_REASON_TOKEN_TRANSFER_NOT_ACKNOWLEDGED` | Preflight found an ERC-20 transfer returning false or malformed nonempty data. Do not submit. |
| `PREPARED_ACTION_REASON_NO_WITHDRAWABLE_BALANCE` | The exact-block quote and all eligible nonquote balances are zero. Refresh the account and prepare again after a new deposit. |
| `PREPARED_ACTION_REASON_INNER_CALL_REVERTED` | Do not submit; refresh state before preparing again. |
| `PREPARED_ACTION_REASON_SOURCE_COVERAGE_PENDING` / `..._SOURCE_STALE` | Follow the returned top-level status and retry boundary; do not fabricate balances. |

The quote token sweeps its execution-time full balance; positive nonquote
amounts are pinned to the preparation block. Fee-on-transfer/rebasing tokens
can deliver a different amount to the owner. Do not label the balance preview
as a guaranteed amount received. Estimate gas for the exact returned outer
call with the wallet/provider. Follow the submitted status continuation after
`SUCCEEDED` to check the remainder; `hasMoreTokens` is only the preparation-time
preview. The first batch's permanent Stop means later batches operate on the
stopped account.

`reprepareAfter` is at most 30 seconds after preparation. Reprepare after
expiry, a relevant state change, or a failed submission. After a successful
receipt, discard the old call, refresh wallet inventory and copy-run reads,
and prepare anew only if another withdrawal is needed. A late/newly indexed
token is not permission to replay the previous call. Responses are no-store.

See [Withdraw Tokens API](withdraw_tokens_api.md) for exact execution and
closure semantics; use [Prepare Withdraw Quote](#prepare-withdraw-quote) for
stable-only withdrawal without changing pause state.

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

Omit both pins to review the current skipped-sell quantities without routing,
signing, or calldata. This returns `PENDING/REVIEW_REQUIRED`. Supply both current
`expectedUnresolvedSkipCount` and `expectedSellRatioRaw` for executable preparation.
Supplying only one pin is invalid. Stale pins return no call and updated review
information; refresh and explicitly review the new quantities.

For a target whose required state is available, use these transitions:

| Request or response | Next frontend step |
| --- | --- |
| Both `expected*` pins omitted | Expect `PENDING` with `PREPARED_ACTION_REASON_REVIEW_REQUIRED`; show the current quantities. This request does not obtain a swap route or call. |
| Only one pin supplied | Handle HTTP 400 as an invalid request; supply both current pins or omit both. |
| Both pins supplied but the obligation changed | Handle `UNAVAILABLE` with `PREPARED_ACTION_REASON_SELL_OBLIGATION_CHANGED`; show the returned updated quantities and require another review. |
| `READY` with both call and context | Apply the preparation safety checks, then request wallet submission. |
| Another typed outcome or HTTP error | Follow that response's reason and guidance. Do not force it into the review flow. |

After review, build the second request from the returned preview:

```js
function reviewedManualSellRequest(prepared, slippageBps) {
  const preview = prepared.manualSell;
  if (preview?.sellRatioRaw == null || preview.unresolvedSkipCount == null) {
    throw new Error("Current sell details are unavailable; refresh before preparing.");
  }
  return {
    slippageBps,
    expectedSellRatioRaw: preview.sellRatioRaw,
    expectedUnresolvedSkipCount: preview.unresolvedSkipCount,
  };
}
```

Call this helper after the user reviews the quantities. It only constructs a
preparation request and does not authorize submission. Required source or
identity failures can still return another pending or unavailable outcome.

`expectedSellRatioRaw` must be in `(0, 1e18]`; the unresolved count must be
positive. `data.manualSell` contains the recovery context, exact
position/trade/token identity when covered, remaining base before, user sell
amount, released upfront fee, ratio, unresolved count, cashback, and the
preparation-scoped `swapQuote`. It intentionally excludes gross route input and
router internals.

The sell amount comes from the unresolved obligations; it is not a freely
editable amount. Review the returned `sellRatioRaw` and `unresolvedSkipCount`
before copying them into the corresponding `expected*` request fields.
For routing or dependency failures, use the
[shared preparation error contract](#manual-sell-and-close-preparation-failures).

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

For active positions, two or more distinct unresolved partial skipped sells
recommend Close Position and retain Manual Sell. A cumulative 100% skipped-sell
recovery also recommends Close Position, even if there is only one unresolved
missed sell. Manual Sell remains a supported alternative. Repeated log entries
and retry attempts do not add obligations. Use the returned availability and
recommendation fields rather than counting activity entries or deriving a
different button from the displayed percentage.

#### Manual Sell and Close preparation failures

Check HTTP status first, then `data.status`, `data.reason`, and optional
`data.failureDetails`. HTTP 200 does not mean that a call is executable.
Enum reasons below have the `PREPARED_ACTION_REASON_` prefix. No failure
response supplies executable `call` or `statusContext` fields.

| Failure | HTTP response | Frontend behavior |
| --- | --- | --- |
| No route, rejected liquidity-provider quote, or unfulfillable output | 200, `UNAVAILABLE / NO_EXECUTABLE_ROUTE`; `failureDetails.code` is `route_not_found`, `route_rejected`, or `route_unfulfillable` | Show the supplied message; allow a fresh preparation. |
| Aggregator network failure, HTTP-client timeout, HTTP 408, or 5xx | 200, `PENDING / ACTION_SETUP_UNAVAILABLE`, `aggregator_unavailable` | Keep the selection and retry after `guidance.retryAfterMs`. |
| Aggregator rate limit or upstream cancellation | 200, `PENDING / ACTION_SETUP_UNAVAILABLE`, `aggregator_rate_limited` or `aggregator_canceled` | Keep the selection and respect `guidance.retryAfterMs`. |
| Other aggregator errors | 200, `UNAVAILABLE / NO_EXECUTABLE_ROUTE`; code from the table below | Use `failureDetails.retryable` and the supplied guidance. `UNAVAILABLE` alone does not prohibit a fresh preparation. |
| Simulation RPC unavailable or its local deadline expires | 200, `PENDING / ACTION_SETUP_UNAVAILABLE`, `simulation_unavailable` | Retry preparation after the supplied delay. |
| Account call reverts during simulation | 200, `UNAVAILABLE / INNER_CALL_REVERTED`; a simulation code below | Follow `failureDetails` and `guidance`; do not reuse an earlier call. |
| Recognized blockchain RPC rate limit propagated as a request error | 429, gRPC `code: 8`, `ErrorInfo.reason: RPC_RATE_LIMITED` | Show the RPC message and retry a fresh preparation after the supplied delay; see [RPC preparation errors](#rpc-preparation-errors). |
| Recognized blockchain RPC outage or timeout propagated as a request error | 503, gRPC `code: 14`, `ErrorInfo.reason: RPC_UNAVAILABLE` or `RPC_TIMEOUT` | Keep the selection and follow the supplied retry guidance. |
| Operator route, connection, or another unresolved dependency fails | 503, gRPC `code: 14`, `message: "service unavailable"`, guidance in `details[]` | Retry after the supplied delay. This generic error does not identify a provider. |
| Overall request deadline expires | 504, gRPC `code: 4`, `message: "request deadline exceeded"`, guidance in `details[]` | Retry preparation. The API did not submit a transaction. |
| Returned preparation fails contract, selector, scope, or evidence validation | 400, gRPC `code: 9`, sanitized message and guidance in `details[]` | Show support guidance. Do not automatically repeat this invalid response. |
| Built route fails internal consistency validation | 500, gRPC `code: 13`, `message: "internal query error"`, guidance in `details[]` | Show support guidance; do not use old calldata as a fallback. |

After [operator PR #238](https://github.com/KyberNetwork/copy-trade-operator/pull/238)
is deployed, Stop Copy also returns HTTP 200 with
`UNAVAILABLE / NO_EXECUTABLE_ROUTE` and `route_unfulfillable` when a selected
position cannot meet the requested minimum output. Show the supplied
message and guidance for the whole selection. Do not silently drop positions or
increase slippage. No executable call is returned for this case.

`failureDetails` has this shape. It can also appear on other preparation
endpoints after simulation failure. Stop Copy with selected positions also uses
these fields when its quote step fails; Stop without positions does not need a
route. Render the `CHECK_ALTERNATIVE_ACTION` guidance step for Stop with existing
settings even when the selected sale is non-retryable. This makes a separate
preparation with an empty position selection; do not silently change the user's
selection or treat it as an already executable call:

```ts
interface ActionFailureDetails {
  code: string; // Stable identifier; unknown codes use the returned guidance.
  stage: 'quote' | 'route_build' | 'simulation';
  message: string; // Safe explanation, at most 256 characters.
  retryable?: boolean; // Omitted means false inside this present object.
  revertSelector?: string; // Four bytes: 0x plus eight lowercase hex digits.
  contractError?: string; // Recognized ABI error name/signature; no arguments.
  aggregatorCode?: number; // Original positive int32 body code, including unknown codes.
  aggregatorHttpStatus?: number; // Upstream HTTP status, 100–599; not this API's status.
  retryAfterMs?: number; // Provider delay, 100–2147483647 ms; only when retryable is true.
}
```

Aggregator fields appear only at `quote` or `route_build`. A present
`aggregatorCode` always has `aggregatorHttpStatus`. A transport failure without
an HTTP response omits both fields. `revertSelector` and `contractError` appear
only at `simulation`, which runs the actual account call through the operator's
RPC. An aggregator gas-estimation failure is not that simulation.

These existing codes indicate that a fresh preparation can help:

| Code | Stage | Suggested response |
| --- | --- | --- |
| `route_not_found` | `quote` or `route_build` | Try again later. |
| `route_rejected` | `quote` or `route_build` | Request a fresh quote. |
| `route_unfulfillable` | `quote` or `route_build` | Refresh the quote or review slippage. |
| `aggregator_unavailable` | `quote` or `route_build` | Retry after the supplied delay. |
| `simulation_price_failure` | `simulation` | Refresh the quote or review slippage. |
| `simulation_signature_expired` | `simulation` | Prepare again for a fresh signature. |
| `simulation_unavailable` | `simulation` | Retry after the supplied delay. |

The aggregator mappings below use the numeric response code first, with HTTP
429 and recognized rate-limit errors taking precedence. Numeric codes come from KyberSwap; the text identifiers
are Copy Trade's categories. The versioned Aggregator v2.13.0 OpenAPI defines
4001, 4002, 4005, 4007, 4008, 4009, 4010, 4011, and 4221. Other recognized codes
come from the [KyberSwap error catalog](https://raw.githubusercontent.com/KyberNetwork/kyberswap-skills/refs/heads/main/skills/error-handling/SKILL.md)
and may evolve upstream.

| Upstream condition | `failureDetails.code` | `retryable` | Frontend behavior |
| --- | --- | --- | --- |
| 4000, 4001, 4002, 40010 | `aggregator_invalid_request` | false | Review request fields or contact support. 40010 is distinct from 4010. |
| 4003 | `aggregator_invalid_swap` | true | Prepare again for a fresh route. |
| 4004, 4005, 4007 | `aggregator_invalid_fee` | false | Show the message and support guidance; routing fee settings need review. |
| 4008 or 4010 | `route_not_found` | true | Try again later; liquidity can change. |
| 4009 | `aggregator_amount_too_large` | false | Show the size limit failure. Manual Sell and Close amounts are fixed by the operator. |
| 4011 | `aggregator_token_not_found` | false | Check token and chain support or try again after indexing. |
| 4221 | `aggregator_wrapped_native_unavailable` | false | Show support guidance for chain configuration. |
| 4222 | `aggregator_quote_changed` | true | Prepare again for a fresh quote. |
| 40011 | `aggregator_liquidity_filtered` | false | Routing restrictions need review. Do not silently change source filters. |
| 4227 with recognized minimum-return failure | `aggregator_price_failure` | true | Prepare again for a fresh quote. Do not increase slippage automatically. |
| 4227 with recognized insufficient-funds failure | `aggregator_insufficient_funds` | false | Refresh account state or contact support; this does not prove the owner wallet lacks gas. |
| 4227 with recognized token-transfer failure | `aggregator_transfer_failed` | false | Show token restriction or integration guidance. Do not request approval to an arbitrary router. |
| Other 4227 | `aggregator_gas_estimation_failed` | true | Try a fresh route within the retry budget; show support guidance if it persists. No specific revert cause is established. |
| 4990 while the preparation request remains active | `aggregator_canceled` | true | Retry preparation after the supplied delay. |
| 500, HTTP 408/5xx without another recognized code, or network/read failure | `aggregator_unavailable` | true | Retry after the supplied delay. |
| HTTP 429 or recognized RFQ rate limit | `aggregator_rate_limited` | true | Respect `guidance.retryAfterMs`, including delays longer than five minutes. |
| HTTP 401/403/404 without another recognized code | `aggregator_configuration_error` | false | Show endpoint, chain, or access configuration guidance; this is not proof of missing liquidity. |
| Other unrecognized HTTP 422 | `route_rejected` | true | Try a fresh route within the retry budget. |
| Other unrecognized response code, including a nonzero code on HTTP 200 | `aggregator_request_failed` | false | Show safe guidance and retain the numeric code for support. |

Recognized PMM/RFQ source errors can also return `aggregator_amount_too_small`,
`aggregator_amount_too_large`, `aggregator_source_restricted`,
`aggregator_pair_unsupported`, or `aggregator_self_fill` with `retryable: false`.
Temporary liquidity or source timeouts return `route_rejected`; market changes
return `aggregator_quote_changed`; source throttling returns
`aggregator_rate_limited`. All use fixed safe messages. Do not parse vendor
message text or assume every HTTP 422 is a price error.

Example fragment for an aggregator rate limit with `Retry-After: 600`:

```json
{
  "status": "PREPARED_ACTION_STATUS_PENDING",
  "reason": "PREPARED_ACTION_REASON_ACTION_SETUP_UNAVAILABLE",
  "failureDetails": {
    "code": "aggregator_rate_limited",
    "stage": "route_build",
    "message": "The routing service is rate limited. Wait before preparing again.",
    "retryable": true,
    "aggregatorHttpStatus": 429,
    "retryAfterMs": 600000
  },
  "guidance": {
    "message": "The routing service is rate limited. Wait before preparing again.",
    "retryAfterMs": 600000,
    "nextSteps": [
      {"kind": "ACTION_GUIDANCE_STEP_KIND_RETRY", "label": "Retry preparation"}
    ]
  }
}
```

Here the public API returns HTTP 200 and the aggregator returned HTTP 429.
`aggregatorCode` is omitted because this example has no positive body code.
For a minimum-return 4227 response, the three key fields are
`code: "aggregator_price_failure"`, `aggregatorCode: 4227`, and
`aggregatorHttpStatus: 422`; `retryable` is true. For a 4009 response, the code is
`aggregator_amount_too_large`; `retryable` is false or omitted, and guidance
contains no retry delay. Do not infer retryability from the numeric code alone.

The following simulation codes have `retryable: false`. Resolve or refresh the
prerequisite before another attempt; do not run an automatic retry loop:

| Code | Suggested response |
| --- | --- |
| `simulation_insufficient_balance` | Refresh balances. |
| `simulation_paused` | Check again after the contract is unpaused. |
| `simulation_authorization_failed` | Check the owner and permissions. |
| `simulation_contract_reverted` | Review `contractError` and show support guidance. |
| `simulation_unknown_revert` | Show the failure and offer support; its cause is not established. |

Example fragment from `data` after a recognized minimum-return revert:

```json
{
  "status": "PREPARED_ACTION_STATUS_UNAVAILABLE",
  "reason": "PREPARED_ACTION_REASON_INNER_CALL_REVERTED",
  "failureDetails": {
    "code": "simulation_price_failure",
    "stage": "simulation",
    "message": "The swap did not meet its minimum return. Refresh the quote or review slippage.",
    "retryable": true,
    "revertSelector": "0x08c379a0",
    "contractError": "Error(string)"
  },
  "guidance": {
    "message": "The swap did not meet its minimum return. Refresh the quote or review slippage.",
    "retryAfterMs": 2000,
    "nextSteps": [
      {"kind": "ACTION_GUIDANCE_STEP_KIND_RETRY", "label": "Retry preparation"}
    ]
  }
}
```

Use `guidance.retryAfterMs` to schedule a retry; do not hard-code 2000 ms. It is
at least 2000 ms and at least a valid provider delay. HTTP delay seconds and dates
are supported; the maximum is 2147483647 ms to fit browser timers. Bound automatic
retries, for example to three attempts with backoff and jitter, and cancel them
when the form or selected action changes. Stop automatic retries when
`failureDetails.retryable` is false or omitted. A retry means a new preparation
request, not replaying a transaction. Keep manual retry available when the
relevant state changes. For Manual Sell and Close, the action fixes
the sell amount; expose the supported slippage input without changing returned
amounts.

If `failureDetails` is absent, fall back to `reason` and `guidance`. Do not
infer the aggregator from a generic revert, HTTP 503, or HTTP 504. The API
never exposes raw provider messages, vendor payloads, revert arguments, or
signed calldata in diagnostics. HTTP 429 can report an API resource/action
capacity limit or a recognized blockchain RPC rate limit; use the typed
`ErrorInfo` described below to distinguish them. An aggregator rate limit is
represented by an HTTP 200 preparation result whose
`failureDetails.aggregatorHttpStatus` can be 429.

## Submitted action status

```http
POST /users/{ownerAddress}/actions:status
```

Body: `statusContext` from the executable preparation, `transactionHash` from
the wallet, and optional `previousReceipt` with decimal-string `blockNumber`
and `blockHash`. The path owner must match `statusContext.expectedOwner`.
Context is an unsigned selector, not authentication or proof that preparation
occurred. The request body is limited to 64 KiB. A context can contain at most
32 Stop positions or 100 withdrawal tokens. Do not send calldata, permit, signature, or raw transaction
bytes. Safe proposal and user-operation hashes are not EVM transaction hashes.

Keep the original context after `reprepareAfter`; that timestamp limits a new
submission, not observation of a submitted transaction. If the wallet reports
a replacement EVM transaction hash, check the replacement with the same
context. A missing receipt or elapsed timeout does not prove replacement or
cancellation.

For example, `prepared` below is the executable preparation's `data` object.
Preserve its context instead of rebuilding it from list values:

```js
async function readSubmittedStatus(apiBase, ownerAddress, prepared, transactionHash, previousReceipt, signal) {
  const response = await fetch(`${apiBase}/users/${ownerAddress}/actions:status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal,
    body: JSON.stringify({
      statusContext: prepared.statusContext,
      transactionHash,
      previousReceipt,
      resultMode: "SUBMITTED_ACTION_RESULT_MODE_RECEIPT_FIRST",
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    return {
      ok: false,
      httpStatus: response.status,
      code: payload.code,
      message: payload.message,
      guidance: readActionGuidance(payload),
      details: payload.details ?? [],
      retryAfter: response.headers.get("Retry-After"),
    };
  }
  return { ok: true, data: payload.data };
}
```

The shared `readActionGuidance` helper is in [Error handling](#error-handling).
Keep `details` for typed RPC reasons and retry delays. `retryAfter` can be null
when the header is absent or unavailable to the browser; the error body's
`RetryInfo` still supplies the recognized RPC delay.
Network or JSON-decoding failures reject the promise. Keep the saved hash and
context, show that the status check failed, and allow another observation.

The example requests receipt-first results. Omit `resultMode` to use the
legacy completion flow. When the response has no `receiptResult`, use
`data.status` and `data.result`; do not invent an early result or treat its
absence as failure. This also supports environments where receipt-first
results are not enabled.

Store the most recent returned `transaction.receipt` separately and send it as
`previousReceipt` on the next poll. If a later observation omits its receipt,
keep that saved reference for comparison while clearing the receipt from the
current status display. For example, a pending response can be:

```json
{
  "data": {
    "status": "SUBMITTED_ACTION_STATUS_PENDING",
    "reason": "SUBMITTED_ACTION_REASON_TRANSACTION_PENDING",
    "transaction": {
      "transactionHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
      "safeBlockNumber": "0"
    },
    "display": {
      "status": "SUBMITTED_ACTION_DISPLAY_STATUS_PENDING",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111"
    },
    "guidance": {
      "message": "The transaction has not been confirmed yet. Keep its hash to check again.",
      "retryAfterMs": 2000
    }
  }
}
```

The hash above is illustrative. Missing `result` is expected before
`SUCCEEDED`. Older servers can omit `display`; missing or
unknown display readiness proves nothing, so do not reuse a previous `READY`
value.
Malformed contexts return an input error;
oversized HTTP bodies return 413. A transport error is separate from an
`UNKNOWN` observation and must not be shown as transaction failure.

### Which status controls which part of the UI

The action dialog, copy-run lifecycle, and financial fields answer different
questions. Keep their states separate in the client:

| Field and endpoint | Question it answers | What to render or update |
| --- | --- | --- |
| Preparation `data.status`, `data.reason`, and optional `startCopy.stage` | Is there a call the user can submit, or another stage to prepare? | Show review, a preparation explanation, or completed preparation. Preparation is not a receipt for a new transaction. |
| `actions:status.data.status` and `data.reason` | What is the current verified state of this submitted call? | Drive the pending, confirming, syncing, succeeded, failed, or unknown call state. |
| `actions:status.data.receiptResult` | Is the intended effect verified in the current mined receipt? | Show the exact effect as provisional success before strict completion. Its presence, not the outer receipt outcome alone, enables the early success message. |
| `actions:status.data.display.status` | Are this action's specific public values ready to display? | Render returned display metrics only with `READY`. Use the per-action guarantees below. |
| Read `meta.pendingActions[]` and `meta.fieldQualities[]` | Which returned subjects or field groups are still updating? | Render the affected component as syncing. The backend owns reconciliation; no client action-readiness map is needed. |
| Copy-run detail/list `data.status` or row `status` | Is this run active, closing, stopped, or closed? | Render the run lifecycle. Use server Open/History lists for membership. This is not submitted-action status. |
| Copy-run `capitalInUsd.status` | Is this returned Capital In number usable? | Render `CURRENT`; qualify `STALE`; use a placeholder for `UNAVAILABLE`. It does not prove that a particular transaction is included. |
| Copy-run `capitalInProjectionStatus` | Has Capital In completed its current projection? | Keep a syncing indication for `SYNCING`, even with a usable provisional number. `READY` refers to that projection, not an unobserved submitted action. |
| Read `meta.fieldQualities[]` and metric `asOf` | How fresh, complete, and final is the returned value? | Preserve provisional, stale, partial, or pending qualifiers. A fresh response timestamp alone is not proof of action inclusion. |

Copy-run detail and list responses use their existing lifecycle, metric, and
projection fields plus response metadata. A GET started after `receiptResult`
can independently describe pending effects; it does not need the status
context or transaction hash. `METRIC_STATUS_SYNCING` does not exist.

For example, Capital In can show **$10 · Last known · Syncing** from a stale
metric and pending capital-group quality, then **$15 · Provisional** from a
new server value. Use the returned numbers; never add a local receipt delta.

The fast path begins when the node exposes a mined receipt that verifies the
expected effect. The target is an exact action result within a few seconds of
that observation. This is not a submission-to-success timer or a measured
production latency guarantee. Wallet approval, block inclusion, dependency
failure, and reorgs can take longer. Do not keep the dialog blocked on totals
or promise that every metric becomes ready within five seconds.

### When to show success

Keep the submitted call's result separate from the readiness of its updated
page data. Apply the latest response in this order:

1. If `data.status = SUCCEEDED`, show the call as completed using `data.result`.
2. Otherwise, if `data.receiptResult` is present, show the verified effect as
   provisional success. For example, show **Capital added · Confirming** for
   `CONFIRMING`, or **Withdrawal successful · Data syncing** while the updated
   data is unavailable. Let the user dismiss the dialog and continue observing
   the operation in the background.
3. Otherwise, use the [status and reason matrix](#status-and-reason-matrix).
   `transaction.outcome = SUCCESS` alone means only that the outer transaction
   succeeded; it does not verify the intended action.

`receiptResult` contains the action kind, account identity, and typed effects
with raw token amounts. It has no separate status or finality field. Format
amounts using the matching token's decimals and keep the raw strings intact.
The optional `display.finality` qualifies display data, not the receipt result.
`receiptResult` has no `copyRunId` or `userPositionId`; use the IDs returned in
`display` or `result` for newly resolved resource links.

A verified receipt effect can remain available when `data.status = UNKNOWN`
because public details are temporarily unavailable. Keep that effect visible
with its provisional label and show the data issue separately. If the latest
response omits `receiptResult`, clear the earlier receipt preview; a current
`SUCCEEDED` response and its `result` still establish call success.

Only `SUCCEEDED` authorizes handling the returned `nextStep`. Neither a
provisional success message nor display `READY` authorizes the next transaction.
Success always applies to the submitted call, stage, or batch: a successful
CREATE can still need funding, a successful Stop can still have exits in
progress, and a successful withdrawal batch can leave tokens behind.

### Status and reason matrix

The table omits the `SUBMITTED_ACTION_STATUS_` and
`SUBMITTED_ACTION_REASON_` prefixes. Apply the receipt-result rules above
before choosing a pending or syncing presentation.

| `data.status` | `data.reason` | Frontend behavior |
| --- | --- | --- |
| `PENDING` | `TRANSACTION_NOT_FOUND` or `TRANSACTION_PENDING` | Show **Pending** and poll. Keep the hash; absence does not prove cancellation. |
| `PENDING` | `REORGED` | Remove the earlier result and show **Checking new inclusion**. Poll the same hash and context. |
| `CONFIRMING` | `CONFIRMATIONS_PENDING` | With `receiptResult`, show provisional success. Otherwise show **Confirming** and the observed receipt outcome separately. A reverted receipt is not a final `FAILED` result yet; keep polling. |
| `SYNCING` | `SOURCE_INDEXING`, `RESULT_PUBLICATION`, or `REPAIR_IN_PROGRESS` | With `receiptResult`, show the verified effect provisionally. Otherwise show **Updating result**. Render independently ready display data and continue polling. |
| `SUCCEEDED` | Omitted, `UNSPECIFIED`, or `REINCLUDED` | Show call success and handle `nextStep` separately. If display is `PENDING` or `SYNCING`, keep the affected data updating and continue polling while the view needs it. |
| `FAILED` | `TRANSACTION_REVERTED` | Show that the matched call reverted. Stop this operation's status polling. Any new submission requires a fresh preparation and user review. |
| `UNKNOWN` | `SOURCE_UNAVAILABLE` | Show **Status temporarily unavailable**. Keep any current `receiptResult` visible provisionally and retry observation using the returned hint. |
| `UNKNOWN` | `HISTORY_UNAVAILABLE`, `TARGET_MISMATCH`, `AMBIGUOUS_EFFECT`, or `EFFECT_NOT_VERIFIABLE` | Show the explanation without calling the transaction failed. A current `receiptResult` can still be shown provisionally. Follow a returned retry hint; otherwise offer review or support. |

Read `guidance.retryAfterMs` instead of hard-coding a polling interval. An
omitted hint does not mean a zero-delay retry. Polling does not require a
`RETRY` entry in `guidance.nextSteps`. Use status and reason enums for control
flow, not `guidance.message` text.

`data.result` is present only with `SUCCEEDED`; `data.receiptResult` can arrive
earlier. An unsupported status or reason must not be mapped to success or
failure. Preserve the operation and offer another status check.

### Submitted-action display readiness

Use `data.display.status` for the action-specific values described below.
Related GETs report their own pending state through `meta.fieldQualities` and
`meta.pendingActions`. Display readiness is independent of call success and
does not make every field on the page ready.
Display values use the `SUBMITTED_ACTION_DISPLAY_STATUS_` prefix:

| Display status | Frontend behavior |
| --- | --- |
| `PENDING` | No verified updated public data. Show the affected data as pending. Do not reuse an earlier ready display object or infer readiness from target IDs. |
| `SYNCING` | Keep any verified receipt result visible; show the affected totals or position details as **Syncing**. This display does not supply replacement monetary values. |
| `READY` | Show its action-specific data and any returned monetary values, preserving their status and `display.finality`. Refresh the named copy run or position. Other metrics can still be updating. |
| Missing, `UNSPECIFIED`, or unsupported | No readiness guarantee. An older response without `display` uses the normal `SUCCEEDED` result and refresh flow; do not start endless display-only polling. |

`READY` can accompany action `CONFIRMING`, `SYNCING`, or `SUCCEEDED`. Conversely,
action `SUCCEEDED` can have display `SYNCING` or `PENDING`. Keep the success
message and the updating-data indicator separate.

| Action or stage | What display `READY` lets you show |
| --- | --- |
| Start Copy CREATE | The new copy-run detail. Render `capitalInUsd` only when returned; absence is not zero or the prepared funding amount. |
| Start Copy FUND | The returned `capitalInUsd`, which includes the exact funding credit. |
| Add Capital | The returned `capitalInUsd`, which includes this deposit and can be provisional. |
| Stop Copy | The paused copy-run lifecycle. The run can remain `closing` while positions exit; do not label all exits complete. |
| Withdraw Quote | For a positive withdrawal, `display.capitalOutUsd` includes this withdrawal. A zero maximum withdrawal can be ready without a capital metric. |
| Withdraw Tokens | The paused account lifecycle. A positive quote withdrawal is included in `display.capitalOutUsd`; zero or nonquote batches can be ready without it. Refresh wallet inventory separately. |
| Manual Sell / Close Position | The sale activity and current position detail. Use `userPositionId` to refresh position/history; a later trade can change the current remaining amount. |

Use `display.readOwnerAddress` with `copyRunId` for owner-scoped reads and
`userPositionId` for position reads. Keep the original owner, chain, hash, and
`statusContext` for polling. The read owner can differ from the transaction
actor.

### Related-read status

After `receiptResult`, request the affected data immediately. The backend
retains the verified effect before returning that response and continues
reconciliation without browser polling. A fresh GET works after dialog
closure, reload, wallet reconnect, or a new session.

Read these fields directly from each GET response:

| Field | UI behavior |
| --- | --- |
| Metric `status` | Render `CURRENT`, qualify an available `STALE` value, and show a placeholder for `UNAVAILABLE`. Never turn an absent value into zero. |
| `meta.fieldQualities[].completeness = DATA_COMPLETENESS_PENDING` | Show **Syncing** for that field group. `DATA_QUALITY_REASON_PENDING_USER_OPERATION` identifies a verified action waiting for public data. |
| Group `finality = DATA_FINALITY_PROVISIONAL` | Label the returned value provisional. Freshness, completeness, and finality are separate qualifiers. |
| `capitalInProjectionStatus` | Preserve its existing `SYNCING`, `READY`, or `UNAVAILABLE` behavior alongside the metric and capital-group quality. |
| `meta.pendingActions[]` | Identify an affected run/account/position, or a pending CREATE without a canonical row. Use it as response metadata, not a second action-status state machine. |
| `meta.pendingActionsTruncated = true` | More pending effects exist than the bounded descriptor list contains. Follow group quality; absence from the list does not establish that a row is current. |
| `receiptInvalidated = true` or `DATA_QUALITY_REASON_REORG_REPAIR` | Withdraw the invalid receipt preview and unavailable values. Render the corrected data supplied by subsequent responses. |

A pending-action descriptor contains `kind`, `chainId`, `transactionHash`,
`copyAccount`, `copyRunId`, `readOwnerAddress`, `agentId`, optional
`userPositionId`, `receiptBlockNumber`, `receiptBlockHash`, `fieldGroups`, and
`receiptInvalidated`. Public agent responses can omit action descriptors;
their returned metric and group quality still apply. Descriptors contain no
amount to add to a total and do not authorize another transaction.

For a verified CREATE whose row is not available yet, detail responds with
absent `data` and a pending descriptor in `meta`. Owner lists retain canonical
rows and include the new identity in metadata; render a separate syncing
placeholder instead of inserting invented financial values or changing rank.
Unknown, unverified resource IDs still return 404.

#### Related fields and reads by action

All actions can leave account/owner portfolio and agent AUM updating. Each GET
qualifies its own fields independently; a sale's fees or P&L can remain pending
after its position quantity has updated.

| Action | Refresh immediately after verified success | What can remain syncing |
| --- | --- | --- |
| Start CREATE | Owner copy-run list, known new-run detail, owner summary | New row/lifecycle, opening Capital In, portfolio and AUM; a separate FUND is another action. |
| Start FUND | Run detail/list, owner/account summaries, wallet | Capital In, portfolio, AUM, and activity. CREATE completion does not clear funding work. |
| Add Capital | Run detail/list, owner/account summaries, wallet | Capital In, portfolio, AUM, and activity. |
| Stop Copy | Run detail/list and positions; owner/account summaries | Pause/lifecycle publication, selected exit progress, portfolio, activity, and derived metrics. Stop success does not mean all positions are sold. |
| Withdraw Quote | Run detail/list, wallet, owner/account summaries, history | Capital Out, wallet balances, portfolio, and activity. The withdrawal does not stop the run. |
| Withdraw Tokens | Run detail/list, wallet inventory, positions, history | Pause/lifecycle, actual wallet quantities, portfolio, and any quote component's Capital Out. Success applies to this batch. |
| Manual Sell | Position list, closed executions, pending-sell obligations, wallet, run detail | Quantity/lifecycle, FIFO, wallet, settlement, fees, P&L, and activity. A partial sell can succeed. |
| Close Position | The same reads as Manual Sell | The affected position closes; the run can remain active. Settlement and fees can follow the quantity update. |

Use `/users/{readOwnerAddress}/copy-runs/{copyRunId}` for detail, its existing
positions/performance routes for drilldowns, and the matching owner list and
summary routes for the current view. Account reads use
`/copy-accounts/{chainId}/{copyAccount}` and its balances, wallet-inventory,
positions, pending-sell-obligations, or history routes. Use the returned public
IDs and the exact connected-owner/filter cache keys.

Fetch visible resources; invalidate hidden ones for their next use. Coalesce
requests for the same endpoint. Existing wallet GETs compare their own balance
observations with the pending effect; portfolio readiness never certifies a
cached token quantity. No new endpoint or transaction parameter is required.
An affected token can disappear from inventory after a verified zero balance.
An empty response with pending quality does not establish an empty wallet.
Keep usable quantities visible with their row freshness and valuation statuses;
show **Syncing** while the valuation group is pending. Frontend
[RPC balance reads](#refresh-token-balances-with-rpc) remain optional for promptly
reading known tokens.

### Provisional values and syncing totals

A provisional action result and a syncing total can appear together. These
combinations require different rendering:

| Returned evidence | Action result | Totals and page data |
| --- | --- | --- |
| `receiptResult` plus a pending GET field group | Show completed-call success when `data.status = SUCCEEDED`; otherwise show the effect provisionally. | Keep the corresponding field marked **Syncing**. A usable server value can remain visible with its own qualifiers. Do not calculate a new total from the receipt. |
| Display `READY` with a metric and `DATA_FINALITY_PROVISIONAL` | Show the result permitted by `receiptResult` or `data.status`. | Show that metric with a provisional label; it is already an updated server value. |
| Copy-run `capitalInProjectionStatus = SYNCING` with a `CURRENT` metric and capital-group `PROVISIONAL` finality | Does not by itself establish this action's result. | Show the server-published number with a provisional/syncing indicator. |
| A GET returns a usable value with pending field-group quality | Does not establish that this action is included. | Keep the syncing indicator; show the number only as the last known value. |
| A normal read returns a `STALE` metric | Does not by itself establish this action's result. | Show it as stale if useful, without claiming it includes this action. |
| No usable metric, or metric `UNAVAILABLE` | A verified receipt result can still be shown. | Show **Syncing** when the response says it is updating, or an unavailable placeholder. Never substitute zero. |

For values from normal list/detail responses, follow their own metric status
and field-group quality even while action display is `SYNCING`. Such a value
does not by itself prove that the submitted action is included.

In action-status responses, render `display.capitalInUsd` and
`display.capitalOutUsd` only with display `READY`. Follow each metric's `status`
and `asOf`. `METRIC_STATUS_CURRENT` can accompany `DATA_FINALITY_PROVISIONAL`;
`METRIC_STATUS_STALE` can accompany `DATA_FINALITY_FINAL`. Preserve both
qualifiers. These qualifiers do not make every other account metric ready.

Returned capital values are totals. Replace the corresponding displayed
metric and remove its matched local pending delta; do not add the receipt
amount again. For Capital Out, keep the action-status total separate from the
copy-run card's [Amount Out](#closed-run-amount-out), which can also include
quote still held. Refresh the card from its list/detail response.

Prices, P&L, wallet balances, list membership, and optional exit progress can
still be updating after display `READY`. Render independently available fields;
do not hide ready values solely because `data.reason = REPAIR_IN_PROGRESS`.

Replace `receiptResult` and `display` on every successful status poll; apply each
GET's current metadata when rendering its fields.
If a receipt is invalidated or changes inclusion, remove its earlier provisional
success and readiness claims before applying the new observation. If only
display data becomes pending or syncing, clear the earlier action-specific values
while retaining any receipt result in the latest response. Reset affected
refreshes when their returned quality becomes pending or unavailable. Never merge an old ready object
into a later pending, syncing, or missing one.

### Receipt changes and remaining work

Compare successive receipt `blockHash` values to detect changed inclusion.
`REINCLUDED` is an optional explanation on a successful observation, not a
durable flag. A replacement inclusion still awaiting confirmations returns
`CONFIRMING/CONFIRMATIONS_PENDING`; one awaiting publication returns `SYNCING`.
After you send the new receipt on the next poll, a successful result can omit
`REINCLUDED` again. Never wait for that reason to update the displayed receipt.

`result` includes the verified account identity, resource IDs, and exact
transaction effects. Use its IDs for links and refreshes. For funded CREATE,
use `openingAllocationRaw` when supplied rather than deriving the allocation
from a transfer. A nonquote withdrawal can succeed without a Capital Out
metric, and a maximum quote withdrawal can succeed with zero movement.
Partial Manual Sell success does not mean the position is closed.

Review-time skip counts and ratios can change before the transaction is mined.
Judge completion from submitted status, not equality with a later position
snapshot. A successful partial Manual Sell can leave new obligations. After
success, refresh the position and obligations before offering another sale.

`result.stop.progressStatus` qualifies the optional child-exit counts:

- `DATA_STATUS_CURRENT`: Render the counts as current progress.
- `DATA_STATUS_STALE`: Render the available counts with a stale label and
  offer refresh.
- `DATA_STATUS_UNAVAILABLE`: Show progress as unavailable. Do not substitute
  zero completed, skipped, or pending counts or infer that all exits finished.

For Withdraw Tokens, missing `result.stop` means no related Stop progress is
provided. A successful Stop itself includes its exact parent; if that required
object is missing, show an incomplete-result error and allow another status check.

The exact Stop parent can remain present while its progress is unavailable.
Missing or slow optional progress does not turn an independently verified
`SUCCEEDED` result into failure. Stop success proves the pause or accepted
settings; it does not mean every selected position has been sold. Likewise,
Withdraw Tokens success does not prove that the account has no remaining tokens.

Use `nextStep` only after `SUCCEEDED`. Values have the
`SUBMITTED_ACTION_NEXT_STEP_` prefix:

| Value | Continuation |
| --- | --- |
| `PREPARE_START_COPY` | Prepare Start Copy with the original request UUID and inputs to determine the remaining stage. Submit only a newly reviewed executable call. |
| `CHECK_WITHDRAWAL_REMAINDER` | Prepare a fresh Withdraw Tokens batch to check the remaining eligible balances. Don't replay the successful batch. |
| `UNSPECIFIED` | No preparation continuation is specified. Refresh the resources in `result`; related Stop progress can still be pending. |

A wrapped outer success is insufficient without exact target effects. Unsupported
wrapped reverts remain `UNKNOWN`, with outer receipt outcome shown separately.
Every poll can revise an earlier result. Treat responses as `no-store` and
keep the operation identity so you can check it again after reopening the view.
For request errors, use [Error handling](#error-handling).

Status error guidance always refers to checking the original hash and context.
An HTTP error, including cancellation of the status request, does not establish
failure or cancellation of the transaction.

Use the **Action Status** operation in the generated
[OpenAPI contract](https://github.com/KyberNetwork/copy-trade-api/blob/885cf82a4f208b03fe6f0e61007bbb6c726657d0/proto/gen/openapi/aggregate/v1/aggregate.swagger.yaml)
for context, display, receipt, result, and read-metadata fields, including
`resultMode`, `creationTransactionHash`, `receiptResult`, and `pendingActions`.

### Refresh targets after success

Use [Related fields and reads by action](#related-fields-and-reads-by-action)
and the action-specific flows below. Refresh
only visible resources and invalidate other affected client cache entries for
their next use. Coalesce refreshes that need the same endpoint and filters.

Use `result.readOwnerAddress` for owner-scoped historical links when supplied,
and the resource IDs returned by the status response. This read owner can
differ from the actor of the transaction. It does not replace the expected
owner in the saved status context or a future preparation request.

### Action UI flows

These flows cover all eight submitted action kinds. Enum values in prose omit
their common prefixes; JSON fragments retain the full wire values. Success
labels are UI suggestions. Translate them without using message text as a
control-flow key.

#### Read exact effects without counting them twice

Both `receiptResult.effects[]` and `result.effects[]` contain typed effects.
Select the populated payload (`create`, `transfer`, `pause`,
`liquidationConfig`, `withdrawQuote`, or `sell`), not a fixed array index.
Effects are ordered by receipt log position. Several effects can describe the
same movement, so their amounts are not independent amounts to sum.

| Action | Effect to present | Amount or meaning |
| --- | --- | --- |
| CREATE | `create`; funded creation also has a matching `transfer` | `create.createAmountRaw` is the call's creation funding, not the run's full opening allocation. Use optional `result.openingAllocationRaw` for the verified opening allocation. Never add the create and transfer amounts together. |
| FUND / Add Capital | `transfer` | Display `token`, `from`, `to`, and `amountRaw` for this credit. |
| Stop Copy | `pause`; selected Stop also includes `liquidationConfig` | The pause/settings took effect. These effects are not receipts for the downstream position sales. |
| Withdraw Quote | `withdrawQuote`; positive withdrawals also have a corroborating `transfer` | Display `withdrawQuote.token`, `recipient`, and actual `amountRaw` once. Do not add the corroborating transfer. |
| Withdraw Tokens | `pause`, the included quote withdrawal, and selected token transfers | Display the quote movement once and each nonquote `transfer.amountRaw` with its token and recipient. Do not sum different tokens into a raw amount or USD total. |
| Manual Sell / Close Position | `sell` | Display `baseSoldRaw`, `baseUnsoldRaw`, and `quoteReceivedRaw` using the matching position's base/quote token metadata. These are the exact sale quantities, not the preparation's swap estimate. |

Keep decimal strings or arbitrary-precision integers throughout formatting.
An unavailable token symbol or USD price does not invalidate an exact raw
effect. Use an address label, and show the raw amount until matching decimals
are known. Never guess decimals or treat the maximum-withdrawal sentinel as an
amount received. The API verifies the expected effects; the UI does not need
to rebuild the receipt matcher or repeat historical RPC validation.

#### Start Copy CREATE

1. Prepare Start Copy with the original request UUID, selected generation,
   target capital, and funding mode. Submit only its executable CREATE call.
2. Show **Copy account created · Confirming** when `receiptResult` arrives.
   Allow dismissal and open the returned `display.copyRunId` under
   `display.readOwnerAddress` when available.
3. Fetch the owner list and new-run detail. An absent detail `data` with a
   pending CREATE descriptor means **Creating copy-run view · Syncing**. Once
   a row is returned, render it and its capital/portfolio quality independently.
4. On `SUCCEEDED` with `PREPARE_START_COPY`, prepare again with the same UUID
   and original inputs. `COMPLETED/COMPLETE` finishes the flow;
   `PARTIALLY_COMPLETED/FUNDING_REQUIRED` asks for a separately reviewed FUND.

The exact CREATE funding amount is not automatically the run's complete opening
allocation. Use returned `openingAllocationRaw` when supplied; never add
CREATE and transfer effects as two credits.

#### Start Copy FUND

1. Submit the newly prepared FUND call and keep its hash separate from CREATE.
2. Show **Capital added · Confirming** from the verified transfer in
   `receiptResult`; the user can close the dialog and visit the run page.
3. Fetch run detail/list and owner/account data. Capital In can show a usable
   old value with **Syncing**, a provisional updated value, or a syncing
   placeholder. Render exactly what that GET and its metadata describe.
4. On `SUCCEEDED`, follow `PREPARE_START_COPY` using the original flow UUID.
   Complete the flow when preparation returns `COMPLETED/COMPLETE`.

#### Add Capital

1. Submit the prepared call. Show the exact verified token amount from
   `receiptResult` and allow dismissal.
2. Invalidate the run, owner/account totals, and visible wallet/history caches;
   fetch again immediately. Each GET carries its own pending state.
3. Retain an available stale Capital In number with **Syncing**. Replace it
   with the server's new number as responses update; never add the receipt
   amount to the previous total. A page reload follows the same GET behavior.
4. Complete the call on `SUCCEEDED`. Missing optional prices or P&L do not
   require keeping the transaction dialog open.

#### Stop Copy

1. Show **Copy stop accepted · Confirming** from the verified pause/settings.
2. Refresh run detail, current Open/History lists, positions, and summaries.
   Render lifecycle from those responses and show syncing from their metadata.
3. A run can remain `CLOSING` in Open while exits continue. Use returned
   `stopCopyProgress` or `result.stop` with its own status for child progress.
4. Offer subsequent actions through fresh preparation. Stop success is not a
   withdrawal and does not prove every selected position was sold.

#### Withdraw Quote

1. Show the actual `withdrawQuote.amountRaw` from `receiptResult`, including a
   successful maximum withdrawal of zero. The preparation sentinel is not the
   amount received.
2. Refresh run detail/list, account/owner data, wallet, and visible history.
   Capital Out can update separately from the wallet or portfolio.
3. Render the card's existing Amount Out semantics; do not equate a closed
   run's quote still held with an on-chain withdrawal. The run can stay active.

#### Withdraw Tokens

1. Show the verified pause and each token movement from `receiptResult` for
   this atomic batch. A positive quote withdrawal is displayed once, without
   also counting its corroborating transfer.
2. Refresh run detail/list, wallet inventory, positions, summaries, and history.
   Wallet quantities and USD values have their own source/price quality.
3. A batch without quote movement does not create Capital Out. A successful
   batch does not prove every token, native asset, or unrelated airdrop is gone.
4. On `SUCCEEDED` and `CHECK_WITHDRAWAL_REMAINDER`, prepare again to discover
   remaining eligible balances. Review a new batch; never replay the old one.

#### Manual Sell

1. Show exact `baseSoldRaw`, `baseUnsoldRaw`, and `quoteReceivedRaw` from the
   verified `sell` effect, using the position's token identities.
2. Refresh the position list, closed executions, pending-sell obligations,
   run detail, wallet, and visible history. Use each response's pending quality.
3. Quantity can update while fees, rebates, and P&L remain syncing. A nonzero
   residual is a successful partial sale; do not mark the position closed.
4. Refresh preparation before another sale. Received quote stays inside the
   copy account and is not a withdrawal or Capital Out.

#### Close Position

1. Show the verified full-residual sale from `receiptResult` and allow dismissal.
2. Refresh the same reads as Manual Sell. Render the affected position's
   lifecycle and list membership from the server; financial settlement can lag.
3. Complete this call on `SUCCEEDED`. An active copy run stays active unless
   its own lifecycle response changes. Closing one position is not Stop Copy
   and does not withdraw its quote to the owner.

### Start Copy with funding walkthrough

This example uses a $5 target in a six-decimal quote token. It illustrates
possible response ordering, not required intermediate polls or a time promise.
Apply the latest response directly when states arrive together or are skipped.

| Observation | Dialog or operation card | Copy-run list/detail | Capital In and other metrics |
| --- | --- | --- | --- |
| Wallet returns CREATE hash; no verified receipt effect yet | **Creating copy account · Pending** | Keep a distinct local pending card; use the server's existing list | Keep existing values qualified; no invented new run or $5 total |
| CREATE `receiptResult` arrives | **Copy account created · Confirming** or **Data syncing**; allow dismissal | Resolve/open the run when its IDs and lifecycle data are available | Show exact creation funding separately; totals can still be syncing |
| The detail/list GET returns the new row | Preserve the verified call state | Start fresh detail/list requests; display the returned row, even while financial fields lag | Render a usable provisional Capital In or a syncing placeholder |
| CREATE becomes `SUCCEEDED` | Complete the CREATE stage and follow `PREPARE_START_COPY` | Keep the run visible | Do not delay continuation for portfolio value or AUM |
| Funded CREATE's next preparation is `COMPLETED/COMPLETE` | **Copy started**; no FUND transaction needed | Continue normal view updates | Capital In can still have projection `SYNCING`; preserve its number and qualifiers when usable |
| Unfunded CREATE's next preparation is `PARTIALLY_COMPLETED/FUNDING_REQUIRED` with a FUND call | Ask the user to review the separate funding call | The created run remains visible | A CREATE-proven zero does not clear the new FUND operation's syncing indicator |
| FUND `receiptResult` reports transfer `amountRaw = "5000000"` | **Initial funding received · Confirming** or **Data syncing**; show 5 quote tokens | Keep the existing run | Old Capital In can remain visible as last known; receipt amount is not a replacement cumulative USD total |
| FUND is reflected in the run GET | Keep provisional/completed call label according to submitted status | Refetch the detail/list for that operation | Show the returned updated Capital In; owner portfolio and AUM can remain syncing |
| FUND is `SUCCEEDED`; continued preparation is `COMPLETED/COMPLETE` | **Copy started** | Run remains available | Finish visible refreshes independently; no blocking spinner for remaining metrics |

Here is a valid **copy-run detail response fragment** while Capital In has a
usable provisional value. Unrelated fields are omitted for clarity:

```json
{
  "data": {
    "copyRunId": "run_1",
    "status": "COPY_RUN_STATUS_ACTIVE",
    "capitalInUsd": {
      "value": "5",
      "status": "METRIC_STATUS_CURRENT"
    },
    "capitalInProjectionStatus": "CAPITAL_IN_PROJECTION_STATUS_SYNCING"
  },
  "meta": {
    "fieldQualities": [
      {
        "group": "FIELD_GROUP_CAPITAL",
        "finality": "DATA_FINALITY_PROVISIONAL"
      }
    ]
  }
}
```

Render **$5 · Provisional · Syncing** from that fragment. It contains no
submitted-action status. Keep the field syncing while its projection or GET
field-group quality is pending. A completed GET alone does not clear that
indicator. The backend removes the action's pending effect after adoption;
ordinary projection and quality fields then determine what remains syncing or
unavailable. Later projection `READY` does not erase a provisional finality
qualifier.

If Capital In is `UNAVAILABLE` with no value, render **Syncing** while its
projection or field-group quality says work is pending. If the read reports unavailable
evidence without a pending signal, render an unavailable value and a refresh
control. Neither case prevents showing the verified creation/funding effect.

## Action response examples

Use these examples as offline fixtures for parsing, rendering, and state-transition
tests. The examples use the public protobuf JSON field names.
Addresses, IDs, balances, hashes,
and timestamps are synthetic examples, not values to hard-code in the client.

The `READY` examples contain selector-only mock calldata. They deliberately
do not contain usable transactions or signatures. Use a mocked wallet in fixture
tests; obtain the complete call from preparation for a real submission. For
expiry tests, set the fixture clock relative to `preparedAt` and
`reprepareAfter` instead of changing the production expiry checks.

Each block is a complete example object or HTTP body, as labeled. Different
responses can omit additional optional fields as described in
[Action response field rules](#action-response-field-rules).

<details>
<summary>Advisory: offer a live preparation check</summary>

This is the complete advisory object, for example `data.addCapitalAvailability` in a copy-run response. It is not a preparation or a top-level response envelope.

<!-- fe-response-example: advisory_try_prepare -->
```json
{
  "status": "ADVISORY_ACTION_STATUS_TRY_PREPARE",
  "reason": "PREPARED_ACTION_REASON_SOURCE_STALE",
  "asOf": "2026-09-14T09:36:22Z",
  "guidance": {
    "message": "Required account or position details are still being verified. Retry shortly; independent actions can be checked separately.",
    "retryAfterMs": 2000,
    "nextSteps": [
      {
        "kind": "ACTION_GUIDANCE_STEP_KIND_RETRY",
        "label": "Retry preparation"
      }
    ]
  }
}
```

</details>

<details>
<summary>Add Capital: ready while display enrichment is unavailable</summary>

HTTP 200 from `:prepareAddCapital` with `{"amountRaw": "9"}`. Render missing
allocation estimates as unavailable. The authoritative amount, wallet balance,
call, and status context remain present. Do not disable submission because
`displayEnrichment.status` is unavailable; still apply the normal wallet and
expiry checks.

<!-- fe-response-example: add_ready_display_unavailable -->
```json
{
  "data": {
    "status": "PREPARED_ACTION_STATUS_READY",
    "generationId": "example-v1",
    "chainId": "8453",
    "expectedAccount": "0x1111111111111111111111111111111111111111",
    "preparedAt": "2026-09-14T09:36:22Z",
    "reprepareAfter": "2026-09-14T09:36:52Z",
    "call": {
      "kind": "PREPARED_CALL_KIND_ADD_CAPITAL",
      "to": "0x3333333333333333333333333333333333333333",
      "data": "0xa9059cbb",
      "valueRaw": "0"
    },
    "evidence": {
      "actionBlock": {
        "blockNumber": "200",
        "blockHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "blockTime": "2026-09-14T09:36:22Z"
      }
    },
    "copyAccount": "0x2222222222222222222222222222222222222222",
    "guidance": {
      "message": "The transaction is ready. Some display estimates or token details are unavailable; the verified call is unchanged."
    },
    "statusContext": {
      "kind": "ACTION_TRANSACTION_KIND_ADD_CAPITAL",
      "chainId": "8453",
      "expectedOwner": "0x1111111111111111111111111111111111111111",
      "copyAccount": "0x2222222222222222222222222222222222222222",
      "factory": "0x4444444444444444444444444444444444444444",
      "generationId": "example-v1",
      "callTarget": "0x3333333333333333333333333333333333333333",
      "callValueRaw": "0",
      "calldataDigest": "0xabce0605a16ff5e998983a0af570b8ad942bb11e305eb20ae3ada0a3be24eb97",
      "transfer": {
        "token": "0x3333333333333333333333333333333333333333",
        "amountRaw": "9"
      },
      "copyRunId": "run_1"
    },
    "displayEnrichment": {
      "status": "ACTION_DISPLAY_ENRICHMENT_STATUS_UNAVAILABLE",
      "unavailableReason": "ACTION_DISPLAY_ENRICHMENT_UNAVAILABLE_REASON_BUDGET_EXHAUSTED"
    },
    "addCapital": {
      "quoteToken": {
        "chainId": "8453",
        "address": "0x3333333333333333333333333333333333333333",
        "symbol": "USDC",
        "name": "USDC",
        "decimals": 6
      },
      "addedCapitalRaw": "9",
      "minimumAddCapitalRaw": "1",
      "walletQuoteBalance": {
        "valueRaw": "9",
        "status": "METRIC_STATUS_CURRENT"
      },
      "currentAllocatedCapital": {
        "status": "METRIC_STATUS_UNAVAILABLE"
      },
      "newAllocatedCapital": {
        "status": "METRIC_STATUS_UNAVAILABLE"
      }
    }
  }
}
```

</details>

<details>
<summary>Manual Sell: review quantities before requesting a call</summary>

HTTP 200 from `:prepareManualSell` with only `{"slippageBps": 125}`. Show the returned sell amount and skip count. No `call` or `statusContext` is returned, and unavailable quote metrics have no `valueRaw`.

<!-- fe-response-example: manual_review -->
```json
{
  "data": {
    "status": "PREPARED_ACTION_STATUS_PENDING",
    "generationId": "example-v1",
    "chainId": "8453",
    "expectedAccount": "0x1111111111111111111111111111111111111111",
    "preparedAt": "2026-09-14T09:36:22Z",
    "reprepareAfter": "2026-09-14T09:36:52Z",
    "reason": "PREPARED_ACTION_REASON_REVIEW_REQUIRED",
    "evidence": {
      "actionBlock": {
        "blockNumber": "200",
        "blockHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "blockTime": "2026-09-14T09:36:22Z"
      }
    },
    "copyAccount": "0x2222222222222222222222222222222222222222",
    "guidance": {
      "message": "Review the current sell amount and skipped-sale count before preparing this sale.",
      "nextSteps": [
        {
          "kind": "ACTION_GUIDANCE_STEP_KIND_REVIEW_UPDATED_PREPARATION",
          "label": "Review updated sell details"
        }
      ]
    },
    "displayEnrichment": {
      "status": "ACTION_DISPLAY_ENRICHMENT_STATUS_NOT_APPLICABLE"
    },
    "manualSell": {
      "context": "POSITION_SELL_CONTEXT_ALIGN_SKIP",
      "userPositionId": "position_1",
      "tradeId": "trade_1",
      "baseToken": {
        "chainId": "8453",
        "address": "0x4444444444444444444444444444444444444444",
        "symbol": "WETH",
        "name": "WETH",
        "decimals": 18
      },
      "quoteToken": {
        "chainId": "8453",
        "address": "0x3333333333333333333333333333333333333333",
        "symbol": "USDC",
        "name": "USDC",
        "decimals": 6
      },
      "remainingBaseBefore": {
        "valueRaw": "100",
        "status": "METRIC_STATUS_CURRENT"
      },
      "sellBase": {
        "valueRaw": "50",
        "status": "METRIC_STATUS_CURRENT"
      },
      "upfrontFeeReleasedBase": {
        "valueRaw": "5",
        "status": "METRIC_STATUS_CURRENT"
      },
      "sellRatioRaw": "500000000000000000",
      "unresolvedSkipCount": 1,
      "cashback": {
        "status": "METRIC_STATUS_UNAVAILABLE"
      },
      "swapQuote": {
        "expectedQuote": {
          "status": "METRIC_STATUS_UNAVAILABLE"
        },
        "minimumQuote": {
          "status": "METRIC_STATUS_UNAVAILABLE"
        }
      }
    }
  }
}
```

</details>

<details>
<summary>Manual Sell: executable response shape</summary>

HTTP 200 after the user reviews the quantities and sends `{"slippageBps": 125, "expectedUnresolvedSkipCount": 1, "expectedSellRatioRaw": "500000000000000000"}`. Store `data.statusContext` before opening the wallet. `reason`, `warnings`, and `guidance.nextSteps` are omitted here because their values are default or empty.

<!-- fe-response-example: manual_ready -->
```json
{
  "data": {
    "status": "PREPARED_ACTION_STATUS_READY",
    "generationId": "example-v1",
    "chainId": "8453",
    "expectedAccount": "0x1111111111111111111111111111111111111111",
    "preparedAt": "2026-09-14T09:36:22Z",
    "reprepareAfter": "2026-09-14T09:36:52Z",
    "call": {
      "kind": "PREPARED_CALL_KIND_MANUAL_SELL",
      "to": "0x2222222222222222222222222222222222222222",
      "data": "0x322734ad",
      "valueRaw": "0"
    },
    "evidence": {
      "actionBlock": {
        "blockNumber": "200",
        "blockHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "blockTime": "2026-09-14T09:36:22Z"
      }
    },
    "copyAccount": "0x2222222222222222222222222222222222222222",
    "guidance": {
      "message": "The preparation is ready for review."
    },
    "statusContext": {
      "kind": "ACTION_TRANSACTION_KIND_MANUAL_SELL",
      "chainId": "8453",
      "expectedOwner": "0x1111111111111111111111111111111111111111",
      "copyAccount": "0x2222222222222222222222222222222222222222",
      "factory": "0x4444444444444444444444444444444444444444",
      "generationId": "example-v1",
      "callTarget": "0x2222222222222222222222222222222222222222",
      "callValueRaw": "0",
      "calldataDigest": "0xb7deb36b2641a26aa35ec231fa3a5fe7d348e58f43a9194b20813def46ff9e50",
      "sell": {
        "followerPositionId": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "leaderPositionId": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "recovery": "ACTION_TRANSACTION_SELL_RECOVERY_ALIGN_SKIP",
        "baseToken": "0x4444444444444444444444444444444444444444",
        "quoteToken": "0x3333333333333333333333333333333333333333",
        "sellBaseRaw": "50",
        "remainingBaseBeforeRaw": "100",
        "sellRatioRaw": "500000000000000000",
        "unresolvedSkipCount": 1
      },
      "copyRunId": "run_1",
      "userPositionId": "position_1"
    },
    "displayEnrichment": {
      "status": "ACTION_DISPLAY_ENRICHMENT_STATUS_COMPLETE"
    },
    "manualSell": {
      "context": "POSITION_SELL_CONTEXT_ALIGN_SKIP",
      "userPositionId": "position_1",
      "tradeId": "trade_1",
      "baseToken": {
        "chainId": "8453",
        "address": "0x4444444444444444444444444444444444444444",
        "symbol": "WETH",
        "name": "WETH",
        "decimals": 18
      },
      "quoteToken": {
        "chainId": "8453",
        "address": "0x3333333333333333333333333333333333333333",
        "symbol": "USDC",
        "name": "USDC",
        "decimals": 6
      },
      "remainingBaseBefore": {
        "valueRaw": "100",
        "status": "METRIC_STATUS_CURRENT"
      },
      "sellBase": {
        "valueRaw": "50",
        "status": "METRIC_STATUS_CURRENT"
      },
      "upfrontFeeReleasedBase": {
        "valueRaw": "5",
        "status": "METRIC_STATUS_CURRENT"
      },
      "sellRatioRaw": "500000000000000000",
      "unresolvedSkipCount": 1,
      "cashback": {
        "valueRaw": "1",
        "status": "METRIC_STATUS_CURRENT"
      },
      "swapQuote": {
        "expectedQuote": {
          "valueRaw": "25",
          "status": "METRIC_STATUS_CURRENT"
        },
        "minimumQuote": {
          "valueRaw": "24",
          "status": "METRIC_STATUS_CURRENT"
        },
        "effectiveSlippageBps": 125
      }
    }
  }
}
```

</details>

<details>
<summary>Manual Sell: no route is a normal response</summary>

HTTP 200 for the same preparation request when no route can be prepared. No `call` or `statusContext` is returned. Keep the selection, display `data.guidance.message`, and offer a preparation retry after the returned delay. Close Position uses the same status and reason with a `closePosition` preview.

<!-- fe-response-example: manual_no_route -->
```json
{
  "data": {
    "status": "PREPARED_ACTION_STATUS_UNAVAILABLE",
    "generationId": "example-v1",
    "chainId": "8453",
    "expectedAccount": "0x1111111111111111111111111111111111111111",
    "preparedAt": "2026-09-14T09:36:22Z",
    "reprepareAfter": "2026-09-14T09:36:52Z",
    "reason": "PREPARED_ACTION_REASON_NO_EXECUTABLE_ROUTE",
    "evidence": {
      "actionBlock": {
        "blockNumber": "200",
        "blockHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "blockTime": "2026-09-14T09:36:22Z"
      }
    },
    "copyAccount": "0x2222222222222222222222222222222222222222",
    "guidance": {
      "message": "No executable sale route is available now. Refresh the quote or review the amount and slippage.",
      "retryAfterMs": 2000,
      "nextSteps": [
        {
          "kind": "ACTION_GUIDANCE_STEP_KIND_RETRY",
          "label": "Retry preparation"
        }
      ]
    },
    "displayEnrichment": {
      "status": "ACTION_DISPLAY_ENRICHMENT_STATUS_NOT_APPLICABLE"
    },
    "manualSell": {
      "context": "POSITION_SELL_CONTEXT_ALIGN_SKIP",
      "userPositionId": "position_1",
      "tradeId": "trade_1",
      "baseToken": {
        "chainId": "8453",
        "address": "0x4444444444444444444444444444444444444444",
        "symbol": "WETH",
        "name": "WETH",
        "decimals": 18
      },
      "quoteToken": {
        "chainId": "8453",
        "address": "0x3333333333333333333333333333333333333333",
        "symbol": "USDC",
        "name": "USDC",
        "decimals": 6
      },
      "remainingBaseBefore": {
        "valueRaw": "100",
        "status": "METRIC_STATUS_CURRENT"
      },
      "sellBase": {
        "valueRaw": "50",
        "status": "METRIC_STATUS_CURRENT"
      },
      "upfrontFeeReleasedBase": {
        "valueRaw": "5",
        "status": "METRIC_STATUS_CURRENT"
      },
      "sellRatioRaw": "500000000000000000",
      "unresolvedSkipCount": 1,
      "cashback": {
        "status": "METRIC_STATUS_UNAVAILABLE"
      },
      "swapQuote": {
        "expectedQuote": {
          "status": "METRIC_STATUS_UNAVAILABLE"
        },
        "minimumQuote": {
          "status": "METRIC_STATUS_UNAVAILABLE"
        }
      }
    }
  }
}
```

</details>

<details>
<summary>Status: Add Capital is verified while totals are syncing</summary>

HTTP 200. Show **Capital added · Confirming** from `receiptResult` and let the
user dismiss the dialog. Format the transfer amount using the matching token's
known decimals. Display Capital In as **Syncing**: this response has no updated
USD total. Continue observation after the returned interval without keeping
transaction progress blocking. There is no `result` or `nextStep` yet.

<!-- fe-response-example: status_receipt_confirming_display_syncing -->
```json
{
  "data": {
    "status": "SUBMITTED_ACTION_STATUS_CONFIRMING",
    "reason": "SUBMITTED_ACTION_REASON_CONFIRMATIONS_PENDING",
    "transaction": {
      "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "outcome": "ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS",
      "receipt": {
        "blockNumber": "201",
        "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      },
      "safeBlockNumber": "200"
    },
    "receiptResult": {
      "kind": "ACTION_TRANSACTION_KIND_ADD_CAPITAL",
      "chainId": "8453",
      "factory": "0x4444444444444444444444444444444444444444",
      "generationId": "example-v1",
      "copyAccount": "0x2222222222222222222222222222222222222222",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111",
      "effects": [
        {
          "cursor": {
            "blockNumber": "201",
            "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "logIndex": 1,
            "blockTime": "2026-10-05T08:47:49Z"
          },
          "emitter": "0x3333333333333333333333333333333333333333",
          "transfer": {
            "token": "0x3333333333333333333333333333333333333333",
            "from": "0x1111111111111111111111111111111111111111",
            "to": "0x2222222222222222222222222222222222222222",
            "amountRaw": "1000000"
          }
        }
      ]
    },
    "display": {
      "status": "SUBMITTED_ACTION_DISPLAY_STATUS_SYNCING",
      "reason": "SUBMITTED_ACTION_REASON_RESULT_PUBLICATION",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111"
    },
    "guidance": {
      "message": "The exact action result is ready to show provisionally. Public data and final confirmation continue updating.",
      "retryAfterMs": 5000
    }
  }
}
```

</details>

<details>
<summary>Status: a reverted receipt still needs confirmation</summary>

HTTP 200 from `actions:status`. The receipt says `REVERTED`, but the action status is still `CONFIRMING`. Show both facts and keep polling. Do not offer automatic resubmission.

<!-- fe-response-example: status_confirming_revert -->
```json
{
  "data": {
    "status": "SUBMITTED_ACTION_STATUS_CONFIRMING",
    "reason": "SUBMITTED_ACTION_REASON_CONFIRMATIONS_PENDING",
    "transaction": {
      "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "outcome": "ACTION_TRANSACTION_RECEIPT_OUTCOME_REVERTED",
      "receipt": {
        "blockNumber": "201",
        "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      },
      "safeBlockNumber": "200"
    },
    "guidance": {
      "message": "The transaction was mined and is waiting for the required confirmations. Its observed receipt result is shown separately.",
      "retryAfterMs": 2000
    },
    "display": {
      "status": "SUBMITTED_ACTION_DISPLAY_STATUS_PENDING",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111"
    }
  }
}
```

</details>

<details>
<summary>Status: the effect is verified while its result is being repaired</summary>

HTTP 200. This response has no `receiptResult` or `result` and its display is `PENDING`. Show **Updating result**, clear any earlier action-specific display values, and poll at `guidance.retryAfterMs`. Other responses with the same reason can have display `READY`; always use the returned fields.

<!-- fe-response-example: status_syncing_repair -->
```json
{
  "data": {
    "status": "SUBMITTED_ACTION_STATUS_SYNCING",
    "reason": "SUBMITTED_ACTION_REASON_REPAIR_IN_PROGRESS",
    "transaction": {
      "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "outcome": "ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS",
      "receipt": {
        "blockNumber": "201",
        "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      },
      "safeBlockNumber": "202"
    },
    "guidance": {
      "message": "The transaction's effect is verified. We are rechecking its result after a data correction.",
      "retryAfterMs": 2000
    },
    "display": {
      "status": "SUBMITTED_ACTION_DISPLAY_STATUS_PENDING",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111"
    }
  }
}
```

</details>

<details>
<summary>Status: Add Capital is ready to show while the action is syncing</summary>

HTTP 200. Display Capital In as 21 with a provisional label. It already includes this deposit: do not add the local deposit delta again. Show the receipt result immediately and let the user dismiss the dialog. Refresh the named copy run and continue status polling in the background; `result` and `nextStep` remain absent.

<!-- fe-response-example: status_syncing_display_ready -->
```json
{
  "data": {
    "status": "SUBMITTED_ACTION_STATUS_SYNCING",
    "reason": "SUBMITTED_ACTION_REASON_SOURCE_INDEXING",
    "transaction": {
      "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "outcome": "ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS",
      "receipt": {
        "blockNumber": "201",
        "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      },
      "safeBlockNumber": "202"
    },
    "display": {
      "status": "SUBMITTED_ACTION_DISPLAY_STATUS_READY",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111",
      "capitalInUsd": {
        "value": "21",
        "status": "METRIC_STATUS_CURRENT",
        "asOf": "2026-09-22T08:47:49Z"
      },
      "finality": "DATA_FINALITY_PROVISIONAL"
    },
    "guidance": {
      "message": "The exact action result is ready to show provisionally. Public data and final confirmation continue updating.",
      "retryAfterMs": 5000
    },
    "receiptResult": {
      "kind": "ACTION_TRANSACTION_KIND_ADD_CAPITAL",
      "chainId": "8453",
      "factory": "0x4444444444444444444444444444444444444444",
      "generationId": "example-v1",
      "copyAccount": "0x2222222222222222222222222222222222222222",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111",
      "effects": [
        {
          "cursor": {
            "blockNumber": "201",
            "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "logIndex": 1,
            "blockTime": "2026-09-22T08:47:49Z"
          },
          "emitter": "0x3333333333333333333333333333333333333333",
          "transfer": {
            "token": "0x3333333333333333333333333333333333333333",
            "from": "0x1111111111111111111111111111111111111111",
            "to": "0x2222222222222222222222222222222222222222",
            "amountRaw": "1000000"
          }
        }
      ]
    }
  }
}
```

</details>

<details>
<summary>Status: Add Capital succeeded but its updated total is not ready</summary>

HTTP 200. Show this call as completed using `result`. The updated public total is not verified yet: no capital metric is supplied in `display`. Keep polling at the returned interval while the view waits for that total.

<!-- fe-response-example: status_success_display_pending -->
```json
{
  "data": {
    "status": "SUBMITTED_ACTION_STATUS_SUCCEEDED",
    "transaction": {
      "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "outcome": "ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS",
      "receipt": {
        "blockNumber": "201",
        "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      },
      "safeBlockNumber": "202"
    },
    "result": {
      "kind": "ACTION_TRANSACTION_KIND_ADD_CAPITAL",
      "copyAccount": "0x2222222222222222222222222222222222222222",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111",
      "effects": [
        {
          "cursor": {
            "blockNumber": "201",
            "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "logIndex": 1,
            "blockTime": "2026-09-22T08:47:49Z"
          },
          "emitter": "0x3333333333333333333333333333333333333333",
          "transfer": {
            "token": "0x3333333333333333333333333333333333333333",
            "from": "0x1111111111111111111111111111111111111111",
            "to": "0x2222222222222222222222222222222222222222",
            "amountRaw": "1000000"
          }
        }
      ],
      "chainId": "8453",
      "factory": "0x4444444444444444444444444444444444444444",
      "generationId": "example-v1"
    },
    "display": {
      "status": "SUBMITTED_ACTION_DISPLAY_STATUS_PENDING",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111"
    },
    "guidance": {
      "message": "This submitted call completed. Any remaining funding, exits, or withdrawal batches are shown separately. Its display data is still updating.",
      "retryAfterMs": 2000
    }
  }
}
```

</details>

<details>
<summary>Status: withdrawal Capital Out is ready while strict status is syncing</summary>

HTTP 200. Capital Out includes the exact positive quote withdrawal. Render 5 with its stale qualifier; finality is separate from freshness. This does not promise a refreshed wallet balance. Keep polling for strict success.

<!-- fe-response-example: status_withdrawal_display_ready -->
```json
{
  "data": {
    "status": "SUBMITTED_ACTION_STATUS_SYNCING",
    "reason": "SUBMITTED_ACTION_REASON_SOURCE_INDEXING",
    "transaction": {
      "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "outcome": "ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS",
      "receipt": {
        "blockNumber": "201",
        "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      },
      "safeBlockNumber": "202"
    },
    "display": {
      "status": "SUBMITTED_ACTION_DISPLAY_STATUS_READY",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111",
      "capitalOutUsd": {
        "value": "5",
        "status": "METRIC_STATUS_STALE",
        "asOf": "2026-09-22T08:47:49Z"
      },
      "finality": "DATA_FINALITY_FINAL"
    },
    "guidance": {
      "message": "Your updated data is ready to show. The submitted action's final result is still syncing.",
      "retryAfterMs": 2000
    }
  }
}
```

</details>

<details>
<summary>Status: partial Manual Sell succeeded</summary>

HTTP 200. The exact sale completed with 50 raw base units remaining. Refresh the position and obligations. The omitted `reason` and `nextStep` mean `UNSPECIFIED`; they do not make the response incomplete.

<!-- fe-response-example: status_success -->
```json
{
  "data": {
    "status": "SUBMITTED_ACTION_STATUS_SUCCEEDED",
    "transaction": {
      "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "outcome": "ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS",
      "receipt": {
        "blockNumber": "201",
        "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      },
      "safeBlockNumber": "202",
      "verifiedActor": "0x1111111111111111111111111111111111111111"
    },
    "result": {
      "kind": "ACTION_TRANSACTION_KIND_MANUAL_SELL",
      "copyAccount": "0x2222222222222222222222222222222222222222",
      "copyRunId": "run_1",
      "userPositionId": "position_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111",
      "effects": [
        {
          "cursor": {
            "blockNumber": "201",
            "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "logIndex": 1,
            "blockTime": "2026-09-14T09:36:23Z"
          },
          "emitter": "0x2222222222222222222222222222222222222222",
          "sell": {
            "leaderPositionId": "0x2222222222222222222222222222222222222222222222222222222222222222",
            "actor": "0x1111111111111111111111111111111111111111",
            "baseSoldRaw": "50",
            "baseUnsoldRaw": "50",
            "quoteReceivedRaw": "24"
          }
        }
      ],
      "chainId": "8453",
      "factory": "0x4444444444444444444444444444444444444444",
      "generationId": "example-v1"
    },
    "guidance": {
      "message": "This submitted call completed. Any remaining funding, exits, or withdrawal batches are shown separately."
    },
    "display": {
      "status": "SUBMITTED_ACTION_DISPLAY_STATUS_READY",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111",
      "finality": "DATA_FINALITY_PROVISIONAL",
      "userPositionId": "position_1"
    }
  }
}
```

</details>

<details>
<summary>Status: the matched transaction failed</summary>

HTTP 200. The confirmed direct transaction reverted. `result` is absent. Review a fresh preparation before deciding whether to make a new submission.

<!-- fe-response-example: status_failed -->
```json
{
  "data": {
    "status": "SUBMITTED_ACTION_STATUS_FAILED",
    "reason": "SUBMITTED_ACTION_REASON_TRANSACTION_REVERTED",
    "transaction": {
      "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "outcome": "ACTION_TRANSACTION_RECEIPT_OUTCOME_REVERTED",
      "receipt": {
        "blockNumber": "201",
        "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      },
      "safeBlockNumber": "202",
      "verifiedActor": "0x1111111111111111111111111111111111111111"
    },
    "guidance": {
      "message": "The matched transaction reverted. Refresh the action before deciding whether to submit a new transaction.",
      "nextSteps": [
        {
          "kind": "ACTION_GUIDANCE_STEP_KIND_REVIEW_UPDATED_PREPARATION",
          "label": "Review a fresh preparation"
        }
      ]
    },
    "display": {
      "status": "SUBMITTED_ACTION_DISPLAY_STATUS_PENDING",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111"
    }
  }
}
```

</details>

<details>
<summary>Status: evidence is temporarily unavailable</summary>

HTTP 200. This is an `UNKNOWN` observation, not an HTTP dependency error or a failed transaction. Keep the operation and retry observation after the returned delay.

<!-- fe-response-example: status_source_unavailable -->
```json
{
  "data": {
    "status": "SUBMITTED_ACTION_STATUS_UNKNOWN",
    "reason": "SUBMITTED_ACTION_REASON_SOURCE_UNAVAILABLE",
    "transaction": {
      "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "safeBlockNumber": "0"
    },
    "guidance": {
      "message": "The chain evidence could not be read right now. This does not mean the transaction failed. Retry shortly.",
      "retryAfterMs": 5000
    },
    "display": {
      "status": "SUBMITTED_ACTION_DISPLAY_STATUS_PENDING",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111"
    }
  }
}
```

</details>

<details>
<summary>Status: a previously observed receipt was invalidated</summary>

HTTP 200. Replace the previous observation with this response, including removal of its receipt, result, and previous ready display values. Keep the submitted hash and original context for the next poll.

<!-- fe-response-example: status_reorged -->
```json
{
  "data": {
    "status": "SUBMITTED_ACTION_STATUS_PENDING",
    "reason": "SUBMITTED_ACTION_REASON_REORGED",
    "transaction": {
      "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "safeBlockNumber": "200"
    },
    "guidance": {
      "message": "The previous receipt is no longer canonical. We are checking for this transaction's new inclusion.",
      "retryAfterMs": 2000
    },
    "display": {
      "status": "SUBMITTED_ACTION_DISPLAY_STATUS_PENDING",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111"
    }
  }
}
```

</details>

<details>
<summary>Status: Stop succeeded but exit progress is unavailable</summary>

HTTP 200 for an empty Stop that reasserted pause. `result.stop` identifies the earlier parent. Its selected count is known, but completed, skipped, and pending counts are unavailable. Their omission must not display as three zeroes.

<!-- fe-response-example: status_stop_progress_unavailable -->
```json
{
  "data": {
    "status": "SUBMITTED_ACTION_STATUS_SUCCEEDED",
    "transaction": {
      "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "outcome": "ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS",
      "receipt": {
        "blockNumber": "201",
        "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      },
      "safeBlockNumber": "202",
      "verifiedActor": "0x1111111111111111111111111111111111111111"
    },
    "result": {
      "kind": "ACTION_TRANSACTION_KIND_STOP_COPY",
      "copyAccount": "0x2222222222222222222222222222222222222222",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111",
      "effects": [
        {
          "cursor": {
            "blockNumber": "201",
            "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "logIndex": 1,
            "blockTime": "2026-09-14T09:36:23Z"
          },
          "emitter": "0x2222222222222222222222222222222222222222",
          "pause": {
            "pauseState": 3
          }
        }
      ],
      "stop": {
        "kind": "SUBMITTED_STOP_RESULT_KIND_PAUSE_REASSERTED",
        "stopIntentId": "stop_intent_1",
        "source": {
          "blockNumber": "190",
          "blockHash": "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
          "transactionHash": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
          "logIndex": 1,
          "blockTime": "2026-09-14T09:36:02Z"
        },
        "validation": "valid",
        "selectedPositionCount": 2,
        "progressStatus": "DATA_STATUS_UNAVAILABLE"
      },
      "keepsExistingExitSettings": true,
      "chainId": "8453",
      "factory": "0x4444444444444444444444444444444444444444",
      "generationId": "example-v1"
    },
    "guidance": {
      "message": "This submitted call completed. Any remaining funding, exits, or withdrawal batches are shown separately."
    },
    "display": {
      "status": "SUBMITTED_ACTION_DISPLAY_STATUS_READY",
      "copyRunId": "run_1",
      "readOwnerAddress": "0x1111111111111111111111111111111111111111",
      "finality": "DATA_FINALITY_PROVISIONAL"
    }
  }
}
```

</details>

<details>
<summary>Status: the request failed and can be retried</summary>

HTTP 503. Read guidance from `details[]`, preserve the transaction hash and context, and retry `actions:status`. The step label is “Check transaction status”, not “Retry preparation”.

<!-- fe-response-example: status_error_503 -->
```json
{
  "code": 14,
  "message": "service unavailable",
  "details": [
    {
      "@type": "type.googleapis.com/kyber.copytrade.aggregate.v1.ActionGuidance",
      "message": "The transaction's status could not be checked right now. Retry with the same transaction hash and status context. This does not mean the transaction failed.",
      "retryAfterMs": 2000,
      "nextSteps": [
        {
          "kind": "ACTION_GUIDANCE_STEP_KIND_RETRY",
          "label": "Check transaction status"
        }
      ]
    }
  ]
}
```

</details>

## Preparation authorization and submission

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

## Error handling

Non-2xx responses use `code`, `message`, and `details`. For action routes,
`details[]` includes an `ActionGuidance` object. For example, a preparation
dependency failure returns HTTP 503 with this body:

```json
{
  "code": 14,
  "message": "service unavailable",
  "details": [
    {
      "@type": "type.googleapis.com/kyber.copytrade.aggregate.v1.ActionGuidance",
      "message": "This action could not be checked right now. Retry shortly.",
      "retryAfterMs": 2000,
      "nextSteps": [
        {
          "kind": "ACTION_GUIDANCE_STEP_KIND_RETRY",
          "label": "Retry preparation"
        }
      ]
    }
  ]
}
```

Use the HTTP status and typed `status`, `reason`, and step `kind` fields for
control flow. Prefer `guidance.message` for the UI; use the top-level error
`message` as a fallback. Find guidance by type rather than its array position:

```js
function readActionGuidance(payload) {
  const type = "type.googleapis.com/kyber.copytrade.aggregate.v1.ActionGuidance";
  return payload.details?.find((detail) => detail["@type"] === type);
}
```

Successful preparations and status observations use `data.guidance` instead
of `details[]`. Advisory objects have their own `guidance`. The presence of
guidance doesn't indicate success or authorize wallet submission.

Common HTTP statuses:

| HTTP | Meaning                                                             |
| ---- | ------------------------------------------------------------------- |
| 400  | Invalid parameter, unsupported enum combination, or cursor mismatch |
| 404  | Requested public resource not found                                 |
| 409  | Pinned page target changed; restart from the first page             |
| 413  | Submitted-status body exceeds 64 KiB                                |
| 429  | RPC rate limit when identified by ErrorInfo; otherwise a server resource limit, including action capacity or message size |
| 499  | Client closed or canceled the request                              |
| 500  | Internal request failure; the response is sanitized                 |
| 503  | Temporarily unavailable; retry with bounded backoff                 |
| 504  | Request deadline exceeded; retry with bounded backoff               |

### RPC preparation errors

The seven preparation routes (Start Copy, Add Capital, Stop Copy, Withdraw
Quote, Withdraw Tokens, Manual Sell and Close Position) use this mapping for
recognized RPC request failures:

| `ErrorInfo.reason` | HTTP | JSON `code` | Public message |
| --- | --- | --- | --- |
| `RPC_RATE_LIMITED` | 429 | `8` (`ResourceExhausted`) | The blockchain RPC is rate limiting requests. Retry shortly. |
| `RPC_UNAVAILABLE` | 503 | `14` (`Unavailable`) | The blockchain RPC is temporarily unavailable. Retry shortly. |
| `RPC_TIMEOUT` | 503 | `14` (`Unavailable`) | The blockchain RPC timed out. Retry shortly. |

Find `details[]` entries by `@type`; their order is not a client contract.
Identify RPC failures only from `type.googleapis.com/google.rpc.ErrorInfo`
with `domain: "copy-trade-api"` and a recognized reason. These are error-detail
strings, not `PreparedActionReason` enum values. The API also returns
`google.rpc.RetryInfo` and the existing `ActionGuidance`; metadata values such
as `retryable` are strings. Do not identify the failing dependency from the
HTTP status or message text alone.

For example, an RPC preparation failure with a 2500 ms delay returns HTTP
429, `Cache-Control: no-store` and `Retry-After: 3`:

<!-- fe-response-example: preparation_rpc_error_429 -->
```json
{
  "code": 8,
  "message": "The blockchain RPC is rate limiting requests. Retry shortly.",
  "details": [
    {
      "@type": "type.googleapis.com/google.rpc.ErrorInfo",
      "reason": "RPC_RATE_LIMITED",
      "domain": "copy-trade-api",
      "metadata": { "dependency": "rpc", "retryable": "true" }
    },
    {
      "@type": "type.googleapis.com/google.rpc.RetryInfo",
      "retryDelay": "2.500s"
    },
    {
      "@type": "type.googleapis.com/kyber.copytrade.aggregate.v1.ActionGuidance",
      "message": "The blockchain RPC is rate limiting requests. Retry shortly.",
      "retryAfterMs": 2500,
      "nextSteps": [
        {
          "kind": "ACTION_GUIDANCE_STEP_KIND_RETRY",
          "label": "Retry preparation"
        }
      ]
    }
  ]
}
```

Use `guidance.retryAfterMs` for the preparation retry delay. It is at least
2000 ms and preserves the operator delay up to 2147483647 ms. `RetryInfo`
contains that same delay as a protobuf duration string. `Retry-After` rounds
it up to whole seconds: wait at least the longer available delay, so the
example above waits at least three seconds when the header is readable.
Do not hard-code a two-second timer or shorten a longer cooldown.

Keep the user's selection while showing the supplied retry message. Use a
small retry budget with backoff and jitter, cancel scheduled retries when the
action/form changes, and leave manual retry available. A retry requests fresh
preparation evidence; the error contains no `data.call` or `statusContext`
and does not establish that a transaction was submitted. Never reuse an old
call, alter slippage, or disable another action merely because this request
failed.

Rotation/quarantine, provider URLs, batch limits and shared provider quotas are
backend concerns. Successful failover preserves the normal response contract
and exact evidence anchor. If suitable providers remain unavailable, use the
same error/retry flow. Continue handling generic 429/503 errors when the RPC
detail is absent or unknown; they can come from older deployments or other
dependencies. HTTP 200 `failureDetails` outcomes retain their separate rules
in [Preparation failures](#manual-sell-and-close-preparation-failures).

### Submitted-status request errors

For `actions:status`, use this request-error handling. The JSON `code` is a
gRPC code, not a copy of the HTTP status:

| HTTP | JSON `code` | Retry behavior |
| --- | --- | --- |
| 400 | `3` (`InvalidArgument`) | Fix malformed fields or the owner/context mismatch before another check. Do not reconstruct the context from current list data. |
| 413 | `3` (`InvalidArgument`) | Keep the original context; remove unrelated payload fields and check the 64 KiB request limit. Do not trim expected effects from the context. |
| 429 | `8` (`ResourceExhausted`) | Retry observation after the supplied delay; repeated size-limit failures need review rather than a tight loop. |
| 503 | `14` (`Unavailable`) | Retry observation with the same hash and context after the supplied delay. |
| 504 | `4` (`DeadlineExceeded`) | Retry observation with the same hash and context after the supplied delay. |
| 499, if a response arrives | `1` (`Canceled`) | Resume observation when needed. Canceling the request did not cancel the transaction. |
| 500 | `13` (`Internal`) | Retain the operation and offer manual retry or support. |
| 404, if returned | `5` (`NotFound`) | Review the reference before retrying. Missing historical target data normally returns HTTP 200 with `UNKNOWN/HISTORY_UNAVAILABLE`. |

Status error guidance includes a **Check transaction status** retry control,
including for input and internal errors. Only transient 429, 503, and 504
errors supply the current 2,000 ms retry hint. Treat the control and automatic
retry scheduling separately; a retry control on HTTP 400 does not make the
unchanged request valid.

If a status error includes the recognized RPC `ErrorInfo` and `RetryInfo`,
honor its longer delay and `Retry-After` too. The status guidance can retain
its generic 2000 ms hint; it does not shorten an RPC provider's cooldown.
Continue observing the original hash/context instead of preparing another
transaction. The preparation example's **Retry preparation** label does not
apply to a submitted-status request.

Some upstream failed-precondition responses also map to HTTP 400. Use the typed
prepared-action `status` and `reason` for normal product state; HTTP errors are
request/transport failures.

### Retry guidance

- Do not retry 400, 404, or 413 automatically. Review the request and follow
  its guidance.
- For 429, 503, and 504, honor `Retry-After` when present and
  `guidance.retryAfterMs`. Include a recognized RPC `RetryInfo.retryDelay`
  when supplied, and wait at least the longest available delay.
  Use bounded backoff for repeated failures and keep a manual retry control.
- Retry the operation that failed. A preparation error can trigger a fresh
  preparation. A status error can trigger only another observation of the
  saved transaction hash and original context.
- A timed-out preparation request did not submit a chain transaction. It is
  safe to request a fresh preparation, but never submit stale calldata merely
  because the first HTTP response was lost.
- A failed or canceled status request says nothing about transaction success,
  failure, or cancellation. Keep its hash and context; do not prepare or submit
  another transaction in response to that error.
- If a list cursor receives 400, it is malformed, expired, or mismatched.
  Discard it and restart at page one with the current filters.
- If a list cursor receives 409, its pinned mutable target advanced. Discard
  the cursor and any accumulated pages, then reload page one. Don't retry the
  same cursor.

## Frontend integration patterns

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
5. Require a nonempty `generationId`. For Start, require it to match the saved
   selection. For existing accounts with known provenance, require it to match
   the account/run generation. Never substitute a current-generation default.
6. Require `expectedAccount` to match the sending account.
7. For non-Start actions, require `copyAccount` to match the selected Smart
   Wallet. For Start create it is absent; confirming, funding, and complete
   stages must match `startCopy.predictedCopyAccount`.
8. Require `valueRaw === "0"`.
9. Reject a response past `reprepareAfter` or
   `liquidationConfigDeadline`.
10. Submit `to`, `data`, and `valueRaw` unchanged.

The browser should never ABI-encode a Copy Trade action from preview fields.

### Refresh after a transaction

1. Keep the preparation's unchanged `statusContext`, owner, chain, and wallet
   transaction hash for observing the submitted call and continuing its flow.
2. POST them to `actions:status` in receipt-first mode. Send the latest receipt
   reference as `previousReceipt` on subsequent observations.
3. Show provisional success when `receiptResult` arrives. Invalidate affected
   client caches, discard older in-flight GETs, and fetch the visible resources
   immediately. Let the user dismiss the dialog.
4. Render each GET from its own metric/projection statuses and field-group
   quality. Show **Syncing** for pending groups and retain usable stale or
   provisional numbers with their qualifiers. No action-readiness array or
   per-operation field wait set is required in the UI.
5. Poll normal visible reads while their returned groups are pending, using the
   application's bounded refresh/backoff policy. Coalesce identical reads and
   pause background refreshes for hidden views.
6. Continue status observation when the call's strict outcome or `nextStep`
   matters, such as separate Start funding or another withdrawal batch. GET
   synchronization does not depend on keeping that observer alive.

Closing the dialog, refreshing the browser, or opening a new session does not
lose registered pending effects. Ordinary GETs load shared backend state.
Before the first verified status observation, retain the normal local submitted
indicator; a transaction hash alone has not registered an effect.

A changed receipt or `REORGED` observation withdraws the previous preview. Use
fresh GETs and their repair/unavailable quality. An HTTP or network error is an
observation failure, not proof that the transaction failed; retry the same hash
rather than automatically resubmitting.

### Client caches and pagination

Key reads by their complete identity and filters: owner, chain, run/account,
position/agent, view, sort, and pagination. Clear visible owner-specific state
on wallet changes and ignore late responses for a previous owner or request.

Backend tracking cannot change a response already held in a browser cache.
After early success, invalidate the relevant cache and require a GET started
after that response. On reload or reconnect, revalidate cached reads. Render
cached data as last known until that request completes. A failed refresh keeps
the last safe value explicitly stale; it never turns a missing value into zero.

Restart owner/account lists from page one after the user's affected action.
An invalidated cursor requires a fresh page-one request. Public agent and
leaderboard cursors retain their order while other users act; older retained
card values are marked stale. Refresh page one to get current membership/rank.

The backend combines overlapping operations. Completing one deposit cannot
clear another deposit or withdrawal still awaiting publication. Replace the
metadata from each GET; do not merge old pending descriptors into a permanent
client ledger or add their amounts to totals.

### Offline acceptance checks

Use the [action response examples](#action-response-examples) in frontend
component and request-state tests. No live transaction is needed for these cases:

| Action or lifecycle case | Expected UI behavior |
| --- | --- |
| Funded CREATE with no mapped run ID yet | Show verified creation/funding provisionally; do not invent a run ID or fail the transaction because the detail cannot be fetched yet. |
| CREATE run appears before Capital In | Render the server row and usable fields; Capital In can remain syncing. Do not wait for every total to show the run. |
| Unfunded CREATE has `createAmountRaw = "0"` and a separately published nonzero Capital In | `result.openingAllocationRaw` can be absent. Render the qualified server Capital In; do not zero the account from the CREATE amount. |
| CREATE succeeds, then a separate FUND starts | Keep CREATE completed and FUND pending independently. The FUND GET remains pending until that separate credit is reflected. |
| Funded CREATE continuation is already `COMPLETED/COMPLETE` | Finish Start Copy without inventing a second transfer; leave delayed metrics in the page. |
| FUND becomes ready before projection completion | Show returned Capital In with `CURRENT`, projection `SYNCING`, and provisional finality together. |
| Two Add Capital operations overlap | Reconcile only matching operations; never add their effects to a server total and render the GET's combined pending state. |
| Empty or selected Stop succeeds with unavailable child progress | Show copying stopped; keep exits unknown/updating and preserve server tab membership. Do not show zero pending exits. |
| Exact or maximum quote withdrawal succeeds | Show the actual effect amount once, not the sentinel or both the withdrawal and transfer amounts. Preserve the prior pause state. |
| Maximum quote withdrawal has actual amount `"0"` | Show successful call with no quote moved; accept ready display without requiring a nonzero Capital Out value. |
| Token batch succeeds with unpriced nonquote tokens | Show verified token effects and pause; USD totals can be unavailable. Do not require a Capital Out update for a nonquote-only context. |
| Token batch has outer receipt success without complete verified effects | Show the status explanation; do not infer whole-batch or per-token success. |
| Token batch continuation returns `NO_WITHDRAWABLE_BALANCE` | Complete the eligible-token flow; do not claim native assets or unrelated airdrops were withdrawn. |
| Manual Sell succeeds with a nonzero remaining base amount | Show a successful partial sale and refresh recovery obligations; do not mark the position or run fully closed. |
| Close Position succeeds with zero base remaining | Show the affected position's close; refresh server membership without stopping the copy run or creating a withdrawal. |
| A later trade changes the current position quantity | Keep the receipt's historical sale result and the current position row distinct. |
| Any receipt is reorged or re-included in another block | Revoke prior inclusion claims, discard old in-flight reads, and apply the new observation. |
| Reload after dismissing the successful dialog | Fresh GETs still show pending effects without saved action-readiness state. |
| One account is current while another account is stale | Render the owner GET's aggregate quality; do not infer every account is current. |
| Portfolio is current while Capital In remains syncing | Render each returned field independently. |

- `receiptResult` shows provisional success while a GET's capital or valuation
  group remains pending. A usable value stays visible with its qualifier.
- An old browser-cache response cannot replace the required post-success GET.
- Capital In, portfolio, activity, fees, and AUM can update independently.
- Overlapping actions remain guarded by the backend after reload.
- Reorg metadata removes invalid values and cannot be overwritten by an older
  in-flight response.
- A successful RPC balance of zero is rendered as zero; a failed balance read
  remains unavailable. An RPC read failure does not erase verified call success.

- An all-chain leaderboard omits `chainId` and uses one global cursor; selecting
  a chain restarts the query rather than filtering the current page locally.
- An owner-enriched row with `myCopyRunId` opens that run. An omitted field
  follows Copy/Connect behavior without inventing a run ID or bypassing Start
  availability.
- Switching or disconnecting the wallet clears owner-specific leaderboard
  data and cursors; a late response for the previous owner is ignored.
- A hidden agent's copy run remains visible through owner APIs and its embedded
  snapshot, even when the public agent route returns 404.
- Entry/exit prices come from the valuation objects without frontend fee
  adjustment. An open partially sold position does not require an exit valuation.
- A closed position renders actual received rebate, with remaining estimated
  cashback marked not applicable. Unavailable estimates never become zero.
- A stale Total Return renders with its status while independently available
  dollar P&L remains visible. Missing Return does not hide a History row.
- A successful withdrawal can remain Closing. Neither receipt success nor
  elapsed time forces History membership.
- `/chains` initializes Start Copy and Add Capital without hard-coded token
  values or a preliminary preparation request.
- A token with only `chainId`, `address`, and `decimals` keeps funding usable.
  Missing display metadata does not disable preparation.
- Omitted `quoteToken` remains unknown even when `meta.status` is
  `DATA_STATUS_CURRENT`;
  the UI shows a discovery retry control rather than inventing token values.
- With six decimals, input `1.25` produces raw `"1250000"`. Reject fractional
  digits beyond the token's precision rather than rounding the user's amount.
- Switching chains invalidates the old raw amount and prepared call, including
  when both chains use the same token address.
- A preparation/discovery token or decimals mismatch never opens the wallet;
  missing preparation metadata can use matching discovery values.
- Two create-enabled generations have separate Start availability and fees.
  Unavailable singleton fields do not disable an available selected entry.
- Every Start request, including continuation, sends the same selected
  `generationId`. A mismatched response never opens the wallet.
- Retirement to existing-accounts-only removes new creation but preserves
  original account identity and operator-authorized Start funding continuation.
- Read-only history remains visible while all executable actions are disabled.
  A previously submitted transaction can still be observed with its original
  status context.
- A run with absent `generationId` remains unknown; it is not assigned to the
  current creation generation.
- Position-event generation selection is retained between pages. Changing it
  drops the old cursor and starts a new query.
- `TRY_PREPARE` offers preparation while unrelated read data remains stale.
- Manual Sell review has no call; the confirmation request copies both pins
  exactly as returned, preserving the ratio as a string.
- `NO_EXECUTABLE_ROUTE` renders a recoverable HTTP 200 outcome. HTTP 503 renders
  a request error with guidance from `details[]`.
- HTTP 429 plus `ErrorInfo.domain = copy-trade-api` and `RPC_RATE_LIMITED`
  renders the RPC retry message. Unknown/missing RPC details retain generic
  resource-limit handling; aggregator HTTP 200 outcomes remain distinct.
- A 2500 ms RPC preparation delay plus `Retry-After: 3` waits at least three
  seconds before a fresh preparation. Neither RPC rotation nor a failed
  status observation causes wallet submission or replay of old calldata.
- A `CONFIRMING` response with a reverted outer receipt keeps polling and does
  not render a final failed action.
- `SYNCING/REPAIR_IN_PROGRESS` shows pending result publication without an old
  `result` object. Independently proved display `READY` can still be rendered.
- `SYNCING` with display `READY` renders the exact returned Capital In and its
  provisional label. Refresh ordinary reads; never add the deposit again.
- `CONFIRMING` with `receiptResult` and display `SYNCING` shows provisional
  call success, allows dialog dismissal, and leaves totals syncing.
- A current `receiptResult` remains visible when the action is `UNKNOWN` due
  to unavailable public data; use the returned retry hint.
- `SUCCEEDED` with display `PENDING` or `SYNCING` shows completed-call success.
  Fresh GETs own their syncing indicators; do not reopen a blocking dialog.
- A missing `receiptResult` falls back to the latest status and strict result.
  It does not erase a current `SUCCEEDED` result or imply transaction failure.
- Every action follows its display guarantee above. CREATE can be ready with
  no capital value, Stop can remain closing, and a partial sale can be shown
  even when a later valid sale changed the remaining amount.
- A verified withdrawal effect is shown immediately. Updated Capital Out waits
  for a returned ready metric; zero or nonquote batches can be ready without
  a capital metric or refreshed wallet balance.
- `CURRENT` plus `PROVISIONAL`, and `STALE` plus `FINAL`, retain both qualifiers.
- Missing or unknown display status never borrows prior ready values. An older
  server without `display` uses the legacy completion flow without endless polling.
- `SUCCEEDED` works with omitted `reason`, `nextStep`, and zero indexes.
- Stop success with unavailable progress does not display zero remaining exits.
- `UNKNOWN/SOURCE_UNAVAILABLE` retries observation. For `TARGET_MISMATCH`,
  follow a returned retry hint; without one, require review. An invalid request
  needs correction before retrying.
- A reorg replaces the latest success and removes its displayed result while
  retaining the original context, hash, and last observed receipt reference.
  A new display `PENDING` also removes the earlier ready display claim/values.
- Start and Withdraw Tokens continuation creates a fresh preparation request;
  it never resubmits the call from the successful operation.
- Canceling, refreshing, or reopening the view retains the operation identity
  and prevents an older in-flight response from updating a different operation.

### Optional local pending message

Before `receiptResult`, the UI can retain the submitted hash and show a pending
transaction message. After verification, show the exact effect and let the user
dismiss the dialog. This message does not change server totals, list membership,
metric status, or action availability.

The UI does not maintain deltas or readiness guards for related reads. Refresh
those reads and use their returned quality. Keep the original action context only
when continuing transaction observation or a required next preparation. Reorgs
withdraw invalid previews; temporary observation failures do not prove failure.

## Complete HTTP operation index

The generated HTTP surface contains **38 operations**. The public API retains
**35 operations**:

- 27 GET reads;
- 7 transaction-preparation POSTs, including `:prepareWithdrawTokens`;
- 1 submitted-status POST: `/users/{ownerAddress}/actions:status`.

The remaining **3 operations are VPN-only admin routes**:

```text
GET   /admin/agents
POST  /admin/agents
PATCH /admin/agents/{agentId}
```

These have a separate access boundary; see
[Admin agent registry](#admin-agent-registry-vpn-only).

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

## Integration reference

Use the endpoint catalog and generated OpenAPI for the 35 HTTP operations.
The dated examples below describe earlier contracts; follow the current endpoint
sections when an older example differs.

### Historical pre-release public-read smoke

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
