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
- wagmi, viem

> **Note — `apps/og-service`:** a standalone **Node (Hono)** service (OG social-preview cards +
> per-route `<head>` injection), not part of the React app. The stack above and the React / Tailwind /
> styling / state / number-formatter rules below **do not apply** to it — it has its own conventions
> in [`apps/og-service/CLAUDE.md`](apps/og-service/CLAUDE.md). Run it with `pnpm dev:og`.

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

## Styling Conventions (Tailwind-first)

The app has been migrated off styled-components / rebass / polished. All new code MUST follow these rules.

### Colors

- **Always use theme tokens** — never hardcode hex/rgb. Prefer Tailwind utility classes (`bg-primary`, `text-subText`, `border-border`); check `src/theme/color.ts` and `tailwind.config.ts` for existing tokens before adding new ones.
- Key tokens: `primary`, `text`, `subText`, `background`, `border`, `red`, `warning`, `buttonBlack`, `buttonGray`, `tableHeader`, `gray`, `blue1-3`, `text2-6`, etc.
- Alpha-blended variants exist as named tokens: `subText-20`, `primary-10/12/15/20/25/30/40/50`, `red-10/20/25/30/35`, `warning-10/20/25/30/35`, `white-04/08/60`, `text-04/08/12/60`, `buttonBlack-40/60`. See `tailwind.config.ts` for the full list.
- For dynamic alpha not covered by a named variant, use Tailwind's opacity modifier (`bg-buttonGray/70`, `border-border/40`, `text-white/[0.92]`) — supported on tokens whose Tailwind entries use the `<alpha-value>` placeholder.
- Arbitrary `[#hex]` is acceptable for one-off colors not in the theme; promote to a named token only if reused 3+ times.

### Class composition

- **Always use `cn()`** from `utils/cn` to compose classNames. Never use template literals (`` `foo ${cond ? 'a' : 'b'}` ``).
  - `cn()` runs `tailwind-merge` so conflicting classes deduplicate; the prettier-plugin-tailwindcss can sort static strings inside it.
  - `cn(undefined)` / `cn(false)` / `cn('')` are safe — no need for `?? ''` fallbacks.
- For components with ≥2 axes of style variants (size × variant, status × emphasis), use `cva` (`class-variance-authority`) instead of nested ternaries in `cn()`. See `components/Badge/index.tsx` and `components/SegmentedControl/index.tsx` for the pattern.

### Inline `style={{}}`

- Only use inline `style` for genuinely runtime values:
  - JS variables and computed expressions (`width: size`, `transform: \`rotate(\${n}deg)\``)
  - Computed colors (`hexAlpha(theme.X, runtimeAlpha)`)
  - CSS variables on the consumer element (`--ks-scrollbar-thumb: ...`)
  - framer-motion `animate`/`initial`/`variants`/`whileHover` props (not `style`, but related)
  - Spread merges (`style={{ ...style, ... }}`)
- For static colors / spacing / layout, use Tailwind classes — never inline.

### `useTheme()`

- Only for runtime color strings consumed by non-DOM libraries: chart libs (recharts, lightweight-charts), `react-loading-skeleton`'s `highlightColor`, framer-motion `whileHover`/`animate` color values, third-party SVG `stroke`/`fill` props.
- NEVER for `style={{ color: theme.X }}` / `style={{ background: theme.X }}` — use a Tailwind class instead.

### `hexAlpha`

- Reserve `hexAlpha(color, alpha)` from `utils/colorAlpha.ts` for runtime computed colors (chart libs, runtime-dynamic backgrounds).
- For STATIC theme color + STATIC alpha, use the Tailwind opacity modifier instead: `bg-warning/30`, `text-white/[0.92]`, `bg-primary-10` (named variant), etc.

### Icons

- New icons in `components/Icons/` must use `currentColor` for `fill` / `stroke` and accept only `className` (plus optional `size` and `style`).
  - Default the visual color via a baked-in Tailwind class on the SVG (`text-subText`, `text-primary`, etc.).
  - Consumers override via `<Icon className="text-X" />` (or `style={{ color: runtimeValue }}` for dynamic colors).
- Multi-color brand marks (`OptimismLogoFull`, `PolygonLogoFull`, `PoweredByIconDark`) are the exception — keep their hardcoded fills.

### Layout wrappers

- `Row` / `RowBetween` / `RowFit` / `RowFixed` / `AutoRow` / `Column` / `ColumnCenter` / `AutoColumn` / `Stack` / `HStack` / `Center` are thin `forwardRef` divs that ONLY accept `HTMLAttributes` + `className` + an optional `as` prop (Stack family).
- They do NOT accept shorthand props (`sx`, `mt`, `mx`, `px`, `gap`, `width`, `height`, `align`, `justify`, `direction`, etc.) — control layout via Tailwind classes instead.
- When introducing a new layout primitive, follow the same one-line pattern: `forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => <div ref={ref} className={cn('flex …', className)} {...rest} />)`.

### Adding a new color token

When promoting a color to `tailwind.config.ts`:

1. Define the CSS variable in `src/tailwind.css` under `:root` (e.g. `--ks-newToken: #abcdef;`).
2. For tokens that should support Tailwind's `/N` opacity modifier, also add an RGB-triple variable (`--ks-newToken-rgb: 171 205 239;`).
3. In `tailwind.config.ts`, register the token as `'newToken': 'rgb(var(--ks-newToken-rgb) / <alpha-value>)'` (or `'var(--ks-newToken)'` if no opacity modifier is needed).
4. Export the matching key from `src/theme/color.ts` so `useTheme()` returns it (for chart-lib / runtime use).

### CSS files

- Only justified for: third-party library overrides (CKEditor, `@reach/dialog`, `@near-wallet-selector`), scrollbar vendor pseudo-elements, or keyframes that don't fit `tailwind.config.ts` `keyframes`.
- Shared keyframes and one-off `ks-*` utilities live in `src/tailwind.css` under `@layer components`. Per-feature CSS files have been removed.
- For scrollbar styling, use the `.ks-scrollbar` utility (in `tailwind.css`) and override its CSS variables (`--ks-scrollbar-width`, `--ks-scrollbar-thumb`, `--ks-scrollbar-radius`) via inline style on the consumer.

## Number Formatting Rules

- **Always reuse existing formatters** — before writing any number formatting logic, check the existing utilities:
  - `formatDisplayNumber()` from `utils/numbers.ts` (app-level, supports `decimal`/`currency`/`percent`)
  - `formatDisplayNumber()`, `formatTokenAmount()`, `formatCurrency()`, `formatNumber()`, `formatWei()`, `formatAprNumber()` from `@kyberswap/utils`
  - `formatTokenBalance()`, `formatBigLiquidity()`, `formatLongNumber()` from `utils/formatBalance.ts`
- Do **not** use deprecated formatters (`formatDollarAmount`, `formattedNum`, `formatCurrencyAmount`).
