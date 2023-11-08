export const PoolsPage = {
  open(chain: string) {
    cy.visit('/pools/' + chain)
  },
  searchByPoolAddress(poolAddress: string) {
    cy.get('input[placeholder="Search by token name or pool address"]').clear().type(poolAddress)
    cy.wait(2000)
  },
  addLiquidity(poolAddress: string, amountIn: string) {
    PoolsPage.searchByPoolAddress(poolAddress)
    cy.get('button').contains('Add Liquidity').click()
    cy.get('[role=button]').contains('Zap In').click()
    cy.get('[data-testid="token-amount-input"]').type(amountIn)
    cy.wait(20000)
    cy.go('back')
  },
}
