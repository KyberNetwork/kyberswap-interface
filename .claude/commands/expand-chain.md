# Expand Chain

Add a new EVM chain to the KyberSwap products, repo by repo, verifying each step against the live
backend so that nothing is left to memory. Work through every section in order; stop and ask
whenever a step needs a product decision (default output token, day-1 products, launch date).

**Chain**: $ARGUMENTS

## Instructions

- Accept a chain name, a chain id, or both. Gather the facts in section 1 before touching code: the
  chain's docs, the `#chain-expansion-<chain>` Slack channel, and ks-setting.
- One branch and one PR per repo. The SDK must be published before anything that depends on its
  `ChainId`.
- Do not commit, push, or open PRs unless told to.
- Probe results (section 5) go in the PR description's facts table, never in code comments.

## 1. Facts to collect

| Fact | Where it ends up |
| --- | --- |
| Chain id, display name, aggregator slug (`/<slug>/api/v1/routes` must answer) | SDK `ChainId`, `NetworkInfo.route` / `aggregatorRoute`, ks-setting |
| Native token symbol, decimals, logo | `NetworkInfo.nativeToken` |
| Wrapped native: address **and on-chain `symbol()`** — docs have been wrong (Elysium's is WHYPE, not WETH) | SDK `WETH[ChainId.X]` |
| Whether the native asset has an ERC-20 interface sharing its balance (Arc: native USDC) | `NetworkInfo.nativeToken.erc20Interface` |
| Multicall3 address (canonical `0xcA11bde05977b3631167028862bE2a173976CA11` or not) and block time | `NetworkInfo.multicall`, wagmi `contracts.multicall3` |
| Public RPCs — several; the default must be reachable from kyberswap.com without VPN | section 4c and the benchmark in section 5 |
| Official explorer and its path shapes (`/tx/`, `/token/`, `/address/`, `/block/`) | `NetworkInfo.etherscanUrl`, wagmi `blockExplorers` |
| Default output token with real liquidity (check pool depth: Elysium's USDC pool held about $10) | `DEFAULT_OUTPUT_TOKEN_BY_CHAIN` |
| Day-1 products: aggregator always; LO (DSLO address — it can differ per chain), cross-chain, Earn/Zap, Stop Market | `NetworkInfo.limitOrder`, the feature maps in 4b |
| Launch date, Provisional label, who flips ks-setting and when | section 6 |

## 2. ks-sdk-core

- `ChainId.<NAME> = <id>` and `WETH[ChainId.<NAME>]` with the verified wrapped-native symbol.
- Build, run the SDK tests, PR, publish; note the version for the next repos.

## 3. kyber-ad-frontend (admin)

- `chainDetailByIDConfig[<id>]`: name, a public RPC, explorer, logo (the ks-setting GCS PNG url).
- Bump the SDK and refresh `yarn.lock` only after the SDK is published.

## 4. kyberswap-interface

### 4a. SDK bump

- `apps/kyberswap-interface/package.json` and `packages/swap-widgets/package.json`, then `pnpm install`.

### 4b. Let the compiler list the decisions

Run `pnpm build-package`, then `cd apps/kyberswap-interface && npx tsc --noEmit`. Every per-chain
feature map is exhaustive over `ChainId`, so each error is one decision to write down — the feature's
value, or what the chain still needs. Never leave an entry out.

| Error in | Record |
| --- | --- |
| `constants/networks.ts` | `NETWORKS_INFO_CONFIG` → new `constants/networks/<chain>.ts` (copy the newest chain file, then re-check every field); `MAINNET_NETWORKS`; `STOP_MARKET_BY_CHAIN` |
| `constants/tokens.ts` | `DEFAULT_OUTPUT_TOKEN_BY_CHAIN`, `PRICE_CHART_QUOTE_BY_CHAIN`, `STABLE_COIN_ADDRESSES_TO_TAKE_FEE` |
| `components/TokenSelectorModal/constants.ts` | `TRENDING_BY_CHAIN` |
| `components/Header/web3/NetworkModal/chains.ts` | `L1_CHAINS` / `L2_CHAINS` (rollups and Orbit L3s go in L2), or `UNLISTED_CHAINS` with a reason |
| `state/walletInventory/constants.ts` | `WALLET_INVENTORY_CHAIN_DECISIONS` in `packages/hooks/src/wallet-inventory-client.ts` |

Turn a feature on only after its probe in section 5 passes; otherwise record what it needs.

### 4c. Not caught by the compiler — check each by hand

- `components/Web3Provider/index.tsx`: `defineChain` (rpc, explorer, multicall3) and `withKyberRpc(<chain>)` in `wagmiChains`.
- `packages/rpc-client/src/endpoints.ts`: `PUBLIC_RPC_ENDPOINTS[<id>]` — the benchmarked list, fastest zero-lag node first; that node is also `NetworkInfo.defaultRpcUrl`.
- `utils/gasReserve.ts`: the native gas reserve.
- `assets/networks/<chain>.svg`, and the chain grid in `pages/About/AboutKyberSwap.tsx`.
- `packages/swap-widgets`: `src/constants/index.ts` (chain info, `MULTICALL`, aggregator path, `SCAN_LINK`, `DefaultRpcUrl`), `src/constants/tokens/<chain>.ts` plus its index, the README chain table, a version bump. Demos: `apps/swap-widgets-react-demo/src/App.tsx`, `apps/swap-widgets-nextjs-demo/pages/index.tsx`, `apps/iframe-embed-demo/src/constants.ts`.
- Cross-chain (the cross-chain team owns it): `pages/CrossChainSwap/utils.ts` `CANONICAL_TOKENS`; a provider adapter only once that provider lists the chain.
- Earn / Zap, only when in scope: `pages/Earns/constants/{index.ts, chains/<chain>.ts, dexes/*.ts}` and `packages/schema/src/{schema/chain.ts, constants/networks.ts, constants/networks/<chain>.ts, constants/dexes/*}`.
- SEO, **after launch**: `components/Seo/sitemapRoutes.ts` (`SITEMAP_SWAP_CHAIN_SLUGS`, `SITEMAP_LIMIT_CHAIN_SLUGS`), `curatedSwapCatalog.ts`, `public/sitemap*.xml`; `seoContract.test.ts` pins them.
- Token data (backend): the default output token must be whitelisted in token-catalog, and honeypot flags on the chain's tokens are often wrong on a new chain — check a few.

### 4d. Before the PR

- No internal or VPN-only RPC anywhere: wallets read `rpcUrls.default.http[0]`, and users hit every entry.
- `.env` points at production services (no `pre-` hosts).
- `pnpm lint`, `pnpm build-package`, `npx tsc --noEmit` in the app, `vitest run` on the touched areas.
- PR body: a facts table (id, native, wrapped native, multicall, slug, default RPC, explorer), the enabled products, and what is out of scope.

## 5. Probes — run each before turning the feature on

| Feature | Probe | Pass |
| --- | --- | --- |
| Aggregator | `GET https://aggregator-api.kyberswap.com/<slug>/api/v1/routes?tokenIn=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&tokenOut=<token>&amountIn=<wei>` | a route |
| ks-setting | `GET https://ks-setting.kyberswap.com/api/v1/configurations/fetch?serviceCode=kyberswap` → `data.config.chainStates['<id>']` | `testing` on previews, `active` at launch |
| Price chart | `GET https://kd-api.kyberswap.com/api/v1/tokens/<id>/<token>/price-chart?stable=<stable>&quote=<quote>&timeFrame=1h` | `candles` non-empty |
| Trending | `GET https://token-api.kyberswap.com/api/v1/public/tokens?chainIds=<id>&tag=kyberscore&page=1&pageSize=1` | `pagination.totalItems > 0` |
| Wallet inventory | `GET https://kd-api.kyberswap.com/api/v1/wallets/<id>/<account>/balances` | 200 (a 400 `unsupported chain` means not yet) |
| Limit order | DSLO deployed and the limit-order service lists the chain | QA places and fills an order |
| Stop Market | the conditional-order service accepts the chain id | its order list answers without error |
| Honeypot flags | `GET https://token-api.kyberswap.com/api/v1/public/tokens/honeypot-fot-info?address=<token>&chainId=<id>` | matches reality |

**RPC benchmark.** Run it inside a real page on kyberswap.com (Playwright `page.evaluate`), not with
curl: several nodes sit behind Cloudflare and reject non-browser clients, and only a browser sees
CORS. For each candidate: `eth_chainId`; a 40-call Multicall3 `aggregate3` through `eth_call`; a
5-item batch; the wallet methods (`eth_gasPrice`, `eth_getBalance`, `eth_estimateGas`,
`eth_getTransactionCount`, `eth_getBlockByNumber`); 20 parallel requests; then 10 rounds comparing
head blocks across all nodes. Drop any that rate-limit, lack `Access-Control-Allow-Origin`, or fall
behind. The default is the fastest node with zero head lag.

**Explorer.** Open `/tx/<hash>`, `/token/<addr>`, `/address/<addr>` and `/block/<n>` in a browser;
`utils/explorer.ts` builds exactly these paths.

## 6. Release

- Flip `chainStates['<id>']` to `active`. ks-setting is JSON-Schema validated: the schema in
  kyber-applications must list the id first.
- Keep the Provisional label. Watch RPC error rates and the swap funnel for the first days; on any
  incident set the chain `inactive`.
- Open the SEO follow-up PR once the chain is live.

## Lessons from past expansions

Add the surprise from every expansion here.

- Robinhood: WETH is `0x0Bd7…AD73`, not `0xA687…`.
- Arc: native USDC — an 18-decimal native and a 6-decimal ERC-20 share one balance, and there is no
  wrapped native; `useWrapCallback`, WETH decimals, symbol-keyed URLs and `.wrapped` all assumed
  otherwise.
- Monad: access lists broke Phantom (`accessListEnabled: false`).
- Elysium: the wrapped native is WHYPE; the only public RPCs and explorer were third-party; the
  Kyber RPC became VPN-only mid-review, which disabled Swap because allowance reads failed; the
  official explorer was gated by an access code until launch; the USDC pool was too thin to price
  anything against.
