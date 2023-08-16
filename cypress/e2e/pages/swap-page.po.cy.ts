import { NetworkLocators, SwapPageLocators, TokenCatalogLocators, WalletLocators } from "../selectors/selectors.cy"

export interface myCallbackType<T> {
    (myArgument: T): void
}

export const SwapPage = {
    open(url: string) {
        cy.visit('/' + url)
        cy.url().should('include', url)
        cy.closeTutorialPopup()
    },

    selectTokenIn(): TokenCatalog {
        cy.selectTokenIn()
        return new TokenCatalog()
    },
    selectTokenOut(): TokenCatalog {
        cy.selectTokenOut()
        return new TokenCatalog()
    },

    getCurrentTokenIn(text: myCallbackType<string>) {
        cy.getContent(SwapPageLocators.dropdownTokenIn, text)
    },

    getCurrentTokenOut(text: myCallbackType<string>) {
        cy.getContent(SwapPageLocators.dropdownTokenOut, text)
    },

    connectWallet() {
        cy.get(WalletLocators.btnConnectWallet).should('be.visible').click()
        cy.connectWallet()
    },

    getStatusConnectedWallet() {
        cy.get(WalletLocators.statusConnected, { timeout: 10000 }).should('be.visible')
    }
}

export class Network {
    selectNetwork(network: string) {
        cy.get(NetworkLocators.btnSelectNetwork, { timeout: 30000 }).should('be.visible').click()
        cy.get(NetworkLocators.btnNetwork).contains(network).click({ force: true })
    } 
}

export class TokenCatalog {
    searchToken(value: string) {
        cy.searchToken(value)
    }

    selectImportTab() {
        cy.selectImportTab()
    }

    selectFavoriteToken(tokenSymbol: string) {
        cy.selectFavoriteToken(tokenSymbol)
    }

    selectTokenBySymbol(tokenSymbol: string) {
        this.searchToken(tokenSymbol)
        cy.selectTokenBySymbol(tokenSymbol)
    }

    addFavoriteToken(tokenSymbol: string) {
        this.searchToken(tokenSymbol)
        cy.wait(2000)
        cy.addFavoriteToken()
    }

    removeFavoriteToken(tokenSymbol: string) {
        cy.removeFavoriteToken(tokenSymbol)
    }

    importNewTokens(address: Array<string>) {
        address.forEach(element => {
            SwapPage.selectTokenIn()
            cy.importNewToken(element)
        })
    }

    deleteImportedToken(value: string) {
        cy.deleteImportedToken(value)
    }

    clearAllImportedTokens() {
        cy.clearAllImportedTokens()
    }

    getFavoriteTokens(list: myCallbackType<string[]>) {
        cy.getList(TokenCatalogLocators.lblFavoriteToken, list)
    }

    getWhitelistTokens(list: myCallbackType<string[]>) {
        cy.getList(TokenCatalogLocators.lblRowInWhiteList, list)
    }

    getNoResultsFound(text: myCallbackType<string>) {
        cy.getContent(TokenCatalogLocators.lblNotFound, text)
    }
}