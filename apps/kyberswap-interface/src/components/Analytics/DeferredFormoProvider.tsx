import type { IFormoAnalytics } from '@formo/analytics'
import { ComponentType, ReactNode, useEffect, useState } from 'react'

import { LocalFormoContext } from 'components/Analytics/formoContext'

// `@formo/analytics` (~65KB) is an analytics SDK that is never needed for first paint. We keep it off the
// eager entry chunk by DYNAMICALLY importing FormoBridge (the only module that touches the SDK) during
// browser idle. Until it loads, `useFormo()` consumers (from ./formoContext) read `null` and safely no-op
// their `analytics?.track(...)` calls — exactly the behaviour the package's own default context provides.
// Once the bridge reports the live instance it flows through the context below and tracking resumes.
//
// `children` MUST keep a fixed position in the element tree. React reconciles by position, so moving them
// under the bridge once it loads makes React unmount and remount the whole app — losing every piece of
// state and re-running every effect. The bridge is therefore a sibling that renders nothing and only
// reports the instance upwards.

type BridgeComponent = ComponentType<{ onReady: (analytics: IFormoAnalytics | null) => void }>

export default function DeferredFormoProvider({ children }: { children: ReactNode }) {
  const [Bridge, setBridge] = useState<BridgeComponent | null>(null)
  const [analytics, setAnalytics] = useState<IFormoAnalytics | null>(null)

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

  return (
    <LocalFormoContext.Provider value={analytics}>
      {children}
      {Bridge ? <Bridge onReady={setAnalytics} /> : null}
    </LocalFormoContext.Provider>
  )
}
