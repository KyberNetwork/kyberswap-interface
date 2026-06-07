# KyberSwap OG Edge Worker

A small Cloudflare Worker that adds **dynamic social-preview (Open Graph) cards** to KyberSwap swap
and limit-order pair links — without a page-render server. It sits at the Cloudflare edge in front of
the existing GKE/nginx static origin and changes **nothing** on the origin side.

This is Phase 4 of the SSR/SEO migration (`../../SSR_MIGRATION_PLAN.md`). It is the highest-visible-
value phase: pasting a pair link into Telegram / X / Discord shows the two tokens' logos + symbols.

## What it does

| Path | Behavior |
| --- | --- |
| `/swap/<net>/<in>-to-<out>`, `/limit/<net>/<in>-to-<out>` (+ legacy `?inputCurrency=&outputCurrency=`) | **Job A** — fetch origin HTML, rewrite `<head>` OG/Twitter meta per request (title `Swap X → Y \| KyberSwap`, `og:image` → `/og/swap?…`). Body untouched; SPA still hydrates. |
| `/pools/<chain>/<protocol>/<address>` | **Job A (pool)** — rewrite `<head>` with per-pool meta (`USDC/WETH 0.05% Pool \| KyberSwap`, `og:image` → `/og/pool?…`). Tokens resolved from the earn-service explorer endpoint. |
| `/pools/add-liquidity?exchange=&poolChainId=&poolAddress=` | **301** to the canonical `/pools/<chain>/<protocol>/<address>` (legacy URL → path form, for SEO consolidation). |
| `/og/swap`, `/og/limit` (`?chain=&in=&out=`), `/og/pool` (`?chain=&address=&protocol=`) | **Job B** — generate a cached 1200×630 PNG (two token logos + symbols + brand). |
| everything else (incl. bare `/swap/<net>` landing) | passes straight through to origin. |

Token metadata (symbol + `logoURI`) is resolved at request time from the **public** ks-setting
token-list API (`https://ks-setting.kyberswap.com/api/v1/tokens`) — no auth, no app imports. Native
tokens resolve via the EEE sentinel address; ERC-20s by address; whitelisted tokens by symbol.
Resolutions, logos, the font, and the generated PNG are all cached in `caches.default`.

## Architecture notes

- **No app code is imported.** The worker is a standalone deployable with its own `package.json`. It
  is **not** a pnpm-workspace member (the root globs are `apps/*` / `packages/*`), so the app's
  install/build/type-check/lint never touch it.
- **`networks.ts` is a hand-maintained copy** of the app's slug → `{chainId, nativeSymbol}` map
  (from `NETWORKS_INFO[chainId].route`). If a new **mainnet** chain ships in the app, add its row
  here too, or its pair links fall back to the default card.
- **Pool OG (`/pools/<chain>/<protocol>/<address>`)** is handled (Phase 5 tier 0). Pool tokens come
  from the public earn-service explorer endpoint (`/v1/explorer/pools?chainId=&q=<address>`, which
  carries `logoURI` + `feeTier`). The legacy query-param pool URL 301-redirects to the path form.
  Top-N pool prerender (tiers 1/2) stays deferred per the plan.
- **`<head>` rewrite only touches OG/Twitter tags + `<title>`.** `<link rel="canonical">` and
  `robots` are left as-is, so pair routes keep the app's existing noindex + canonical-to-landing SEO.

## Local development

```bash
cd apps/kyberswap-interface/workers/og
npm install
npm run cf-typegen     # generates worker-configuration.d.ts (commit it)
npm run type-check     # tsc --noEmit
npm run dev            # wrangler dev — http://localhost:8787
```

Try locally (the image endpoint works in `wrangler dev`; head injection needs an origin to fetch, so
test Job A against the deployed worker or with `--remote`):

```bash
# Job B — should return a PNG
curl -s 'http://localhost:8787/og/swap?chain=ethereum&in=eth&out=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' -o card.png
open card.png
```

## Deploy

> **Requires a Paid (Workers Standard) plan.** OG PNG generation (Satori + resvg rasterization)
> exceeds the Free plan's 10 ms CPU limit. Generated PNGs are cached hard (1 year), so the CPU cost
> is paid once per unique pair per PoP.

Two options — prefer the Terraform one for production so the worker tracks the rest of the
Cloudflare config-as-code:

1. **Terraform (production / canonical).** The zone is managed in
   `kyber-infra-v2/infra/shared/cloudflare/*`. Add a `cloudflare_workers_script` +
   `cloudflare_workers_route` (or the existing `cloudflare/worker` module) for `kyberswap.com`
   bound to `/og/*`, `/swap/*`, `/limit/*`. This is the **first** Worker in the account; the
   account/zone/IaC pipeline already exists.

2. **wrangler (quick / staging).**
   ```bash
   npx wrangler login
   npm run deploy        # uses the routes in wrangler.jsonc
   ```

Either way the worker deploy is a **separate pipeline** from the app image (it does **not** go through
the app's ArgoCD release).

## Validation

After deploy, validate the cards (each platform caches OG data — **re-scrape** after changes):

- **X / Twitter:** https://cards-dev.twitter.com/validator
- **Facebook (also used by many apps):** https://developers.facebook.com/tools/debug/
- **Telegram:** paste the link in a chat / use @WebpageBot to refresh
- **Discord / LinkedIn:** paste the link; LinkedIn has https://www.linkedin.com/post-inspector/

Sample links:

```
https://kyberswap.com/swap/ethereum/eth-to-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48   # ETH → USDC
https://kyberswap.com/swap/bnb/bnb-to-usdt
https://kyberswap.com/og/swap?chain=ethereum&in=eth&out=usdc                            # raw PNG
```

## Security & resilience

Hardened against the failure/abuse modes an adversarial review surfaced:

- **SSRF guard** — logo fetches (`logoURI`, sourced from the community-influenced token list) are
  restricted to plain `https` URLs on the default port with a non-IP hostname; mime is allowlisted to
  PNG/JPEG; the emitted data URI must match a strict base64 shape (no attribute-injection into the
  card HTML).
- **Amplification guard** — `/og` params are length-bounded; a *provided* token id that doesn't
  resolve yields the default card instead of forcing a render; token-resolution **misses are
  negatively cached** so a flood of random ids can't hammer ks-setting. PNGs are buffered and only
  cached when the render verifiably succeeds (no cached broken images).
- **Fail-soft** — `ctx.passThroughOnException()` makes any uncaught error fall back to plain origin
  behavior (never a 1101 on a swap route); all subrequests (tokens, logos, fonts) have timeouts and
  null-fallbacks; error/non-2xx origin responses are passed through unrewritten.
- **Recommended (infra):** add a Cloudflare **WAF rate-limit rule on `/og/*`** as defense-in-depth
  against render-cost abuse — the worker bounds per-render cost but not aggregate request rate.

## Tuning levers

- **Real-user latency:** Job A waits at most `HEAD_TIMEOUT_MS` (1500 ms) for token resolution, then
  serves the page unchanged. To eliminate any added latency for human traffic, gate Job A on a
  crawler User-Agent allowlist in `index.ts` (bots get rewritten meta; browsers pass straight
  through and set meta client-side via `RouteSeo`).
- **Font:** `font.ts` fetches Inter from Google Fonts once and caches the binary. For full
  determinism, bundle a `.ttf` as a wrangler `[[rules]] type=Data` import instead.
- **Cache TTLs:** token resolution 1 day, font + PNG 1 year (`tokens.ts` / `font.ts` / `index.ts`).
