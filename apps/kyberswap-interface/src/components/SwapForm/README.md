# SwapForm

`SwapForm` contains the forms and quote/review orchestration for Unified Swap.
It has two entry components: `SingleChainSwap` for same-chain EVM swaps and
`CrossChainSwap` for different-chain or non-EVM pairs. Shared layout, amount rows,
settings and review visuals live alongside the mode-specific code.

The [Swap page](../../pages/Swap/README.md) owns pair URLs, mode selection, wallet
slots, chart/route composition and transaction history. The form consumes that
pair and reports selection changes through callbacks.

## Structure and owners

| Module | Responsibility |
| --- | --- |
| [`SwapFormLayout.tsx`](SwapFormLayout.tsx) | Compose input/output panels, reverse control, details and action slots. |
| [`SingleChain/`](SingleChain/) | EVM form/provider, quote-to-review coordination and transaction submission. |
| [`CrossChain/`](CrossChain/) | Cross-chain form, wallet/recipient controls, route options and confirmation. |
| [`hooks/`](hooks/) | Same-chain request/build logic, input amount, recipient and review session. |
| [`CurrencyInput/`](CurrencyInput/) | EVM input/output fields and ERC-8056 display information. |
| [`Quote/`](Quote/) | Rate, fee and quote detail presentation. |
| [`SwapActionButton/`](SwapActionButton/) | Same-chain prerequisites, approval/permit, wrap/unwrap and review entry. |
| [`SwapModal/`](SwapModal/) | Same-chain review data and content, plus layout primitives shared with cross-chain review. |
| [`Settings/`](Settings/) and [`Warnings/`](Warnings/) | Slippage, sources, MEV, Degen Mode and risk presentation. |
| [`SwapFormContext.tsx`](SwapFormContext.tsx) | Same-chain display context: route, raw/display amounts, recipient, slippage and ERC-8056 metadata. |

`SwapFormContext` is not the cross-chain state owner. `SingleChainSwapProvider`
and `CrossChainSwapProvider` own their respective quote lifecycles. Their scope
includes both the form and the page's route panel.

## Mounting the forms

On the unified page, `SingleChainSwapFormProvider` connects the selected currencies
to balances, preferences and permit data, then mounts `SingleChainSwapProvider`.
The page renders `SingleChainSwapContent` inside it. The default `SingleChainSwap`
export wraps its own provider for standalone callers that supply the configuration.

`CrossChainSwapProvider` is exported from `CrossChain/hooks/useCrossChainSwap.tsx`.
It accepts `fromChain`, `toChain`, `tokenIn`, `tokenOut`, `amount` and `setAmount`.
It combines pair resolution, recipient state, quote session and execution.
`CrossChainSwap` consumes this context and composes the form and action UI.

Keep one active quote provider above both panels. Presentation components should
read that context instead of fetching another quote. Pair changes go through the
page's callbacks; token selectors own only the current selection interaction.

## Shared amount panels

`CurrencyInput/InputCurrencyPanel` and `OutputCurrencyPanel` adapt swap amounts,
balances and token metadata to the shared
[`CurrencyInputPanel`](../CurrencyInputPanel/index.tsx). The shared component owns
input/selector presentation and its modal state; the forms retain amount
calculation and token-selection callbacks. Max/Half actions live in the balance
row, and the presence of `onSwitchCurrency` selects direct token switching.

`value` and `onUserInput` remain controlled by the form. The panel reads the token
balance; `customBalanceText` and `balanceActionsEnabled` support independent-wallet
display and action availability. `amountShortcuts` replace individual Max/Half
buttons, with calculations owned by the caller or `useBalanceAmountShortcuts`.

`AmountInputControls.tsx` owns amount/balance presentation. `CurrencySelect.tsx`
derives native-currency display from `currency`; `currencyLoading` describes token
resolution, not quote loading. `customCurrencySelect` lets the non-EVM form own
its selector. The built-in selector reports choices to the form through callbacks;
its browsing rules are documented in
[TokenSelectorModal](../TokenSelectorModal/README.md).

`CrossChainSwap` supplies the Gas Drop control through the output footer slot.
The amount/footer wrapper owns their fixed 8px gap; the label-to-amount gap stays
12px. This spacing does not need feature-specific props.
The footer accepts a node or a function receiving `openTokenSelector`, so footer
actions can use the panel's existing modal state.

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

Custom recipient selection is available in Degen Mode for ordinary swaps. The
default recipient and wrap/unwrap recipient are the connected account.

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
slippage rebuilds an open/building review before the previous build can be
confirmed. Session generations prevent late callbacks from restoring dismissed
or replaced review UI.

`SwapModal/useSwapReviewData` and `reviewData.ts` derive built amounts, output
changes, minimum received and warnings. `SwapReviewContent` composes summary,
details and actions. Output changes can require explicit acceptance, including
the additional `ConfirmOutputChangeModal` for the configured threshold. Build
errors and price-impact rules gate confirmation; suggested slippage feeds back
through the shared setting and rebuilds the route. Keep these rules in the
review data/action modules rather than duplicating them in amount cards.

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

### Request and quote session

`useCrossChainPair` resolves EVM/non-EVM currencies. `useCrossChainRecipient`
combines the selected signing connections with recipient input. Missing addresses
can use placeholders for preview requests, marked `isReadOnly`; those quotes are
not executable.

`useCrossChainQuoteRequest` captures pair, amount, slippage, sender, receiver and
wallet request data. Amount requests debounce for 500 ms, while raw input remains
part of request identity so old quotes stop being actionable immediately.

`useCrossChainQuote` obtains pair category, USD prices and platform-fee policy
from `getPairInfo`, then invokes `getQuotesWithGasDrop`. That helper requests
ordinary quotes and, for eligible input, Gas Drop quotes concurrently through
`getQuotes` with `quoteMode: 'stream'`. Source
preferences come from `state.crossChainSwap.excludedSources`. Transport, parsing
and adapter association live in [`pages/Swap/crossChain/quote`](../../pages/Swap/crossChain/quote/).
Stream errors do not fall back to direct provider quotes.

[`useQuoteSession`](CrossChain/hooks/useQuoteSession.ts) owns:

- Cancellation for pair lookup, streaming, manual and periodic refresh.
- Quote loading and the countdown; Unified Swap refreshes 60 seconds after a
  request settles and pauses refresh while review is open.
- Selected provider retention on same-pair refreshes. If its quote is unavailable,
  selection falls back to the first quote. Pair changes reset selection and review.
- Clearing live quotes when request inputs change, preventing an old amount or
  address from becoming actionable after a timeout.
- A separate `reviewQuote` snapshot. Opening review validates that the quote is
  still selected and the request is current after asynchronous allowance checks.
  The snapshot remains separate from live quote refresh state.

`loading` controls whether a quote is ready for use; `allLoading` can remain true
while more provider results arrive. Ordinary route options show Best Return and Fastest;
Fastest uses a valid positive time estimate, breaking ties by output. Ranking and
display do not own the selected provider or execution state.

### Gas Drop

Gas Drop discovery runs automatically for different-chain pairs whose output is
an EVM non-native currency and whose input USD value is finite and strictly
greater than $2. The value comes from the raw input amount, token decimals and
`getPairInfo`'s input price. Missing/zero pricing or a value of $2 or less requests
only ordinary quotes. There is no Gas Drop settings preference for this flow.

[`gasDropQuotes.ts`](../../pages/Swap/crossChain/quote/gasDropQuotes.ts) collects the
two streams under one cancellation signal. Ordinary results exclude Gas Drop
requests; Gas Drop results require both the request flag and an actual gas
allocation. A failed stream does not discard usable results from the other.
`useQuoteSession.allQuotes` retains both sets, while `useCrossChainQuote` selects
the visible set. Toggling uses these collected quotes without starting a request.
Request changes reset the selected mode. If a completed refresh has no Gas Drop
route, the controller returns to ordinary mode.

The output footer appears only when a valid Gas Drop quote is available.
[`GasDropOption`](CrossChain/Quote/GasDrop.tsx) shows `+ Gas` with an explanatory
tooltip, or the active allocation with a remove control. Enabling it from another
provider opens the Switch Route confirmation; cancel/close leaves the mode
unchanged. KyberCross or an absent selected provider enables directly. Pending
confirmation belongs to `AddGasButton`, keyed by provider; the committed mode
belongs to `useCrossChainQuote`.

Gas Drop mode shows supported KyberCross routes. Route options show the Gas Drop
notice under the heading, gas USD beside the provider and the removal note at the
bottom. Best Return remains available; Fastest is hidden for Gas Drop quotes.
The review modal renders the allocation beneath the output amount via the shared
[`GasDropQuoteLine`](../../pages/Swap/crossChain/components/GasDropQuoteLine.tsx),
without a tooltip and with USD formatted as `(~$…)`.

[`useGasDropValue`](../../pages/Swap/crossChain/hooks/useGasDropValue.ts) prefers the
API's allocation USD value, including zero. If absent, it converts the raw native
amount using the destination native-token price. Missing prices leave USD
unavailable. This display calculation does not change the quoted output amount.

### Approval, review and submission

`CrossChainSwapAction` presents the first unmet prerequisite: loading/approval
work, token selection and restrictions, positive amount, input wallet, available
route, balance, source network, recipient, executable quote, then allowance.
EVM approval targets `selectedQuote.quote.contractAddress`.
`useCrossChainApproval` revalidates allowance before opening review.

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
  and leaves the app/header wallet unchanged.
- Form loading should preserve interactive inputs and settings. Refresh indicators
  display controller state; they do not schedule requests.
- Shared hooks also serve embedded swaps and `pages/KyberCross`. Keep caller
  configuration explicit, including direct/stream policy and backend sync options.

## Where to make changes

| Change | Start here |
| --- | --- |
| Form layout, amount fields or reverse control | `SwapFormLayout.tsx`, `CurrencyInput/`, `CrossChain/CrossChainSwapForm.tsx` |
| Same-chain request parameters, fees or refresh | `hooks/useRouteRequest.ts`, `hooks/useGetRoute.ts`, fee hooks, `SingleChain/SingleChainSwapProvider.tsx` |
| Same-chain approve/permit/wrap behavior | `SwapActionButton/index.tsx` and the corresponding shared hooks |
| Same-chain review state or submission | `hooks/useSwapReviewSession.ts`, `SingleChain/useSingleChainSwapReview.ts`, `SingleChain/useSingleChainSwapExecution.ts` |
| Review amounts, output acceptance or warnings | `SwapModal/useSwapReviewData.ts`, `SwapModal/reviewData.ts`, `SwapModal/SwapReviewActions.tsx` |
| Cross-chain request inputs, selection or refresh | `CrossChain/hooks/useCrossChainQuoteRequest.ts`, `CrossChain/hooks/useCrossChainQuote.ts`, `CrossChain/hooks/useQuoteSession.ts` |
| Gas Drop eligibility, paired requests or selection | `pages/Swap/crossChain/quote/gasDropQuotes.ts`, `CrossChain/hooks/useCrossChainQuote.ts` |
| Gas Drop control, route notice or value display | `CrossChain/Quote/GasDrop.tsx`, `CrossChain/Quote/CrossChainQuoteSelector.tsx`, `pages/Swap/crossChain/hooks/useGasDropValue.ts`, `pages/Swap/crossChain/components/GasDropQuoteLine.tsx` |
| Cross-chain action prerequisites or allowance | `CrossChain/CrossChainSwapAction.tsx`, `pages/Swap/crossChain/hooks/useCrossChainApproval.ts` |
| Cross-chain confirmation content | `CrossChain/CrossChainSwapConfirmation.tsx`, `CrossChain/Quote/` |
| Provider-specific execution or settlement | `pages/Swap/crossChain/hooks/useCrossChainExecution.ts`, `pages/Swap/crossChain/adapters/`, `pages/Swap/crossChain/transactions/` |

Paths in the last table are relative to this directory unless prefixed with
`pages/`. For page composition, URLs, wallet lifecycle and history ownership,
continue with the [Swap page README](../../pages/Swap/README.md).
