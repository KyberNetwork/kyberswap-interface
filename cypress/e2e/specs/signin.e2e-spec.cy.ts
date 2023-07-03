import { tag } from '../pages/swap-page.po.cy'
import { homePage, menu, signin, wallet } from '../selectors/selectors.cy'

let email = 'kyberqa@gmail.com'

describe('Metamask Extension tests', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clickButton(homePage.skipTutorial)
  })

  it('Sign-in 1', { tags: tag.smoke }, () => {
    /* cy.get(menu.kyberAIMenu).click()
    cy.get(menu.aboutMenu).click({ force: true })
    cy.get(signin.btnConnectWallet).first().click()
    // cy.get('.sc-iOeugr .foQDEA', { timeout: 20000 }).should('have.text', 'Connect Wallet').click()
    cy.connectWallet()
    cy.acceptMetamaskAccess()
    // cy.get(wallet.statusConnected, { timeout: 10000 }).should('be.visible')
    cy.get(signin.connectingPopup, { timeout: 10000 }).should('not.exist')

    // cy.switchToCypressWindow()
    // cy.get('.sc-iOeugr .foQDEA', { timeout: 20000 }).should('have.text', 'Sign-In to Continue').click()
    cy.get(signin.btnSignin).first().click()
    cy.confirmMetamaskSignatureRequest()
    cy.wait(20000)
    cy.get(signin.inputEmail, { timeout: 50000 }).as('inputEmail').click()
    cy.get('@inputEmail', { timeout: 90000 }).type('kyberqa+2@gmail.com')
    cy.wait(2000)
    cy.get(signin.btnJoinWaitList).click()
    cy.wait(5000) // wait for sending email
     */
    cy.task('gmail:get-messages', {
      options: {
        // from: 'noreply@kyber.network',
        from: 'alex@kyber.network',
        to: email,
        subject: '[KyberSwap] Verify your email address!',
        include_body: true,
      },
    }).then((emails: any) => {
      const body = emails[0].body.html
      const myArr = body.split('<h1>')
      const code_v = myArr[1].split('</h1>')
      console.log('code: ', code_v[0])
      // cy.get(signin.inputOTP, { timeout: 20000 }).first().click().type(code_v[0])
    })
  })
})
