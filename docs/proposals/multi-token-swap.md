# Multi-Token Swap — Product Proposal

**Try the POC:** https://kyberswapvn.vercel.app/dust

## TL;DR

Pick N tokens in your wallet, choose one output, swap them as one atomic bundle in a single signature. Built on top of the existing **zap swap-route backend** — we get a brand-new product surface without any new infra. Headline use case: **dust liquidation**, which is also our strongest retention lever.

## We're not building a new engine — we're unlocking the one we already shipped

The aggregator backend has supported multi-input → single-output swaps for over a year (it's what powers Earn's zap-in). We've never exposed it as a user-facing product on the trade side. This proposal is purely a new UI layer over capabilities we already own, operate, and trust. Engineering risk: low. Time to launch: ~1 week from green-light.

Same backend, multiple use cases:

| Use case | User intent |
|---|---|
| **Dust liquidation** *(launch focus)* | Clean up 20 small balances cluttering my wallet |
| **Portfolio consolidation** | Move scattered L2 bags into USDC before the weekend |
| **Treasury cleanup** | DAO/multisig converging treasury into reserve assets |
| **Post-airdrop sweep** | Aggregating drops/forks straight into a stable |

## Why dust is the right wedge — and the retention argument

Standard swap is **transactional**: a user comes when they have a specific A→B intent, then leaves. There's no natural cadence to bring them back.

**Dust is continuous.** It accumulates every time the user does anything on-chain — swaps, claims, harvests, bridges, exits LPs. The wallet view they look at daily reminds them it's there. A user who cleaned up their dust last month will have new dust next month. That's the recurring-need pattern that drives habit and retention.

Concretely: if we capture a user's dust cleanup behavior, we create a reason for them to open KyberSwap **monthly without prompting**, which directly increases the chance they use the regular swap product when they actually need it. The retention math gets stronger with each new chain a user transacts on.

No competitor in the aggregator space has this — 1inch, Uniswap, Matcha all offer 1→1 swaps only. CEX dust-conversion tools require giving up self-custody. We're uniquely positioned because of the existing zap pipeline.

## Why now

EIP-5792 (`wallet_sendCalls`) just made N-token swaps feel like a single swap. MetaMask, Coinbase Smart Wallet, and Porto all support atomic batches. For wallets without it, the sequential fallback (per-token approve + final swap) still beats the manual flow.

## Positioning ask

Recommend: nav label **"Dust Liquidation"** (the hook), page title **"Multi-Token Swap"** (the actual capability). Dust drives discovery; the broader use cases reveal themselves once users land. Later we can add secondary entry points ("Portfolio Consolidation", "Treasury Cleanup") pointing to the same flow.

## Phased rollout

1. **Phase 1 (1 week)** — promote POC to production behind a feature flag. Instrument repeat-usage rate as the headline retention metric.
2. **Phase 2 (2–4 weeks)** — Permit2 for gasless approvals, "select all under $X" shortcut, portfolio-page CTA ("$42 in dust — clean it up").
3. **Phase 3 (4–8 weeks)** — **cross-chain consolidation** using our existing CrossChainSwap pipeline. At this point the feature becomes unreplicable. Recurring schedule ("sweep every Friday") via smart-account hooks.

## Success metrics

- **Repeat usage** — ≥30% of first-time users return within 30 days *(the retention thesis)*
- **Avg bundle size** — ≥4 input tokens (validates the multi-input value)
- **Adoption** — ≥5% of weekly active wallets within 6 weeks

## The ask

Greenlight Phase 1 — feature-flagged launch on the 10 chains where the zap backend is live. Decide on nav/page naming. The rest is GTM + instrumentation.

Try the POC — the experience sells itself in 30 seconds.
