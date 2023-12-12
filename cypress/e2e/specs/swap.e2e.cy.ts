import { SwapPage, TokenCatalog } from '../pages/swap-page.po.cy'
import { DEFAULT_URL, NETWORK, NORESULTS_TEXT, NOTOKENS_TEXT, TAG, UNWHITELIST_TOKENS } from '../selectors/constants.cy'

const unWhitelistTokens = UNWHITELIST_TOKENS[NETWORK]

const tokenAddresses = [unWhitelistTokens[0].address, unWhitelistTokens[1].address, unWhitelistTokens[2].address]
const tokenSymbols = [unWhitelistTokens[0].symbol, unWhitelistTokens[1].symbol, unWhitelistTokens[2].symbol]

const tokenCatalog = new TokenCatalog()

describe(`Swap ${NETWORK}`, { tags: TAG.smoke }, () => {
  before(() => {
    SwapPage.open(DEFAULT_URL)
    SwapPage.connectWallet()
    cy.acceptMetamaskAccess()
    SwapPage.getStatusConnectedWallet()
  })
  it('verify the defaul pair', () => {
    SwapPage.getCurrentTokenIn(text => {
      expect(text).to.equal('ETH')
    })
    SwapPage.getCurrentTokenOut(text => {
      expect(text).to.equal('USDT')
    })
  })
  it('able select token in', () => {
    SwapPage.selectTokenIn().selectTokenBySymbol('USDC')
    SwapPage.getCurrentTokenIn(text => {
      expect(text).to.equal('USDC')
    })
  })

  it('able to select token out', () => {
    SwapPage.selectTokenOut().selectTokenBySymbol('USDC')
    SwapPage.getCurrentTokenOut(text => {
      expect(text).to.equal('USDC')
    })
  })

  it('able to set amount in', () => {
    SwapPage.setAmountIn('100')
    SwapPage.getAmountIn().should('eq', '100')
  })

  it('able to search, import token as normal', () => {
    tokenCatalog.importNewTokens([tokenAddresses[2]])
    SwapPage.getCurrentTokenIn(text => {
      expect(text).to.equal(tokenSymbols[2])
    })

    SwapPage.selectTokenOut().getFavoriteTokens(arr => {
      tokenCatalog.selectFavoriteToken(arr[1])
      SwapPage.getCurrentTokenOut(text => {
        expect(text).to.equal(arr[1])
      })
    })

    SwapPage.selectTokenOut()
    tokenCatalog.deleteImportedToken(tokenSymbols[2])
    tokenCatalog.getNoResultsFound(text => {
      expect(text).to.equal(NORESULTS_TEXT)
    })
    SwapPage.getCurrentTokenIn(text => {
      expect(text).to.equal(NOTOKENS_TEXT)
    })
  })
  afterEach(() => {
    cy.reload()
  })
})
