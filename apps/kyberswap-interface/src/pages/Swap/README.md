# Swap pages

This module composes Unified Swap and Limit Order. Unified Swap uses the
single-chain form for same-chain EVM pairs and the cross-chain form for
different-chain or non-EVM pairs.

## Structure

- `SwapPage.tsx`: URL pair state, shared providers and History visibility.
- `SwapPageContent.tsx`: forms, settings and right-panel composition.
- `LimitPage.tsx`: Limit Order composition.
- `layout/`: page shell, tabs and responsive layout.
- `components/`: chart, routes and History presentation.
- `hooks/`: pair selection, navigation and prefetching.
- `utils/`: pure route and swap-link helpers.

Form behavior lives in [`components/SwapForm`](../../components/SwapForm). Keep
page composition and navigation here; keep quote, review, approval and execution
ownership in the form providers.

## Ownership

- `useSwapFormPair` owns URL pair selection and reversal.
- `SingleChainSwapFormProvider` shares single-chain quote/review state between
  the form and right panel.
- `CrossChainSwapProvider` owns cross-chain stream quotes, selection, refresh and
  reviewed-quote state.
- `useSwapReviewSession` owns single-chain build, review, submit, error and
  dismissal lifecycle.
- `TransactionHistoryUpdater` owns cross-chain status polling and KyberCross
  terminal enrichment. `TransactionHistoryList` only renders persisted records,
  filtering and pagination.

Single-chain URLs use `/swap/{network}/{pair}`. Cross-chain URLs use
`/swap?from=…&to=…&tokenIn=…&tokenOut=…`.

History currently contains cross-chain transactions only. Transaction details and
single-chain History remain separate product work.

## Working in this module

- Keep form modules independent of `pages/Swap`.
- Preserve lazy provider boundaries and the pending-form skeleton.
- Check shared callers when changing forms or layout: PartnerSwap, Limit Order
  and the legacy Cross-Chain page reuse this code.
- Keep status acquisition in `TransactionHistoryUpdater`, outside History list
  rendering and visibility changes.

From the repository root:

```sh
pnpm --filter @kyberswap/interface exec vitest run src/pages/Swap src/components/SwapForm
pnpm --filter @kyberswap/interface exec tsc --noEmit
```

For UI or transaction changes, also verify the affected flow in a browser and
with the relevant provider or wallet.
