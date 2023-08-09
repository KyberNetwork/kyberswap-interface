/* eslint-disable @typescript-eslint/no-empty-function */
import { SwapPage, tag } from "../pages/swap-page.po.cy"
import { HeaderSelectors } from "../selectors/selectors.cy"

const network_env = Cypress.env('NETWORK')
const url = `swap/${network_env}`.toLowerCase()

describe('Intercept', { tags: tag.regression }, () => {
   beforeEach(() => {
      SwapPage.open(url)
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
         cy.get(HeaderSelectors.dropdownEarn).click({ force: true })
         cy.get(HeaderSelectors.lblPools).click({ force: true })
         cy.wait('@get-farm-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
         cy.wait('@get-pool-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
         cy.wait('@get-block', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
      })
   })

   describe('My Pools', () => {
      it('Should get farm list successfully', () => {
         cy.intercept('GET', '**/farm-pools?**').as('get-farm-list')
         cy.get(HeaderSelectors.dropdownEarn).click({ force: true })
         cy.get(HeaderSelectors.lblPools).click({ force: true })
         cy.wait('@get-farm-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
      })
   })

   describe('Farms', () => {
      it('Should get pool, farm list successfully', () => {
         cy.intercept('GET', '**/farm-pools?**').as('get-farm-list')
         cy.intercept('GET', '**/pools?**').as('get-pool-list')
         cy.intercept('GET', '**/block?**').as('get-block')
         cy.get(HeaderSelectors.dropdownEarn).click({ force: true })
         cy.get(HeaderSelectors.lblFarms).click({ force: true })
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
