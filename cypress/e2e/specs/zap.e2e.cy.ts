import { Header } from '../pages/header.po.cy'
import { PoolsPage } from '../pages/pools-page.po.cy'
import { Network, SwapPage } from '../pages/swap-page.po.cy'
import { DEFAULT_NETWORK, DEFAULT_URL, NETWORK, TAG } from '../selectors/constants.cy'

const wallet = new Network()
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

  it('Arbitrum: wstETH-axl.wstETH', function () {
    PoolsPage.addLiquidity('0x83fe9065ed68506a0d2ece59cd71c43bbff6e450', '100')
  })

  it('Arbitrum: ETH-ARB', function () {
    SwapPage.goToPoolPage()
    PoolsPage.addLiquidity('0xdf03ca6c633f784ac5e062dd708b15728b488621', '100')
  })

  it('Arbitrum: USDC-USDC.e', function () {
    SwapPage.goToPoolPage()
    PoolsPage.addLiquidity('0xc23f1d198477c0bcae0cac2ec734ceda438a8990', '100')
  })
})
