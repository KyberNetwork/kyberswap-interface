# KyberSwap Interface

> The fastest and most efficient place to trade and earn on multi-chains

## Overview

KyberSwap Interface is the unified frontend monorepo for Kyber Network's DeFi products:

- **Aggregator**: Routes trades through 100+ DEXs across 16 chains for optimal rates
- **Limit Orders**: Gasless, slippage-free, zero-fee trades
- **Zap Widgets**: One-click liquidity provision with single token
- **Cross-Chain Swaps**: Swap tokens across different chains in one transaction

## Quick Start

```bash
# Install dependencies
pnpm i

# Build shared packages (REQUIRED before running apps)
pnpm build-package

# Run main interface
cd apps/kyberswap-interface && pnpm dev

# Run widget demos
cd apps/zap-widgets-demo && pnpm dev
cd apps/swap-widgets-react-demo && pnpm dev
cd apps/swap-widgets-nextjs-demo && pnpm dev
```

## Development Commands

| Command              | Purpose                        |
| -------------------- | ------------------------------ |
| `pnpm i`             | Install all dependencies       |
| `pnpm build-package` | Build shared packages only     |
| `pnpm build`         | Build everything               |
| `pnpm lint`          | Run ESLint across all packages |
| `pnpm type-check`    | TypeScript validation          |

## Verification Checklist

Before committing, always run:

```bash
pnpm lint
pnpm type-check
pnpm build
```

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm (workspaces)
- **Monorepo Tool**: Turborepo
- **Styling**: styled-components
- **State Management**: Redux Toolkit (RTK Query for API)
- **Widget State**: zustand
- **Web3**: ethers.js, wagmi, viem

## Code Conventions

### Component Structure

- Functional components with hooks only
- TypeScript strict mode enabled
- Styled-components for styling (no CSS modules)

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- Types: `types.ts` or `*.types.ts`

### Import Order

1. External libraries (react, ethers, etc.)
2. Internal packages (@kyberswap/\*)
3. Local imports (relative paths)
4. Types
5. Styles

## Key Patterns

### Widget Integration

```typescript
// Import from package
import { LiquidityWidget } from '@kyberswap/liquidity-widgets'

// Use with required props
<LiquidityWidget
  poolAddress="0x..."
  chainId={1}
  onClose={() => {}}
/>
```

### State Management

- Use Redux for global app state
- Use RTK Query for API/server state
- Use zustand for widget-local state

## Domain Knowledge

### Zap (Liquidity Provision)

- **Zap In**: Add liquidity with a single token or multi tokens (auto-converts to LP)
- **Zap Out**: Remove liquidity and receive a single token or manually remove liquidity as normal
- **Migration**: Move LP position between pools or protocols

## External Resources

- Website: https://kyberswap.com/
- Documentation: https://docs.kyberswap.com/
- GitHub: https://github.com/KyberNetwork/kyberswap-interface

## Contributing

All pull requests should target the `main` branch. CI checks run automatically on PRs.
