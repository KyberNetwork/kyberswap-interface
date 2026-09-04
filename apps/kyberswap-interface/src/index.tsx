/* eslint-disable prettier/prettier */
// Ordering is intentional and must be preserved: styling, polyfilling, tracing, and then functionality.
import '@zkmelabs/widget/dist/style.css'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import { LanguageProvider } from 'i18n'
import { StrictMode, useLayoutEffect } from 'react'
import { createRoot } from 'react-dom/client'
import 'react-loading-skeleton/dist/skeleton.css'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import * as serviceWorkerRegistration from 'serviceWorkerRegistration'
import 'tailwind.css'

import Web3Provider from 'components/Web3Provider'
import { useAffiliate } from 'hooks/useAffiliate'
import App from 'pages/App'
import UnfinalizedPositionUpdater from 'pages/Earns/components/UnfinalizedPositionUpdater'
import store from 'state'
import ApplicationUpdater from 'state/application/updater'
import CustomizeDexesUpdater from 'state/customizeDexes/updater'
import ListsUpdater from 'state/lists/updater'
import TokenPricesUpdater from 'state/tokenPrices/updater'
import TransactionUpdater from 'state/transactions/updater'
import UserUpdater from 'state/user/updater'
import WalletInventoryUpdater from 'state/walletInventory/updater'
import ThemeProvider from 'theme'
import { preloadChainIcons, preloadStaticRouteChunks } from 'utils/prefetch'

dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(relativeTime)

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
      <UnfinalizedPositionUpdater />
      <CustomizeDexesUpdater />
      <TokenPricesUpdater />
      <WalletInventoryUpdater />
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
      <Provider store={store}>
        <BrowserRouter>
          <LanguageProvider>
            <Web3Provider>
              <Updaters />
              <ThemeProvider>
                <App />
              </ThemeProvider>
            </Web3Provider>
          </LanguageProvider>
        </BrowserRouter>
      </Provider>
    </StrictMode>
  )
}

// Prerendered routes can contain deterministic build-time markup for crawlers. Mount a fresh interactive
// tree instead of hydrating it: wallet/localStorage state and responsive media queries are client-only and
// can legitimately differ from the static build. The .preloadhtml overlay hides this replacement and is
// dropped synchronously by ReactApp before paint.
const container = document.getElementById('app') as HTMLElement
createRoot(container).render(<ReactApp />)

// Warm a few high-traffic static route chunks so in-app nav to them is instant even without a hover
// (keyboard / mobile tap). Idle-gated internally — see preloadStaticRouteChunks.
preloadStaticRouteChunks()

// Warm the chain-switcher icons during idle too; they're not needed for first paint. Idle-gated internally.
preloadChainIcons()

serviceWorkerRegistration.unregister()
//serviceWorkerRegistration.register({
//  onSuccess: () => {
//    //
//  },
//  onUpdate: serviceWorkerRegistration => {
//    store.dispatch(updateServiceWorker(serviceWorkerRegistration))
//  },
//})
