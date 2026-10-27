# Unified Swap

Same-chain EVM and cross-chain swaps (EVM, Solana, Bitcoin and NEAR), with shared
pair selection, settings, review, charts and routes. This folder also hosts Limit Order.

## Entry points

| Page             | URL                                      |
| ---------------- | ---------------------------------------- |
| Same-chain swap  | `/swap/{network}/{pair}`                 |
| Cross-chain swap | `/swap?from=…&to=…&tokenIn=…&tokenOut=…` |
| Limit Order      | `/limit/{network}/{pair}`                |
| Embedded swap    | `/partner-swap` or `/user-swap/{tipsId}` |

`src/pages/Swap/SwapRoute.tsx` normalizes public URLs. `src/pages/Swap/SwapPage.tsx`
selects the quote provider; `src/pages/Swap/SwapPageContent.tsx` renders the form
and right panel. `src/pages/Swap/LimitPage.tsx` shares the page shell in `src/pages/Swap/layout`.

## State and operation owners

Source paths use `src/...` relative to `apps/kyberswap-interface`.

| Owner                                                                                                    | Responsibility                                                                       |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/pages/Swap/hooks/useSwapFormPair.ts`                                                                | Token selection, reversal and one URL update for both sides                          |
| `src/pages/Swap/hooks/useTradeController.ts`                                                             | Tabs, settings navigation and URL actions                                            |
| `src/components/SwapForm/SingleChain`                                                                    | Shared quote, recipient, wrap and review state for form and panel                    |
| `src/components/SwapForm/hooks/useGetRoute.ts` / `src/components/SwapForm/hooks/useSwapReviewSession.ts` | Query refresh and cancellation-safe build/review/submit lifecycle                    |
| `src/components/SwapForm/CrossChain`                                                                     | Pair metadata, recipients, aggregator requests, route selection and review snapshots |
| `src/pages/Swap/crossChain/adapters` / `src/pages/Swap/crossChain/quote`                                 | Provider payloads, quote normalization and execution contracts                       |
| `src/pages/Swap/crossChain/hooks`                                                                        | Approval, wallet execution and local transaction tracking                            |
| `src/pages/Swap/crossChain/transactions`                                                                 | Backend reconciliation, merged history and sender-scoped pagination                  |

`src/pages/Swap/components/TransactionHistoryUpdater.tsx` runs independently
of History visibility. Broadcast transactions are persisted before confirmation;
backend reconciliation continues after review closes. History is cross-chain-only;
same-chain transactions remain in `src/state/transactions`.

Keep related logic together, separate distinct steps with blank lines, and preserve
hook order, dependencies and cleanup when reorganizing code.

## Embedded pages and KyberCross

Partner/User Swap reuse `SwapPage`; their wrapper owns attribution, fee validation
and tip-link hydration. Embedded URLs use `chainId`, optional `toChain`,
`inputCurrency` and `outputCurrency`. Missing `toChain` means same-chain; empty token
fields use defaults. Pair writes remove public `from/to/tokenIn/tokenOut` fields.
Limit Order uses `chainId` for both sides and clears `toChain`.

`features=swap,limit` controls available tabs. `tab` selects the main tab or an
Info/Settings/source panel; returning from a panel restores its main tab.

`src/pages/KyberCross` consumes shared swap modules for direct quotes and Gas Drop,
with separate source preferences. Shared modules must not import that page.
`/kybercross` requires the testing flag `KYBERCROSS`, including in Safe App; keep it
disabled for release. The retired `/cross-chain` route falls back to home.

## Verification

Run from the repository root; see the `apps/kyberswap-interface/README.md` for setup.

```sh
pnpm --filter @kyberswap/interface exec vitest run src/pages/Swap src/components/SwapForm
pnpm --filter @kyberswap/interface exec tsc --noEmit
```

Keep tests for observable contracts: URL/pair preservation, stale quote/review
isolation, exact amounts and provider minimums, wallet execution, and history
reconciliation/pagination. Use table-driven cases for distinct provider variants.
Avoid duplicate scenarios, markup/class assertions, cosmetic timer checks and
tests of third-party SDK behavior without exercising our code.

Shared changes also need the affected consumer tests in `src/pages/KyberCross` and
`src/pages/PartnerSwap`. API/store changes should exercise the history and execution
suites against their updated contracts.
Unit tests do not verify browser layout, live providers or wallet E2E flows.
