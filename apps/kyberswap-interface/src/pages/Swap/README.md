# Swap pages

This module composes the unified Swap page and the Limit Order page. Unified Swap
uses the single-chain form for same-chain EVM pairs and the cross-chain form for
different-chain or non-EVM pairs.

## Structure

| Location                         | Responsibility                                                         |
| -------------------------------- | ---------------------------------------------------------------------- |
| `SwapRoute.tsx`, `redirects.tsx` | Route normalization and redirects                                      |
| `SwapPage.tsx`                   | URL pair state, shared provider scope and history visibility           |
| `SwapPageContent.tsx`            | Compose forms, settings and the right panel                            |
| `LimitPage.tsx`                  | Limit Order page composition                                           |
| `Layout/`                        | Page shell, header and navigation tabs                                 |
| `components/`                    | Chart/route panels and history UI                                      |
| `hooks/`                         | URL pair selection, navigation and page prefetch                       |
| `utils/`                         | Pure data transformations, including cross-chain route display mapping |

Form UI and its quote, recipient, approval and execution logic live in
[`components/SwapForm`](../../components/SwapForm). This directory owns page
composition and navigation; it consumes those form components.

## Using the forms

- Use `SingleChainSwapForm` from `components/SwapForm/SingleChain/` for the
  connected single-chain form. Pass the selected currencies, loading state and
  selection callbacks; use `onRouteChange` to supply the page's route panel.
- Use `CrossChainSwap` from `components/SwapForm/CrossChain/` inside
  `CrossChainSwapProvider`. Supply the controlled pair and amount to the provider,
  and selection callbacks to the form. Mount one provider around the form and
  route panel so they share the selected quote.
- Keep URL selection/reversal in `useSwapFormPair`. Use `utils/swapFlow.ts` when
  building swap links. Single-chain URLs use `/swap/{network}/{pair}`;
  cross-chain URLs use `/swap?from=…&to=…&tokenIn=…&tokenOut=…`.

See `SwapPage.tsx` and `SwapPageContent.tsx` for the current integration.

## Quote and review ownership

- Single-chain `useGetRoute` uses TanStack Query for quote data, loading,
  deduplication and polling. `useRouteRequest` defines the request key and query
  function, including fee lookup and response price enrichment. RTK supplies the
  route API transport.
- Quote responses belong to the current input key. Quotes have no freshness window
  or inactive retention (`staleTime: 0`, `gcTime: 0`); RTK route calls force refetch
  without subscriptions and use `keepUnusedDataFor: 0`. An in-flight request for
  the same key can still be shared. Physical cancellation is not required for quote correctness.
- Cross-chain `useCrossChainQuote` owns its stream, selection, refresh and reviewed
  quote. Each refresh opens a new stream.
  Native fetch calls for routes/streams use `cache: 'no-store'`.
- Both Unified Swap forms refresh after a 10-second interval following completion,
  pause automatic refresh during Review and retain available metrics during refetch.
  The indicator renders fetching state; its animation does not trigger requests.
- Single-chain `useSwapReviewSession` owns build/review/submit/error and dismissal.
  Preview starts a build and Review consumes its result; build cancellation and
  session guards reject stale completions. Cross-chain Preview snapshots the selected
  quote. Submitted transaction persistence continues independently of modal lifetime.
- Limit Order's rate comparison uses `useGetRoute` without polling. Price Alert uses
  it through `useBaseTradeInfoWithAggregator`; `RefreshButton` schedules refresh
  every 10 seconds. PartnerSwap reuses `SingleChainSwap`.

## Remaining scope

- [ ] View transaction details from History using available transaction/provider data.
- [ ] Include single-chain swap transactions in History alongside cross-chain transactions.

The History panel currently reads only cross-chain transactions.

## Working on this module

See [REFACTOR_TODO.md](./REFACTOR_TODO.md) for the scoped code-cleanup checklist.

- Put form behavior in `components/SwapForm`; keep page layout, navigation,
  chart/routes and history here. Form modules must not import `pages/Swap`.
- Preserve lazy-loading boundaries and the pending form skeleton. Loading
  cross-chain providers should not replace the whole page with a loader.
- Keep history polling independent of the active form mode and history visibility.
- Check shared consumers when changing forms or layout: Limit Order, Partner Swap
  and the legacy Cross-Chain page reuse parts of this UI. The cross-chain engine
  still lives in `pages/CrossChainSwap`.
- Keep page components flat unless a new group has a clear responsibility. Import
  concrete modules directly and keep tests beside the code they cover.

From the repository root, run the relevant checks:

```sh
pnpm --filter @kyberswap/interface exec vitest run src/pages/Swap src/components/SwapForm
pnpm --filter @kyberswap/interface exec tsc --noEmit
```

For UI or transaction changes, also verify the affected flow in the browser;
static checks do not cover wallet execution.
