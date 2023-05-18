import { tab, token } from './selectors'

const mainPage = 'swap/ethereum'
const tokenSymbol = ['KNC', 'DAI', 'USDT', 'USDC']

const unWhiteListedToken = {
  SCOOBY: {
    name: 'SCOOBY',
    address: '0xAd497eE6a70aCcC3Cbb5eB874e60d87593B86F2F',
  },
  TUSD: {
    name: 'TUSD',
    address: '0x0000000000085d4780b73119b644ae5ecd22b376',
  },
  BGB: {
    name: 'BGB',
    address: '0x19de6b897ed14a376dda0fe53a5420d2ac828a28',
  },
}

describe('Token Catalog', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.url().should('include', mainPage)
    cy.closeWelcomeTooltip()
  })
  describe('Select token in favorite tokens list', () => {
    it('Should be selected tokenIn in favorite tokens list successfully', () => {
      cy.clickButton(token.tokenIn)
      cy.selectTokenInFavoriteTokensList(token.favoriteToken, tokenSymbol[1])
      cy.verifySelectedToken(token.tokenIn, tokenSymbol[1])
      cy.verifyURL(token.tokenIn, token.tokenOut)
    })

    it('Should be selected tokenOut in favorite tokens list successfully', () => {
      cy.clickButton(token.tokenOut)
      cy.selectTokenInFavoriteTokensList(token.favoriteToken, tokenSymbol[1])
      cy.verifySelectedToken(token.tokenOut, tokenSymbol[1])
      cy.verifyURL(token.tokenIn, token.tokenOut)
    })
  })

  describe('Remove/add token with favorite tokens list', () => {
    it('Should be removed token from favorite tokens list', () => {
      cy.clickButton(token.tokenIn)
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[3]], true)
      cy.removeTokenInFavoriteTokensList(tokenSymbol[3])
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[3]], false)
      cy.input(token.inputToken, tokenSymbol[3])
      cy.verifyIcon('false')
    })

    it('Should be added token to favorite tokens list', () => {
      cy.clickButton(token.tokenIn)
      cy.addTokenToFavoriteTokensList(tokenSymbol[0])
      cy.verifyIcon('true')
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[0]], true)
    })
  })

  describe('Select token by symbol', () => {
    it('Should be selected tokenIn by symbol successfully', () => {
      cy.clickButton(token.tokenIn)
      cy.selectTokenBySymbol(token.inputToken, tokenSymbol[0])
      cy.verifySelectedToken(token.tokenIn, tokenSymbol[0])
      cy.verifyURL(token.tokenIn, token.tokenOut)
    })

    it('Should be selected tokenOut by symbol successfully', () => {
      cy.clickButton(token.tokenOut)
      cy.selectTokenBySymbol(token.inputToken, tokenSymbol[1])
      cy.verifySelectedToken(token.tokenOut, tokenSymbol[1])
      cy.verifyURL(token.tokenIn, token.tokenOut)
    })

    it('Should be unselected tokenIn not exist in whitelist', () => {
      cy.clickButton(token.tokenIn)
      cy.input(token.inputToken, 'KNNC')
      cy.verifyNoResultFound()
    })

    it('Should be unselected tokenOut not exist in whitelist', () => {
      cy.clickButton(token.tokenOut)
      cy.input(token.inputToken, 'KNNC')
      cy.verifyNoResultFound()
    })
  })

  describe('Import token', () => {
    it('Should be imported tokenIn successfully', () => {
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.SCOOBY.address)
      cy.verifySelectedToken(token.tokenIn, unWhiteListedToken.SCOOBY.name)
      cy.clickButton(token.tokenIn)
      cy.wait(3000)
      cy.get(tab.import).should('be.visible').click()
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.SCOOBY.name], true)
    })

    it('Should be imported tokenOut successfully', () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.TUSD.address)
      cy.verifySelectedToken(token.tokenOut, unWhiteListedToken.TUSD.name)
      cy.clickButton(token.tokenOut)
      cy.wait(3000)
      cy.get(tab.import).should('be.visible').click()
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.TUSD.name], true)
    })
  })

  describe('Delete token', () => {
    it('Should be deleted the imported tokenIn successfully', () => {
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.SCOOBY.address)
      cy.clickButton(token.tokenIn)
      cy.wait(3000)
      cy.get(tab.import).should('be.visible').click()
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.SCOOBY.name], true)
      cy.deleteImportedToken(unWhiteListedToken.SCOOBY.address)
      cy.verifyNoResultFound()
    })

    it('Should be deleted the imported tokenOut successfully', () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.SCOOBY.address)
      cy.clickButton(token.tokenOut)
      cy.wait(3000)
      cy.get(tab.import).should('be.visible').click()
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.SCOOBY.name], true)
      cy.deleteImportedToken(unWhiteListedToken.SCOOBY.address)
      cy.verifyNoResultFound()
    })

    it('Should be cleared all the imported tokenIn successfully', () => {
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.SCOOBY.address)
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.BGB.address)
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.TUSD.address)
      cy.clickButton(token.tokenIn)
      cy.wait(3000)
      cy.get(tab.import).should('be.visible').click()
      cy.verifyValueInList(
        token.rowInWhiteList,
        [unWhiteListedToken.SCOOBY.name, unWhiteListedToken.BGB.name, unWhiteListedToken.TUSD.name],
        true,
      )
      cy.clearAllImportedToken()
      cy.verifyNoResultFound()
    })

    it('Should be cleared all the imported tokenOut successfully', () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.SCOOBY.address)
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.BGB.address)
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.TUSD.address)
      cy.clickButton(token.tokenOut)
      cy.wait(3000)
      cy.get(tab.import).should('be.visible').click()
      cy.verifyValueInList(
        token.rowInWhiteList,
        [unWhiteListedToken.SCOOBY.name, unWhiteListedToken.BGB.name, unWhiteListedToken.TUSD.name],
        true,
      )
      cy.clearAllImportedToken()
      cy.verifyNoResultFound()
    })
  })
})
