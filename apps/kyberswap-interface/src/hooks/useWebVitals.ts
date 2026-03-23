import { useFormo } from '@formo/analytics'
import { useEffect, useRef } from 'react'

import { type FormoTrack, initWebVitals } from 'utils/performanceMonitor'

export function useWebVitals() {
  const analytics = useFormo()
  const trackRef = useRef<FormoTrack | null>(null)

  trackRef.current = (eventName, properties) => {
    analytics?.track(eventName, properties)
  }

  useEffect(() => {
    initWebVitals((eventName, properties) => {
      trackRef.current?.(eventName, properties)
    })
  }, [])
}
