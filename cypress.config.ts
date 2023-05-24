import { defineConfig } from 'cypress'
import path from 'path'

const synpressPath = path.join(process.cwd(), '/node_modules/@synthetixio/synpress')
const pluginsPath = `${synpressPath}/plugins/index`

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
      require(pluginsPath)(on, config)
      return config
    },
    specPattern: 'cypress/e2e/**/*-spec.cy.ts',
  },
})
