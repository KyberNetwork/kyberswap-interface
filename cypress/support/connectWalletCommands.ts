import { wallet } from '../e2e/selectors/selectors.cy'

export {}

declare global {
  namespace Cypress {
    interface Chainable {
      connectWallet(): Chainable<void>
    }
  }
}

Cypress.Commands.add('connectWallet', () => {
  cy.get(wallet.btnConnectWallet).should('be.visible').click()
  cy.get(wallet.checkboxAcceptTerm).click()
  cy.get(wallet.btnMetaMask).click()
  cy.acceptMetamaskAccess()
  cy.get(wallet.statusConnected).should('be.visible')
})
