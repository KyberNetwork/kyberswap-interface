# TokenSelectorModal

Shared token picker for Swap, Limit Order, Pool, Earn, Wallet and other token inputs. It provides network browsing, search, discovery tabs, holdings, favorites, imports and token details. The caller owns the committed currency or pair; the modal owns browsing and the selection flow.

## Ownership

| Owner                                                                                                                                          | Responsibility                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [index.tsx](index.tsx)                                                                                                                         | Public contract, modal shell, import/detail overlays and selection composition.                                            |
| [TokenSelectorContent](TokenSelectorContent/TokenSelectorContent.tsx) and [useTokenSelectorView](TokenSelectorContent/useTokenSelectorView.ts) | Selected network, tab, query, sort controls and wiring the active data controller to the list.                             |
| [useTokenSelectorData](hooks/useTokenSelectorData.ts)                                                                                          | Single-chain source composition, search matches, shared balances, filtering and ordering.                                  |
| [useAggregateTokens](AllNetworks/useAggregateTokens.ts)                                                                                        | All Networks source selection, supported-chain filtering, merging, ordering and pagination.                                |
| [useAggregateSnapshot](AllNetworks/useAggregateSnapshot.ts)                                                                                    | Batched display publication, structural sharing and session guards. Fetching and cache retention remain with source hooks. |
| [ChainTokens](AllNetworks/ChainTokens.tsx)                                                                                                     | Per-chain observations using shared inventory, balance, favorite and metric sources.                                       |
| [TokenList](TokenList/TokenList.tsx) and [VirtualTokenRow](TokenList/VirtualTokenRow.tsx)                                                      | List subscriptions, virtualization and row movement; memoized rows receive their own values and emit intent.               |
| [useTokenSelection](TokenSelection/useTokenSelection.ts)                                                                                       | Restriction checks, import/chain confirmation, selection tracking, commit and dismissal.                                   |

[NetworkSelector](NetworkSelector/) owns network navigation and non-EVM content. Shared [favorite actions](../../state/user/favorites.ts) own membership changes; [wallet inventory](../../state/walletInventory/) owns inventory subscriptions and metadata resolution.

## Browsing modes

The selector starts on `customChainId`, falling back to the app chain. Single-chain browsing combines configured tokens and native currency with imports, favorites, wallet discoveries and catalog search. Local imports, native tokens and held discoveries remain searchable when the catalog omits them. RPC address lookup is a fallback where allowed.

Networks use fixed priority by default; `networkSortBy="api"` opts into volume ordering. Pinned networks appear first. Form callers with non-EVM support also expose Blast and configured cross-chain-only EVM networks.

**All Networks** aggregates only the EVM networks exposed by the caller. All, Imported and Favorites observe each participating chain; Trending and New use their catalog sources and price fallback policy. Catalog and local rows merge before search, wrap/unwrap exclusion and ordering. Inventory discovers unknown holdings on supported chains; balance lookups on other chains cover known tokens only. Aggregate search does not run an all-chain RPC address scan.

**Non-EVM networks** require form mode and `onSelectNonEvmCurrency`. [NonEvmTokenSelectorContent](NetworkSelector/NonEvmTokenSelectorContent.tsx) owns their sources and display. Selection goes directly to that callback and dismisses the modal.

**Oracle mode** (`requireOracle`) restricts networks and token eligibility for flows such as Stop Market, disables RPC search and hides All Networks. It uses the same EVM selection flow.

`showDiscoveryTabs={false}` hides network navigation and discovery tabs without changing selection semantics.

## Tabs and ordering

| Tab       | Source and ordering                                                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All       | Configured tokens, native currency, imports, discoveries and catalog results. Browsing sorts by holdings/value; search promotes held matches with impersonator safeguards.            |
| Trending  | Token catalog `kyberscore` feed, with pagination and server-side metric sorting.                                                                                                      |
| New       | Token catalog `new` feed, newest first unless sorted server-side. One page: 20 tokens per selected chain or 50 for All Networks.                                                      |
| Imported  | User imports, ordered by holdings unless a metric sort is selected.                                                                                                                   |
| Favorites | Common tokens plus explicit favorites, excluding explicit removals. Default order is FDV descending; column sorting overrides it. Membership is scoped per chain, with a limit of 12. |

[holdingSort](hooks/holdingSort.ts) owns wallet-value ranking; [metricSort](hooks/metricSort.ts) owns local metric ordering. Imported and Favorites resolve metrics for their local tokens. New fills missing catalog prices from the shared live-price source; Trending does so only when `TRENDING_PRICE_FALLBACK_ENABLED` is enabled.

All Networks All uses KS Setting `/v1/tokens`; Trending and New use Token API `/v1/public/tokens`. All and Trending paginate in batches of 20. Aggregate pagination uses raw page counts and advances past pages containing only unsupported networks; New does not fetch additional pages.

## Cache, publication and animation

Source hooks own cached server data. The aggregate snapshot is a display projection, not another request cache. Off-app-chain native and ERC20 balance reads share a 15-second refresh cadence and five-minute inactive retention, configured in [contractQuery](../../services/contractQuery.ts) and consumed by [bridge hooks](../../hooks/bridge/index.ts). Current-chain multicall and wallet inventory retain their own lifecycles.

Balance caches are scoped by wallet and chain; ERC20 snapshots also depend on the requested token list. Returning to a fresh snapshot reuses it immediately; stale snapshots refresh in the background. A rejected RPC refresh retains the last successful balance until a later read succeeds, so a displayed cached amount is not a freshness guarantee. Missing balances remain unknown rather than becoming zero. ERC20 reads are skipped without a wallet, chain or tokens.

Within an aggregate session, catalog and chain updates publish together in fixed 250ms windows, using the latest observation from each source. Later responses do not extend the deadline. Initial loading and reactivation both publish available observations without waiting for every chain or the catalog to finish. Chains without a new observation retain their previous data. Equivalent data preserves references, and waiting-only changes do not rebuild holding ranks. Catalog completion and its loading state publish together, so the empty state does not appear while completed results are still queued. A trailing row represents initial acquisition or further pagination.

Wallet, tab, supported-network scope and discovery sort define aggregate identity. Identity changes replace the snapshot; leaving the aggregate view cancels pending work but retains its published observations. Returning to the same identity and search displays the retained view immediately. Chain observers mount in a deferred render so network navigation and the retained view can paint first. Search replaces only the catalog: old queued catalog results are discarded while chain subscriptions, pending balance updates and their deadline survive. Session guards reject obsolete callbacks after deactivation or identity changes.

Rows use chain/address keys and spring-driven transforms. All Networks and single-chain views have separate row identities, so switching between them starts rows at their destination without reorder animation. Within the same view, controllers calculate order from available data and a mounted row moves when its position changes. Unchanged order causes no movement, including when sources republish equivalent cached data. Later balance or price changes can still reorder the list. Search and reduced-motion preferences disable reorder animation. List offsets reset only when row heights change, such as an expanded restriction notice.

## Selection contract and lifecycle

`chainSelectionMode="wallet"` confirms and switches the wallet network for a different-chain pick. `"form"` lets the caller own chain state. When omitted, `onSelectChain` implies form mode; otherwise the selector uses wallet mode.

Rows report select/import intent. Content attaches the tab, query, method and row index, then `useTokenSelection`:

1. Normalizes native currency and rejects restricted tokens.
2. Resolves chain confirmation and import requirements. Ordinary wallet-mode picks switch chain before import; explicit import intent opens the warning first.
3. Rechecks restrictions, calls `onSelectChain` for a changed anchor chain, records tracking, calls `onCurrencySelect` and dismisses.

`onCurrencyImport` reports that the warning opened. [ImportTokenView](TokenSelection/ImportTokenView.tsx) persists confirmed tokens before returning them to the selection owner; `onCurrencySelect` receives the final EVM currency. Non-EVM picks use `onSelectNonEvmCurrency` instead.

Closing or cancelling invalidates late wallet callbacks. The browsing view stays mounted behind import/detail overlays, preserving network, tab, query and scroll when returning.

## Maintenance boundaries

- Use `tokenRowKey(chainId, address)` for list identity and chain-qualified lookups. Native currency and its catalog sentinel represent one asset; wrapped native remains separate.
- Add sources to the controller that owns their lifecycle. Keep cache policy in source hooks and batch publication in `useAggregateSnapshot`.
- Keep balance, price, import and favorite subscriptions at the source/list level; pass row-specific values to the renderer.
- Route EVM selection paths through `useTokenSelection` and favorite mutations through the shared favorite actions. Keep caller business state outside the modal.
