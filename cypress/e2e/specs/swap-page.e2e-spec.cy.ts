import { homePage, tab, token } from '../selectors/selectors.cy'

const mainPage = 'swap/ethereum'
const tokenSymbol = ['KNC', 'DAI', 'USDT', 'USDC']
const unListedToken = ['KNNC', 'KCCN']

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
    cy.clickButton(homePage.skipTutorial)
  })
  describe('Select token in favorite tokens list', () => {
    it('Should be selected tokenIn in favorite tokens list successfully', { tags: 'regression' }, () => {
      cy.clickButton(token.tokenIn)
      cy.selectTokenInFavoriteTokensList(token.favoriteToken, tokenSymbol[1])
      cy.verifySelectedToken(token.tokenIn, tokenSymbol[1])
      cy.verifyURL(tokenSymbol[1], 'ABCs')
    })

    it('Should be selected tokenOut in favorite tokens list successfully', { tags: 'regression' }, () => {
      cy.clickButton(token.tokenOut)
      cy.selectTokenInFavoriteTokensList(token.favoriteToken, tokenSymbol[1])
      cy.verifySelectedToken(token.tokenOut, tokenSymbol[1])
      cy.verifyURL('', tokenSymbol[1])
    })
  })

  describe('Remove/add token with favorite tokens list', () => {
    it('Should be removed tokenIn from favorite tokens list', { tags: 'regression' }, () => {
      cy.clickButton(token.tokenIn)
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[3]], true)
      cy.removeTokenInFavoriteTokensList(tokenSymbol[3])
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[3]], false)
      cy.input(token.inputToken, tokenSymbol[3])
      cy.verifyIcon('false')
    })

    it('Should be added tokenIn to favorite tokens list', { tags: 'regression' }, () => {
      cy.clickButton(token.tokenIn)
      cy.addTokenToFavoriteTokensList(tokenSymbol[0])
      cy.verifyIcon('true')
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[0]], true)
    })

    it('Should be removed tokenOut from favorite tokens list', { tags: 'regression' }, () => {
      cy.clickButton(token.tokenOut)
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[2]], true)
      cy.removeTokenInFavoriteTokensList(tokenSymbol[2])
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[2]], false)
      cy.input(token.inputToken, tokenSymbol[2])
      cy.verifyIcon('false')
    })

    it('Should be added tokenOut to favorite tokens list', { tags: 'regression' }, () => {
      cy.clickButton(token.tokenOut)
      cy.addTokenToFavoriteTokensList(tokenSymbol[0])
      cy.verifyIcon('true')
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[0]], true)
    })
  })

  describe('Select token by symbol', () => {
    it('Should be selected tokenIn by symbol successfully', { tags: 'regression' }, () => {
      cy.clickButton(token.tokenIn)
      cy.selectTokenBySymbol(token.inputToken, tokenSymbol[0])
      cy.verifySelectedToken(token.tokenIn, tokenSymbol[0])
      cy.verifyURL(tokenSymbol[0], '')
    })

    it('Should be selected tokenOut by symbol successfully', { tags: 'regression' }, () => {
      cy.clickButton(token.tokenOut)
      cy.selectTokenBySymbol(token.inputToken, tokenSymbol[1])
      cy.verifySelectedToken(token.tokenOut, tokenSymbol[1])
      cy.verifyURL('', tokenSymbol[1])
    })

    it('Should be unselected tokenIn not exist in whitelist', { tags: 'regression' }, () => {
      cy.clickButton(token.tokenIn)
      cy.input(token.inputToken, unListedToken[0])
      cy.verifyNoResultFound()
    })

    it('Should be unselected tokenOut not exist in whitelist', { tags: 'regression' }, () => {
      cy.clickButton(token.tokenOut)
      cy.input(token.inputToken, unListedToken[1])
      cy.verifyNoResultFound()
    })
  })

  describe('Import token', () => {
    it('Should be imported tokenIn successfully', { tags: 'regression' }, () => {
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.SCOOBY.address)
      cy.verifySelectedToken(token.tokenIn, unWhiteListedToken.SCOOBY.name)
      cy.clickButton(token.tokenIn)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.SCOOBY.name], true)
    })

    it('Should be imported tokenOut successfully', { tags: 'regression' }, () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.TUSD.address)
      cy.verifySelectedToken(token.tokenOut, unWhiteListedToken.TUSD.name)
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.TUSD.name], true)
    })
  })

  describe('Delete token', () => {
    it('Should be deleted the imported tokenIn successfully', { tags: 'regression' }, () => {
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.SCOOBY.address)
      cy.clickButton(token.tokenIn)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.SCOOBY.name], true)
      cy.deleteImportedToken(unWhiteListedToken.SCOOBY.address)
      cy.verifyNoResultFound()
    })

    it('Should be deleted the imported tokenOut successfully', { tags: 'regression' }, () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.SCOOBY.address)
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.SCOOBY.name], true)
      cy.deleteImportedToken(unWhiteListedToken.SCOOBY.address)
      cy.verifyNoResultFound()
    })

    it('Should be cleared all the imported tokenIn successfully', { tags: 'regression' }, () => {
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.SCOOBY.address)
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.BGB.address)
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.TUSD.address)
      cy.clickButton(token.tokenIn)
      cy.clickButton(tab.import)
      cy.verifyValueInList(
        token.rowInWhiteList,
        [unWhiteListedToken.SCOOBY.name, unWhiteListedToken.BGB.name, unWhiteListedToken.TUSD.name],
        true,
      )
      cy.clearAllImportedTokens()
      cy.verifyNoResultFound()
    })

    it('Should be cleared all the imported tokenOut successfully', { tags: 'regression' }, () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.SCOOBY.address)
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.BGB.address)
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.TUSD.address)
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(
        token.rowInWhiteList,
        [unWhiteListedToken.SCOOBY.name, unWhiteListedToken.BGB.name, unWhiteListedToken.TUSD.name],
        true,
      )
      cy.clearAllImportedTokens()
      cy.verifyNoResultFound()
    })
  })

  describe('E2E Token Catalog', () => {
    it('Should be selected tokenIn and tokenOut to swap', { tags: ['smoke', 'regression'] }, () => {
      //select tokenIn
      cy.clickButton(token.tokenIn)
      cy.selectTokenInFavoriteTokensList(token.favoriteToken, tokenSymbol[1])
      cy.verifySelectedToken(token.tokenIn, tokenSymbol[1])
      //select tokenOut
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.SCOOBY.address)
      cy.verifySelectedToken(token.tokenOut, unWhiteListedToken.SCOOBY.name)
      cy.verifyURL(tokenSymbol[1], unWhiteListedToken.SCOOBY.name)
      //delete imported tokenOut
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.SCOOBY.name], true)
      cy.deleteImportedToken(unWhiteListedToken.SCOOBY.address)
      cy.verifyNoResultFound()
      cy.get(token.tokenOut).should('include.text', 'Select a token')
    })
  })
})
