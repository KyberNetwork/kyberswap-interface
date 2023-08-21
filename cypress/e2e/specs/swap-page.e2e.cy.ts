import { SwapPage, TokenCatalog } from "../pages/swap-page.po.cy"
import { DEFAULT_URL, NETWORK, NORESULTS_TEXT, NOTOKENS_TEXT, TAG, TOKEN_SYMBOLS, UNWHITELIST_SYMBOL_TOKENS, UNWHITELIST_TOKENS } from "../selectors/constants.cy"

const unWhitelistTokens = UNWHITELIST_TOKENS[NETWORK]
const tokenSymbols = TOKEN_SYMBOLS[NETWORK]

const arrAddress = [unWhitelistTokens[0].address, unWhitelistTokens[1].address, unWhitelistTokens[2].address]
const arrSymbol = [unWhitelistTokens[0].symbol, unWhitelistTokens[1].symbol, unWhitelistTokens[2].symbol]


const tokenCatalog = new TokenCatalog();


describe(`Token Catalog on ${NETWORK}`, { tags: TAG.regression }, () => {
   beforeEach(() => {
      SwapPage.open(DEFAULT_URL)
   })

   describe('Select token in favorite tokens list', () => {
      it('Should be selected tokenIn in favorite tokens list successfully', () => {
         SwapPage.selectTokenIn().getFavoriteTokens((arr) => {
            tokenCatalog.selectFavoriteToken(arr[1])
            SwapPage.getCurrentTokenIn((text) => {
               expect(text).to.equal(arr[1])
            })
         })
      })

      it('Should be selected tokenOut in favorite tokens list successfully', () => {
         SwapPage.selectTokenOut().getFavoriteTokens((arr) => {
            tokenCatalog.selectFavoriteToken(arr[2])
            SwapPage.getCurrentTokenOut((text) => {
               expect(text).to.equal(arr[2])
            })
         })
      })
   })

   describe('Remove/add token with favorite tokens list', () => {
      it('Should be removed tokenIn from favorite tokens list', () => {
         SwapPage.selectTokenIn().getFavoriteTokens((arr) => {
            tokenCatalog.removeFavoriteToken(arr[1])
            tokenCatalog.getFavoriteTokens((list) => {
               expect(list).not.to.include.members([arr[1]])
            })
         })
      })

      it('Should be added tokenIn to favorite tokens list', () => {
         SwapPage.selectTokenIn().addFavoriteToken(tokenSymbols[0])
         tokenCatalog.getFavoriteTokens((list) => {
            expect(list).to.include.members([tokenSymbols[0]])
         })
      })

      it('Should be removed tokenOut from favorite tokens list', () => {
         SwapPage.selectTokenOut().getFavoriteTokens((arr) => {
            tokenCatalog.removeFavoriteToken(arr[2])
            tokenCatalog.getFavoriteTokens((list) => {
               expect(list).not.to.include.members([arr[2]])
            })
         })
      })

      it('Should be added tokenOut to favorite tokens list', () => {
         SwapPage.selectTokenOut().addFavoriteToken(tokenSymbols[0])
         tokenCatalog.getFavoriteTokens((list) => {
            expect(list).to.include.members([tokenSymbols[0]])
         })
      })
   })

   describe('Select token by symbol', () => {
      it('Should be selected tokenIn by symbol successfully', () => {
         SwapPage.selectTokenIn().selectTokenBySymbol(tokenSymbols[0])
         SwapPage.getCurrentTokenIn((text) => {
            expect(text).to.equal(tokenSymbols[0])
         })
      })

      it('Should be selected tokenOut by symbol successfully', () => {
         SwapPage.selectTokenOut().selectTokenBySymbol(tokenSymbols[1])
         SwapPage.getCurrentTokenOut((text) => {
            expect(text).to.equal(tokenSymbols[1])
         })
      })

      it('Should be unselected tokenIn not exist in whitelist', () => {
         SwapPage.selectTokenIn().searchToken(UNWHITELIST_SYMBOL_TOKENS[0])
         tokenCatalog.getNoResultsFound((text) => {
            expect(text).to.equal(NORESULTS_TEXT)
         })
      })

      it('Should be unselected tokenOut not exist in whitelist', () => {
         SwapPage.selectTokenOut().searchToken(UNWHITELIST_SYMBOL_TOKENS[0])
         tokenCatalog.getNoResultsFound((text) => {
            expect(text).to.equal(NORESULTS_TEXT)
         })
      })
   })

   describe('Import and delete token', () => {
      it('Should be imported then deleted tokenIn successfully', () => {
         tokenCatalog.importNewTokens(arrAddress)
         SwapPage.selectTokenIn().selectImportTab()
         tokenCatalog.getWhitelistTokens((list) => {
            expect(list).to.include.members(arrSymbol)
         })

         tokenCatalog.deleteImportedToken(arrSymbol[2])
         tokenCatalog.getWhitelistTokens((list) => {
            expect(list).not.to.include.members([arrSymbol[2]])
         })

         tokenCatalog.clearAllImportedTokens()
         tokenCatalog.getNoResultsFound((text) => {
            expect(text).to.equal(NORESULTS_TEXT)
         })
      })

      it('Should be imported then deleted tokenOut successfully', () => {
         tokenCatalog.importNewTokens(arrAddress)
         SwapPage.selectTokenOut().selectImportTab()
         tokenCatalog.getWhitelistTokens((list) => {
            expect(list).to.include.members(arrSymbol)
         })

         tokenCatalog.deleteImportedToken(arrSymbol[1])
         tokenCatalog.getWhitelistTokens((list) => {
            expect(list).not.to.include.members([arrSymbol[1]])
         })

         tokenCatalog.clearAllImportedTokens()
         tokenCatalog.getNoResultsFound((text) => {
            expect(text).to.equal(NORESULTS_TEXT)
         })
      })
   })

   describe(`E2E Token Catalog`, () => {
      it('Should be selected tokenIn and tokenOut to swap', { tags: TAG.smoke }, () => {
         tokenCatalog.importNewTokens([arrAddress[2]])
         SwapPage.getCurrentTokenIn((text) => {
            expect(text).to.equal(arrSymbol[2])
         })

         SwapPage.selectTokenOut().getFavoriteTokens((arr) => {
            tokenCatalog.selectFavoriteToken(arr[1])
            SwapPage.getCurrentTokenOut((text) => {
               expect(text).to.equal(arr[1])
            })
         })

         SwapPage.selectTokenOut()
         tokenCatalog.deleteImportedToken(arrSymbol[2])
         tokenCatalog.getNoResultsFound((text) => {
            expect(text).to.equal(NORESULTS_TEXT)
         })
         SwapPage.getCurrentTokenIn((text) => {
            expect(text).to.equal(NOTOKENS_TEXT)
         })
      })
   })
})