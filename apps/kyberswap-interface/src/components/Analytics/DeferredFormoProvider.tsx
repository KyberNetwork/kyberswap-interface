import { ComponentType, ReactNode, useEffect, useState } from 'react'

// `@formo/analytics` (~65KB) is an analytics SDK that is never needed for first paint. We keep it off the
// eager entry chunk by DYNAMICALLY importing FormoBridge (the only module that touches the SDK) during
// browser idle. Until it loads, children render with our local Formo context defaulting to `null`, so
// `useFormo()` consumers (from ./formoContext) safely no-op their `analytics?.track(...)` calls — exactly
// the behaviour the package's own default context provides. Once the bridge mounts, the live instance flows
// through and tracking resumes normally.

type BridgeComponent = ComponentType<{ children: ReactNode }>

export default function DeferredFormoProvider({ children }: { children: ReactNode }) {
  const [Bridge, setBridge] = useState<BridgeComponent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false
    const load = () => {
      void import('./FormoBridge').then(mod => {
        if (!cancelled) setBridge(() => mod.default)
      })
    }

    // Mirror the idle pattern in utils/prefetch.ts: requestIdleCallback (timeout-guarded so it still fires
    // on a perpetually-busy page) with a small setTimeout fallback for browsers lacking it.
    let idleId: number | undefined
    let timeoutId: number | undefined
    if (window.requestIdleCallback) {
      idleId = window.requestIdleCallback(load, { timeout: 3000 })
    } else {
      timeoutId = window.setTimeout(load, 200)
    }

    return () => {
      cancelled = true
      if (idleId !== undefined && window.cancelIdleCallback) window.cancelIdleCallback(idleId)
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [])

  if (!Bridge) return <>{children}</>

  return <Bridge>{children}</Bridge>
}
