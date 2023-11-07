export const PoolsPage = {
  open(chain: string) {
    cy.visit('/pools/' + chain,{
    onBeforeLoad(win) {
      cy.stub(win.console, 'log').as('consoleLog')
      cy.stub(win.console, 'error').as('consoleError')
    })
    // cy.url().should('include', chain)
    // cy.closeTutorialPopup()
  },
}
