import { homePage } from '../selectors/selectors.cy'

describe('Metamask Extension tests', () => {
  before(() => {
    cy.visit('/')
    cy.clickButton(homePage.skipTutorial)
  })
  it('connect metamask wallet', () => {
    cy.connectWallet()
  })
})
