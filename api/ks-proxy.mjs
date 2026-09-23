// Vercel Function that forwards `/__ks/<sub>/<path>` to `https://<sub>.kyberswap.com/<path>`.
// The egress region is pinned via `regions` in vercel.json so upstream sees a
// non-geo-blocked source IP. The client-side counterpart is
// apps/kyberswap-interface/src/utils/ksProxy.ts.
//
// Plain `.mjs` so Node always loads it as ESM: the root package.json has no `"type": "module"`,
// and a `.ts` file is compiled to ESM by the root tsconfig, which Node then fails to load as CommonJS.

const PREFIX = '/__ks/'
const PATH_PARAM = '__ks_path'
// Subdomain only: the caller never controls the domain, so this cannot be used to reach arbitrary hosts.
const SUBDOMAIN_RE = /^[a-z0-9-]+$/

// Client-identifying and hop-by-hop headers. Node's fetch throws on hop-by-hop headers (e.g. the
// `transfer-encoding: chunked` Vercel forwards on POSTs) and sets framing itself. accept-encoding is
// dropped so fetch negotiates an encoding it can decode itself (it would otherwise pass e.g. zstd through undecoded).
const DROP_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'keep-alive',
  'proxy-connection',
  'transfer-encoding',
  'te',
  'trailer',
  'upgrade',
  'expect',
  'content-length',
  'accept-encoding',
  'origin',
  'referer',
  'cookie',
  'forwarded',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
  'cf-connecting-ip',
  'cf-ipcountry',
  'true-client-ip',
])

// fetch has already decompressed the body, so the upstream encoding/length headers no longer apply.
const DROP_RESPONSE_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'set-cookie',
])

/** @param {string} requestUrl @returns {string | null} */
const resolveTarget = requestUrl => {
  const url = new URL(requestUrl, 'http://localhost')
  const rawPath =
    url.searchParams.get(PATH_PARAM) ?? (url.pathname.startsWith(PREFIX) ? url.pathname.slice(PREFIX.length) : null)
  if (!rawPath) return null
  url.searchParams.delete(PATH_PARAM)

  const slash = rawPath.indexOf('/')
  const subdomain = slash === -1 ? rawPath : rawPath.slice(0, slash)
  const path = slash === -1 ? '' : rawPath.slice(slash + 1)
  if (!SUBDOMAIN_RE.test(subdomain)) return null

  return `https://${subdomain}.kyberswap.com/${path}${url.search}`
}

/** @param {AsyncIterable<Uint8Array>} req @returns {Promise<Uint8Array>} */
const readBody = async req => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

const sendText = (res, status, message) => {
  res.statusCode = status
  res.setHeader('content-type', 'text/plain; charset=utf-8')
  res.end(message)
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
  try {
    const target = resolveTarget(req.url ?? '')
    if (!target) return sendText(res, 400, 'Invalid proxy target')

    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined || DROP_REQUEST_HEADERS.has(key) || key.startsWith('x-vercel-')) continue
      headers.set(key, Array.isArray(value) ? value.join(', ') : value)
    }

    const method = req.method ?? 'GET'
    const hasBody = method !== 'GET' && method !== 'HEAD'
    const upstream = await fetch(target, {
      method,
      headers,
      body: hasBody ? await readBody(req) : undefined,
    })

    res.statusCode = upstream.status
    upstream.headers.forEach((value, key) => {
      if (!DROP_RESPONSE_HEADERS.has(key)) res.setHeader(key, value)
    })
    res.end(Buffer.from(await upstream.arrayBuffer()))
  } catch (error) {
    const message =
      error instanceof Error ? `${error.message}${error.cause ? ` (cause: ${error.cause})` : ''}` : String(error)
    console.error(`[ks-proxy] ${req.method} ${req.url} failed: ${message}`)
    sendText(res, 502, `ks-proxy error: ${message}`)
  }
}
