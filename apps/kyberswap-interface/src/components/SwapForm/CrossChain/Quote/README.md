# Cross-chain quotes and Gas Drop

Unified Swap uses aggregator streams for route comparison and execution quotes.
Gas Drop adds a second quote mode without requesting both ordinary and Gas Drop
KyberCross routes on every input edit or refresh. User source exclusions apply to
every request. Stream errors never fall back to direct provider quoting.
Routing checks and source exclusions use the adapter-owned `KyberCross`
from `services/crossChain/adapters/KyberCrossAdapter/constants`.

## Ownership

| Owner                                                                                     | Responsibility                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`useCrossChainQuoteRequest`](../hooks/useCrossChainQuoteRequest.ts)                      | Input identity: pair, raw amount, slippage, sender/receiver and wallet request data. Mode is separate so toggles can reuse results. |
| [`useCrossChainQuote`](../hooks/useCrossChainQuote.ts)                                    | Adds source exclusions, obtains pair prices/fees, chooses mode, estimates eligibility and combines Route Options.                   |
| [`useQuotePool`](../hooks/useQuotePool.ts)                                                | One stream, cancellation, results and completion deadline per pool/input identity.                                                  |
| [`useQuoteSession`](../hooks/useQuoteSession.ts)                                          | Active-pool subscription, debounce, selected provider, refresh scheduling and immutable review snapshot.                            |
| [`getQuotesForMode`](../hooks/getQuotesForMode.ts)                                        | Explicit stream/direct requests and mode filtering; Gas Drop quotes require an actual allocation.                                          |
| [`GasDropOption`](GasDrop.tsx) / [`CrossChainQuoteSelector`](CrossChainQuoteSelector.tsx) | Confirmation and route-selection UI. Delegate fetching and mode changes to the quote owner.                                         |

KyberCross direct uses the same form, wallet, approval, route-selection and review
components with `quoteMode="direct"` and its own bridge exclusions. `+ Gas` is always
available, starts off and enables immediately without token/USD/quote eligibility
checks. The toggle survives input edits and empty responses until the user turns it
off. Direct loads only the selected ordinary/Gas Drop mode, preserves route selection
by bridge/lane/flow across refreshed IDs, and keeps execution tracking local.

The following pool and eligibility rules apply to Unified Swap's stream mode.
The quote owner keeps three pools. **Full ordinary** includes KyberCross unless
excluded by the user; it supplies executable quotes when Gas Drop is off.
**Gas Drop** supplies executable quotes when enabled. **Alternatives** requests
ordinary quotes with KyberCross additionally excluded, for comparison and estimation.
Alternatives never replace the full ordinary pool when switching to ordinary mode.

## Gas Drop decisions

Initial availability requires different chains, a non-native EVM output token and
an ordinary KyberCross route with finite `outputUsd > $2.2`. The selected ordinary
provider need not be KyberCross. Clicking `+Gas` prepares the Gas Drop request;
when switching from another provider, confirmation adopts that pending/fresh result.
Cancelling confirmation does not cancel the prepared stream.

When Gas Drop is already enabled, amount/slippage edits may carry that mode only if
a prior pool confirmed a KyberCross Gas Drop route with an allocation **and**:

```text
expectedOutputUsd = ordinaryQuote.outputUsd × newInputAmount / ordinaryQuote.inputAmount
expectedOutputUsd > 2.2
```

The estimate uses the best ordinary quote by net output with valid nonnegative USD,
from any provider. Slippage-only edits have an input ratio of 1. New ordinary results,
including alternatives without KyberCross, update the estimate; Gas Drop output never
does. The previous estimate is retained until a valid ordinary result replaces it.
This is a request-selection heuristic, not a guarantee of liquidity or an executable
quote. It does not need its own timer. New input always requires new executable quotes.

| Trigger                                                                | Requests and outcome                                                                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Initial load or edits with Gas Drop off                                | Full ordinary only; its KyberCross result determines whether `+Gas` is available.                                   |
| Enable Gas Drop                                                        | Load/reuse Gas Drop; keep existing ordinary comparison results.                                                     |
| Eligible amount/slippage edit while enabled                            | Gas Drop and alternatives in parallel. KyberCross is excluded from the ordinary request.                            |
| Missing prior KyberCross Gas Drop route or estimate at/below threshold | Reset mode and request full ordinary only. Zero/empty amount makes no request.                                      |
| Manual/periodic refresh while enabled                                  | Refresh Gas Drop and alternatives together, without an extra ordinary KyberCross request.                           |
| Disable Gas Drop or select an ordinary row                             | Adopt full ordinary if pending/fresh; otherwise request it, including KyberCross subject to user exclusions.        |
| No usable Gas Drop result                                              | Return to full ordinary using the same reuse rule. An error after usable partial results need not trigger fallback. |
| Pair, recipient, wallet request data or source exclusions change       | Reset mode and invalidate all old pools. Eligible amount/slippage edits are the only carry exception.               |

Confirmed route evidence survives consecutive eligible edits during debounce and
pending streams; a completed result replaces it. A pending Gas Drop request alone,
without a previously confirmed KyberCross allocation, cannot carry the mode.
An unavailable Gas Drop response can require a subsequent full ordinary request;
the estimate avoids unnecessary calls but cannot eliminate this fallback.

## Comparison and selection

Route Options places Gas Drop routes first and sorts each group by net output.
It omits an ordinary provider once that provider has a Gas Drop route. Best Return
compares net output across the whole list; Fastest uses valid nonnegative estimates,
breaking ties by output. Selection changes both provider and mode.

Refreshing alternatives take precedence over the previous full ordinary snapshot.
Once settled, the later completion deadline determines which ordinary result is
newer (both pools use the same TTL). A newly fetched full ordinary result can therefore
take over after switching modes. An empty newer alternatives result clears comparison
rows instead of restoring old rows; the last valid estimate can still be retained.

## Lifetime and review

Input changes clear actionable quotes immediately and debounce fetching for 500 ms.
Each pool owns an abort controller; input changes/unmount cancel its transport and
late results are ignored. Mode changes detach the session without cancelling a pool,
so reselecting a pending mode does not create a duplicate request.

Pools expire 60 seconds after their stream completes. Switching modes or closing
review never extends that deadline. The session schedules refresh from the active
pool; alternatives refresh with Gas Drop, without an independent timer. Pending work
is deduplicated even during a forced refresh. Explicit `+Gas` preparation can retry
an empty result, but confirming a prepared result does not automatically retry it.

`loading` gates quote readiness; `allLoading` tracks the remaining stream. Review
captures the selected current quote after prerequisite checks, pauses refresh and
keeps its snapshot unchanged while live streams continue. Closing review adopts
fresh live results or reloads expired ones. Comparison snapshots and eligibility
references do not bypass the active pool/session when selecting an executable route.

For form composition, approvals and submission, see the [SwapForm README](../../README.md).
