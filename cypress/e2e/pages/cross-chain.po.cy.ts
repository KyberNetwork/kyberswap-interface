import { NETWORK_LIST } from "../selectors/constants.cy"
import { CrossChainLocators, NetworkLocators } from "../selectors/selectors.cy"
import { TokenCatalog } from "./swap-page.po.cy"

export interface myCallbackType<T> {
    (myArgument: T): void
}

export const CrossChain = {

    closeUnderstandPopup() {
        cy.get(CrossChainLocators.btnUnderstand).click()
    },

    selectNetworkIn(networkName: string) {
        cy.get(CrossChainLocators.btnNetworkIn).click()
        cy.get(NetworkLocators.btnNetwork).contains(networkName).click({ force: true })

    },

    selectNetworkOut(networkName: string) {
        cy.get(CrossChainLocators.btnNetworkOut).click()
        cy.get(NetworkLocators.btnNetwork).contains(networkName).click({ force: true })
    },

    changeNetwork(oldNetwork: string[]) {
        let random = 0
        do {
            random = Math.floor(Math.random() * NETWORK_LIST.length)
        } while (oldNetwork.includes(NETWORK_LIST[random]) === true)

        return NETWORK_LIST[random]
    },

    selectTokenIn(): TokenCatalog {
        cy.selectToken(CrossChainLocators.dropdownTokenIn)
        return new TokenCatalog()
    },
    selectTokenOut(): TokenCatalog {
        cy.selectToken(CrossChainLocators.dropdownTokenOut)
        return new TokenCatalog()
    },

    checkLoadedPage() {
        return cy.get(CrossChainLocators.rechartsSurface, { timeout: 20000 }).should('be.visible').then($obj => {
            if ($obj.length > 0) {
                return true
            }
            return false
        })
    },

    getCurrentNetworkIn() {
        return cy.get(CrossChainLocators.btnNetworkIn).invoke('text').then(network => {
            return network
        })
    },

    getCurrentNetworkOut() {
        return cy.get(CrossChainLocators.btnNetworkOut).invoke('text').then(network => {
            return network
        })
    },

    getCurrentTokenIn(text: myCallbackType<string>) {
        cy.getContent(CrossChainLocators.dropdownTokenIn, text)
    },

    getCurrentTokenOut(text: myCallbackType<string>) {
        cy.getContent(CrossChainLocators.dropdownTokenOut, text)
    },
}
