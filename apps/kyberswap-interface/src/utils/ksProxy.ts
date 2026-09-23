// On *.vercel.app deployments, routes every fetch/XHR to `https://<sub>.kyberswap.com/...` through
// the same-origin Vercel proxy (`/__ks/<sub>/...`, served by api/ks-proxy.mjs at the repo root).
// This covers hosts hardcoded in the app and in the widget packages, not just env-configured ones.
// Must be imported before any module that issues requests.

const KS_URL_RE = /^https:\/\/([a-z0-9-]+)\.kyberswap\.com(?=[/?#]|$)\/?/

const rewrite = (url: string): string => url.replace(KS_URL_RE, '/__ks/$1/')

// Local dev and kyberswap.com have no `/__ks` route, so the proxy is limited to Vercel deployments.
if (typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string') return originalFetch(rewrite(input), init)
    if (input instanceof URL) return originalFetch(rewrite(input.href), init)
    const rewritten = rewrite(input.url)
    return rewritten === input.url ? originalFetch(input, init) : fetchRequestAt(rewritten, input, init)
  }

  // Re-issues a Request (e.g. RTK Query's fetchBaseQuery passes one) at a new URL. The body is buffered:
  // `new Request(url, request)` would forward it as a stream, which the browser uploads chunked and
  // DevTools cannot display.
  const fetchRequestAt = async (url: string, request: Request, init?: RequestInit) => {
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
    return originalFetch(url, {
      method: request.method,
      headers: request.headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      credentials: request.credentials,
      cache: request.cache,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      integrity: request.integrity,
      keepalive: request.keepalive,
      signal: request.signal,
      ...init,
    })
  }

  const originalOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ) {
    return originalOpen.call(this, method, rewrite(String(url)), async ?? true, username, password)
  }
}

export {}
