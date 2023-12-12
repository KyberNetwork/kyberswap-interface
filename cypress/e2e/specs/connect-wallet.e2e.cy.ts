import { Network, SwapPage } from '../pages/swap-page.po.cy'
import { DEFAULT_NETWORK, DEFAULT_URL, NETWORK, TAG } from '../selectors/constants.cy'

const wallet = new Network()

describe('Connect metamask wallet', { tags: TAG.smoke }, () => {
  before(() => {
    SwapPage.open(DEFAULT_URL)
    SwapPage.connectWallet()
    cy.acceptMetamaskAccess()
    SwapPage.getStatusConnectedWallet()
  })

  it('Redirects to swap page when a user has already connected a wallet', () => {
    cy.url().should('include', '/swap')
    cy.intercept('GET', '**/routes?**').as('get-route')
    cy.wait('@get-route', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 404, 408])
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
