import { Header } from '../pages/header.po.cy'
import { PoolsPage } from '../pages/pools-page.po.cy'
import { Network, SwapPage } from '../pages/swap-page.po.cy'
import { DEFAULT_NETWORK, DEFAULT_URL, NETWORK, TAG } from '../selectors/constants.cy'

const wallet = new Network()

describe('Zap In', { tags: TAG.regression }, () => {
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
    // cy.visit('/arbitrum/elastic/add/ETH/0x912CE59144191C1204E64559FE8253a0e49E6548/250')// POOL ETH-ARB
    // cy.visit('https://kyberswap.com/arbitrum/elastic/add/0x5979D7b546E38E414F7E9822514be443A4800529/0x9cfB13E6c11054ac9fcB92BA89644F30775436e4/8')// POOL wstETH-axl.wstETH
    cy.visit(
      '/arbitrum/elastic/add/0xaf88d065e77c8cC2239327C5EDb3A432268e5831/0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8/8',
    )

    cy.get('.css-moum56').click()
    cy.get('[data-testid="token-amount-input"]').type('100')
    //Wait to zap data encode
    cy.wait(20000)
  })
})
