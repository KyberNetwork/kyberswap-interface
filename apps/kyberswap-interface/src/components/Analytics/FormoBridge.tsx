import { FormoAnalyticsProvider, useFormo as useRealFormo } from '@formo/analytics'
import { ReactNode } from 'react'

import { FORMO_WRITE_KEY } from 'constants/env'

import { LocalFormoContext } from './formoContext'

// This module is loaded ONLY via the deferred dynamic import in DeferredFormoProvider, so it (and the heavy
// `@formo/analytics` SDK it pulls in) lives in a separate chunk, off the eager entry path.

// Reads the real Formo analytics instance from the provider's context and republishes it into our local
// context, so app-wide `useFormo()` consumers (which import from ./formoContext) receive the live instance.
function FormoContextBridge({ children }: { children: ReactNode }) {
  const analytics = useRealFormo()
  return <LocalFormoContext.Provider value={analytics ?? null}>{children}</LocalFormoContext.Provider>
}

export default function FormoBridge({ children }: { children: ReactNode }) {
  return (
    <FormoAnalyticsProvider
      writeKey={FORMO_WRITE_KEY}
      disabled={typeof window !== 'undefined' && window.location.hostname.endsWith('.pr.kyberengineering.io')}
    >
      <FormoContextBridge>{children}</FormoContextBridge>
    </FormoAnalyticsProvider>
  )
}
