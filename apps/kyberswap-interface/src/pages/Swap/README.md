# Unified Swap page

Unified Swap provides one entry point for same-chain EVM swaps and routes involving
different chains, Solana, Bitcoin or NEAR. The selected pair determines the swap
engine; users do not choose a separate cross-chain mode.

This directory owns URL interpretation, page composition, wallet connections,
cross-chain integrations and transaction history. The [SwapForm README](../../components/SwapForm/README.md)
describes quote, approval, review and execution behavior in detail.

## Entry points and mode selection

| Surface | URL / pair parameters | Owner |
| --- | --- | --- |
| Same-chain EVM swap | `/swap/{network}/{tokenIn}-to-{tokenOut}` | `SwapRoute.tsx` |
| Cross-chain or non-EVM swap | `/swap?from=…&to=…&tokenIn=…&tokenOut=…` | `SwapRoute.tsx` |
| Limit Order | `/limit/{network}/{tokenIn}-to-{tokenOut}` | `LimitPage.tsx` and shared layout |
| Partner/User Swap | `/partner-swap` or `/user-swap/{tipsId}` with `chainId`, optional `toChain`, `inputCurrency`, `outputCurrency` | Embedded page and shared pair helpers |

[`isCrossChainPair`](../../utils/swapFlow.ts) returns true when the chains differ
**or the input chain is non-EVM**. A Solana-to-Solana pair therefore uses the
cross-chain engine too. Only a pair on the same numeric EVM chain uses
`SingleChainSwapFormProvider`.

`SwapRoute` canonicalizes pair URLs through `getTradeLocation`. Same-chain routes
synchronize the network path with the app network; cross-chain URLs have no
wallet-bound network path. Embedded pages retain their own parameter schema via
`getEmbeddedSwapSearchParams`, preserving attribution and fee parameters.

## Page composition and state ownership

```text
SwapRoute
└── SwapPage
    └── NonEvmProviders
        └── SwapWalletProvider
            ├── TransactionUpdater
            └── Active swap provider
                └── SwapPageContent
                    ├── Header, form, settings and processing transactions
                    └── Chart / trade route / History

Active swap provider:
  same-chain EVM   → SingleChainSwapFormProvider → SingleChainSwapProvider
  other pairs     → CrossChainSwapProvider
```

| Owner | Responsibility |
| --- | --- |
| [`SwapPage.tsx`](SwapPage.tsx) | Pair and amount wiring, active provider, History visibility and page-level transaction updater. |
| [`hooks/useSwapFormPair.ts`](hooks/useSwapFormPair.ts) | Resolve the URL pair, select tokens and reverse both sides in one navigation. |
| [`SwapWalletProvider.tsx`](SwapWalletProvider.tsx) | Input/output signing connections and their lifecycle. |
| [`SwapPageContent.tsx`](SwapPageContent.tsx) | Compose form, settings, chart, routes and History; coordinate pair reversal with wallet reversal. |
| [`hooks/useTradeController.ts`](hooks/useTradeController.ts) | Active tab, URL-driven actions and Degen Mode highlighting. |
| [`components/`](components/) | Mode-specific chart and route presentation using the active provider. |
| [`crossChain/`](crossChain/) | Quote transport/normalization, provider adapters, execution and reconciliation. |
| [`transactions/`](transactions/) | Merge local/indexed history, pagination and processing views. |

The form and route panel consume **one provider instance**. Mounting another quote
provider inside a panel would create a second polling/review lifecycle. Keep
`TransactionUpdater` outside the mode and History visibility branches so switching
forms or closing History does not stop reconciliation.

`useSwapInputAmount` connects the amount to swap state. Pair metadata comes from
URL resolution, with recently selected token metadata used while the URL lookup
catches up. Token loading is explicit; a missing balance is not evidence that
token metadata is loading.

## Pair selection and wallets

Token selectors browse networks independently for each side. The selector reports
the chosen token to `useSwapFormPair`; the pair owner commits the URL. Selecting
the token already on the opposite side swaps the existing sides instead of
creating a duplicate pair. EVM identifiers are compared without case; non-EVM
identifiers retain their case. See the [TokenSelectorModal README](../../components/TokenSelectorModal/README.md)
for selector ownership and browsing behavior.

Choosing a cross-chain pair does not itself switch the signing wallet's network.
The action button requests the source network when execution needs it.

Wallet rules:

- EVM input always follows the app/header wallet. Explicitly selecting an EVM
  input wallet updates that app connection.
- Routes involving a non-EVM chain expose an independent receiver connection.
  Connecting that receiver does not replace the app wallet. EVM-to-EVM routes
  use the app-wallet recipient flow, including an optional custom recipient.
- `SwapPageContent` reverses connections and the pair together. Non-EVM signing
  sessions, including Ledger connection details, are retained. Reverse does not
  change the header wallet: if the new input is EVM, it resolves from the app
  wallet even when a different EVM receiver was previously selected.
- Pasted recipient text belongs to `useCrossChainRecipient`, separately from
  signing connections. Reverse leaves that text unchanged. The draft lasts for
  the cross-chain provider's lifetime; wallet slots last for the page provider's
  lifetime.
- Balances belong to the address on each side, including a pasted receiver.
  Browsing another wallet family must not silently replace the input signer.

## Layout and route presentation

Settings and token information hide the form while preserving its mounted
lifecycle. History occupies the chart/route area; the underlying panel remains
mounted. Chart and route visibility are separate user preferences.

Cross-chain modules load lazily. `CrossChainSwapPending` keeps pair/amount inputs
available while the provider loads, and the right panel can show chart metadata
from the page pair before quotes arrive. Keep loading placeholders local to the
content that is waiting.

`SingleChainRightPanel` reads the same `routeSummary` as the form and presents
pool splits through the shared trade-routing components. `CrossChainRightPanel`
reads the selected cross-chain quote. `getCrossChainRouteSteps` uses a KyberCross
route plan when valid; other or incomplete routes use an aggregate provider step.
Do not invent intermediate tokens, amounts or pool splits from missing metadata.

Routes initially collapse when a supported pricing chart is enabled and expand
otherwise. Provider selection, refresh timing and review state belong to the form
provider, not the route visualization.

## Cross-chain integration boundary

The form requests quotes through `crossChain/quote/getQuotesForMode.ts` with
`quoteMode: 'stream'`. Quote requests and mode selection belong to the form
controller. See [SwapForm](../../components/SwapForm/README.md#gas-drop) for ownership.

`streamQuotes.ts` receives aggregator results; parsing/normalization converts them
to the shared `Quote` model and associates them with registered adapters. Stream
failures do not switch Unified Swap to client-side direct quotes.

`registry.ts` defines the quote wrapper and adapter lookup; `factory.ts` creates
the available adapters. Each adapter owns provider-specific execution and status
behavior. A streamed quote can still require provider build or execution calls:
stream transport only specifies where the displayed quotes come from.

Keep provider payloads and execution metadata intact through normalization. The
form needs display amounts, but execution and reconciliation also need the raw
quote, spender, quote identifiers and provider tracking data.

## Transaction history and settlement

Transaction history has its own lifecycle:

1. Same-chain execution records the transaction in `state/transactions`.
   Cross-chain execution records it in `state/crossChainSwap` and, when quote
   credentials are available, queues backend synchronization after broadcast.
2. `TransactionUpdater` mounts provider/backend reconciliation and subscribes to
   the selected input wallet's indexed history through `services/walletTransactionsApi`.
   That subscription polls every 10 seconds while mounted, even when History is
   closed.
3. `history.ts`, `sameChainHistory.ts` and `localTransactionSelectors.ts` merge
   local swaps with indexed records, deduplicating by source chain and transaction
   hash. Complete settled server records own execution fields; matching local
   token metadata is retained only when chain and token identity agree. Pending
   or incomplete records retain useful local execution data.
4. `useHistoryPagination` fills display pages from the merged data and API cursors.
   A page contains up to 10 rows. `useHistorySearch` searches all local records and
   loaded API records by token symbol, name or address. `useHistoryTokens` owns
   metadata resolution for both search and display through the existing caches.
   Search filters before pagination and passes the resolved tokens to display.
   `HistorySearchResults` paginates matches separately and lets users search older API transactions one
   cursor at a time; unavailable metadata or history is shown as incomplete results.
   Metadata loading does not block loading older history. Failed cursor requests
   retry that cursor; initial-load or refresh failures refetch the cached history.
   Same-chain rows show Tx Hash; cross-chain rows show Deposit and Fill.

`useProcessingTransactions` shows ongoing cross-chain transactions for the input
wallet. Same-chain pending transactions belong to History and the existing wallet
status UI. The processing list does not start polling or own settlement.

A source hash means broadcast, not destination completion. Closing review does
not cancel an already submitted transaction, and a confirmation timeout after
broadcast must not discard its persisted hash. Provider/backend updaters continue
tracking it independently of the modal.

## Related consumers

Partner/User Swap reuse form modules with attribution, fee/tip configuration and
embedded pair URLs. Their `features` parameter controls available tabs. Limit
Order uses the shared page layout with its own form lifecycle.

`pages/KyberCross` reuses quote/session, review and adapter modules but owns its
quote policy, Gas Drop and source preferences. Changes to shared modules must keep
those caller options explicit; Unified Swap's stream policy belongs in
`useCrossChainQuote`.

## Where to make changes

| Change | Start here |
| --- | --- |
| Pair URL, navigation or same-chain/cross-chain switching | `SwapRoute.tsx`, `hooks/useSwapFormPair.ts`, `src/utils/swapFlow.ts`, `src/state/swap/hooks.ts` |
| Sender/receiver selection or reverse behavior | `SwapWalletProvider.tsx`, `SwapPageContent.tsx`, `src/components/SwapForm/CrossChain/hooks/useCrossChainRecipient.ts` |
| Form, quote, approval or review behavior | [SwapForm README](../../components/SwapForm/README.md) |
| Chart/route layout or graph data | `components/`, `utils/getCrossChainRouteSteps.ts`, `src/components/TradeRouting` |
| New cross-chain provider or changed API payload | `crossChain/adapters/`, `factory.ts`, `registry.ts`, `crossChain/quote/` |
| History merging, pagination or processing visibility | `transactions/`, `src/services/walletTransactionsApi` |
| Broadcast registration or settlement status | `crossChain/hooks/useCrossChainExecution.ts`, `crossChain/transactions/`, `src/state/crossChainSwap` |

Paths in the last table are relative to this directory unless prefixed with `src/`.
