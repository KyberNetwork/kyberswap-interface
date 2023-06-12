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
import '@synthetixio/synpress/support/index'

import './commands'
import './connectWalletCommands'
import './selectTokenCommands'

registerCypressGrep()

Cypress.on('fail', (err, runable) => {
  const e = new Error('E2E Error: ' + runable.title)
  captureException(e)
  throw err
})
