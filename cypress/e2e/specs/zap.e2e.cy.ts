import { Header } from '../pages/header.po.cy'
import { PoolsPage } from '../pages/pools-page.po.cy'
import { Network, SwapPage } from '../pages/swap-page.po.cy'
import { DEFAULT_NETWORK, DEFAULT_URL, NETWORK, TAG } from '../selectors/constants.cy'

const wallet = new Network()

describe('Zap In', { tags: TAG.zap }, () => {
  beforeEach(() => {
    SwapPage.open(DEFAULT_URL)
    SwapPage.connectWallet()
  })
  it('Arbitrum USDC-USDC.e', function () {
    if (NETWORK !== DEFAULT_NETWORK) {
      cy.acceptMetamaskAccess()

      SwapPage.getStatusConnectedWallet()
      wallet.selectNetwork(NETWORK)
      cy.allowMetamaskToAddAndSwitchNetwork().then(approved => {
        expect(approved).to.be.true
      })
    }

    cy.visit(
      '/arbitrum/elastic/add/0x912CE59144191C1204E64559FE8253a0e49E6548/0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8/1000',
    )
    cy.get('.css-moum56').click()
    cy.get('[data-testid="token-amount-input"]').type('100')
    //Wait to zap data encode
    cy.wait(20000)
  })
})
