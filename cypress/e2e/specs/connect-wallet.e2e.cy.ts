import { Network, SwapPage } from '../pages/swap-page.po.cy'
import { DEFAULT_NETWORK, DEFAULT_URL, NETWORK, TAG } from '../selectors/constants.cy'

const wallet = new Network()

describe('Metamask Extension tests', { tags: TAG.regression }, () => {
  before(() => {
    SwapPage.open(DEFAULT_URL)
    SwapPage.connectWallet()
    cy.acceptMetamaskAccess()
    SwapPage.getStatusConnectedWallet()
  })

  it('Redirects to swap page when a user has already connected a wallet', { tags: TAG.smoke }, () => {
    cy.url().should('include', '/swap')
  })

  it('Should approve permission to switch network', () => {
    if (NETWORK !== DEFAULT_NETWORK) {
      SwapPage.getStatusConnectedWallet()
      wallet.selectNetwork(NETWORK)
      cy.allowMetamaskToAddAndSwitchNetwork().then(approved => {
        expect(approved).to.be.true
      })
    }
  })
})
