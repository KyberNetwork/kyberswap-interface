describe('Ethereum', () => {
  before(() => {
    cy.visit('/')
    cy.url().should('include', 'swap/ethereum')
    cy.get('#walktour-tooltip-container svg').click()
  })

  describe('Swap Page', () => {
    it('Should be search token by symbol successfully', () => {
      cy.get('#swap-currency-input .token-symbol-container').click()
      cy.get('#token-search-input').type('KNC')
      cy.get("[title='Kyber Network Crystal v2']").first().click({ force: true })
      cy.url().should('include', 'swap/ethereum/knc-to-usdt')
    })
  })

  describe('Pools page', () => {
    it('should show list pools', () => {
      cy.visit('/pools/ethereum')
      cy.get('.iskUse div a').should('have.length.at.least', 24)
    })

    it('create pool with /elastic/add/ETH', () => {
      cy.visit('/pools/ethereum')
      cy.contains('span', 'Create Pool').click()
      cy.contains('span', 'Select a token').click()
      cy.contains('div', 'ETH').click()
      cy.url().should('include', 'elastic/add/ETH')
    })

    it('adding liquidity /elastic/add/ETH', () => {
      cy.visit('/pools/ethereum')
      cy.get('body').then(() => {
        cy.contains('div', 'Add Liquidity')
          .click()
          .then(() => {
            cy.url().should('contain', 'elastic/add/0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0/ETH/8')
          })
      })
    })
  })

  describe('Farm page', () => {
    it('Should show list farm pools', () => {
      cy.visit('/farms/ethereum')
      cy.get('[data-testid=farm-block]  a').should('have.length.at.least', 1)

      cy.contains('span', '$').should('exist')
      cy.contains('span', '$')
        .invoke('text')
        .then(text => {
          const tokenPriceText = text.trim()
          const tokenPriceText1 = tokenPriceText.slice(1)
          expect(tokenPriceText1).not.equal('NAN')
        })
    })
  })
})
