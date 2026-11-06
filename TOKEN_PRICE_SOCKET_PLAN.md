# Real-Time Token Price: Plan and TODO

Updated: 2026-11-05. Status: planning; socket and gateway session integration are not implemented.
Baseline: `origin/main` at `c810cc67a`.

## Sources

- [FE proposal](https://app.notion.com/p/kybernetwork/Real-Time-Token-Price-Proposal-3a726751887e8019a237c250d7809fb2)
- [Market socket contract](https://github.com/KyberNetwork/token-catalog/blob/main/docs/market_socket_integration.md)
- [REST v2 schema](https://github.com/KyberNetwork/token-catalog/blob/main/docs/apiv2/apiv2_swagger.yaml)
- [SRE public API access guide](https://app.notion.com/p/kybernetwork/Public-API-access-frontend-integration-guide-40f26751887e80a7b9f0c91d7bd23b41)

The SRE guide explicitly describes a draft contract. Its hosts and service routes are placeholders.
This plan evaluates FE use cases and implementation work, not deployment readiness or price accuracy.

## Current baseline

Paths below are relative to `apps/kyberswap-interface/src`, unless prefixed with `packages/`.

- `state/tokenPrices/hooks.ts` registers consumers and reads shared prices; it does not fetch directly.
- `state/tokenPrices/registry.ts` deduplicates subscriptions by chain/address with `live` and `once` refcounts.
- `state/tokenPrices/updater.tsx` owns requests, batches mounts, handles retries and tab visibility, and preserves previous prices on request failure.
- `state/tokenPrices/sweep.ts` uses a 10-second TTL for live tokens and batches at most 100 addresses per chain. The updater checks due work every 5 seconds.
- `services/tokenCatalog.ts` calls `POST /v1/public/tokens/prices`. `getMidPrice` requires both buy/sell sides and rejects a spread ratio of 2 or greater.
- `state/tokenPrices/index.ts` stores `undefined` (unresolved), `null` (no trustworthy price), or the numeric mid-price. Hooks retain the existing zero-filled compatibility interface.
- `state/tokenPrices/priceMap.ts` handles address aliases and wrapped-native price fallback.
- `packages/hooks/src/use-token-prices.ts` still polls per hook instance every 10 seconds. Widgets do not share the main app's price service.

Main already has shared polling and consistent prices across its consumers. Socket integration improves delivery latency and avoids repeated batch fetches; it does not introduce those existing shared-state guarantees or improve the underlying price calculation.

## Scope and proposed behavior

Use REST v2 for initial snapshots, explicit refresh, and fallback. Use one shared market socket per application instance for active live tokens. Preserve existing hook contracts where possible.

- Primary stream: `onchainPrice`. Retain the current buy/sell mid-price and spread policy.
- Do not substitute `settlementPrice` for onchain price. Subscribe to settlement only when a separate consumer needs it.
- Apply to Swap reference/fee values, Limit Order market references, wallet/send values, Token Selector, liquidity/rewards, gas-cost estimates, and campaign valuations using this shared flow.
- Keep `TokenPriceChart`, execution quotes/builds, and transaction execution outside this migration.
- Keep large catalogs and `once` consumers on REST; subscribe selectively to visible or actively used tokens.
- Embedded widgets reuse the host's price service. Standalone widgets share one service within their instance once their access model is defined.
- Stats remain REST-backed. Socket stats and KyberScore are not current deliverables.

Expected benefits: updates without waiting for the next poll, fewer repeated full-batch requests, explicit source-health metadata, and less duplicated widget polling after service sharing. Savings depend on event frequency; unchanged prices can arrive with newer timestamps. Batch state updates and skip unchanged price writes to avoid unnecessary renders.

## Contract reference from the three source documents

This section captures implementation-relevant contracts; the linked documents remain the source for full examples and future changes. REST v2 schema details above also use the linked Swagger supplement. Choosing onchain mid-price, retaining REST for `once` consumers/overflow, and separating price metadata are FE design proposals, not additional backend guarantees.

### Market connection and requests

- Direct service route: `wss://<host>/api/v2/public/tokens/market/socket?mode=<mode>&api_key=<key>`. The service guide requires `api_key`; `mode` defaults to `standalone`. The SRE gateway's cookie-only route has not yet been mapped to this endpoint.
- Frames are JSON text. Stream identity is `<chainId>:<address>@<kind>`; Solana uses chain ID `101` and case-sensitive addresses. EVM output addresses are lowercase.
- `SUBSCRIBE` and `UNSUBSCRIBE`: `{ "method": "SUBSCRIBE", "params": ["<stream>"], "id": 1 }`. Success is `{ "result": null, "id": 1 }`.
- `LIST_SUBSCRIPTIONS`: `{ "method": "LIST_SUBSCRIPTIONS", "id": 2 }`; reply contains the current stream array in `result`.
- Request ID is required: integer or string of at most 36 characters. Request limits apply to all methods, not only subscribe.
- A successful subscribe ack precedes current values for streams that have data. Duplicate subscription is a no-op with no new snapshot; unsubscribing an absent stream is harmless.
- Subscription validation is atomic: one invalid stream or a cap violation rejects the whole request.
- Limits: 200 streams/request, 1024 streams/host connection, 200/standalone connection, at most 5 requests/second, 32 KB/client message, approximately 20 connections/API key. The example paces requests every 250 ms (4/second).

### Market events and REST mapping

Common price event keys are `e` (kind), `E` (Unix milliseconds), and `s` (`<chainId>:<address>` without kind). Prices are decimal strings.

| Event | Payload | REST mapping / behavior |
| --- | --- | --- |
| `onchainPrice` | `bp`, `bt`, `sp`, `st` | Buy/sell USD and source times map to `price.onchain.buy/sell.usd/atMs`. `E = max(bt, st)` over available sides. Each event carries the current available sides, not only the changed side; a side never priced is omitted. |
| `settlementPrice` | `p`, `t`, `ep`, `bn` | Maps to `price.settlement.usd`, `asOfMs`, and `cursor.epoch/blockNumber`. `t = E`; epoch increases after reorganization. An initial value older than 12 hours is omitted, corresponding to REST `usd: null`. |
| `heartbeat` | `e`, `E` | Sent every 20 seconds; there is no token identity. Reconnect after 45 seconds with no message of any kind. |
| `status` | `e`, `E`, `c`, `k`, `d` | `c` is chain ID, `k` is kind, `d: true` means degraded. Events for that chain/kind stop; `d: false` resumes delivery with newer current values. |

If a chain/kind is already degraded, the first subscription to it on the connection receives `status` with `d: true`. Health is independent per chain/kind. A quiet token does not imply source failure.

Onchain ordering uses `E`, accepting equal-time changed content and ignoring duplicates. REST reconciliation uses each side's source timestamp. Settlement ordering uses `(ep, bn)`; larger epoch wins even if block number falls. The guide's settlement example accepts equal cursors (`>=`), while its prose defines strictly newer cursors; establish explicit equal-cursor handling if settlement is added.

Reconnect starts a new subscription set; there is no resume/replay. Resubscribe desired streams and merge current values with newer-only rules. Backoff starts at 1 second and doubles to a 30-second base cap, plus jitter.

Planned `stats_<window>` kinds (1h, 4h, 24h) are not available on the socket; use REST `stats.<window>`. `ksScore` is not in the public API yet. An unsupported/planned kind currently rejects the entire subscribe request.

### Market errors and closes

Error replies are `{ "code": 103, "msg": "...", "id": 1 }` and leave the socket open.

| Code | Meaning / handling |
| --- | --- |
| 2 | Invalid request, method, ID, params, or unsupported kind; fix request. |
| 3 | Invalid JSON; fix serialization. |
| 100 | Unsupported chain. |
| 101 | Invalid address. |
| 102 | More than 200 streams in one request; split the batch. |
| 103 | Connection subscription cap reached; free subscriptions or retain REST coverage. |
| 104 | Read failure: message distinguishes nothing subscribed (retry subscribe later) from streams subscribed without current values (keep subscription and recover snapshot through REST). |
| Close 4401 | Missing/invalid service API key; do not retry in a loop. This differs from gateway session close 4001. |
| Close 4408 | Client reading too slowly; reduce handler work before reconnecting. |
| Close 4429 | Too many connections for the service API key. |
| Close 4430 | More than 5 requests/second; slow request pacing. |
| Close 1001 | Server shutting down; reconnect with backoff. |
| HTTP 503 before upgrade | Server full; browser reports connection failure, retry with backoff. |

### SRE session contract (draft)

Public environment configuration: `API_BASE`, `TURNSTILE_SITE_KEY`, `TURNSTILE_ACTION` (guide value `issue_token`), and allowed page origins. The Turnstile secret stays on the backend. The guide mentions an empty API base with a local dev proxy but does not supply the proxy setup.

- Load `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` once. Render with `execution: 'execute'` and `appearance: 'interaction-only'`; provide a container for visitors who need a challenge.
- Turnstile responses are single-use and expire in 5 minutes. Reset/re-execute for a fresh response immediately before token issuance.
- Both auth success responses set an HttpOnly cookie and return only `{ "expires_in": 600 }`; the credential is never returned in the response body. Use the returned duration, not a hardcoded expiry.
- Renew on the next request when less than 60 seconds remain. Do not refresh idle tabs on a timer. Parallel callers share one refresh.

| Endpoint / result | Contract and FE handling |
| --- | --- |
| `POST /auth/refresh` | No body, cookie only. 200 renews session; 401 triggers Turnstile and issuance; 429 honors Retry-After. |
| `POST /auth/token` | JSON `{ "turnstile_token": "..." }`. 400 means missing token; 403 means Turnstile/origin failure; retry issuance once with a fresh challenge, then show a refresh-page message; 429 honors Retry-After. |
| Gateway REST `/service-a/*` | Cookie only. 401 forces renewal and retries the request once; 403 means origin not allowed; 429 is rate limited. `/bff/*` is planned to use the same model. |
| Gateway WebSocket `/service-b` | Cookie sent automatically during handshake. Ensure session before connect/reconnect. Close 4001 means renew immediately; a rejected handshake may appear only as 1006, indistinguishable from network failure. |

Every gateway REST fetch uses `credentials: 'include'` (Axios: `withCredentials: true`), without an Authorization header. All HTTP 429 responses carry `Retry-After` in seconds; gateway error bodies use `{ "error": "<code>" }`, distinct from market-service errors. Cloudflare can drop long-lived sockets at any time, so reconnection and subscription recovery are required even with a valid session.

### Proposal responsibilities and trade-offs

The proposal requires REST and stream data to use the same normalized source, plus connection-to-token and token-to-connection subscription mappings on the backend. Broker partitioning by chain/hash with gateway filtering is an infrastructure option when per-token topic cardinality is unsuitable; FE does not implement it.

The shared service must support host-provided and standalone widget modes without per-hook sockets. Freshness metadata and explicit missing-price state are FE responsibilities in addition to transport changes. Added costs include connection fan-out infrastructure, ordering/recovery logic, event batching, and sufficient REST capacity during a socket outage. Source selection and transport do not replace execution quotes or the chart's separate data source.

## TODO

### 1. Confirm the gateway contract needed by FE

- [ ] Map real environment hosts and REST/socket routes to the SRE gateway; do not ship the guide's example hosts or `/service-a` and `/service-b` placeholders.
- [ ] Obtain the public Turnstile site key, action, allowed origins, and local development/proxy configuration.
- [ ] Confirm whether browser market access is cookie-only through the gateway and how the market service's `api_key` contract is handled upstream.
- [ ] Confirm how the documented approximately 20 connections per API key applies behind the gateway, including multiple users and tabs.
- [ ] Define standalone widget access on third-party origins, including allowed origins and cookie restrictions. Main-app access does not automatically cover arbitrary embedding sites.
- [ ] Document supported chains, native-token address handling, and the chosen REST fallback when a chain/kind is unavailable.

### 2. Shared API session

- [ ] Add one session manager shared by REST and socket consumers. Coalesce concurrent refresh/issue requests into one in-flight promise.
- [ ] Try `POST /auth/refresh` first; only a 401 triggers Turnstile and `POST /auth/token`.
- [ ] Load Turnstile once, execute on demand, and support the visible challenge/error path. Obtain a fresh single-use response when issuing a session.
- [ ] Use HttpOnly cookies with `credentials: 'include'`; keep token values out of JS state/storage and Authorization headers.
- [ ] Track `expires_in`; renew on demand near expiry, without an idle refresh timer.
- [ ] Renew and retry REST once on 401; bound retries for a failed Turnstile issue and honor HTTP 429 `Retry-After`.
- [ ] Ensure the session before every socket connection. On session-expiry close 4001, renew before reconnecting; handle generic handshake failure/1006 with backoff.

### 3. REST v2 snapshot and price state

- [ ] Add typed GET/POST market clients: GET uses `chainId` and `addresses`; POST uses `{ tokens: { [chainId]: addresses }, windows? }`, with up to 100 tokens per chain.
- [ ] Normalize `data.chains[chainId].tokens[address]`, onchain buy/sell values and timestamps, and chain-level degradation metadata.
- [ ] Keep decimal strings in the transport/normalization layer and use decimal arithmetic. Convert deliberately at the existing numeric hook boundary; preserve mid-price/spread semantics.
- [ ] Store source timestamps and freshness separately from the canonical numeric price so metadata-only changes do not rerender all price consumers.
- [ ] Resolve missing prices explicitly from REST. A socket SUBSCRIBE ack does not mean a price exists, and an unpriced stream sends no snapshot; loading must still settle.
- [ ] Preserve address aliases, wrapped-native fallback, stable hook result references, and last-known prices on transient failures.
- [ ] Keep explicit `refetch()` REST-backed: subscribing an already active stream does not resend its snapshot.

### 4. Shared socket and subscriptions

- [ ] Implement one connection owner for the app, outside individual hooks and presentation components.
- [ ] Derive desired streams from the existing registry/refcounts. Subscribe when the first live consumer arrives; unsubscribe when the last live consumer leaves.
- [ ] Coalesce mount/unmount bursts and track desired, pending, and acknowledged subscriptions, including rejected batches.
- [ ] Use `<chainId>:<address>@onchainPrice`; lowercase EVM addresses while preserving case for Solana if supported by the consumer.
- [ ] Batch at most 200 streams per request, stay below 5 requests/second, and respect the 32 KB outbound message limit.
- [ ] Enforce caps of 1024 streams in host mode and 200 in standalone mode. One token/kind pair is one stream; adding settlement consumes another slot.
- [ ] Prioritize active/visible tokens and use REST for overflow; do not open extra sockets merely to bypass the cap.
- [ ] Handle request IDs/acks and errors, including atomic subscribe rejection and the two error-104 outcomes (nothing subscribed versus subscribed without snapshot).
- [ ] Ignore unknown event types/fields. Prevent late callbacks from a replaced connection from mutating current state.
- [ ] Clean up sockets, pending queues, watchdogs, and reconnect timers on disposal.

### 5. Ordering, health, and recovery

- [ ] Reconcile REST and socket onchain sides using `bt`/`st` versus REST `atMs`; a delayed REST response must not overwrite newer socket data.
- [ ] Order onchain stream events by `E`; allow equal-time changed content and ignore true duplicates. Preserve side timestamps for subsequent snapshot merging.
- [ ] If settlement is introduced, compare `(ep, bn)` with REST `(epoch, blockNumber)` and handle its 12-hour missing-price rule separately.
- [ ] Track heartbeat/last-message receipt. Reconnect after 45 seconds without any message; quiet token prices alone do not mean the connection is dead.
- [ ] Track `status` degradation by chain and kind. Preserve last-known values with stale metadata and use REST fallback without implying the upstream source recovered.
- [ ] Reconnect with exponential backoff and jitter; renew session as needed and resubscribe the current desired set. No historical replay is required for latest-price UI.
- [ ] Avoid concurrent polling and socket delivery for healthy live streams. Define visibility/resume behavior and bounded fallback scheduling during outages.
- [ ] Batch incoming state writes and skip unchanged numeric prices, including events that only advance timestamps.

### 6. Consumers and widgets

- [ ] Preserve `useTokenPrices` / `useTokenPricesWithLoading` signatures, initial loading behavior, and manual refresh behavior.
- [ ] Audit Token Selector/list consumers so large hidden/offscreen lists do not exhaust the subscription budget; retain REST data needed for full-list sorting.
- [ ] Expose freshness to consumers that need it without forcing a broad UI redesign.
- [ ] Provide a feature-scoped price-service interface for host-provided widgets; reuse host session, socket, and prices.
- [ ] Replace per-hook widget polling with a shared instance service in standalone mode after its access contract is defined.
- [ ] Include Zap Create, Liquidity, Compounding, and the separate Pancake Liquidity REST path in the widget migration audit.

### 7. Verification when implementation starts

- [ ] Test subscription refcounts, batch/cap limits, acknowledgement failures, reconnect cleanup, and resubscription of the current desired set.
- [ ] Test REST/socket races, equal-time changes, duplicates, missing/one-sided prices, spread rejection, native fallback, and chain/kind degradation.
- [ ] Test session refresh coalescing, bounded 401/403 retries, Retry-After handling, and session-expiry reconnect.
- [ ] Run targeted lint/type checks and existing token-price tests for changed code.
- [ ] Verify browser session/cookie/Turnstile behavior, network loss/recovery, tab resume, token-list changes, and widget host sharing; report these separately from automated checks.
- [ ] Compare request/event counts and render frequency against current polling before claiming bandwidth or rendering savings.

## Preparation completed

- [x] Read the FE proposal, market socket/REST contracts, and SRE access guide.
- [x] Inspect the current shared polling registry and widget polling baseline.
- [x] Check out `temp-token-price-socket`, preserve a backup ref, and rebase onto `origin/main` at `c810cc67a`.
- [x] Replace the old no-polling assumptions with this current implementation checklist.
