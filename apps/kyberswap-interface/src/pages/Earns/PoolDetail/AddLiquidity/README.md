# Add Liquidity Shadow Notes

## Goal

The pool detail add-liquidity page does not embed `@kyberswap/liquidity-widgets` directly, but it shadows part of the widget business logic in order to:

- Fit the app routing, tracking, wallet flow, and transaction stack
- Use a page-specific UI for pool detail
- Avoid pulling the full widget store/runtime into the page

This README covers:

- Which hooks shadow logic from `packages/liquidity-widgets`
- What is already shadowed
- Which behaviors intentionally differ from the widget

## ✅ Done

- Standard pool-detail add-liquidity flow for regular zap-in deposits.
- Token input setup, validation, and wallet-based defaults.
- UniV3 tick and price-range handling.
- Slippage management, route fetching, and route gating.
- ERC20 approval and action-state handling.
- Safety and review surfaces, including zap-impact protection, security warnings, route preview, review data, and the page-owned review modal flow.
- Review-modal-owned submit flow, including transaction submission, status dialog states, and success navigation.

## 🟡 Intentional Differences from the Widget

- The page keeps its own page-specific preview and review modal instead of embedding the widget preview/runtime directly.
- Preview first builds zap transaction data on the CTA, then opens the page-owned review UI. `index.tsx` only prepares route/build data and opens the review surface; `components/ReviewModal/*` owns submit, transaction status, and post-success actions.
- Existing-position support is intentionally excluded, including `positionId`, owner checks, CTA branching, and related UI wording.
- NFT-related flows are intentionally excluded, including permit and approval paths.
- Standalone-widget initialization patterns and store/runtime architecture are not reused here.
- Syncing with the widget is a manual maintenance task. There is no automated drift detection layer.

If existing-position support is needed later, it should be designed clearly from scratch. Old branches previously tied to `positionId` should not be revived incrementally.

## Rules for Syncing with the Widget

When widget logic changes, audit the following areas:

1. If the widget changes token-input initialization, token selection defaults, or amount prefilling:
   Update `hooks/useInitialTokensIn.ts`, `components/AddLiquidityTokenInput.tsx`, and page entry wiring in `index.tsx` if needed.

2. If the widget changes validation or route gating:
   Update `utils.ts`, `hooks/useZapState.ts`, and `hooks/useZapActions.ts`.

3. If the widget changes slippage heuristics:
   Update `hooks/useSlippageManager.ts` and all places that display suggested slippage.

4. If the widget changes UniV3 tick, price-range, or price inversion behavior:
   Update `hooks/useTickPrice.ts` and `components/PriceSection/*`, then recheck related review warnings.

5. If the widget changes route-derived estimate, warning, preview, APR, or submit/review flow:
   Update `hooks/useReviewData.ts`, `hooks/useFeedback.ts`, `components/AddLiquidityRoutePreview.tsx`, `components/EstimatedPositionApr.tsx`, `components/ReviewModal/*`, and the review-modal wiring in `index.tsx` as needed.

6. If the widget changes security-warning logic such as honeypot or FOT messaging:
   Update `hooks/useFeedback.ts` and shared helpers in `utils.ts`.

7. If the widget changes approval flow:
   Only mirror the ERC20 part as long as the page still does not support existing positions.

8. If the widget changes `positionId` or NFT-related logic:
   Ignore it unless the page officially reopens the existing-position scope.
