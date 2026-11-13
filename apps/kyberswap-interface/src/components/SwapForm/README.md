# SwapForm

`SwapForm` contains the shared form and quote/review orchestration for Unified Swap.
`SwapForm.tsx` maps the active quote into one `UnifiedSwapForm`, which owns the
input/output panels, token selection tracking, balances and display units.
Same-chain and cross-chain components supply their details and execution controls.

The [Swap page](../../pages/Swap/README.md) owns pair/amount selection, the shared
EVM recipient draft, wallet connections and History. The cross-chain data boundary stays mounted; its quote/execution engine loads lazily on first cross-chain use and stays mounted
afterward. Same-chain disables quote requests while retaining the shared fields.

## Structure and owners

| Module                                                | Responsibility                                                                                     |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [`SwapFormLayout.tsx`](SwapFormLayout.tsx)            | Compose input/output panels, reverse control, details and action slots.                            |
| [`SingleChain/`](SingleChain/)                        | EVM form/provider, quote-to-review coordination and transaction submission.                        |
| [`CrossChain/`](CrossChain/)                          | Cross-chain form, recipient controls, route options and confirmation.                              |
| [`hooks/`](hooks/)                                    | Pair URL selection, same-chain request/build logic, input amount, recipient and review session.    |
| [`SwapWallets`](../SwapWallets/)                      | Signing slots, connection models and wallet selection controls.                                    |
| [`CurrencyInput/`](CurrencyInput/)                    | EVM input/output fields and ERC-8056 display information.                                          |
| [`Quote/`](Quote/)                                    | Rate, fee and quote detail presentation.                                                           |
| [`SwapActionButton/`](SwapActionButton/)              | Same-chain prerequisites, approval/permit, wrap/unwrap and review entry.                           |
| [`SwapModal/`](SwapModal/)                            | Same-chain review data and content, plus layout primitives shared with cross-chain review.         |
| [`Settings/`](Settings/) and [`Warnings/`](Warnings/) | Slippage, sources, MEV, Degen Mode and risk presentation.                                          |
| [`SwapFormContext.tsx`](SwapFormContext.tsx)          | Same-chain display context: route, raw/display amounts, recipient, slippage and ERC-8056 metadata. |

`SwapFormContext` is not the cross-chain state owner. `SingleChainSwapProvider`
and `CrossChainSwapProvider` own their respective quote lifecycles. Their scope
includes both the form and the page's route panel.

## Quote and form boundaries

`SingleChainSwapFormProvider` connects balances and preferences to the EVM quote
engine. `CrossChainSwapProvider` owns streamed quotes and cross-chain execution.
The cross-chain wallet providers and engine load on first use and stay mounted
across mode changes. Same-chain entry does not load non-EVM wallet SDKs; browsing
a non-EVM token list loads its providers locally. Existing transfers still load
the status updater for polling and terminal settlement enrichment.
Same-chain disables cross-chain requests and invalidates its active quote/review.
The pair, amount and EVM recipient drafts remain outside the lazy boundary.

`SingleChainSwapContent` and `CrossChainSwap` render only mode-specific information
and actions. The form and route panel read the same quote provider; neither starts
a second quote request. Legacy KyberCross adapts its quotes through
`CrossChainSwapForm` and reuses the common fields.

The pair owner also keeps a one-time output-selector default per page mount:
changing input from a same-chain pair to another chain defaults output browsing to
the input chain until an output token is selected. Dismissing the popup preserves
this default; after selection it is done until the page reloads/remounts.

## Shared amount panels

`CurrencyInput/InputCurrencyPanel` and `OutputCurrencyPanel` adapt swap data to
[`CurrencyInputPanel`](../CurrencyInputPanel/index.tsx). The shared component owns
amount/token presentation, balance controls and selector open state. Forms own
amount calculations, validation and committed token selection; the
[TokenSelectorModal](../TokenSelectorModal/README.md) owns browsing and selection
interaction. `CrossChainOutputFooter` supplies Gas Drop through the output footer.

## Same-chain EVM flow

```text
Pair + typed amount + settings
  → useRouteRequest / useGetRoute
  → routeSummary shared by form and route panel
  → wallet/network/input checks → approval or permit
  → open review → useBuildRoute
  → inspect built amounts and warnings → confirm
  → useSingleChainSwapExecution → wallet → local transaction history
```

### Quotes and prerequisites

`SingleChainSwapProvider` parses input, resolves the recipient and detects
wrap/unwrap. `useRouteRequest` constructs the aggregator request and query key;
`useGetRoute` owns debouncing, query state, polling and the refresh countdown.
Automatic refresh runs every 10 seconds while enabled and
pauses whenever the review session is open. Manual refresh shares the same
request lifecycle and has a short cooldown.

The response is parsed into `routeSummary` for display. Fee validation compares
the response with the fee intent captured by that exact request. Fee/tip request
construction belongs to the fee hooks, rather than the row displaying the fee.

`SwapActionButton` handles unsupported chains, wallet connection, source-network
switching, restricted tokens, input/balance errors and route availability before
review. Approval and permit use the route's API-returned `routerAddress`. Native
payment uses `paysNativeOnSwap` and bypasses token allowance/permit. Wrap/unwrap
uses `useWrapCallback` instead of requesting/building an aggregator route.

Settings → Send to another Wallet opens a recipient popup for all Swap modes,
independently of Degen Mode. The popup owns temporary edits; recipient hooks own
Apply and expanding the form input. Popup and form share the address field.
EVM-to-EVM forms initially hide recipient controls until a custom address is applied.
Clearing the input restores the selected wallet; collapsing does not change the recipient.
The setting is disabled for wrap/unwrap, which receives into the connected wallet.
Recipient resolution is shared by Settings and the form: ENS resolves through its
registered resolver on Ethereum before quote/build, with default RPC retries as in
the legacy form. Successful lookups remain cached without background refresh.
Non-EVM format checks run locally,
with address libraries loaded alongside the form rather than on demand. Draft text
is preserved, and pending/invalid recipients cannot execute. These checks do not
verify account existence or ownership.

### Review and execution

[`useSwapReviewSession`](hooks/useSwapReviewSession.ts) owns this lifecycle:

```text
closed → building → review → preparing → signing → submitted
                         └────────────────────────→ error
```

A build failure remains in the review phase with a build error for the modal to
explain. `useSingleChainSwapReview` binds the session to build, submit and dismiss
actions; `SingleChainSwapReview` renders the review button and modal.

`useBuildRoute` sends the raw route summary with sender, resolved recipient,
slippage, deadline, permit and attribution. The returned build data contains the
executable payload and router. Confirmation submits that built payload/router;
it must not substitute a newer displayed quote.

The review identity includes wallet, chain, pair, amount, recipient and Degen
Mode. Changes invalidate the session and cancel outstanding builds. Changing
slippage makes `useSingleChainSwapReview` rebuild an open/building review before
the previous build can be confirmed. Initial builds and rebuilds share the same
price-impact gate. Session generations prevent late callbacks from restoring dismissed
or replaced review UI.

`SwapModal/useSwapReviewData` and `reviewData.ts` derive built amounts, output
changes, minimum received and warnings. `SwapReviewContent` composes summary,
details and actions. Output changes can require explicit acceptance, including
the additional `ConfirmOutputChangeModal` for the configured threshold. Build
errors and output acceptance gate the modal action; the controller owns the
Degen Mode prerequisite. Suggested slippage feeds back through the shared
setting and rebuilds the route.

`useSingleChainSwapExecution` sends the reviewed payload with the correct native
value and records the hash and captured swap metadata in `state/transactions`.
Dismissal detaches review UI callbacks; submission still owns persistence if the
wallet returns a hash afterward.

## Cross-chain flow

```text
Pair → token resolution + sender/receiver
  → debounced request → pair classification + fee policy
  → aggregator stream → normalized provider quotes
  → selected route → prerequisite/allowance checks
  → reviewQuote snapshot → confirm → provider adapter
  → source hash → local record + backend sync → settlement updater
```

### Quotes and Gas Drop

`useCrossChainPair` resolves currencies and `useCrossChainRecipient` combines the
selected signing connections with recipient input. Preview quotes can use placeholder
addresses and are marked `isReadOnly`; they are not executable.

`useCrossChainQuote` coordinates aggregator quotes and Gas Drop. `useQuotePool` owns
requests/results, while `useQuoteSession` owns selection, refresh and review snapshots.
The form and Route Options consume the same state. See the
[quote and Gas Drop README](CrossChain/Quote/README.md) for ownership, decision rules,
source precedence and lifecycle.

### Approval, review and submission

`CrossChainSwapAction` presents the first unmet prerequisite: loading/approval
work, token selection and restrictions, positive amount, input wallet, available
route, balance, source network, recipient, executable quote, then allowance.
EVM approval targets `selectedQuote.quote.contractAddress`.
`useCrossChainApproval` revalidates allowance before opening review.
`CrossChainSwapProvider` and `useSingleChainSwapReview` own Degen Mode gates
before review and confirmation, using shared price-impact rules. Cross-chain
rechecks after allowance; same-chain checks the built amounts. Both use
`SwapButtonWithPriceImpact` for presentation. Buttons and modals report intent;
controllers own navigation to Settings and review transitions.

`CrossChainSwapConfirmation` receives `reviewQuote`, submission state and actions
as props. Amounts, recipient, slippage and warnings come from that snapshot. The
component shares visual primitives with the same-chain modal; the two modes keep
their own review/execution controllers.

`useCrossChainExecution` checks the live signer against the reviewed quote before
calling `adapter.executeSwap`. Inside Unified Swap, the page's input connection
is authoritative. A receiver address or preview placeholder cannot substitute
for a signing connection. Stream quotes may still require provider-specific
build/SDK calls during execution.

On broadcast, execution persists the source transaction and queues backend sync
when `quoteId` and `quoteToken` are available. Closing the modal resets its UI,
but an in-flight submission still persists its result. A timeout after a captured
source hash does not turn that broadcast into an unsubmitted failure. Settlement
belongs to the page-level transaction updater, not the confirmation modal.

## Shared business rules

- Slippage comes from the shared user preference. Preserve each API's expected
  units; UI percentages are formatted from those values.
- Display amounts and executable amounts have different purposes. ERC-8056
  display scaling belongs to the display hooks/context; quote/build/native-value
  conversion belongs to the existing amount helpers. Do not send formatted text
  as an executable amount.
- Keep the raw provider payload, spender/router and quote credentials through
  normalization. UI summaries alone are insufficient to execute or reconcile.
- Wallet connections belong to `SwapWalletProvider`; pasted recipient state
  belongs to `useCrossChainRecipient`. Pair reversal coordinates through the page
  and leaves the app/header wallet unchanged. Unified cross-chain EVM recipient
  input shows only the user-entered value; the effective receiver defaults to the
  connected wallet until a custom recipient is entered.
- Form loading should preserve interactive inputs and settings. Refresh indicators
  display controller state; they do not schedule requests.
- Shared hooks also serve embedded swaps and `pages/KyberCross`. Keep caller
  configuration explicit, including direct/stream policy and backend sync options.

## Where to make changes

| Change                                         | Start here                                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Form layout, amount fields or reverse control  | `UnifiedSwapForm.tsx`, `SwapFormLayout.tsx`, `CurrencyInput/`                                                            |
| Same-chain request parameters, fees or refresh | `hooks/useRouteRequest.ts`, `hooks/useGetRoute.ts`, fee hooks, `SingleChain/SingleChainSwapProvider.tsx`                 |
| Same-chain approve/permit/wrap behavior        | `SwapActionButton/index.tsx` and the corresponding shared hooks                                                          |
| Same-chain review state or submission          | `hooks/useSwapReviewSession.ts`, `SingleChain/useSingleChainSwapReview.ts`, `SingleChain/useSingleChainSwapExecution.ts` |
| Review amounts, output acceptance or warnings  | `SwapModal/useSwapReviewData.ts`, `SwapModal/reviewData.ts`, `SwapModal/SwapReviewActions.tsx`                           |
| Cross-chain quotes, refresh or Gas Drop        | [Quote and Gas Drop ownership](CrossChain/Quote/README.md)                                                               |
| Cross-chain action prerequisites or allowance  | `CrossChain/CrossChainSwapAction.tsx`, `CrossChain/hooks/useCrossChainApproval.ts`                                       |
| Cross-chain confirmation content               | `CrossChain/CrossChainSwapConfirmation.tsx`, `CrossChain/Quote/`                                                         |
| Provider-specific execution or settlement      | `CrossChain/hooks/useCrossChainExecution.ts`, `src/services/crossChain/adapters/`, `src/state/crossChainSwap/`           |

Paths in the last table are relative to this directory unless prefixed with
`src/`. For page composition and integration boundaries,
continue with the [Swap page README](../../pages/Swap/README.md).
