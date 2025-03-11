/* eslint-disable @typescript-eslint/no-namespace */


import { myCallbackType } from '../e2e/pages/swap-page.po.cy'
import { SwapPageLocators, TokenCatalogLocators } from '../e2e/selectors/selectors.cy'
export { }

declare global {
   namespace Cypress {
      interface Chainable {
         closeTutorialPopup(): Chainable<void>
         searchToken(value: string): Chainable<void>
         selectToken(selector: string): Chainable<void>
         selectTokenBySymbol(value: string): Chainable<void>
         removeFavoriteToken(value: string): Chainable<void>
         addFavoriteToken(): Chainable<void>
         selectImportTab(): Chainable<void>
         importNewToken(address: string): Chainable<void>
         deleteImportedToken(value: string): Chainable<void>
         clearAllImportedTokens(): Chainable<void>
         selectFavoriteToken(tokenSymbol: string): Chainable<void>
         getContent(selector: string, callback: myCallbackType<string>): Chainable<void>
         getList(selector: string, callback: myCallbackType<string[]>): Chainable<void>
      }
   }
}

Cypress.Commands.add('closeTutorialPopup', () => {
   cy.get(SwapPageLocators.btnSkipTutorial, { timeout: 30000 }).should('be.visible').click()
})

Cypress.Commands.add('selectToken', (selector: string) => {
   cy.get(selector, { timeout: 30000 }).should('be.visible').click()
})

Cypress.Commands.add('searchToken', (value) => {
   cy.get(TokenCatalogLocators.txtToken).clear()
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

Cypress.Commands.add('selectImportTab', () => {
   cy.get(TokenCatalogLocators.btnImportTab, { timeout: 30000 }).should('be.visible').click()
})

Cypress.Commands.add('importNewToken', (address: string) => {
   cy.searchToken(address)
   cy.get(TokenCatalogLocators.btnImport).click()
   cy.get(TokenCatalogLocators.btnUnderstand).click()
})

Cypress.Commands.add('deleteImportedToken', (value: string) => {
   cy.selectImportTab()
   cy.searchToken(value)
   cy.wait(1000)
   cy.get(TokenCatalogLocators.lblRowInWhiteList).children().find(TokenCatalogLocators.iconRemoveImportedToken).click()
   cy.get(TokenCatalogLocators.txtToken).clear()

})

Cypress.Commands.add('clearAllImportedTokens', () => {
   cy.get(TokenCatalogLocators.btnClearAll, { timeout: 30000 }).should('be.visible').click()
})

Cypress.Commands.add('selectFavoriteToken', (tokenSymbol: string) => {
   cy.get(TokenCatalogLocators.lblFavoriteToken, { timeout: 10000 }).contains(tokenSymbol).click()
})

Cypress.Commands.add('getContent', (selector: string, callback: myCallbackType<string>) => {
   cy.get(selector).invoke('text').then($text => {
      callback($text)
   })
})

Cypress.Commands.add('getList', (selector: string, callback: myCallbackType<string[]>) => {
   const arr: string[] = []
   const listData = cy.get(selector)
   listData
      .each(item => {
         arr.push(item.text())
      })
      .then(() => {
         callback(arr)
      })
})