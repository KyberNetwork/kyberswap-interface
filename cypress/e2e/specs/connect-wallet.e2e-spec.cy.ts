import { forEachChild } from 'typescript'

import { tag } from '../pages/swap-page.po.cy'
import { homePage, network, wallet } from '../selectors/selectors.cy'

const chainList = [
  'BNB Chain',
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
  'Ethereum',
]

describe('Metamask Extension tests', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clickButton(homePage.skipTutorial)
    cy.get(wallet.btnConnectWallet).should('be.visible').click()
    cy.connectWallet()
  })

  it('Redirects to swap page when a user has already connected a wallet', { tags: tag.smoke }, () => {
    cy.acceptMetamaskAccess()
    cy.get(wallet.statusConnected, { timeout: 5000 }).should('be.visible')
    cy.url().should('include', '/swap')
  })

  it('Should approve permission to switch network', { tags: tag.smoke }, () => {
    cy.get(wallet.statusConnected, { timeout: 5000 }).should('be.visible')
    chainList.forEach(element => {
      cy.clickButton(network.btnSelectNetwork)
      cy.get(network.btnNetwork).contains(element).click({ force: true })
      cy.allowMetamaskToAddAndSwitchNetwork().then(approved => {
        expect(approved).to.be.true
      })
    })
  })
})
