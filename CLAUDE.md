# KyberSwap Interface

Unified frontend monorepo for Kyber Network DeFi products (Aggregator, Limit Orders, Zap Widgets, and Cross-Chain Swaps).

## Quick Start

```bash
pnpm i
pnpm build-package                         # Required: builds shared workspace packages
cd apps/kyberswap-interface
pnpm dev
```

## Development Commands

| Command              | Purpose                              |
| -------------------- | ------------------------------------ |
| `pnpm i`             | Install all dependencies             |
| `pnpm build-package` | Build shared packages only           |
| `pnpm build`         | Build all apps and packages          |
| `pnpm lint`          | Run ESLint across all workspaces     |
| `pnpm type-check`    | Run TypeScript checks                |
| `pnpm audit --prod`  | Check production deps for vulnerabilities |

## Before Committing

```bash
pnpm lint
pnpm type-check
pnpm build
pnpm audit --prod
```

## Tech Stack

- React 18 + TypeScript + Vite
- pnpm workspaces + Turborepo
- styled-components (no CSS Modules, no inline styles)
- Redux Toolkit + RTK Query (app state), zustand (widget state)
- ethers.js, wagmi, viem

## Code Conventions

- Use functional components with hooks only
- TypeScript strict mode is required; no unjustified `any`
- Naming:
  - Components: `PascalCase.tsx`
  - Hooks: `useCamelCase.ts`
  - Utils: `camelCase.ts`
- Import order:
  1. External libraries
  2. `@kyberswap/*`
  3. Local imports
  4. Types
  5. Styles

## Code Quality Rules (MUST Follow)

When writing or modifying code, always ensure the result has:

1. **Zero TypeScript errors/warnings**
   - No implicit `any`
   - No unused variables/imports
   - No type mismatches

2. **Zero ESLint violations**
   - No unused imports/variables (`unused-imports/no-unused-imports`)
   - Correct hook dependency arrays (`react-hooks/exhaustive-deps`)
   - Correct import ordering

3. **Prettier-compliant formatting**
   - Respect project config (single quotes, trailing commas, semicolons, print width)

### Mandatory Validation Workflow

After any change, run and fix issues until clean:

```bash
pnpm lint
pnpm type-check
```

Format all modified files with Prettier before finalizing.

## Security Rules (MUST Follow)

- **Always validate transaction context** before sending/signing:
  - Verify connected `chainId` matches expected network
  - Reject zero-address or malformed token/recipient addresses
  - Block unsafe infinite approvals unless explicitly required by UX
- **Always run dependency vulnerability checks** before merging:
  - `pnpm audit --prod`

## Color & Styling Rules

- Always use theme tokens; never hardcode hex/rgb values
- In styled-components, use `${({ theme }) => theme.colorName}`
- Check `src/theme/color.ts` before adding any new color token
- Common tokens: `primary`, `text`, `subText`, `background`, `border`, `red1`, `warning`, `buttonBlack`, `buttonGray`, `tableHeader`

## Number Formatting Rules

- Reuse existing formatters before creating new logic:
  - `formatDisplayNumber()` from `utils/numbers.ts` (supports `decimal` / `currency` / `percent`)
  - `formatDisplayNumber()`, `formatTokenAmount()`, `formatCurrency()`, `formatNumber()`, `formatWei()`, `formatAprNumber()` from `@kyberswap/utils`
  - `formatTokenBalance()`, `formatBigLiquidity()`, `formatLongNumber()` from `utils/formatBalance.ts`
- Do **not** use deprecated formatters:
  - `formatDollarAmount`
  - `formattedNum`
  - `formatCurrencyAmount`