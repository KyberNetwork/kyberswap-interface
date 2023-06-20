import { forEachChild } from 'typescript'

import { tag } from '../pages/swap-page.po.cy'
import { homePage, network, token, wallet } from '../selectors/selectors.cy'

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
    cy.wait(50000)
    cy.clickButton(homePage.skipTutorial)

    cy.get(wallet.btnConnectWallet).should('be.visible').click()
    cy.connectWallet()
  })

  it('Redirects to swap page when a user has already connected a wallet', { tags: tag.smoke }, () => {
    cy.url().should('include', '/swap')
  })

  it('Should approve permission to switch network', { tags: tag.smoke }, () => {
    chainList.forEach(element => {
      cy.get(network.btnSelectNetwork).click()
      cy.get(network.btnNetwork).contains(element).click()
      cy.allowMetamaskToAddAndSwitchNetwork().then(approved => {
        expect(approved).to.be.true
      })
    })
  })
})
