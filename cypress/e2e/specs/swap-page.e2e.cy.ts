import { SwapPage, TokenCatalog } from "../pages/swap-page.po.cy"
import { TAG, TOKEN_SYMBOLS, UNWHITE_LIST_TOKENS, noResultsText, noTokensText, unListedToken } from "../selectors/constants.cy"

const network_env = Cypress.env('NETWORK')
const unWhitelistTokens = UNWHITE_LIST_TOKENS[network_env]
const tokenSymbols = TOKEN_SYMBOLS[network_env]
const url = `swap/${network_env}`.toLowerCase()

const arrAddress = [unWhitelistTokens[0].address, unWhitelistTokens[1].address, unWhitelistTokens[2].address]
const arrSymbol = [unWhitelistTokens[0].name, unWhitelistTokens[1].name, unWhitelistTokens[2].name]

const tokenCatalog = new TokenCatalog();

describe(`Token Catalog on ${network_env}`, { tags: TAG.regression }, () => {
   beforeEach(() => {
      SwapPage.open(url)
   })

   describe('Select token in favorite tokens list', () => {
      it('Should be selected tokenIn in favorite tokens list successfully', () => {
         SwapPage.selectTokenIn().selectFavoriteToken(tokenSymbols[2])
         SwapPage.getCurrentTokenIn((text: string) => {
            expect(text).to.equal(tokenSymbols[2])
         })
      })

      it('Should be selected tokenOut in favorite tokens list successfully', () => {
         SwapPage.selectTokenOut().selectFavoriteToken(tokenSymbols[1])
         SwapPage.getCurrentTokenOut((text: string) => {
            expect(text).to.equal(tokenSymbols[1])
         })
      })
   })

   describe('Remove/add token with favorite tokens list', () => {
      it('Should be removed tokenIn from favorite tokens list', () => {
         SwapPage.selectTokenIn().removeFavoriteToken(tokenSymbols[3])
         tokenCatalog.getFavoriteTokens((list: string[]) => {
            expect(list).not.to.include.members([tokenSymbols[3]])
         })
      })

      it('Should be added tokenIn to favorite tokens list', () => {
         SwapPage.selectTokenIn().addFavoriteToken(tokenSymbols[0])
         tokenCatalog.getFavoriteTokens((list: string[]) => {
            expect(list).to.include.members([tokenSymbols[0]])
         })
      })

      it('Should be removed tokenOut from favorite tokens list', () => {
         SwapPage.selectTokenOut().removeFavoriteToken(tokenSymbols[2])
         tokenCatalog.getFavoriteTokens((list: string[]) => {
            expect(list).not.to.include.members([tokenSymbols[2]])
         })
      })

      it('Should be added tokenOut to favorite tokens list', () => {
         SwapPage.selectTokenOut().addFavoriteToken(tokenSymbols[0])
         tokenCatalog.getFavoriteTokens((list: string[]) => {
            expect(list).to.include.members([tokenSymbols[0]])
         })
      })
   })

   describe('Select token by symbol', () => {
      it('Should be selected tokenIn by symbol successfully', () => {
         SwapPage.selectTokenIn().selectTokenBySymbol(tokenSymbols[0])
         SwapPage.getCurrentTokenIn((text: string) => {
            expect(text).to.equal(tokenSymbols[0])
         })
      })

      it('Should be selected tokenOut by symbol successfully', () => {
         SwapPage.selectTokenOut().selectTokenBySymbol(tokenSymbols[1])
         SwapPage.getCurrentTokenOut((text: string) => {
            expect(text).to.equal(tokenSymbols[1])
         })
      })

      it('Should be unselected tokenIn not exist in whitelist', () => {
         SwapPage.selectTokenIn().searchToken(unListedToken[0])
         tokenCatalog.getNoResultsFound((text: string) => {
            expect(text).to.equal(noResultsText)
         })
      })

      it('Should be unselected tokenOut not exist in whitelist', () => {
         SwapPage.selectTokenOut().searchToken(unListedToken[0])
         tokenCatalog.getNoResultsFound((text: string) => {
            expect(text).to.equal(noResultsText)
         })
      })
   })

   describe('Import and delete token', () => {
      it('Should be imported then deleted tokenIn successfully', () => {
         tokenCatalog.importNewTokens(arrAddress)
         SwapPage.selectTokenIn().selectImportTab()
         tokenCatalog.getWhitelistTokens((list: string[]) => {
            expect(list).to.include.members(arrSymbol)
         })

         tokenCatalog.deleteImportedToken(arrSymbol[2])
         tokenCatalog.getWhitelistTokens((list: string[]) => {
            expect(list).not.to.include.members([arrSymbol[2]])
         })

         tokenCatalog.clearAllImportedTokens()
         tokenCatalog.getNoResultsFound((text: string) => {
            expect(text).to.equal(noResultsText)
         })
      })

      it('Should be imported then deleted tokenOut successfully', () => {
         tokenCatalog.importNewTokens(arrAddress)
         SwapPage.selectTokenOut().selectImportTab()
         tokenCatalog.getWhitelistTokens((list: string[]) => {
            expect(list).to.include.members(arrSymbol)
         })

         tokenCatalog.deleteImportedToken(arrSymbol[1])
         tokenCatalog.getWhitelistTokens((list: string[]) => {
            expect(list).not.to.include.members([arrSymbol[1]])
         })

         tokenCatalog.clearAllImportedTokens()
         tokenCatalog.getNoResultsFound((text: string) => {
            expect(text).to.equal(noResultsText)
         })
      })

   })

   describe(`E2E Token Catalog`, () => {
      it('Should be selected tokenIn and tokenOut to swap', { tags: TAG.smoke }, () => {
         tokenCatalog.importNewTokens([arrAddress[2]])
         SwapPage.getCurrentTokenIn((text: string) => {
            expect(text).to.equal(arrSymbol[2])
         })

         SwapPage.selectTokenOut().selectFavoriteToken(tokenSymbols[1])
         SwapPage.getCurrentTokenOut((text: string) => {
            expect(text).to.equal(tokenSymbols[1])
         })

         SwapPage.selectTokenOut()
         tokenCatalog.deleteImportedToken(arrSymbol[2])
         tokenCatalog.getNoResultsFound((text: string) => {
            expect(text).to.equal(noResultsText)
         })
         SwapPage.getCurrentTokenIn((text: string) => {
            expect(text).to.equal(noTokensText)
         })
      })
   })
})