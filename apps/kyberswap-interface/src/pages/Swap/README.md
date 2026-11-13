# Unified Swap page

Unified Swap provides one entry point for same-chain EVM swaps and routes involving
different chains, Solana, Bitcoin or NEAR. This directory owns routing and page
composition; reusable forms, integrations and transaction views live with their
feature owners.

## Page composition

`SwapRoute.tsx` normalizes pair URLs without remounting the page when the pair
changes mode. The selected pair stays independent of the connected wallet network;
changing the network in the header does not reset the form. `SwapPage.tsx` owns the pair,
amount, EVM recipient draft, wallet connections and History visibility.
`SwapPageContent.tsx` renders one form alongside settings, charts and History.

Both modes use `components/SwapForm/SwapForm.tsx` and the same input/output fields.
Quote, review/execution, details and route presentation remain mode-specific.
The cross-chain engine loads lazily on first cross-chain use and stays mounted
afterward. While the provider bundle loads, a disabled form preview renders the
selected pair and amount without mounting wallet or quote logic. The page layout
and chart stay mounted across mode changes, preserving chart preferences. A page-local
projection supplies route display data and sender identity without exposing wallet
or swap actions. Cross-chain requests stop and stale quotes are hidden in same-chain
mode; recipient drafts remain intact. MEV Protection uses the form or review chain,
independently of the connected wallet network.

Unified Swap defaults to the native input token and an empty output selection.
Explicit URL pairs take precedence; pair edits and reversal preserve empty selections.

Partner/User Swap retain their embedded URL parameters. Limit and Stop Market
retain their forms in `LimitPage.tsx`. Transaction controllers stay outside mode
and History visibility branches so submitted transactions keep reconciling.

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

Pair selection commits through the form pair owner. `SwapPageForm` coordinates
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
