# Unified Swap UI

> English reference copy of the Notion specification. The specification text below preserves the source wording, including unresolved questions and inconsistencies. Formatting, reference links, and the Victor mention have been normalized for Markdown.

## Source and scope

- **Primary source:** [Unified Swap UI](https://app.notion.com/p/kybernetwork/Unified-Swap-UI-3d726751887e80e9b29de9a15100fa90).
- **Snapshot read on:** 2026-10-06.
- **Source last edited:** 2026-09-28, according to Notion metadata.
- All 13 specification sections were available as text. The connector reported `truncated: true` and one unsupported `external_object_instance` block under Figma; the embedded design has not been reviewed.
- This document records product requirements, not the implementation status of this repository.
- This is a local snapshot and does not automatically sync with Notion.
- Appendices are editorial notes and reference-document summaries. They are separate from the source specification and do not resolve its open questions.

## References

- [Product Proposal: KyberCross — Multi-Bridge Cross-Chain Swap Solution](https://app.notion.com/p/33a26751887e80e1b853d3f1809c9c63).
- [Technical Design: KyberCross](https://app.notion.com/p/34926751887e80d1bb16df283b3bebc8).
- [Other docs: KyberCross](https://app.notion.com/p/37626751887e80348a96f12746ab3a81).
- [Repository docs: KyberNetwork/kybercross/docs](https://github.com/KyberNetwork/kybercross/tree/main/docs). Linked by the source; repository content was not reviewed for this snapshot.

## Contents

- [Terminology](#terminology-from-kybercross-proposal)
- [1. Problem](#1-problem)
- [2. Principles](#2-principles)
- [3. Layout](#3-layout)
- [4. Routing options](#4-routing-options-cross-chain-only)
- [5. Route chart](#5-route-chart)
- [6. History](#6-right-panel--history)
- [7. Price Chart](#7-right-panel--price-chart)
- [8. Fee breakdown & CTA](#8-fee-breakdown--cta)
- [9. Single-chain guardrails](#9-guardrails--single-chain-unchanged)
- [10. Edge cases](#10-edge-cases)
- [11. Analytics](#11-analytics)
- [12. Rollout](#12-rollout)
- [13. Open questions](#13-open-questions)
- [Figma](#figma)
- [Appendix A: Reference-document context](#appendix-a-reference-document-context)
- [Appendix B: Editorial notes and implementation questions](#appendix-b-editorial-notes-and-implementation-questions)
- [Appendix C: Requirement traceability checklist](#appendix-c-requirement-traceability-checklist)
- [Appendix D: Data reference for comparison](#appendix-d-data-reference-for-comparison)

## Terminology (from KyberCross proposal)

Use these consistently in UI copy and this spec:

- `KyberCross Fee` — Kyber's fee for destination-side execution. Never label it "Protocol Fee".
- `Protocol Fee` — a third-party bridge's own fee (Relay, Stargate, deBridge…).
- `Platform Fee` — KyberSwap's existing meta-aggregator fee on third-party routes.
- Outcomes: `SUCCESS` / `REFUNDED` / `FAILED`. No "Partial" outcome — receiving `dstTokenIn` instead of `dstTokenOut` is `REFUNDED`.

## 1. Problem

Swap and Cross-Chain live in two separate flows with different layouts, fee panels, and status handling. Users on the Swap tab don't discover cross-chain; users on Cross-Chain lose the price chart, settlement route, and slippage UX of Swap.

**Goal:** one Swap entry point where changing the output token's chain upgrades the flow to cross-chain — without changing anything in the single-chain path.

## 2. Principles

- Cross-chain is a **state, not a tab**. `srcChain === dstChain` → existing Swap, byte-for-byte. Otherwise → cross-chain mode.
- Single-chain path keeps the same quote API, route display, slippage defaults, chart, event names, and Smart Settlement. Zero new calls.
- Cross-chain mode reuses Swap's shell and swaps in cross-chain panels. No separate page.

## 3. Layout

- **Left — Swap card.** From token keeps the wallet-bound chain badge. To token selector gets a chain picker (extend the existing selector's chain dropdown). Chain badge appears next to "To" only when it differs from "From".
- **Below the card (cross-chain only):** Routing options → Route chart → Fee breakdown → CTA.
- **Token selector:** combine chain filter with name, symbol, or address search.
- **Gas Drop:**
- **Right panel:** tabs `Price Chart | History`. Single-chain default = Price Chart (unchanged). Cross-chain default = History, Price Chart one click away.
- **Cross-Chain tab:** phase 1 redirects to Swap with the last-used dst chain preselected; phase 2 removes the tab.

## 4. Routing options (cross-chain only)

**Trigger:** token out + amount in set → quotes requested from all providers ([LI.FI](http://LI.FI), Relay, Across, Bungee, Symbiosis, KyberCross when live). Show loading, no-route, and quote-error states separately; errors offer Retry

**Display:** "Choose your route" — a ranked list of all valid routes (per the mockup), not a fixed 2–3 cards. Top row is pre-selected. Show up to 5 by default, "Show more" for the rest, Best Return is pre-selected.

**Row fields**

- Est. output — token amount (bold) + USD
- Provider(s) — for KyberCross routes show the swap engine + bridge together, e.g. `KyberSwap + Across`; for third-party routes show the provider name (Relay, Stargate, deBridge, Mayan…)
- Est. time
- Gas cost (USD)
- Fee (USD) — labelled per the terminology above: third-party rows show `Protocol fee`; KyberCross rows do not show a fee line because the `KyberCross Fee` is already netted into the output (per proposal's preferred UX)
- Tag(s) — see below

**Tags**

- **Best Return** — highest net output after all fees. Default-selected.
- **Fastest** — lowest est. time among routes within X% of the best output (so a fast route that loses several % is never tagged). X to be set with BE.
- One route can carry both tags. Tags are the only thing that differentiate rows; no separate "Recommended" concept.

**Ranking:** sort by net output desc. Break ties by est. time. Routes from providers below a reliability threshold (success rate over last N days) are demoted to the bottom with a warning icon, not hidden.

**Data source:** KyberCross `GET /api/v1/quote` returns best route + alternatives; third-party providers via the existing meta-aggregator. FE merges into one list. Every row must carry a `flow_type` and ordered `steps` so the route chart (§5) can render from the same payload.

**Refresh:** same quote timer as Swap. Selection persists across refresh unless the selected route disappears → fall back to Recommended with a toast.

## 5. Route chart

**Shape:** horizontal flow
`[Token in · amount] → Kyber Aggregator → Bridge X → Kyber Aggregator → [Token out · amount]`

- Edges carry the intermediate token + amount (e.g. `→ 1,000 USDC →`).
- Each node shows its fee if non-zero (USD, with bps on hover). Nodes with no fee show nothing, not "0". Bridge nodes show the bridge's `Protocol fee`; the `KyberCross Fee`, when applicable, is shown once on the destination-swap node.
- **Variants** map 1:1 to KyberCross `flow_type`: `BRIDGE_ONLY`, `SWAP_BRIDGE`, `BRIDGE_SWAP`, `SWAP_BRIDGE_SWAP`. Chart renders only the `steps` present (`source_swap` / `bridge` / `destination_swap`), each with its `provider`, `token_in`, `token_out`.
- **Drilldown:** swap legs executed by Kyber Aggregator are clickable → expands the existing single-chain route chart component inline (same component, no new UI). Swap legs executed by a third-party router (e.g. [LI.FI](http://LI.FI)'s own DEX leg) show the router name and are not clickable unless the provider returns route data.
- Collapsed by default under Routing options; expands on click.
- Same chart is reused in the History detail drawer and the Review modal.
- Review shows quoted amounts; History shows executed amounts where available and labels pending/unavailable data. Do not present estimates as actual receipts or fabricate missing intermediate steps.

## 6. Right panel — History

- Latest **10 positions**, newest first. Processing positions pinned to top regardless of age. "View all" → full history page.
- **Row:** src token/chain → dst token/chain, amount in → amount out, status chip, timestamp, provider.
- **Statuses** follow the KyberCross outcome model:
  - **Processing** — any non-terminal route state (`SOURCE_SUBMITTED`, `BRIDGE_PENDING`, `DST_RECEIVED`, `SWAP_PENDING`, `REFUND_PENDING`, `BRIDGE_EXPIRED`, `SWAP_EXPIRED`…). Sub-label from `next_expected_action` (e.g. "Waiting for bridge", "Swapping on Base", "Refund in progress").
  - **Success** — `SUCCESS`
  - **Refunded** — `REFUNDED`. Covers destination-side recovery where the user receives `dstTokenIn` instead of `dstTokenOut`. Row shows the token actually received. Third-party `DONE` + `PARTIAL` substatus maps here, never to Success.
  - **Failed** — `FAILED`
- **Click row → detail drawer:** route chart with actual executed amounts, tx hashes per leg (`source_tx_hash`, `destination_tx_hash`), fees paid vs quoted (incl. any refunded `KyberCross Fee`), and a "Swap to intended token" shortcut on Refunded rows where funds landed on the dst chain.
- **Data source:** KyberCross `GET /api/v1/quotes?address=…&limit=10` merged with the existing meta-aggregator history; sort by `created_at` desc, Processing pinned.
- **Scope:** cross-chain positions only in phase 1 (see open questions).

## 7. Right panel — Price Chart

- Same chart component as Swap. Pair = token in / token out.
- If cross-chain settlement price data is sparse, show a conditional warning on the chart (not a blanket disclaimer) and fall back to USD price of token out.
- In cross-chain mode the chart is not rendered until the tab is clicked (saves the settlement-price fetch).

## 8. Fee breakdown & CTA

- Keep the existing panel: You receive, Max Slippage, Est. Processing Time, Price Impact, Platform Fee, Network Fees.
- Add **Bridge Fee** (the bridge's protocol fee) as a separate line when non-zero.
- **KyberCross Fee** is netted into "You receive" and not shown as a line item (proposal's preferred UX). The route chart and Review modal expose it on the destination-swap node for transparency. Confirm with Victor / BD whether a tooltip on "You receive" should list it.
- Slippage for cross-chain is its own setting/default, stored separately from single-chain.
- "Send to other wallet" stays cross-chain-only. Default to a compatible connected recipient; “Use My Wallet” restores that address.
- **CTA:** "Review Cross-Chain Swap". Review modal shows the route chart + selected routing option before signing.

## 9. Guardrails — single-chain unchanged

- No routing-option cards, no route chart change, no History default, no Bridge Fee line, no new events.
- Limit Order remains single-chain; the dst-chain picker is not shown there.
- Everything in cross-chain mode sits behind a feature flag; the single-chain code path has no flag checks in hot paths.

## 10. Edge cases

- **Same token, different chain** (USDC Base → USDC Arbitrum): valid, bridge-only route, chart still renders.
- **Token out not supported on dst chain** by any provider → "No route" with a suggestion to pick a bridge token.
- **Wallet on wrong network at execute** → prompt to switch, keep the quote.
- **Dst gas shortfall** → surface provider gas top-up if supported, else warn before Review.
- **Src chain changed by wallet mid-quote** → re-quote; if now equal to dst, revert to single-chain mode.
- **Selected route drops out on refresh** → fall back to Best Return, toast.
- **Quote TTL expired** (`expires_at`) before signing → re-quote automatically; if output moved more than slippage, show a confirm step.
- **Bridge succeeds, destination swap unexecutable** (KyberCross Scenario 2) → History shows Processing → Refunded; user receives `dstTokenIn`; fee refund reflected in detail drawer.
- **Bridge expired / bridge failed** (Scenarios 3–4) → stays Processing with "Waiting for provider refund" until `REFUNDED` or `FAILED`.

## 11. Analytics

- Single-chain events untouched.
- New events:
  - `swap_mode=cross_chain` on quote / review / confirm
  - `route_option_selected` (tag: best_return / fastest / none, provider, rank, flow_type)
  - `route_chart_expanded`
  - `history_row_clicked`
  - outcome events with final `outcome` (`SUCCESS` / `REFUNDED` / `FAILED`) and `flow_type`

## 12. Rollout

1. Internal flag
2. 10% rollout
3. 100% rollout
4. Cross-Chain tab → redirect
5. Cross-Chain tab removed
   Guardrail metric at each step: single-chain conversion pre/post.

**Dependency on KyberCross phases**

- KyberCross **3A**: only `BRIDGE_ONLY` and `SWAP_BRIDGE` routes appear as `KyberSwap + <bridge>` rows. `BRIDGE_SWAP` / `SWAP_BRIDGE_SWAP` come from third-party providers only.
- KyberCross **3B**: destination-execution flows join the list; Refunded status and `KyberCross Fee` handling become live.
- The unified UI ships independently of 3A/3B — it consumes whatever the route list returns.

## 13. Open questions

- [ ] Show `KyberCross Fee` anywhere in the route row, or keep it fully netted into output as the proposal prefers?
- [ ] Cap the route list at 5 by default, or show all?
- [ ] History: cross-chain only, or merge single-chain tx history into the same 10-row list?
- [ ] Threshold X for Fastest (max output loss vs Recommended) — 1%? 2%?
- [ ] Which leg data do third-party providers expose for drilldown — BE to confirm per provider.
- [ ] Should the From side allow a chain different from the wallet's connected network (quote first, switch at execute)?

## Figma

The source contains an embedded Figma object. Its content could not be retrieved through the Notion connector.

## Appendix A: Reference-document context

The following summarizes the linked Product Proposal and TDD. It is additional context, not text from the Unified Swap UI specification.

### KyberCross Fee

- Applies when KyberCross owns destination-side execution: `BRIDGE_SWAP` and `SWAP_BRIDGE_SWAP`.
- The initial model does not require this execution fee for `BRIDGE_ONLY` or `SWAP_BRIDGE`.
- The proposal's preferred model is **Estimated Direct Cost + Buffer + Profit**.
- The backend calculates the fee at quote time, denominated in `dstTokenIn` on the destination chain.
- When funds reach `DstSwapReceiver`, the fee is reserved first; the remaining amount is available for destination execution.
- On `SUCCESS`, Kyber retains the full quoted fee. Unused buffer is not refunded.
- On `REFUNDED` or `FAILED`, retained fees are limited to clearly consumed unrecoverable costs; the remaining reserved fee is refunded according to the policy.
- Expired states and recovery in progress do not imply final fee settlement.

### Route State, Fund State, and Outcome

| Concept     | Meaning                                                | Examples                                                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Route State | Operational lifecycle of the route.                    | `BRIDGE_PENDING`, `SWAP_PENDING`, `BRIDGE_EXPIRED`.                           |
| Fund State  | Where the principal sits or how it has been delivered. | `IN_BRIDGE`, `IN_DST_ESCROW`, `SETTLED_OUT`, `SETTLED_REFUND`, `UNRECOVERED`. |
| Outcome     | Final user-facing result.                              | `SUCCESS`, `REFUNDED`, `FAILED`; nullable until terminal.                     |

A bridge reporting `BRIDGE_FAILED` does not by itself establish the route's final outcome as `FAILED`: provider-owned refund handling may still complete.

The proposal uses `SWAP_REFUND_PENDING`, while the TDD and UI specification use `REFUND_PENDING`. Confirm the actual API enums when integrating.

### Client Fee

The proposal also defines a separate integrator `Client Fee`:

- Quote requests may include `clientFeeRecipient` and `clientFeeBps`.
- The quoted output is net of the client fee when applicable.
- The client fee is earned only after `SUCCESS`, not on refund or failure.
- The Unified Swap UI specification does not define a separate display for this fee. Do not assume Client Fee and Platform Fee are interchangeable.

### Refunded status and rollout phases

The UI specification says Refunded status and KyberCross Fee handling become live in 3B. The TDD already includes normalized status for bridge-managed flows in 3A, and the UI specification maps third-party `DONE + PARTIAL` to Refunded.

This needs to be read in the context of destination execution becoming available in 3B, rather than assuming no route can be Refunded before 3B. Confirm the intended scope during implementation.

## Appendix B: Editorial notes and implementation questions

These are observations from reading the specification, **not confirmed product decisions or API contracts**.

### Source inconsistencies and missing details

| Topic                     | Source wording                                                                                                                                                                   | Clarification needed                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Recommended / Best Return | Routing explicitly removes the Recommended concept. Refresh says to fall back to Recommended; Edge cases says Best Return. The Fastest open question also refers to Recommended. | Align the terminology. Both original formulations are preserved above.                                           |
| Default route count       | Routing specifies up to 5 routes with Show more.                                                                                                                                 | Open questions still asks whether to show 5 or all.                                                              |
| History scope             | Phase 1 is cross-chain only.                                                                                                                                                     | Open questions still considers merging single-chain history.                                                     |
| KyberCross Fee display    | No separate route-row or fee-panel line; exposed on the destination-swap node.                                                                                                   | Route-row display remains an open question; the You receive tooltip needs Victor/BD confirmation.                |
| Gas Drop                  | The Layout section contains only an empty Gas Drop bullet.                                                                                                                       | Detailed behavior and design are unspecified. Destination gas shortfall is covered separately in Edge cases.     |
| Reliability               | Low-reliability providers are demoted and marked with a warning.                                                                                                                 | Threshold, N-day window, and reliability data source are unspecified.                                            |
| First row / Best Return   | Both the top row and Best Return are described as default-selected.                                                                                                              | Clarify the default if the highest-output route is demoted because of reliability.                               |
| Figma                     | An embedded design is linked in the source.                                                                                                                                      | This snapshot has not verified visual layout, spacing, responsive behavior, or interactions against that design. |

### Integration questions

- **Older Processing positions:** Fetching only the latest `limit=10` records may omit older Processing positions. Confirm how to satisfy pinning regardless of age, and whether the 10-row limit includes all pinned Processing positions.
- **Route identity:** Preserving selection across refreshes requires a stable way to match routes. The specification does not define that identity.
- **Fees and ranking:** Confirm exactly which costs are included in net output, particularly network gas paid outside the output amount. A KyberCross Fee already netted into output must not be deducted twice.
- **Tag analytics:** One route can carry both Best Return and Fastest, but the analytics `tag` is described as a single value. Confirm how to record both tags.
- **Chart payload:** Every row is required to carry `flow_type` and `steps`, while third-party leg-data availability still needs provider-by-provider confirmation.
- **API contract:** Endpoints in the specification section above follow the UI source. Some TDD sequence diagrams differ from its Public APIs section. Verify the actual HTTP API contract before integration.
- **Outcome mapping:** Account for bridge-managed routes and third-party refunds, independently of KyberCross destination-execution availability.
- **Implementation assessment:** Validate both cross-chain requirements and the single-chain behavior that must remain unchanged. This document does not assess the current code against those requirements.

## Appendix C: Requirement traceability checklist

This checklist breaks down the source into individual items for future code or QA comparison. It is derived from the specification, not an implementation report. An unchecked box means **not assessed in this document**, not necessarily missing from the application. Items affected by open questions remain subject to clarification.

### C.1 Mode selection and single-chain preservation — §§1–2, 9

- [ ] There is one Swap entry point for both single-chain and cross-chain.
- [ ] Equal source and destination chains use the existing single-chain path.
- [ ] Different source and destination chains activate cross-chain mode in the same shell.
- [ ] Single-chain uses its existing quote API and makes no additional calls for this feature.
- [ ] Single-chain route display and chart behavior remain unchanged.
- [ ] Single-chain slippage defaults remain unchanged.
- [ ] Single-chain Smart Settlement remains unchanged.
- [ ] Single-chain event names remain unchanged, with no new single-chain events.
- [ ] Cross-chain routing-option cards and Bridge Fee lines do not appear in single-chain mode.
- [ ] Single-chain continues to default to Price Chart.
- [ ] Limit Order remains single-chain, with no destination-chain picker.
- [ ] Cross-chain mode is behind a feature flag.
- [ ] Single-chain hot paths do not acquire feature-flag checks.

### C.2 Layout and token selection — §3

- [ ] From retains its wallet-bound chain badge.
- [ ] To supports destination-chain selection by extending the existing selector's chain dropdown.
- [ ] The chain badge next to To appears only when its chain differs from From.
- [ ] Token selection combines chain filtering with name search.
- [ ] Token selection combines chain filtering with symbol search.
- [ ] Token selection combines chain filtering with address search.
- [ ] Cross-chain content below the swap card follows Routing options → Route chart → Fee breakdown → CTA.
- [ ] The right panel exposes Price Chart and History tabs.
- [ ] Cross-chain defaults to History while keeping Price Chart accessible.
- [ ] During the redirect stage, the old Cross-Chain tab opens Swap with the last-used destination chain preselected.
- [ ] Gas Drop details are confirmed separately; the empty source bullet is not treated as a complete requirement.
- [ ] Allowing From to differ from the connected wallet network is treated as an open question.

### C.3 Quote collection and route rows — §4

- [ ] Selecting token out and setting amount in triggers cross-chain quote requests.
- [ ] Provider coverage follows the specified list and availability: LI.FI, Relay, Across, Bungee, Symbiosis, and KyberCross when live.
- [ ] KyberCross quotes and existing meta-aggregator quotes are merged into one list.
- [ ] Loading, no-route, and quote-error states are distinct.
- [ ] Quote errors offer Retry.
- [ ] The list is titled “Choose your route”.
- [ ] All valid routes are available through the ranked list rather than a fixed set of 2–3 cards.
- [ ] The specified five-route initial view and Show more behavior are checked against the unresolved route-count decision.
- [ ] Each row displays estimated output token amount in bold and its USD value.
- [ ] Each row displays provider information, estimated time, and gas cost in USD.
- [ ] KyberCross rows identify the swap engine and bridge together.
- [ ] Third-party rows identify the provider.
- [ ] Third-party fee rows use the label “Protocol fee”.
- [ ] KyberCross rows omit the separate KyberCross Fee line according to the preferred UX, subject to the open question.
- [ ] Each row carries the flow type and ordered steps needed by the route chart.

### C.4 Ranking, tags, and refresh — §4, §10

- [ ] Best Return identifies the highest net output after fees.
- [ ] Best Return is default-selected, with the top-row/reliability interaction clarified.
- [ ] Fastest is selected only from routes within the agreed X% output threshold.
- [ ] A route can display both Best Return and Fastest.
- [ ] There is no separate Recommended tag or recommendation category.
- [ ] Routes sort by net output descending, with estimated time breaking ties.
- [ ] Providers below the agreed reliability threshold are demoted and carry a warning icon.
- [ ] Low-reliability routes remain visible.
- [ ] The quote refresh timer follows Swap.
- [ ] A selected route remains selected across refreshes while it is still available.
- [ ] When the route disappears, fallback and toast behavior follow the clarified Best Return/Recommended wording.

### C.5 Route chart — §5

- [ ] The chart renders a horizontal sequence from input token/amount to output token/amount.
- [ ] Intermediate edges show token and amount.
- [ ] `BRIDGE_ONLY` renders only the bridge step.
- [ ] `SWAP_BRIDGE` renders source swap and bridge.
- [ ] `BRIDGE_SWAP` renders bridge and destination swap.
- [ ] `SWAP_BRIDGE_SWAP` renders all three steps.
- [ ] Step rendering uses each step's provider, token in, and token out.
- [ ] No missing intermediate step is fabricated.
- [ ] Non-zero node fees display in USD, with bps on hover.
- [ ] Nodes without fees do not display a zero fee.
- [ ] Bridge nodes use the bridge Protocol fee.
- [ ] An applicable KyberCross Fee appears once, on the destination-swap node.
- [ ] Kyber Aggregator swap legs expand the existing single-chain route chart inline.
- [ ] Third-party swap legs show the router name.
- [ ] Third-party legs are not clickable without provider route data.
- [ ] The chart starts collapsed below Routing options.
- [ ] The same chart is reused in Review and History detail.
- [ ] Review displays quoted amounts.
- [ ] History displays executed amounts when available and labels pending or unavailable data.

### C.6 History — §6, §10

- [ ] History presents the latest 10 positions, newest first.
- [ ] Processing positions are pinned above other entries regardless of age, with retrieval and row-limit semantics clarified.
- [ ] View all opens the full history page.
- [ ] Each row displays source and destination tokens/chains.
- [ ] Each row displays amount in, amount out, status, timestamp, and provider.
- [ ] KyberCross history is merged with existing meta-aggregator history.
- [ ] The merged list sorts by `created_at` descending, with Processing pinned.
- [ ] Phase 1 uses cross-chain-only history, subject to the explicit open question.
- [ ] Non-terminal route states display Processing.
- [ ] Processing sub-labels use `next_expected_action`.
- [ ] `SUCCESS`, `REFUNDED`, and `FAILED` map to their corresponding final UI statuses.
- [ ] Receiving `dstTokenIn` instead of the requested `dstTokenOut` maps to Refunded.
- [ ] Third-party `DONE + PARTIAL` maps to Refunded.
- [ ] A Refunded row shows the token actually received.
- [ ] A row click opens a detail drawer.
- [ ] The drawer contains the route chart, executed amounts, and transaction hashes per leg.
- [ ] The drawer compares paid fees with quoted fees and includes refunded KyberCross Fee amounts when applicable.
- [ ] Eligible destination-chain refunds offer “Swap to intended token”.

### C.7 Price Chart — §7

- [ ] The existing Swap chart component is reused.
- [ ] The pair is token in / token out.
- [ ] Sparse cross-chain settlement data triggers a conditional chart warning.
- [ ] The sparse-data fallback displays the USD price of token out.
- [ ] The warning is not a blanket disclaimer.
- [ ] In cross-chain mode, the chart is not rendered until its tab is clicked.
- [ ] The settlement-price fetch is avoided before that click.

### C.8 Fees, slippage, recipient, and Review — §8

- [ ] The panel retains You receive, Max Slippage, Est. Processing Time, Price Impact, Platform Fee, and Network Fees.
- [ ] A separate Bridge Fee line is shown when the bridge protocol fee is non-zero.
- [ ] KyberCross Fee is reflected in You receive.
- [ ] KyberCross Fee does not acquire a separate fee-panel line under the preferred UX.
- [ ] The route chart and Review expose KyberCross Fee at the destination-swap node.
- [ ] The optional You receive tooltip follows the pending Victor/BD decision.
- [ ] Cross-chain slippage settings and defaults are stored separately from single-chain.
- [ ] Send to other wallet is available only in cross-chain.
- [ ] The default recipient is a compatible connected address.
- [ ] Use My Wallet restores that address.
- [ ] The CTA reads “Review Cross-Chain Swap”.
- [ ] Review shows both the selected routing option and route chart before signing.

### C.9 Edge cases — §10

- [ ] Same-token swaps across different chains remain valid bridge-only routes and render a chart.
- [ ] Unsupported destination tokens result in No route with a bridge-token suggestion.
- [ ] A wrong wallet network at execution prompts a network switch and retains the quote.
- [ ] Destination gas shortfall exposes supported provider top-up, or warns before Review when unsupported.
- [ ] Changing source chain mid-quote triggers a new quote.
- [ ] If the changed source chain equals destination, the flow returns to single-chain.
- [ ] Expired quotes are refreshed automatically before signing.
- [ ] A refreshed output change beyond slippage requires confirmation.
- [ ] An unexecutable destination swap progresses through Processing to Refunded, with the actual fallback token and fee refund represented.
- [ ] Bridge expiry or failure stays Processing with “Waiting for provider refund” until a final outcome is available.

### C.10 Analytics — §11

- [ ] Quote, review, and confirm carry `swap_mode=cross_chain` in cross-chain mode.
- [ ] Route selection records `route_option_selected` with tag, provider, rank, and flow type.
- [ ] The analytics representation of a route with both tags is clarified.
- [ ] Chart expansion records `route_chart_expanded`.
- [ ] Clicking a history row records `history_row_clicked`.
- [ ] Final outcome events include `outcome` and `flow_type`.
- [ ] Outcome event names are confirmed separately because the source does not specify them.

### C.11 Rollout — §12

- [ ] Rollout follows internal flag → 10% → 100% → Cross-Chain tab redirect → tab removal.
- [ ] Single-chain conversion is compared before and after each stage.
- [ ] In 3A, KyberCross rows are limited to `BRIDGE_ONLY` and `SWAP_BRIDGE`.
- [ ] In 3A, third-party providers may still supply destination-swap flows.
- [ ] In 3B, KyberCross destination-execution flows and their fee/refund handling join the UI.
- [ ] Unified UI availability is not coupled to waiting for all 3A/3B flow types.

## Appendix D: Data reference for comparison

This table records the data mentioned by the UI specification. It is **not a complete API schema** and does not assign types or response nesting that the source does not provide.

### D.1 Endpoints

| Endpoint from UI spec                                        | Purpose in the UI                                                                     | Source section |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- | -------------- |
| `GET /api/v1/quote`                                          | Obtain KyberCross best route and alternatives for the routing list.                   | §4             |
| `GET /api/v1/quotes?address=…&limit=10`                      | Obtain wallet-associated KyberCross history for merging with meta-aggregator history. | §6             |
| Existing meta-aggregator endpoints, not named in the UI spec | Obtain third-party quotes and history.                                                | §§4, 6         |
| Existing single-chain quote API, not named in the UI spec    | Preserve existing single-chain behavior with zero new calls.                          | §2             |

### D.2 Named fields and enums

| Field or value                                                                                                           | Consumer / meaning                                                                          | Source section       |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | -------------------- |
| `srcChain`, `dstChain`                                                                                                   | Decide single-chain versus cross-chain mode.                                                | §2                   |
| `flow_type`                                                                                                              | Route shape, chart rendering, route-selection analytics, outcome analytics.                 | §§4–5, 11            |
| `steps`                                                                                                                  | Ordered route legs rendered by the chart.                                                   | §§4–5                |
| `source_swap`, `bridge`, `destination_swap`                                                                              | Step kinds present in a route.                                                              | §5                   |
| `provider`                                                                                                               | Provider identity on route steps; also specified in analytics.                              | §§5, 11              |
| `token_in`, `token_out`                                                                                                  | Input/output token for a route step.                                                        | §5                   |
| `next_expected_action`                                                                                                   | Processing status sub-label.                                                                | §6                   |
| `source_tx_hash`, `destination_tx_hash`                                                                                  | Transaction links in History detail.                                                        | §6                   |
| `created_at`                                                                                                             | History sort order.                                                                         | §6                   |
| `expires_at`                                                                                                             | Quote expiry check before signing.                                                          | §10                  |
| `dstTokenIn`                                                                                                             | Fallback token received when destination recovery completes.                                | §§6, 10              |
| `dstTokenOut`                                                                                                            | Requested destination output token.                                                         | §6                   |
| `SUCCESS`, `REFUNDED`, `FAILED`                                                                                          | Final user-facing outcomes.                                                                 | Terminology, §§6, 11 |
| `SOURCE_SUBMITTED`, `BRIDGE_PENDING`, `DST_RECEIVED`, `SWAP_PENDING`, `REFUND_PENDING`, `BRIDGE_EXPIRED`, `SWAP_EXPIRED` | Examples of non-terminal states displayed as Processing. The source list is not exhaustive. | §6                   |
| `DONE` with `PARTIAL` substatus                                                                                          | Third-party result mapped to Refunded.                                                      | §6                   |
| `swap_mode=cross_chain`                                                                                                  | Mode recorded on quote / review / confirm.                                                  | §11                  |
| `tag`, `provider`, `rank`, `flow_type`                                                                                   | Route-selection analytics attributes.                                                       | §11                  |
| `outcome`, `flow_type`                                                                                                   | Final outcome analytics attributes.                                                         | §11                  |

### D.3 Display data without a specified API field name

The source requires these values but does not give a complete mapping to response fields:

- Estimated token output and its USD value.
- Estimated processing time.
- Gas cost in USD.
- Protocol fee in USD.
- Net output used for ranking.
- Provider success rate, reliability threshold, and lookback window.
- Intermediate token amounts on chart edges.
- Node fees in USD and bps.
- Quoted versus executed amounts.
- Actual token received after refund or recovery.
- Paid, quoted, and refunded fees.
- Compatible connected recipient address.
- Provider gas top-up support.
- Cross-chain settlement-price availability.

These mappings need confirmation against the actual provider/API payloads before using this document as an implementation contract.
