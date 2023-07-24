import { homePage, tab, token } from '../../selectors/selectors.cy'

const mainPage = 'swap/arbitrum'
const tokenSymbol = ['ARB', 'DAI', 'USDT', 'USDC.e']
const unListedToken = ['KNNC', 'KCCN']

const unWhiteListedToken = {
  OHM: {
    name: 'OHM',
    address: '0xf0cb2dc0db5e6c66b9a70ac27b06b878da017028',
  },
  GBL: {
    name: 'GBL',
    address: '0xe9a264e9d45ff72e1b4a85d77643cdbd4c950207',
  },
  Y2K: {
    name: 'Y2K',
    address: '0x65c936f008bc34fe819bce9fa5afd9dc2d49977f',
  },
}

describe('Token Catalog', { tags: 'regression' }, () => {
  beforeEach(() => {
    cy.visit('/' + mainPage)
    cy.url().should('include', mainPage)
    cy.clickButton(homePage.skipTutorial)
  })
  describe('Select token in favorite tokens list', () => {
    it('Should be selected tokenIn in favorite tokens list successfully', () => {
      cy.clickButton(token.tokenIn)
      cy.selectTokenInFavoriteTokensList(token.favoriteToken, tokenSymbol[1])
      cy.verifySelectedToken(token.tokenIn, tokenSymbol[1])
      cy.verifyURL(tokenSymbol[1], '')
    })

    it('Should be selected tokenOut in favorite tokens list successfully', () => {
      cy.clickButton(token.tokenOut)
      cy.selectTokenInFavoriteTokensList(token.favoriteToken, tokenSymbol[1])
      cy.verifySelectedToken(token.tokenOut, tokenSymbol[1])
      cy.verifyURL('', tokenSymbol[1])
    })
  })

  describe('Remove/add token with favorite tokens list', () => {
    it('Should be removed tokenIn from favorite tokens list', () => {
      cy.clickButton(token.tokenIn)
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[3]], true)
      cy.removeTokenInFavoriteTokensList(tokenSymbol[3])
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[3]], false)
      cy.input(token.inputToken, tokenSymbol[3])
      cy.verifyIcon('false')
    })

    it('Should be added tokenIn to favorite tokens list', () => {
      cy.clickButton(token.tokenIn)
      cy.addTokenToFavoriteTokensList(tokenSymbol[0])
      cy.verifyIcon('true')
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[0]], true)
    })

    it('Should be removed tokenOut from favorite tokens list', () => {
      cy.clickButton(token.tokenOut)
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[2]], true)
      cy.removeTokenInFavoriteTokensList(tokenSymbol[2])
      cy.wait(2000)
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[2]], false)
      cy.input(token.inputToken, tokenSymbol[2])
      cy.verifyIcon('false')
    })

    it('Should be added tokenOut to favorite tokens list', () => {
      cy.clickButton(token.tokenOut)
      cy.addTokenToFavoriteTokensList(tokenSymbol[0])
      cy.wait(2000)
      cy.verifyIcon('true')
      cy.verifyValueInList(token.favoriteToken, [tokenSymbol[0]], true)
    })
  })

  describe('Select token by symbol', () => {
    it('Should be selected tokenIn by symbol successfully', () => {
      cy.clickButton(token.tokenIn)
      cy.selectTokenBySymbol(token.inputToken, tokenSymbol[0])
      cy.verifySelectedToken(token.tokenIn, tokenSymbol[0])
      cy.verifyURL(tokenSymbol[0], '')
    })

    it('Should be selected tokenOut by symbol successfully', () => {
      cy.clickButton(token.tokenOut)
      cy.selectTokenBySymbol(token.inputToken, tokenSymbol[1])
      cy.verifySelectedToken(token.tokenOut, tokenSymbol[1])
      cy.verifyURL('', tokenSymbol[1])
    })

    it('Should be unselected tokenIn not exist in whitelist', () => {
      cy.clickButton(token.tokenIn)
      cy.input(token.inputToken, unListedToken[0])
      cy.verifyNoResultFound()
    })

    it('Should be unselected tokenOut not exist in whitelist', () => {
      cy.clickButton(token.tokenOut)
      cy.input(token.inputToken, unListedToken[1])
      cy.verifyNoResultFound()
    })
  })

  describe('Import token', () => {
    it('Should be imported tokenIn successfully', () => {
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.OHM.address)
      cy.verifySelectedToken(token.tokenIn, unWhiteListedToken.OHM.name)
      cy.clickButton(token.tokenIn)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.OHM.name], true)
    })

    it('Should be imported tokenOut successfully', () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.GBL.address)
      cy.verifySelectedToken(token.tokenOut, unWhiteListedToken.GBL.name)
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.GBL.name], true)
    })
  })

  describe('Delete token', () => {
    it('Should be deleted the imported tokenIn successfully', () => {
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.OHM.address)
      cy.clickButton(token.tokenIn)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.OHM.name], true)
      cy.deleteImportedToken(unWhiteListedToken.OHM.address)
      cy.verifyNoResultFound()
    })

    it('Should be deleted the imported tokenOut successfully', () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.OHM.address)
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.OHM.name], true)
      cy.deleteImportedToken(unWhiteListedToken.OHM.address)
      cy.verifyNoResultFound()
    })

    it('Should be cleared all the imported tokenIn successfully', () => {
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.OHM.address)
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.GBL.address)
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.Y2K.address)
      cy.clickButton(token.tokenIn)
      cy.clickButton(tab.import)
      cy.verifyValueInList(
        token.rowInWhiteList,
        [unWhiteListedToken.OHM.name, unWhiteListedToken.GBL.name, unWhiteListedToken.Y2K.name],
        true,
      )
      cy.clearAllImportedTokens()
      cy.verifyNoResultFound()
    })

    it('Should be cleared all the imported tokenOut successfully', () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.OHM.address)
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.GBL.address)
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.Y2K.address)
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(
        token.rowInWhiteList,
        [unWhiteListedToken.OHM.name, unWhiteListedToken.GBL.name, unWhiteListedToken.Y2K.name],
        true,
      )
      cy.clearAllImportedTokens()
      cy.verifyNoResultFound()
    })
  })

  describe('E2E Token Catalog', () => {
    it('Should be selected tokenIn and tokenOut to swap', () => {
      //select tokenIn
      cy.clickButton(token.tokenIn)
      cy.selectTokenInFavoriteTokensList(token.favoriteToken, tokenSymbol[1])
      cy.verifySelectedToken(token.tokenIn, tokenSymbol[1])
      //select tokenOut
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.OHM.address)
      cy.verifySelectedToken(token.tokenOut, unWhiteListedToken.OHM.name)
      cy.verifyURL(tokenSymbol[1], unWhiteListedToken.OHM.name)
      //delete imported tokenOut
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.OHM.name], true)
      cy.deleteImportedToken(unWhiteListedToken.OHM.address)
      cy.verifyNoResultFound()
      cy.get(token.tokenOut).should('include.text', 'Select a token')
    })
  })
})
