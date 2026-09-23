// On *.vercel.app deployments, routes every fetch/XHR to `https://<sub>.kyberswap.com/...` through
// the same-origin Vercel proxy (`/__ks/<sub>/...`, served by api/ks-proxy.ts at the repo root).
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
    return originalFetch(rewritten === input.url ? input : new Request(rewritten, input), init)
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
