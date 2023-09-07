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
  viewportWidth: 1920,
  viewportHeight: 1080,
  env: {
    grepFilterSpecs: true,
    grepOmitFiltered: true,
  },
  e2e: {
    setupNodeEvents(on, config) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@cypress/grep/src/plugin')(config)
      synpressPlugins(on, config)
      on('after:run', async results => {
        if (results) {
          const register = new client.Registry()
          const prefix = 'e2e_cypress'

          const { totalPassed, totalFailed, totalTests } = results

          const suite = new client.Counter({
            name: `${prefix}_suite`,
            help: `${prefix}_suite`,
            labelNames: ['buildId', 'status', 'duration'] as const,
          })

          const testPass = new client.Counter({
            name: `${prefix}_test_passed`,
            help: `${prefix}_pass`,
            labelNames: ['buildId'] as const,
          })

          const testFail = new client.Counter({
            name: `${prefix}_test_failed`,
            help: `${prefix}_fail`,
            labelNames: ['buildId'] as const,
          })

          testPass.reset()
          testFail.reset()

          register.registerMetric(testPass)
          register.registerMetric(testFail)
          register.registerMetric(suite)

          testFail.labels({ buildId: `${process.env.GITHUB_RUN_ID}` }).inc(totalFailed)
          testPass.labels({ buildId: `${process.env.GITHUB_RUN_ID}` }).inc(totalPassed)
          suite
            .labels({
              buildId: `${process.env.GITHUB_RUN_ID}`,
            })
            .inc(totalTests)

          const gateway = new client.Pushgateway('https://core-pushgateway.dev.kyberengineering.io', [], register)

          console.log('gateway: ', gateway)
          await gateway
            .push({ jobName: 'ui-automation' })
            .then(({ resp, body }) => {
              console.log(`Body: ${body}`)
              console.log(`Response status: ${resp}`)
            })
            .catch((err: any) => {
              console.log('err: ', err)
            })
        }
      })
    },
    specPattern: 'cypress/e2e/specs/*.e2e.cy.ts',
  },
})
