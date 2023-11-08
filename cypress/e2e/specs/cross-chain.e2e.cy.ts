import { CrossChain } from "../pages/cross-chain.po.cy"
import { SwapPage } from "../pages/swap-page.po.cy"
import { DEFAULT_NETWORK, DEFAULT_URL, NETWORK, TAG } from "../selectors/constants.cy"

describe(`Cross-chain on ${NETWORK}`, { tags: TAG.regression }, () => {
    beforeEach(() => {
        SwapPage.open(DEFAULT_URL)
        SwapPage.connectWallet()
    })

    describe('Select network', () => {
        beforeEach(() => {
            cy.acceptMetamaskAccess()
            SwapPage.getStatusConnectedWallet()

            SwapPage.goToCrossChain()
            CrossChain.checkLoadedPage().then((checked) => {
                if (checked === true) {
                    CrossChain.closeUnderstandPopup()
                }
            })
        })
        it('The network should be changed successfully', () => {
            const networkIn = CrossChain.changeNetwork([NETWORK, DEFAULT_NETWORK])
            CrossChain.selectNetworkIn(networkIn)
            cy.allowMetamaskToAddAndSwitchNetwork().then(approved => {
                expect(approved).to.be.true
            })
            CrossChain.getCurrentNetworkIn().then((currentNetworkIn) => {
                expect(currentNetworkIn).to.equal(networkIn)
            })

            CrossChain.getCurrentNetworkOut().then((currentNetworkOut) => {
                const networkOut = CrossChain.changeNetwork([networkIn, currentNetworkOut])
                cy.wait(1000)
                CrossChain.selectNetworkOut(networkOut)
                CrossChain.getCurrentNetworkOut().then((currentNetworkOut) => {
                    expect(currentNetworkOut).to.equal(networkOut)
                })

            })
        })

    })
})