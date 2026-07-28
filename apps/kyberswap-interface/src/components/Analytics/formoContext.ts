import type { IFormoAnalytics } from '@formo/analytics'
import { createContext, useContext } from 'react'

// Local context holding the real Formo analytics instance once the deferred provider has loaded it. Null
// until then. Consumers read it via the local `useFormo` below instead of importing `@formo/analytics`
// directly — that keeps the ~65KB SDK out of the eager entry chunk (it only ships in the deferred chunk).
export const LocalFormoContext = createContext<IFormoAnalytics | null>(null)

/**
 * Drop-in replacement for `@formo/analytics`'s `useFormo`, but backed by our local context. Returns the
 * real analytics instance once the deferred provider mounts, or `null` before that — so callers keep using
 * the existing `analytics?.track(...)` optional-chaining pattern (early calls safely no-op, matching the
 * package's own default-context behaviour). The type import is erased at build time, so this module pulls
 * in no `@formo/analytics` runtime code.
 */
export const useFormo = (): IFormoAnalytics | null => useContext(LocalFormoContext)
