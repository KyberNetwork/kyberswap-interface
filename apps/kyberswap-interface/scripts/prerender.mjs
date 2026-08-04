// Build-time prerender (SSG) for bounded public routes.
//
// Runs AFTER `vite build` (which produces build/index.html, the template + client assets).
// It loads src/entry-server.tsx through Vite's own SSR transform pipeline (ssrLoadModule) — the
// same path the Vitest smoke test uses — so SVG `?react`, lingui `.po`, CSS, path aliases and
// `import.meta.env.SSR` all work without a separate SSR bundle. It renders distinct static pages and
// one shared shell per Swap/Limit product. nginx serves these artifacts directly; there is no Node
// runtime in production.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDirectory, '..')
const buildDirectory = resolve(appRoot, 'build')

const APP_PLACEHOLDER = '<div id="app"></div>'
const SEO_SLOT_PATTERN = /<!-- ssr-seo:start[\s\S]*?<!-- ssr-seo:end -->/
const SKELETON_SLOT_PATTERN = /<!-- ssr-skeleton:start[\s\S]*?<!-- ssr-skeleton:end -->/

// Stub origin for the SSR `window.location` shim. Mirrors constants/index KYBERSWAP_URL — the shim is
// installed before ssrLoadModule (so the app constant isn't importable yet), then asserted against the
// site URL in the app's prerender manifest after the module loads so the two cannot silently drift.
const SSR_ORIGIN = 'https://kyberswap.com'
const SSR_HOST = SSR_ORIGIN.replace(/^https?:\/\//, '')

const noop = () => {}

const createMemoryStorage = () => {
  const store = {}
  return {
    getItem: key => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: key => {
      delete store[key]
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key]
    },
    key: index => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
  }
}

// Minimal browser-global shim (mirrors test/smoke.setup.ts). Some BUILT workspace widgets and
// third-party deps read window/document at module scope; the app's own Phase-1 typeof-window
// guards don't cover those. This is NOT a full DOM — genuine DOM manipulation during render still
// throws, surfacing subtrees that need <ClientOnly>. Must run before ssrLoadModule evaluates modules.
function setupBrowserGlobals() {
  const g = globalThis
  if (g.window) return
  const localStorage = createMemoryStorage()
  const sessionStorage = createMemoryStorage()
  const navigatorShim = { userAgent: 'node', language: 'en-US', languages: ['en-US'] }
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
    createTextNode: () => ({}),
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
    navigator: navigatorShim,
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
  // Node 21 exposes a configurable global Navigator object whose userAgent is undefined. Replace it
  // deterministically because React DOM reads navigator.userAgent during module evaluation.
  Object.defineProperty(g, 'navigator', { value: navigatorShim, configurable: true })
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
function rewriteAssetUrls(html, assetManifest) {
  return html.replace(/\/src\/[^"')\s>]+/g, m => {
    const sourceUrl = m.slice(1).split('?')[0] // strip leading '/' + any ?query suffix
    const entry = assetManifest[sourceUrl]
    if (entry?.file) return `/${entry.file}`

    // Vite inlines assets below assetsInlineLimit in the client bundle, so they intentionally have no
    // manifest entry even though ssrLoadModule returns their /src URL. Inline the same local asset into
    // static HTML instead of emitting a production 404.
    const mime = {
      '.gif': 'image/gif',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
    }[extname(sourceUrl).toLowerCase()]
    if (!mime) throw new Error(`Prerender emitted a dev asset URL with no manifest entry: ${m}`)

    const data = readFileSync(resolve(appRoot, sourceUrl)).toString('base64')
    return `data:${mime};base64,${data}`
  })
}

function validateTemplate(template) {
  if (!template.includes(APP_PLACEHOLDER)) {
    throw new Error(`Template is missing the \`${APP_PLACEHOLDER}\` placeholder (build/index.html)`)
  }
  if (!SEO_SLOT_PATTERN.test(template)) {
    throw new Error('Template is missing the `<!-- ssr-seo:start/end -->` markers (build/index.html)')
  }
  if (!SKELETON_SLOT_PATTERN.test(template)) {
    throw new Error('Template is missing the `<!-- ssr-skeleton:start/end -->` markers (build/index.html)')
  }
}

function injectDocument(template, { bodyHtml, headHtml, skeletonHtml }) {
  // Replacement functions insert rendered `$` sequences verbatim instead of treating them as
  // String.replace patterns such as $&, $' or $<name>.
  return template
    .replace(SEO_SLOT_PATTERN, () => `<!-- ssr-seo:start -->\n    ${headHtml}\n    <!-- ssr-seo:end -->`)
    .replace(
      SKELETON_SLOT_PATTERN,
      () => `<!-- ssr-skeleton:start -->\n      ${skeletonHtml}\n      <!-- ssr-skeleton:end -->`,
    )
    .replace(APP_PLACEHOLDER, () => `<div id="app">${bodyHtml}</div>`)
}

function writeBuildArtifact(outputPath, content) {
  const outputFile = resolve(buildDirectory, outputPath)
  mkdirSync(dirname(outputFile), { recursive: true })
  writeFileSync(outputFile, content, 'utf8')
}

async function renderRouteFragments({ assetManifest, renderRouteBodyHtml, renderRouteSkeletonHtml, sourceRoute }) {
  const skeletonHtml = rewriteAssetUrls(renderRouteSkeletonHtml(sourceRoute), assetManifest)
  const bodyHtml = rewriteAssetUrls(await renderRouteBodyHtml(sourceRoute), assetManifest)
  return { bodyHtml, skeletonHtml }
}

async function writeRenderedPage(context, { headHtml, label, outputPath, sourceRoute }) {
  const { bodyHtml, skeletonHtml } = await renderRouteFragments({ ...context, sourceRoute })
  writeBuildArtifact(outputPath, injectDocument(context.template, { bodyHtml, headHtml, skeletonHtml }))
  console.log(
    `✓ wrote build/${outputPath} for ${label} from ${sourceRoute} (head ${headHtml.length} B, body ${bodyHtml.length} B, skeleton ${skeletonHtml.length} B)`,
  )
}

async function writeDeclaredPages(context, prerenderManifest, renderRouteHeadHtml, renderTradeShellHeadHtml) {
  const { rootPage } = prerenderManifest
  await writeRenderedPage(context, {
    ...rootPage,
    label: rootPage.pathname,
    headHtml: renderRouteHeadHtml(rootPage.pathname),
  })

  for (const page of prerenderManifest.distinctPages) {
    await writeRenderedPage(context, {
      ...page,
      label: page.pathname,
      headHtml: renderRouteHeadHtml(page.pathname),
    })
  }

  for (const shell of prerenderManifest.tradeShells) {
    await writeRenderedPage(context, {
      ...shell,
      label: `${shell.product} shell`,
      headHtml: renderTradeShellHeadHtml(shell.product),
    })
  }
}

function writeOgSkeletons(renderRouteSkeletonHtml, assetManifest, ogSkeletons) {
  for (const { name, outputPath, sourceRoute } of ogSkeletons) {
    const skeletonHtml = rewriteAssetUrls(renderRouteSkeletonHtml(sourceRoute), assetManifest)
    writeBuildArtifact(outputPath, skeletonHtml)
    console.log(`✓ wrote build/${outputPath} for ${name} (${skeletonHtml.length} B)`)
  }
}

function writeSwapIntentRedirectMap(swapIntentRedirects) {
  const nginxPathPattern = /^\/[a-z0-9./-]+$/
  const redirectLines = swapIntentRedirects.map(({ sourcePath, targetPath }) => {
    if (!nginxPathPattern.test(sourcePath) || !nginxPathPattern.test(targetPath)) {
      throw new Error(`Unsafe Nginx swap-intent redirect: ${sourcePath} -> ${targetPath}`)
    }
    return `${sourcePath} ${targetPath};`
  })
  const redirectMap = `# Generated by scripts/prerender.mjs. Do not edit manually.\n${redirectLines.join('\n')}\n`
  writeBuildArtifact('swap-intent-redirects.map', redirectMap)
  console.log(`✓ wrote build/swap-intent-redirects.map (${redirectLines.length} redirects)`)
}

async function main() {
  // Tell vite.config.ts to skip the browser process/Buffer polyfill (GlobalPolyFill): it's an
  // esbuild@0.24 plugin that crashes Vite 4's esbuild@0.18 dep optimizer here ("Invalid command:
  // on-resolve"). Must be set before createServer loads the config. Node has process/Buffer already.
  process.env.SSR_PRERENDER = '1'

  const template = readFileSync(resolve(buildDirectory, 'index.html'), 'utf8')
  const assetManifest = JSON.parse(readFileSync(resolve(buildDirectory, 'manifest.json'), 'utf8'))
  validateTemplate(template)

  // production mode so the esbuild config branch matches the client build (constants/env.ts
  // hard-throws on missing VITE_*, which the single committed .env supplies in every mode).
  const vite = await createServer({
    root: appRoot,
    mode: 'production',
    appType: 'custom',
    server: { middlewareMode: true },
    logLevel: 'warn',
    // Ledger's ESM build contains extensionless relative imports. Browser bundling resolves them, but
    // Node's external ESM loader does not; let Vite transform this package for the static renderer too.
    ssr: { noExternal: ['@ledgerhq/hw-app-btc'] },
    // vite.config defines `process.env` -> the whole env object (a client-only workaround). Under
    // Node SSR that splices a giant literal into deps like @lingui/react and breaks parsing — and
    // Node already has a real `process.env`, so neutralize the replacement here (identity).
    define: { 'process.env': 'process.env' },
  })

  try {
    // After the config has loaded (so the shim's window.location can't break Vite's URL internals),
    // but before module evaluation so module-scope browser access in built widgets is satisfied.
    setupBrowserGlobals()
    const {
      prerenderManifest,
      renderRouteBodyHtml,
      renderRouteHeadHtml,
      renderRouteSkeletonHtml,
      renderTradeShellHeadHtml,
    } = await vite.ssrLoadModule('/src/entry-server.tsx')

    // Fail loudly if the hardcoded shim origin drifts from the app's canonical domain (KYBERSWAP_URL,
    // re-exported in the manifest) — the two are kept in sync by hand because the shim is set up before
    // the app constant is importable.
    const siteOrigin = new URL(prerenderManifest.siteUrl).origin
    if (siteOrigin !== SSR_ORIGIN) {
      throw new Error(`SSR_ORIGIN (${SSR_ORIGIN}) drifted from app site URL origin (${siteOrigin})`)
    }

    const renderContext = {
      assetManifest,
      renderRouteBodyHtml,
      renderRouteSkeletonHtml,
      template,
    }

    // build/index.html remains the empty-body fallback for non-enumerated SPA routes. Every declared
    // document is written separately from the route-domain manifest exported by entry-server.
    await writeDeclaredPages(renderContext, prerenderManifest, renderRouteHeadHtml, renderTradeShellHeadHtml)

    // og-service reads these fragments to reuse the Interface's route fallback shape for dynamic pages.
    writeOgSkeletons(renderRouteSkeletonHtml, assetManifest, prerenderManifest.ogSkeletons)

    // Nginx includes this generated exact-key map before the SPA fallback.
    writeSwapIntentRedirectMap(prerenderManifest.swapIntentRedirects)
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
