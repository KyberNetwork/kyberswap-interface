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
  it('simulate', function () {
    if (NETWORK !== DEFAULT_NETWORK) {
      cy.acceptMetamaskAccess()

      SwapPage.getStatusConnectedWallet()
      wallet.selectNetwork(NETWORK)
      cy.allowMetamaskToAddAndSwitchNetwork().then(approved => {
        expect(approved).to.be.true
      })
    }
    cy.intercept('GET', '**/pools?**').as('get-pool-list')
    SwapPage.goToPoolPage()
    cy.wait('@get-pool-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
    cy.get('@get-pool-list')
      .its('response.body')
      .its('data.pools')
      .its(0)
      .then(pool => {
        PoolsPage.addLiquidity(pool.id, '100')
      })
  })
})
