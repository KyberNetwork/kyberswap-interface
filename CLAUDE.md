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
- Tailwind CSS (utility-first, via the `cn()` helper from `utils/cn`; avoid inline `style` and styled-components — both are deprecated in this app)
- Redux Toolkit + RTK Query (app state), zustand (widget state)
- ethers.js, wagmi, viem

## Code Conventions

- Functional components with hooks only
- TypeScript strict mode, no unjustified `any`
- Components: `PascalCase.tsx`, Hooks: `useCamelCase.ts`, Utils: `camelCase.ts`
- Import order: external libs → `@kyberswap/*` → local imports → types → styles

## Code Quality Rules (MUST follow)

When writing or modifying code, **always** ensure the result is free of:

1. **TypeScript errors/warnings** — no `any` unless absolutely necessary (and justified with a comment), no implicit `any`, no unused variables/imports, no type mismatches. Run mental type-checking on every change.
2. **ESLint violations** — follow all project ESLint rules. Key rules include:
   - No unused imports or variables (`unused-imports/no-unused-imports`)
   - Proper React hooks dependency arrays (`react-hooks/exhaustive-deps`)
   - Proper import ordering
3. **Prettier formatting** — all code must match the project's Prettier config (single quotes, trailing commas, semicolons, print width). Format code consistently.

**Workflow (MANDATORY)**: After making any code changes, you **MUST** run the following commands on the affected package(s) and fix all errors before considering the task done:

```bash
pnpm lint          # Fix all ESLint errors/warnings
pnpm type-check    # Fix all TypeScript errors
```

Format all modified files with Prettier. Do **NOT** present code changes as complete until these checks pass with zero errors. If any check fails, fix the issues and re-run until clean.

## Color & Styling Rules

- **Always use theme colors** — never hardcode hex/rgb values. Prefer Tailwind utility classes (e.g. `bg-primary`, `text-subText`, `border-border`); for runtime / chart-library color strings, read from `useTheme()` in `hooks/useTheme.ts`. Check `src/theme/color.ts` for existing tokens before introducing new colors.
- Key tokens: `primary`, `text`, `subText`, `background`, `border`, `red`, `warning`, `buttonBlack`, `buttonGray`, `tableHeader`, etc. Alpha-blended variants exist (`subText-20`, `primary-15/20/25/30/50`, `red-10/20/25/30/35`, `warning-10/20/25/30/35`, `white-04/08/60`, etc.); see `tailwind.config.ts` for the full list.
- For dynamic alpha not covered by a pre-defined token, use Tailwind's opacity modifier (`bg-buttonGray/70`, `border-border/40`) — supported on the major tokens whose Tailwind entries use the `<alpha-value>` placeholder.

## Number Formatting Rules

- **Always reuse existing formatters** — before writing any number formatting logic, check the existing utilities:
  - `formatDisplayNumber()` from `utils/numbers.ts` (app-level, supports `decimal`/`currency`/`percent`)
  - `formatDisplayNumber()`, `formatTokenAmount()`, `formatCurrency()`, `formatNumber()`, `formatWei()`, `formatAprNumber()` from `@kyberswap/utils`
  - `formatTokenBalance()`, `formatBigLiquidity()`, `formatLongNumber()` from `utils/formatBalance.ts`
- Do **not** use deprecated formatters (`formatDollarAmount`, `formattedNum`, `formatCurrencyAmount`).
