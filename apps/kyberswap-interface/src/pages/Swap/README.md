# Swap pages

This module composes Unified Swap and Limit Order. Unified Swap uses the
single-chain form for same-chain EVM pairs and the cross-chain form for
different-chain or non-EVM pairs.

## Structure

- `SwapPage.tsx`: URL pair state, shared providers and History visibility.
- `SwapPageContent.tsx`: forms, settings and right-panel composition.
- `LimitPage.tsx`: Limit Order composition.
- `layout/`: page shell, tabs and responsive layout.
- `components/`: chart, routes and History presentation.
- `hooks/`: pair selection, navigation and prefetching.
- `utils/`: pure route and swap-link helpers.

Form behavior lives in [`components/SwapForm`](../../components/SwapForm). Keep
page composition and navigation here; keep quote, review and approval in the form
providers. Both cross-chain review UIs share `CrossChainSwap/hooks/useCrossChainExecution`.

## Ownership

- `useSwapFormPair` owns URL pair selection and reversal.
- `SingleChainSwapFormProvider` shares single-chain quote/review state between
  the form and right panel.
- `CrossChainSwapProvider` owns cross-chain stream quotes, selection, refresh and
  reviewed-quote state.
- `useSwapReviewSession` owns single-chain build, review, submit, error and
  dismissal lifecycle.
- `TransactionHistoryUpdater` mounts independent provider and BE updaters, outside
  History visibility and swap-mode branches on Unified, CrossChain and Partner pages.
- `useCrossChainExecution` owns wallet execution, recording and initiation events.
  The legacy popup opts out of BE sync to preserve its local-only history.
- Local cross-chain history is one persisted Redux list. Rows with `sync` metadata
  form the BE outbox; provider polling uses those same rows. Registration expiry
  drops only `sync`, so the transaction keeps its legacy provider behavior.
- `HistoryPanel` selects the connected sender and keys `WalletHistory` by sender
  to reset pagination on wallet changes while preserving the search input.
- `useUnifiedTransactionHistory` owns cursor list reads and
  merging local/server rows. It keeps API token IDs without inventing Currency objects.
- UI pages contain at most 10 merged, deduplicated rows, including local rows.
  API cursor pages are a loading boundary, not a UI page boundary. Older local rows
  wait until the newest-first cursor covers their timestamp; once it ends, all local
  rows participate. Fetch only enough to fill the requested page, including across
  empty/overlapping API pages. Never infer total pages from an opaque cursor.
- `TransactionHistoryItem` resolves API token IDs with existing token hooks and
  filters after lookup so symbol searches still work. Local Currency objects need
  no lookup. The list's empty state follows rendered rows without another metadata
  cache or child-to-parent synchronization. `HistoryPanel` owns the search input;
  search is limited to the current page. Status polling remains with the updater.

Single-chain URLs use `/swap/{network}/{pair}`. Cross-chain URLs use
`/swap?from=…&to=…&tokenIn=…&tokenOut=…`.

History currently contains cross-chain transactions only. Transaction details and
single-chain History remain separate product work.

## Working in this module

- Keep form modules independent of `pages/Swap`.
- Preserve lazy provider boundaries and the pending-form skeleton.
- Check shared callers when changing forms or layout: PartnerSwap, Limit Order
  and the legacy Cross-Chain page reuse this code.
- Keep status acquisition in `TransactionHistoryUpdater`, outside History list
  rendering and visibility changes.

From the repository root:

```sh
pnpm --filter @kyberswap/interface exec vitest run src/pages/Swap src/components/SwapForm src/pages/CrossChainSwap
pnpm --filter @kyberswap/interface exec tsc --noEmit
```

For UI or transaction changes, also verify the affected flow in a browser and
with the relevant provider or wallet.

## Cross-chain history

The RTK Query service in [`services/crossChainTransactions.ts`](../../services/crossChainTransactions.ts)
owns transaction requests, response validation, cursor pages and detail caching.
Feature logic lives in [`CrossChainSwap/transactions`](../CrossChainSwap/transactions).
The local provider flow and BE reconciliation run independently while `SwapPage`
is mounted, including when History is closed or the form switches to same-chain.
Same-chain router history is unchanged.

### Storage and status flow

1. At broadcast, save the real source hash and transaction in the existing
   `crossChainSwap.transactions` Redux array, persisted to localStorage. Quotes
   with `quoteId` and `quoteToken` add optional `sync` metadata to that row.
   Redux actions/selectors own this local state. One persistence middleware saves
   changed transaction rows synchronously; the general debounced persister excludes
   this array.
2. `useTransactionHistory` keeps provider polling: check Processing rows every
   10 seconds, with a 24-hour polling window. Older Processing rows get a check
   when the updater mounts. Provider terminal results remain visible while BE lags.
3. `useBackendTransactionUpdater` registers each managed row with
   `POST /api/v1/transactions`, using its original quote token and source hash.
   It then polls GET transaction detail, normally every 10 seconds. Transient
   errors use bounded retries and backoff; the updater does not poll the list.
4. A BE result is final only when verification is `verified` and status is
   `success`, `failed` or `refunded`. The RTK detail cache retains that result before
   the local row and `sync` are removed. No list confirmation is required.
5. Registration expiry, permanent registration failure or exhausted/stopped BE
   tracking removes only `sync`. The transaction stays in local history and
   follows the legacy provider rules; a BE error does not make the swap Failed.
   Once registered, quote-token expiry alone does not stop detail polling.

Provider completion retains its existing analytics. If BE settles first, the BE
updater emits completion once before removing the local row. Loading historical
rows never emits completion events. Pending and managed rows are not evicted by
the completed-local-history size limit.

### History display

`useUnifiedTransactionHistory` uses the RTK infinite query for the connected wallet.
Without a connected wallet, history is empty and the list query is disabled. The
hook merges local rows with RTK list/detail data,
deduplicating by source chain and hash within that sender. Verified final BE data
takes precedence; otherwise local provider progress remains visible.

`HistoryPanel` owns wallet selection, token search and presentation. Search covers the current page,
and merged rows sort newest first. Existing EVM, Solana and NEAR token services
supply display metadata; loading amounts use a skeleton and unknown amounts use
`--`.

List and detail responses use RTK cache only; there is no separate session store
or persistent server-history copy. Unused cache entries are retained for 24 hours.
A settled detail row remains visible before the list catches up. Reload restores
server history through the list, so a delayed list can temporarily omit a settled
row. API environment namespacing is unchanged.

The updater also polls nonterminal server rows already loaded in RTK, including
fresh-device history, independently of whether History remains open. Loading old
rows does not emit completion events.

### NEAR transaction fields

`depositAddress` is the provider status lookup address, `sourceTxHash` is the actual
source transfer hash, and `targetTxHash` is the destination hash. `id` remains the
provider-specific compatibility ID; old records without `depositAddress` still
use `id` for status.

A pending wallet redirect stores the deposit address and quote context without a
source hash. Only the transfer transaction result or its corresponding redirect
hash supplies `sourceTxHash`; storage-registration transactions and receipt IDs
are not swap hashes.

### Known limitation

The Redux persister writes the whole local transaction array without coordination
between tabs. Concurrent tabs can still overwrite pending rows or restore removed
rows; this refactor gives the array one writer per tab, not cross-tab locking.
