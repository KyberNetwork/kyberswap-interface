import synpressPlugins from '@synthetixio/synpress/plugins'
import { defineConfig } from 'cypress'
import client from 'prom-client'

require('dotenv').config()

export default defineConfig({
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
  userAgent: 'synpress',
  chromeWebSecurity: true,
  // video: false,
  // videoCompression: false,
  viewportWidth: 1920,
  viewportHeight: 1080,
  env: {
    grepFilterSpecs: true,
    grepOmitFiltered: true,
  },
  e2e: {
    testIsolation: false,
    setupNodeEvents(on, config) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@cypress/grep/src/plugin')(config)
      synpressPlugins(on, config)
    },
    specPattern: 'cypress/e2e/specs/swap.e2e.cy.ts',
  },
})
