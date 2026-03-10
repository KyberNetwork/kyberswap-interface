# PoolDetail AddLiquidity

This document tracks which add-liquidity behaviors from `packages/liquidity-widgets` have already been brought into `PoolDetail`, and which ones are still intentionally different or incomplete.

This checklist was re-verified from code in both `packages/liquidity-widgets/src` and `apps/kyberswap-interface/src/pages/Earns/PoolDetail/AddLiquidity`, then rewritten in the original format.

## Structure

The add-liquidity implementation now lives under `PoolDetail/AddLiquidity`.

`components/`
UI used only by the add-liquidity flow, including token input, review modal, widget shell, APR banner, and price-range controls.

`hooks/`
State orchestration, route fetching, validation, approvals, review-data derivation, and submit/build transaction flow.

`hooks/approval/`
Split approval helpers for ERC20 approvals, NFT approvals, and shared approval types/utilities.

`designs/`
Add-liquidity-specific reference images only.

## Shadowing Checklist

### Done

✅ Compose page-local add-liquidity state from token input, price range, slippage, route, and APR hooks
✅ Fetch pool data and token metadata from app services instead of component-local fetches
✅ Derive token balances and token prices for selected inputs
✅ Persist slippage with the same storage key and the same default heuristics
✅ Initialize price range from incoming ticks and derive min/max prices from ticks
✅ Keep default quote-direction / revert-price behavior for pool display
✅ Fetch zap routes with guarded inputs and 10s polling
✅ Build zap calldata before confirmation when the user opens Preview
✅ Submit transactions from the prebuilt route payload
✅ Request network switching instead of failing immediately on wrong chain
✅ Run base validation before Preview: missing token, missing amount, invalid range, invalid decimals, insufficient balance
✅ Show loading state while route fetch or route build is in progress
✅ Derive review warnings from route data: slippage mismatch, unused amount, zap impact, full range, out-of-range, and price deviation
✅ Block very high zap impact unless Degen Mode is enabled
✅ Show honeypot and Fee-On-Transfer warnings for pool tokens
✅ Support ERC20 approval flow before preview
✅ Support NFT permit flow when the route exposes a permit router
✅ Support single-position NFT approval flow when permit is unavailable
✅ Keep APR estimation query and APR tooltip behavior on the page
✅ Reuse the review modal for waiting, processing, success, failed, and cancelled transaction states

### TODO

🟨 Existing-position migration wiring
Reason: `AddLiquidityTokenInput.tsx` supports `onLiquiditySourceSelect`, but `AddLiquidityWidgetView.tsx` does not pass it yet, so the flow is not active on PoolDetail
🟨 NFT approval-for-all flow
Reason: PoolDetail only supports permit NFT or single-position NFT approval right now
🟨 Full widget-style approval type selector UI (`approve this position` vs `approve for all`)
Reason: no equivalent UI is wired on the page
🟨 Suggested-slippage recovery action after a slippage-related failure
Reason: the review/status modal shows the error state but does not expose the widget's recovery CTA
🟨 Smart Exit follow-up action after successful add liquidity
Reason: PoolDetail stops at close/view-position behavior

### Will Not Do

❌ Re-add any dedicated `Estimated` or `Zap Summary` UI blocks
Reason: intentionally excluded from the current PoolDetail design, even though the underlying review data is still computed
❌ Full widget self-contained layout
Reason: PoolDetail uses the page-specific two-column layout instead
❌ Widget store architecture parity
Reason: PoolDetail uses page hooks + RTK Query + app transaction tracking instead of widget Zustand stores

## Main Mapping

| Widget source | PoolDetail target | Result |
| --- | --- | --- |
| `src/hooks/useZapState.tsx` | `AddLiquidity/hooks/useAddLiquidityState.ts` | Done |
| `src/hooks/useSlippageManager.ts` | `AddLiquidity/hooks/useAddLiquiditySlippage.ts` | Done |
| `src/hooks/useTickPrice.ts` | `AddLiquidity/hooks/useAddLiquidityPriceRange.ts` | Done |
| `src/hooks/useZapRoute.ts` | `services/zapInService.ts` and `AddLiquidity/hooks/useAddLiquidityRoute.ts` | Done |
| `src/hooks/useApproval.ts` | `AddLiquidity/hooks/useAddLiquidityApproval.ts` | Partial |
| `src/components/Action/index.tsx` | `AddLiquidity/components/AddLiquidityWidget.tsx` and `AddLiquidity/hooks/useAddLiquidityWidgetActions.ts` | Partial |
| `src/components/LeftWarning.tsx` | `AddLiquidity/hooks/useAddLiquiditySecurityWarnings.ts` and `AddLiquidity/components/AddLiquidityWidgetView.tsx` | Done |
| `src/components/Warning.tsx` and `src/components/Preview/Warning.tsx` | `AddLiquidity/hooks/useAddLiquidityReviewData.ts`, `AddLiquidity/hooks/reviewData.ts`, `AddLiquidity/components/AddLiquidityRouteInsights.tsx`, `AddLiquidity/components/AddLiquidityReviewModal.tsx` | Done |
| `src/components/PositionApr.tsx` and `src/hooks/useEstimatedPositionApr.ts` | `AddLiquidity/components/PositionApr.tsx` and `AddLiquidity/hooks/useAddLiquidityPositionApr.ts` | Done |
| `src/components/TokenInput/index.tsx` | `AddLiquidity/components/AddLiquidityTokenInput.tsx` | Partial |
| `src/components/PriceRange/index.tsx` | `AddLiquidity/components/price-range/PriceSection.tsx` and related price-range components | Done |
| `src/components/Preview/index.tsx` | `services/zapInService.ts`, `AddLiquidity/hooks/useAddLiquidityWidgetActions.ts`, `AddLiquidity/components/AddLiquidityReviewModal.tsx` | Partial |
| `src/components/Estimated/index.tsx` and `src/components/Content/ZapSummary.tsx` | no direct page equivalent | ❌ Will not do |

## Status Legend

`✅ Done`: implemented on PoolDetail
`Partial`: core flow is implemented, but some widget branches are still TODO or only partially wired
`❌ Will not do`: intentionally excluded because the PoolDetail design or architecture is different

## Inline Comments

The main implementation files contain short comments that explain what each block is responsible for without referencing the widget package directly.
