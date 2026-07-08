# KyberSwap AI Copy Trading — Product Spec v1.0

PM/PO: Ly Bui (Lea)
Created time: April 12, 2026 10:28 PM
Status: Planning
Est Release date: May 20, 2026

**Last updated:** 4th May 2026

---

# Overview

## What is this?

KyberSwap AI Copy Trading is an on-chain feature that allows users to automatically mirror the trades of KyberSwap-operated AI agents - without giving up custody of their funds. Each token is an independent position with its own P&L. When an AI agent buys or sells a token, the user's smart contract wallet executes the same trade proportionally and automatically, using KyberSwap's own aggregator for best-price execution.

The feature is non-custodial by design. Users deposit into a personal smart contract wallet that they own and can withdraw from at any time. The AI agent never touches user funds directly - an Operator service acts as the bridge, reading the agent's on-chain activity and submitting copy instructions to each follower's wallet within the constraints the user has pre-approved.

## Why are we building this?

DeFi trading is inaccessible to most users. Navigating cross-chain liquidity, reading market signals, timing entries and exits, and managing a multi-token portfolio requires expertise and time that most retail users don't have. At the same time, KyberSwap has deep aggregator infrastructure, liquidity access across chains, and the engineering capability to run on-chain AI agents that can trade effectively.

AI Copy Trading bridges that gap. It lets any user benefit from algorithmic DeFi strategies without needing to understand them - while keeping KyberSwap as the execution layer for every trade → increase the trading volume and revenue, including indirect revenue streams and directed service fee on this function.

## Scope — Phase 1

- **In scope**: AI agents created and operated by KyberSwap only. Smart contract wallet custody model. Copy Forward and Mirror Portfolio modes. Performance fee collection. Leaderboard with appearance threshold. Chain-of-thought log display.
- **Out of scope (Phase 2+)**: User-seeded agents. Agent marketplace. Using other APIs beside aggregator (such as LO, Cross chain swap)

## How it fits into KyberSwap

All trades execute through the KyberSwap Aggregator - the same routing infrastructure used across the rest of the product. Copy trading is not a separate execution layer. It is a demand-generation layer that drives swap volume through KyberSwap's existing aggregator and limit order infrastructure.

# 1. Architecture decisions

These decisions are resolved and no longer open for discussion.

| Decision                             | Choice                                                          | Details/ Rationale                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product type** 🆕                  | **Copy Trade Per Token**                                        | **Users follow the Agent, but the underlying mechanism optimizes per trade rather than managing a holistic portfolio**. Each token = independent position. Resolves edge cases around portfolio mismatch, fee models, and entry timing.                                                                                                           |
| AI → Operator flow                   | AI trades itself on-chain, Operator mirrors                     | AI trades independently verifiable on-chain.                                                                                                                                                                                                                                                                                                      |
| User fund custody                    | Smart contract wallet (per user)                                | Non-custodial. Works on all EVM chains today.                                                                                                                                                                                                                                                                                                     |
| **Agent v1 actions** 🆕              | **Buy / Sell vs stablecoin only**                               | Simplest execution surface for Phase 1. No cross-token swaps from agent side.                                                                                                                                                                                                                                                                     |
| Who creates agents                   | KyberSwap only — Phase 1                                        | No user-seeded agents.                                                                                                                                                                                                                                                                                                                            |
| **Agent leader awareness** 🆕        | **Aware of total follower AUM only**                            | Enough to calculate liquidity impact. Not individual identity or wallet sizes.                                                                                                                                                                                                                                                                    |
| **Amount sizing** 🆕                 | **Option 3 — % of agent's stable available at trade time**      | See Section 4. Self-regulating, mirrors conviction, never depletes to zero.                                                                                                                                                                                                                                                                       |
| **Price source** 🆕 {color="yellow"} | **Settlement price — enforced for all agents** {color="yellow"} | **All P&L calculations, fee calculations, and agent data feeds use KyberSwap's settlement price as the single source of truth. This is enforced at the protocol level — no agent (including future third-party agents) may use a different price source. Ensures consistency between what agent sees and what user is charged.** {color="yellow"} |
| **User exit** 🆕 {color="yellow"}    | **Force sell all open positions on exit** {color="yellow"}      | **When user stops copying, all open positions are force-sold to USDC via KyberSwap Aggregator. No "keep positions" option. Simplifies accounting, ensures fee settlement is clean, and prevents tracking gaps from externally held tokens.** {color="yellow"}                                                                                     |
| Fee model                            | Per position, charged at open — refunded at close if loss       | Fee rate = x% (protocol-configurable by admin multisig. Launch default: **8%**. Per-agent override allowed within 5–15% range.) See Section 6.                                                                                                                                                                                                    |
| Fee recipient                        | 100% KyberSwap platform treasury                                | No seeder split.                                                                                                                                                                                                                                                                                                                                  |
| External comms                       | "Copy Trade"                                                    | Market already understands this term. Internal architecture not exposed.                                                                                                                                                                                                                                                                          |
| **TP/SL** 🆕                         | **Phase 2 — not in scope v1**                                   | Simplifies Phase 1 contract and reduces edge cases.                                                                                                                                                                                                                                                                                               |

# 2. System actors

| Actor                 | Role                                                                                                                                                                                            | Trust level              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| User                  | Opts in, sets config, funds smart contract wallet, retains full custody                                                                                                                         | Self-sovereign           |
| AI Agent              | Executes its own trades on-chain (buy/sell vs stablecoin only in v1). Receives total follower AUM as context. KyberSwap-operated.                                                               | Trusted                  |
| Operator Service      | Watches agent trades on-chain. **Decomposes multi-token swaps into sequential single-token trades.** Computes proportional follower amounts. Executes in subscription order. Never holds funds. | Semi-trusted — auditable |
| CopyTradeController   | On-chain contract. Validates each trade against user config before executing.                                                                                                                   | Trustless                |
| Smart contract wallet | Per-user contract. Holds funds. Enforces constraints. Only user can withdraw.                                                                                                                   | Trustless                |

# 3. Copy Trade Per Token — how it works

## Core model

Every trade the agent makes creates or closes a **position** for the user. A position is defined per token, per Trade ID.

```
Agent buys ETH (Trade ID #042)
→ User opens ETH position #042
→ Proportional ETH amount bought at current market price

Agent sells ETH (Trade ID #042)
→ User closes ETH position #042
→ ETH sold, proceeds returned to stable balance
→ P&L calculated for this position
→ Fee charged if P&L > 0
```

## Trade ID

Each agent trade is tagged with a Trade ID on-chain. The Operator includes this Trade ID in every `executeCopyTrade()` call.

Trade ID enables:

- Clean position tracking per user per trade
- Accurate P&L calculation at close
- Audit trail between agent action and follower execution
- Data feed to agent: trade ID, open time, current P&L status

**Data feed fields required per trade:** `trade_id`, `token`, `direction (buy/sell)`, `agent_amount_in`, `agent_stable_available_at_trade_time`, `timestamp`

Foundation data team to align with Contract + Aggregator teams on this format.

## Multi-token swap decomposition

When the agent executes A → B directly (even in future versions), Operator decomposes into two sequential independent trades:

```
Agent: Swap SOL → JUP

Operator decomposes into:
  Tx 1: Sell SOL → USDC  → closes user's SOL position, P&L settled
  Tx 2: Buy JUP ← USDC   → opens user's JUP position
```

Each is an independent Trade ID. Each has its own P&L.

## Proportional sizing

See Section 4 for full calculation logic.

## Opt-in timing

User only follows trades from the moment they opt in. Past trades are not inherited by default. The join option (Section 5) gives users a choice about currently open positions.

# 4. Amount calculation

## The four options considered

| Option                                | Method                                                         | Verdict                                                                     |
| ------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1 — Fixed USD per trade               | Always put $X per trade regardless of agent size               | ❌ Misses conviction signal. Runs out of capital.                           |
| 2 — Fixed ratio of agent AmountIn     | X% of whatever agent puts in                                   | ❌ Runs out of capital if many positions stack up.                          |
| **3 — % of agent's stable available** | **Agent uses X% of its stable → user uses X% of their stable** | **✅ Recommended. Self-regulating. Mirrors conviction. Never depletes.**    |
| 4 — Portfolio ratio                   | Match agent's full portfolio allocation                        | ❌ Out of scope Phase 1. Copy Portfolio logic, contradicts Per Token model. |

## Sizing rules — buy vs sell

**When buying (opening a position):**

User deploys % of their **available stable balance - which means their available stable tokens**, matching the agent's % of its stable.

```go
user_buy_amount = user_stable_available × (agent_amount_in / agent_stable_available_at_trade_time)
```

**When selling (closing a position):**

User sells the same % of their token amount held for that Trade ID as the agent sells of its own position.

```jsx
user_sell_amount = user_token_held_for_tradeId × (agent_sell_amount / agent_token_held_for_tradeId)
```

This ensures partial closes are mirrored correctly. If agent sells 50% of its ETH position, user also sells 50% of their ETH position for that Trade ID — not a fixed dollar amount.

**Key distinction:** denominator is `agent_stable_available_at_trade_time` — NOT agent total capital or total portfolio value. This reflects what the agent actually had available to deploy at that moment.

**Example:**

```
Agent total equity:         $100,000
Agent stable available:      $80,000
Agent amount into ETH:       $20,000  → 25% of stable available

User stable available:        $1,000
User amount into ETH:           $250  → 25% of $1,000
```

## Why this is correct

Agent commits 30% of its available stable → high conviction. Agent commits 5% → lower conviction. Option 3 is the only method that preserves this signal. Option 1 treats all trades identically. Option 2 scales by absolute amount which can distort when agent sizes vary.

## Self-regulating behavior across multiple trades

```
User stable: $1,000

Trade #001 agent uses 25% stable → user deploys $250  → stable: $750
Trade #002 agent uses 20% stable → user deploys $150  → stable: $600
Trade #003 agent uses 15% stable → user deploys  $90  → stable: $510

Never reaches $0. Each trade draws from what's left.
```

## Edge cases

**Stable available = $0 (all deployed):**

Skip the trade. Log the skip. Notify user: _"Trade #[ID] was skipped — insufficient USDC balance."_ Do not queue. Queuing creates execution timing problems and is hard to manage on-chain.

**Computed amount below minimum trade size:**

If `user_amount` < $10 (or aggregator minimum), skip and notify. Do not execute a dust trade.

**UI requirement:**

Show user the estimated dollar amount at current stable balance in real time during configuration — not just the ratio. User should never be confused about what they're committing.

# 5. Subscription flow 🆕

**Subscription flow - new version updated 20/5/2026**

**Step 1 — Configure**

Agent context header (always visible): name, avatar, LLM model, wallet address, verified badge, risk chip, 4 headline stats (30D APR · Win Rate · Volume · Copiers), 30D P&L sparkline, open positions count (expandable to show token list).

```
┌─────────────────────────────────────────────┐
│  [Avatar]  Gamma Falcon  ✓                  │
│  • Claude Sonnet 4.5  • 0x...31ec7  📋      │
├─────────────────────────────────────────────┤
│  Allocate Capital                           │
│  [ 25% ][ 50% ][ 75% ][ MAX ]  460,568 USDC.│
│                                             │
│  5,000                    ~$5,000  USDC ▼   │
├─────────────────────────────────────────────┤
│  You will follow new trades from this       │
│  moment. Your P&L may differ from the       │
│  agent's stats until open positions close.  │
├─────────────────────────────────────────────┤
│  ℹ️  Earlier subscribers get executed       │
│  before later ones. Price may vary slightly │
│  across executions.                         │
└─────────────────────────────────────────────┘

                              [Next →]
```

---

**Step 2 — Review & Confirm**

Agent header condensed (name, LLM model, wallet only). Open positions count shown and expandable.

```
┌─────────────────────────────────────────────┐
│  [Avatar]  Gamma Falcon  ✓                  │
│  • Claude Sonnet 4.5  • 0x...31ec7  📋      │
│                                             │
├─────────────────────────────────────────────┤
│  Review Details                             │
│  ─────────────────────────────────────────  │
│  Allocated Capital          5,000 USDC      │
│  Slippage Tolerance         Follows Agent
  Max Price Deviation ⓘ        1% (default)  │
│  Performance Fee  ⓘ         8% of Profits   │
│                   Charged at entry ·        │
│                   Refunded if loss
│  ─────────────────────────────────────────  │
├─────────────────────────────────────────────┤
│  ☐  I understand the trading risks, fees, and│
│     execution mechanics of AI Copy Trading.
   Past performance does not guarantee future results     │
│                                             │
└─────────────────────────────────────────────┘

  [Back]                    [Start Copying]
                        (disabled until ☐ checked)
```

Disclaimer:

_I understand the trading risks, fees, and execution mechanics of AI Copy Trading. Past performance does not guarantee future results._

Rules:

- Performance Fee ⓘ tappable — opens tooltip: _"A fee of x% is charged when your position opens. If the trade closes at a loss, the fee is fully refunded. You only pay when you profit."_
- Start Copying button disabled until checkbox is checked
- Back button returns to Step 1 without losing state

---

**After Confirmed**

```
┌─────────────────────────────────────────────┐
│                                             │
│                    ✓                        │
│                                             │
│       You're now copying Gamma Falcon.      │
│   New trades will be mirrored automatically │
│          from this moment.                  │
│                                             │
│    Tx: 0x8f3a…c721 · Confirming…           │
│                                             │
└─────────────────────────────────────────────┘

                    [View My Copies →]
```

Rules:

- Max Price Deviation ⓘ 1% (default)
  - _“The maximum price difference allowed between the agent’s execution price and your copy trade execution price. If the market moves more than x% between the agent’s trade and yours, your copy trade will be skipped to protect you from unfavorable entry.”_
- Tx hash updates from "Confirming…" to "Confirmed ✓" once block finalises\
- Txn hash is clickable to direct to scan website
- View My Copies navigates to My Copies dashboard with the new agent row visible at top
- No risk disclaimer repeated here — already acknowledged in Step 2

#### Legacy (outdated)

## Join option — single binary question

At opt-in, after entering their capital amount, users see one question:

> _"The agent currently has 3 open positions (ETH, SOL, KNC). Do you want to enter them now at current market prices?"_

**Yes — Join current positions**

For each currently open Trade ID of the agent, the smart contract wallet executes a proportional buy immediately using Option 3 sizing against current stable balance. Each becomes an independent position with its own Trade ID and P&L tracking. Entry at current market price — not agent's original entry. Clearly disclosed.

Sub text: → _Enter the agent's 4 open positions now at current market prices. You may get a different entry price than the agent._

**No — Start fresh**

Only follows new trades from this moment. No immediate swaps. P&L will diverge from agent's published stats for the duration of existing open positions.

Sub text: → _Only follow new trades from here. Your P&L will differ from the agent's until existing positions close._

_Note: Option 3 ratio applies correctly when joining current positions only if agent's stable_available_at_trade_time is stored per trade and used as the denominator — not current stable available._

## Step 1 — Configure

**Agent context header** (always visible): name, avatar, online status, wallet, badges, 4 stats (30D APR · Win Rate · Volume · Copiers), 30D P&L sparkline, current open positions list, recent trades.

**Join option:** Yes / No — one binary choice with disclosure.

CTA: **Start copying →** disabled until amount entered and join option selected.

## Step 2 — Review

| Row                              | Value                                   |
| -------------------------------- | --------------------------------------- |
| Join current positions           | Yes / No                                |
| Allocated capital                | [amount] USDC                           |
| Open positions to enter (if Yes) | [N] positions — [token list]            |
| Sizing method                    | % of agent's stable available per trade |

Risk disclosure checkbox required:

> _"I understand copy trading involves risk. Past performance does not guarantee future results. Returns may vary from the agent's due to execution timing. I retain custody of funds at all times."_

## Step 3 — Confirmed

Success screen. Tx hash. **View Dashboard** CTA.

# 6. Fee model

## Fee rate — x%, protocol-configurable

The fee rate is not hardcoded. It is stored on-chain and updatable by admin multisig.

- **Launch default:** 8%
- **Min/max bounds:** 5% – 15% (enforced by contract — no single agent can set outside this range)
- **Per-agent override:** allowed within the protocol bounds. Different agents may have different rates in future phases.
- **Where it appears in UI:** every instance of the fee % is a tappable link opening a tooltip:

> _“A fee of x% is charged when your position opens. If the trade closes at a loss, the fee is fully refunded. You only pay when you profit. [Learn more ↗]”_

This tooltip or docs link must appear on: leaderboard agent card, agent profile header, subscription Review popup, My Copies per-agent row.

## Price source — settlement price

All P&L calculations and fee calculations use **KyberSwap's settlement price** as the single source of truth. This applies to:

- Entry price recorded when a position opens
- Exit price recorded when a position closes
- Cashback calculation at close

This price source is the same one used by the AI agent for its own decision-making and data feed. Consistency between agent price and user fee price is enforced at protocol level — no divergence possible.

**Why upfront instead of at close:**

Charging fee only at close creates a risk where users withdraw mid-way after profitable trades, avoiding the fee. Collecting upfront on position open prevents this.

**Step 1 — Flat fee collected at open (when position is created successfully):**

```jsx
When user opens a position (executeCopyTrade succeeds):
  flat_fee = amountOut × fee_rate
  // fee_rate is protocol-configurable, launch default 8%
  // stored on-chain, updatable by admin multisig
  // per-agent rate must be within protocol min/max bounds (5–15%)
  flat_fee deducted from amountOut immediately
  net_token_received = amountOut − flat_fee
```

Fee collected in the same tx as the open. Denominated in the token received (e.g. ETH). Sent directly to KyberSwap platform treasury.

**Step 2 — Cashback calculated and returned at close:**

When the position closes, the protocol calculates how much of the flat fee to return to the user based on performance.

```jsx
At close:
  cashback = flat_fee × cashback_rate
  cashback_rate range: 0% (minimum) to 100% (maximum)

  if position was profitable → higher cashback_rate
  if position was at a loss  → lower cashback_rate (could be 0%)
```

> ⚠️ **Open question:** Exact cashback formula TBD. The function that maps position P&L to cashback rate needs to be defined and reviewed with the team before implementation. Minimum cashback = 0 (user keeps nothing back). Maximum cashback = 100% (full fee returned).

## PnL display

This is flagged as a key risk of user misunderstanding:

**Position P&L** — profit/loss on one specific Trade ID, net of fees and cashback. This is what users care about per trade.

**Portfolio P&L** — sum of all closed position net P&Ls since opt-in. This tells the user whether they are making money overall.

These two can move in opposite directions — profitable positions can coexist with an overall loss. The UI must show both clearly and never conflate them.

## Decomposed trade fee logic

When agent swaps A→B and Operator decomposes:

- Opening B position: flat fee charged on amountOut of B token at open
- Closing A position: cashback calculated and returned for A position

Two independent fee events.

## Campaign Pool

KyberSwap agent profits (from KyberSwap's own capital) flow into a Campaign Pool — separate from protocol fee wallet. Used for time-limited incentive campaigns. Not a fixed entitlement.

> **Note:** Settlement price is used for data tracking and calculations (P&L, fee, cashback…). It is not the execution price. When an actual trade is triggered — whether opening a position, closing a position, or force-selling on exit — the execution goes through KyberSwap Aggregator and the actual fill price depends on market conditions at that moment. These two prices may differ slightly.

# 7. Smart contract wallet

User's personal on-chain trading account. User owns it — only they can withdraw. Operator can only call `executeCopyTrade()`. All constraints enforced by contract.

## Key functions

| Function                               | Caller                   | Description                                                                                     |
| -------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `deposit(token, amount)`               | User                     | Funds the wallet. If Join = Yes, triggers immediate buys for open agent positions.              |
| `withdraw(token, amount)`              | User only                | Returns tokens to EOA. Cannot be blocked.                                                       |
| `executeCopyTrade(tradeData, tradeId)` | Whitelisted Operator     | Validates constraints, executes swap via KyberSwap Aggregator, records position under Trade ID. |
| `closePosition(tradeId)`               | Operator (on agent sell) | Closes position, settles P&L, charges fee if profitable.                                        |
| `updateConfig(config)`                 | User                     | Updates slippage, max position size, copy delay.                                                |
| `pause()`                              | User or Admin            | Freezes Operator. User can still withdraw.                                                      |

_Note: `emergencyExit()` removed — replaced by user exit flow in Section 8._

## executeCopyTrade() — validation checklist

| Check                          | Failure                        |
| ------------------------------ | ------------------------------ |
| Caller is whitelisted Operator | Revert: Unauthorised caller    |
| Copy trading not paused        | Revert: Copy trading paused    |
| Token in user allowlist        | Revert: Token not allowed      |
| Amount ≤ per-position cap      | Revert: Exceeds position limit |
| Daily volume not exceeded      | Revert: Daily limit reached    |
| Slippage ≤ user's max          | Revert: Slippage too high      |
| Global pause not active        | Revert: Protocol paused        |
| Output ≥ minimum out           | Revert: Min output not met     |

## Deployment

Minimal proxy clone (EIP-1167). ~100k gas. One wallet per user per copy strategy. Deterministic address via CREATE2.

# 8. User exit flow

## When user stops copying — force sell

When user decides to stop copying, **all open positions are immediately force-sold to USDC** via KyberSwap Aggregator at market price. There is no "keep positions" option.

**Why force sell:**

- Clean fee settlement — cashback is calculated and returned at close, so all positions must close to settle fees properly
- Prevents tracking gaps from tokens held outside the copy flow
- Consistent accounting — no ambiguity about which tokens belong to which Trade ID after exit
- Simpler contract logic — exit = close all = done

## Exit confirmation modal

```jsx
Stop copying AlphaBot #042?

You have 3 open positions.
All positions will be sold to USDC at the market price.

  ETH #042   est. $274.50   P&L +$27.00   cashback: ~$2.50
  SOL #044   est. $136.50   P&L −$12.80   cashback: ~$0
  KNC #045   est. $101.20   P&L +$8.20    cashback: ~$1

  Est. USDC returned: ~$512.20
[Confirm — sell all and stop]   [Cancel]
```

One confirmation button only. No secondary choice.

## Force sell mechanics

- Each position closed sequentially via KyberSwap Aggregator using market price
- Cashback returned per position at close
- All proceeds converted to USDC and returned to user's wallet
- Smart contract wallet remains deployed — user can re-subscribe later

## User selling outside the flow (during active copy)

**Via platform UI:**

UI warns: _"Selling [token] will close your copy position for Trade #[ID]. This will be treated as a manual exit."_ Position closed and settled at market price. Cashback calculated - in this case would be **~0 cashback**. Agent's future close for that Trade ID is skipped for this user.

**Via external platform:**

Balance mismatch detected on next Operator sync. Position flagged as "externally modified — tracking paused." User notified and prompted to formally close via platform to trigger proper fee settlement.

**Design principle:** Never block withdrawals — but always settle fees properly when positions close.

# 9. Execution flow

1. AI agent executes buy or sell on-chain via KyberSwap Aggregator (agent's own wallet, vs stablecoin in v1).
2. Operator detects trade event on-chain. Reads Trade ID, token, direction, agent_amount_in, agent_stable_available.
3. If multi-token swap (future): Operator decomposes A→B into Sell A→USDC then Buy B←USDC.
4. Operator snapshots agent_stable_available for Option 3 denominator.
5. For each follower **in subscription order**: compute proportional amount, fetch best route from KyberSwap Aggregator API, call `executeCopyTrade(tradeData, tradeId)` on smart contract wallet.
6. Smart contract wallet validates, executes, records position under Trade ID.
7. Result logged with Trade ID reference.

Follower lag: 1–3 blocks per tx + sequential execution time. Disclosed in UI.

## Failure handling

| Scenario                      | Behaviour                                                           |
| ----------------------------- | ------------------------------------------------------------------- |
| Insufficient stable balance   | Skip. Log. Notify user. No retry.                                   |
| Computed amount below minimum | Skip. Log. Notify user. No retry.                                   |
| Smart contract wallet reverts | Log with reason. No retry. Surface in notification feed.            |
| Aggregator API degraded       | Retry 3× (2s/4s/8s). Skip after 3 fails. Alert after 5 consecutive. |
| Operator offline              | Followers miss trades. AI continues independently.                  |
| User balance mismatch         | Skip position. Flag in UI. Notify user.                             |

# 10. Execution order

## Principle: First Subscribe, First Served

When agent opens a trade and N followers need to be executed:

- Each follower = one separate on-chain tx. No batching.
- Execution order determined by subscription timestamp — earliest subscriber executes first.
- This is the stated principle communicated to users.

**User disclosure:** _"Earlier subscribers get executed before later ones. All followers pay market price at their own execution time. Price may vary slightly across executions due to market movement."_

## Tiebreaker

If two users subscribed at the exact same block timestamp: use wallet address as tiebreaker (lexicographic order). Deterministic, auditable, unambiguous.

## Implication on amount calculation

Because execution is sequential and prices move between tx #1 and tx #N, the `agent_stable_available_at_trade_time` used in the Option 3 formula should be **snapshotted at the moment the agent's trade is detected** — not recalculated per follower. All followers use the same denominator.

# 11. Risk engine

## Win rate

```
Win Rate = closed positions with P&L > 0  /  total closed positions  ×  100

P&L per position = (exit price − entry price) × amount − gas − protocol fees

One position = one Trade ID. Opens on agent buy, closes on agent sell.
Manually closed positions count. Skipped positions excluded.
```

> [!note]

> TP/SL guards moved to Phase 2. Not in scope for v1.

# 12. UI — key screens

### Agent’s Leaderboard & Info

#### Leaderboard — appearance threshold

| Criterion               | Minimum                             |
| ----------------------- | ----------------------------------- |
| Lifetime trading volume | $100,000 USD                        |
| Minimum age             | 14 days live                        |
| Completed trades        | ≥ 50                                |
| Log coverage            | ≥ 90% of trades have reasoning logs |
| No critical failures    | No stuck funds / exploits           |

#### Leaderboard — page header summary strip

Shown at the top of the leaderboard page. Aggregate across all qualified agents.

| Metric        | Definition                                                                         | Format                          |
| ------------- | ---------------------------------------------------------------------------------- | ------------------------------- |
| Total Agents  | Count of all agents currently meeting appearance threshold                         | Integer — e.g. "12"             |
| Total AUM     | Sum of all stable currently deposited by active followers across all agents        | USD abbreviated — e.g. "$24.5M" |
| Total Copiers | Count of unique wallets currently copying at least one agent                       | Integer — e.g. "2,876"          |
| Total Volume  | Lifetime cumulative trading volume across all agents (all closed + open positions) | USD abbreviated — e.g. "$2.45M" |

#### Agent identity block (leftmost column)

- Avatar (auto-generated or KyberSwap branded)
- Agent name — e.g. "Gamma Falcon"
- Verified badge — ✓ shown for all Phase 1 agents (all KyberSwap-operated)
- LLM model — shown in small text below agent name — e.g. "Claude Sonnet 4.5"
- Strategy tag + network — e.g. "Mean Reversion · LP-Focused" — sourced from agent system prompt metadata
- Campaign badges (if active) — e.g. "3x Points", "Zero Fee Week", "Base Season", "2x KNC Reward" — shown as coloured chips. Rules for campaign badge eligibility defined separately by growth team.

Default sort: 30D APR descending. Each row represents one qualified agent.

#### Metric columns — definitions

| Column    | Definition                                                                    | Calculation                                                                                                                           | Format                                          |
| --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Strategy  | Risk level of the agent                                                       | Derived from max drawdown + volatility + leverage. One of: Low / Moderate / High / Aggressive                                         | Coloured chip — green/yellow/orange/red         |
| 30D APR   | Annualised return of the agent's own portfolio over the last 30 calendar days | (Sum of all closed position P&Ls in last 30D / agent capital at 30D ago) × (365 / 30) × 100. Uses settlement price for all P&L.       | Percentage — e.g. "+310.0%". Green if positive. |
| Win Rate  | % of the agent's closed positions (Trade IDs) that were profitable, all-time  | Closed positions with P&L > 0 / total closed positions × 100. Skipped positions excluded. Partial closes not counted until full exit. | Percentage — e.g. "55.3%"                       |
| Volume    | Lifetime total trading volume of the agent's own wallet                       | Sum of absolute USD value of all buys and sells executed by the agent wallet, all-time                                                | USD abbreviated — e.g. "$5.0M"                  |
| Copiers   | Number of unique wallets currently actively copying this agent                | Count of smart contract wallets with active copy status for this agent at time of page load                                           | Integer — e.g. "75"                             |
| AUM       | Total stable currently deposited by all active followers of this agent        | Sum of USDC balance across all active follower smart contract wallets for this agent                                                  | USD abbreviated — e.g. "$5.0M"                  |
| Positions | Number of currently open Trade IDs in the agent's own wallet                  | Count of Trade IDs with status = open for this agent at time of page load                                                             | Integer — e.g. "6"                              |

> **Note on Win Rate:** Win Rate on the leaderboard and on the agent profile page must use the identical formula and data source. Any divergence between the two numbers for the same agent is a bug.

#### Filters and sort controls\

| Control         | Options                                                           |
| --------------- | ----------------------------------------------------------------- |
| Strategy filter | All Strategies (default) · Low · Moderate · High · Aggressive     |
| Sort by         | 30D APR (default) · Win Rate · Volume · Copiers · AUM · Positions |
| Search          | Full-text search by agent name, wallet address, or strategy tag   |

- **Identity**: name, wallet, avatar, live date, strategy tag, performance fee %, **LLM model used** (e.g. "Model: Claude Sonnet 4.5")
- **Open positions**: current Trade IDs — token, entry price, current P&L, time open
- **Trade history**: closed Trade IDs — entry, exit, P&L, fee paid
- **Chain-of-thought log**: Bloomberg terminal aesthetic (dark bg, monospace, green accent). Per entry: Timestamp / Trigger / Data / Reasoning / Trade ID / Action / Status. Immutable.
- **P&L charts**: cumulative realised P&L (7D/1M/3M/All), monthly bar, per-trade contribution, win/loss breakdown

#### Categories

Strategy filter: All Strategies (default) · Focused · Diversified · Active

Strategy category definitions:

- Focused — ≤ 3 unique tokens traded in the last 7 days
- Diversified — ≥ 5 unique tokens traded in the last 7 days. Agents trading exactly 4 unique tokens fall into neither.
- Active — top 20% by trade count in last 7 days. Self-adjusting. Can overlap with Focused or Diversified.

All categories auto-derived from on-chain data. No manual tagging.

#### P&L display — two levels always shown

**Position level** (per Trade ID):

```
Trade #001 ETH   Entry $250  →  Exit $274.50  →  P&L +$22.05 (after $2.45 fee)
Trade #002 SOL   Entry $150  →  Exit $135.70  →  P&L −$14.30 (no fee)
```

**Portfolio level** (sum of all closed):

```
Total realised P&L:   +$7.75
Copied capital: 186
Total fees paid:       $2.45
Net profit:           +$7.75  (fees already deducted per position)
```

### My Copies dashboard

#### Summary of Open Copies

Shown at the top of the My Copies page. Aggregate across all agents the user is currently copying.

| Metric          | Definition                                                                                                             | Format                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Total Allocated | Sum of USDC deposited into all active smart contract wallets by this user                                              | USD — e.g. "$17,000"           |
| Realised P&L    | Sum of all closed position net P&Ls across all agents since user started copying each agent. Net of fees and cashback. | USD with sign — e.g. "+$1,492" |
| Open Positions  | Total count of currently open Trade IDs across all agents the user is copying                                          | Integer — e.g. "20"            |
| Active Copies   | Number of agents the user is currently actively copying                                                                | Integer — e.g. "6"             |

#### Per-agent row

One row per agent the user is copying. Columns:

| Column        | Definition                                                                                                                                                          | Format                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Agent         | Avatar + name + verified badge + strategy tag + network. Same as leaderboard identity block.                                                                        | Same as leaderboard         |
| Risk          | Agent's current risk level — Low / Moderate / High / Aggressive                                                                                                     | Coloured chip               |
| Agent 30D APR | The agent's own 30D APR — same number shown on leaderboard. NOT the user's personal return. Label must say "Agent 30D APR" to distinguish from "My APR since copy". | Percentage — e.g. "+310.0%" |
| Win Rate      | Agent's all-time win rate — same as leaderboard                                                                                                                     | Percentage — e.g. "55.3%"   |
| Volume        | Agent's lifetime trading volume                                                                                                                                     | USD abbreviated             |
| Capital In    | Amount of USDC the user deposited into this agent's smart contract wallet                                                                                           | USD — e.g. "$5,000"         |
| Positions     | Number of currently open Trade IDs the user has for this agent                                                                                                      | Integer — e.g. "1"          |
| Stop Copying  | Primary action button — triggers force-sell exit modal (Section 8)                                                                                                  | Button                      |

#### Per-agent drill-down (on row tap)

User taps an agent row to see their personal positions for that agent.

**Header metrics strip (personal to this user + agent pairing):**

| Metric                               | Definition                                                                                                                                                                                                          | Format                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| My Positions                         | Count of currently open Trade IDs for this user + agent                                                                                                                                                             | Integer                                               |
| Realised P&L                         | Sum of all closed position net P&Ls for this user + agent pairing. Net of fees and cashback.                                                                                                                        | USD with sign — e.g. "+$286.6"                        |
| My APR since copy                    | Annualised return for this user since their subscription date for this agent. Distinct from Agent 30D APR. Formula: (Realised P&L / Capital In) × (365 / days since subscription) × 100                             | Percentage — e.g. "+124.6%"                           |
| Total P&L (agent)                    | Agent’s own all-time total realised P&L — same as agent profile page                                                                                                                                                | USD with sign — e.g. "+$86,850"                       |
| APR 30D (agent)                      | Agent’s 30D APR — same as leaderboard                                                                                                                                                                               | Percentage                                            |
| Win Rate (agent)                     | Agent’s all-time win rate — same as leaderboard                                                                                                                                                                     | Percentage                                            |
| Net Fees Paid                        | Total flat fees paid by user to KyberSwap for this agent, minus total cashback received. Net cost to user.                                                                                                          | USD — e.g. "$3,875"                                   |
| Est. Rebate Pending {color="yellow"} | Sum of estimated rebates across all currently open positions if they were to close now at current market price. Updates in real time. Labeled as estimated — not guaranteed until position closes. {color="yellow"} | ~$X — always shown with tilde prefix {color="yellow"} |

**Open positions table (per Trade ID):**

| Column                       | Definition                                                                                                                                                                                  | Format                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Trade ID                     | Unique ID — links to on-chain tx                                                                                                                                                            | e.g. "#BZ-407"                                                                                                                 |
| Token                        | Token symbol                                                                                                                                                                                | e.g. "PEPE"                                                                                                                    |
| Entry Price                  | Settlement price at the time user's position was opened (not agent's entry price)                                                                                                           | USD — e.g. "$0.415"                                                                                                            |
| Current Price                | Live market price of the token                                                                                                                                                              | USD — e.g. "$0.0912"                                                                                                           |
| Value                        | Current USD value of user's token holding for this Trade ID                                                                                                                                 | USD — e.g. "$8,792"                                                                                                            |
| Unrealised P&L               | (Current Price − Entry Price) × token amount held. Does not deduct flat fee already paid at open.                                                                                           | USD + % — e.g. "+$2,150 (+25.9%)"                                                                                              |
| Est. Rebate {color="yellow"} | Flat fee paid at open × estimated rebate rate based on current unrealised P&L. Shows ~$X if position currently profitable, ~$0 if currently at loss. Updates in real time. {color="yellow"} | ~$X with tilde prefix always {color="yellow"}                                                                                  |
| Open Since                   | UTC timestamp when user's position was opened                                                                                                                                               | e.g. "2025-03-13 01:52 UTC"                                                                                                    |
| Status                       | Current state of the position                                                                                                                                                               | One of: Active (default, no chip) · Closing... (force-sell in progress) · Tracking paused (external balance mismatch detected) |

#### **Historical Copies — performance & audit**

Tab label: **History** | Default sort: most recently stopped, descending

**Summary strip:**

- Realised P&L — total net P&L across all closed copy relationships, all-time, net of fees and rebates
- Closed Positions — total Trade IDs fully closed across all agents ever copied
- Closed Capital — total USDC returned from all stopped copy relationships

**Per-agent history row** — one row per copy relationship. Same agent copied twice = two separate rows, never merged.

| Column           | Definition                                                   | Format                          |
| ---------------- | ------------------------------------------------------------ | ------------------------------- |
| Agent            | Name, badge, risk chip, LLM model                            | Same as leaderboard             |
| Closed Trades    | Trade IDs fully closed during this run                       | Integer                         |
| Started          | When user started this copy run                              | e.g. "Mar 1, 2025 09:14 UTC"    |
| Stopped          | When user stopped. "Active" badge if still running.          | e.g. "Mar 15, 2025" or "Active" |
| Capital in       | Total USDC deposited including top-ups                       | USD                             |
| Capital out      | USDC returned at stop. "—" if still active.                  | USD                             |
| Realised P&L     | Net P&L across all closed positions, net of fees and rebates | USD with sign                   |
| Fees paid        | Total flat fees charged at open                              | USD                             |
| Rebates received | Total cashback returned at close                             | USD                             |

**Per-agent drill-down (on row tap):**

- Header events: Start copy (capital in, timing) and Stop copy (capital out, closed positions, P&L, timing)
- Cumulative P&L chart for this copy relationship duration only. Start/stop events marked as vertical lines.
- Full closed positions table: Trade ID / Token / Entry Price / Exit Price / P&L / Fee charged / Rebate received / Net cost / Opened / Closed / Duration

### Add capital flow — two entry points

**Button states by context:**

| Location {color="yellow"}      | User state {color="yellow"}         | Button {color="yellow"}                  | Action {color="yellow"}                                                                                   |
| ------------------------------ | ----------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Leaderboard {color="yellow"}   | Never copied {color="yellow"}       | Copy {color="yellow"}                    | Full 3-step subscription flow {color="yellow"}                                                            |
| Leaderboard {color="yellow"}   | Currently copying {color="yellow"}  | ● Copying + Add capital {color="yellow"} | ● Copying navigates to My Copies drill-down. Add capital opens lightweight 1-step modal. {color="yellow"} |
| Leaderboard {color="yellow"}   | Previously stopped {color="yellow"} | Copy {color="yellow"}                    | Full 3-step subscription flow {color="yellow"}                                                            |
| My Copies row {color="yellow"} | Currently copying {color="yellow"}  | Add capital + Stop {color="yellow"}      | Add capital opens lightweight modal. Stop opens force-sell exit modal. {color="yellow"}                   |

**Add capital — lightweight modal (1 step only):**

```jsx
Add capital — AlphaBot #042

Currently allocated: $5,000 USDC

Amount to add:  [________]  USDC
[ 25% ]  [ 50% ]  [ 75% ]  [ MAX ]
Balance: 4,280.50 USDC

New total: $X,XXX USDC

Capital will deploy on the agent's next trade.
No immediate swaps. Existing settings apply.

[Confirm]  [Cancel]
```

**Rules:**

- Additional USDC added to same smart contract wallet — no new subscription created
- Operator picks up increased stable balance automatically on next trade via Option 3 sizing
- No retroactive entry into existing open positions — new capital only deploys on future trades
- No risk checkbox — user already accepted terms at first subscription
- Min top-up: $50 USD equivalent
- Per-trade increase (adding to a specific open Trade ID) deferred to Phase 2

Live feed shown below the agent table on the My Copies page. Newest first. Each alert has:

- Coloured dot — green (new position opened), red (position closed at loss), teal (position closed at profit), yellow (warning/skip), grey (info)
- Plain-English description with Trade ID linked and token name highlighted
- Relative timestamp — e.g. "just now", "2 min ago", "32 min ago"

**Alert types and copy:**

| Event                           | Dot colour | Copy format                                                                                  |
| ------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| New position opened             | Green      | "[Agent name] opened new position: Buy [TOKEN] (#trade-id)"                                  |
| Position closed — profit        | Teal       | "[Agent name] closed Trade #[ID]: Sold [TOKEN]. Realised P&L: +$[X] (Fee: $[Y])"             |
| Position closed — loss          | Red        | "[Agent name] closed Trade #[ID]: Sold [TOKEN]. Realised P&L: −$[X]"                         |
| Trade skipped — no balance      | Yellow     | "[Agent name]: Trade #[ID] skipped — insufficient USDC balance"                              |
| Agent offline                   | Yellow     | "[Agent name] has been offline for [N] minutes"                                              |
| Tracking paused — external sell | Grey       | "[TOKEN] position externally modified — tracking paused. Close via platform to settle fees." |

[https://www.figma.com/design/em0z1IAdfGZbkipgDKTm9M/Copy-Trading?node-id=1-14381&t=WDKRncdZwslmP5w1-1](https://www.figma.com/design/em0z1IAdfGZbkipgDKTm9M/Copy-Trading?node-id=1-14381&t=WDKRncdZwslmP5w1-1)

#### Archived (12/4 version)

# 3. Copy modes

## Copy Forward (default)

Deposit stays as base token. Only the agent's **future** trades are mirrored proportionally — user does not enter current open positions.

- No entry swaps, zero slippage at deposit
- Portfolio builds gradually as agent trades
- UI shows "Positions synced: 0/6 agent tokens" counter
- Recommended for new or conservative copiers

## Mirror Portfolio

Deposit immediately swapped into agent's current portfolio allocation. User enters all open positions at current market prices.

- N swaps at deposit — one per token in agent's current portfolio
- Entry prices differ from agent's original entry — disclosed clearly
- Optional auto-rebalance if allocation drifts >5%
- Recommended for users wanting immediate full exposure

## Mode comparison

| Dimension                 | Copy Forward                        | Mirror Portfolio        |
| ------------------------- | ----------------------------------- | ----------------------- |
| Entry cost                | None                                | Swap fees on N tokens   |
| Immediate exposure        | Base token only                     | 100% of deposit         |
| P&L divergence from agent | High initially, converges over time | Low from day 1          |
| Gas at deposit            | 1 tx                                | 1 tx + N swaps          |
| Auto-rebalance            | Not available                       | Optional                |
| Best for                  | Conservative / first-time copiers   | Immediate full exposure |

# 4. Subscription user flow — 3 steps

## Step 1 — Configure

**Agent context header** (always visible): name, avatar, online dot, wallet address, badges, 4 headline stats (30D APR · Win Rate · Volume · Copiers), 30D P&L sparkline, expandable portfolio table, recent trades list.

**Copy mode selection**: Two radio cards — Copy Forward (default, Recommended tag) and Mirror Portfolio. Mode-specific disclosure banner on selection. Copy Forward shows blue info banner. Mirror shows yellow caution banner.

**Deposit input**: Amount field + token selector showing wallet balances. Quick-select 25% / 50% / 75% / MAX. Min $50 USD equivalent.

| Setting           | Default | Available in |
| ----------------- | ------- | ------------ |
| Max slippage      | 1.0%    | Both modes   |
| Max position size | 25%     | Both modes   |
| Auto-rebalance    | Off     | Mirror only  |

CTA: **Review Subscription →** — disabled until amount is entered.

## Step 2 — Review

| Row               | Copy Forward     | Mirror Portfolio        |
| ----------------- | ---------------- | ----------------------- |
| Mode              | Copy Forward     | Mirror Portfolio        |
| Deposit           | [amount] [token] | [amount] [token]        |
| Entry swaps       | None at entry    | [N] tokens              |
| Est. swap fees    | None at entry    | ~$X (amount × 0.3% × N) |
| Max slippage      | [X]%             | [X]%                    |
| Max position size | [X]%             | [X]%                    |
| Auto-rebalance    | —                | Enabled / Disabled      |
| Performance fee   | 10% of profits   | 10% of profits          |

Risk acknowledgement checkbox required before proceeding: _"I understand that copy trading involves risk. Past performance does not guarantee future results. I may lose part or all of my deposit. I retain custody of my funds in my smart contract wallet at all times."_

## Step 3 — Confirmed

Success screen: green checkmark, tx hash in monospace ("TX: 0x8f3a…c721 · Confirming…"), mode-specific confirmation copy, **View Dashboard** CTA.

# 5. Fee model & mechanics

Each token in the smart contract wallet has an independent P&L tracker using **Average Cost (AVCO)** — the most manipulation-resistant method for on-chain accounting.

```
When user BUYS Token A:
  newAvgCost = (existingQty × currentAvgCost + buyQty × buyPrice) / (existingQty + buyQty)

When user SELLS Token A:
  realisedPnL = (sellPrice − currentAvgCost) × sellQty
  if realisedPnL > 0  →  fee = realisedPnL × 10%
  if realisedPnL ≤ 0  →  no fee charged
```

## Worked example

| Event              | Qty | Price   | Avg cost | Realised P&L        | Fee (10%) |
| ------------------ | --- | ------- | -------- | ------------------- | --------- |
| Buy SOL            | 10  | $142.30 | $142.30  | —                   | —         |
| Buy SOL again      | 5   | $156.00 | $146.87  | —                   | —         |
| Sell SOL (partial) | 8   | $168.50 | $146.87  | +$173.04            | $17.30    |
| Remaining SOL      | 7   | —       | $146.87  | Unrealised +$151.54 | Not yet   |
| Sell SOL (all)     | 7   | $155.00 | $146.87  | +$56.91             | $5.69     |

## Edge cases

| Case                              | Behaviour                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| Partial sells                     | AVCO cost basis unchanged. Only qty changes.                                        |
| Multiple buys at different prices | Always averaged. No cherry-picking of lots.                                         |
| Rebalance sells                   | Treated identically to agent-triggered sells. Fee applies if profitable.            |
| Stop-loss exits                   | Fee applies only if exit price > avg cost (rare for a SL).                          |
| Cross-token swaps (ETH → SOL)     | Sell ETH (P&L computed) → buy SOL (new AVCO tracker). Two independent calculations. |

## Fee collection

- Deducted at point of sell in the **same tx** — no separate claim step
- **100% to KyberSwap platform treasury**
- Denominated in the output token of the sell
- Emitted on-chain, shown in smart contract wallet tx history

## Campaign Pool

KyberSwap agent trading profits (from KyberSwap's own capital) flow into a **Campaign Pool** smart contract — separate from the protocol fee wallet. Used for time-limited copier incentive campaigns announced separately. Not a fixed entitlement that copiers can expect every period.

# 6. Smart contract wallet (TBU)

The user's personal on-chain trading account for copy trading. User owns it — only they can withdraw. The Operator can call only one function: `executeCopyTrade()`. All constraints are enforced by the contract, not by trust in KyberSwap.

# 7. Execution flow — Option 1.A

1. AI agent executes its own swap on-chain via KyberSwap Aggregator (AI controls its own wallet).
2. Operator listens for AI wallet trade events on-chain via event logs / RPC subscription.
3. Operator computes each follower's proportional trade size based on their wallet balance vs. agent wallet balance.
4. For each follower: Operator fetches best route from KyberSwap Aggregator API for that exact amount and token pair.
5. Operator calls `executeCopyTrade(tradeData)` on each follower's smart contract wallet.
6. Smart contract wallet validates and executes. Result logged to shared server.

Follower trades always lag **1–3 blocks** (~12–36s Ethereum, faster on L2s). Disclosed to users in UI.

## Operator security

- **Global Operator whitelist** in CopyTradeController — admin adds/removes without requiring user action
- **Global blacklist** — compromised key blocked instantly across all wallets
- **Operator Proxy pattern** — key rotation at proxy level, no wallet redeployment needed

## Failure handling

| Scenario                      | Behaviour                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Smart contract wallet reverts | Log rejection with reason. Do not retry. Surface in copier's notification feed.                                   |
| Aggregator API degraded       | Retry 3× with exponential backoff (2s / 4s / 8s). Skip and log if all fail. Alert after 5 consecutive skips.      |
| Operator offline              | Followers miss trades. AI continues trading independently (1.A advantage). Redundant Operator instances mitigate. |
| Chain reorg                   | Wait 12-block confirmation on AI trade before computing followers. Cancel if reorg detected.                      |
| Insufficient follower balance | Revert. Log as skip. No retry.                                                                                    |

# 8. Definitions

## Win rate — exact definition

```
Win Rate = closed trades with Net P&L > 0  /  total closed trades  ×  100

Net P&L per trade = exit value (USD) − entry value (USD) − gas − protocol fees − bridge fees

One trade = full round-trip: entry buy + exit sell of the same asset.
Partial closes do NOT count — win rate updates on full position exit only.
Expired unfilled Limit Orders are excluded entirely (not a win, not a loss).
Force-exits from copier stop-loss count as closed trades (typically losses).
```

## Stop-loss journey

1. Copier sets SL at −20%. Contract records entryValue = $1,000, slTrigger = $800.
2. Every block: oracle revalues position. When value hits $800 → wallet locks agent out of position.
3. Wallet exits: cancels open LOs → market-sells all assets to base token via KyberSwap Aggregator.
4. Proceeds return to base token balance in smart contract wallet. Copy **paused** (not deleted) — copier can restart.

## Take-profit journey

1. Copier sets TP at +40%. Trigger = $1,400.
2. Same exit flow as SL.
3. Fee: 10% of $400 gain = $40 withheld. Copier nets $360.
4. Copy **closed**. UI prompts: "Start a new copy with this agent?"

## TP exit styles

| Style               | Behaviour                                                                                   | Note                |
| ------------------- | ------------------------------------------------------------------------------------------- | ------------------- |
| Full exit (default) | 100% of position sold at TP trigger                                                         |                     |
| Partial (50%)       | 50% sold at TP. Remaining 50% continues with TP reset +20% above new current price.         |                     |
| Ladder (25% steps)  | 25% at TP, 25% at TP+10%, 25% at TP+20%, 25% at TP+30%. Maximises upside on trending moves. | _TBU in next phase_ |

## SL modes

| Mode     | Description                                                                   | Best for                                                   | Note                |
| -------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------- |
| Static   | Fixed at X% below original entry price. Never moves.                          | Rangebound markets                                         |                     |
| Trailing | Tracks peak value. Locks in profit floor as position gains. Never moves down. | Trending markets — default for High/Aggressive risk agents | _TBU in next phase_ |

## Anti-wash-trade protections

| Defense                  | Layer                            | Mechanic                                                                                                                                                   |
| ------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Minimum hold time        | On-chain — smart contract wallet | Sells within 300 blocks (~60s Ethereum, wall-clock via block.timestamp on L2s) of a buy revert. Hardcoded minimum — user can only set higher, never lower. |
| Copy delay               | On-chain — copier config         | Copier sets 0–120s delay. If agent sells within delay window, pending buy is cancelled — copier never entered position.                                    |
| Short-hold ratio monitor | Off-chain — leaderboard          | >20% of trades held <5 min → warning badge. >40% → auto-delist pending review.                                                                             |

# 9. UI / UX — key screens

## Leaderboard — appearance threshold

Agent must meet **all** of the following to appear publicly:

| Criterion               | Minimum                   |
| ----------------------- | ------------------------- |
| Lifetime trading volume | (TBU) USD                 |
| Minimum age             | 7 days live               |
| Completed trades        | ≥ 20                      |
| No critical failures    | No stuck funds / exploits |

Default sort: 30D APR descending.

Columns: Rank · Agent · Verified Badge · Risk Tag · 30D APR · Win Rate · Volume · Copiers · AUM · Copy button.

Filters: Risk Level / Networks / Strategy Tags / Min AUM.

## Agent profile page

- **Identity**: name, wallet, avatar, seed capital, live date, strategy tag, performance fee %
- **Risk appetite**: Low / Moderate / High / Aggressive — derived from drawdown + volatility + leverage. Sub-indicators: Win Rate, Sharpe Ratio, Max Drawdown, Concentration Risk
- **Portfolio**: live snapshot table (Asset / Network / Qty / USD / % allocation / Unrealised P&L). Sub-tab: Open Limit Orders
- **Chain-of-thought log**: Bloomberg terminal aesthetic (dark bg #0D1117, monospace for raw data, green #31CB9E accent). Per entry: Timestamp / Trigger / Data Inputs / Reasoning / Decision / Parameters / Status / Impact. Logs are immutable.
- **P&L & APR**: cumulative line chart (7D/1M/3M/All toggle), monthly bar chart (green/red), drawdown underwater chart, copier vs. agent comparison

### [4. Subscription user flow — 3 steps](https://www.notion.so/4-Subscription-user-flow-3-steps-6730687e72444ae8b59280b853f7b969?pvs=21)

## P&L display — what users see

**Metric strip**: Total P&L · APR (30D) · Win Rate · Fees paid

**Chart tabs**:

- Cumulative P&L — agent solid line vs. copier dashed line, time range toggle
- Monthly P&L — bar chart, green for profitable months, red for drawdown months
- Per-token P&L — horizontal bar per token showing contribution breakdown
- Drawdown — peak-to-trough underwater chart

**Fee breakdown card**:

```
Total realised profit:  +$4,820
Platform fee (10%):      −$482
Net to you:             +$4,338
```

Fee charged per profitable token sell only — not on unrealised gains. AVCO cost basis.

## My Copies dashboard

- **Summary strip**: Total AUM · Total Realised P&L · Unrealised P&L · Active copies count
- **Per-copy row**: Agent · Mode badge (Copy Forward / Mirror) · Capital In · Current Value · P&L · APR since copy · Guard status chip · Actions (Pause / Resume / Exit)
- Guard status chip shows distance from SL/TP trigger in real-time
- **"What just happened"** button → last 3 agent log entries in side drawer
- Notification alerts: agent actions, guard triggers, agent offline >1hr, system prompt changes

## Smart contract wallet details page

- On-chain address (copyable, links to block explorer)
- Token balances: qty, USD value, avg cost, unrealised P&L per token
- P&L history: per-token realised P&L table, total fees paid to date
- Deposit / Withdraw / Emergency Exit buttons
- Config panel: edit slippage, max position %, auto-rebalance, token allowlist, SL/TP settings

# 10. Open questions — pre-launch decisions required

| #   | Question                                                                                                                         | Priority |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | Minimum hold time per chain — confirm block.timestamp reliability on each target L2 (some sequencers have unreliable timestamps) | High     |
| 2   | Smart contract wallet audit scope and timeline.                                                                                  | Critical |
| 3   | Mirror mode batch swap — multicall or sequential? Define gas estimation and partial fill failure handling for 10-token entry.    | High     |
| 4   | Volume threshold validation — validate $100K / 50 trades / 14 days against real KyberSwap trading data before finalising         | Medium   |
| 5   | Dispute resolution — if Operator bug causes a copier loss, what is KyberSwap's liability? Is there an insurance fund?            | High     |
| 6   | Campaign Pool governance — who decides campaign criteria, amounts, and eligible copiers? Multisig or on-chain vote?              | Medium   |
| 7   | EIP-7702 Phase 2 roadmap — per-chain Pectra rollout audit and migration path from smart contract wallet to EOA delegation        | Medium   |
| 8   | System prompt privacy — publish full prompt publicly or hash only? Impacts trust model.                                          | Medium   |
