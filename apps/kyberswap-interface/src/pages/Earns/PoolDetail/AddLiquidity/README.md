# Add Liquidity Shadow Notes

## Goal

The pool detail add-liquidity page does not embed `@kyberswap/liquidity-widgets` directly, but it shadows part of the widget business logic in order to:

- Fit the app routing, tracking, wallet flow, and transaction stack
- Use a page-specific UI for pool detail
- Avoid pulling the full widget store/runtime into the page

This README covers:

- What user-facing behavior is already shadowed from `packages/liquidity-widgets`
- Which behavior intentionally differs from the widget
- Which behavior is still not at parity yet

## ✅ Done

- Standard pool-detail add-liquidity flow for regular zap-in deposits is working end to end.
- Token input defaults, validation, and wallet-aware amount entry follow the widget flow for the regular deposit case.
- UniV3 range behavior is shadowed for price-range selection, manual range editing, and related validation.
- Slippage, zap-route fetching, and route gating are shadowed for the regular add-liquidity path.
- ERC20 approval flow and main CTA state transitions are shadowed for token approval before add liquidity.
- Review behavior is page-owned, but the user still gets the same core flow: preview route, inspect warnings, submit, track pending state, and navigate on success.
- Safety surfaces are present for zap impact, security warnings, and route warnings.
- Basic page-level tracking for token input, range changes, and slippage changes is wired.

## 🟡 Intentional Differences from the Widget

- The page uses its own layout and its own preview/review modal, so the interaction shell is not identical even when the core add-liquidity behavior is the same.
- Preview behavior is page-driven: clicking the CTA builds zap transaction data first, then opens the page review modal.
- Existing-position behavior is out of scope. The page only supports the standard deposit flow and does not branch on `positionId`.
- NFT-related behavior is out of scope. Permit and NFT approval paths are not shadowed here.
- Widget-local transaction time limit behavior is not shadowed. The page uses the app-level transaction deadline instead of a page-local TTL control.
- Slippage behavior is surfaced directly in the page form instead of being hidden behind the widget settings panel.
- The page shadows the regular zap-route flow, but widget-specific route options such as affiliate fee and aggregator source filters are not treated as guaranteed parity.

## 🔴 Not Yet at Parity

- Preview/review/submit tracking is still incomplete compared with the widget. Missing events currently include preview-clicked, add-submitted, add-completed, add-failed, and add-cancelled.

If existing-position support is needed later, it should be designed clearly from scratch. Old branches previously tied to `positionId` should not be revived incrementally.

## Rules for Syncing with the Widget

When widget logic changes, recheck behavior in this order:

1. Input and validation:
   Token defaults, amount entry, route gating, and UniV3 range behavior should still match the regular deposit flow.

2. Route and review:
   Route warnings, preview data, slippage handling, and submit flow should still produce the same user-facing outcome for the regular add-liquidity path.

3. Scope boundaries:
   Ignore `positionId`, NFT, and permit-related widget changes unless the pool-detail page explicitly reopens that scope.

4. Known parity gaps:
   Do not assume tracking or widget-specific fee/aggregator route options stay in sync automatically. Review those explicitly when widget behavior changes.
