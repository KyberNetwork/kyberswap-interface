import { tag } from '../../pages/swap-page.po.cy'
import { homePage, network, wallet } from '../../selectors/selectors.cy'

const chainList = [
  'BNB',
  'Polygon',
  'Avalanche',
  'Arbitrum',
  'Optimism',
  'BitTorrent',
  'Oasis',
  'Fantom',
  'Cronos',
  'Velas',
  'Aurora',
]

describe('Metamask Extension tests', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clickButton(homePage.skipTutorial)
    cy.get(wallet.btnConnectWallet).should('be.visible').click()
    cy.connectWallet()
  })

  it('Redirects to swap page when a user has already connected a wallet', { tags: tag.regression }, () => {
    cy.acceptMetamaskAccess()
    cy.get(wallet.statusConnected, { timeout: 10000 }).should('be.visible')
    cy.url().should('include', '/swap')
  })

  it.skip('Should approve permission to switch network', { tags: tag.regression }, () => {
    cy.get(wallet.statusConnected, { timeout: 10000 }).should('be.visible')
    chainList.forEach(element => {
      cy.clickButton(network.btnSelectNetwork)
      cy.get(network.btnNetwork).contains(element).click({ force: true })
      cy.allowMetamaskToAddAndSwitchNetwork().then(approved => {
        expect(approved).to.be.true
      })
      cy.url().should('include', '/swap/' + element.toLowerCase())
    })
  })
})
