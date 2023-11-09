import arbitrumTestCases from '../../fixtures/zap/arbitrum.json'
import avalancheTestCases from '../../fixtures/zap/avalanche.json'
import bscTestCases from '../../fixtures/zap/bsc.json'
import ethereumTestCases from '../../fixtures/zap/ethereum.json'
import optimismTestCases from '../../fixtures/zap/optimism.json'
import { CustomRange, FarmingRange, PoolsPage } from '../pages/pools-page.po.cy'
import { Network, SwapPage } from '../pages/swap-page.po.cy'
import { DEFAULT_NETWORK, DEFAULT_URL, NETWORK, TAG } from '../selectors/constants.cy'

const wallet = new Network()

const DataSet = {
  Arbitrum: arbitrumTestCases,
  Ethereum: ethereumTestCases,
  Avalanche: avalancheTestCases,
  'BNB Chain': bscTestCases,
  Optimism: optimismTestCases,
}
describe('Zap In', { tags: TAG.zap }, () => {
  const zapTestData = DataSet[NETWORK]
  before(() => {
    SwapPage.open(DEFAULT_URL)
    SwapPage.connectWallet()
    if (NETWORK !== DEFAULT_NETWORK) {
      cy.acceptMetamaskAccess()
      SwapPage.getStatusConnectedWallet()
      wallet.selectNetwork(NETWORK)
      cy.allowMetamaskToAddAndSwitchNetwork().then(approved => {
        expect(approved).to.be.true
      })
      SwapPage.goToPoolPage()
    }
  })

  zapTestData.forEach(testData => {
    it(`${NETWORK}: ${testData.pair} ${testData.feeTier}`, function () {
      PoolsPage.addLiquidity(testData.id, testData.amountIn, testData.customRange as CustomRange, testData.farmingRange)
    })
  })
})
