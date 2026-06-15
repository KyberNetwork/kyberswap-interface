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

/**
 * Cap on bytes buffered from an upstream JSON response before JSON.parse — bounds memory if a
 * malicious/buggy upstream (or a WAF) returns a huge body. 2 MiB comfortably covers the token-list
 * and pool-explorer payloads.
 */
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

/**
 * Read a fetch Response body into an ArrayBuffer, aborting once `maxBytes` is exceeded. Checks the
 * Content-Length header first (cheap reject) then enforces the cap while streaming, so a lying or
 * absent Content-Length can't bypass the limit. Throws if the body is too large or unreadable.
 */
export async function readBoundedArrayBuffer(res: Response, maxBytes: number): Promise<ArrayBuffer> {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new Error(`Upstream response too large: ${declared} > ${maxBytes} bytes`);
  }

  if (!res.body) {
    const buf = await res.arrayBuffer();
    if (buf.byteLength > maxBytes) {
      throw new Error(`Upstream response too large: ${buf.byteLength} > ${maxBytes} bytes`);
    }
    return buf;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new Error(`Upstream response too large: exceeded ${maxBytes} bytes`);
        }
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out.buffer;
}

/**
 * Read at most `maxBytes` of a response body as text (default: a JSON payload). Returns null instead of
 * throwing when the body is missing, over the cap, or unreadable — callers treat that as an upstream miss.
 */
export async function readBoundedText(res: Response, maxBytes = MAX_RESPONSE_BYTES): Promise<string | null> {
  try {
    return new TextDecoder().decode(await readBoundedArrayBuffer(res, maxBytes));
  } catch {
    return null;
  }
}
