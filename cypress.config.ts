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
    baseUrl: window.location.origin,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*-spec.cy.ts',
  },
})
