import test from 'node:test'
import assert from 'node:assert/strict'

import output from '../../../target/cypress-logs/zap.e2e.cy.json' assert {type: 'json'}
import  { simulateTenderly,getTokenInFromZapEncodeData }  from '../../support/tenderly.js';
import 'dotenv/config'
const suite = output['cypress/e2e/specs/zap.e2e.cy.ts'];
const testcases = Object.keys(suite)

testcases.forEach((testcase)=>{
  test(testcase, async () => {
    const zapInData = suite[testcase]
      .filter(log => {
        return log.type == 'cons:debug' && log.message.includes('zap data') && log.severity.includes('success')
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
})


