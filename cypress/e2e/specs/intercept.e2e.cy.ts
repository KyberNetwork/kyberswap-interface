import { SwapPage, TokenCatalog } from "../pages/swap-page.po.cy"
import { DEFAULT_URL, TAG, } from "../selectors/constants.cy"
const tokenCatalog = new TokenCatalog()

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
})