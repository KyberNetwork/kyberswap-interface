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
    baseUrl: `https://metamask.github.io/test-dapp/`,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      synpressPlugins(on, config)
      return config
    },
    specPattern: 'cypress/e2e/**/*-spec.cy.ts',
  },
})
