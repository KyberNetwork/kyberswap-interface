import { UNWHITE_LIST_TOKENS } from "../pages/swap-page.po.cy"
import { homePage, tab, token } from "../selectors/selectors.cy"


const mainPage = 'swap/arbitrum'
const tokenSymbol = ['ARB', 'DAI', 'USDT', 'USDC.e']
const unListedToken = ['KNNC', 'KCCN']
require('dotenv').config()

const network = process.env.NETWORK || 'ethereum'
const unWhitelistTokens = UNWHITE_LIST_TOKENS[network]



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
      cy.importNewTokenByAddress(token.tokenIn, unWhitelistTokens[0].address)
      cy.verifySelectedToken(token.tokenIn, unWhitelistTokens[0].name)
      cy.clickButton(token.tokenIn)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhitelistTokens[0].name], true)
    })

    it('Should be imported tokenOut successfully', () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhitelistTokens[1].address)
      cy.verifySelectedToken(token.tokenOut, unWhitelistTokens[1].name)
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhitelistTokens[1].name], true)
    })
  })

  describe('Delete token', () => {
    it('Should be deleted the imported tokenIn successfully', () => {
      cy.importNewTokenByAddress(token.tokenIn, unWhitelistTokens[0].address)
      cy.clickButton(token.tokenIn)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhitelistTokens[0].name], true)
      cy.deleteImportedToken(unWhitelistTokens[0].address)
      cy.verifyNoResultFound()
    })

    it('Should be deleted the imported tokenOut successfully', () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhitelistTokens[0].address)
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhitelistTokens[0].name], true)
      cy.deleteImportedToken(unWhitelistTokens[0].address)
      cy.verifyNoResultFound()
    })

    it('Should be cleared all the imported tokenIn successfully', () => {
      cy.importNewTokenByAddress(token.tokenIn, unWhitelistTokens[0].address)
      cy.importNewTokenByAddress(token.tokenIn, unWhitelistTokens[1].address)
      cy.importNewTokenByAddress(token.tokenIn, unWhitelistTokens[2].address)
      cy.clickButton(token.tokenIn)
      cy.clickButton(tab.import)
      cy.verifyValueInList(
        token.rowInWhiteList,
        [unWhitelistTokens[0].name, unWhitelistTokens[1].name, unWhitelistTokens[2].name],
        true,
      )
      cy.clearAllImportedTokens()
      cy.verifyNoResultFound()
    })

    it('Should be cleared all the imported tokenOut successfully', () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhitelistTokens[0].address)
      cy.importNewTokenByAddress(token.tokenOut, unWhitelistTokens[1].address)
      cy.importNewTokenByAddress(token.tokenOut, unWhitelistTokens[2].address)
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(
        token.rowInWhiteList,
        [unWhitelistTokens[0].name, unWhitelistTokens[1].name, unWhitelistTokens[2].name],
        true,
      )
      cy.clearAllImportedTokens()
      cy.verifyNoResultFound()
    })
  })

  describe('E2E Token Catalog', () => {
    it.only('Should be selected tokenIn and tokenOut to swap', () => {
      console.log('test token: ', network)

      // select tokenIn
      cy.clickButton(token.tokenIn)
      cy.selectTokenInFavoriteTokensList(token.favoriteToken, tokenSymbol[1])
      cy.verifySelectedToken(token.tokenIn, tokenSymbol[1])
      //select tokenOut
      cy.importNewTokenByAddress(token.tokenOut, unWhitelistTokens[0].address)
      cy.verifySelectedToken(token.tokenOut, unWhitelistTokens[0].name)
      cy.verifyURL(tokenSymbol[1], unWhitelistTokens[0].name)
      //delete imported tokenOut
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhitelistTokens[0].name], true)
      cy.deleteImportedToken(unWhitelistTokens[0].address)
      cy.verifyNoResultFound()
      cy.get(token.tokenOut).should('include.text', 'Select a token')
    })
  })
})
