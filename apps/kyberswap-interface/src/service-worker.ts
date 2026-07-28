/// <reference lib="webworker" />
import { DocumentRoute } from 'serviceWorker/document'
import { clientsClaim } from 'workbox-core'
import 'workbox-precaching'
import { precacheAndRoute } from 'workbox-precaching'
import { Route, registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

clientsClaim()

registerRoute(new DocumentRoute())

const ksSettingRoute = new Route(
  ({ url }) => url.hostname.startsWith('ks-setting'),
  new StaleWhileRevalidate({
    cacheName: 'ks-setting',
  }),
)

registerRoute(ksSettingRoute)
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
