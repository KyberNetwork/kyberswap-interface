import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import synpressPlugins from '@synthetixio/synpress/plugins'
import { defineConfig } from 'cypress'

Sentry.init({
  dsn: 'https://d94ee2d3c22043bdaec966758680b5a8@sentry.ops.kyberengineering.io/4',
  environment: 'production',
  ignoreErrors: ['AbortError'],
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.1,
})
Sentry.configureScope(scope => {
  scope.setTag('request_id', Date.now())
  scope.setTag('version', 'E2E')
})

export default defineConfig({
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
  userAgent: 'synpress',
  chromeWebSecurity: true,
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    setupNodeEvents(on, config) {
      require('@cypress/grep/src/plugin')(config)
      synpressPlugins(on, config)
    },
    specPattern: 'cypress/e2e/**/swap-page.e2e-spec.cy.ts',
  },
})
