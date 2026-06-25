import { ReactNode, useEffect, useState } from 'react'

/**
 * Renders `children` only on the client, after mount. During SSR/prerender AND the
 * client's first render it returns `fallback` (default `null`), then swaps to `children`
 * after the mount effect runs — so server and first-client output match and there is no
 * hydration mismatch. Use it to keep wallet/browser-only subtrees out of prerendered HTML.
 */
export default function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return <>{mounted ? children : fallback}</>
}
