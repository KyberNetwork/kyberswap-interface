// Public, non-secret constants mirrored from the app (kept literal — this package doesn't import app code).
import { PUBLIC_BASE } from '@/config';

/** Static fallback OG card shown when a pair/pool can't be resolved (mirrors index.html's og:image). */
export const DEFAULT_OG_IMAGE = `${PUBLIC_BASE}/kyberswap-og-image.png?version=2023`;

/** Native-currency sentinel address (app ETHER_ADDRESS), lowercased; and the zero address. */
export const NATIVE_SENTINEL = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** robots directives (mirror src/components/Seo/seoConfig.ts). */
export const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
export const NOINDEX_ROBOTS = 'noindex,follow';

/**
 * Browser-like User-Agent for upstream fetches. ks-setting / earn-service sit behind a WAF that 403s
 * requests without a browser-like UA; the token-logo CDNs also 403 bare fetches. Spoof a browser.
 */
export const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
