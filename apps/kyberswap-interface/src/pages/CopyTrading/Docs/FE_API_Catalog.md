# Copy Trade API — Frontend Integration Catalog

This document describes the public HTTPS/JSON contract used by frontend
applications. It intentionally excludes service architecture, storage, and
deployment details. Use each changelog entry's status instead of assuming the
newest documented behavior is already merged or deployed.

## Changelog

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

### 2026-08-13 — Merged on `origin/main`

Baseline verified against `origin/main` commit
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
| Capital In                          | `CopyRunSummary.capitalInProjectionStatus` is implemented with `SYNCING`, `READY`, and `UNAVAILABLE`.                                                                                                                                                                           | Render `capitalInUsd` only when the projection status is `READY`. A visible funding transaction does not make a provisional aggregate value authoritative.                                  |
| Account-effective cashback policy   | `GET /users/{ownerAddress}/copy-runs/{copyRunId}/cashback-policy` returns the operator-authored policy for that exact follower account, including typed status, optional rates, scope, provenance times, and optional formula version.                                          | Fetch it lazily for a selected run's fee/cashback panel. Branch on `status`; do not substitute an agent-level advertised rate, infer missing rates as zero, or hard-code a formula version. |
| Pinned stable balance               | The current-stable materializer reads exact quote-token balances from the operator at one canonical block anchor. A present row can use `balanceSource = "onchain_rpc"`; exact zero remains present.                                                                            | Trust the row only when `pinnedStableBalance.status` is `PRESENT`. Preserve all other typed states as unavailable rather than converting them to zero.                                      |
| Current wallet inventory            | `GET /copy-accounts/{chainId}/{copyAccount}/wallet-inventory` returns bounded current wallet rows and an account-wide `walletInventoryValueUsd` only when the source proves the response is complete and every nonzero asset is valued.                                         | Use this route for **Remaining in Wallet** on active and stopped copy runs. Never calculate the total from `/balances` pages or add the pinned stable row to the server total.              |
| Action-log chain links              | Valid mixed-case EVM addresses and hashes are canonicalized to lowercase. Invalid optional linkage claims are discarded while a safe narrative row remains renderable.                                                                                                          | Treat `txHash`, `leaderPositionId`, `blockNumber`, and `tokenAddress` as optional links. Their absence is not an action failure and must not be reconstructed from narrative text.          |
| Copy lifecycle views                | `OPEN` contains admitted runs with status `COPY_RUN_STATUS_ACTIVE` or `COPY_RUN_STATUS_CLOSING`. `HISTORY` contains admitted or readable historical-generation runs with status `COPY_RUN_STATUS_STOPPED` or `COPY_RUN_STATUS_CLOSED`. Position history is a separate universe. | Refresh from the server after lifecycle changes; do not pin local tab membership or derive it from position counts. Use owner position routes for owner-wide closed-trade history.          |
| Historical-generation compatibility | Parentless child facts explicitly classified `HISTORICAL` by the operator are consumed without creating current/actionable projections. Missing `ADMITTED` or `QUARANTINED` parent identity still fails closed.                                                                 | Historical or unavailable data must not be promoted into current dashboards or actions. Preserve typed unavailable states and direct/History reads; never infer missing values as zero.     |
| Public HTTP surface                 | All 26 reads and six preparations have generated gateway mappings and concrete aggregate handlers. The two wallet-session operations remain only in the merged baseline and are removed by the pending entry above.                                                             | Do not feature-gate a remaining route as unimplemented. Treat typed product statuses separately from HTTP availability.                                                                     |

### 2026-08-12 — Verified pre-release read smoke

`GET /chains`, `GET /agents?limit=1`, and `GET /docs/` were reachable in
pre-release. See [Current Availability and Verification Status](#current-availability-and-verification-status)
for the exact observations and limitations.

### 2026-07-30 — Historical pre-release action smoke

This evidence predates required Start funding intent and the pending removal
of wallet sessions. It is retained only as historical deployment evidence; do
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

The merged baseline and pending release add the following UI-facing behavior.
Apply each row according to the environment status in the changelog, and update
all affected action dialogs and Smart Wallet activity rendering together.

| Surface                                  | Contract                                                                                                 | Required FE behavior                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manual Sell / Close Position preparation | No wallet challenge, session exchange, bearer token, or issuance lease in the pending contract           | Prepare directly from the latest authoritative read inputs. The owner wallet must still submit the exact returned call; preparation is not transaction authorization.                                                                                                                     |
| Start Copy funding                       | `fundingMode` plus optional `createPermitData`                                                           | Send `START_COPY_FUNDING_MODE_UNFUNDED` with no permit, or `START_COPY_FUNDING_MODE_FUNDED` with an optional protobuf-JSON base64 byte string. The API uses `targetCapitalRaw` as the funded create amount. Permit format/capability remains operator-authoritative.                      |
| Contract-generation routing              | No public `generationId`, factory, controller, or contract-address request field                         | Do not hard-code or select deployment addresses. Start uses the currently create-enabled operator generation; existing-account actions derive generation from persisted account identity. Render `PREPARED_ACTION_REASON_UNSUPPORTED_ACCOUNT_GENERATION` as non-actionable product state. |
| Copy-run cashback policy                 | `GET .../cashback-policy`                                                                                | Use this run/account-specific policy for detailed fee/cashback presentation. `COPY_RUN_CASHBACK_POLICY_STATUS_AVAILABLE`, `..._NOT_CONFIGURED`, `..._INVALIDATED`, and `..._UNAVAILABLE` are distinct states; missing optional rates or `cashbackFormulaVersion` are not zero.            |
| Prepared Smart Wallet identity           | `PreparedAction.copyAccount`                                                                             | For every non-Start action, require it to equal the selected Smart Wallet. It is absent only for Start Copy creation; Start confirming, funding, and completion must equal `startCopy.predictedCopyAccount`. Do not confuse it with `call.to` or `expectedAccount`.                       |
| Manual Sell / Close Position quote       | `data.manualSell.swapQuote` or `data.closePosition.swapQuote`                                            | Display `expectedQuote`, `minimumQuote`, and optional `effectiveSlippageBps`. Preserve metric status; unavailable is not zero.                                                                                                                                                            |
| Stop Copy per-position quote             | `data.stopCopy.positions[].swapQuote`                                                                    | Render the expected/minimum quote for each selected position. These values belong only to the returned preparation.                                                                                                                                                                       |
| Stop Copy total quote                    | `data.stopCopy.totalSwapQuote`                                                                           | Render total expected/minimum quote. There is intentionally no aggregate `effectiveSlippageBps`; do not average per-position slippage.                                                                                                                                                    |
| Generic owner sell history               | `position.actionType = "sell_unaligned"` and `PositionSummary.exitKind = POSITION_EXIT_KIND_UNSPECIFIED` | Label it **Owner Sell**. Do not infer Manual Sell or Close Position from sold amount, remaining amount, lifecycle, skipped obligations, or calldata shape.                                                                                                                                |
| Stop Copy activity                       | One `ACTIVITY_TYPE_COPY_STOPPED` lifecycle row plus independent downstream position/execution rows       | Render Stop Copy as an amount-less lifecycle row. Render each token-specific reduction, closure, or exit separately; do not attach one arbitrary token/amount/value to the lifecycle row.                                                                                                 |

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

| Screen or UI region                   | Initial APIs                                                                                        | Lazy or drilldown APIs                                                                                                       | Action APIs                                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| App bootstrap / network selector      | `GET /chains`                                                                                       | None                                                                                                                         | None                                                                                          |
| Explore / leaderboard header          | `GET /leaderboard/summary`                                                                          | None                                                                                                                         | None                                                                                          |
| Leaderboard table                     | `GET /leaderboard`                                                                                  | Load the next cursor page                                                                                                    | `POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy`                                |
| Agent discovery/search                | `GET /agents`                                                                                       | Load the next cursor page                                                                                                    | `POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy`                                |
| Agent profile header and KPI cards    | `GET /agents/{agentId}`, optionally `GET /agents/{agentId}/stats`                                   | None                                                                                                                         | `POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy`                                |
| Agent performance chart               | `GET /agents/{agentId}/performance`                                                                 | Additional cursor pages or a new request when series/window changes                                                          | None                                                                                          |
| Agent action-log tab                  | `GET /agents/{agentId}/action-logs`                                                                 | Filter by leader position or time range; load the next cursor page                                                           | None                                                                                          |
| Agent open/history positions tab      | `GET /agents/{agentId}/positions`                                                                   | `GET /agents/{agentId}/positions/{positionId}` and `/events` when a row is opened                                            | None                                                                                          |
| My Copies — Open summary              | `GET /users/{ownerAddress}/copy-summary?view=OWNER_COPY_VIEW_OPEN`                                  | None                                                                                                                         | None                                                                                          |
| My Copies — Open rows                 | `GET /users/{ownerAddress}/copy-runs?view=OWNER_COPY_VIEW_OPEN`                                     | Load the next cursor page; selected-run detail and positions                                                                 | Prepare Add Capital, Stop Copy, or Withdraw Quote from the selected run                       |
| History — stopped-run summary         | `GET /users/{ownerAddress}/copy-summary?view=OWNER_COPY_VIEW_HISTORY`                               | None                                                                                                                         | None                                                                                          |
| History — stopped-run list            | `GET /users/{ownerAddress}/copy-runs?view=OWNER_COPY_VIEW_HISTORY`                                  | Load the next cursor page                                                                                                    | Prepare Withdraw Quote when advisory availability allows it                                   |
| History — all closed positions/trades | `GET /users/{ownerAddress}/positions?view=POSITION_VIEW_CLOSED`                                     | Filter by agent/chain, paginate, or group rows by `copyRunId`                                                                | None for an already closed position                                                           |
| History — selected stopped run        | `GET /users/{ownerAddress}/copy-runs/{copyRunId}` and `GET .../positions?view=POSITION_VIEW_CLOSED` | `GET .../performance`; `GET .../cashback-policy` when the fee panel opens; owner activity filtered by `copyRunId`            | Prepare Withdraw Quote only when advertised; historical-generation rows remain non-actionable |
| Copy-run detail                       | `GET /users/{ownerAddress}/copy-runs/{copyRunId}` and `GET .../positions`                           | `GET .../performance`; `GET .../cashback-policy` when fee/cashback detail is visible; owner activity filtered by `copyRunId` | Prepare Add Capital, Stop Copy, Withdraw Quote, Manual Sell, or Close Position as applicable  |
| All owner positions                   | `GET /users/{ownerAddress}/positions`                                                               | Filter by agent, chain, view, or sort; load the next cursor page                                                             | Prepare Manual Sell or Close Position when advertised                                         |
| Leftover positions                    | Owner or copy-run positions with `view=POSITION_VIEW_LEFTOVER`                                      | Copy-account drilldown and pending-sell obligations                                                                          | Manual Sell or Close Position when advertised                                                 |
| Owner activity feed                   | `GET /users/{ownerAddress}/activity`                                                                | Filter by `copyRunId`, `chainId`, exact `type`, or product `group`                                                           | None                                                                                          |
| Owner copy-account list               | `GET /users/{ownerAddress}/copy-accounts`                                                           | Load the next cursor page                                                                                                    | None                                                                                          |
| Copy-account overview                 | `GET /copy-accounts/{chainId}/{copyAccount}`                                                        | Balances, positions, and history routes below                                                                                | Prepare Add Capital, Stop Copy, or Withdraw Quote through the associated copy run             |
| Copy Details — Remaining in Wallet    | `GET /copy-accounts/{chainId}/{copyAccount}/wallet-inventory`                                       | Use `/balances` only for a separately paginated asset explorer                                                               | None                                                                                          |
| Copy-account balances                 | `GET /copy-accounts/{chainId}/{copyAccount}/balances`                                               | Load the next cursor page                                                                                                    | None                                                                                          |
| Copy-account positions                | `GET /copy-accounts/{chainId}/{copyAccount}/positions`                                              | Pending-sell obligations for a selected `userPositionId`                                                                     | Manual Sell or Close Position                                                                 |
| Copy-account history                  | `GET /copy-accounts/{chainId}/{copyAccount}/history`                                                | Filter by exact `type` or product `group`                                                                                    | None                                                                                          |
| Skipped-sell recovery drawer          | Position row plus `GET .../pending-sell-obligations`                                                | Refresh the FIFO immediately before preparation                                                                              | Prepare Manual Sell or Close Position directly, then submit from the owner wallet             |

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
| Withdraw Quote | Direct copy-run/copy-account detail and `withdrawQuoteAvailability`                                 | `POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareWithdrawQuote`                            |
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
  the next stage, if any. Do not locally predict aggregate state.

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
pending contract. Do not add an `Authorization` header solely for Copy Trade
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
    "asOfChains": []
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

| Field             | Meaning                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `requestId`       | Server request correlation ID. Include it in bug reports, but do not use it as product identity.             |
| `generatedAt`     | Time this response was assembled. It is not necessarily the source-data time.                                |
| `dataAsOf`        | Conservative time through which the response's aggregate data is known.                                      |
| `stalenessReason` | Optional sanitized reason when data is stale or unavailable. Treat it as diagnostic text, not a stable enum. |
| `asOfChains[]`    | Per-chain source coverage contributing to the response.                                                      |
| `status`          | Response-level `DataStatus`. Individual metrics and valuations can have more specific statuses.              |

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
```

The object contains `status`, a typed `reason`, and optional `asOf`. Use it to
render or disable controls. It is not authorization and must not be used to
construct calldata. The matching POST preparation route always makes the final
decision using current chain and source state.

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
- Position pages sorted by current USD value use a shorter five-minute cursor
  because their ordering depends on changing prices.
- If a cursor is rejected or expired, restart from the first page.

The cursor is signed and scoped to the normalized request. The following all
invalidate an existing cursor:

- using it on another endpoint;
- changing `ownerAddress`, `agentId`, `copyRunId`, `chainId`, or account;
- changing any view/filter;
- changing sort field or direction;
- changing performance series/window/interval;
- changing the action-log time range or leader-position filter.

`limit` controls page size and is not part of the logical result identity, but
the safest client behavior is to keep it stable through one sequence.

### Stable Ordering

| Collection                            | Default/effective order                                      |
| ------------------------------------- | ------------------------------------------------------------ |
| Leaderboard                           | APR 30D descending, with stable identity tie-breakers        |
| Agent discovery                       | Display name ascending, nulls last                           |
| Performance points                    | Timestamp ascending; per-trade series also uses trade ID     |
| Agent action logs                     | `occurredAt` descending, then `actionLogId` descending       |
| Positions                             | `openedAt` descending unless explicitly changed              |
| Open copy runs                        | `startedAt` descending unless explicitly changed             |
| History copy runs                     | `stoppedAt` descending when `sortBy` is omitted              |
| Owner activity / copy-account history | `occurredAt` descending, then `activityId` descending        |
| Owner copy accounts                   | Chain and copy-account ascending                             |
| Pending sell obligations              | Operator-authoritative FIFO order; never re-sort client-side |

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
series   = PERFORMANCE_SERIES_PORTFOLIO_EQUITY
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
| `PERFORMANCE_SERIES_PERIOD_REALIZED_PNL`     | Any supported window                    | `PERFORMANCE_INTERVAL_MONTH`                                |
| `PERFORMANCE_SERIES_PER_TRADE_REALIZED_PNL`  | Any supported window                    | Omit `interval`                                             |

Agent stats currently support `WINDOW_30D`; omitting `window` selects it.

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

| Field                                                                                          | Meaning                                           |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `apr30d`                                                                                       | APR with its exact effective interval and status. |
| `winRatePct`                                                                                   | Closed-position win rate.                         |
| `lifetimeVolumeUsd`                                                                            | Lifetime notional volume.                         |
| `copiers`                                                                                      | Unique active copier count.                       |
| `aumUsd`                                                                                       | Follower assets under management.                 |
| `openPositions`                                                                                | Current open-position count.                      |
| `totalRealizedPnlUsd`                                                                          | Lifetime realized P&L.                            |
| `maxDrawdownPct`                                                                               | Maximum drawdown percentage when available.       |
| `winningPositionCount`, `losingPositionCount`, `breakevenPositionCount`, `closedPositionCount` | Explicit terminal-position counts.                |

`LeaderboardSummary` contains status-bearing `agentCount`, `totalAumUsd`,
`totalCopierCount`, and `lifetimeVolumeUsd`, plus `asOf`. `agentCount`,
`totalAumUsd`, and `lifetimeVolumeUsd` use the supplied leaderboard filters.
`totalCopierCount` is different: it is the platform-wide lifetime count of
distinct owner wallets across configured agents and intentionally ignores
leaderboard filters, including `chainId`, search, and strategy category. Every
metric still has its own status and can be unavailable independently.

### Agent Profile, Performance, and Positions

| Method | Path                                              | Parameters                                                      | `data`               |
| ------ | ------------------------------------------------- | --------------------------------------------------------------- | -------------------- |
| GET    | `/agents/{agentId}`                               | Path: `agentId`                                                 | `AgentProfile`       |
| GET    | `/agents/{agentId}/stats`                         | `window?`                                                       | `AgentMetrics`       |
| GET    | `/agents/{agentId}/performance`                   | `series?`, `window?`, `interval?`, `cursor?`, `limit?`          | `PerformancePoint[]` |
| GET    | `/agents/{agentId}/action-logs`                   | `leaderPositionId?`, `from?`, `to?`, `cursor?`, `limit?`        | `AgentActionLog[]`   |
| GET    | `/agents/{agentId}/positions`                     | `view?`, `token?`, `cursor?`, `limit?`, `sortBy?`, `sortOrder?` | `PositionSummary[]`  |
| GET    | `/agents/{agentId}/positions/{positionId}`        | Path: `agentId`, `positionId`                                   | `PositionSummary`    |
| GET    | `/agents/{agentId}/positions/{positionId}/events` | `cursor?`, `limit?`                                             | `PositionEvent[]`    |

Action-log `from` and `to` are RFC3339 timestamps. When both are present,
`from` must not be after `to`.

Agent-route behavior:

| Route           | Defaults and constraints                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Stats           | Omitted `window` means `WINDOW_30D`; 30D is currently the only accepted stats window.                                      |
| Performance     | Uses the performance defaults/combinations above and returns points in ascending time order.                               |
| Action logs     | Optional `leaderPositionId` is 1..256 characters. `from` and `to` are inclusive source-time bounds. Rows are newest first. |
| Positions       | Omitted view means `ALL`; `LEFTOVER` is rejected. Optional `token` is a token-address filter.                              |
| Position events | Standard pagination; events preserve source lifecycle order for the selected position.                                     |

Key `AgentProfile` additions over a card:

- `bio`, `liveSince`, `whitelistedSymbols`, `tags`
- `strategyExecutionItems`

`strategyExecutionItems[]` has `label` and `description` and is intended for
the “Strategy & Execution” section of the profile. It is configured display
content, not a machine-readable trading rule.

Key `PositionSummary` fields:

- identity: `positionId`, optional `userPositionId`, optional
  `agentPositionId`, optional `copyRunId`
- routing/display: `agentId`, `chainId`, optional `copyAccount`, `tradeId`,
  `token`
- lifecycle: `lifecycle`, `quantityState`, `exitKind`, `openedAt`, `closedAt`
- amount: `remainingBaseRaw` and optional gross/net accounting fields
- value: `entryValuation`, `currentValuation`, `exitValuation`
- metrics: realized/unrealized PnL, fees, cashback, skip counts and ratios
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
- `POSITION_EXIT_KIND_MANUAL` is reserved for an explicitly proven manual
  exit.
  Generic owner-directed `sell_unaligned` history projects as
  `POSITION_EXIT_KIND_UNSPECIFIED`; render a neutral **Owner Sell** label from
  the typed activity detail rather than inferring Manual Sell versus Close
  Position from amount, lifecycle, or skip count.

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

| Method | Path                                                          | Parameters                                                                                | `data`                  |
| ------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------- |
| GET    | `/users/{ownerAddress}/copy-summary`                          | `view` **required**, `chainId?`                                                           | `OwnerCopySummary`      |
| GET    | `/users/{ownerAddress}/copy-runs`                             | `view` **required**, `agentId?`, `chainId?`, `cursor?`, `limit?`, `sortBy?`, `sortOrder?` | `CopyRunSummary[]`      |
| GET    | `/users/{ownerAddress}/copy-runs/{copyRunId}`                 | Path only                                                                                 | `CopyRunSummary`        |
| GET    | `/users/{ownerAddress}/copy-runs/{copyRunId}/cashback-policy` | Path only                                                                                 | `CopyRunCashbackPolicy` |
| GET    | `/users/{ownerAddress}/copy-runs/{copyRunId}/positions`       | `view?`, `cursor?`, `limit?`, `sortBy?`, `sortOrder?`                                     | `PositionSummary[]`     |
| GET    | `/users/{ownerAddress}/copy-runs/{copyRunId}/performance`     | `series?`, `window?`, `interval?`, `cursor?`, `limit?`                                    | `PerformancePoint[]`    |
| GET    | `/users/{ownerAddress}/positions`                             | `agentId?`, `chainId?`, `view?`, `cursor?`, `limit?`, `sortBy?`, `sortOrder?`             | `PositionSummary[]`     |
| GET    | `/users/{ownerAddress}/activity`                              | `copyRunId?`, `chainId?`, `type?`, `group?`, `cursor?`, `limit?`                          | `ActivityRow[]`         |
| GET    | `/users/{ownerAddress}/copy-accounts`                         | `chainId?`, `status?`, `cursor?`, `limit?`                                                | `CopyAccountSummary[]`  |

Owner copy-run sort fields:

```text
OWNER_COPY_RUN_SORT_FIELD_STARTED_AT
OWNER_COPY_RUN_SORT_FIELD_STOPPED_AT
OWNER_COPY_RUN_SORT_FIELD_AGENT_APR_30D
OWNER_COPY_RUN_SORT_FIELD_AGENT_WIN_RATE
OWNER_COPY_RUN_SORT_FIELD_AGENT_LIFETIME_VOLUME
OWNER_COPY_RUN_SORT_FIELD_CAPITAL_IN
```

`OWNER_COPY_VIEW_OPEN` and `OWNER_COPY_VIEW_HISTORY` are server-defined product
universes, not direct aliases for one `CopyRunStatus`. Always pass the selected
view and render the returned `status`. Do not filter the page client-side by
status.

`OPEN` contains only source-admitted runs whose status is
`COPY_RUN_STATUS_ACTIVE` or `COPY_RUN_STATUS_CLOSING`. `HISTORY` contains
`COPY_RUN_STATUS_STOPPED` or `COPY_RUN_STATUS_CLOSED` runs, including terminal
historical-generation rows that remain readable for audit/history. A stopped
run does not remain in `OPEN` because it still has a closing or leftover
position. An active historical-generation run is intentionally in neither
list, although an exact direct lookup can remain readable.

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

| Parameter         | Behavior                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `view`            | Required: `OPEN` or `HISTORY`.                                                                                       |
| `agentId`         | Optional exact agent filter.                                                                                         |
| `chainId`         | Optional positive chain filter.                                                                                      |
| `sortBy`          | Open defaults to `OWNER_COPY_RUN_SORT_FIELD_STARTED_AT`; History defaults to `OWNER_COPY_RUN_SORT_FIELD_STOPPED_AT`. |
| `sortOrder`       | Defaults to descending.                                                                                              |
| `limit`, `cursor` | Standard cursor pagination.                                                                                          |

Copy-account status filters:

```text
COPY_ACCOUNT_STATUS_ACTIVE
COPY_ACCOUNT_STATUS_CLOSED
COPY_ACCOUNT_STATUS_CLOSING
COPY_ACCOUNT_STATUS_STOPPED
```

Key `CopyRunSummary` fields:

- `copyRunId`, `ownerAddress`, `agentId`, `chainId`, `copyAccount`
- `startedAt`, `stoppedAt`, `status`, `durationSeconds`
- `agentSnapshot`
- capital, portfolio, PnL, fee, cashback, position-count, and APR metrics
- `capitalInProjectionStatus`, which must be `READY` before the UI renders a
  numeric `capitalInUsd`. `SYNCING` means canonical funding is visible but the
  immutable account-capital projection is still catching up; `UNAVAILABLE`
  means its source or lineage cannot currently authorize a value. In both
  non-ready states `capitalInUsd` is unavailable and never a provisional zero.
- `addCapitalAvailability`, `stopCopyAvailability`,
  `withdrawQuoteAvailability`

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
- flat fees captured, cashback received, net fee cost, and estimated pending
  cashback.

Fields that are not meaningful for the selected view can be
`METRIC_STATUS_NOT_APPLICABLE`; do not merge the Open and History summary
objects locally.

`ActivityRow.detail` contains exactly one typed detail object appropriate for
the activity: `copyLifecycle`, `position`, `capital`, `fee`, or `execution`.

The detail variant has this shape:

| Variant         | Used for                       | Important fields                                                                                          |
| --------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `copyLifecycle` | Copy started/stopped           | `eventId`, `eventType`, optional `beforeStatus`, `afterStatus`                                            |
| `position`      | Open/close/reduce position     | Tokens, raw base/quote accounting, settlement value, realized P&L, fee, cashback                          |
| `capital`       | Deposit/top-up/withdraw/return | `movementType`, exact raw amount, token, USD metric                                                       |
| `fee`           | Flat fee/cashback              | Exact raw amount, token, USD metric                                                                       |
| `execution`     | Skip/exit/failure lifecycle    | Execution/action identifiers and statuses, public error, config index/rate/deadline, display amount/value |

The top-level `summary` is display text. Business logic should switch on the
typed `type` and oneof detail, not parse the summary.

For Smart Wallet Activity and the Open Copies alerts feed, use one cursor chain
per exact `type` or product `group`. Render capital actions distinctly
(Deposit, Add Capital, Withdraw Quote, Returned Capital).

#### Stop Copy and downstream activity rows

Stop Copy is not one monetary trade. One request can initiate exits for zero,
one, or many positions and tokens. The activity feed therefore exposes
independent canonical facts:

| Row                                                                                                                     | What it represents                                         | Token / amount / value                                                                     |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `ACTIVITY_TYPE_COPY_STOPPED`                                                                                            | The copy-account lifecycle transition to stopped/cancelled | None. Use `copyLifecycle` and the optional top-level `txHash`.                             |
| `ACTIVITY_TYPE_EXIT_STARTED`, `ACTIVITY_TYPE_EXIT_SUCCEEDED`, `ACTIVITY_TYPE_EXIT_SKIPPED`, `ACTIVITY_TYPE_EXIT_FAILED` | One exit-action execution transition                       | Use `execution`; monetary display fields can be absent when no authoritative value exists. |
| `ACTIVITY_TYPE_POSITION_REDUCED`                                                                                        | One completed sell that leaves base inventory              | Use the token and exact raw accounting from `position`.                                    |
| `ACTIVITY_TYPE_POSITION_CLOSED`                                                                                         | One completed sell that closes the position                | Use the token and exact raw accounting from `position`.                                    |

All such rows can share `copyRunId` and `copyAccount`. Position and execution
rows can additionally carry `userPositionId`, `followerPositionId`, `tradeId`,
or `execution.exitActionId`. The public `ACTIVITY_TYPE_COPY_STOPPED` row does
**not** expose a parent/child correlation identifier connecting it to every
downstream exit.
Do not group rows by timestamp proximity or assume that every nearby sell was
caused by that Stop Copy.

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
| `evidence`                  | Exact safely covered fact boundary and fresh action block used by preparation.                                   |
| one preview                 | Exactly one of `startCopy`, `addCapital`, `stopCopy`, `withdrawQuote`, `manualSell`, or `closePosition`.         |

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
PREPARED_ACTION_WARNING_ALLOCATION_STALE
PREPARED_ACTION_WARNING_INVALID_STOP_INTENT_RECOVERED
PREPARED_ACTION_WARNING_OWNER_SNAPSHOT_REQUIRES_REFRESH
```

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
{}
```

`data.withdrawQuote` contains the quote token, status-bearing quote balance,
and optional exact sweep amount and recipient. This is a repeatable max sweep;
the recipient is current prepared state, not a client-selected field.

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

The pending contract has no wallet challenge or session endpoints. A successful
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
| 408  | Request was canceled                                                |
| 404  | Requested public resource not found                                 |
| 429  | Server action-preparation capacity is exhausted                     |
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
- If a list cursor receives 400, discard it and restart at page one with the
  current filters.

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

## Complete HTTP Operation Index

The pending public HTTP surface contains **32 operations**:

- 26 GET reads;
- 6 transaction-preparation POSTs.

The two targeted copy-run/copy-account reads added after the original read
surface are:

```text
GET /users/{ownerAddress}/copy-runs/{copyRunId}/cashback-policy
GET /copy-accounts/{chainId}/{copyAccount}/wallet-inventory
```

There is no generated HTTP mapping for private operator transaction
preparation, projector, or execution methods. The pending operator contract
removes wallet-proof verification entirely. Frontend clients must use only the
aggregate routes in this document.

## Current Availability and Verification Status

At `origin/main` commit
`1b0d9e27b60dc02e960f4557232727c50dcf724b`, the generated OpenAPI contract
still contains 34 public HTTP operations:

- 26 GET read operations;
- 6 transaction-preparation POST operations;
- 2 wallet-session POST operations.

The pending release removes the two wallet-session operations, leaving the 32
operations in the index above. All remaining operations have concrete aggregate
handlers. No remaining transaction-preparation route should be feature-gated as
“not implemented.” Preparation routes do not broadcast transactions; they
return a typed product outcome and, only when executable, an exact wallet call.

Until the pending release is deployed, an environment may still expose the two
historical session routes and require their bearer token for Manual Sell and
Close Position. Frontend rollout must therefore be coordinated with the API
deployment; do not infer the environment contract solely from this catalog's
newest entry.

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

| Route                        | HTTP/result                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `:prepareStartCopy`          | 200 `READY`, `START_COPY_STAGE_CREATE_REQUIRED`, `PREPARED_CALL_KIND_START_COPY_CREATE`                         |
| `:prepareAddCapital`         | 200 `READY`, `PREPARED_CALL_KIND_ADD_CAPITAL`                                                                   |
| `:prepareStopCopy`           | 200 `READY`, `PREPARED_CALL_KIND_STOP_COPY`                                                                     |
| `:prepareWithdrawQuote`      | 200 typed `PREPARED_ACTION_STATUS_UNAVAILABLE` / `PREPARED_ACTION_REASON_ACCOUNT_NOT_STOPPED` for an active run |
| `:prepareManualSell`         | Historically available behind a wallet-session bearer token; the pending contract prepares directly             |
| `:prepareClosePosition`      | Historically available behind a wallet-session bearer token; the pending contract prepares directly             |
| `/wallet-session-challenges` | Historical endpoint; removed by the pending contract                                                            |
| `/wallet-sessions`           | Historical endpoint; removed by the pending contract                                                            |

The Withdraw result demonstrates an important integration rule: HTTP 200 with
a typed `UNAVAILABLE`, `PENDING`, or `COMPLETED` result is normal product state,
not an unavailable endpoint.

### Read integration status

All 26 GET operations are implemented and exposed by the generated gateway.
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
