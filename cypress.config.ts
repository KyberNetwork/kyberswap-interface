import synpressPlugins from '@synthetixio/synpress/plugins'
import { defineConfig } from 'cypress'
import gmail from 'gmail-tester'
import path from 'path'

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
      on('task', {
        'gmail:get-messages': async args => {
          const email = await gmail.get_messages(
            path.resolve(__dirname, 'credentials.json'),
            path.resolve(__dirname, 'token.json'),
            args.options,
          )
          console.log('email: ', email)
          return email
        },
      })
    },
    specPattern: 'cypress/e2e/**/signin.e2e-spec.cy.ts',
  },
})
