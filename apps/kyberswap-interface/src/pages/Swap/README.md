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
  `state/swap/hooks.ts::useSwapCurrencyResolution` reads the URL pair once and
  returns resolved currencies plus loading to `useSwapFormPair`. Its selected
  metadata takes precedence only while token ID and chain match the current URL.
  Loading reaches `CurrencyInputPanel` through the form fields; the shared field
  renders a skeleton without owning a fetch or inferring loading from absence.
  Quote loading remains separate from token metadata loading.
  The selected chain comes from the page, independently of wallet chain and token
  metadata. Validation uses the frontend `MAINNET_NETWORKS` list and excludes Blast;
  Abstract is already outside that list. The same validation disables the CTA
  (including wrap/unwrap) and new quote requests. It does not wait for remote chain
  configuration or abort requests already sent; responses are hidden while disabled.
- `hooks/crossChain/useCrossChainSwap.tsx` composes the cross-chain context from
  controlled pair/amount inputs. It does not write the URL or keep a second amount.
  `SwapPage` mounts this provider around the form and right panel so both consume
  the same selected quote without copying quote state or issuing another request.
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
- `components/TradeRoutePanel.tsx` owns the shared route header/collapse behavior.
  Cross-chain reuses `components/TradeRouting/styled` cards and connectors;
  `components/crossChain/route/getRouteSteps.ts` reads provider display metadata.
  Unknown or incomplete schemas stay an aggregate provider route, without guessed
  swap legs, amounts or pool splits. Review integration remains separate work.
- `components/TokenPriceChart` resolves each selected token's chain, quote token
  and request/cache identity independently. Its data hook owns queries, pagination
  and candle derivation; token eligibility is shared with the right panel. It supports the configured EVM chart
  chains; non-EVM chart data is not supported by the current service contract.
- `SwapPage` owns whether the right panel shows chart/routes or History, with a
  reduced-motion-aware fade/slide transition. Chart/routes stay mounted while
  hidden so their local display state survives opening and closing History.
  `components/crossChain/HistoryButton.tsx` is a controlled trigger immediately
  left of Settings; the Header accepts it as a composition slot.
  `components/crossChain/HistoryPanel.tsx` owns the token search and reads saved
  transactions. Back and the header icon return to chart/routes; token
  filtering matches either side by symbol, name or address/asset ID.
  `SwapPage` mounts the lazy `TransactionHistoryUpdater` for saved transactions
  outside the mode branch, so closing History or switching swap modes does not
  restart polling. The existing `useTransactionHistory` hook owns status updates.

- Token Info accepts a `tokens` list across Swap, Limit, Partner Swap and token
  selection details. It removes duplicate chain/address entries, retains selection
  by token identity on reorder, and falls back to the first available token when
  selection disappears. The compact shared segmented control supports more than
  two tokens, keeps chain badges within the logo area, and wraps below the title
  only when the header runs out of room.
- Token Info is available for unified cross-chain pairs when at least one chain is EVM.
  Each tab uses its token's chain and shows a chain badge; Market/Security queries
  expose only current-argument data. Add-to-wallet is shown only on the token's
  connected wallet chain. Mixed pairs show the EVM token only; the toggle is hidden
  when neither chain is EVM because the existing market/security service contract
  accepts EVM tokens only.

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

- The active [implementation TODO](../../../../../docs/unified-swap-ui.md#implementation-todo--2026-10-22)
  tracks remaining route chart, ranking UX, fees, history, analytics, rollout and
  browser/wallet E2E work.
- Accepted on 2026-10-22: Best Return keeps output-amount ranking without
  subtracting additional fees. Settings keeps single-chain slippage presets while
  the cross-chain form/Review use their own rules. Neither is an active fix TODO.
- Both flows show chart/routes on the right; History replaces that content when toggled from its icon by Settings.
  This supersedes the previous right-panel Price Chart/History tabs proposal.
- The implementation is suitable for continued development, not certified as a
  complete implementation of the original specification or as production-ready.
- Retained tests cover provider route parsing (10 cases), token loading/recovery
  (10 cases), and pair navigation/resolution (8 cases). All 28 passed after the
  test cleanup. Dedicated Token Info/History UI tests and added SSR UI assertions
  were deliberately removed; existing SSR coverage remains.
- The Goerli injection removal passed scoped ESLint, 10 loading tests and diff
  checks. TypeScript and SSR passed before that cleanup; earlier counts describe
  those revisions, not the retained suite. See the
  [verification record](../../../../../docs/unified-swap-ui.md#verification-and-retained-coverage--2026-10-22).
- Browser visual QA, live token-list recovery and wallet execution remain unverified.

## Token list loading and recovery

- `useEnsureTokenList` shares one initial-load operation per chain through TanStack
  Query; Redux remains the owner of the usable token map. Pages are published only
  after the whole load succeeds, and missing `tokens` payloads count as errors.
- Transport errors, HTTP 408/429 and 5xx receive at most two automatic retries,
  after 1s and 2s. Other HTTP 4xx do not retry automatically. Failed loads can run
  again on consumer remount or network reconnect; window focus does not refetch.
- A populated Redux list prevents unnecessary reloads. A successful empty list is
  fresh for one minute, then eligible for remount/reconnect refresh (no polling).
  Inactive query entries expire after five minutes. Each load requests fresh pages
  rather than reusing a previously empty page from the RTK Query cache.
- `useAllTokensWithLoading` includes the existing map debounce in loading so URL
  token selectors keep their skeleton until the resolved list reaches consumers.
- The old hardcoded Goerli DAI/USDT injection is removed. Whitelist data is
  supplied by the catalog API (or the existing Abstract token source).
- `useCurrencyLookup` owns native/address metadata lookup and accepts an already
  known token to skip remote fetching. It does not subscribe to the token list.
  `useCurrencyById` owns URL symbol lookup and configured fallback tokens;
  `useCurrencyV2` preserves the existing native/address-only API for other callers.
- Recovery applies to all consumers of `useAllTokens`, not only Unified Swap.
  This is initial-load recovery, not periodic refresh of populated lists. Retrying
  a failed load requests the pages again; retries are shared per chain rather than
  repeated independently by each mounted consumer.
