import mixpanel from 'libs/mixpanel'
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

function sendToMixpanel(metric: Metric) {
  mixpanel.track('Web Vital', {
    metric_id: metric.id,
    metric_name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigation_type: metric.navigationType,
    page: window.location.pathname,
  })
}

export function initWebVitals() {
  onLCP(sendToMixpanel)
  onINP(sendToMixpanel)
  onCLS(sendToMixpanel)
  onFCP(sendToMixpanel)
  onTTFB(sendToMixpanel)
}
