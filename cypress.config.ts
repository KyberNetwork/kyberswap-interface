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
  e2e: {
    setupNodeEvents(on, config) {
      require('@cypress/grep/src/plugin')(config)
      synpressPlugins(on, config)
    },
    // specPattern: 'cypress/e2e/**/avalanche/*.e2e-spec.cy.ts',
    specPattern: 'cypress/e2e/specs/swap-page.e2e-spec.cy.ts',
  },
})
