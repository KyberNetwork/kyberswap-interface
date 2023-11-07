import synpressPlugins from '@synthetixio/synpress/plugins'
import { defineConfig } from 'cypress'
import installLogsPrinter from 'cypress-terminal-report/src/installLogsPrinter'

require('dotenv').config()

export default defineConfig({
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
  userAgent: 'synpress',
  // chromeWebSecurity: true,
  viewportWidth: 1920,
  viewportHeight: 1080,
  env: {
    grepFilterSpecs: true,
    grepOmitFiltered: true,
    NETWORK: 'Arbitrum',
  },
  e2e: {
    baseUrl: 'https://kyberswap.com/',
    setupNodeEvents(on, config) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@cypress/grep/src/plugin')(config)
      synpressPlugins(on, config)
      const options = {
        printLogsToFile: 'always',
        outputRoot: config.projectRoot + '/target/',
        outputTarget: {
          'out.txt': 'txt',
          'out.json': 'json',
        },
      }
      require('cypress-terminal-report/src/installLogsPrinter')(on, options)
    },
    specPattern: 'cypress/e2e/specs/zap.e2e.cy.ts',
  },
})
