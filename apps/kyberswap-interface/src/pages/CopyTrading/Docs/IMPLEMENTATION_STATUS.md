# Copy Trading Implementation Status

Last reviewed: 2026-07-29 (fresh code, contract, and live API re-audit)

This note records the current integration state of:

```text
live API response -> RTK Query service -> adapter/model -> Copy Trading UI
```

The configured API is currently:

```text
VITE_COPY_TRADING_API_URL=https://pre-copy-trade-api.kyberengineering.io/api/v1
```

This is a pre-release environment. Live response values and freshness statuses
can change, so recheck them before implementing or validating a fix.

## Current Service Coverage

- Runtime mock transport has been removed.
- `services/copyTrading/index.ts` uses `fetchBaseQuery`.
- `services/copyTrading/adapters.ts` is the compatibility boundary between
  API-native responses and the existing UI models.
- The service declares all 32 operations from the new contract:
  - 24 GET queries.
  - 8 POST mutations.
- POST request/response models and named hooks are declared for:
  - Start Copy.
  - Add Capital.
  - Stop Copy.
  - Withdraw Quote.
  - Manual Sell.
  - Close Position.
  - Wallet Session Challenge.
  - Wallet Session.
- The checked-in contract sources for this integration are:
  - `FE_API_Catalog.md`.
  - `openapi.yaml`.

## Mapping Confirmed Correct

- Owner views use `OWNER_COPY_VIEW_OPEN` and `OWNER_COPY_VIEW_HISTORY`.
- Agent action logs use `/action-logs`.
- Performance series map separately to portfolio equity and cumulative realised
  P&L.
- Flat fees, cashback, pending cashback, and net fee cost use their matching API
  metrics.
- Position amount uses `displayBaseRaw` and token decimals. Raw units are not
  displayed as a human amount when decimals are unavailable.
- Position action labels derive from `actionKind` or
  `availableActionKinds`.
- Action-log statuses support `broadcast`, `skipped`, and `failed`.
- Unavailable metrics generally render as `—`.
- Empty pending sell obligations normalize `data: null` to an empty list.

## Current UI Read Coverage

The current UI consumes 15 of the 24 GET queries:

- Chains.
- Leaderboard summary and rows.
- Agent list, profile, stats, performance, positions, and action logs.
- Owner copy summary, copy runs, copy-run detail, positions, performance, and
  activity.

The following nine GET queries are declared and typed in the service but have no
Copy Trading UI consumer:

- Agent position detail.
- Agent position events.
- All owner positions.
- Owner copy-account list.
- Copy-account detail.
- Copy-account balances.
- Copy-account positions.
- Pending sell obligations.
- Copy-account history.

These are not service coverage gaps, but they are incomplete UI/drilldown
coverage. Pending sell obligations are also required to implement Manual Sell
safely.

## Known API/UI Mismatches

### P0: Performance `All` Sends an Unsupported Combination

Agent Profile and active Copy Detail currently send:

```text
window=WINDOW_ALL
interval=PERFORMANCE_INTERVAL_DAY
```

The API only supports `WINDOW_ALL` with `PERFORMANCE_INTERVAL_WEEK` or
`PERFORMANCE_INTERVAL_MONTH` for portfolio equity and cumulative realised P&L.
Direct live calls returned HTTP 400:

```text
invalid argument: unsupported performance series/window/interval combination
```

Affected files:

- `AgentProfile/AgentStats.tsx`.
- `CopyDetail/CopyRunPerformance.tsx`.
- `components/PerformanceCharts.tsx`.

### P0: Write Flows Are Declared but Not Connected

The mutation hooks exist only in the service. No Copy Trading UI currently
invokes them.

Inactive UI actions:

- Leaderboard Copy.
- Agent Profile Copy.
- Add Capital.
- Stop Copying.
- Manual Sell.
- Close Position.
- Withdraw Quote is not exposed.
- Wallet session challenge/session is not integrated.

Action availability also needs to control the UI:

- Leaderboard Copy ignores `startCopyAvailability`.
- Agent Profile Copy disables only when a non-available status is explicitly
  present; missing/unspecified availability currently fails open.
- Add Capital and Stop Copying ignore their run-level availability.
- Withdraw availability is not rendered.
- Position actions render labels but do not execute their preparation flow.

The latest live open-run fixture advertised Add and Stop as available and
Withdraw as unavailable with
`PREPARED_ACTION_REASON_ACCOUNT_NOT_STOPPED`. Other statuses such as `PENDING`
remain valid contract states and must fail closed.

Affected files:

- `AgentList/AgentTable.tsx`.
- `AgentProfile/AgentInstruction.tsx`.
- `MyCopies/ActiveSubscriptionsTable.tsx`.
- `components/AgentSidebarCards.tsx`.
- `CopyDetail/Tables.tsx`.

### P1: Cursor Pagination Is Ignored Outside the Leaderboard

The leaderboard implements cursor navigation. Most other list consumers only
request the first page.

Live checks already showed truncation:

- Agent closed positions: 25 rows with `hasMore: true`.
- Agent action logs: 25 rows with `hasMore: true`.
- Owner activity: 100 rows with `hasMore: true`.

Affected surfaces:

- Agent open positions, trade history, and action logs.
- Copy Detail open and closed positions.
- My Copies and Copy History.
- Alerts Feed.
- Agent lookup and sidebar lists.
- Performance series if a supported selection grows beyond the requested
  limit.

### P1: Activity Details Are Not Fully Typed

The API exposes exactly one typed detail variant per activity:

- `copyLifecycle`.
- `position`.
- `capital`.
- `fee`.
- `execution`.

`ActivityRow` currently models these as `Record<string, unknown>`. Alerts Feed
then parses the display-only `summary` to determine profit/loss color.

A live negative close example returned:

```text
summary="Position closed"
position.realizedPnlUsd.value="-0.021756"
```

Because the summary contains no P&L value, the current regex renders the event
as positive. Business logic should use `type` and the typed detail object.

Affected files:

- `services/copyTrading/types.ts`.
- `services/copyTrading/adapters.ts`.
- `MyCopies/components.tsx`.

### P1: Freshness Is Preserved but Not Displayed

Adapters preserve response `meta`, metric statuses, and valuation statuses.
The UI displays stale values the same as current values.

The latest live leaderboard response was `DATA_STATUS_CURRENT`, but stale and
unavailable states remain part of the contract and have also appeared in
earlier live responses:

```text
meta.status=DATA_STATUS_STALE
metric.status=METRIC_STATUS_STALE
```

The contract requires stale values to have an appropriate stale indication.
Unavailable values must remain `—`, not fabricated zeroes.

### P1: Agent Portfolio Chart Is Labelled as AUM

Agent Profile requests `PERFORMANCE_SERIES_PORTFOLIO_EQUITY`, but the chart
title is `Assets Under Management ($)`.

Agent portfolio equity and follower `aumUsd` are separate API metrics. Use a
label such as `Portfolio Value` or `Capital Value`.

Affected file:

- `AgentProfile/AgentStats.tsx`.

### P1: Read Errors Are Rendered as Empty or Not Found

Most read surfaces consume `data` and `isFetching` but ignore `isError`:

- Agent positions, history, and action logs render their empty-state copy when
  the request fails.
- Leaderboard, My Copies, History, and Alerts can also look legitimately empty
  after a failed request.
- Agent Profile redirects to the leaderboard when profile data is missing after
  an error.
- Copy Detail redirects to its parent list when either copy-run or agent data is
  missing after an error.

The UI should distinguish loading, empty, not found, disconnected-wallet, and
request-error states.

### P2: Remaining Contract/Adapter Gaps

- OpenAPI supports `LEADERBOARD_SORT_FIELD_OPEN_POSITIONS`, but
  `LeaderboardSortBy`, `leaderboardSortMap`, and the Position header omit it.
- `LeaderboardFilters.strategy` uses the loose display `StrategyKey` type, so
  callers can construct unsupported strategy-category query values even though
  the current UI only sends valid categories.
- `PositionEvent.activityType` is modeled as the owner `ActivityType`, while the
  API exposes a source-owned `eventType` string.
- The performance adapter treats every non-portfolio/unknown series as realised
  P&L before checking whether the returned series is supported.
- Several adapters satisfy required compatibility fields with empty strings or
  zero chain IDs when the API omits them. This is acceptable for display
  fallback only; action logic must use direct authoritative reads and prepared
  action identity.

## Smaller UI Issues

- Alerts Feed displays `LIVE` but has no polling or refetch interval.
- An unavailable win rate displays `—`, but its progress marker remains at 0%.
- Strategy categories can overlap, but `AgentCell` displays only one derived
  strategy badge.
- Sidebar active-agent state compares `displayName` instead of canonical
  `agentId`.
- Leaderboard search sends a request on every keystroke without debouncing.
- Performance charts combine both query error/loading flags, so one failed
  series can put both charts into the error state.
- Wallet-disconnected owner screens render empty content instead of a dedicated
  connect-wallet state.

## Live Test Fixture

A previously useful owner fixture is:

```text
0x665c7a5bac26af69398d60e7730694863e66a759
```

Latest recheck:

- Five leaderboard agents.
- Leaderboard response status: `DATA_STATUS_CURRENT`.
- Three open Copy Runs for the owner fixture.
- Add/Stop availability: `AVAILABLE`.
- Withdraw availability: `UNAVAILABLE / ACCOUNT_NOT_STOPPED`.
- Agent closed positions and action logs still return `hasMore: true`.
- Owner activity still returns `hasMore: true` at `limit=100`.
- `WINDOW_ALL + PERFORMANCE_INTERVAL_DAY` still returns HTTP 400.

This is point-in-time pre-release data, not an acceptance fixture.

## Recommended Implementation Order

1. Fix the performance window/interval selection.
2. Fully type activity detail variants and stop parsing display text.
3. Add explicit error, empty, not-found, and disconnected-wallet states.
4. Add reusable cursor pagination/infinite loading to every visible list.
5. Complete the position/copy-account drilldowns needed by recovery flows.
6. Add freshness and unavailable-state presentation.
7. Fix remaining contract/adapter enum and identity handling.
8. Implement wallet session handling.
9. Implement write flows and enforce advisory action availability.
10. Add post-receipt polling/refetch behavior.
11. Fix the remaining labels, badges, and canonical-ID comparisons.

## Verification

Current code verification on 2026-07-29:

- `pnpm exec tsc --noEmit`: passed.
- `pnpm exec eslint src/pages/CopyTrading src/services/copyTrading`: passed.
- `pnpm exec vite build`: passed.
- The production build still emits existing repository/dependency warnings,
  including stale browser data, large chunks, externalized Node modules, and a
  CSS syntax warning. No Copy Trading-specific build failure was reported.

## Write-Flow Test Safety

- Never paste or commit a private key.
- Use a dedicated burner wallet with minimal funds.
- Prefer signing through the connected wallet UI.
- If automated signing is required, read the key from a local secret environment
  or protected keystore without printing it.
- Prepared transaction payloads must be submitted unchanged; the frontend must
  not rebuild or modify API-provided calldata.
- A POST prepare response alone does not create the final read-model data.
  Broadcast the transaction, wait for confirmation and indexer synchronization,
  then verify copy runs, positions, activity, balances, and action logs.

## Working Tree Note

At the time this note was created, the real-API Copy Trading migration was
uncommitted.

Current relevant working-tree shape:

- `FE_API_Catalog.md`, `openapi.yaml`, `IMPLEMENTATION_STATUS.md`, and
  `services/copyTrading/adapters.ts` are untracked.
- Legacy API/spec documents and Copy Trading design PNGs are marked deleted.
- The service, types, environment, and UI integration files remain modified.

Preserve these existing changes and recheck `git status` before staging or
committing anything.
