// SSRF guard for fetching attacker-influenced URLs (token logos) from inside the origin network.
// A vetted-looking hostname can still DNS-resolve to a private/internal IP (e.g. `*.nip.io`, or a
// token-list-submitted domain pointed at an internal service or the cloud metadata endpoint). Resolve
// the host and reject if ANY resolved address is private/reserved.
//
// NB: this narrows but does not fully close DNS rebinding — the address could change between this
// lookup and the fetch's own connect. Closing that fully requires connecting by a validated IP. This
// blocks the practical vectors (public wildcard-DNS-to-private, internal hostnames) cheaply.
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

// node:dns lookup uses the OS getaddrinfo resolver, which has no timeout option — a hostname served by a
// hanging authoritative nameserver would otherwise stall the request well past the logo fetch's
// AbortSignal. Bound the lookup with a fail-closed race (timeout → caught below → treated as non-public).
const DNS_TIMEOUT_MS = 1000;

function ipIsPrivate(raw: string): boolean {
  let ip = raw.toLowerCase();
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/); // IPv4-mapped IPv6
  if (mapped) ip = mapped[1];

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) || // link-local (incl. cloud metadata 169.254.169.254)
      (a === 172 && b >= 16 && b <= 31) || // 172.16/12
      (a === 192 && b === 168) || // 192.168/16
      (a === 100 && b >= 64 && b <= 127) || // CGNAT 100.64/10
      a >= 224 // multicast / reserved
    );
  }
  // IPv6: loopback, unspecified, ULA (fc00::/7), link-local (fe80::/10).
  return ip === '::1' || ip === '::' || ip.startsWith('fc') || ip.startsWith('fd') || /^fe[89ab]/.test(ip);
}

/** True only if `hostname` resolves entirely to public IPs. DNS failure or any private address -> false. */
export async function isPublicHost(hostname: string): Promise<boolean> {
  if (isIP(hostname)) return !ipIsPrivate(hostname);
  try {
    const addrs = await Promise.race([
      lookup(hostname, { all: true }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('dns lookup timeout')), DNS_TIMEOUT_MS)),
    ]);
    return addrs.length > 0 && addrs.every(a => !ipIsPrivate(a.address));
  } catch {
    return false;
  }
}
