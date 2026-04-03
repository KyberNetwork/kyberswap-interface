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
- **Always prefer absolute imports** over relative imports when possible. Use path aliases (e.g., `components/...`, `utils/...`, `hooks/...`) instead of relative paths (e.g., `../../components/...`).

## Code Quality Rules (MUST follow)

When writing or modifying code, **always** ensure the result is free of:

1. **TypeScript errors/warnings** — no `any` unless absolutely necessary (and justified with a comment), no implicit `any`, no unused variables/imports, no type mismatches. Run mental type-checking on every change.
2. **ESLint violations** — follow all project ESLint rules. Key rules include:
   - No unused imports or variables (`unused-imports/no-unused-imports`)
   - Proper React hooks dependency arrays (`react-hooks/exhaustive-deps`)
   - Proper import ordering
3. **Prettier formatting** — all code must match the project's Prettier config (single quotes, trailing commas, semicolons, print width). Format code consistently.

**Workflow**: After making changes, mentally verify TypeScript correctness, ESLint compliance, and Prettier formatting. When in doubt, run `pnpm lint` and `pnpm type-check` on the affected package to confirm zero errors before considering the task done.

## Color & Styling Rules

- **Always use theme colors** — never hardcode hex/rgb values. Use `${({ theme }) => theme.colorName}` in styled-components. Check `src/theme/color.ts` for existing tokens before introducing new colors.
- Key tokens: `primary`, `text`, `subText`, `background`, `border`, `red1`, `warning`, `buttonBlack`, `buttonGray`, `tableHeader`, etc.

## Number Formatting Rules

- **Always reuse existing formatters** — before writing any number formatting logic, check the existing utilities:
  - `formatDisplayNumber()` from `utils/numbers.ts` (app-level, supports `decimal`/`currency`/`percent`)
  - `formatDisplayNumber()`, `formatTokenAmount()`, `formatCurrency()`, `formatNumber()`, `formatWei()`, `formatAprNumber()` from `@kyberswap/utils`
  - `formatTokenBalance()`, `formatBigLiquidity()`, `formatLongNumber()` from `utils/formatBalance.ts`
- Do **not** use deprecated formatters (`formatDollarAmount`, `formattedNum`, `formatCurrencyAmount`).
