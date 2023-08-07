import { homePage } from "../selectors/selectors.cy"

export class HomePage {

    openMainPage(mainPage: string) {
        cy.visit('/' + mainPage)
        cy.url().should('include', mainPage)
        cy.get(homePage.skipTutorial).click()
    }
}

export interface myCallbackType<T> {
    (myArgument: T): void
}

export class TokenCatalog {
    selectTokenFromFavoriteTokensList(token_selector: string, favoriteToken_selector: string, value: string) {
        cy.get(token_selector, { timeout: 30000 }).should('be.visible').click()
        cy.get(favoriteToken_selector, { timeout: 10000 }).contains(value).click()
    }

    searchToken(token_selector: string, inputToken_selector: string, value: string) {
        cy.get(token_selector, { timeout: 30000 }).should('be.visible').click()
        cy.get(inputToken_selector).should('be.visible').type(value)
    }

    searchImportedToken(token_selector: string, inputToken_selector: string, value: string) {
        cy.searchImportedToken(token_selector, inputToken_selector, value)
    }

    selectTokenBySymbol(token_selector: string, inputToken_selector: string, value: string) {
        this.searchToken(token_selector, inputToken_selector, value)
        cy.selectTokenBySymbol(value)
    }

    addTokenToFavoriteTokensList(token_selector: string, inputToken_selector: string, value: string) {
        this.searchToken(token_selector, inputToken_selector, value)
        cy.wait(2000)
        cy.addTokenToFavoriteTokensList()
    }

    importNewTokens(token_selector: string, inputToken_selector: string, address: Array<string>) {
        address.forEach(element => {
            this.searchToken(token_selector, inputToken_selector, element)
            cy.importNewToken()
        });
    }

    removeTokenInFavoriteTokensList(selector: string, value: string) {
        cy.get(selector, { timeout: 30000 }).should('be.visible').click()
        cy.removeTokenInFavoriteTokensList(value)
    }

    deleteImportedToken(token_selector: string, inputToken_selector: string, address: string) {
        this.searchToken(token_selector, inputToken_selector, address)
        cy.deleteImportedToken()
    }
    
    clearAllImportedTokens(token_selector: string) {
        cy.get(token_selector, { timeout: 30000 }).should('be.visible').click()
        cy.clearAllImportedTokens()
    }

    getText(selector: string, callback: myCallbackType<string>) {
      const text = cy.get(selector).invoke('text')
      text.then(text => {
        return callback(text)
      })
    }

    getTokenList(selector: string, callback: myCallbackType<string[]>) {
        const arr: string[] = []
        const listToken = cy.get(selector)
        listToken
            .each(item => {
                arr.push(item.text())
            })
            .then(() => {
                callback(arr)
            })
    }
}

// export class TokenCatalog extends Token {
//     tokenIn: Token;
//     tokenOut: Token;
// }

