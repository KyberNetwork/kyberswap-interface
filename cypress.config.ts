import synpressPlugins from '@synthetixio/synpress/plugins'
import { defineConfig } from 'cypress'

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
  defaultCommandTimeout: 30000,
  pageLoadTimeout: 30000,
  requestTimeout: 30000,
  e2e: {
    testIsolation: false,
    baseUrl: `https://kyberswap.com/`,
    setupNodeEvents(on, config) {
      synpressPlugins(on, config)
    },
    specPattern: 'cypress/e2e/swap/test-synpress.e2e-spec.cy.ts',
  },
})
