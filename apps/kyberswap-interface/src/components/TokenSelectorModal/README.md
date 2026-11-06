# TokenSelectorModal

`TokenSelectorModal` is the shared token picker used by Swap, Limit Order, Pool, Earn, Wallet and other token-input surfaces. It provides chain browsing, token search, discovery tabs, wallet holdings, favorites, imports, token details and selection hand-off to the caller.

The modal keeps browsing concerns separate from the selection transaction. Browsing decides which rows are visible; the selection owner decides whether a row can be selected, imported or requires a wallet network switch.

## Supported modes

### Single-chain browsing

The selector starts on `customChainId`, falling back to the app chain. Network browsing uses `useChainsConfig`; form callers with non-EVM support also expose Blast and configured cross-chain-only EVM networks. The single-chain controller combines:

- configured token lists and native currency;
- user-imported tokens;
- wallet inventory discoveries and balances;
- favorites and common tokens;
- catalog and RPC address-search results.

Search keeps local imports, native tokens and wallet discoveries available even when the catalog does not return them. An unlisted token follows the normal import and restricted-token rules when selected.

### All Networks

All Networks is available for normal token selection (`requireOracle={false}`). It aggregates supported EVM chains only; non-EVM chains use their own selector view.

The aggregate controller:

1. Fetches catalog pages without a `chainIds` filter.
2. Filters returned rows to the networks exposed by the caller.
3. Observes each participating chain for holdings, imports, favorites and token metadata on All, Imported and Favorites. Trending and New use catalog data and their price fallback policy.
4. Merges catalog and local rows using `chainId + address` as the identity.
5. Applies search, wrap/unwrap exclusion and tab-specific ordering after the sources are merged.
6. Publishes chain observations progressively while preserving rows already received.

Aggregate catalog pagination uses the raw API page size/count, so a page containing no supported-chain rows does not hide later supported rows. A trailing list row represents pending aggregate acquisition or the next page.

Chain observations are published in fixed 250ms windows, retaining the latest result from every chain received in that window. Wallet, tab, network scope and active-state changes invalidate pending publications. Routine price and balance refreshes do not restart initial list loading.

Wallet inventory discovers holdings on supported inventory chains. Other chains fall back to balances for known tokens; this does not discover unknown assets. Aggregate search merges catalog results with imports and known holdings without running an all-chain RPC address scan.

### Non-EVM networks

Non-EVM networks are shown when the caller uses form selection mode and provides `onSelectNonEvmCurrency`. Their content and token sources are owned by `NonEvmTokenSelectorContent`; selection is sent directly to the caller and the modal is dismissed. Non-EVM choices do not enter the EVM aggregate controller.

### Oracle-restricted mode

`requireOracle` is used by Oracle-dependent flows such as Stop Market. It limits the chain list to networks supported by the Oracle feature, filters rows through the Oracle token predicate and hides All Networks. The selection transaction remains the same as in other modes.

## Tabs and ordering

| Tab           | Source and behavior                                                                                                                                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All**       | Configured tokens, native currency, imports, wallet discoveries and catalog search. Empty search uses wallet holding/value ordering; search promotes held matches while preserving impersonator safeguards.                                                                               |
| **Trending**  | Public token catalog with the `kyberscore` tag. Supports infinite scroll on supported Trending chains and server-side metric sorting.                                                                                                                                                     |
| **New**       | Public token catalog with the `new` tag. One page of 20 for a selected chain or 50 for All Networks; filtering does not fetch additional pages. Sorting is server-side.                                                                                                                   |
| **Imported**  | User-imported tokens for the selected chain or all supported EVM chains, with balance-aware ordering and local metric sorting.                                                                                                                                                            |
| **Favorites** | Common tokens plus explicitly favorited addresses, excluding explicit removals, resolved independently per chain. Default order is FDV descending; column sorting overrides it. Membership, star state and mutations use the same per-chain rule, with a limit of 12 favorites per chain. |

Discovery tabs use catalog metrics for price, 24h change, volume and FDV. Imported and Favorites resolve local metrics and use the shared metric comparator. All and Imported use wallet balances for the ordering rules that require them.

All Networks All uses KS Setting `/v1/tokens`; Trending and New use Token API `/v1/public/tokens`. All and Trending paginate in batches of 20. New supplements missing catalog prices through the shared live-price source; Trending does so only when `TRENDING_PRICE_FALLBACK_ENABLED` is enabled.

## Public selection contract

`TokenSelectorModal` exposes these selection-related props:

- `selectedCurrency` and `otherSelectedCurrency` identify the current pair and support wrap/unwrap filtering.
- `onCurrencySelect` receives a committed EVM currency.
- `onCurrencyImport` is called when the import-warning view opens; the final imported currency is committed through `onCurrencySelect` after confirmation.
- `onSelectChain` is called before an EVM selection from another chain is committed. It is retained for existing callers that own chain state.
- `chainSelectionMode` is either `wallet` or `form`:
  - **wallet** mode confirms and switches the wallet network before committing a different-chain selection;
  - **form** mode leaves chain state to the caller and commits the selected currency without switching the wallet.
- `onSelectNonEvmCurrency` is enabled only for form mode. The callback receives the selected chain and currency, then the modal closes.
- `showDiscoveryTabs={false}` hides the network sidebar and discovery tabs without changing selection semantics.

When `chainSelectionMode` is omitted, the modal preserves the legacy contract: an `onSelectChain` callback implies form mode; otherwise it uses wallet mode.

## Selection lifecycle

Rows show import and restriction affordances and emit selection/import intent. The content attaches the active tab, query, selection method and row index; the transaction owner rechecks restrictions before committing.

`useTokenSelection` owns the complete EVM transaction:

1. Normalize native currency and reject restricted tokens.
2. For an ordinary different-chain selection in wallet mode, confirm and switch the wallet chain, then resolve any required import warning. An explicit import intent opens the warning first and proceeds to chain confirmation afterward.
3. For same-chain or form-mode selections, resolve any required import warning directly.
4. Recheck restrictions, call `onSelectChain` when the selected chain differs from the anchor, record selection tracking, then call `onCurrencySelect` and dismiss.

`ImportTokenView` persists the confirmed token through the user-token store before returning it to the selection owner. The caller owns the committed pair or business state.

Each modal session and network-switch request has a generation guard. Closing, cancelling or reopening the modal invalidates late wallet callbacks so an old selection cannot commit into a new session. The search view remains mounted behind import and token-detail overlays, preserving its chain, tab, query and scroll state when the user goes back.

## Ownership map

| Location                                       | Owns                                                                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.tsx`                                    | Modal shell, overlay transitions, session composition and the public prop contract.                                                         |
| `TokenSelectorContent/`                        | Search input, selected network, active tab, sort state, non-EVM view composition and list wiring.                                           |
| `TokenSelectorContent/useTokenSelectorView.ts` | Temporary browsing state: selected chain, All Networks toggle, query/debounce, tab restoration and metric sort controls.                    |
| `hooks/useTokenSelectorData.ts`                | Single-chain sources, inventory, local search matches, balances, holdings sorting, wrap filtering and tab data composition.                 |
| `AllNetworks/`                                 | Aggregate catalog pagination, supported-chain filtering, per-chain observers, merge/dedupe, progressive publication and aggregate ordering. |
| `NetworkSelector/`                             | Network navigation, chain icons, chain volume ordering and non-EVM content.                                                                 |
| `TokenList/`                                   | Virtualized rows, stable row identity, loading row, balance/metric presentation and row-level intent callbacks.                             |
| `TokenSelection/`                              | Import confirmation, chain-switch confirmation and the EVM selection transaction.                                                           |
| `state/user/favorites.ts`                      | Per-chain favorite membership and toggle/remove decisions, reading current Redux state at action time.                                      |
| `state/walletInventory/`                       | Shared wallet inventory subscriptions and token metadata resolution.                                                                        |

The data controllers own acquisition and derived list state. Presentation components render the controller contract and report intent. No row or child content component should duplicate commit, favorite membership, pagination or dismissal logic.

## Identity and data invariants

- Use `tokenRowKey(chainId, address)` for aggregate list identity and React keys. The same address on two chains represents two rows.
- Native currency and the catalog's native sentinel are treated as one asset on their chain; the wrapped native token remains separate.
- Imports, favorites, balances, prices and metadata are always resolved in a chain-qualified scope.
- All Networks filters aggregate sources to the caller's supported EVM networks before rendering.
- Search and wrap/unwrap filtering are applied to the final merged list for aggregate tabs.
- A list can reorder as holdings, prices or chain data arrive; stable chain/address keys keep rows attached to the correct token.

## Extension guidelines

Add a new source to the controller that owns its lifecycle, then expose the existing list contract to `TokenSelectorContent`. Keep rows presentational and use intent callbacks for selection, import, favorite and removal actions. Reuse the shared token identity, favorite actions, inventory, metrics and filtering helpers instead of creating a second per-chain implementation.

When adding a new selection path, route it through `useTokenSelection` so restriction checks, import confirmation, chain handling, tracking and dismissal remain a single transaction. When adding a new network, update the network configuration and the appropriate network-specific source; do not make the aggregate EVM controller responsible for non-EVM assets.
