import { FormoAnalyticsProvider, type IFormoAnalytics, useFormo as useRealFormo } from '@formo/analytics'
import { useEffect } from 'react'

import { FORMO_WRITE_KEY } from 'constants/env'

// This module is loaded ONLY via the deferred dynamic import in DeferredFormoProvider, so it (and the heavy
// `@formo/analytics` SDK it pulls in) lives in a separate chunk, off the eager entry path.

// Reads the real analytics instance out of the SDK's own context and hands it back to
// DeferredFormoProvider, which owns the context the rest of the app reads. Renders nothing: the SDK
// provider only needs to be mounted somewhere, it does not need to wrap the app.
function ReportInstance({ onReady }: { onReady: (analytics: IFormoAnalytics | null) => void }) {
  const analytics = useRealFormo()

  useEffect(() => {
    onReady(analytics ?? null)
  }, [analytics, onReady])

  return null
}

export default function FormoBridge({ onReady }: { onReady: (analytics: IFormoAnalytics | null) => void }) {
  return (
    <FormoAnalyticsProvider
      writeKey={FORMO_WRITE_KEY}
      disabled={typeof window !== 'undefined' && window.location.hostname.endsWith('.pr.kyberengineering.io')}
    >
      <ReportInstance onReady={onReady} />
    </FormoAnalyticsProvider>
  )
}
