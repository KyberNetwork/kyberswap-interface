# Unified swap ownership

`SwapPage` composes the two swap flows in the same layout. Same-chain EVM pairs
use `SingleChainSwap`; different-chain and non-EVM pairs use `UnifiedCrossChainSwap`.

- `hooks/useSwapFormPair.ts` owns token selection, reversal and atomic URL updates.
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
