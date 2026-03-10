# PoolDetail Add Liquidity Shadowing

This document tracks which add-liquidity behaviors from `packages/liquidity-widgets` have already been brought into `PoolDetail`, and which ones are still intentionally different or incomplete.

## Shadowing Checklist

### Done

✅ Compose page-local add-liquidity state from token input, price range, slippage, route, and APR hooks
✅ Fetch pool data and token metadata from app services instead of component-local fetches
✅ Persist slippage with the same storage key and the same default heuristics
✅ Initialize price range from incoming ticks and derive min/max prices from ticks
✅ Fetch zap routes with guarded inputs and 10s polling
✅ Build zap calldata before confirmation when the user opens Preview
✅ Submit transactions from the prebuilt route payload
✅ Request network switching instead of failing immediately on wrong chain
✅ Run base validation before Preview: missing amount, invalid range, invalid decimals, insufficient balance
✅ Show loading state while route fetch or route build is in progress
✅ Derive review warnings from route data: slippage mismatch, unused amount, zap impact, full range, out-of-range, and price deviation
✅ Block very high zap impact unless Degen Mode is enabled
✅ Show honeypot and Fee-On-Transfer warnings for pool tokens
✅ Support ERC20 approval flow before preview
✅ Support NFT permit flow when the route exposes a permit router
✅ Support single-position NFT approval flow when permit is unavailable
✅ Keep token selection and existing-position migration tracking behavior
✅ Keep APR estimation query and APR tooltip behavior on the page
✅ Reuse the review modal for waiting, processing, success, failed, and cancelled transaction states

### TODO

🟨 NFT approval-for-all flow
🟨 Full widget-style approval type selector UI (`approve this position` vs `approve for all`)

### Will Not Do

❌ Re-add any `Estimated` or `Zap Summary` UI blocks
Reason: intentionally excluded from the current PoolDetail design
❌ Full widget self-contained layout
Reason: PoolDetail uses the page-specific two-column layout instead
❌ Widget store architecture parity
Reason: PoolDetail uses page hooks + RTK Query + app transaction tracking instead of widget Zustand stores

## Main Mapping

| Widget source | PoolDetail target | Result |
| --- | --- | --- |
| `src/hooks/useZapState.tsx` | `hooks/add-liquidity/useAddLiquidityState.ts` | Done |
| `src/hooks/useSlippageManager.ts` | `hooks/add-liquidity/useAddLiquiditySlippage.ts` | Done |
| `src/hooks/useTickPrice.ts` | `hooks/add-liquidity/useAddLiquidityPriceRange.ts` | Done |
| `src/hooks/useZapRoute.ts` | `services/zapInService.ts` and `hooks/add-liquidity/useAddLiquidityRoute.ts` | Done |
| `src/hooks/useApproval.ts` | `hooks/add-liquidity/useAddLiquidityApproval.ts` | Partial |
| `src/components/Action/index.tsx` | `components/add-liquidity/AddLiquidityWidget.tsx` | Done |
| `src/components/LeftWarning.tsx` | `services/zapInService.ts` and `components/add-liquidity/AddLiquidityWidget.tsx` | Done |
| `src/components/Warning.tsx` and `src/components/Preview/Warning.tsx` | `hooks/add-liquidity/useAddLiquidityReviewData.ts`, `components/add-liquidity/AddLiquidityRouteInsights.tsx`, `components/add-liquidity/AddLiquidityReviewModal.tsx` | Done |
| `src/components/PositionApr.tsx` and `src/hooks/useEstimatedPositionApr.ts` | `components/PositionApr.tsx` and `hooks/position-apr/useEstimatedPositionApr.ts` | Done |
| `src/components/TokenInput/index.tsx` | `components/add-liquidity/AddLiquidityTokenInput.tsx` | Done |
| `src/components/Preview/index.tsx` | `services/zapInService.ts`, `components/add-liquidity/AddLiquidityWidget.tsx`, `components/add-liquidity/AddLiquidityReviewModal.tsx` | Done |

## Status Legend

`✅ Done`: implemented on PoolDetail
`Partial`: core flow is implemented, but some widget branches are still TODO
`❌ Will not do`: intentionally excluded because the PoolDetail design or architecture is different

## Inline Comments

The main implementation files contain short comments that explain what each block is responsible for without referencing the widget package directly.
