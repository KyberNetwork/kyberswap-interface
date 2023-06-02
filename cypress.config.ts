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
    baseUrl: `http://localhost:4173/`,
    setupNodeEvents(on, config) {
      synpressPlugins(on, config)
    },
    specPattern: 'cypress/e2e/**/*-spec.cy.ts',
  },
})
