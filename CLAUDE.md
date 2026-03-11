# KyberSwap Interface

Unified frontend monorepo for Kyber Network's DeFi products (Aggregator, Limit Orders, Zap Widgets, Cross-Chain Swaps).

## Quick Start

```bash
pnpm i                                    # Install dependencies
pnpm build-package                        # Build shared packages (REQUIRED before running apps)
cd apps/kyberswap-interface && pnpm dev    # Run main interface
```

## Development Commands

| Command              | Purpose                        |
| -------------------- | ------------------------------ |
| `pnpm i`             | Install all dependencies       |
| `pnpm build-package` | Build shared packages only     |
| `pnpm build`         | Build everything               |
| `pnpm lint`          | Run ESLint across all packages |
| `pnpm type-check`    | TypeScript validation          |

## Before Committing

```bash
pnpm lint
pnpm type-check
pnpm build
```

## Tech Stack

- React 18 + TypeScript + Vite
- pnpm workspaces + Turborepo
- styled-components (no CSS modules, no inline styles)
- Redux Toolkit + RTK Query (app state), zustand (widget state)
- ethers.js, wagmi, viem

## Code Conventions

- Functional components with hooks only
- TypeScript strict mode, no unjustified `any`
- Components: `PascalCase.tsx`, Hooks: `useCamelCase.ts`, Utils: `camelCase.ts`
- Import order: external libs → `@kyberswap/*` → local imports → types → styles
