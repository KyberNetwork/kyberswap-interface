# BE-backed transaction history guideline

Status: proposed implementation guideline for Unified Swap, agreed direction on
2026-10-26. This document does not indicate that the APIs are deployed or that the
frontend migration has been implemented.

## Scope

The new transaction APIs cover cross-chain aggregator transactions only. They do
not cover same-chain swaps executed through the existing router flow. Same-chain
history remains under `state/transactions` until the backend exposes a separate
contract for it.

Reviewed contract: OpenAPI 1.11.0 supplied as
`/Users/neikop/Downloads/openapi.yaml`. This is a developer-local attachment, not
a repository dependency. Reconfirm the published contract before implementation.
The design context is the Notion TDD (marked Draft, updated 2026-10-23):
<https://app.notion.com/p/3fe26751887e81028810c23106d88ae2>.

## Decision

Use a hybrid transition flow:

- FE gives the user an immediate result with the existing provider status flow.
- FE registers the source transaction with BE in parallel.
- BE owns durable history; its verified final result is canonical for settlement.
- Local storage keeps only the reconciliation outbox and short-lived display data;
  it is not a second permanent history database.

FE must not wait for BE before showing that a source transaction was submitted.
The BE record API only stores the row; its tracker may return
`verification: pending` and `status: unknown` for the first requests.

## Target flow

1. The quote response, including SSE, carries `quoteId` and `quoteToken`.
2. The selected quote keeps those fields through review and execution.
3. After the wallet returns `sourceTxHash`, FE immediately creates a local
   `pendingSync` record and keeps the current FE provider polling active.
4. FE calls `POST /api/v1/transactions` with:

   ```json
   {
     "quoteToken": "...",
     "sourceTxHash": "..."
   }
   ```

   The request is safe to retry for the same quote and hash.
5. FE polls
   `GET /api/v1/transactions/{sourceTxHash}?chain=...&quoteId=...` while the
   local record is unresolved.
6. History merges the BE list with local unresolved records using the status
   precedence below. Match records by source chain + source hash + quote ID; after
   acceptance, use the BE UUID for server records. Do not confuse the aggregator
   quote ID with a provider-specific quote/request ID.
7. Once BE has a verified final result and the row is present in
   `GET /api/v1/transactions?sender=...`, FE stops provider polling for that row,
   removes its outbox entry, and retains only any required token display metadata.
   Only an explicit matching row establishes presence; absence from one cursor
   page is not evidence that BE deleted a transaction.

The list endpoint returns only `verification: verified` rows. A just-submitted
transaction therefore remains in the local overlay until verification; it must
not disappear merely because it is absent from the list response.

## Status ownership

Keep separate fields instead of writing all results into one `status` value:

| Field | Owner | Meaning |
| --- | --- | --- |
| `feStatus` | FE provider adapter | Fast, provisional result during migration |
| `recordingStatus` | FE/API boundary | `queued`, `recorded`, `retryable_error`, `permanent_error` |
| `verification` | BE | `pending`, `verified`, `mismatched`, `not_found` |
| `backendStatus` | BE | `unknown`, `in_progress`, `success`, `failed`, `refunded` |

Here, **resolved** means `verification === 'verified'` and status is one of
`success`, `failed`, or `refunded`. Verification alone is not settlement.

| BE state | FE state | Display and reconciliation |
| --- | --- | --- |
| Not recorded, pending, or unknown | Any | Use FE result provisionally; retry registration or detail as appropriate |
| Verified, in progress | Processing/unknown | Show Processing and continue reconciliation |
| Verified, in progress | Success/Failed/Refunded | Keep the FE terminal result provisionally; BE may lag and must not regress it to Processing |
| Verified, terminal | Any | Use BE terminal result and available actual values; stop provider polling |
| Mismatched/not found | Any | Show a verification/tracking problem separately from the provider result; stop ordinary BE polling |
| Expired, nonterminal | Any | Show tracking expiry separately; stop ordinary BE polling and retain the last known outcome |

If a verified BE terminal result contradicts an FE terminal result, reconcile to
BE and record the discrepancy for diagnosis. Keep this conflict path explicit;
do not silently mix amounts from one result with the status from another.

If FE reports success before BE, the UI may show success provisionally, but FE must
keep the local record until BE reconciliation completes.

`actualOutput` is nullable. Use a null check, not truthiness, so the string `"0"`
is not replaced by a quote estimate. When actual output is unknown, keep the
quoted amount explicitly as an estimate. Quote-time USD values are not proven
settlement USD values. A missing destination hash remains missing.

## Storage model

Persist a wallet-scoped outbox entry with the minimum data needed to retry and
render the row:

- `sender`, source chain, `sourceTxHash`, `quoteId`, and `quoteToken`;
- source and destination token display metadata and quoted amounts;
- `feStatus`, `recordingStatus`, and the last BE snapshot;
- `backendId`, `lastSyncAt`, retry time, and `serverSeen`.

Namespace the outbox by API environment as well as wallet identity. Preserve
case-sensitive non-EVM identities; normalize EVM addresses/hashes consistently.
Bind an entry to the execution-time sender, not the currently connected wallet.

Keep the `quoteToken` while record retries are possible. It is opaque and expires
after two hours; use a bounded retry window and handle the API's expiry error.
After verified reconciliation, discard it. If registration is permanently
unavailable, remove the unusable token while preserving the hash and local result.
Never fetch a new quote and attach its token to an already-broadcast transaction.
Scope entries by sender and chain so one wallet cannot display another wallet's
pending transactions.

Do not persist the full BE history locally. The BE list is the durable history;
the local store is an outbox and reconciliation cache.

Existing local records without a `quoteToken` are legacy records. This contract
has no backfill endpoint for them. Keep their existing history and adapter polling
rules during migration. Ending the rollout is not authorization to delete them;
legacy retention/removal is a separate product decision.

Do not apply the old 120-history-row truncation to an outbox: unsynced entries must
not be evicted by newer swaps. Version its schema and handle unreadable entries
without clearing unrelated storage. Expiry of a retry window does not by itself
authorize deletion of an unregistered transaction.

## Polling ownership

During migration, `TransactionHistoryUpdater` owns both:

- the existing FE provider polling for unresolved records; and
- BE record/detail reconciliation.

`HistoryPanel` and `TransactionHistoryList` remain presentation-only. They must not
start status requests when a row is rendered, paginated, or filtered.

After a row reaches a verified final BE status, stop its FE provider polling even
if list confirmation is still pending. FE polling can also stop when its own
adapter returns a terminal result; BE reconciliation continues independently.
Do not let FE and BE independently overwrite a single canonical status, because
their provider mappings may briefly disagree.

Use one controller for polling, persistence, and reconciliation, independently of
History visibility or the currently selected swap mode. Reuse bounded adapter
polling behavior; do not restart completed FE checks just because BE is delayed.
Serialize updates per transaction and apply patches to the latest store state so
late responses cannot erase a newly submitted row or overwrite terminal results.

BE detail polling stops on verified final results, verification rejection, or
tracking expiry. On return to the page, a read may discover a later internal
manual-sync result. The internal sync endpoint is not a public FE action.

Choose one owner for completion analytics/notifications and deduplicate by stable
transaction identity. A BE confirmation of a previously displayed FE result must
not emit another completion event. Historical list loading must not replay events.
Use merged actual data for canonical completion analytics.

## Error handling

- Wallet rejection or no source hash: do not create a transaction record.
- Network, timeout, or 5xx from `POST /transactions`: keep the outbox entry and
  retry with the same token and hash.
- Invalid or expired token: keep the source hash and FE result, mark BE sync as
  unavailable, and do not call the swap failed.
- `409 / 4013`: another quote has already verified this hash. Look up by hash and
  chain without the candidate quote ID, then reconcile the verified record. Do
  not retry the conflicting POST indefinitely.
- Detail `404 / 4040`: the requested record is not present. Check chain/quote
  identity and distinguish an unconfirmed POST from a previously accepted row.
  The worker can delete transactions never seen on chain; the contract does not
  promise eventual consistency. Keep the local result, use bounded recovery, and
  only re-record with the original valid token when appropriate.
- Use backoff and bounded retries for transient failures; do not endlessly retry
  validation errors. Persist the outbox before attempting the POST, and resume
  eligible work after reload or reconnection. Do not log the full token.
- A source transaction being mined does not mean the cross-chain swap succeeded;
  only the provider/BE result can establish the destination outcome.

## API and execution gaps to address

- History returns token identifiers and base-unit amounts, without token decimals,
  symbols, or logos. Resolve metadata using existing token services or agree on
  extra BE fields. Local quote metadata alone cannot support another device.
  Render an unknown value safely rather than assuming decimals.
- The list is scoped to one sender, newest first, with opaque `nextCursor`, default
  limit 10 and maximum 50. There is no total count, token search, or chain/status
  filter in this contract. Use cursor pagination; do not fabricate total pages.
  A token search over loaded pages must not claim to search all history.
- Decide how the UI selects EVM, Solana, Bitcoin, and NEAR sender identities. The
  contract does not provide a combined cursor across several wallet addresses.
  Reset query state on identity/environment changes to prevent cross-wallet rows.
- Preserve the exact aggregator `quoteId`/`quoteToken` through quote normalization
  and the reviewed execution snapshot. Keep adapter-specific IDs separate.
- Ensure adapters expose the real source transaction hash. The reviewed source-NEAR
  path in `NearIntentsAdapter` uses a deposit address as `sourceTxHash`; it must
  recover the actual transfer hash, including wallet redirects, before registration.
- Some adapters wait for confirmation before returning. Capture/register the hash
  at broadcast when available so a later confirmation timeout cannot lose it.
  Closing a review must not cancel registration of an already-submitted swap.
- Direct-mode and other legacy callers without aggregator quote tokens cannot
  automatically use this record API. Check PartnerSwap and legacy Cross-Chain
  consumers before changing shared persistence or polling.
- BE depends on the client reporting a transaction; it does not guarantee automatic
  discovery if the tab closes before local persistence or submission. The outbox
  improves recovery but cannot guarantee capture of every broadcast transaction.

## Rollout

1. Extend normalized quote types and SSE parsing with `quoteId` and `quoteToken`.
2. Add the BE transaction client and response schemas.
3. Add the wallet-scoped local outbox and merge/dedupe logic.
4. Register and reconcile transactions from `useCrossChainExecution`.
5. Add hybrid polling to `TransactionHistoryUpdater` and keep the current FE path
   as the fast fallback.
6. Verify retry, reload, wallet switch, cursor pagination, and BE/FE disagreement.
7. After BE tracking is stable, disable FE provider polling for BE-managed rows.

Keep the hybrid path until deployed quote fields, registration, detail/list reads,
and settlement are verified with real transactions across supported providers and
wallet flows. Evaluate tracking latency, reconciliation mismatches, and recoveries
before switching to BE-only status acquisition. BE-only still needs registration
retries and a provisional UI for newly submitted transactions.

## Acceptance criteria

- A submitted cross-chain transaction appears immediately with its source hash.
- A lost POST response can be retried without creating a duplicate BE row.
- Reloading before BE verification does not lose the pending transaction.
- BE status replaces the provisional FE status after reconciliation.
- A verified row moves into cursor-paginated BE history without duplication.
- `mismatched`, `not_found`, and `expiredAt` are distinguishable from failed swaps.
- Same-chain swaps continue using their existing transaction history unchanged.
- FE terminal + BE in-progress does not regress the UI or delete the outbox row.
- Conflicting terminal results reconcile to BE without duplicate completion events.
- Missing actual output and a legitimate `"0"` are handled differently.
- Old legacy records remain readable; server history loads on a fresh device.
- API environment changes, wallet redirects, review closure, and missing source
  hashes are covered without recording approvals or deposit addresses as swap hashes.

Validate pure merge/state transitions and retry behavior with focused tests, then
check reload, wallet change, and pagination in the browser. Live wallet/provider
checks are separate evidence from unit tests and static checks.
