// Build-time prerender (SSG) for bounded public routes.
//
// Runs AFTER `vite build` (which produces build/index.html, the template + client assets).
// It loads src/entry-server.tsx through Vite's own SSR transform pipeline (ssrLoadModule) — the
// same path the Vitest smoke test uses — so SVG `?react`, lingui `.po`, CSS, path aliases and
// `import.meta.env.SSR` all work without a separate SSR bundle. For each route it renders static
// HTML, injects the route-specific <head>, and writes build/<route>/index.html. nginx serves these
// directly and SPA-falls-back to build/index.html for every other route — no Node runtime in prod.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(__dirname, '..')

// Stub origin for the SSR `window.location` shim. Mirrors constants/index KYBERSWAP_URL — the shim is
// installed before ssrLoadModule (so the app constant isn't importable yet), then asserted against the
// app's re-exported `siteUrl` after the module loads (see main) so the two can't silently drift.
const SSR_ORIGIN = 'https://kyberswap.com'
const SSR_HOST = SSR_ORIGIN.replace(/^https?:\/\//, '')

// The route list (`prerenderRoutes`) is derived from app constants and read from the SSR module.

// Minimal browser-global shim (mirrors test/smoke.setup.ts). Some BUILT workspace widgets and
// third-party deps read window/document at module scope; the app's own Phase-1 typeof-window
// guards don't cover those. This is NOT a full DOM — genuine DOM manipulation during render still
// throws, surfacing subtrees that need <ClientOnly>. Must run before ssrLoadModule evaluates modules.
function setupBrowserGlobals() {
  const g = globalThis
  if (g.window) return
  const makeStorage = () => {
    const store = {}
    return {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v)
      },
      removeItem: k => {
        delete store[k]
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k]
      },
      key: i => Object.keys(store)[i] ?? null,
      get length() {
        return Object.keys(store).length
      },
    }
  }
  const localStorage = makeStorage()
  const sessionStorage = makeStorage()
  const noop = () => {}
  const documentShim = {
    title: 'KyberSwap',
    cookie: '',
    documentElement: { style: {}, classList: { add: noop, remove: noop } },
    head: { appendChild: noop, removeChild: noop, querySelector: () => null },
    body: { appendChild: noop, removeChild: noop, classList: { add: noop, remove: noop } },
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    getElementsByClassName: () => [],
    getElementsByTagName: () => [],
    createElement: () => ({ style: {}, setAttribute: noop, appendChild: noop, classList: { add: noop, remove: noop } }),
    createTreeWalker: () => ({ nextNode: () => null, currentNode: null }),
    addEventListener: noop,
    removeEventListener: noop,
  }
  const windowShim = {
    localStorage,
    sessionStorage,
    document: documentShim,
    location: {
      origin: SSR_ORIGIN,
      href: `${SSR_ORIGIN}/`,
      hostname: SSR_HOST,
      pathname: '/',
      protocol: 'https:',
      host: SSR_HOST,
      search: '',
    },
    history: { pushState: noop, replaceState: noop, go: noop, back: noop, forward: noop, length: 0, state: null },
    navigator: { userAgent: 'node', language: 'en-US' },
    open: noop,
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => true,
    matchMedia: () => ({
      matches: false,
      media: '',
      addEventListener: noop,
      removeEventListener: noop,
      addListener: noop,
      removeListener: noop,
    }),
    requestAnimationFrame: cb => setTimeout(() => cb(0), 0),
    cancelAnimationFrame: noop,
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
  }
  g.localStorage = localStorage
  g.sessionStorage = sessionStorage
  g.window = windowShim
  g.document = documentShim
  // NB: do NOT set bare globalThis.location/history — they collide with Vite/Node URL internals
  // ("Invalid URL"). App code reads window.location, which is shimmed above.
  if (!g.navigator)
    Object.defineProperty(g, 'navigator', { value: { userAgent: 'node', language: 'en-US' }, configurable: true })
  for (const name of [
    'Element',
    'HTMLElement',
    'SVGElement',
    'Node',
    'Text',
    'Document',
    'Event',
    'CustomEvent',
    'MouseEvent',
    'KeyboardEvent',
    'DOMParser',
  ]) {
    if (!g[name]) g[name] = class {}
  }
  class ObserverStub {
    observe = noop
    unobserve = noop
    disconnect = noop
    takeRecords = () => []
  }
  for (const name of ['ResizeObserver', 'IntersectionObserver', 'MutationObserver']) {
    if (!g[name]) g[name] = ObserverStub
  }
}

// ssrLoadModule renders dev asset URLs (/src/assets/x.svg). Rewrite them to the hashed production URLs
// from the client build's manifest. A `/src/…` URL with no manifest entry would 404 in production, so we
// throw (fail the build loudly) instead of emitting the dev URL — strip any `?query` suffix before lookup.
function rewriteAssetUrls(html, manifest) {
  return html.replace(/\/src\/[^"')\s>]+/g, m => {
    const entry = manifest[m.slice(1).split('?')[0]] // strip leading '/' + any ?query suffix
    if (!entry?.file) {
      throw new Error(`Prerender emitted a dev asset URL with no manifest entry (would 404 in prod): ${m}`)
    }
    return `/${entry.file}`
  })
}

async function main() {
  // Tell vite.config.ts to skip the browser process/Buffer polyfill (GlobalPolyFill): it's an
  // esbuild@0.24 plugin that crashes Vite 4's esbuild@0.18 dep optimizer here ("Invalid command:
  // on-resolve"). Must be set before createServer loads the config. Node has process/Buffer already.
  process.env.SSR_PRERENDER = '1'

  const template = readFileSync(resolve(appRoot, 'build/index.html'), 'utf8')
  const manifest = JSON.parse(readFileSync(resolve(appRoot, 'build/manifest.json'), 'utf8'))

  // production mode so .env.production is loaded (constants/env.ts hard-throws on missing VITE_*).
  const vite = await createServer({
    root: appRoot,
    mode: 'production',
    appType: 'custom',
    server: { middlewareMode: true },
    logLevel: 'warn',
    // vite.config defines `process.env` -> the whole env object (a client-only workaround). Under
    // Node SSR that splices a giant literal into deps like @lingui/react and breaks parsing — and
    // Node already has a real `process.env`, so neutralize the replacement here (identity).
    define: { 'process.env': 'process.env' },
  })

  try {
    // After the config has loaded (so the shim's window.location can't break Vite's URL internals),
    // but before module evaluation so module-scope browser access in built widgets is satisfied.
    setupBrowserGlobals()
    const { renderRouteSkeleton, buildHeadHtml, prerenderRoutes, sitemapRoutes, siteUrl } = await vite.ssrLoadModule(
      '/src/entry-server.tsx',
    )

    // Fail loudly if the hardcoded shim origin drifts from the app's canonical domain (KYBERSWAP_URL,
    // re-exported as siteUrl) — the two are kept in sync by hand because the shim is set up before the
    // app constant is importable.
    if (new URL(siteUrl).origin !== SSR_ORIGIN) {
      throw new Error(`SSR_ORIGIN (${SSR_ORIGIN}) drifted from app siteUrl origin (${new URL(siteUrl).origin})`)
    }

    // Validate the template placeholders up front so a bad template fails loudly (rather than the
    // post-replace `includes` check, which could false-fire if a rendered body contained the literal).
    if (!template.includes('<div id="app"></div>')) {
      throw new Error('Template is missing the `<div id="app"></div>` placeholder (build/index.html)')
    }
    if (!/<!-- ssr-seo:start[\s\S]*?<!-- ssr-seo:end -->/.test(template)) {
      throw new Error('Template is missing the `<!-- ssr-seo:start/end -->` markers (build/index.html)')
    }
    if (!/<!-- ssr-skeleton:start[\s\S]*?<!-- ssr-skeleton:end -->/.test(template)) {
      throw new Error('Template is missing the `<!-- ssr-skeleton:start/end -->` markers (build/index.html)')
    }

    for (const url of prerenderRoutes) {
      const head = buildHeadHtml(url)
      // Every inject uses a replacement FUNCTION, not a string: rendered head/skeleton HTML can contain
      // `$` sequences ($&, $', $<n>) that String.replace would otherwise interpret as special replacement
      // patterns and silently corrupt the output. A function's return value is inserted verbatim.
      let html = template.replace(
        /<!-- ssr-seo:start[\s\S]*?<!-- ssr-seo:end -->/,
        () => `<!-- ssr-seo:start -->\n    ${head}\n    <!-- ssr-seo:end -->`,
      )

      // Swap the generic cold-load logo for this route's page-shell skeleton (the same <RouteFallback>
      // the client shows while the lazy chunk downloads) so the cold load shows the page shape, not a
      // spinner. Cosmetic only — the body stays the empty <div id="app"></div>; the client createRoot-
      // renders into it (no server-rendered body, no hydration).
      const skeleton = rewriteAssetUrls(renderRouteSkeleton(url), manifest)
      html = html.replace(
        /<!-- ssr-skeleton:start[\s\S]*?<!-- ssr-skeleton:end -->/,
        () => `<!-- ssr-skeleton:start -->\n      ${skeleton}\n      <!-- ssr-skeleton:end -->`,
      )

      const outDir = resolve(appRoot, 'build', url.replace(/^\//, ''))
      mkdirSync(outDir, { recursive: true })
      writeFileSync(resolve(outDir, 'index.html'), html, 'utf8')
      console.log(`✓ prerendered ${url} (head ${head.length} B, skeleton ${skeleton.length} B)`)
    }

    // Emit standalone page-shell skeleton fragments for the dynamic routes the og-service serves but the
    // build can't enumerate (swap/limit pairs, pool-detail). og-service can't import app code, so it reads
    // these artifacts and splices them into the SPA shell's cold-load placeholder — same <RouteFallback>
    // source as the prerendered routes, so no drift. The representative URLs only pick the archetype
    // (pickSkeleton): any /swap/<net>/<pair> → swap skeleton, any /pools/<...> → detail skeleton.
    const ogSkeletons = {
      swap: rewriteAssetUrls(renderRouteSkeleton('/swap/ethereum/eth-to-usdc'), manifest),
      pool: rewriteAssetUrls(
        renderRouteSkeleton('/pools/ethereum/uniswapv3/0x0000000000000000000000000000000000000001'),
        manifest,
      ),
    }
    const skeletonDir = resolve(appRoot, 'build/skeletons')
    mkdirSync(skeletonDir, { recursive: true })
    for (const [name, frag] of Object.entries(ogSkeletons)) {
      writeFileSync(resolve(skeletonDir, `${name}.html`), frag, 'utf8')
      console.log(`✓ wrote build/skeletons/${name}.html (${frag.length} B)`)
    }

    // Regenerate sitemap.xml from the index,follow route list so it tracks the prerendered set.
    const SITE = siteUrl // = constants/index KYBERSWAP_URL, via entry-server re-export
    const xmlEscape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes.map(p => `  <url>\n    <loc>${xmlEscape(`${SITE}${p === '/' ? '/' : p}`)}</loc>\n  </url>`).join('\n')}
</urlset>
`
    writeFileSync(resolve(appRoot, 'build/sitemap.xml'), sitemap, 'utf8')
    console.log(`✓ wrote build/sitemap.xml (${sitemapRoutes.length} URLs)`)
  } finally {
    // Vite's dev server keeps esbuild/chokidar handles open. After the work is done these can keep
    // Node's event loop alive so the process hangs instead of exiting — stalling CI's build step.
    // Give close() a bounded window to flush, then fall through to the explicit exit below.
    await Promise.race([vite.close(), new Promise(res => setTimeout(res, 5000))])
  }
}

main()
  // Force exit: lingering vite/esbuild handles otherwise keep the process alive after success.
  .then(() => process.exit(0))
  .catch(err => {
    console.error('prerender failed:', err)
    process.exit(1)
  })
