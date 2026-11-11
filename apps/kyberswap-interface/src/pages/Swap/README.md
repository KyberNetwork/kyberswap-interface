# Unified Swap page

Unified Swap provides one entry point for same-chain EVM swaps and routes involving
different chains, Solana, Bitcoin or NEAR. This directory owns routing and page
composition; reusable forms, integrations and transaction views live with their
feature owners.

## Page composition

`SwapRoute.tsx` normalizes pair URLs and selects the appropriate network boundary.
`SwapPage.tsx` mounts wallet connections, transaction controllers and the active
swap provider. `SwapPageContent.tsx` composes the form, settings, chart, routes and
History. `components/` contains the two page-specific chart/route compositions.

Same-chain EVM pairs use the single-chain form; different-chain and non-EVM pairs
use the cross-chain form. Partner/User Swap retain their embedded URL parameters.
Limit and Stop Market retain their forms in [`LimitPage.tsx`](LimitPage.tsx)
and their existing shell in `layout/SwapLayout.tsx`.

The form and route panel share one active swap provider. `TransactionUpdater`
and `TransactionDetailProvider` stay outside form-mode and History visibility
branches so changing those views does not stop reconciliation or close detail.

## Feature owners

Paths below are relative to `src/`.

| Area                                               | Owner                                                                                                |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Pair selection and URL updates                     | [`components/SwapForm/hooks/useSwapFormPair.ts`](../../components/SwapForm/hooks/useSwapFormPair.ts) |
| Input/output signing connections and reversal      | [`components/SwapWallets`](../../components/SwapWallets/)                                            |
| Form, quote, approval and review                   | [`components/SwapForm`](../../components/SwapForm/README.md)                                         |
| Shared trade header, tabs and settings navigation  | [`components/TradeLayout`](../../components/TradeLayout/)                                            |
| Route presentation and graph projection            | [`components/TradeRouting`](../../components/TradeRouting/)                                          |
| Provider adapters and quote transport              | [`services/crossChain`](../../services/crossChain/)                                                  |
| History, processing orders and transaction details | [`components/SwapTransactions`](../../components/SwapTransactions/)                                  |
| Cross-chain persistence and reconciliation         | [`state/crossChainSwap`](../../state/crossChainSwap/)                                                |

## Integration boundaries

Pair selection commits through the form pair owner. `SwapPageContent` coordinates
pair reversal with signing-slot reversal. The input EVM connection follows the
app wallet; recipient drafts belong to the form. See the
[TokenSelectorModal README](../../components/TokenSelectorModal/README.md) for
browsing and selection ownership.

Unified Swap uses streamed quotes. `pages/KyberCross` reuses form and provider
modules while retaining its own quote policy, Gas Drop and source preferences.
Preserve these caller options when changing shared modules. Only KyberSwap and
KyberCross fetch quotes directly in the client. Other provider adapters execute
streamed quotes and track status; their SDK chain configuration is still required
for execution, independently of direct-quote chain filtering. The factory owns
adapter instances; the registry resolves provider names and legacy aliases.
Quote routing selects same-chain, direct or stream mode explicitly.

Transaction views share local/indexed history projections. Verified terminal
backend data owns settlement; pending or incomplete records retain local execution
data. Closing History, detail or review must not stop persistence for a submitted
transaction. Detail requests have their own query lifecycle and do not own settlement.
