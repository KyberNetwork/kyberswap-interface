# Swap pages

Unified Swap and Limit Order pages for KyberSwap. Unified Swap supports same-chain
EVM swaps and cross-chain swaps, including Solana, Bitcoin and NEAR.

## Features

- Token and network selection, amount entry and pair reversal.
- Quotes, route visualization, price charts, swap settings and transaction review.
- Cross-chain transaction history for the automatically resolved connected wallet, with pagination
  and token search within the current page.
- Limit Order form and order management.

## Routes

| Page | URL |
| --- | --- |
| Same-chain swap | `/swap/{network}/{pair}` |
| Cross-chain swap | `/swap?from=…&to=…&tokenIn=…&tokenOut=…` |
| Limit Order | `/limit/{network}/{pair}` |

## Code map

| Location | Contents |
| --- | --- |
| [SwapRoute.tsx](./SwapRoute.tsx) | Swap URL entry point |
| [SwapPage.tsx](./SwapPage.tsx) | Unified Swap page state and providers |
| [SwapPageContent.tsx](./SwapPageContent.tsx) | Form and right-panel layout |
| [LimitPage.tsx](./LimitPage.tsx) | Limit Order page |
| [layout/](./layout/) | Shared page shell and navigation |
| [components/](./components/) | Charts, routes and History panel |
| [hooks/](./hooks/) | Pair selection, navigation and prefetching |
| [utils/](./utils/) | Route presentation helpers |
| [components/SwapForm](../../components/SwapForm/) | Forms, quotes, approval and review |
| [CrossChainSwap](../CrossChainSwap/) | Provider adapters, execution and transaction tracking |
| [services/crossChainTransactions.ts](../../services/crossChainTransactions.ts) | Transaction history API client |

## Development

See the [app README](../../../README.md) for setup and build commands.
Run the relevant tests and typecheck from the repository root:

```sh
pnpm --filter @kyberswap/interface exec vitest run src/pages/Swap src/components/SwapForm src/pages/CrossChainSwap
pnpm --filter @kyberswap/interface exec tsc --noEmit
```

UI and transaction changes also need verification in a browser with the affected
wallet and provider.
