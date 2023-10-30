import { NETWORK_LIST } from "../selectors/constants.cy"
import { CrossChainLocators, NetworkLocators } from "../selectors/selectors.cy"

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

    checkLoadedPage() {
        return cy.get(CrossChainLocators.rechartsSurface, { timeout: 20000 }).should(() => { }).then($obj => {
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
}
