# Unified swap ownership

`SwapPage` composes the two swap flows in the same layout. Same-chain EVM pairs
use `SingleChainSwap`; different-chain and non-EVM pairs use `UnifiedCrossChainSwap`.

- `hooks/useSwapFormPair.ts` owns token selection, reversal and atomic URL updates.
- `SwapRoute.tsx` normalizes mixed URLs and mounts network synchronization only
  for single-chain paths. `utils/swapFlow.ts` builds the pair URL used by selection,
  tab navigation and sharing:
  - Single-chain: `/swap/{network}/{tokenIn}-to-{tokenOut}`, using the existing
    native/whitelisted-symbol or token-address convention. No cross-chain pair query.
  - Cross-chain: `/swap?from=…&to=…&tokenIn=…&tokenOut=…`, with the same query
    contract as `/cross-chain` and case-sensitive non-EVM IDs preserved.
  - Swap ↔ Limit Order retains the single-chain network and pair. Unified
    cross-chain Swap ↔ Cross-Chain retains both chains and tokens. Returning to
    same-chain EVM rewrites the pair into the path and removes the pair query.
- `components/SwapForm/hooks/useSwapInputAmount.ts` reads/writes the Redux input
  amount. The page owns URL prefill; the single-chain child does not repeat it.
- `components/SingleChainSwap.tsx` owns single-chain form orchestration.
  `PopulatedSwapForm` supplies balances, permit and user settings.
  The selected chain comes from the page, independently of wallet chain and token
  metadata. Validation uses the frontend `MAINNET_NETWORKS` list and excludes Blast;
  Abstract is already outside that list. The same validation disables the CTA
  (including wrap/unwrap) and new quote requests. It does not wait for remote chain
  configuration or abort requests already sent; responses are hidden while disabled.
- `hooks/crossChain/useCrossChainSwap.tsx` composes the cross-chain context from
  controlled pair/amount inputs. It does not write the URL or keep a second amount.
- `hooks/crossChain/useCrossChainPair.ts` resolves token metadata.
- `hooks/crossChain/useCrossChainRecipient.ts` owns recipient state and wallet defaults.
  Recipients persist per wallet family while the cross-chain flow stays mounted;
  switching to the single-chain flow resets this local state.
- `hooks/crossChain/useCrossChainQuote.ts` owns request identity, cancellation,
  debounce, refresh, route selection and the reviewed quote. Unified requests and
  source settings explicitly use aggregator stream mode, independently of the
  legacy screen's persisted direct/stream mode.
- `hooks/crossChain/useCrossChainExecution.ts` owns submission and execution state.
  Closing a review detaches its popup state; pending submissions still update history.
  Users can start another transaction, and each submission only updates its own popup.
  Confirmation renders tokens, slippage and warnings from the reviewed quote and
  its captured pair category, independently of the current form inputs.
- `components/crossChain/` contains the cross-chain form, summary, route sidebar,
  confirmation, history and source settings.

Shared dependencies outside this page:

- `components/SwapForm/`: reusable fields, summary/layout primitives, single-chain
  context, confirmation widgets and low-level quote/build hooks.
- `pages/CrossChainSwap/adapters/`, `quote/`, `factory.ts`, `registry.ts` and
  `utils.ts`: existing cross-chain engine, reused in place. Provider quote,
  execution and status logic stays unchanged by the unified form refactor.
- `pages/CrossChainSwap/hooks/`: reusable token, balance, transaction-history and
  NEAR transaction restore hooks. `nearPendingTransaction.ts` owns storage without
  importing React hooks into adapters.
- `pages/CrossChainSwap/components/` and `provider/`: existing wallet connection UI
  and consent, reused in place. Provider labels, token logos, route steps, approval
  and transaction history also remain shared with the legacy screen.
- `state/crossChainSwap/`: history and excluded sources. Async execution appends
  transactions through a reducer instead of replacing a captured history list.

`pages/CrossChainSwap` still contains the legacy screen and the dependencies above;
its KyberCross direct/Gas Drop controller is retained from main. Unified uses
the shared quote parser, provider minimum output, additional fees and nullable
price impact contract. Unified form state and orchestration belong to
`pages/Swap`, independently of the legacy screen. Removing that screen later must
preserve the reused modules. The shared navigation still prefetches its route via
`loader.ts` while that route exists.
Embedded/partner entry points are callers, not owners of unified business logic.

## Accepted behavior (2026-10-20)

The [Unified Swap UI decisions](../../../../../docs/unified-swap-ui.md#current-implementation-decisions--2026-10-20)
take precedence over conflicting requirements in the original specification snapshot.

- Keep one stored slippage setting. Single-chain suggestions/warnings come from
  `state/swap/hooks.ts` and `utils/slippage.ts`; cross-chain uses
  `hooks/crossChain/getQuoteWarning.ts` with the category resolved by
  `pages/CrossChainSwap/quote/getPairInfo.ts`. Suggestions are applied explicitly,
  not automatically on pair changes. Cross-chain Review uses its captured category
  and slippage. Shared storage is intentional.
- In the unified cross-chain form, **Route Options** is always visible and opens
  the routes panel even without a selected quote. Loading skeletons and empty-state
  text belong inside `QuoteSelector`, not in the trigger. An empty, non-loading
  list shows **No route found**, including before entering an amount.
- Quote request failures clear the live list and use the same empty state. No
  separate error state, Retry button or Enter an amount branch is required.
  Cancelled requests do not show errors. Outside Review, automatic refresh runs
  10 seconds after completion/failure; the Rate row also provides manual refresh.
- Keep the reviewed quote snapshot while Review is open and pause quote refresh.
  Do not add shared TTL validation or automatic re-quoting before signing.
  Provider-specific behavior remains in the adapters. Execution errors must leave
  the reviewed quote available for inspection.
- Keep `/cross-chain` available for now; its eventual removal is deferred.

## Remaining scope and verification

- Settings-screen slippage presets still use single-chain category logic; unlike
  the form, they do not yet use cross-chain presets.
- The right panel shows chart/routes for single-chain and history for cross-chain.
  Price Chart/History tabs remain deferred work if required.
- The implementation is suitable for continued development, not certified as a
  complete implementation of the original specification or as production-ready.
- Checks run during the 2026-10-20 review: TypeScript, targeted ESLint, 38
  routing/quote tests and 17 SSR smoke tests passed. The subsequent Route Options
  change passed TypeScript and targeted ESLint; the final text-only adjustment
  passed ESLint. Browser/wallet E2E was not performed.
