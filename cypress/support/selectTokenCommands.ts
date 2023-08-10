/* eslint-disable @typescript-eslint/no-namespace */
import { myCallbackType } from '../e2e/pages/swap-page.po.cy'
import { SwapPageLocators, TokenCatalogLocators } from '../e2e/selectors/selectors.cy'
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
         deleteImportedToken(value: string): Chainable<void>
         clearAllImportedTokens(): Chainable<void>
         selectFavoriteToken(tokenSymbol: string): Chainable<void>
         getContent(selector: string, callback: myCallbackType<string>): Chainable<void>
      }
   }
}

Cypress.Commands.add('closeTutorialPopup', () => {
   cy.get(SwapPageLocators.btnSkipTutorial, { timeout: 30000 }).should('be.visible').click()
})

Cypress.Commands.add('selectTokenIn', () => {
   cy.get(SwapPageLocators.dropdownTokenIn, { timeout: 30000 }).should('be.visible').click()
})

Cypress.Commands.add('selectTokenOut', () => {
   cy.get(SwapPageLocators.dropdownTokenOut, { timeout: 30000 }).should('be.visible').click()
})

Cypress.Commands.add('searchToken', (value, tab = TokenCatalogLocators.btnAllTab) => {
   if (tab !== TokenCatalogLocators.btnAllTab) {
      cy.get(TokenCatalogLocators.btnImportTab, { timeout: 30000 }).should('be.visible').click()
   }
   cy.get(TokenCatalogLocators.txtToken).should('be.visible').type(value)
})

Cypress.Commands.add('selectTokenBySymbol', (value) => {
   cy.get(TokenCatalogLocators.lblRowInWhiteList, { timeout: 10000 }).first().should('contain', value)
   cy.get(TokenCatalogLocators.lblRowInWhiteList).first().click({ force: true })
})

Cypress.Commands.add('removeFavoriteToken', (value) => {
   cy.get(TokenCatalogLocators.lblFavoriteToken, { timeout: 10000 })
      .contains(value)
      .parent()
      .find(TokenCatalogLocators.iconRemoveFavoriteToken)
      .click({ force: true })
})

Cypress.Commands.add('addFavoriteToken', () => {
   cy.get(TokenCatalogLocators.lblRowInWhiteList).find(TokenCatalogLocators.iconFavorite).first().click({ force: true })
})

Cypress.Commands.add('importNewToken', () => {
   cy.get(TokenCatalogLocators.btnImport).click()
   cy.get(TokenCatalogLocators.btnUnderstand).click()
})

Cypress.Commands.add('deleteImportedToken', (value: string) => {
   cy.searchToken(value, TokenCatalogLocators.btnImportTab)
   cy.wait(1000)
   cy.get(TokenCatalogLocators.lblRowInWhiteList).children().find(TokenCatalogLocators.iconRemoveImportedToken).click()
   cy.get(TokenCatalogLocators.txtToken).clear()

})

Cypress.Commands.add('clearAllImportedTokens', () => {
   cy.get(TokenCatalogLocators.btnClearAll).click()
})

Cypress.Commands.add('selectFavoriteToken', (tokenSymbol: string) => {
   cy.get(TokenCatalogLocators.lblFavoriteToken, { timeout: 10000 }).contains(tokenSymbol).click()
})

Cypress.Commands.add('getContent', (selector: string, callback: myCallbackType<string>) => {
   const text = cy.get(selector).invoke('text')
   text.then(text => {
      callback(text)
   })
})