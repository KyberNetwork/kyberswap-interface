// Minimal browser-global shim for the SSR render smoke test (node environment).
//
// This shim lets the smoke test render the (heavily browser-coupled) app in node by satisfying
// the simple `window`/`document`/`localStorage` reads that many leaf components and third-party
// libraries perform at import/render time. It is intentionally NOT a full DOM (no jsdom): genuine
// DOM manipulation (e.g. canvas getContext) still throws, flagging subtrees that need <ClientOnly>.
//
// Wallet SDKs that cannot run server-side at all (e.g. porto's iframe Dialog) are excluded from
// the wagmi config via `import.meta.env.SSR` (forced true in vitest.smoke.config.ts), which is the
// same signal a real Vite SSR/prerender build sets — so this mirrors the eventual prerender.
const store: Record<string, string> = {}
const storage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => {
    store[k] = String(v)
  },
  removeItem: (k: string) => {
    delete store[k]
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k]
  },
  key: (i: number) => Object.keys(store)[i] ?? null,
  get length() {
    return Object.keys(store).length
  },
}

const noop = () => {}
const g = globalThis as any

g.localStorage = g.localStorage || storage
g.sessionStorage = g.sessionStorage || storage

const documentShim = {
  title: 'KyberSwap',
  cookie: '',
  documentElement: { style: {}, classList: { add: noop, remove: noop } },
  head: { appendChild: noop, removeChild: noop },
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
  localStorage: storage,
  sessionStorage: storage,
  document: documentShim,
  location: {
    origin: 'http://localhost',
    href: 'http://localhost/',
    hostname: 'localhost',
    pathname: '/',
    protocol: 'http:',
    host: 'localhost',
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
  requestAnimationFrame: (cb: (t: number) => void) => setTimeout(() => cb(0), 0),
  cancelAnimationFrame: noop,
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
}

g.window = g.window || windowShim
g.document = g.document || documentShim
g.history = g.history || windowShim.history
g.location = g.location || windowShim.location

// DOM constructor globals referenced by libraries in `instanceof` checks during render
// (framer-motion checks `x instanceof SVGElement` / `HTMLElement`, etc.).
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

if (!g.navigator) {
  Object.defineProperty(g, 'navigator', {
    value: { userAgent: 'node', language: 'en-US', languages: ['en-US'] },
    configurable: true,
  })
}
