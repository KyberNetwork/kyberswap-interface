import { log } from 'console'
import { isArrayLikeObject } from 'cypress/types/lodash'
import { selector } from 'd3'

import { getList, getText, notification, tab, token, tooltip } from '../e2e/swap/selectors'

export {}

declare global {
  namespace Cypress {
    interface Chainable {
      closeWelcomeTooltip(): Chainable<void>
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
      clearAllImportedToken(): Chainable<void>
      verifyImportedToken(): Chainable<void>
    }
  }
}

Cypress.Commands.add('clickButton', selector => {
  cy.get(selector, { timeout: 10000 }).should('be.visible').click()
})

Cypress.Commands.add('verifySelectedToken', (selector, value) => {
  cy.get(selector)
    .invoke('text')
    .then($text => {
      $text.match(value)
    })
})

Cypress.Commands.add('closeWelcomeTooltip', () => {
  cy.get(tooltip.welcomeTooltip, { timeout: 20000 }).should('be.visible').click()
})
