import { SwapPage, TokenCatalog } from "../pages/swap-page.po.cy"
import { DEFAULT_URL, TAG } from "../selectors/constants.cy"
import { FarmLocators, MyPoolLocators, PoolLocators } from "../selectors/selectors.cy"

const tokenCatalog = new TokenCatalog()

describe('CSP', { tags: TAG.regression }, () => {
    beforeEach(() => {
        cy.on('window:load', (win) => cy.stub(win.console, 'log').as('log'))
        SwapPage.open(DEFAULT_URL)
    })

    describe('Search token in Token Catalog', () => {
        beforeEach(() => {
            SwapPage.selectTokenIn()
        })

        it('injecting <script> tag does not work', () => {
            tokenCatalog.searchToken('KNC<script>console.log(`failed`)</script>')
            cy.get('@log').should('not.have.been.called')
        })

        it('injects XSS via img onerror attribute', () => {
            tokenCatalog.searchToken('KNC<img src="" onerror="console.log(`failed`)" />')
            cy.get('@log').should('not.have.been.called')
        })

        it('serves Content-Security-Policy header', () => {
            cy.request('/')
                .its('headers')
                .should('have.property', 'content-security-policy')
                // confirm parts of the CSP directive
                .should('include', "frame-ancestors 'self'")
        })
    })

    describe('Search token in Pools Page', () => {
        beforeEach(() => {
            SwapPage.goToPoolPage()
        })
        it('injecting <script> tag does not work', () => {
            cy.get(PoolLocators.txtSearch, { timeout: 10000 })
                .should('be.visible')
                .click()
                .type('KNC<script>console.log(`failed`)</script>')
            cy.get('@log').should('not.have.been.called')
        })

        it('injects XSS via img onerror attribute', () => {
            cy.get(PoolLocators.txtSearch, { timeout: 10000 })
                .should('be.visible')
                .click()
                .type('KNC<img src="" onerror="console.log(`failed`)" />')
            cy.get('@log').should('not.have.been.called')
        })

        it('serves Content-Security-Policy header', () => {
            cy.request('/')
                .its('headers')
                .should('have.property', 'content-security-policy')
                // confirm parts of the CSP directive
                .should('include', "frame-ancestors 'self'")
        })
    })

    describe('Search token in My Pools Page', () => {
        beforeEach(() => {
            SwapPage.goToMyPoolsPage()
        })

        it('injecting <script> tag does not work', () => {
            cy.get(MyPoolLocators.txtSearch, { timeout: 10000 })
                .should('be.visible')
                .click()
                .type('KNC<script>console.log(`failed`)</script>')
            cy.get('@log').should('not.have.been.called')
        })

        it('injects XSS via img onerror attribute', () => {
            cy.get(MyPoolLocators.txtSearch, { timeout: 10000 })
                .should('be.visible')
                .click()
                .type('KNC<img src="" onerror="console.log(`failed`)" />')
            cy.get('@log').should('not.have.been.called')
        })

        it('serves Content-Security-Policy header', () => {
            cy.request('/')
                .its('headers')
                .should('have.property', 'content-security-policy')
                // confirm parts of the CSP directive
                .should('include', "frame-ancestors 'self'")
        })

    })

    describe('Search token in Farms Page', () => {
        beforeEach(() => {
            SwapPage.goToFarmPage()
        })

        it('injecting <script> tag does not work', () => {
            cy.get(FarmLocators.txtSearch, { timeout: 10000 })
                .should('be.visible')
                .click()
                .type('KNC<script>console.log(`failed`)</script>')
            cy.get('@log').should('not.have.been.called')
        })

        it('injects XSS via img onerror attribute', () => {
            cy.get(FarmLocators.txtSearch, { timeout: 10000 })
                .should('be.visible')
                .click()
                .type('KNC<img src="" onerror="console.log(`failed`)" />')
            cy.get('@log').should('not.have.been.called')
        })

        it('serves Content-Security-Policy header', () => {
            cy.request('/')
                .its('headers')
                .should('have.property', 'content-security-policy')
                // confirm parts of the CSP directive
                .should('include', "frame-ancestors 'self'")
        })

    })

})