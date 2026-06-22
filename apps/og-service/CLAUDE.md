# og-service

A standalone **Node (Hono)** HTTP service that generates Open-Graph social-preview PNGs and injects
per-route `<head>` meta for KyberSwap swap/limit/pool links. See `README.md` for the route table.

> **This is NOT the React app.** The root/`apps/kyberswap-interface` CLAUDE.md rules about React,
> Tailwind, `cn()`, styled-components, Redux/RTK, layout primitives, number formatters, etc. **do not
> apply here.** This is a small backend service with its own stack and conventions, below.

## Stack

- **Hono** (`@hono/node-server`) — HTTP routing.
- **satori** + **@resvg/resvg-js** — HTML → SVG → PNG card rendering (`og.ts`).
- **cheerio** — `<head>` rewriting (`headInject.ts`).
- **lru-cache** — in-process cache (`cache.ts`).
- **tsx** — runs the TypeScript directly; **no build step** (dev and prod both run `src/server.ts`).

## Standalone constraint

This package **does NOT import app code** (`@/` resolves to `og-service/src`, not the interface). Any
value mirrored from the app (chain slug→id map in `networks.ts`, sentinel addresses, robots strings)
is kept literal here and must be **kept in sync manually** if it changes in the app.

## Commands

From the service dir (or `pnpm <script>` via the root filters `dev:og` / `start:og`):

```bash
pnpm dev          # tsx watch (http://localhost:8788)
pnpm start        # tsx (prod-style run)
pnpm type-check   # tsc --noEmit
pnpm lint         # eslint
pnpm format       # prettier --write
```

Head-injection routes need the interface build: `pnpm --filter @kyberswap/interface build` once.

## Conventions

- **Imports:** absolute `@/...` (alias `@/* → ./src/*` in `tsconfig.json`). Order + sorting are
  enforced by Prettier (`@trivago/prettier-plugin-sort-imports`): node/3rd-party → `@/` → relative,
  blank line between groups.
- **Style:** semicolons, single quotes, print width 120, `arrowParens: avoid`. Config is **standalone**
  (`.eslintrc.cjs` / `.prettierrc.cjs` replicate the monorepo rules without `@kyber/*` workspace deps,
  so the service stays self-contained). The sort-imports plugin is loaded via `require.resolve(...)` so
  an editor running ESLint from the repo root picks this package's v4 (a bare name resolves to a
  hoisted older version that mangles TS generics).
- **Comments:** keep the load-bearing "why" comments (see Gotchas); drop restated-obvious ones.
- After any change: `pnpm lint && pnpm type-check` must be clean.

## Config / env

Only **three** values come from env (`config.ts`): `PUBLIC_BASE`, `KS_SETTING_TOKENS`,
`EARN_SERVICE_POOLS` — all with prod defaults. Everything else is a fixed constant (`PORT` 8788,
bundled `fonts/`, `STATIC_DIR` auto-detects `/app/static` in Docker else the sibling app `build/`).
Nothing secret lives in the repo; deploy-specific values come from the environment.

## Gotchas (don't regress these — they were each a real bug)

- **WAF needs a browser User-Agent.** ks-setting / earn-service and the token-logo CDNs return **403**
  for requests without a browser-like `User-Agent` → `BROWSER_UA` in `constants.ts`. Don't drop it.
- **Satori requires `display:flex`** on every `<div>` with more than one child, or render throws.
- **Fonts must be static TTF.** Bundled `fonts/WorkSans-400.ttf` / `fonts/WorkSans-700.ttf` (Work Sans,
  matching the interface). A _variable_ TTF crashes Satori, and Google Fonts now serves WOFF (not the TTF
  Satori needs), so don't rely on runtime fetch. Note Work Sans lacks some exotic symbol glyphs (e.g.
  U+20AE ₮), which render as tofu in token symbols — add a wide-coverage fallback font if that matters.
- **SSRF surface = the logo fetch.** `logoURI` comes from the community-influenced token list. Keep the
  `isPublicHost` DNS private-IP block (`ssrf.ts`) + `redirect: 'manual'` + https/no-IP/no-localhost
  checks — this runs at the origin, so an SSRF could reach internal services.
- **Cache TTLs use lazy expiry** (`ttlAutopurge: false`) because the 1-year image/font TTLs overflow
  `setTimeout`'s 2³¹ limit.
- **`networks.ts`** is a hand-maintained slug→chain map — add new mainnet chains here. The non-EVM
  cross-chain chains (`near`/`solana`/`bitcoin`) and their native-token symbols/logos live here and in
  `crosschain.ts`, mirrored literally from the app's `NonEvmChainInfo` / `BitcoinToken` — keep in sync.

## Docker / deploy

Runs via `node --import tsx src/server.ts`. Install uses **pnpm** (corepack) standalone:
`pnpm install --prod --frozen-lockfile --ignore-workspace` against the package's own `pnpm-lock.yaml`
(the monorepo dev install uses the root lockfile). The interface build must be present at `/app/static`.
Deployment specifics are intentionally kept out of the (public) repo.
