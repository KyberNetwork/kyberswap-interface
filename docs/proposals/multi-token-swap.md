🧹 **Dust Liquidation — proposal**

POC: https://kyberswapvn.vercel.app/dust *(try it, sells itself in 30s)*

**What:** sweep multiple small token balances into one token in a single flow. Pure UI on top of our existing **Zap backend** (`/swap/route` — same endpoint powering Earn's zap-in). ~1 week from green-light. Already works on the 10 chains Zap BE supports.

**User pain:** every DeFi user accumulates dust — swap remainders, claims, airdrops, abandoned LP exits. Cleaning 20 small balances today = 40 signatures and the gas often exceeds the token value. Nobody does it. CEX dust-conversion exists but requires giving up self-custody. We can win this.

**The real reason — retention:**
- **Dust is continuous** — it accumulates with every on-chain action and sits in the wallet view daily, acting as a recurring reminder.
- Users who clean dust this month will have new dust next month → monthly touchpoints with KyberSwap without prompting → more swap volume when they actually need it.
- No aggregator competitor offers self-custody dust cleanup today.

**Rollout:**
1. **Week 1** — feature-flag launch, instrument repeat-usage as the headline metric.
2. **Weeks 2–4** — Permit2 for gasless approvals, "select all under $X" shortcut, portfolio-page CTA ("$42 in dust — clean it up").
3. **Weeks 4–8** — cross-chain consolidation via our existing CrossChainSwap pipeline (unreplicable by competitors).

**Future improvement:** EIP-5792 (`wallet_sendCalls`) can bundle approve+swap into a single signature, but only on smart-account wallets (Coinbase Smart Wallet, Porto, Safe). Skip day-one — most users are still on EOAs — but a nice add as smart-account adoption grows.

**Ask:** greenlight Phase 1 + decide nav label ("Dust Liquidation"? "Bulk Swap"?).
