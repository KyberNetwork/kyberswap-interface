# KyberCross APIs Used by the Frontend

This is an FE-owned record of the KyberCross endpoints called by `KyberCrossAdapter`.
It intentionally covers only active frontend call sites and is not a complete backend API specification.

Base URL in the checked environment:

```text
https://pre-kybercross.kyberengineering.io
```

Last checked: 2026-08-11.

## Verification status

| Endpoint                 | FE call site                 | Live verification                                                                                      |
| ------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `POST /api/v1/quotes`    | `kyberCrossApi.getQuote`     | HTTP 200 responses verified with Across, Relay, CCTP V2, and CCTP V2 Fast routes                       |
| `POST /api/v1/builds`    | `kyberCrossApi.build`        | HTTP 200 response verified using a fresh route plan from `/quotes`                                     |
| `GET /api/v1/executions` | `kyberCrossApi.scanTxStatus` | HTTP 200 success response verified for an Across route; `route_not_found` error envelope also verified |

## Common response envelope

Successful requests observed:

```json
{
  "request_id": "...",
  "success": true,
  "data": {}
}
```

Failed requests observed:

```json
{
  "request_id": "...",
  "success": false,
  "error": {
    "code": "route_not_found",
    "message": "...",
    "details": {}
  }
}
```

## Internal testing modes

The selector at the top of the cross-chain form switches between **KyberCross Direct**
(default) and **Aggregator Stream**. The selected mode persists across reloads.
Changing mode cancels the previous quote request, clears its quotes/selection, and
resets source exclusions because direct mode filters bridges while stream mode filters
aggregator adapters. The pair and amount stay unchanged.

Direct mode requests every KyberCross route plan and builds the selected plan on confirm.
Stream mode requests all enabled aggregator sources and executes the supplied KyberCross
transaction. UI fees are zero for direct KyberCross quotes and all stream sources.

## Aggregator PRE stream (2026-09-28)

`GET https://pre-crosschain-aggregator.kyberengineering.io/api/v1/quotes?stream=true`
returns KyberCross events with `provider: "kybercross"` and this raw quote shape:

```text
rawQuote.data.route_plan: { id, expires_at, bridge: { provider, ... }, ... }
rawQuote.data.build: { expires_at, tx: { to, data, value } }
```

The singular route is a summary: it omits the full bridge metadata needed to rebuild.
Stream execution uses the supplied `build.tx`; direct execution builds `route_plans[0]`.
Both paths use the same allowance checks, simulation, transaction submission, and status API.
Provider display reads either route shape.

Internal stream testing sends `fee=0` for all sources in a single request.
Provider/bridge fees remain backend-owned. The observed KyberCross events contain
`platformFeePercent: 0` and omit `protocolFee` (normalized to zero).

Live quote checks succeeded for Ethereum USDC → Base USDC (Across) and Base ETH →
Arbitrum USDC (Near Intents), using `includedSources=KyberCross`. These were quote-only
requests; no wallet transaction was submitted. Near Intents stream metadata omitted the
deposit address, so the transaction ID falls back to its source hash; status lookup uses
the source hash in both cases.

Direct and stream requests were compared again at 16:20 ICT with matching tokens,
amounts, sender/recipient, slippage, and zero UI fee. All four requests returned HTTP 200:

| Pair                      | Direct request ID                      | Stream KyberCross request ID           |
| ------------------------- | -------------------------------------- | -------------------------------------- |
| Ethereum USDC → Base USDC | `406e2a9e-aca7-4937-9b5f-93deaadbde50` | `51ac88bc-5c8f-49eb-917d-65550fb6a440` |
| Base ETH → Arbitrum USDC  | `8cd3584f-e442-481d-b8f6-f8dbcc7c5b34` | `cfdb2b17-cad0-4694-8c31-9b5687feb115` |

Both direct responses had `data.route_plans`, `ks_allowance_hub_address`, and
`bridge.metadata`, with no built transaction. Both stream responses had
`rawQuote.data.route_plan` and `build.tx`, with no `bridge.metadata`.
All four selected Across in this comparison; provider selection can vary between requests.

## `POST /api/v1/quotes`

The frontend sends chain/token metadata, sender and recipient addresses, amount, slippage, and optional bridge filters. Internal testing uses `partner_fee_bps: 0` and omits the partner fee recipient. The request sets `all_route_plans: true` to receive multiple route plans; each returned route plan becomes a separate option in Route Options, sorted by net output. The selected option owns the route used for execution.

Representative FE request:

```json
{
  "from_chain": "ethereum",
  "from_token": "0xa0b8...eb48",
  "from_token_decimals": 6,
  "from_address": "0x1111...1111",
  "to_chain": "base",
  "to_token": "0x8335...2913",
  "to_token_decimals": 6,
  "to_address": "0x1111...1111",
  "refund_address": "0x1111...1111",
  "amount": "10000000",
  "slippage_bps": 50,
  "partner_fee_bps": 0,
  "all_route_plans": true,
  "include_bridges": ["across", "relay"],
  "exclude_bridges": ["cctp_v2_fast"]
}
```

Observed HTTP 200 response shape:

```json
{
  "request_id": "...",
  "success": true,
  "data": {
    "ks_allowance_hub_address": "0x...",
    "route_plans": [
      {
        "id": "019fe9af-...",
        "request": {},
        "flow_type": "swap_bridge_swap",
        "expected_output_amount": "9777362",
        "min_output_amount": "9728475",
        "expires_at": "2026-08-10T03:22:01.638075367Z",
        "fees": [
          {
            "type": "protocol_fee",
            "charged_on": "bridge_output"
          }
        ],
        "source_swap": {},
        "dest_swap": {
          "token_in": "0x...",
          "token_out": "0x...",
          "input_amount": "5095918266323226",
          "expected_output_amount": "9777362",
          "min_output_amount": "9728475",
          "metadata": {},
          "intent": {}
        },
        "bridge": {
          "lane_id": "...",
          "provider": "relay",
          "from_token": "0x...",
          "to_token": "0x...",
          "input_amount": "...",
          "expected_output_amount": "...",
          "min_output_amount": "...",
          "expected_fill_time_sec": 3,
          "metadata": {
            "execution_mode": "deposit_address",
            "deposit_address": "0x..."
          }
        }
      }
    ]
  }
}
```

Observed fee variants:

| `type`         | `charged_on`    |
| -------------- | --------------- |
| `partner_fee`  | `bridge_input`  |
| `protocol_fee` | `bridge_output` |

Observed bridge metadata variants:

- Across: `spoke_pool_address`, amounts, source/destination addresses and chain ID, relayer/timing fields.
- Relay direct bridge: `execution_mode: "depository"`, `depository_address`, `from_address`, `order_id`.
- Relay swap route: `execution_mode: "deposit_address"`, `deposit_address`.
- CCTP V2 and Fast: source/destination domain IDs, mint/caller addresses, finality and fee fields.
- Mayan and Near Intents remain modeled because they are selectable KyberCross providers, but their current metadata variants were not captured in this verification pass.

Frontend-owned behavior:

- Each route plan is normalized into its own selectable quote with its output, price impact, time estimate, and bridge provider.
- Each option retains only its own route in `rawQuote.data.route_plans`, so display and execution use the selected plan.
- Route duration uses `estimated_duration_sec` at the route root, not `bridge.expected_fill_time_sec`.
- Route Options displays the API-provided `tags`: `RECOMMENDED`, `FASTEST`, and `BEST_OUTPUT`. Multiple tags can appear on a route; unknown tags are ignored.
- Selection uses the route ID rather than adapter name. If a refresh replaces that ID, selection falls back to the best current quote.
- `expected_output_amount` becomes the estimated output.
- `ks_allowance_hub_address` is used for ERC-20 approval.
- The selected route plan is retained unchanged and submitted to `/builds`.

## `POST /api/v1/builds`

Request body: the complete selected `RoutePlan` object returned by `/quotes`. Do not reconstruct or rename fields before submission.

Observed HTTP 200 response:

```json
{
  "request_id": "...",
  "success": true,
  "data": {
    "tx": {
      "to": "0x455c...d618",
      "data": "0xea6e7a04...",
      "value": "0"
    },
    "expires_at": "2026-08-10T03:22:01.638075367Z"
  }
}
```

`tx.gas` is optional and was absent from the verified response.

An expired route plan returned HTTP 400 with `error.code: "invalid_argument"` and its expiration timestamp in `error.details.expires_at`.

## `GET /api/v1/executions`

The frontend calls this endpoint with `source_tx_hash` as its only query parameter. It does not request or use the route plan.

Observed HTTP 200 response shape for source transaction `0x3de4...b7e`:

```json
{
  "request_id": "...",
  "success": true,
  "data": {
    "route_execution": {
      "route_plan_id": "019fe9be-...",
      "from_address": "0x...",
      "to_address": "0x...",
      "source_chain": "base",
      "dest_chain": "arbitrum",
      "flow_type": "swap_bridge_swap",
      "source_tx_hash": "0x3de4...b7e",
      "dest_tx_hash": "0x1bca...92a",
      "token_in": "0x...",
      "token_out": "0x...",
      "bridge_provider": "across",
      "route_state": "SUCCESS",
      "fund_state": "SETTLED_OUT",
      "data": {
        "bridge": {
          "source": {
            "tx_hash": "0x3de4...b7e",
            "token": "0x...",
            "amount": "3116100"
          },
          "dest": {
            "tx_hash": "0xd025...b1d",
            "token": "0x...",
            "amount": "3110432"
          }
        },
        "dest_swap": {
          "token_in": "0x...",
          "token_out": "0x...",
          "output_amount": "4747"
        }
      }
    }
  }
}
```

Important lookup behavior:

- The endpoint is indexed by `source_tx_hash`.
- `route_execution.dest_tx_hash` is the final destination action shown by the frontend history (the destination swap in the verified samples).
- `route_execution.data.bridge.dest.tx_hash` is only the bridge destination/fill transaction. It is used as a fallback for routes without a destination swap or withdrawal, never as the final hash of a route that has a destination action.
- The bridge destination hash and final destination hash are not valid lookup keys and returned `route_not_found` when queried directly.
- In the verified Across route, the source, bridge destination, and final destination transactions all had successful on-chain receipts.
- The recorded destination swap output (`4747`) was above the route minimum (`4723`), matching the backend's `SUCCESS / SETTLED_OUT` classification.
- A second Across `bridge_then_swap` sample (`0x1b88...ef47`) confirmed the distinction: bridge fill `0x4365...2068`, final destination swap `0x3708...c613`, and final wstETH output `2036809133738388`.

Nine additional Relay, Mayan, refund, or destination hashes checked on 2026-08-10 returned HTTP 404:

```json
{
  "success": false,
  "error": {
    "code": "route_not_found",
    "message": "..."
  }
}
```

Successful status variants other than `SUCCESS / SETTLED_OUT` still need live samples. In particular, `REFUNDED`, `FAILED`, and intermediate route states remain modeled from the backend schema update rather than this verification pass.

## Maintenance checklist

When the backend contract changes:

1. Query `/quotes` with `all_route_plans: true` and explicit `include_bridges` to capture provider variants.
2. Query again with a non-zero partner fee to verify every fee discriminator.
3. Immediately submit a fresh returned route plan to `/builds`; route plans expire quickly.
4. Query `/executions?source_tx_hash={txHash}` with a known transaction that still exists in the same environment.
5. Update `api.ts`, adapter call sites, focused status tests, and this document from the observed JSON.

## Gas Drop feature switch

Cross-chain Settings has a Gas Drop feature switch, OFF by default and persisted locally.
When OFF, Gas Drop controls and recipient gas checks are disabled and quotes do not opt in.
When ON, users can opt in through the Gas Drop icon/panel for supported routes in KyberCross Direct mode.
The original route-specific opt-in remains OFF by default and resets on destination changes.
The selected quote mode takes priority: Aggregator Stream does not support Gas Drop,
so its controls stay hidden and the feature switch has no effect on stream quotes. Turning the feature OFF does not
hide Gas Drop settlement details on past transactions.

## Gas Drop — checked 2026-09-23

Live `POST /api/v1/quotes` probes used 100 USDC on Arbitrum to USDC on Base,
then USDT on BSC, with a public placeholder address (no wallet transaction sent).

- Opt in with `gas_drop: true`; omitted/false preserves the ordinary quote.
- Inclusion is the presence of `route_plan.gas_drop_swap`, not an `included` field.
- `expected_output_amount` and `min_output_amount` at the route root already exclude
  the gas allocation. Do not subtract it again in the frontend.
- `gas_drop_swap` provides raw `expected_output_amount`, `min_output_amount`,
  `input_amount`, and `token_in`. Its `metadata.route_summary` includes USD amounts.
- Both Base and BSC returned about **$1** of native gas and a minimum equal to
  **80%** of expected native output. These differ from the product document's
  $2/10% assumptions. The UI uses the quote, with no client-side amount override.
- Base example: main output `98958409` USDC units; native expected
  `361515123138071`, minimum `289212098510456`; gas input `1002716` USDC units.
  A separate OFF probe returned `99986139` USDC units.
- A 0.5 USDC ON probe returned `route_not_found`. Native destination output with
  Gas Drop returned `invalid_argument` (`gas drop is not supported when to_token is native`).
- A fresh ON quote was posted unchanged to `/api/v1/builds`: success, with
  `data.tx.{to,data,value}`. Its root `dest_intent` must be retained even when
  `flow_type` is `bridge_only`.

Tracking schema checked against `KyberNetwork/kybercross/docs/api/openapi.yaml`
and the public execution handler on the same date (no live Gas Drop settlement
was broadcast or verified): `data.gas_drop` exists only after successful gas
execution; `data.withdraw` is the main withdrawal; `data.refund` includes its
chain. `GAS_DROP_PENDING` is an in-progress route state. A terminal destination
settlement without `gas_drop` must not be displayed as native gas delivered.
