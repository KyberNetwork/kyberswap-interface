/* eslint-disable prettier/prettier */
// Ordering is intentional and must be preserved: styling, polyfilling, tracing, and then functionality.
import 'inter-ui'
import '@zkmelabs/widget/dist/style.css'
import 'aos/dist/aos.css'
import 'react-loading-skeleton/dist/skeleton.css'
import 'swiper/swiper-bundle.min.css'
import 'swiper/swiper.min.css'
import 'connection/eagerlyConnect'

import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { Web3ReactHooks, Web3ReactProvider } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import AOS from 'aos'
import { connections } from 'connection'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import mixpanel from 'mixpanel-browser'
import { StrictMode, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import TagManager from 'react-gtm-module'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import { ENV_LEVEL, GTM_ID, MIXPANEL_PROJECT_TOKEN, SENTRY_DNS, TAG } from 'constants/env'
import { ENV_TYPE } from 'constants/type'

import { sentryRequestId } from './constants'
import { LanguageProvider } from './i18n'
import App from './pages/App'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import CustomizeDexesUpdater from './state/customizeDexes/updater'
import ListsUpdater from './state/lists/updater'
import MulticallUpdater from './state/multicall/updater'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from './theme'

dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(relativeTime)

mixpanel.init(MIXPANEL_PROJECT_TOKEN, {
  debug: ENV_LEVEL < ENV_TYPE.PROD,
})

if (ENV_LEVEL > ENV_TYPE.LOCAL) {
  Sentry.init({
    dsn: SENTRY_DNS,
    environment: 'production',
    ignoreErrors: ['AbortError'],
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.1,
    normalizeDepth: 5,
  })
  Sentry.configureScope(scope => {
    scope.setTag('request_id', sentryRequestId)
    scope.setTag('version', TAG)
  })

  if (GTM_ID) {
    TagManager.initialize({
      gtmId: GTM_ID,
    })
  }
}

AOS.init()

if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

function Updaters() {
  return (
    <>
      <ListsUpdater />
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <MulticallUpdater />
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

// Google ReCaptcha use it, don't remove.
window.recaptchaOptions = {
  useRecaptchaNet: true,
}

const ReactApp = () => {
  useEffect(hideLoader, [])
  const connectors: [Connector, Web3ReactHooks][] = useMemo(
    () => connections.map(({ hooks, connector }) => [connector, hooks]),
    [],
  )

  return (
    <StrictMode>
      <FixedGlobalStyle />
      <Provider store={store}>
        <BrowserRouter>
          <LanguageProvider>
            <Web3ReactProvider connectors={connectors}>
              <Updaters />
              <ThemeProvider>
                <ThemedGlobalStyle />
                <App />
              </ThemeProvider>
            </Web3ReactProvider>
          </LanguageProvider>
        </BrowserRouter>
      </Provider>
    </StrictMode>
  )
}

const container = document.getElementById('app') as HTMLElement
const root = createRoot(container)
root.render(<ReactApp />)

serviceWorkerRegistration.unregister()
//serviceWorkerRegistration.register({
//  onSuccess: () => {
//    //
//  },
//  onUpdate: serviceWorkerRegistration => {
//    store.dispatch(updateServiceWorker(serviceWorkerRegistration))
//  },
//})
