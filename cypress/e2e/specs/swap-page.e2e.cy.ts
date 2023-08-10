
import { select } from "d3"
import { SwapPage, TOKEN_SYMBOLS, TokenCatalog, UNWHITE_LIST_TOKENS, tag } from "../pages/swap-page.po.cy"
import { SwapPageLocators, TokenCatalogLocators } from "../selectors/selectors.cy"

const network_env = Cypress.env('NETWORK')
const unWhitelistTokens = UNWHITE_LIST_TOKENS[network_env]

const tokenSymbols = TOKEN_SYMBOLS[network_env]
const unListedToken = ['KNNC', 'KCCN']
const url = `swap/${network_env}`.toLowerCase()

const arrAddress = [unWhitelistTokens[0].address, unWhitelistTokens[1].address, unWhitelistTokens[2].address]
const arrSymbol = [unWhitelistTokens[0].name, unWhitelistTokens[1].name, unWhitelistTokens[2].name]

const tokenCatalog = new TokenCatalog();
const noResultsText = "No results found."

describe(`Token Catalog on ${network_env}`, { tags: 'regression' }, () => {
   beforeEach(() => {
      SwapPage.open(url)
   })

   describe('Select token in favorite tokens list', () => {
      it.only('Should be selected tokenIn in favorite tokens list successfully', () => {
         SwapPage.selectTokenIn().selectFavoriteToken(tokenSymbols[1])
         // SwapPage.getCurrentTokenIn((text: string) => {
         //    expect(text).to.equal(tokenSymbols[1])
         // })
         
         expect(SwapPage.getCurrentTokenIn()).to.equal(tokenSymbols[1])
      })

      // it('Should be selected tokenOut in favorite tokens list successfully', () => {
      //    SwapPage.selectTokenOut().selectFavoriteToken(tokenSymbols[1])
      //    tokenCatalog.getText(SwapPageSelectors.dropdownTokenOut, (text: string) => {
      //       expect(text).to.equal(tokenSymbols[1])
      //    })
      // })
   })

   // describe('Remove/add token with favorite tokens list', () => {
   //    it('Should be removed tokenIn from favorite tokens list', () => {
   //       SwapPage.selectTokenIn().removeFavoriteToken(tokenSymbols[3])
   //       tokenCatalog.getTokenList(TokenCatalogSelectors.lblFavoriteToken, (arr: string[]) => {
   //          expect(arr).not.to.include.members([tokenSymbols[3]])
   //       })
   //    })

   //    it('Should be added tokenIn to favorite tokens list', () => {
   //       SwapPage.selectTokenIn().addFavoriteToken(tokenSymbols[0])
   //       tokenCatalog.getTokenList(TokenCatalogSelectors.lblFavoriteToken, (arr: string[]) => {
   //          expect(arr).to.include.members([tokenSymbols[0]])
   //       })
   //    })

   //    it('Should be removed tokenOut from favorite tokens list', () => {
   //       SwapPage.selectTokenOut().removeFavoriteToken(tokenSymbols[2])
   //       cy.wait(2000)
   //       tokenCatalog.getTokenList(TokenCatalogSelectors.lblFavoriteToken, (arr: string[]) => {
   //          expect(arr).not.to.include.members([tokenSymbols[2]])
   //       })
   //    })

   //    it('Should be added tokenOut to favorite tokens list', () => {
   //       SwapPage.selectTokenOut().addFavoriteToken(tokenSymbols[0])
   //       tokenCatalog.getTokenList(TokenCatalogSelectors.lblFavoriteToken, (arr: string[]) => {
   //          expect(arr).to.include.members([tokenSymbols[0]])
   //       })
   //    })
   // })

   // describe('Select token by symbol', () => {
   //    it('Should be selected tokenIn by symbol successfully', () => {
   //       SwapPage.selectTokenIn().selectTokenBySymbol(tokenSymbols[0])
   //       tokenCatalog.getText(SwapPageSelectors.dropdownTokenIn, (text: string) => {
   //          expect(text).to.equal(tokenSymbols[0])
   //       })
   //    })

   //    it('Should be selected tokenOut by symbol successfully', () => {
   //       SwapPage.selectTokenOut().selectTokenBySymbol(tokenSymbols[1])
   //       tokenCatalog.getText(SwapPageSelectors.dropdownTokenOut, (text: string) => {
   //          expect(text).to.equal(tokenSymbols[1])
   //       })
   //    })

   //    it('Should be unselected tokenIn not exist in whitelist', () => {
   //       SwapPage.selectTokenIn().searchToken(unListedToken[0])
   //       tokenCatalog.getText(TokenCatalogSelectors.lblNotFound, (text: string) => {
   //          expect(text).to.equal(noResultsText)
   //       })
   //    })

   //    it('Should be unselected tokenOut not exist in whitelist', () => {
   //       SwapPage.selectTokenOut().searchToken(unListedToken[0])
   //       tokenCatalog.getText(TokenCatalogSelectors.lblNotFound, (text: string) => {
   //          expect(text).to.equal(noResultsText)
   //       })
   //    })
   // })

   // describe('Import and delete token', () => {
   //    it.only('Should be imported then deleted tokenIn successfully', () => {
   //       tokenCatalog.importNewTokens(SwapPageSelectors.dropdownTokenIn, arrAddress)

   //       SwapPage.selectTokenIn().searchToken('{backspace}', TokenCatalogSelectors.btnImportTab)
   //       tokenCatalog.getTokenList(TokenCatalogSelectors.lblRowInWhiteList, (arr: string[]) => {
   //          expect(arr).to.include.members(arrSymbol)
   //       })

   //       tokenCatalog.deleteImportedToken(arrSymbol[2])
   //       tokenCatalog.getTokenList(TokenCatalogSelectors.lblRowInWhiteList, (arr: string[]) => {
   //          expect(arr).not.to.include.members([arrSymbol[2]])
   //       })

   //       tokenCatalog.clearAllImportedTokens()
   //       tokenCatalog.getText(TokenCatalogSelectors.lblNotFound, (text: string) => {
   //          expect(text).to.equal(noResultsText)
   //       })
   //    })

   //    it('Should be imported then deleted tokenOut successfully', () => {
   //       tokenCatalog.importNewTokens(SwapPageSelectors.dropdownTokenOut, arrAddress)

   //       SwapPage.selectTokenOut().searchToken('{backspace}', TokenCatalogSelectors.btnImportTab)
   //       tokenCatalog.getTokenList(TokenCatalogSelectors.lblRowInWhiteList, (arr: string[]) => {
   //          expect(arr).to.include.members(arrSymbol)
   //       })

   //       tokenCatalog.deleteImportedToken(arrSymbol[1])
   //       tokenCatalog.getTokenList(TokenCatalogSelectors.lblRowInWhiteList, (arr: string[]) => {
   //          expect(arr).not.to.include.members([arrSymbol[1]])
   //       })

   //       tokenCatalog.clearAllImportedTokens()
   //       tokenCatalog.getText(TokenCatalogSelectors.lblNotFound, (text: string) => {
   //          expect(text).to.equal(noResultsText)
   //       })
   //    })

   // })

   // describe(`E2E Token Catalog`, () => {
   //    let tagName = [tag.smoke];
   //    if (network_env === 'Ethereum') {
   //       tagName = [tag.regression, tag.smoke]
   //    }
   //    it('Should be selected tokenIn and tokenOut to swap', { tags: tagName }, () => {
   //       SwapPage.selectTokenIn().selectFavoriteToken(tokenSymbols[1])
   //       tokenCatalog.getText(SwapPageSelectors.dropdownTokenIn, (text: string) => {
   //          expect(text).to.equal(tokenSymbols[1])
   //       })

   //       tokenCatalog.importNewTokens(SwapPageSelectors.dropdownTokenOut, [arrAddress[2]])
   //       tokenCatalog.getText(SwapPageSelectors.dropdownTokenOut, (text: string) => {
   //          expect(text).to.equal(arrSymbol[2])
   //       })

   //       tokenCatalog.deleteImportedToken(arrSymbol[2])
   //       tokenCatalog.getText(TokenCatalogSelectors.lblNotFound, (text: string) => {
   //          expect(text).to.equal(noResultsText)
   //       })
   //    })
   // })
})