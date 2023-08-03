/* eslint-disable @typescript-eslint/no-namespace */
import { getTokenList } from '../e2e/pages/swap-page.po.cy'
import { notification, tab, token } from '../e2e/selectors/selectors.cy'

export {}

declare global {
  namespace Cypress {
    interface Chainable {
      selectTokenFromFavoriteTokensList(token_selector: string, favoriteToken_selector: string, value: string): Chainable<void>
      searchToken(token_selector: string, inputToken_selector: string, value: string): Chainable<void>
      searchImportedToken(token_selector: string, inputToken_selector: string, value: string): Chainable<void>
      selectTokenBySymbol(token_selector: string, inputToken_selector: string, value: string): Chainable<void>
      removeTokenInFavoriteTokensList(selector: string, value: string): Chainable<void>
      verifyIcon(check: string): Chainable<void>
      addTokenToFavoriteTokensList(selector: string, value: string): Chainable<void>
      importNewToken(token_selector: string, inputToken_selector: string, address: Array<string>): Chainable<void>
      deleteImportedToken(token_selector: string, address: string): Chainable<void>
      clearAllImportedTokens(): Chainable<void>
    }
  }
}

Cypress.Commands.add('selectTokenFromFavoriteTokensList', (token, favorite_token, value) => {
  cy.get(token, { timeout: 30000 }).should('be.visible').click()
  cy.get(favorite_token, { timeout: 10000 }).contains(value).click()
})

Cypress.Commands.add('searchToken', (token_selector, inputToken_selector, value) => {
  cy.get(token_selector, { timeout: 30000 }).should('be.visible').click()
  cy.get(inputToken_selector).should('be.visible').type(value)
})

Cypress.Commands.add('searchImportedToken', (token_selector, inputToken_selector, value) => {
  cy.get(token_selector, { timeout: 30000 }).should('be.visible').click()
  cy.get(tab.import, { timeout: 30000 }).should('be.visible').click()
  cy.get(inputToken_selector).should('be.visible').type(value)
})

Cypress.Commands.add('selectTokenBySymbol', (token_selector, inputToken_selector, value) => {
  cy.searchToken(token_selector, inputToken_selector, value)
  cy.get(token.rowInWhiteList, { timeout: 10000 }).first().should('contain', value)
  cy.get(token.rowInWhiteList).first().click({ force: true })
})

Cypress.Commands.add('removeTokenInFavoriteTokensList', (selector, value) => {
  cy.get(selector, { timeout: 30000 }).should('be.visible').click()
  // cy.verifyValueInList(token.favoriteToken, value, true)
  getTokenList(token.favoriteToken, (arr: any) => {
    expect(arr).to.include.members([value])
  })
  cy.get(token.favoriteToken, { timeout: 10000 })
    .contains(value)
    .parent()
    .find(token.iconRemoveToken)
    .click({ force: true })
})

Cypress.Commands.add('verifyIcon', checked => {
  cy.get(token.rowInWhiteList).find(token.iconFavorite).eq(0).should('have.attr', 'data-active', checked)
})

Cypress.Commands.add('addTokenToFavoriteTokensList', (selector, value) => {
  cy.searchToken(selector, token.inputToken, value)
  cy.wait(2000)
  // cy.get(token.rowInWhiteList).find(token.iconFavorite).first().should('have.attr', 'data-active', false)
  // cy.get(token.rowInWhiteList).first().should('contain', value)
  cy.get(token.rowInWhiteList).find(token.iconFavorite).first().click({ force: true })
})

Cypress.Commands.add('importNewToken', (token_selector, inputToken_selector, address) => {
  address.forEach(element => {
    cy.searchToken(token_selector, inputToken_selector, element)
    cy.get(token.btnImport).click()
    cy.get(token.btnUnderstand).click()
  });
})

Cypress.Commands.add('deleteImportedToken', (token_selector, address) => {
  cy.searchToken(token_selector, token.inputToken, address)
  cy.get(token.rowInWhiteList).find(token.iconDelete).click()
})

Cypress.Commands.add('clearAllImportedTokens', () => {
  cy.get(tab.import).click()
  cy.get(token.clearAll).click()
})
