import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

export type FormoTrack = (eventName: string, properties?: Record<string, unknown>) => void

function sendToFormo(metric: Metric, track: FormoTrack) {
  track('Web Vital', {
    metric_id: metric.id,
    metric_name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigation_type: metric.navigationType,
    page: window.location.pathname,
  })
}

export function initWebVitals(track: FormoTrack) {
  onLCP(metric => sendToFormo(metric, track))
  onINP(metric => sendToFormo(metric, track))
  onCLS(metric => sendToFormo(metric, track))
  onFCP(metric => sendToFormo(metric, track))
  onTTFB(metric => sendToFormo(metric, track))
}
