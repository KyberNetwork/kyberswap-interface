import { useEffect } from 'react'

import { initWebVitals } from 'utils/performanceMonitor'

export function useWebVitals() {
  useEffect(() => {
    initWebVitals()
  }, [])
}
