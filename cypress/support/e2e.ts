// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
import '@cypress/grep'
import registerCypressGrep from '@cypress/grep/src/support'
import { captureException } from '@sentry/react'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import '@synthetixio/synpress/support/index'

import './commands'
import './connectWalletCommands'
import './selectTokenCommands'

registerCypressGrep()
Sentry.init({
  dsn: process.env.SENTRY_DNS,
  environment: 'production',
  ignoreErrors: ['AbortError'],
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.1,
})
Sentry.configureScope(scope => {
  scope.setTag('request_id', Date.now())
  scope.setTag('version', 'E2E')
})

Cypress.on('fail', (err, runable) => {
  const e = new Error('E2E Error: ' + runable.title)
  console.log('test e2e: ', e)
  captureException(e)
  throw err
})
