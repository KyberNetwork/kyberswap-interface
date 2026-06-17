// Runtime config. Only three deploy-specific values come from env (so the same image runs in
// staging/prod): the public base URL and the two upstream API URLs. Everything else is a fixed default.
import { existsSync, readFileSync } from 'node:fs';

// Minimal zero-dep .env loader for local dev: if apps/og-service/.env exists, load it WITHOUT
// overriding vars already set in the real environment. The service runs fine with no .env (see
// .env.example). Located relative to this file so it works regardless of cwd.
const envFile = new URL('../.env', import.meta.url).pathname;
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][\w.-]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

// ---- env (deploy-specific) ----

/**
 * Public origin for the absolute og:image / og:url / canonical URLs the service emits. Must be the
 * public domain crawlers hit (prod: https://kyberswap.com; staging: the pre-release host).
 */
export const PUBLIC_BASE = (process.env.PUBLIC_BASE || 'https://kyberswap.com').replace(/\/+$/, '');

/**
 * Upstream data APIs (public, anonymous). Override only to point at a staging/mock backend — the data
 * is the same public token/pool data in any environment, so the prod defaults are normal.
 */
export const KS_SETTING_TOKENS = process.env.KS_SETTING_TOKENS || 'https://ks-setting.kyberswap.com/api/v1/tokens';
export const EARN_SERVICE_POOLS =
  process.env.EARN_SERVICE_POOLS || 'https://earn-service.kyberswap.com/api/v1/explorer/pools';

// ---- fixed (not env) ----

/** Port the HTTP server listens on (the container maps it; no need to make it configurable). */
export const PORT = 8788;

/**
 * Where to read the built interface HTML. Prefers a `static/` dir next to the service — that's where
 * the Docker image puts the build (/app/static) — and falls back to the sibling app build for local
 * dev (`apps/kyberswap-interface/build`).
 */
const bundledStatic = new URL('../static', import.meta.url).pathname;
export const STATIC_DIR = existsSync(bundledStatic)
  ? bundledStatic
  : new URL('../../kyberswap-interface/build', import.meta.url).pathname;

/** Bundled card fonts (WorkSans-400.ttf / WorkSans-700.ttf) — same relative path locally and in Docker. */
export const FONT_DIR = new URL('../fonts', import.meta.url).pathname;
