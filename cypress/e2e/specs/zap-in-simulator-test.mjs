import test from 'node:test'
import assert from 'node:assert/strict'

import output from '../../../target/out.json' assert {type: 'json'}
import  { simulateTenderly,getTokenInFromZapEncodeData }  from '../../support/tenderly.js';
import 'dotenv/config'

test('simulate zap in', async () => {
  const zapInData = output['cypress/e2e/specs/zap.e2e.cy.ts']['Zap In -> simulate']
    .filter(log => {
      return log.type == 'cons:debug' && log.message.includes('zap data')
    })
    .slice(-1)
    .pop()['message'].replace('zap data,\n', '')

  const data = JSON.parse(zapInData)
  data.chainId = process.env.CHAIN_ID
  data.tokenIn = getTokenInFromZapEncodeData(data)

  const result = await simulateTenderly(data)
  console.log(result)
  assert.equal(result.success, true)
})