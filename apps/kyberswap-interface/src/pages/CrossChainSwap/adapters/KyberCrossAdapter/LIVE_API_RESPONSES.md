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

## `POST /api/v1/quotes`

The frontend sends chain/token metadata, sender and recipient addresses, amount, slippage, optional partner fee, and optional bridge filters. `all_route_plans` exists in the response contract checks but is not currently sent by the frontend.

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
  "partner_fee_bps": 10,
  "partner_fee_recipient": "0x2222...2222",
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

- It selects `route_plans[0]`.
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
