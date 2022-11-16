/// <reference lib="webworker" />
import { DocumentRoute } from 'serviceWorker/document'
import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import 'workbox-precaching'
import { precacheAndRoute } from 'workbox-precaching'
import { Route, registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

clientsClaim()

registerRoute(new DocumentRoute())

const chartingLibraryRoute = new Route(
  ({ url }) => url.pathname.includes('charting_library'),
  new CacheFirst({
    cacheName: 'charting_library',
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 15 * 24 * 60 * 60 })],
  }),
)

const ksSettingRoute = new Route(
  ({ url }) => url.hostname.startsWith('ks-setting'),
  new StaleWhileRevalidate({
    cacheName: 'ks-setting',
  }),
)

const imageRoute = new Route(
  ({ request }) => {
    return request.destination === 'image'
  },
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 15 * 24 * 60 * 60 })],
  }),
)

registerRoute(chartingLibraryRoute)
registerRoute(ksSettingRoute)
registerRoute(imageRoute)
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
