import { tag } from '../../pages/swap-page.po.cy'
import { homePage, menu, network } from '../../selectors/selectors.cy'

const mainPage = 'swap/ethereum'
describe('Intercept', { tags: tag.regression }, () => {
  beforeEach(() => {
    cy.visit('/')
    cy.url().should('include', mainPage)
    cy.clickButton(homePage.skipTutorial)
  })
  describe('Swap', { tags: tag.smoke }, () => {
    it('Should get route successfully', () => {
      cy.intercept('GET', '**/routes?**').as('get-route')
      cy.wait('@get-route', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 404, 408])
    })
  })

  describe('Pools', () => {
    it('Should get pool, farm list successfully', () => {
      cy.intercept('GET', '**/farm-pools?**').as('get-farm-list')
      cy.intercept('GET', '**/pools?**').as('get-pool-list')
      cy.intercept('GET', '**/block?**').as('get-block')
      cy.get(menu.earnMenu).click({ force: true })
      cy.get(menu.poolMenu).click({ force: true })
      cy.wait('@get-farm-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
      cy.wait('@get-pool-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
      cy.wait('@get-block', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
    })
  })

  describe('My Pools', () => {
    it('Should get farm list successfully', () => {
      cy.intercept('GET', '**/farm-pools?**').as('get-farm-list')
      cy.get(menu.earnMenu).click({ force: true })
      cy.get(menu.myPoolMenu).click({ force: true })
      cy.wait('@get-farm-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
    })
  })

  describe('Farms', () => {
    it('Should get pool, farm list successfully', () => {
      cy.intercept('GET', '**/farm-pools?**').as('get-farm-list')
      cy.intercept('GET', '**/pools?**').as('get-pool-list')
      cy.intercept('GET', '**/block?**').as('get-block')
      cy.get(menu.earnMenu).click({ force: true })
      cy.get(menu.farmMenu).click({ force: true })
      cy.get('[data-testid=farm-block]')
        .should(_ => {})
        .then($list => {
          if ($list.length) {
            cy.wait('@get-pool-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
          }
          cy.wait('@get-farm-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
          cy.wait('@get-block', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
        })
    })
  })
})

/* it('Test', () => {
    cy.visit('/')
    cy.wait(60000)
    cy.clickButton(homePage.skipTutorial)
    cy.get('#earningLinks').click({ force: true })
    cy.get('#pools-nav-link').click({ force: true })
    cy.get('.css-1bns6n0 button', { timeout: 60000 }).eq(0).click()
    cy.wait(5000)
    cy.get('[data-testid=test-tvl]').should('have.length', 8)
    getTokenList('[data-testid=test-tvl]', (arr: any) => {
      console.log('test arr: ', arr)
      cy.get('.sc-ciRuMe span', { timeout: 20000 }).eq(0).click()
    })
  }) */
// })
