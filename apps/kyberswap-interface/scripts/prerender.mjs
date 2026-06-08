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
  // Stub origin for SSR `window.location` reads. Mirrors constants/index KYBERSWAP_URL (this runs
  // before ssrLoadModule, so the app constant isn't importable here yet — keep the two in sync).
  const SSR_ORIGIN = 'https://kyberswap.com'
  const SSR_HOST = SSR_ORIGIN.replace(/^https?:\/\//, '')
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

// ssrLoadModule renders dev asset URLs (/src/assets/x.svg). Rewrite them to the hashed production
// URLs from the client build's manifest so they 404 neither at first paint nor mismatch hydration.
function rewriteAssetUrls(html, manifest) {
  return html.replace(/\/src\/[^"')\s>]+/g, m => {
    const entry = manifest[m.slice(1)] // strip leading '/'
    return entry?.file ? `/${entry.file}` : m
  })
}

async function main() {
  const template = readFileSync(resolve(appRoot, 'build/index.html'), 'utf8')
  const manifest = JSON.parse(readFileSync(resolve(appRoot, 'build/manifest.json'), 'utf8'))

  // production mode so .env.production is loaded (constants/env.ts hard-throws on missing VITE_*).
  const vite = await createServer({
    root: appRoot,
    mode: 'production',
    appType: 'custom',
    server: { middlewareMode: true },
    logLevel: 'warn',
    // We only ssrLoadModule() here (on-demand SSR transform). The client dep optimizer (an esbuild
    // scan/bundle of the import graph) is useless for prerendering and, with the monorepo's several
    // esbuild versions, fails in CI with "Invalid command: on-resolve" (esbuild JS/native-binary
    // protocol mismatch). Disabling it sidesteps that scan; the SSR transform still works (deps are
    // externalized for Node), the prerender is just a bit slower without pre-bundling.
    optimizeDeps: { disabled: true },
    // vite.config defines `process.env` -> the whole env object (a client-only workaround). Under
    // Node SSR that splices a giant literal into deps like @lingui/react and breaks parsing — and
    // Node already has a real `process.env`, so neutralize the replacement here (identity).
    define: { 'process.env': 'process.env' },
  })

  try {
    // After the config has loaded (so the shim's window.location can't break Vite's URL internals),
    // but before module evaluation so module-scope browser access in built widgets is satisfied.
    setupBrowserGlobals()
    const { render, buildHeadHtml, prerenderRoutes, sitemapRoutes, siteUrl } =
      await vite.ssrLoadModule('/src/entry-server.tsx')

    // Validate the template placeholders up front so a bad template fails loudly (rather than the
    // post-replace `includes` check, which could false-fire if a rendered body contained the literal).
    if (!template.includes('<div id="app"></div>')) {
      throw new Error('Template is missing the `<div id="app"></div>` placeholder (build/index.html)')
    }
    if (!/<!-- ssr-seo:start[\s\S]*?<!-- ssr-seo:end -->/.test(template)) {
      throw new Error('Template is missing the `<!-- ssr-seo:start/end -->` markers (build/index.html)')
    }

    for (const { path: url, ssr } of prerenderRoutes) {
      const head = buildHeadHtml(url)
      let html = template.replace(
        /<!-- ssr-seo:start[\s\S]*?<!-- ssr-seo:end -->/,
        `<!-- ssr-seo:start -->\n    ${head}\n    <!-- ssr-seo:end -->`,
      )

      let bodyLen = 0
      if (ssr) {
        // Full body: render server-side and tag the route so the client hydrates only when the
        // served path matches (see src/index.tsx) — guards against the SPA fallback serving a
        // prerendered file for a different route.
        const body = rewriteAssetUrls(await render(url), manifest)
        if (!body) throw new Error(`render(${url}) produced empty HTML`)
        bodyLen = body.length
        html = html.replace(
          '<div id="app"></div>',
          `<div id="app">${body}</div>\n    <script>window.__PRERENDER_PATH__=${JSON.stringify(url)}</script>`,
        )
      }
      // Head-only routes keep the empty <div id="app"></div>; the client createRoot-renders them.

      const outDir = resolve(appRoot, 'build', url.replace(/^\//, ''))
      mkdirSync(outDir, { recursive: true })
      writeFileSync(resolve(outDir, 'index.html'), html, 'utf8')
      console.log(`✓ prerendered ${url} (${ssr ? `body ${bodyLen} B` : 'head-only'}, head ${head.length} B)`)
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
    await vite.close()
  }
}

main().catch(err => {
  console.error('prerender failed:', err)
  process.exit(1)
})
