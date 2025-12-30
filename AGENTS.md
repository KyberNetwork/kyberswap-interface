# KyberSwap Interface

> The fastest and most efficient place to trade and earn on multi-chains

## Overview

KyberSwap Interface is the unified frontend monorepo for Kyber Network's DeFi products, including the Aggregator, Limit Orders, and Zap Widgets for liquidity provision.

## Quick Start

```bash
pnpm i                                      # Install dependencies
pnpm build-package                          # Build shared packages (required!)
cd apps/kyberswap-interface && pnpm dev   # Run main app
```

## Project Structure

| Directory                             | Purpose                                    |
| ------------------------------------- | ------------------------------------------ |
| `apps/kyberswap-interface/`           | Main swap/trade interface                  |
| `apps/zap-widgets-demo/`              | Widget demonstration app                   |
| `apps/swap-widgets-react-demo/`       | React widget integration example           |
| `apps/swap-widgets-nextjs-demo/`      | Next.js widget integration example         |
| `packages/liquidity-widgets/`         | Zap In widget (add LP with single token)   |
| `packages/zap-out-widgets/`           | Zap Out widget (remove LP to single token) |
| `packages/zap-migration-widgets/`     | LP position migration widget               |
| `packages/pancake-liquidity-widgets/` | PancakeSwap-specific Zap In                |

## Development Commands

| Command              | Purpose                     |
| -------------------- | --------------------------- |
| `pnpm i`             | Install all dependencies    |
| `pnpm build-package` | Build shared packages only  |
| `pnpm build`         | Build all packages and apps |
| `pnpm lint`          | Run ESLint                  |
| `pnpm type-check`    | TypeScript validation       |

## Testing & Verification

```bash
# Always run before committing
pnpm lint
pnpm type-check
pnpm build
```

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- pnpm workspaces + Turborepo
- styled-components
- Redux Toolkit + RTK Query
- zustand (widgets)
- ethers.js / wagmi / viem

## Code Conventions

### ✅ Do

- Use functional components with hooks
- Use TypeScript strict mode
- Use styled-components for styling
- Import from package aliases (e.g., `@kyberswap/liquidity-widgets`)

### ❌ Don't

- Use class-based components
- Use CSS modules or inline styles
- Fetch data directly inside components (use hooks)
- Add new dependencies without checking existing alternatives

## Good and Bad Examples

### Components

- ✅ Prefer: `packages/liquidity-widgets/src/components/Widget/`
- ❌ Avoid: Legacy patterns with class components

### Data Fetching

- ✅ Use custom hooks: `hooks/useTokenBalance.ts`
- ❌ Don't fetch in useEffect directly in components

### Styling

- ✅ styled-components: `const Button = styled.button`...``
- ❌ Inline styles or CSS modules

## Safety & Permissions

### Allowed without asking

- Read files, list directories
- Run `pnpm lint` on single files
- Run `pnpm type-check`
- Run individual tests

### Ask first

- Package installations (`pnpm add`)
- Git push operations
- Full build or test suites (`pnpm build`)
- File deletions

## Domain Knowledge

### Key Concepts

- **Aggregator**: Routes swaps through 100+ DEXs for best rates
- **Zap In**: Add liquidity with single token or multi tokens (auto-converts)
- **Zap Out**: Remove liquidity and receive single token or manually remove liquidity as normal
- **Migration**: Move LP positions between pools/protocols

### Supported Chains

Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, Fantom, and more (16+ chains)

## External Resources

- Website: https://kyberswap.com/
- Documentation: https://docs.kyberswap.com/
- GitHub: https://github.com/KyberNetwork/kyberswap-interface

## Contributing

All pull requests should target the `main` branch. CI checks run automatically.
