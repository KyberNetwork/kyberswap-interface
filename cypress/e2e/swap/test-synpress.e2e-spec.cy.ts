import { homePage } from './swap-page-selectors.cy'

describe('Metamask Extension tests', () => {
  before(() => {
    cy.visit('/')
    cy.clickButton(homePage.welcome)
  })
  it('connect metamask wallet', () => {
    cy.get('#btnConnectWallet').click()
    cy.get('[type="checkbox"]').click() // Check checkbox element
    cy.contains('MetaMask').click()
    cy.acceptMetamaskAccess()
    cy.get('#web3-status-connected p').should('have.text', '0xf39F...2266')
  })
})
