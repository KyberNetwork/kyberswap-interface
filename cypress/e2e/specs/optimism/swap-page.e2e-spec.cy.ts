import { homePage, tab, token } from '../../selectors/selectors.cy'

const mainPage = 'swap/optimism'
const tokenSymbol = ['BOB', 'DAI', 'USDT', 'USDC']
const unListedToken = ['KNNC', 'KCCN']

const unWhiteListedToken = {
  CHI: {
    name: 'CHI',
    address: '0xca0e54b636db823847b29f506bffee743f57729d',
  },
  ACX: {
    name: 'ACX',
    address: '0xFf733b2A3557a7ed6697007ab5D11B79FdD1b76B',
  },
  PSP: {
    name: 'PSP',
    address: '0xd3594e879b358f430e20f82bea61e83562d49d48',
  },
}

describe('Token Catalog', { tags: 'regression' }, () => {
  beforeEach(() => {
    cy.visit('/optimism')
    cy.url().should('include', mainPage)
    cy.clickButton(homePage.skipTutorial)
  })
  describe('Select token in favorite tokens list', () => {
    it('Should be selected tokenIn in favorite tokens list successfully', { tags: 'regression' }, () => {
      cy.clickButton(token.tokenIn)
      cy.selectTokenInFavoriteTokensList(token.favoriteToken, tokenSymbol[1])
      cy.verifySelectedToken(token.tokenIn, tokenSymbol[1])
      cy.verifyURL(tokenSymbol[1], '')
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
      cy.wait(2000)
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
      cy.wait(2000)
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
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.CHI.address)
      cy.verifySelectedToken(token.tokenIn, unWhiteListedToken.CHI.name)
      cy.clickButton(token.tokenIn)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.CHI.name], true)
    })

    it('Should be imported tokenOut successfully', { tags: 'regression' }, () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.ACX.address)
      cy.verifySelectedToken(token.tokenOut, unWhiteListedToken.ACX.name)
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.ACX.name], true)
    })
  })

  describe('Delete token', () => {
    it('Should be deleted the imported tokenIn successfully', { tags: 'regression' }, () => {
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.CHI.address)
      cy.clickButton(token.tokenIn)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.CHI.name], true)
      cy.deleteImportedToken(unWhiteListedToken.CHI.address)
      cy.verifyNoResultFound()
    })

    it('Should be deleted the imported tokenOut successfully', { tags: 'regression' }, () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.CHI.address)
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.CHI.name], true)
      cy.deleteImportedToken(unWhiteListedToken.CHI.address)
      cy.verifyNoResultFound()
    })

    it('Should be cleared all the imported tokenIn successfully', { tags: 'regression' }, () => {
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.CHI.address)
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.ACX.address)
      cy.importNewTokenByAddress(token.tokenIn, unWhiteListedToken.PSP.address)
      cy.clickButton(token.tokenIn)
      cy.clickButton(tab.import)
      cy.verifyValueInList(
        token.rowInWhiteList,
        [unWhiteListedToken.CHI.name, unWhiteListedToken.ACX.name, unWhiteListedToken.PSP.name],
        true,
      )
      cy.clearAllImportedTokens()
      cy.verifyNoResultFound()
    })

    it('Should be cleared all the imported tokenOut successfully', { tags: 'regression' }, () => {
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.CHI.address)
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.ACX.address)
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.PSP.address)
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(
        token.rowInWhiteList,
        [unWhiteListedToken.CHI.name, unWhiteListedToken.ACX.name, unWhiteListedToken.ACX.name],
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
      cy.importNewTokenByAddress(token.tokenOut, unWhiteListedToken.CHI.address)
      cy.verifySelectedToken(token.tokenOut, unWhiteListedToken.CHI.name)
      cy.verifyURL(tokenSymbol[1], unWhiteListedToken.CHI.name)
      //delete imported tokenOut
      cy.clickButton(token.tokenOut)
      cy.clickButton(tab.import)
      cy.verifyValueInList(token.rowInWhiteList, [unWhiteListedToken.CHI.name], true)
      cy.deleteImportedToken(unWhiteListedToken.CHI.address)
      cy.verifyNoResultFound()
      cy.get(token.tokenOut).should('include.text', 'Select a token')
    })
  })
})
