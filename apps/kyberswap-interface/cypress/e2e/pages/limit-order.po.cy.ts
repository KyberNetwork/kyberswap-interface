import { LimitOrderLocators } from '../selectors/selectors.cy'
import { TokenCatalog } from './swap-page.po.cy'

export interface myCallbackType<T> {
  (myArgument: T): void
}
export const LimitOder = {
  checkGetStartedDisplay() {
    return cy
      .get(LimitOrderLocators.btnGetStarted, { timeout: 10000 })
      .should(() => {})
      .then($obj => $obj.length > 0)
  },

  clickGetStarted() {
    cy.get(LimitOrderLocators.btnGetStarted, { timeout: 10000 }).click({ force: true })
  },

  selectTokenSell(): TokenCatalog {
    cy.selectToken(LimitOrderLocators.dropdownTokenSell)
    return new TokenCatalog()
  },
  selectTokenBuy(): TokenCatalog {
    cy.selectToken(LimitOrderLocators.dropdownTokenBuy)
    return new TokenCatalog()
  },

  getCurrentTokenSell(text: myCallbackType<string>) {
    cy.getContent(LimitOrderLocators.dropdownTokenSell, text)
  },

  getCurrentTokenBuy(text: myCallbackType<string>) {
    cy.getContent(LimitOrderLocators.dropdownTokenBuy, text)
  },

  setSellAmount(value: string) {
    cy.get(LimitOrderLocators.txtTokenSellAmount).type(value)
  },

  setSellingRate(text: string) {
    cy.get(LimitOrderLocators.txtSellingRate).click().type(text)
  },

  getSellingRate() {
    return cy.get(LimitOrderLocators.txtSellingRate).invoke('val')
  },

  getBalanceIn(text: myCallbackType<string>) {
    cy.getContent(LimitOrderLocators.lblBalanceIn, text)
  },
  getSellAmount() {
    return cy.get(LimitOrderLocators.txtTokenSellAmount).invoke('val')
  },

  getInsufficientErrorMessage() {
    return cy.get(LimitOrderLocators.lblErrorMessage)
  },
  setBuyAmount(amount: string) {
    cy.get('#create-limit-order-input-tokenb input').click().type(amount)
  },
  getBuyAmount() {
    return cy.get('#create-limit-order-input-tokenb input').invoke('val')
  },
}
