# Copy Trading - Entity Hierarchy and User Flows

Source: `Copy Trading v1.1.md`.

This document keeps only the main entities, their hierarchy, and the user flows. Field details are intentionally omitted for readability.

---

## 1. Entity Hierarchy

### A. User Side

```text
User / Follower
└── Copy Subscription
    ├── Smart Contract Wallet / KSFollowerAccount
    │   ├── Deposited Capital
    │   ├── Token Balances
    │   ├── Follower Config
    │   └── User Positions
    │       ├── Open Position
    │       ├── Closing Position
    │       ├── Skipped Position
    │       ├── Tracking Paused Position
    │       ├── Withdrawn Position
    │       └── Closed Position
    ├── Active Copy State
    ├── Stop Copy Intent
    ├── Manual Close Request
    ├── Withdraw Request
    └── Copy History
```

User side is what the copier owns or directly controls.

- The user owns the smart contract wallet.
- The user deposits capital.
- The user can stop copying.
- The user can manually close or withdraw positions.
- The user keeps historical copy records after stopping.

---

### B. Agent Side

```text
Agent / Leader
├── Agent Profile
├── KSLeaderAccount
│   ├── Agent Capital
│   └── Agent Positions
├── Leader Config
├── Agent Trades
│   ├── Buy Trade
│   ├── Sell Trade
│   └── Trade ID
└── Action Logs
    ├── Trigger
    ├── Market Data
    ├── Reasoning
    └── Action Result
```

Agent side is what users inspect before deciding to copy.

- Leaderboard shows agents.
- Agent profile shows performance and logs.
- Agent trades create the source events for follower positions.
- Every agent trade has a Trade ID for audit and tracking.

---

### C. Protocol / Contract Side

```text
Copy Trading Protocol
├── CopyTradeController
│   ├── Leader Trade Records
│   ├── Follower Config Validation
│   ├── Position State
│   └── Token Pair Slippage Config
├── Fee / Cashback Logic
├── Operator Whitelist
└── Account Factories
    ├── KSLeaderAccountFactory
    └── KSFollowerAccountFactory
```

Protocol side enforces the rules.

- Records leader trades.
- Validates follower copy execution.
- Stores position state.
- Enforces fee, cashback, and slippage-related constraints.
- Keeps custody non-custodial from the user's perspective.

---

### D. Operator / Signer Side

```text
Execution Infrastructure
├── Leader Operator
├── CopyTrade Operator
├── KS_SIGNER
├── KYBERSWAP_SIGNER
└── Aggregator
```

Execution infrastructure connects agent activity to follower wallets.

- Leader Operator submits agent trades.
- CopyTrade Operator mirrors agent trades for followers.
- Signers authorize sensitive close/cashback flows.
- Aggregator provides swap routes.

---

### E. UI Side

```text
Copy Trading UI
├── Leaderboard
├── Agent Profile
├── Start Copying Flow
├── My Copies Dashboard
├── Copy Detail Page
├── Stop Copying Modal
├── Manual Sell Modal
├── Withdraw Modal
├── History Page
└── Alerts Feed
```

UI side is how the user understands and controls the product.

- Leaderboard and Agent Profile are discovery surfaces.
- Start Copying creates the copy relationship.
- My Copies and Copy Detail are active management surfaces.
- Stop Copying, Manual Sell, and Withdraw are exit/recovery surfaces.
- History and Alerts are audit surfaces.

---

## 2. Core Relationships

```text
User
└── copies
    └── Agent
        └── through Copy Subscription
            └── backed by KSFollowerAccount
```

```text
Agent Trade
└── creates or closes
    └── User Position
        └── tracked by Trade ID / Position ID
```

```text
Stop Copy
└── creates
    └── Stop Copy Intent
        └── Operator async sells selected positions
```

```text
Skipped Sell
└── creates
    └── Manual Close option
        └── User submits close transaction
```

```text
Withdraw
└── bypasses swap and cashback
    └── User receives raw token
```

## 3. UI Flow Map

This section maps the main flows against the current UI export files in `CopyTrading/UI`.

### Flow Group 1: Discover Agents

UI files:

- `Learderboard - Default.png`

Sub-flows:

```text
Open Copy Trading
→ View Leaderboard
→ View Summary Stats
→ Filter by Strategy
→ Search Agent
→ View Agent Rows
→ Click Agent Row
→ Go To Agent Profile
```

CTA sub-flow:

```text
Click Copy
→ Should open Start Copying Flow
```

Current UI status:

- Leaderboard screen exists.
- Strategy tabs exist visually.
- Search exists visually.
- Copy CTA exists.
- Start Copying modal is not present in current UI exports.

---

### Flow Group 2: Evaluate Agent Before Copying

UI files:

- `Agent_Profile - Open Positions.png`
- `Agent_Profile - Trade History.png`
- `Agent_Profile - Action Log.png`
- `Agent_Profile - Copied.png`

Sub-flows:

```text
Open Agent Profile
→ Review Agent Header
→ Review Agent Stats
→ Review P&L Chart
→ Review Side Panel
→ Decide Whether To Copy
```

Tab sub-flows:

```text
Open Positions Tab
→ View Current Agent Positions
→ Check Token / Entry / Current / P&L
```

```text
Trade History Tab
→ View Closed Trades
→ Check Entry / Exit / Realised P&L / Fee / Cashback
```

```text
Action Log Tab
→ View Agent Reasoning Log
→ Expand Log Entry
→ Check Trigger / Data / Reasoning / Action / Status
```

Copied-state sub-flow:

```text
Agent Already Copied
→ Show Current Copy Panel
→ Click My Copy
→ Should Go To Copy Detail
→ Click Add Capital
→ Should Open Add Capital Modal
```

Current UI status:

- Agent Profile screen exists.
- The three profile tabs exist.
- Copied state exists.
- My Copy and Add Capital CTAs exist.
- Add Capital modal is not present in current UI exports.

---

### Flow Group 3: Start Copying

UI files:

- No dedicated exported UI file found for this modal/flow.

Expected sub-flows from spec:

```text
Click Copy From Leaderboard Or Agent Profile
→ Open Configure Step
→ Enter Capital
→ Continue To Review Step
→ Review Fee / Risk / Execution Details
→ Accept Risk Checkbox
→ Confirm Wallet Transaction
→ Show Success State
→ Click View My Copies
```

Current UI status:

- Entry CTA exists.
- Configure step is missing.
- Review step is missing.
- Success state is missing.

---

### Flow Group 4: Manage Active Copies

UI files:

- `Open Copies.png`

Sub-flows:

```text
Open My Copies
→ View Open Copies Summary
→ View Active Copy Rows
→ Click Active Copy Row
→ Go To Copy Detail Active
```

Action sub-flows:

```text
Click Stop Copying
→ Should Open Stop Copying Modal
```

```text
Read Alerts Feed
→ See New Position / Closed Position / Skipped Trade / Offline Alerts
→ Click Related Trade Or Copy
→ Should Go To Relevant Detail
```

Current UI status:

- Open Copies dashboard exists.
- Active copy rows exist.
- Stop Copying CTA exists.
- Alerts feed exists.
- Stop Copying modal is not present in current UI exports.

---

### Flow Group 5: View Active Copy Detail

UI files:

- `Copy(Agent) Details - Active.png`

Sub-flows:

```text
Open Active Copy Row
→ View Agent Header
→ View Personal Metrics
→ View My Positions Table
→ View Position Status
→ View P&L Chart
→ View Current Copy Side Panel
```

Action sub-flows:

```text
Click Add Capital
→ Should Open Add Capital Modal
```

```text
Click My Copy
→ Should Keep User In Current Copy Detail Or Focus Current Copy Section
```

```text
Position Has Closing Status
→ User Monitors Closing Progress
→ Position Becomes Closed Or Skipped
```

```text
Position Has Tracking Paused Status
→ User Should Be Guided To Manual Close Or Withdraw
```

Current UI status:

- Active copy detail screen exists.
- Positions table exists.
- Closing / Tracking Paused states are represented.
- Add Capital CTA exists.
- Manual Close and Withdraw actions are not present in current UI exports.

---

### Flow Group 6: Stop Copying

UI files:

- No dedicated exported UI file found for this modal/flow.

Expected sub-flows from spec:

```text
Click Stop Copying
→ Show Open Positions
→ Select Positions To Sell
→ Keep Some Positions Unchecked If Desired
→ Confirm Stop Copy
→ Future Copy Actions Halt
→ Operator Sells Selected Positions Async
→ Positions Become Closed Or Skipped
→ Copy Becomes Stopped
```

Current UI status:

- Stop Copying CTA exists in Open Copies.
- Stop Copying modal is missing.
- Async closing progress is partially represented by position status in active detail.

---

### Flow Group 7: Manual Close / Recovery

UI files:

- No dedicated exported UI file found for manual close modal.
- Related states appear in `Copy(Agent) Details - Active.png`.

Sub-flows:

```text
Position Sell Is Skipped
→ Alert Appears
→ Position Shows Skipped Status
→ User Clicks Manual Sell
→ User Reviews Reason And Sell Details
→ User Confirms Transaction
→ Position Updates
```

```text
Same Position Has Multiple Skips
→ User Clicks Close Position
→ User Chooses Sell Skipped Portion Or Close Entire Position
→ User Confirms Transaction
→ Position Updates
```

Current UI status:

- Alerts feed exists.
- Closing / Tracking Paused states exist.
- Skipped status/action UI is not clearly exported.
- Manual Sell modal is missing.
- Close Position modal is missing.

---

### Flow Group 8: Withdraw Raw Token

UI files:

- No dedicated exported UI file found for withdraw modal.

Expected sub-flow from spec:

```text
Open Position Detail
→ Open Advanced
→ Click Withdraw Tokens
→ Read No Swap / No Cashback Warning
→ User Confirms Transaction
→ Raw Token Transfers To User Wallet
→ Position Becomes Withdrawn
```

Current UI status:

- Withdraw flow is not present in current UI exports.

---

### Flow Group 9: Review Copy History

UI files:

- `Closed Copies (History).png`
- `Copy(Agent) Details - Closed.png`

Sub-flows:

```text
Open History
→ View History Summary
→ View Closed Copy Rows
→ Click Closed Copy Row
→ Go To Closed Copy Detail
```

```text
Closed Copy Detail
→ Review Start Copy Event
→ Review Stop Copy Event
→ Review Realised P&L
→ Review Closed Positions Table
→ Audit Fee / Cashback / Net Result
```

Current UI status:

- History screen exists.
- Closed copy detail exists.
- Closed positions table exists.

---

## 4. Mental Model

```text
Agent = source of trades
Subscription = user follows one agent
Follower Wallet = where user's copy trades happen
Trade ID = audit link between agent trade and user position
Position = user's per-token exposure
Operator = mirrors agent actions
Stop Copy = stop following and optionally sell positions
Manual Close = recovery when operator sell is skipped
Withdraw = final escape hatch, raw token only
```
