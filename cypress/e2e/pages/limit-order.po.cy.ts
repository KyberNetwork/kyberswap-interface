import { LimitOrderLocators } from "../selectors/selectors.cy"
import { TokenCatalog } from "./swap-page.po.cy"
export interface myCallbackType<T> {
    (myArgument: T): void
}
export const LimitOder = {

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

    setAmountIn(value: string) {
        cy.get(LimitOrderLocators.txtTokenSellAmount).type(value)
    },

    setSellingRate(text: string) {
        cy.get(LimitOrderLocators.txtSellingRate).click().type(text)
    },

    getSellingRate() {
        return cy.get(LimitOrderLocators.txtSellingRate).invoke('val').then(value => {
            return value
        })
    },

    getBalanceIn(text: myCallbackType<string>) {
        cy.getContent(LimitOrderLocators.lblBalanceIn, text)
    },

    getInsufficientErrorMessage() {
        return cy.get(LimitOrderLocators.lblErrorMessage)
    }
}
