const output = require('../../target/out.json')
const { StaticJsonRpcProvider, Provider } = require('@ethersproject/providers')

const { estimateGas, simulateTenderly } = require('./tenderly')
const { NATIVE_TOKEN_ADDRESS } = require('./constants')

async function main() {
  const zapInData = output['cypress/e2e/specs/zap.e2e.cy.ts']['Zap In -> Arbitrum USDC-USDC.e']
    .filter(log => {
      return log.type == 'cons:debug' && log.message.includes('zap data')
    })
    .slice(-1)
    .pop()
    ['message'].replace('zap data,\n', '')

  const data = JSON.parse(zapInData)
  data.chain = 42161
  data.tokenIn = '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
  const result = await simulateTenderly(data)
  console.log(result)
}
main()
