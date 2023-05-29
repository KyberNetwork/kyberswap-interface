import { notification, tab, token } from '../e2e/swap/swap-page-selectors.cy'
import { getText, getTokenList } from './swap-page.po.cy'

export {}

declare global {
  namespace Cypress {
    interface Chainable {
      selectTokenInFavoriteTokensList(selector: string, value: string): Chainable<void>
      clickButton(selector: string): Chainable<void>
      input(selector: string, value: string): Chainable<void>
      selectTokenBySymbol(selector: string, value: string): Chainable<void>
      verifyURL(selectorTokenIn: string, selectorTokenOut: string): Chainable<void>
      verifySelectedToken(selector: string, value: string): Chainable<void>
      removeTokenInFavoriteTokensList(value: string): Chainable<void>
      verifyIcon(check: string): Chainable<void>
      verifyValueInList(selector: string, value: Array<string>, exist: boolean): Chainable<void>
      addTokenToFavoriteTokensList(value: string): Chainable<void>
      verifyNoResultFound(): Chainable<void>
      importNewTokenByAddress(selector: string, address: string): Chainable<void>
      deleteImportedToken(address: string): Chainable<void>
      clearAllImportedTokens(): Chainable<void>
    }
  }
}

Cypress.Commands.add('clickButton', selector => {
  cy.get(selector, { timeout: 20000 }).should('be.visible').click()
})

Cypress.Commands.add('verifySelectedToken', (selector, value) => {
  cy.get(selector)
    .invoke('text')
    .then($text => {
      $text.match(value)
    })
})

Cypress.Commands.add('input', (selector, value) => {
  cy.get(selector).should('be.visible').type(value)
})

Cypress.Commands.add('selectTokenInFavoriteTokensList', (selector, value) => {
  cy.get(selector, { timeout: 10000 }).contains(value).click()
})

Cypress.Commands.add('selectTokenBySymbol', (selector, value) => {
  cy.input(selector, value)
  cy.get(token.rowInWhiteList, { timeout: 10000 }).eq(0).click({ force: true })
})

Cypress.Commands.add('removeTokenInFavoriteTokensList', value => {
  cy.get(token.favoriteToken, { timeout: 10000 })
    .contains(value)
    .parent()
    .find(token.iconRemoveToken)
    .click({ force: true })
})

Cypress.Commands.add('verifyValueInList', (selector, value, exist) => {
  getTokenList(selector, (arr: any) => {
    if (exist === true) {
      expect(arr).to.include.members(value)
    } else {
      expect(arr).not.to.include.members(value)
    }
  })
})

Cypress.Commands.add('verifyIcon', checked => {
  cy.get(token.rowInWhiteList).find(token.iconFavorite).eq(0).should('have.attr', 'data-active', checked)
})

Cypress.Commands.add('addTokenToFavoriteTokensList', value => {
  cy.input(token.inputToken, value)
  cy.verifyIcon('false')
  cy.get(token.rowInWhiteList).eq(0).should('contain', value)
  cy.get(token.rowInWhiteList).find(token.iconFavorite).eq(0).click()
})

Cypress.Commands.add('verifyNoResultFound', () => {
  cy.get(notification.notFound).should('have.text', 'No results found.')
})

Cypress.Commands.add('importNewTokenByAddress', (selector, address) => {
  cy.clickButton(selector)
  cy.input(token.inputToken, address)
  cy.get(token.btnImport).click()
  cy.get(token.btnUnderstand).click()
})

Cypress.Commands.add('deleteImportedToken', address => {
  cy.input(token.inputToken, address)
  cy.get(token.rowInWhiteList).find(token.iconDelete).click()
})

Cypress.Commands.add('clearAllImportedTokens', () => {
  cy.get(tab.import).click()
  cy.get(token.clearAll).click()
})

Cypress.Commands.add('verifyURL', (selectorTokenIn, selectorTokenOut) => {
  getText(selectorTokenIn, (txtTokenIn: any) => {
    getText(selectorTokenOut, (txtTokenOut: any) => {
      cy.url().should('include', txtTokenIn.toLowerCase() + '-to-' + txtTokenOut.toLowerCase())
    })
  })
})
