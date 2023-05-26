// Define the test suite "Metamask Extension tests"
import * as dotenv from 'dotenv'

dotenv.config()

describe('Metamask Extension tests', () => {
  before(() => {
    if (!Cypress.env('SKIP_METAMASK_SETUP')) {
      cy.setupMetamask(process.env.SECRET_WORDS, 'mainnet', process.env.PASSWORD)
    }
  })
  // Define the test case "connect to DApp with Metamask extension example"
  it('connect to DApp with Metamask extension example', () => {
    // Add a new network to Metamask using the `cy.addMetamaskNetwork()` command
    cy.addMetamaskNetwork({
      networkName: 'Binance Smart Chain Mainnet',
      rpcUrl: 'https://bsc.kyberengineering.io',
      chainId: '56',
      symbol: 'BNB',
      blockExplorer: 'https://bscscan.com',
      isTestnet: false,
    })

    // Visit the root URL of the DApp
    cy.visit('/')

    // Click the "Connect" button on the DApp
    cy.get('.css-l3rx45 .jYkwBp').click()

    // Accept the Metamask access request by clicking the "Connect" button in the Metamask popup
    cy.acceptMetamaskAccess(true).should('be.true')

    // Assert that the "Connect" button on the DApp shows the text "Connected"
    cy.get('#connectButton').should('have.text', 'Connected')
  })
})
