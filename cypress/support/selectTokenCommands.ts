/* eslint-disable @typescript-eslint/no-namespace */
import { TokenCatalog } from '../e2e/pages/home-page.po.cy'
import { notification, tab, token } from '../e2e/selectors/selectors.cy'

const tokenCatalog = new TokenCatalog()
export {}

declare global {
  namespace Cypress {
    interface Chainable {
      searchImportedToken(token_selector: string, inputToken_selector: string, value: string): Chainable<void>
      selectTokenBySymbol(value: string): Chainable<void>
      removeTokenInFavoriteTokensList(value: string): Chainable<void>
      addTokenToFavoriteTokensList(): Chainable<void>
      importNewToken(): Chainable<void>
      deleteImportedToken(): Chainable<void>
      clearAllImportedTokens(): Chainable<void>
    }
  }
}

Cypress.Commands.add('searchImportedToken', (token_selector, inputToken_selector, value) => {
  cy.get(token_selector, { timeout: 30000 }).should('be.visible').click()
  cy.get(tab.import, { timeout: 30000 }).should('be.visible').click()
  cy.get(inputToken_selector).should('be.visible').type(value)
})

Cypress.Commands.add('selectTokenBySymbol', (value) => {
  cy.get(token.rowInWhiteList, { timeout: 10000 }).first().should('contain', value)
  cy.get(token.rowInWhiteList).first().click({ force: true })
})

Cypress.Commands.add('removeTokenInFavoriteTokensList', (value) => {
  cy.get(token.favoriteToken, { timeout: 10000 })
    .contains(value)
    .parent()
    .find(token.iconRemoveFavoriteToken)
    .click({ force: true })
})

Cypress.Commands.add('addTokenToFavoriteTokensList', () => {
  cy.get(token.rowInWhiteList).find(token.iconFavorite).first().click({ force: true })
})

Cypress.Commands.add('importNewToken', () => {
    cy.get(token.btnImport).click()
    cy.get(token.btnUnderstand).click()
})

Cypress.Commands.add('deleteImportedToken', () => {
  cy.get(token.rowInWhiteList).find(token.iconDelete).click()
})

Cypress.Commands.add('clearAllImportedTokens', () => {
  cy.get(tab.import).click()
  cy.get(token.clearAll).click()
})
