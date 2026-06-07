// Centralized identity/endpoint constants for the OG worker.
//
// This worker is a standalone deployable and deliberately does NOT import app code (a Cloudflare
// Worker can't pull in the app's Vite/module graph), so these MIRROR the app's values rather than
// sharing a module — keep them in sync with the app if those ever change:
//   - KYBERSWAP_DOMAIN / KYBERSWAP_URL  ← src/constants/index.ts (KYBERSWAP_DOMAIN / KYBERSWAP_URL)
//   - DEFAULT_OG_IMAGE                  ← src/components/Seo/seoConfig.ts (DEFAULT_OG_IMAGE) + index.html
//   - NATIVE_SENTINEL                   ← src/constants/index.ts (ETHER_ADDRESS), lowercased
//   - KS_SETTING_TOKENS                 ← services/ksSetting base (VITE_KS_SETTING_API + /v1/tokens)
//
// They are fixed production values (canonical SEO domain + public API), so they are constants, not
// env vars. If a staging override is ever needed, promote KS_SETTING_TOKENS to a wrangler `[vars]`
// entry and read it off `env` — no other change required.

/** Canonical production domain + base URL (no trailing slash). */
export const KYBERSWAP_DOMAIN = 'kyberswap.com'
export const KYBERSWAP_URL = `https://${KYBERSWAP_DOMAIN}`

/** Static fallback OG card shown when a pair can't be resolved (mirrors index.html's og:image). */
export const DEFAULT_OG_IMAGE = `${KYBERSWAP_URL}/kyberswap-og-image.png?version=2023`

/** Public, anonymously-callable ks-setting token-list endpoint. */
export const KS_SETTING_TOKENS = 'https://ks-setting.kyberswap.com/api/v1/tokens'

/** Public earn-service explorer endpoint — resolves a pool's tokens (symbol + logoURI) + feeTier. */
export const EARN_SERVICE_POOLS = 'https://earn-service.kyberswap.com/api/v1/explorer/pools'

/** Native-currency sentinel address (app ETHER_ADDRESS), lowercased; and the zero address. */
export const NATIVE_SENTINEL = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/** Synthetic origin for caches.default keys — a stable cache namespace, never hits the network. */
export const CACHE_KEY_ORIGIN = 'https://kyberswap-og.internal'

/** robots directives (mirrors src/components/Seo/seoConfig.ts). Used for pool pages, which the worker
 * makes self-canonical + indexable for crawlers (the SPA-fallback HTML ships the homepage canonical). */
export const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
export const NOINDEX_ROBOTS = 'noindex,follow'
