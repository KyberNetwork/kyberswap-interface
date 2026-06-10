# KyberSwap OG Service

A small **Node (Hono)** HTTP service that adds dynamic social-preview (Open Graph) cards + per-route
`<head>` meta to KyberSwap swap/limit pair links and pool-detail pages. It is intended to run as an
**origin service** (behind a CDN/proxy): `/og/*` generate the card PNGs, the page routes inject
per-route `<head>` meta into the served HTML, and everything else is served statically.

## What it does

| Path                                                                   | Behavior                                                                                             |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/og/swap`, `/og/limit` (`?chain=&in=&out=`)                           | Generate a cached 1200×630 PNG (two token logos + symbols + brand).                                  |
| `/og/pool` (`?chain=&address=&protocol=`)                              | Generate the pool card PNG.                                                                          |
| `/swap/<net>/<in>-to-<out>`, `/limit/...` (+ legacy `?inputCurrency=`) | Read the app HTML, inject pair `<head>` OG/Twitter meta (`og:image` → `/og/swap?…`). Body untouched. |
| `/pools/<chain>/<protocol>/<address>`                                  | Inject per-pool `<head>` meta (self-canonical + index).                                              |
| `/pools/add-liquidity?exchange=&poolChainId=&poolAddress=`             | **301** to the canonical path form.                                                                  |
| bare `/swap/<net>` landing, other routes                               | Serve the prerendered/static HTML as-is.                                                             |

Token/pool metadata comes from the **public** ks-setting / earn-service APIs (a browser User-Agent is
sent — they 403 bare node UAs). Generated PNGs + resolved tokens are cached in an in-memory LRU.

## Implementation notes

- **Image:** `satori` + `@resvg/resvg-js` (`og.ts`).
- **Head inject:** `cheerio` (`headInject.ts`) — only the targeted OG/X/title tags change.
- **Cache:** `lru-cache` (`cache.ts`) — swap for a Redis-backed impl (same get/set surface) if you run
  many instances and want a shared cache that survives restarts.
- **App HTML source:** read from disk (`static.ts`, `STATIC_DIR`).
- **SSRF hardening:** the token-logo fetch uses `redirect: 'manual'` (a vetted host can't 302 the
  fetch to an internal IP) plus https / no-IP / no-localhost / default-port checks. Logo bytes are
  mime-allowlisted (PNG/JPEG), size-bounded, and timed out.

## Config (env)

Only three deploy-specific values come from env — everything else (port, paths, fonts) is a fixed
default in `src/config.ts`.

| Var                  | Default                                                   | Purpose                                                                          |
| -------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `PUBLIC_BASE`        | `https://kyberswap.com`                                  | Public origin for absolute `og:image`/canonical URLs (pre-release host on staging) |
| `KS_SETTING_TOKENS`  | `https://ks-setting.kyberswap.com/api/v1/tokens`         | Token-list API (override only for a staging/mock backend)                        |
| `EARN_SERVICE_POOLS` | `https://earn-service.kyberswap.com/api/v1/explorer/pools` | Pool explorer API (override only for a staging/mock backend)                      |

All **optional** — the service runs on the defaults with no env file. To override locally, copy
`.env.example` → `.env` (auto-loaded; a real environment variable still takes precedence). Fixed
(not env): `PORT` 8788, fonts from bundled `fonts/`, and the interface HTML from `/app/static` (Docker)
or the sibling app `build/` (local dev).

## Local dev

```bash
# 1) build the interface so the static HTML exists (once):
pnpm --filter @kyberswap/interface build

# 2) run the service (from repo root):
pnpm dev:og                    # http://localhost:8788

# image (open in a browser to see it):
#   http://localhost:8788/og/swap?chain=ethereum&in=eth&out=usdc
# head inject:
curl -s http://localhost:8788/swap/ethereum/eth-to-usdc | grep -i 'og:image\|<title>'
```

## Fonts

The card font (Inter) is bundled under `fonts/` so rendering works offline with no runtime font
dependency. Inter is licensed under the SIL Open Font License (see `fonts/OFL.txt`).
