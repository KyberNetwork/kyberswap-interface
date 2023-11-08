import { Header } from '../pages/header.po.cy'
import { PoolsPage } from '../pages/pools-page.po.cy'
import { Network, SwapPage } from '../pages/swap-page.po.cy'
import { DEFAULT_NETWORK, DEFAULT_URL, NETWORK, TAG } from '../selectors/constants.cy'

const wallet = new Network()

const zapTestData = [
  {
    id: '0x83fe9065ed68506a0d2ece59cd71c43bbff6e450',
    amountIn: '100',
    pair: 'wstETH-axl.wstET',
    range: 'Full Range',
  },
  {
    id: '0xdf03ca6c633f784ac5e062dd708b15728b488621',
    amountIn: '100',
    pair: 'ETH-ARB',
    range: 'Full Range',
  },
  {
    id: '0xc23f1d198477c0bcae0cac2ec734ceda438a8990',
    amountIn: '100',
    pair: 'USDC-USDC.',
    range: 'Full Range',
  },
]
describe('Zap In', { tags: TAG.zap }, () => {
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
    it(`${NETWORK}: ${testData.pair} ${testData.range}`, function () {
      PoolsPage.addLiquidity(testData.id, testData.amountIn)
    })
  })
})
