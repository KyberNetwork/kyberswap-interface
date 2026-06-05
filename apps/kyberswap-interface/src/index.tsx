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
import { StrictMode, useEffect } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
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
  setTimeout(() => {
    preloadhtml?.remove()
    preloadhtmlStyle?.remove()
  }, 100)
}

const ReactApp = () => {
  useEffect(hideLoader, [])
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

const container = document.getElementById('app') as HTMLElement
if (container.firstElementChild) {
  // Route was prerendered (static HTML present) — hydrate it.
  hydrateRoot(container, <ReactApp />)
} else {
  // Non-prerendered route (SPA fallback, empty #app) — client render.
  createRoot(container).render(<ReactApp />)
}

serviceWorkerRegistration.unregister()
//serviceWorkerRegistration.register({
//  onSuccess: () => {
//    //
//  },
//  onUpdate: serviceWorkerRegistration => {
//    store.dispatch(updateServiceWorker(serviceWorkerRegistration))
//  },
//})
