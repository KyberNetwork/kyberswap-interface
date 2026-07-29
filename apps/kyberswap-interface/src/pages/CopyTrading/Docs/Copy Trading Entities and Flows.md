# Copy Trading - Entities and User Flows

Last reviewed: 2026-07-29

Contract sources:

- `FE_API_Catalog.md` for frontend integration rules.
- `openapi.yaml` for the machine-readable HTTP contract.
- `IMPLEMENTATION_STATUS.md` for the current code status and known UI gaps.

This document describes the product entities and frontend flows exposed by the
current aggregate API. It does not describe private operator or projector
internals.

---

## 1. Entity Hierarchy

### A. Owner / Follower

```text
Owner Wallet
├── Owner Copy Summary
├── Copy Runs
│   └── Copy Run
│       ├── Agent Snapshot
│       ├── Copy Account
│       ├── Capital and Portfolio Metrics
│       ├── Positions
│       ├── Performance
│       └── Add / Stop / Withdraw Availability
├── Owner Positions
├── Owner Activity
└── Copy Accounts
```

Key rules:

- `ownerAddress` scopes owner routes and identifies the wallet that created the
  follower account. It must not be treated as current authorization evidence by
  itself.
- A Copy Run is the public product record for copying one agent.
- A Copy Run references the smart-contract `copyAccount` where copy balances and
  positions are tracked.
- Open and History are server-defined views. They are not client-side aliases
  for a single Copy Run status.
- A read response is display/state evidence. A prepared action decides whether
  a transaction can currently execute.

### B. Agent / Leader

```text
Agent
├── Agent Card
│   ├── Identity and Chain
│   ├── Model and Strategy Categories
│   ├── Metrics
│   └── Start Copy Availability
├── Agent Profile
│   ├── Bio and Live Since
│   ├── Whitelisted Symbols
│   └── Strategy & Execution Display Items
├── Performance Series
├── Positions
│   └── Position Events
└── Action Logs
```

Key rules:

- `agentId` is the canonical identity. Display name is not unique identity.
- Strategy categories can overlap; one agent can belong to more than one
  category.
- Agent metrics, performance points, and valuations carry independent
  freshness/availability statuses.
- Action-log narrative fields are display content. Do not parse their text to
  derive transaction state.

### C. Copy Run

```text
Copy Run
├── Identity
│   ├── copyRunId
│   ├── ownerAddress
│   ├── agentId
│   ├── chainId
│   └── copyAccount
├── Lifecycle
│   ├── ACTIVE
│   ├── CLOSING
│   ├── CLOSED
│   └── STOPPED
├── Agent Snapshot
├── Capital / Portfolio / P&L Metrics
├── Fee / Cashback Metrics
├── Position Counts
└── Advisory Action Availability
    ├── Add Capital
    ├── Stop Copy
    └── Withdraw Quote
```

The agent snapshot is the correct row-level identity/metric source for a Copy
Run. The frontend should not issue one Agent Detail request for every Copy Run
row.

### D. Position

```text
Position
├── Identity
│   ├── positionId
│   ├── userPositionId
│   ├── agentPositionId
│   ├── copyRunId
│   └── tradeId
├── Token and Raw Amount Accounting
├── Lifecycle
│   ├── ACTIVE
│   ├── CLOSING
│   └── CLOSED
├── Entry / Current / Exit Valuation
├── P&L / Fee / Cashback Metrics
├── Quantity / Exit / Leftover State
└── Recovery Actions
    ├── Manual Sell
    └── Close Position
```

Key rules:

- Skipped execution is not a position lifecycle. It is represented through
  activity/execution detail, skip metrics, and pending sell obligations.
- Leftover is explicit residue state (`isLeftover`, `leftoverReason`) and can be
  queried through `POSITION_VIEW_LEFTOVER`.
- `actionKind` is the primary suggested recovery action.
  `availableActionKinds[]` is the complete advisory action set.
- Use `displayBaseRaw` with token decimals for the main user-facing amount.
- Entry, current, exit, and leftover valuations can have different statuses.

### E. Copy Account

```text
Copy Account
├── Account Summary
├── Token Balances
│   └── Pinned Stable / Quote Balance
├── Positions
├── Pending Sell Obligations
└── Activity History
```

Key rules:

- The Copy Account is the smart-contract account used by the Copy Run.
- The pinned quote/stable balance is action-critical and is separate from the
  ordinary cursor page of balances.
- Pending sell obligations are the current source for Manual Sell sizing.
- Use the returned FIFO order, current obligation count, and exact
  `currentRatioRaw`; do not reconstruct them from activity text or local history.

### F. Activity

```text
Activity Row
├── Typed Activity Type
├── Display Summary
└── Exactly One Typed Detail
    ├── Copy Lifecycle
    ├── Position
    ├── Capital
    ├── Fee
    └── Execution
```

The top-level summary is display text. Business logic must switch on the typed
activity type and detail variant.

### G. Prepared Action

```text
Prepared Action
├── Status
├── Chain and Expected Sending Account
├── Prepared / Retry / Deadline Times
├── Exact Prepared Call
├── Typed Reason and Warnings
├── Evidence
└── Exactly One Preview
    ├── Start Copy
    ├── Add Capital
    ├── Stop Copy
    ├── Withdraw Quote
    ├── Manual Sell
    └── Close Position
```

Preparation routes create wallet calls; they do not submit transactions.

Prepared-action statuses:

```text
READY
PARTIALLY_COMPLETED
COMPLETED
PENDING
UNAVAILABLE
```

Frontend behavior:

- `READY`: validate and submit the exact prepared call.
- `PARTIALLY_COMPLETED`: Start Copy has another executable stage; submit the
  call, wait for convergence, then prepare again.
- `COMPLETED`: refresh reads and finish the action flow.
- `PENDING`: submit nothing; retry at `reprepareAfter` when present.
- `UNAVAILABLE`: submit nothing; render the typed reason.

### H. Wallet Session

```text
Wallet Session
├── Challenge
│   ├── SIWE Message
│   ├── Challenge Token
│   └── Expiry
├── Exact Wallet Signature
└── Access Token
    ├── Owner Scope
    ├── Chain Scope
    └── Expiry
```

Wallet sessions authorize only Manual Sell and Close Position preparation. They
do not authorize Start Copy, Add Capital, Stop Copy, or Withdraw Quote, and they
do not submit transactions.

---

## 2. Core Relationships

```text
Owner Wallet
└── Copy Run
    ├── copies one Agent
    ├── references one Copy Account
    └── contains follower Positions
```

```text
Agent Position / Trade
└── identified by Trade ID
    └── mirrored into a follower Position
        └── identified by userPositionId / positionId
```

```text
Skipped Sell
└── creates or updates Pending Sell Obligations
    └── advertises Manual Sell or Close Position
        └── requires a Wallet Session before preparation
```

```text
Advisory Availability
└── controls action entry state
    └── Prepare API returns authoritative action status
        └── exact prepared call is submitted by the expected account
```

---

## 3. Common Read Flow

All list routes use opaque cursor pagination.

```text
Request First Page
→ Render Data With Metric / Valuation Freshness
→ If pagination.hasMore
→ Pass pagination.nextCursor Unchanged
→ Continue Until The Required UI Set Is Loaded
```

Start a new cursor sequence whenever route, owner, agent, chain, view, filter,
sort, series, window, or interval changes.

Read-state rules:

- Render `CURRENT` normally.
- Render `STALE` with a stale indication.
- Do not fabricate zero for `UNAVAILABLE`.
- Treat `NOT_APPLICABLE` as a valid product state.
- Do not merge Open and History owner summaries locally.
- Do not derive lifecycle, execution, or profit/loss state from display text.

---

## 4. Discovery and Agent Evaluation

### Discover Agents

```text
Open Copy Trading
→ GET /chains
→ GET /leaderboard/summary
→ GET /leaderboard
→ Filter By Chain / Search / Overlapping Strategy Category
→ Load Additional Cursor Pages
→ Open Agent Profile Or Start Copy
```

### Evaluate an Agent

```text
Open Agent Profile
→ GET /agents/{agentId}
→ GET /agents/{agentId}/stats
→ GET Both Requested Performance Series
→ Lazy-load Open Positions / History / Action Logs
→ Load Additional Cursor Pages
→ Review startCopyAvailability
→ Start Copy Or Open Existing Copy Run
```

Performance combinations:

- `7D`, `30D`, and `90D` portfolio/cumulative P&L use daily intervals.
- `ALL` portfolio/cumulative P&L must use weekly or monthly intervals.

---

## 5. Owner Dashboard and Copy Detail

### Open Copies

```text
Connect Wallet
→ GET copy-summary With OWNER_COPY_VIEW_OPEN
→ GET copy-runs With OWNER_COPY_VIEW_OPEN
→ Load Additional Cursor Pages
→ GET Owner Activity
→ Open A Copy Run
```

Available actions depend on the selected run:

- Add Capital.
- Stop Copy.
- Withdraw Quote.
- Manual Sell or Close Position for advertised recovery positions.

### History

```text
GET copy-summary With OWNER_COPY_VIEW_HISTORY
→ GET copy-runs With OWNER_COPY_VIEW_HISTORY
→ Load Additional Cursor Pages
→ Open Closed / Stopped Copy Run
→ Review Timeline, Performance, Positions, Fees, Cashback, And Net Cost
→ Withdraw Remaining Quote When Availability Allows
```

### Copy Detail

```text
GET Copy Run Detail
→ GET Copy Run Positions
→ GET Requested Performance Series
→ Optionally GET Owner Activity Filtered By copyRunId
→ Render Current Lifecycle And Advisory Actions
```

The direct Copy Run and Position detail reads are the correct pre-action refresh
sources. Cached list rows are not authoritative transaction state.

---

## 6. Common Write Flow

All six product actions follow the same safety boundary:

```text
Read Advisory Availability
→ Open Action UI
→ Refresh Direct Copy Run / Account / Position State
→ POST The Matching Prepare Route
→ Inspect Prepared Status And Typed Reason
→ Validate Preview And Exact Call
→ Ask Wallet To Submit Exact call.to / call.data / call.valueRaw
→ Wait For Successful Receipt
→ Poll Direct Reads Until Projected State Advances
→ Refresh Parent Lists And Summaries
```

Before wallet submission, require:

1. Expected action status.
2. Route-appropriate preview.
3. Route-appropriate `call.kind`.
4. Prepared `chainId` matching the wallet network.
5. `expectedAccount` matching the sending account.
6. `valueRaw === "0"`.
7. Current `reprepareAfter` and `liquidationConfigDeadline`.

Never ABI-encode, rebuild, or mutate the prepared calldata from preview fields.

---

## 7. Start Copy

Endpoint:

```text
POST /users/{ownerAddress}/agents/{agentId}:prepareStartCopy
```

Input:

```text
chainId
targetCapitalRaw
startRequestId
```

Flow:

```text
Generate One UUIDv4 startRequestId
→ Prepare Start Copy
→ Validate Account / Chain / Stage / Call Kind
→ Submit Exact Create Or Fund Call
→ Wait For Receipt And Read-model Convergence
→ Prepare Again With The Same UUID And Target
→ Repeat Until COMPLETED / START_COPY_STAGE_COMPLETE
```

Start Copy can require separate account-creation and funding transactions. Keep
the same UUID for one attempt.

---

## 8. Add Capital

Endpoint:

```text
POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareAddCapital
```

Input:

```text
amountRaw
```

Flow:

```text
Check addCapitalAvailability
→ Enter A Positive Base-unit Amount
→ Prepare Add Capital
→ Review Quote Token, Minimum, Wallet Balance, And New Allocation
→ Submit Exact Call
→ Wait For Receipt
→ Poll Copy Run / Copy Account Until Capital Advances
```

The preparation response is authoritative even when advisory availability was
previously available.

---

## 9. Stop Copy

Endpoint:

```text
POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareStopCopy
```

Input:

```text
userPositionIds[]
slippageBps
```

Rules:

- Select at most 32 position IDs.
- The array can be empty when there are no selected sellable positions.
- `slippageBps` must be an integer from 0 to 10,000.
- If the selectable position set changes, discard the old preparation.

Flow:

```text
Check stopCopyAvailability
→ Refresh Copy Run Positions
→ Select Positions To Include In Stop
→ Enter Slippage
→ Prepare Stop Copy
→ Review Exact Position Previews And Totals
→ Submit Exact Call
→ Wait For Receipt
→ Poll Copy Run And Positions Through Closing / Terminal State
```

---

## 10. Withdraw Quote

Endpoint:

```text
POST /users/{ownerAddress}/copy-runs/{copyRunId}:prepareWithdrawQuote
```

Request body:

```json
{}
```

Flow:

```text
Check withdrawQuoteAvailability
→ Prepare Withdraw Quote
→ Review Quote Token, Current Balance, Sweep Amount, And Recipient
→ Submit Exact Call
→ Wait For Receipt
→ Poll Copy Account Balance And Activity
```

This action is a repeatable maximum sweep of the prepared quote-token balance.
The recipient is determined by current prepared state, not entered by the
frontend. It is not a generic raw-position-token withdrawal flow.

---

## 11. Wallet Session

Required only before Manual Sell and Close Position.

```text
POST /wallet-session-challenges
→ Receive siweMessage / challengeToken / expiresAt
→ Sign The Exact SIWE Message As An Ethereum Personal Message
→ POST /wallet-sessions With Challenge Token And Signature
→ Keep Access Token In Memory
→ Use It Only As Bearer Authorization On Manual Sell / Close Position
```

Rules:

- Do not reconstruct or edit the SIWE message.
- A challenge is one-time use.
- Honor challenge and access-token expiry.
- The session owner and chain must match the protected action.
- On `401`, discard the token and restart the challenge flow.
- Never persist challenge tokens, signatures, or access tokens in
  `localStorage`, URLs, analytics, telemetry, or logs.

---

## 12. Manual Sell

Endpoint:

```text
POST /users/{ownerAddress}/copy-runs/{copyRunId}/positions/{userPositionId}:prepareManualSell
Authorization: Bearer <wallet-session-access-token>
```

Input:

```text
slippageBps
expectedUnresolvedSkipCount
expectedSellRatioRaw
```

Flow:

```text
Position Advertises Manual Sell
→ Create Or Reuse A Valid Wallet Session
→ GET Current Pending Sell Obligation FIFO
→ Use Current FIFO Count And Exact Ratio
→ Prepare Manual Sell
→ If Obligation Changed, Refresh FIFO And Prepare Again
→ Review Recovery Preview
→ Submit Exact Call
→ Poll Position, Obligations, And Activity
```

Manual Sell is skipped-sell recovery. It must not be sized from error text,
activity summaries, or locally accumulated ratios.

---

## 13. Close Position

Endpoint:

```text
POST /users/{ownerAddress}/copy-runs/{copyRunId}/positions/{userPositionId}:prepareClosePosition
Authorization: Bearer <wallet-session-access-token>
```

Input:

```text
slippageBps
```

Flow:

```text
Position Advertises Close Position
→ Create Or Reuse A Valid Wallet Session
→ Refresh Direct Position And Account State
→ Prepare Close Position
→ Require READY And Full-position Recovery Preview
→ Submit Exact Call
→ Poll Position And Activity Through Terminal State
```

Close Position is available only for an eligible full-position recovery close
under current operator state. It is not a generic market-sell endpoint.

---

## 14. Current Frontend Status

Implemented in the service:

- All 24 GET routes.
- All six transaction-preparation POST routes.
- Both wallet-session POST routes.
- Typed request/response models and exported hooks.

Implemented read UI:

- Leaderboard and agent profile.
- Agent positions, history, action logs, and performance.
- Open Copies, History, Copy Detail, and Alerts Feed.

Not yet connected in the UI:

- Start Copy.
- Add Capital.
- Stop Copy.
- Withdraw Quote.
- Wallet Session.
- Manual Sell.
- Close Position.

Known read/UI gaps:

- Cursor pagination is missing on most lists outside the leaderboard.
- `ALL + DAY` performance requests are invalid; `ALL` must use week/month.
- Activity detail variants are not yet fully typed in the frontend model.
- Stale response/metric status is preserved but not indicated in the UI.
- Alerts Feed is labelled live but does not poll.

See `IMPLEMENTATION_STATUS.md` for file-level evidence and the recommended
implementation order.

---

## 15. Mental Model

```text
Agent = source identity, strategy, performance, positions, and action logs
Copy Run = one owner's public record of copying one agent
Copy Account = smart-contract account holding balances and follower positions
Trade ID = audit link between agent activity and follower position activity
Position = per-token follower exposure with explicit lifecycle and recovery state
Activity = typed event plus one typed detail; summary is display-only
Advisory Availability = button guidance from read state
Prepared Action = authoritative executable state and exact wallet call
Wallet Session = short-lived authorization for Manual Sell / Close Position only
Stop Copy = stop flow with an explicit selected-position intent
Manual Sell = recovery for current pending skipped-sell obligations
Close Position = eligible full-position recovery, not a generic sell
Withdraw Quote = maximum sweep of prepared quote balance after eligibility
```
