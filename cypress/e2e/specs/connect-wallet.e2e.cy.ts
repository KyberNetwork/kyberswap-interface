import { tag } from '../pages/swap-page.po.cy'
import { NetworkLocators, SwapPageLocators, WalletLocators } from '../selectors/selectors.cy'

const network_env = Cypress.env('NETWORK')
const mainPage = `swap/${network_env}`.toLowerCase()

describe('Metamask Extension tests', { tags: tag.regression }, () => {
   beforeEach(() => {
      cy.visit('/' + mainPage)
      cy.get(SwapPageLocators.btnSkipTutorial, { timeout: 30000 }).should('be.visible').click()
      cy.get(WalletLocators.btnConnectWallet).should('be.visible').click()
      cy.connectWallet()
   })

   it('Redirects to swap page when a user has already connected a wallet', () => {
      cy.acceptMetamaskAccess()
      cy.get(WalletLocators.statusConnected, { timeout: 10000 }).should('be.visible')
      cy.url().should('include', '/swap')
   })

   it('Should approve permission to switch network', () => {
      if (network_env !== 'Ethereum') {
         cy.get(WalletLocators.statusConnected, { timeout: 10000 }).should('be.visible')
         cy.get(NetworkLocators.btnSelectNetwork, { timeout: 30000 }).should('be.visible').click()
         cy.get(NetworkLocators.btnNetwork).contains(network_env).click({ force: true })
         cy.allowMetamaskToAddAndSwitchNetwork().then(approved => {
            expect(approved).to.be.true
         })
      }
      cy.url().should('include', mainPage)
   })
})
