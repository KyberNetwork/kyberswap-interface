import { FormoAnalyticsProvider } from '@formo/analytics'

/* eslint-disable prettier/prettier */
// Ordering is intentional and must be preserved: styling, polyfilling, tracing, and then functionality.
import '@zkmelabs/widget/dist/style.css'
import AOS from 'aos'
import 'aos/dist/aos.css'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import { LanguageProvider } from 'i18n'
import 'inter-ui/inter.css'
import { initMixpanel } from 'libs/mixpanel'
import { StrictMode, useLayoutEffect } from 'react'
import { createRoot } from 'react-dom/client'
import TagManager from 'react-gtm-module'
import 'react-loading-skeleton/dist/skeleton.css'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import * as serviceWorkerRegistration from 'serviceWorkerRegistration'
import 'swiper/swiper-bundle.min.css'
import 'swiper/swiper.min.css'
import 'tailwind.css'

import Web3Provider from 'components/Web3Provider'
import { BitcoinWalletProvider } from 'components/Web3Provider/BitcoinProvider'
import NEARWalletProvider from 'components/Web3Provider/NearProvider'
import { SolanaProvider } from 'components/Web3Provider/SolanaProvider'
import { ENV_LEVEL, FORMO_WRITE_KEY, GTM_ID } from 'constants/env'
import { ENV_TYPE } from 'constants/type'
import { useAffiliate } from 'hooks/useAffiliate'
import App from 'pages/App'
import store from 'state'
import ApplicationUpdater from 'state/application/updater'
import CustomizeDexesUpdater from 'state/customizeDexes/updater'
import ListsUpdater from 'state/lists/updater'
import TransactionUpdater from 'state/transactions/updater'
import UserUpdater from 'state/user/updater'
import ThemeProvider from 'theme'
import { preloadStaticRouteChunks } from 'utils/prefetch'

dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(relativeTime)

initMixpanel()

if (ENV_LEVEL === ENV_TYPE.PROD && GTM_ID) {
  TagManager.initialize({
    gtmId: GTM_ID,
  })
}

AOS.init()

if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

function Updaters() {
  useAffiliate()
  return (
    <>
      <ListsUpdater />
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <CustomizeDexesUpdater />
    </>
  )
}

const preloadhtml = document.querySelector('.preloadhtml')
const preloadhtmlStyle = document.querySelector('.preloadhtml-style')

const hideLoader = () => {
  preloadhtml?.remove()
  preloadhtmlStyle?.remove()
}

const ReactApp = () => {
  // Remove the static cold-load loader synchronously, before the browser paints the first React frame.
  // The route-level <Suspense fallback> (RouteFallback) already covers the screen on mount, so a
  // useEffect + 100ms delay left the loader visible *behind* the semi-transparent skeleton for ~100ms
  // (it bled through). useLayoutEffect drops it before paint → clean preloader → skeleton handoff.
  useLayoutEffect(hideLoader, [])
  return (
    <StrictMode>
      <FormoAnalyticsProvider
        writeKey={FORMO_WRITE_KEY}
        disabled={window.location.hostname.endsWith('.pr.kyberengineering.io')}
      >
        <Provider store={store}>
          <BrowserRouter>
            <LanguageProvider>
              <Web3Provider>
                <BitcoinWalletProvider>
                  <NEARWalletProvider>
                    <Updaters />
                    <ThemeProvider>
                      <SolanaProvider>
                        <App />
                      </SolanaProvider>
                    </ThemeProvider>
                  </NEARWalletProvider>
                </BitcoinWalletProvider>
              </Web3Provider>
            </LanguageProvider>
          </BrowserRouter>
        </Provider>
      </FormoAnalyticsProvider>
    </StrictMode>
  )
}

// Prerendered routes are head-only: the served #app is always empty (the cold-load skeleton lives in the
// .preloadhtml overlay, dropped by hideLoader on mount), so the body is always client-rendered. No route
// ships server-rendered body markup, so there is nothing to hydrate.
const container = document.getElementById('app') as HTMLElement
createRoot(container).render(<ReactApp />)

// Warm a few high-traffic static route chunks so in-app nav to them is instant even without a hover
// (keyboard / mobile tap). Idle-gated internally — see preloadStaticRouteChunks.
preloadStaticRouteChunks()

serviceWorkerRegistration.unregister()
//serviceWorkerRegistration.register({
//  onSuccess: () => {
//    //
//  },
//  onUpdate: serviceWorkerRegistration => {
//    store.dispatch(updateServiceWorker(serviceWorkerRegistration))
//  },
//})
