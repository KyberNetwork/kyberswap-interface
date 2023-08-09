/* eslint-disable @typescript-eslint/no-namespace */
import { SwapPageSelectors, TokenCatalogSelectors } from '../e2e/selectors/selectors.cy'
export { }

declare global {
   namespace Cypress {
      interface Chainable {
         closeTutorialPopup(): Chainable<void>
         searchToken(value: string, tab?: string): Chainable<void>
         selectTokenIn(): Chainable<void>
         selectTokenOut(): Chainable<void>
         selectTokenBySymbol(value: string): Chainable<void>
         removeFavoriteToken(value: string): Chainable<void>
         addFavoriteToken(): Chainable<void>
         importNewToken(): Chainable<void>
         deleteImportedToken(): Chainable<void>
         clearAllImportedTokens(): Chainable<void>
         selectFavoriteToken(tokenSymbol: string): Chainable<void>
      }
   }
}

Cypress.Commands.add('closeTutorialPopup', () => {
   cy.get(SwapPageSelectors.btnSkipTutorial, { timeout: 30000 }).should('be.visible').click()
})

Cypress.Commands.add('selectTokenIn', () => {
   cy.get(SwapPageSelectors.dropdownTokenIn, { timeout: 30000 }).should('be.visible').click()
})

Cypress.Commands.add('selectTokenOut', () => {
   cy.get(SwapPageSelectors.dropdownTokenOut, { timeout: 30000 }).should('be.visible').click()
})

Cypress.Commands.add('searchToken', (value, tab = TokenCatalogSelectors.btnAllTab) => {
   if (tab !== TokenCatalogSelectors.btnAllTab) {
      cy.get(TokenCatalogSelectors.btnImportTab, { timeout: 30000 }).should('be.visible').click()
   }
   cy.get(TokenCatalogSelectors.txtToken).should('be.visible').type(value)
})

Cypress.Commands.add('selectTokenBySymbol', (value) => {
   cy.get(TokenCatalogSelectors.lblRowInWhiteList, { timeout: 10000 }).first().should('contain', value)
   cy.get(TokenCatalogSelectors.lblRowInWhiteList).first().click({ force: true })
})

Cypress.Commands.add('removeFavoriteToken', (value) => {
   cy.get(TokenCatalogSelectors.lblFavoriteToken, { timeout: 10000 })
      .contains(value)
      .parent()
      .find(TokenCatalogSelectors.iconRemoveFavoriteToken)
      .click({ force: true })
})

Cypress.Commands.add('addFavoriteToken', () => {
   cy.get(TokenCatalogSelectors.lblRowInWhiteList).find(TokenCatalogSelectors.iconFavorite).first().click({ force: true })
})

Cypress.Commands.add('importNewToken', () => {
   cy.get(TokenCatalogSelectors.btnImport).click()
   cy.get(TokenCatalogSelectors.btnUnderstand).click()
})

Cypress.Commands.add('deleteImportedToken', () => {
   cy.wait(1000)
   cy.get(TokenCatalogSelectors.lblRowInWhiteList).children().find(TokenCatalogSelectors.iconRemoveImportedToken).click()
   cy.get(TokenCatalogSelectors.txtToken).clear()

})

Cypress.Commands.add('clearAllImportedTokens', () => {
   cy.get(TokenCatalogSelectors.btnClearAll).click()
})

Cypress.Commands.add('selectFavoriteToken', (tokenSymbol: string) => {
   cy.get(TokenCatalogSelectors.lblFavoriteToken, { timeout: 10000 }).contains(tokenSymbol).click()
})