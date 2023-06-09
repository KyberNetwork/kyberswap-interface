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
    specPattern: 'cypress/e2e/**/swap-page.e2e-spec.cy.ts',
    setupNodeEvents(on, config) {
      require('@cypress/grep/src/plugin')(config)
      synpressPlugins(on, config)
    },
  },
})
