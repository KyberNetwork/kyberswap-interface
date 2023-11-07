import fs from 'fs'
import client from 'prom-client'

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  on('after:run', async results => {
    const myConsole = new console.Console(fs.createWriteStream('./output.txt'))
    myConsole.log('hello world')
    if (results) {
      const register = new client.Registry()
      const prefix = 'e2e_cypress'
      const suite = new client.Counter({
        name: `${prefix}_suite`,
        help: `${prefix}_suite`,
        labelNames: ['buildId', 'result', 'baseName', 'duration', 'chain'],
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
        labelNames: ['buildId', 'chain'],
      })

      const testFail = new client.Counter({
        name: `${prefix}_test_failed`,
        help: `${prefix}_fail`,
        labelNames: ['buildId', 'chain'],
      })

      testPass.reset()
      testFail.reset()

      testFail.labels({ buildId: `${process.env.GITHUB_RUN_ID}`, chain: config.env.NETWORK }).inc(totalFailed)
      testPass.labels({ buildId: `${process.env.GITHUB_RUN_ID}`, chain: config.env.NETWORK }).inc(totalPassed)

      register.registerMetric(testPass)
      register.registerMetric(testFail)
      register.registerMetric(suite)

      const gateway = new client.Pushgateway(`${process.env.CORE_PUSH_GATEWAY_URL}`, [], register)
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
  return config
}
