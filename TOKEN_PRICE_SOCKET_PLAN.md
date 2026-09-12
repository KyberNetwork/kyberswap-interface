# Real-Time Token Price Proposal

## Objective

Improve the freshness and consistency of token prices used across the application by adding socket updates on top of the existing REST flow.

Socket delivery improves accuracy in terms of **freshness and consistency across FE modules**. It does not improve the underlying price-calculation algorithm.

## Current REST Flow

```text
FE Module
    |
    v
useTokenPrices / useTokenPricesWithLoading
    |
    v
POST /v1/public/tokens/prices
    |
    v
Shared Token Price State
    |
    v
USD values and reference market rates
```

The current FE flow is owned by:

- `state/tokenPrices/hooks.ts`: collects token addresses, requests prices, and exposes them to FE modules.
- `services/tokenCatalog.ts`: calls the token price REST endpoint.
- `state/tokenPrices/index.ts`: stores resolved prices by token address and chain.

### FE modules using this flow

- Swap reference prices and fee USD values.
- Limit Order market rate and order value comparison.
- Wallet balances and send-token USD values.
- Token Selector sorting and displayed prices.
- Liquidity positions, add/remove liquidity, and reward valuation.
- Gas-cost estimation and campaign valuation.

`TokenPriceChart` and swap execution quotes use separate data sources and are not part of this proposal.

### Zap Widget packages

Zap Create, Liquidity, and Compounding Widgets do not use the main FE token price state. They use the shared `@kyber/hooks/useTokenPrices` hook, which calls the same REST endpoint and polls every 10 seconds. Pancake Liquidity Widget has a separate direct REST implementation.

Because each hook instance manages its own polling, multiple price consumers inside one widget can create duplicated requests.

## Current Limitations

| Limitation | Current impact |
| --- | --- |
| No continuous refresh | A token is fetched automatically only when missing. There is no global polling or freshness policy. |
| Inconsistent refresh | Limit Order supports manual refresh, while many other modules can keep the first loaded price for the session. |
| REST batching | FE splits requests into batches of up to 100 addresses. High-frequency polling would repeat requests for unchanged tokens. |
| No freshness metadata | Shared state has no price timestamp or stale status, so FE modules cannot determine whether a price is current. |
| Ambiguous missing value | Missing or failed prices are commonly exposed as `0`, making missing, failed, and valid values difficult to distinguish. |

The 100-address batch size is the known FE limit. BE request size, rate limits, and freshness guarantees are not defined in this repository and must be confirmed by the BE token price service.

Polling can reduce staleness, but at the cost of higher API, network, and FE load.

## Recommended Solution

Keep REST for initial loading and fallback, then use one shared socket connection to receive incremental updates for tokens currently used by active FE modules.

```text
                         ┌── REST snapshot / recovery ──┐
FE Modules ───────> Shared FE Price Module              ├──> Normalized Price State
                         └── Socket subscriptions ──────┘
```

### BE price stream

The BE token price service should expose a stream that:

- Supports subscription by `chainId + tokenAddress`.
- Sends the latest normalized token price.
- Includes a price timestamp and ordering value.
- Uses the same normalized price source as the REST endpoint.
- Supports unsubscribe, reconnect, and snapshot recovery.

### FE–BE socket interaction

FE should maintain one socket connection and send token subscriptions in batches:

```text
One FE instance
    |
    v
One socket connection
    |
    v
Subscription set: [chainId + tokenAddress, ...]
```

A token subscription is a logical key on the shared connection, not a separate socket connection or physical channel.

BE should maintain both mappings:

- Connection to subscribed tokens.
- Token to interested connections.

This allows subscriptions to be deduplicated and updates to be sent only to interested FE connections. Subscribe and unsubscribe changes should be batched, with an agreed maximum number of tokens per connection.

Large token lists should subscribe only to active or visible tokens and continue using REST for the remaining catalog. If the internal message broker does not support high topic cardinality efficiently, events can be partitioned by chain or hash and filtered by the streaming gateway.

### Shared FE price module

The existing token price module should:

- Load the initial snapshot through REST.
- Maintain one socket connection per FE application instance.
- Subscribe only to tokens requested by active FE modules.
- Store the latest normalized price for each token and chain.
- Track update time and stale status.
- Use REST when the socket is unavailable or synchronization is uncertain.
- Keep the existing FE price interface where possible to avoid changing every FE module.

### Zap Widget integration

Widgets should support two price-service modes:

- **Host-provided:** reuse the host FE price state and socket connection when the widget is embedded in KyberSwap Interface.
- **Standalone:** create one shared price module for the widget instance, using REST for the initial snapshot and fallback, plus one socket connection for active token subscriptions.

Individual hooks or components inside a widget should not create their own socket connections. The current `useTokenPrices` interface should remain unchanged where possible.

## How This Addresses the Issues

| Current issue | Socket-based improvement |
| --- | --- |
| Price remains unchanged after initial load | Incremental updates keep active tokens fresh |
| Modules refresh at different times | Shared stream provides a consistent update source |
| Frequent polling creates repeated requests | BE pushes only relevant price updates |
| FE modules cannot detect stale prices | Timestamp and connection state provide freshness |
| Missing price is represented as `0` | Normalized state can represent missing and stale explicitly |

## Trade-Offs

### Benefits

- Fresher USD values and market reference rates.
- Consistent prices across active FE modules.
- Fewer repeated REST requests than high-frequency polling.
- Measurable freshness and stale-data handling.

### Costs and risks

- Additional BE infrastructure for connections and subscription fan-out.
- Reconnect, ordering, and missed-update recovery must be handled.
- High-frequency events can cause unnecessary FE updates without batching.
- Large token lists must use selective subscriptions rather than subscribing to every token.
- REST capacity must still support fallback during a socket outage.
