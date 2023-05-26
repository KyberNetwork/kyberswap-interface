import synpressPlugins from '@synthetixio/synpress/plugins'
import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
  chromeWebSecurity: true,
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    baseUrl: `https://kyberswap.com/`,
    setupNodeEvents(on, config) {
      synpressPlugins(on, config)
      return config
    },
    specPattern: 'cypress/e2e/**/*-spec.cy.ts',
  },
})
