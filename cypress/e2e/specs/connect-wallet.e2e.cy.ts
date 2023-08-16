import { Network, SwapPage } from '../pages/swap-page.po.cy'
import { TAG } from '../selectors/constants.cy'

const network_env = Cypress.env('NETWORK')
const url = `swap/${network_env}`.toLowerCase()

const wallet = new Network()

describe('Metamask Extension tests', { tags: TAG.regression }, () => {
    beforeEach(() => {
        SwapPage.open(url)
        SwapPage.connectWallet()
    })

    it('Redirects to swap page when a user has already connected a wallet', () => {
        cy.acceptMetamaskAccess()
        SwapPage.getStatusConnectedWallet()
        cy.url().should('include', '/swap')
    })

    it('Should approve permission to switch network', () => {
        if (network_env !== 'Ethereum') {
            SwapPage.getStatusConnectedWallet()
            wallet.selectNetwork(network_env)
            cy.allowMetamaskToAddAndSwitchNetwork().then(approved => {
                expect(approved).to.be.true
            })
        }
    })
})
