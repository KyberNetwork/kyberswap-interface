# Copy Trade API FE Catalog

## Common Rules

Base path: `/api/v1`

All endpoints are `GET`.

JSON field names are camelCase. Protobuf source fields remain snake_case, but
REST/OpenAPI use protobuf JSON names for frontend ergonomics.

Query parameter names are also shown in camelCase to match the generated
OpenAPI. Query values such as `opened_at`, `portfolio_value`, and
`position_closed` remain the current literal string values.

Addresses:

- Use `0x` EVM addresses.
- The server accepts mixed case in most public request patterns but canonicalizes
  to lowercase.

Large numeric values:

- USD values, raw token values, percentages, prices, and block numbers that may
  exceed JavaScript precision are strings.
- Treat these as decimal strings in the UI. Do not parse them through JS
  `number` unless the field is explicitly an integer count.

Timestamps:

- `google.protobuf.Timestamp` fields render as RFC3339 strings.

Freshness:

- Every response has `meta`.
- If `meta.isStale=true`, the response is still renderable but should be
  presented as stale data.
- `meta.asOfChains` explains which chains the response depends on.
- Availability is preferred over false empty data. If prior trustworthy data
  exists, the API keeps serving it with stale metadata.

## Response Shapes

Single-resource endpoints:

```json
{
  "data": {},
  "meta": {
    "requestId": "...",
    "generatedAt": "2026-07-08T10:00:00Z",
    "dataAsOf": "2026-07-08T09:59:30Z",
    "isStale": false,
    "asOfChains": []
  }
}
```

Cursor-paginated endpoints:

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

Page-number endpoints:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalCount": 250,
    "totalPages": 10
  },
  "meta": {}
}
```

## Pagination

Page-number pagination is used only for:

- `GET /api/v1/leaderboard`
- `GET /api/v1/agents`
- `GET /api/v1/users/{ownerAddress}/copy-accounts`

Defaults:

- `page`: defaults to `1` when omitted or `<= 0`
- `pageSize`: defaults to `25`
- `pageSize` max: `100`

Cursor pagination is used for the potentially large lists.

Defaults:

- `limit`: defaults to `25`
- `limit` max: `100`
- `cursor`: pass `pagination.nextCursor` from the previous response

Cursor rules:

- Treat cursors as opaque strings.
- Reuse a cursor only with the same endpoint, filters, and sort params.
- Cursors are signed, scoped, and expire after 72 hours.
- If a cursor is invalid or expired, restart the list without `cursor`.

## Shared Query Values

Performance query values:

| Param      | Default           | Supported values                                   |
| ---------- | ----------------- | -------------------------------------------------- |
| `series`   | `portfolio_value` | currently `portfolio_value` is the expected series |
| `window`   | `30d`             | `7d`, `30d`, `90d`, `all`                          |
| `interval` | `day`             | `hour`, `day`, `week`, `month`                     |

Position query values:

| Param       | Default     | Supported values                                                                |
| ----------- | ----------- | ------------------------------------------------------------------------------- |
| `status`    | all         | `all`, `open`, `closed`                                                         |
| `sortBy`    | `opened_at` | `opened_at`, `closed_at`, `value_usd`, `realized_pnl_usd`, `unrealized_pnl_usd` |
| `sortOrder` | `desc`      | `desc`, `asc`                                                                   |

Activity type values:

- `copy_started`
- `copy_stopped`
- `position_opened`
- `position_closed`
- `capital_added`
- `capital_removed`
- `fee_charged`
- `rebate_received`
- `trade_skipped`
- `execution_failed`

Copy-run status values:

- all when omitted
- `active`
- `closed`

Copy-account status values:

- all when omitted or `all`
- `active`
- `closed`
- `unknown`

Leaderboard sort values:

| Param       | Default       | Supported values                                                  |
| ----------- | ------------- | ----------------------------------------------------------------- |
| `sortBy`    | `apr_30d_pct` | `apr_30d_pct`, `win_rate_pct`, `volume_usd`, `aum_usd`, `copiers` |
| `sortOrder` | `desc`        | `desc`, `asc`                                                     |

## Screen Workflow Map

Leaderboard:

- Load chains with `GET /api/v1/chains`.
- Load cards with `GET /api/v1/leaderboard/summary`.
- Load rows with `GET /api/v1/leaderboard`.

Agent discovery:

- Use `GET /api/v1/agents` for searchable agent cards.

Agent profile:

- Header/profile: `GET /api/v1/agents/{agentId}`
- Metric cards: `GET /api/v1/agents/{agentId}/stats`
- Chart: `GET /api/v1/agents/{agentId}/performance`
- Positions tab: `GET /api/v1/agents/{agentId}/positions`
- Position detail: `GET /api/v1/agents/{agentId}/positions/{positionId}`
- Position event timeline:
  `GET /api/v1/agents/{agentId}/positions/{positionId}/events`
- Public COT logs: `GET /api/v1/agents/{agentId}/cot-logs`

My Copies dashboard:

- Summary cards: `GET /api/v1/users/{ownerAddress}/copy-summary`
- Copy-run list: `GET /api/v1/users/{ownerAddress}/copy-runs`
- Flattened position list: `GET /api/v1/users/{ownerAddress}/positions`
- Activity list: `GET /api/v1/users/{ownerAddress}/activity`
- Copy accounts: `GET /api/v1/users/{ownerAddress}/copy-accounts`

Copy-run detail:

- Detail: `GET /api/v1/users/{ownerAddress}/copy-runs/{copyRunId}`
- Positions:
  `GET /api/v1/users/{ownerAddress}/copy-runs/{copyRunId}/positions`
- Performance:
  `GET /api/v1/users/{ownerAddress}/copy-runs/{copyRunId}/performance`

Copy-account detail:

- Summary: `GET /api/v1/copy-accounts/{chainId}/{copyAccount}`
- Balances: `GET /api/v1/copy-accounts/{chainId}/{copyAccount}/balances`
- Positions: `GET /api/v1/copy-accounts/{chainId}/{copyAccount}/positions`
- History: `GET /api/v1/copy-accounts/{chainId}/{copyAccount}/history`

## Endpoint Catalog

### Chain Metadata

#### `GET /api/v1/chains`

Lists enabled public chain metadata.

Query params: none.

Response data: `Chain[]`

Important fields:

- `chainId`
- `slug`
- `name`
- `iconUrl`
- `isEnabled`

Example:

```http
GET /api/v1/chains
```

### Leaderboard And Discovery

#### `GET /api/v1/leaderboard/summary`

Returns summary cards for the filtered leaderboard universe.

Query params:

| Param      | Required | Notes                                               |
| ---------- | -------- | --------------------------------------------------- |
| `chainId`  | no       | Positive chain id. Non-positive values are ignored. |
| `strategy` | no       | Lowercased and trimmed. Product-defined key.        |
| `risk`     | no       | Lowercased and trimmed. Product-defined key.        |
| `search`   | no       | Lowercased and trimmed.                             |

Response data: `LeaderboardSummary`

Example:

```http
GET /api/v1/leaderboard/summary?chainId=8453&risk=medium
```

#### `GET /api/v1/leaderboard`

Returns leaderboard agent rows.

Pagination: page-number.

Query params:

| Param       | Required | Notes                                               |
| ----------- | -------- | --------------------------------------------------- |
| `chainId`   | no       | Positive chain id. Non-positive values are ignored. |
| `strategy`  | no       | Lowercased and trimmed. Product-defined key.        |
| `risk`      | no       | Lowercased and trimmed. Product-defined key.        |
| `search`    | no       | Lowercased and trimmed.                             |
| `sortBy`    | no       | Defaults to `apr_30d_pct`.                          |
| `sortOrder` | no       | Defaults to `desc`.                                 |
| `page`      | no       | Defaults to `1`.                                    |
| `pageSize`  | no       | Defaults to `25`, max `100`.                        |

Response data: `AgentCard[]`

Example:

```http
GET /api/v1/leaderboard?chainId=8453&sortBy=aum_usd&sortOrder=desc&page=1&pageSize=25
```

#### `GET /api/v1/agents`

Searches and lists public agents.

Pagination: page-number.

Query params:

| Param      | Required | Notes                                               |
| ---------- | -------- | --------------------------------------------------- |
| `chainId`  | no       | Positive chain id. Non-positive values are ignored. |
| `strategy` | no       | Lowercased and trimmed. Product-defined key.        |
| `risk`     | no       | Lowercased and trimmed. Product-defined key.        |
| `search`   | no       | Lowercased and trimmed.                             |
| `page`     | no       | Defaults to `1`.                                    |
| `pageSize` | no       | Defaults to `25`, max `100`.                        |

Response data: `AgentCard[]`

Example:

```http
GET /api/v1/agents?search=eth&page=1&pageSize=20
```

### Agent Profile

#### `GET /api/v1/agents/{agentId}`

Returns one public agent profile.

Path params:

| Param     | Required | Notes               |
| --------- | -------- | ------------------- |
| `agentId` | yes      | Non-empty agent id. |

Response data: `AgentProfile`

Example:

```http
GET /api/v1/agents/agent_eth_momentum
```

#### `GET /api/v1/agents/{agentId}/stats`

Returns headline agent metrics.

Query params:

| Param     | Required | Notes                                                |
| --------- | -------- | ---------------------------------------------------- |
| `window`  | no       | Defaults to `30d`. Currently only `30d` is accepted. |
| `chainId` | no       | Positive chain id. Non-positive values are ignored.  |

Response data: `AgentStats`

Example:

```http
GET /api/v1/agents/agent_eth_momentum/stats?window=30d&chainId=8453
```

#### `GET /api/v1/agents/{agentId}/performance`

Returns profile chart points.

Pagination: cursor.

Query params:

| Param      | Required | Notes                                                       |
| ---------- | -------- | ----------------------------------------------------------- |
| `series`   | no       | Defaults to `portfolio_value`.                              |
| `window`   | no       | Defaults to `30d`. Supports `7d`, `30d`, `90d`, `all`.      |
| `interval` | no       | Defaults to `day`. Supports `hour`, `day`, `week`, `month`. |
| `chainId`  | no       | Positive chain id. Non-positive values are ignored.         |
| `cursor`   | no       | Opaque cursor from `pagination.nextCursor`.                 |
| `limit`    | no       | Defaults to `25`, max `100`.                                |

Response data: `PerformancePoint[]`

Example:

```http
GET /api/v1/agents/agent_eth_momentum/performance?series=portfolio_value&window=30d&interval=day&limit=60
```

#### `GET /api/v1/agents/{agentId}/positions`

Returns agent position summary rows.

Pagination: cursor.

Query params:

| Param       | Required | Notes                                               |
| ----------- | -------- | --------------------------------------------------- |
| `status`    | no       | Supports `all`, `open`, `closed`. Omit for all.     |
| `chainId`   | no       | Positive chain id. Non-positive values are ignored. |
| `token`     | no       | Optional token address filter.                      |
| `sortBy`    | no       | Defaults to `opened_at`.                            |
| `sortOrder` | no       | Defaults to `desc`.                                 |
| `cursor`    | no       | Opaque cursor from `pagination.nextCursor`.         |
| `limit`     | no       | Defaults to `25`, max `100`.                        |

Response data: `PositionSummary[]`

Example:

```http
GET /api/v1/agents/agent_eth_momentum/positions?status=open&sortBy=value_usd&sortOrder=desc&limit=25
```

#### `GET /api/v1/agents/{agentId}/positions/{positionId}`

Returns one agent position detail.

Response data: `PositionSummary`

Example:

```http
GET /api/v1/agents/agent_eth_momentum/positions/0xabc123
```

#### `GET /api/v1/agents/{agentId}/positions/{positionId}/events`

Returns lifecycle events for an agent position.

Pagination: cursor.

Query params:

| Param    | Required | Notes                                       |
| -------- | -------- | ------------------------------------------- |
| `cursor` | no       | Opaque cursor from `pagination.nextCursor`. |
| `limit`  | no       | Defaults to `25`, max `100`.                |

Response data: `PositionEvent[]`

Example:

```http
GET /api/v1/agents/agent_eth_momentum/positions/0xabc123/events?limit=50
```

#### `GET /api/v1/agents/{agentId}/cot-logs`

Returns public COT decision logs.

Pagination: cursor.

Query params:

| Param        | Required | Notes                                                      |
| ------------ | -------- | ---------------------------------------------------------- |
| `chainId`    | no       | Positive chain id. Non-positive values are ignored.        |
| `positionId` | no       | Optional position id filter.                               |
| `from`       | no       | RFC3339 timestamp.                                         |
| `to`         | no       | RFC3339 timestamp. Must be after `from` when both are set. |
| `cursor`     | no       | Opaque cursor from `pagination.nextCursor`.                |
| `limit`      | no       | Defaults to `25`, max `100`.                               |

Response data: `CotLog[]`

Example:

```http
GET /api/v1/agents/agent_eth_momentum/cot-logs?chainId=8453&from=2026-07-01T00:00:00Z&limit=25
```

### Owner Dashboard

#### `GET /api/v1/users/{ownerAddress}/copy-summary`

Returns "My Copies" summary values for one owner.

Query params:

| Param     | Required | Notes                                               |
| --------- | -------- | --------------------------------------------------- |
| `chainId` | no       | Positive chain id. Non-positive values are ignored. |

Response data: `OwnerCopySummary`

Example:

```http
GET /api/v1/users/0x1111111111111111111111111111111111111111/copy-summary?chainId=8453
```

#### `GET /api/v1/users/{ownerAddress}/copy-runs`

Lists copy runs for an owner.

Pagination: cursor.

Query params:

| Param     | Required | Notes                                               |
| --------- | -------- | --------------------------------------------------- |
| `status`  | no       | Supports `active`, `closed`; omit for all.          |
| `agentId` | no       | Optional agent filter.                              |
| `chainId` | no       | Positive chain id. Non-positive values are ignored. |
| `cursor`  | no       | Opaque cursor from `pagination.nextCursor`.         |
| `limit`   | no       | Defaults to `25`, max `100`.                        |

Response data: `CopyRunSummary[]`

Example:

```http
GET /api/v1/users/0x1111111111111111111111111111111111111111/copy-runs?status=active&limit=25
```

#### `GET /api/v1/users/{ownerAddress}/copy-runs/{copyRunId}`

Returns one owner copy-run detail.

Response data: `CopyRunSummary`

Example:

```http
GET /api/v1/users/0x1111111111111111111111111111111111111111/copy-runs/run_8453_abc
```

#### `GET /api/v1/users/{ownerAddress}/copy-runs/{copyRunId}/positions`

Lists positions inside one copy run.

Pagination: cursor.

Query params:

| Param       | Required | Notes                                           |
| ----------- | -------- | ----------------------------------------------- |
| `status`    | no       | Supports `all`, `open`, `closed`. Omit for all. |
| `cursor`    | no       | Opaque cursor from `pagination.nextCursor`.     |
| `limit`     | no       | Defaults to `25`, max `100`.                    |
| `sortBy`    | no       | Defaults to `opened_at`.                        |
| `sortOrder` | no       | Defaults to `desc`.                             |

Response data: `PositionSummary[]`

Example:

```http
GET /api/v1/users/0x1111111111111111111111111111111111111111/copy-runs/run_8453_abc/positions?status=open&sortBy=opened_at
```

#### `GET /api/v1/users/{ownerAddress}/copy-runs/{copyRunId}/performance`

Returns copy-run chart points.

Pagination: cursor.

Query params:

| Param      | Required | Notes                                                       |
| ---------- | -------- | ----------------------------------------------------------- |
| `series`   | no       | Defaults to `portfolio_value`.                              |
| `window`   | no       | Defaults to `30d`. Supports `7d`, `30d`, `90d`, `all`.      |
| `interval` | no       | Defaults to `day`. Supports `hour`, `day`, `week`, `month`. |
| `cursor`   | no       | Opaque cursor from `pagination.nextCursor`.                 |
| `limit`    | no       | Defaults to `25`, max `100`.                                |

Response data: `PerformancePoint[]`

Example:

```http
GET /api/v1/users/0x1111111111111111111111111111111111111111/copy-runs/run_8453_abc/performance?window=90d&interval=day
```

#### `GET /api/v1/users/{ownerAddress}/positions`

Lists flattened owner positions across copy runs.

Pagination: cursor.

Query params:

| Param       | Required | Notes                                               |
| ----------- | -------- | --------------------------------------------------- |
| `status`    | no       | Supports `all`, `open`, `closed`. Omit for all.     |
| `agentId`   | no       | Optional agent filter.                              |
| `chainId`   | no       | Positive chain id. Non-positive values are ignored. |
| `cursor`    | no       | Opaque cursor from `pagination.nextCursor`.         |
| `limit`     | no       | Defaults to `25`, max `100`.                        |
| `sortBy`    | no       | Defaults to `opened_at`.                            |
| `sortOrder` | no       | Defaults to `desc`.                                 |

Response data: `PositionSummary[]`

Example:

```http
GET /api/v1/users/0x1111111111111111111111111111111111111111/positions?status=closed&sortBy=realized_pnl_usd&sortOrder=desc
```

#### `GET /api/v1/users/{ownerAddress}/activity`

Lists public owner activity rows.

Pagination: cursor.

Query params:

| Param       | Required | Notes                                               |
| ----------- | -------- | --------------------------------------------------- |
| `copyRunId` | no       | Optional copy-run filter.                           |
| `chainId`   | no       | Positive chain id. Non-positive values are ignored. |
| `cursor`    | no       | Opaque cursor from `pagination.nextCursor`.         |
| `limit`     | no       | Defaults to `25`, max `100`.                        |

Response data: `ActivityRow[]`

Example:

```http
GET /api/v1/users/0x1111111111111111111111111111111111111111/activity?chainId=8453&limit=25
```

#### `GET /api/v1/users/{ownerAddress}/copy-accounts`

Lists copy accounts for an owner.

Pagination: page-number.

Query params:

| Param      | Required | Notes                                               |
| ---------- | -------- | --------------------------------------------------- |
| `status`   | no       | Supports `all`, `active`, `closed`, `unknown`.      |
| `chainId`  | no       | Positive chain id. Non-positive values are ignored. |
| `page`     | no       | Defaults to `1`.                                    |
| `pageSize` | no       | Defaults to `25`, max `100`.                        |

Response data: `CopyAccountSummary[]`

Example:

```http
GET /api/v1/users/0x1111111111111111111111111111111111111111/copy-accounts?status=active&page=1&pageSize=25
```

### Copy Account

#### `GET /api/v1/copy-accounts/{chainId}/{copyAccount}`

Returns one chain-scoped copy-account summary.

Path params:

| Param         | Required | Notes              |
| ------------- | -------- | ------------------ |
| `chainId`     | yes      | Positive chain id. |
| `copyAccount` | yes      | `0x` EVM address.  |

Response data: `CopyAccountSummary`

Example:

```http
GET /api/v1/copy-accounts/8453/0x2222222222222222222222222222222222222222
```

#### `GET /api/v1/copy-accounts/{chainId}/{copyAccount}/balances`

Lists explicit wallet inventory for a copy account.

Pagination: cursor.

Query params:

| Param            | Required | Notes                                              |
| ---------------- | -------- | -------------------------------------------------- |
| `tokenAddresses` | no       | Repeated token address filter. At most 100 values. |
| `cursor`         | no       | Opaque cursor from `pagination.nextCursor`.        |
| `limit`          | no       | Defaults to `25`, max `100`.                       |

Repeated query syntax:

```http
GET /api/v1/copy-accounts/8453/0x2222222222222222222222222222222222222222/balances?tokenAddresses=0xaaaa...&tokenAddresses=0xbbbb...
```

Response data: `WalletBalanceRow[]`

Important fields:

- `balanceSource`
- `freshnessStatus`
- `balanceAsOfBlock`
- `cachedAt`
- `stalenessReason`

#### `GET /api/v1/copy-accounts/{chainId}/{copyAccount}/positions`

Lists positions for a copy account.

Pagination: cursor.

Query params:

| Param       | Required | Notes                                           |
| ----------- | -------- | ----------------------------------------------- |
| `status`    | no       | Supports `all`, `open`, `closed`. Omit for all. |
| `cursor`    | no       | Opaque cursor from `pagination.nextCursor`.     |
| `limit`     | no       | Defaults to `25`, max `100`.                    |
| `sortBy`    | no       | Defaults to `opened_at`.                        |
| `sortOrder` | no       | Defaults to `desc`.                             |

Response data: `PositionSummary[]`

Example:

```http
GET /api/v1/copy-accounts/8453/0x2222222222222222222222222222222222222222/positions?status=open&limit=25
```

#### `GET /api/v1/copy-accounts/{chainId}/{copyAccount}/history`

Lists balance and execution history for a copy account.

Pagination: cursor.

Query params:

| Param          | Required | Notes                                                                      |
| -------------- | -------- | -------------------------------------------------------------------------- |
| `activityType` | no       | Supports the activity type values listed above. Omit or use `all` for all. |
| `cursor`       | no       | Opaque cursor from `pagination.nextCursor`.                                |
| `limit`        | no       | Defaults to `25`, max `100`.                                               |

Response data: `ActivityRow[]`

Example:

```http
GET /api/v1/copy-accounts/8453/0x2222222222222222222222222222222222222222/history?activityType=position_closed&limit=25
```

## Main Response Models

### `AgentCard`

Used by leaderboard and agent discovery.

Key fields:

- `agentId`
- `leaderAddress`
- `displayName`
- `avatarUrl`
- `isVerified`
- `badges`
- `isTrending`
- `risk`
- `strategy`
- `modelName`
- `chains`
- `stats`
- `asOf`

### `AgentProfile`

Used by agent profile header/detail.

Key fields:

- `agentId`
- `leaderAddresses`
- `displayName`
- `avatarUrl`
- `bio`
- `risk`
- `strategy`
- `modelName`
- `badges`
- `isTrending`
- `performanceFeePct`
- `liveSince`
- `stats`
- `whitelistedSymbols`
- `tags`

### `AgentStats`

Metric strings are decimal strings.

Fields:

- `apr30dPct`
- `winRatePct`
- `volumeUsd`
- `copiers`
- `aumUsd`
- `openPositions`
- `totalRealizedPnlUsd`

### `PositionSummary`

Used by agent positions, owner positions, copy-run positions, and copy-account
positions.

Key fields:

- `positionId`
- `userPositionId`
- `agentPositionId`
- `copyRunId`
- `agentId`
- `chainId`
- `copyAccount`
- `tradeId`
- `token`
- `status`
- `trackingStatus`
- `statusReason`
- `amountRaw`
- `amountDecimal`
- `entryPriceUsd`
- `currentPriceUsd`
- `exitPriceUsd`
- `valueUsd`
- `realizedPnlUsd`
- `unrealizedPnlUsd`
- `unrealizedPnlPct`
- `feeUsd`
- `rebateUsd`
- `openedAt`
- `closedAt`
- `valuation`

### `CopyRunSummary`

Used by owner copy-run list and copy-run detail.

Key fields:

- `copyRunId`
- `ownerAddress`
- `agentId`
- `chainId`
- `copyAccount`
- `status`
- `startedAt`
- `stoppedAt`
- `capitalInUsd`
- `capitalOutUsd`
- `portfolioValueUsd`
- `realizedPnlUsd`
- `unrealizedPnlUsd`
- `myAprSinceCopyPct`
- `openPositionCount`
- `closedTradeCount`
- `feesPaidUsd`
- `rebatesReceivedUsd`
- `netFeesPaidUsd`
- `estimatedRebatePendingUsd`
- `agentStats`

### `CopyAccountSummary`

Used by owner copy-account list and copy-account detail.

Key fields:

- `chainId`
- `copyAccount`
- `ownerAddress`
- `status`
- `activeCopyRuns`
- `totalAllocatedUsd`
- `portfolioValueUsd`
- `availableBalanceUsd`
- `realizedPnlUsd`
- `unrealizedPnlUsd`
- `netFeesPaidUsd`

### `ActivityRow`

Used by owner activity and copy-account history.

Key fields:

- `activityId`
- `ownerAddress`
- `agentId`
- `chainId`
- `copyRunId`
- `copyAccount`
- `activityType`
- `summary`
- `occurredAt`
- `metadata`

### `WalletBalanceRow`

Used by copy-account balances.

Key fields:

- `chainId`
- `copyAccount`
- `tokenAddress`
- `amountDecimal`
- `balanceSource`
- `freshnessStatus`
- `balanceAsOfBlock`
- `cachedAt`
- `stalenessReason`

## Error Behavior

The REST gateway maps service errors from gRPC canonical codes:

| Situation                                              | Expected behavior                        |
| ------------------------------------------------------ | ---------------------------------------- |
| Invalid parameter, malformed cursor, unsupported value | HTTP 400 equivalent                      |
| Missing resource                                       | HTTP 404 equivalent                      |
| Dependency not configured                              | HTTP 400/failed-precondition equivalent  |
| Request canceled or deadline exceeded                  | Canceled/deadline response               |
| Unexpected query failure                               | HTTP 500 equivalent with generic message |

Frontend guidance:

- Treat 400s as request bugs or expired/mismatched cursor cases.
- Treat 404s as not-found states.
- Prefer rendering stale `data` when the API returns it with `meta.isStale`.
- For expired cursors, restart the list from the first page without `cursor`.

## FE Integration Notes

- Use `meta.isStale` and `meta.stalenessReason` for stale-data banners.
- Use `meta.asOfChains` for per-chain freshness hints on cross-chain screens.
- Keep cursor state scoped to the exact endpoint and query filters.
- Use decimal/string-safe formatting helpers for USD, raw token amounts, and
  percentages.
- Preserve unknown `metadata` keys in `ActivityRow` and `PerformancePoint`.
- Do not assume write APIs exist in this service for v1.
