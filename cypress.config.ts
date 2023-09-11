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
          const suite = new client.Counter({
            name: `${prefix}_suite`,
            help: `${prefix}_suite`,
            labelNames: ['buildId', 'result', 'baseName', 'duration', 'chain'] as const,
          })
          suite.reset()
          const { totalPassed, totalFailed, totalTests, totalDuration, runs } = results
          runs.forEach(run => {
            const { stats, spec } = run
            const { tests, passes, pending, failures, duration } = stats
            const { baseName } = spec
            suite
              .labels({
                buildId: `${process.env.GITHUB_RUN_ID}`,
                result: 'failed',
                baseName: baseName,
                duration: duration,
                chain: config.env.NETWORK,
              })
              .inc(failures)

            suite
              .labels({
                buildId: `${process.env.GITHUB_RUN_ID}`,
                result: 'passed',
                baseName: baseName,
                duration: duration,
                chain: config.env.NETWORK,
              })
              .inc(passes)

            suite
              .labels({
                buildId: `${process.env.GITHUB_RUN_ID}`,
                result: 'pending',
                baseName: baseName,
                duration: duration,
                chain: config.env.NETWORK,
              })
              .inc(pending)
            suite
              .labels({
                buildId: `${process.env.GITHUB_RUN_ID}`,
                result: 'tests',
                baseName: baseName,
                duration: duration,
                chain: config.env.NETWORK,
              })
              .inc(tests)
          })

          suite
            .labels({
              buildId: `${process.env.GITHUB_RUN_ID}`,
              result: 'passed',
              baseName: 'All Specs',
              duration: totalDuration,
              chain: config.env.NETWORK,
            })
            .inc(totalPassed)

          suite
            .labels({
              buildId: `${process.env.GITHUB_RUN_ID}`,
              result: 'failed',
              baseName: 'All Specs',
              duration: totalDuration,
              chain: config.env.NETWORK,
            })
            .inc(totalFailed)
          suite
            .labels({
              buildId: `${process.env.GITHUB_RUN_ID}`,
              result: 'total',
              baseName: 'All Specs',
              duration: totalDuration,
              chain: config.env.NETWORK,
            })
            .inc(totalTests)

          const testPass = new client.Counter({
            name: `${prefix}_test_passed`,
            help: `${prefix}_pass`,
            labelNames: ['buildId', 'chain'] as const,
          })

          const testFail = new client.Counter({
            name: `${prefix}_test_failed`,
            help: `${prefix}_fail`,
            labelNames: ['buildId', 'chain'] as const,
          })

          testPass.reset()
          testFail.reset()

          testFail.labels({ buildId: `${process.env.GITHUB_RUN_ID}`, chain: config.env.NETWORK }).inc(totalFailed)
          testPass.labels({ buildId: `${process.env.GITHUB_RUN_ID}`, chain: config.env.NETWORK }).inc(totalPassed)

          register.registerMetric(testPass)
          register.registerMetric(testFail)
          register.registerMetric(suite)

          const gateway = new client.Pushgateway('https://core-pushgateway.dev.kyberengineering.io', [], register)
          await gateway.push({ jobName: 'ui-automation' })
        }
      })
    },
    specPattern: 'cypress/e2e/specs/*.e2e.cy.ts',
  },
})
