# Unified Swap page

Unified Swap provides one entry point for same-chain EVM swaps and routes involving
different chains, Solana, Bitcoin or NEAR. The selected pair determines the swap
engine; users do not choose a separate cross-chain mode.

This directory owns URL interpretation, page composition, wallet connections,
cross-chain integrations and transaction history. The [SwapForm README](../../components/SwapForm/README.md)
describes quote, approval, review and execution behavior in detail.

## Entry points and ownership

`SwapRoute.tsx` resolves the URL pair and selects the engine: same-chain EVM pairs
use the single-chain form; different-chain and non-EVM pairs use the cross-chain
form. Partner/User Swap retain their embedded URL parameters.

| Owner | Responsibility |
| --- | --- |
| [`SwapPage.tsx`](SwapPage.tsx) / [`SwapPageContent.tsx`](SwapPageContent.tsx) | Compose the active form, settings, chart, routes and History. |
| [`hooks/useSwapFormPair.ts`](hooks/useSwapFormPair.ts) | Resolve and update the pair through the URL. |
| [`SwapWalletProvider.tsx`](SwapWalletProvider.tsx) | Own input/output signing connections and wallet reversal. |
| [`crossChain/`](crossChain/) | Normalize quotes, integrate providers and reconcile execution. |
| [`transactions/`](transactions/) | Merge history, search, paginate and display transaction progress/details. |

The form and route panel share one active swap provider. `TransactionUpdater`
and `TransactionDetailProvider` sit outside the form-mode and History visibility
branches so their lifecycle survives changes to those views.

## Pair selection and wallets

Each token selector browses networks independently and commits through the pair
owner. Selecting the opposite token reverses the pair. Pair reversal coordinates
with wallet reversal in `SwapPageContent`.

The EVM input follows the app wallet; a non-EVM receiver connection is independent.
Changing a pair does not switch the signing network until execution needs it.
Recipient drafts belong to the form, separately from signing connections, and
balances follow each side's address. See the [TokenSelectorModal README](../../components/TokenSelectorModal/README.md)
for token browsing and selection.

## Routes and provider integrations

Chart and route panels consume the active form's quote. KyberCross routes can
use the provider's route plan; incomplete metadata falls back to an aggregate
provider step. Keep loading placeholders with the content they represent.

Unified Swap requests streamed quotes through `crossChain/quote/`. The registry
and factory connect normalized quotes to provider adapters, which own execution
and status checks. Preserve provider metadata through normalization because
execution and reconciliation need more than display amounts.

## Transaction history and settlement

Same-chain transactions live in `state/transactions`; cross-chain transactions
live in `state/crossChainSwap`. `TransactionUpdater` owns provider reconciliation,
backend synchronization and indexed-history polling independently of the modal
and History visibility.

`history.ts` and `sameChainHistory.ts` merge local and indexed records by source
chain and hash. Verified terminal backend data owns settlement; pending or
incomplete records retain useful local execution data. `usesBackendData` describes
the displayed data source, while `recordingStatus` owns registration state.

History owns search and pagination. `useProcessingTransactions` selects ongoing
cross-chain transactions for the input wallet without starting another poller.
Broadcast and settlement are separate: closing review or a confirmation timeout
must not discard a submitted transaction or stop its reconciliation.

## KyberCross transaction details

[`TransactionDetailProvider`](transactions/TransactionDetailProvider.tsx) owns
selection and the modal shared by History and processing transactions.
[`KyberCrossTransactionDetail`](transactions/KyberCrossTransactionDetail.tsx)
composes progress, transfer amounts, fees and transaction links.

[`useKyberCrossDetail`](transactions/useKyberCrossDetail.ts) owns execution requests
and polls every five seconds until the API returns a terminal result. If the API
is unavailable, the modal falls back to the transaction selected when it opened
and continues polling. Opening the modal does not require backend synchronization;
registration and settlement remain owned by the page-level updaters.

[`kyberCrossDetail`](transactions/kyberCrossDetail.ts) derives progress from execution
or local data. The adapter's saved route plan supplies expected steps and estimated
amounts, without treating estimates as completed execution.

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
| New cross-chain provider or changed API payload | `crossChain/adapters/`, `crossChain/factory.ts`, `crossChain/registry.ts`, `crossChain/quote/` |
| History merging, pagination or processing visibility | `transactions/`, `src/services/walletTransactionsApi` |
| Broadcast registration or settlement status | `crossChain/hooks/useCrossChainExecution.ts`, `crossChain/transactions/`, `src/state/crossChainSwap` |

Paths in the last table are relative to this directory unless prefixed with `src/`.
