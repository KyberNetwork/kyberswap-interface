import { WalletLocators } from '../e2e/selectors/selectors.cy'

export {}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      connectWallet(): Chainable<void>
    }
  }
}

Cypress.Commands.add('connectWallet', () => {
  cy.get(WalletLocators.chkAcceptTerm).click()
  cy.get(WalletLocators.btnMetaMask).click()
})
