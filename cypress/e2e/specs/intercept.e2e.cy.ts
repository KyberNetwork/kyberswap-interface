/* eslint-disable @typescript-eslint/no-empty-function */
import { SwapPage } from "../pages/swap-page.po.cy"
import { DEFAULT_URL, TAG,  } from "../selectors/constants.cy"
import { HeaderLocators } from "../selectors/selectors.cy"

describe('Intercept', { tags: TAG.regression }, () => {
   beforeEach(() => {
      SwapPage.open(DEFAULT_URL)
   })
   describe('Swap', () => {
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
         cy.get(HeaderLocators.dropdownEarn).click({ force: true })
         cy.get(HeaderLocators.lblPools).click({ force: true })
         cy.wait('@get-farm-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
         cy.wait('@get-pool-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
         cy.wait('@get-block', { timeout: 60000 }).its('response.statusCode').should('equal', 200)
      })
   })

   describe('My Pools', () => {
      it('Should get farm list successfully', () => {
         cy.intercept('GET', '**/farm-pools?**').as('get-farm-list')
         cy.get(HeaderLocators.dropdownEarn).click({ force: true })
         cy.get(HeaderLocators.lblPools).click({ force: true })
         cy.wait('@get-farm-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
      })
   })

   describe('Farms', () => {
      it('Should get pool, farm list successfully', () => {
         cy.intercept('GET', '**/farm-pools?**').as('get-farm-list')
         cy.intercept('GET', '**/pools?**').as('get-pool-list')
         cy.intercept('GET', '**/block?**').as('get-block')
         cy.get(HeaderLocators.dropdownEarn).click({ force: true })
         cy.get(HeaderLocators.lblFarms).click({ force: true })
         cy.get('[data-testid=farm-block]')
            .should(_ => {})
            .then($list => {
               if ($list.length) {
                  cy.wait('@get-pool-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
               }
               cy.wait('@get-farm-list', { timeout: 5000 }).its('response.statusCode').should('equal', 200)
               cy.wait('@get-block', { timeout: 60000 }).its('response.statusCode').should('equal', 200)
            })
      })
   })
})