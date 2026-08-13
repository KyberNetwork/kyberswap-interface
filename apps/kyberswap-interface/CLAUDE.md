# KyberSwap Interface App

Main KyberSwap web application - DeFi interface for swapping tokens, providing liquidity, and managing positions across 16+ blockchain networks.

## Directory Structure

```
src/
├── components/          # Shared React components
├── pages/               # Route pages
├── hooks/               # Custom React hooks
├── state/               # Redux state management
├── services/            # API services
├── utils/               # Utility functions
├── constants/           # App constants, chain configs
├── theme/               # Theme color tokens + global styles (consumed via Tailwind CSS vars)
└── App.tsx              # Root component with route definitions
```

## State Management

- **Redux Toolkit**: Global app state (`state/swap/`, `state/user/`, `state/wallet/`)
- **RTK Query**: API/server state (`state/apis/`)
- **Local State**: Component-specific state

## Environment Variables

A single committed `.env` (production values) is the only env file — there are no per-mode
`.env.dev` / `.env.stg` / `.env.production` files. Vite loads `.env` in every mode, so `pnpm dev`,
`pnpm start`, and `pnpm build` all read the same values. All variables are `VITE_`-prefixed and
therefore exposed to the client bundle — never put server-side secrets here.

`constants/env.ts` hard-throws if a required `VITE_*` is missing.

## Styling

This app is Tailwind-first; `styled-components` / `rebass` / `polished` have been removed. See the **Styling Conventions** section in the root `CLAUDE.md` for the full rules (className composition, `useTheme`, layout wrappers, icons, `cva`, `hexAlpha`, CSS files, adding color tokens).

Key invariants:

- Compose classNames via `cn()` from `utils/cn` — never template literals.
- `Row` / `Column` / `Stack` (and variants) accept only `className` + standard HTML attrs — no `sx` / `mt` / `gap` shorthand props.
- Inline `style={{}}` only for runtime-dynamic values; static colors/spacing go through Tailwind classes.
- Icons use `currentColor` + `className`; consumers drive color via `text-X` classes.
- `useTheme()` is reserved for non-DOM consumers (chart libs, framer-motion, library color props).
- Multi-axis variant components use `cva` (see `components/Badge/`, `components/SegmentedControl/`).
