import { TOKEN_SYMBOLS, UNWHITE_LIST_TOKENS, getTokenList, tag } from "../pages/swap-page.po.cy"
import { homePage, notification, token } from "../selectors/selectors.cy"

const network_env = Cypress.env('NETWORK')
const unWhitelistTokens = UNWHITE_LIST_TOKENS[network_env]

const tokenSymbols = TOKEN_SYMBOLS[network_env]
const unListedToken = ['KNNC', 'KCCN']

const mainPage = `swap/${network_env}`.toLowerCase()

const arrAddress = [unWhitelistTokens[0].address, unWhitelistTokens[1].address, unWhitelistTokens[2].address]
const arrName = [unWhitelistTokens[0].name, unWhitelistTokens[1].name, unWhitelistTokens[2].name]

describe(`Token Catalog on ${network_env}`, { tags: 'regression' }, () => {
   beforeEach(() => {
      cy.visit('/' + mainPage)
      cy.url().should('include', mainPage)
      cy.get(homePage.skipTutorial, { timeout: 30000 }).should('be.visible').click()
   })
   describe('Select token in favorite tokens list', () => {
      it('Should be selected tokenIn in favorite tokens list successfully', () => {
         cy.selectTokenFromFavoriteTokensList(token.tokenIn, token.favoriteToken, tokenSymbols[1])

         cy.get(token.tokenIn)
            .invoke('text')
            .then($text => {
               $text.match(tokenSymbols[1])
            })
         cy.url().should('contain', tokenSymbols[1].toLowerCase() + '-to-')
      })

      it('Should be selected tokenOut in favorite tokens list successfully', () => {
         cy.selectTokenFromFavoriteTokensList(token.tokenOut, token.favoriteToken, tokenSymbols[1])
         cy.get(token.tokenOut)
            .invoke('text')
            .then($text => {
               $text.match(tokenSymbols[1])
            })
         cy.url().should('contain', '-to-' + tokenSymbols[1].toLowerCase())

      })
   })

   describe('Remove/add token with favorite tokens list', () => {
      it('Should be removed tokenIn from favorite tokens list', () => {
         cy.removeTokenInFavoriteTokensList(token.tokenIn, tokenSymbols[3])
         cy.wait(2000)
         getTokenList(token.favoriteToken, (arr: any) => {
            expect(arr).not.to.include.members([tokenSymbols[3]])
         })
      })

      it('Should be added tokenIn to favorite tokens list', () => {
         cy.addTokenToFavoriteTokensList(token.tokenIn, tokenSymbols[0])
         getTokenList(token.favoriteToken, (arr: any) => {
            expect(arr).to.include.members([tokenSymbols[0]])
         })
         cy.get(token.rowInWhiteList).find(token.iconFavorite).first().should('have.attr', 'data-active', 'true')
      })

      it('Should be removed tokenOut from favorite tokens list', () => {
         cy.removeTokenInFavoriteTokensList(token.tokenOut, tokenSymbols[2])
         cy.wait(2000)
         getTokenList(token.favoriteToken, (arr: any) => {
            expect(arr).not.to.include.members([tokenSymbols[2]])
         })
      })

      it('Should be added tokenOut to favorite tokens list', () => {
         cy.addTokenToFavoriteTokensList(token.tokenOut, tokenSymbols[0])
         getTokenList(token.favoriteToken, (arr: any) => {
            expect(arr).to.include.members([tokenSymbols[0]])
         })
         cy.get(token.rowInWhiteList).find(token.iconFavorite).first().should('have.attr', 'data-active', 'true')
      })
   })

   describe('Select token by symbol', () => {
      it('Should be selected tokenIn by symbol successfully', () => {
         cy.selectTokenBySymbol(token.tokenIn, token.inputToken, tokenSymbols[0])
         cy.get(token.tokenIn)
            .invoke('text')
            .then($text => {
               $text.match(tokenSymbols[0])
            })
         cy.url().should('contain', tokenSymbols[0].toLowerCase() + '-to-')
      })

      it('Should be selected tokenOut by symbol successfully', () => {
         cy.selectTokenBySymbol(token.tokenOut, token.inputToken, tokenSymbols[1])
         cy.get(token.tokenOut)
            .invoke('text')
            .then($text => {
               $text.match(tokenSymbols[1])
            })
         cy.url().should('contain', '-to-' + tokenSymbols[1].toLowerCase())
      })

      it('Should be unselected tokenIn not exist in whitelist', () => {
         cy.searchToken(token.tokenIn, token.inputToken, unListedToken[0])
         cy.get(notification.notFound).should('have.text', 'No results found.')
      })

      it('Should be unselected tokenOut not exist in whitelist', () => {
         cy.searchToken(token.tokenIn, token.inputToken, unListedToken[1])
         cy.get(notification.notFound).should('have.text', 'No results found.')
      })
   })

   describe('Import token', () => {
      it('Should be imported tokenIn successfully', () => {
         cy.importNewToken(token.tokenIn, token.inputToken, [unWhitelistTokens[0].address])
         cy.get(token.tokenIn)
            .invoke('text')
            .then($text => {
               $text.match(unWhitelistTokens[0].name)
            })
         cy.searchImportedToken(token.tokenIn, token.inputToken, unWhitelistTokens[0].name)
         // cy.verifyValueInList(token.rowInWhiteList, [unWhitelistTokens[0].name], true)
         getTokenList(token.rowInWhiteList, (arr: any) => {
            expect(arr).to.include.members([unWhitelistTokens[0].name])
         })
      })

      it('Should be imported tokenOut successfully', () => {
         cy.importNewToken(token.tokenOut, token.inputToken, [unWhitelistTokens[1].address])
         cy.get(token.tokenOut)
            .invoke('text')
            .then($text => {
               $text.match(unWhitelistTokens[1].name)
            })
         cy.searchImportedToken(token.tokenOut, token.inputToken, unWhitelistTokens[1].name)
         // cy.verifyValueInList(token.rowInWhiteList, [unWhitelistTokens[0].name], true)
         getTokenList(token.rowInWhiteList, (arr: any) => {
            expect(arr).to.include.members([unWhitelistTokens[1].name])
         })
      })
   })

   describe('Delete token', () => {
      it('Should be deleted the imported tokenIn successfully', () => {
         cy.importNewToken(token.tokenIn, token.inputToken, [unWhitelistTokens[0].address])
         cy.searchImportedToken(token.tokenIn, token.inputToken, unWhitelistTokens[0].name)
         getTokenList(token.rowInWhiteList, (arr: any) => {
            expect(arr).to.include.members([unWhitelistTokens[0].name])
         })

         cy.deleteImportedToken(token.tokenIn, unWhitelistTokens[0].address)
         getTokenList(token.rowInWhiteList, (arr: any) => {
            expect(arr).not.to.include.members([unWhitelistTokens[0].name])
         })
      })

      it('Should be deleted the imported tokenOut successfully', () => {
         cy.importNewToken(token.tokenOut, token.inputToken, [unWhitelistTokens[0].address])
         cy.searchImportedToken(token.tokenOut, token.inputToken, unWhitelistTokens[0].name)
         getTokenList(token.rowInWhiteList, (arr: any) => {
            expect(arr).to.include.members([unWhitelistTokens[0].name])
         })

         cy.deleteImportedToken(token.tokenOut, unWhitelistTokens[0].address)
         getTokenList(token.rowInWhiteList, (arr: any) => {
            expect(arr).not.to.include.members([unWhitelistTokens[0].name])
         })
      })

      it('Should be cleared all the imported tokenIn successfully', () => {
         cy.importNewToken(token.tokenIn, token.inputToken, arrAddress)
         cy.searchImportedToken(token.tokenIn, token.inputToken, '')
         getTokenList(token.rowInWhiteList, (arr: any) => {
            expect(arr).to.include.members(arrName)
         })

         cy.clearAllImportedTokens()
         cy.get(notification.notFound).should('have.text', 'No results found.')
      })

      it('Should be cleared all the imported tokenOut successfully', () => {
         cy.importNewToken(token.tokenOut, token.inputToken, arrAddress)
         cy.searchImportedToken(token.tokenOut, token.inputToken, '')
         getTokenList(token.rowInWhiteList, (arr: any) => {
            expect(arr).to.include.members(arrName)
         })

         cy.clearAllImportedTokens()
         cy.get(notification.notFound).should('have.text', 'No results found.')
      })
   })

   describe(`E2E Token Catalog`, () => {
      let tagName = [tag.regression];
      if (network_env === 'Ethereum') {
         tagName = [tag.regression, tag.smoke]
      }
      it('Should be selected tokenIn and tokenOut to swap', { tags: tagName }, () => {
         cy.selectTokenFromFavoriteTokensList(token.tokenIn, token.favoriteToken, tokenSymbols[1])
         cy.get(token.tokenIn)
            .invoke('text')
            .then($text => {
               $text.match(unWhitelistTokens[1].name)
            })
         //select tokenOut
         cy.importNewToken(token.tokenOut, token.inputToken, [unWhitelistTokens[0].address])
         cy.get(token.tokenOut)
            .invoke('text')
            .then($text => {
               $text.match(unWhitelistTokens[0].name)
            })
         cy.url().should('contain', tokenSymbols[1].toLowerCase() + '-to-' + unWhitelistTokens[0].name.toLowerCase())
         //delete imported tokenOut
         // cy.clickButton(token.tokenOut)
         // cy.clickButton(tab.import)
         // cy.verifyValueInList(token.rowInWhiteList, [unWhitelistTokens[0].name], true)
         // cy.deleteImportedToken(unWhitelistTokens[0].address)
         // cy.verifyNoResultFound()
         // cy.get(token.tokenOut).should('include.text', 'Select a token')


         cy.searchImportedToken(token.tokenOut, token.inputToken, unWhitelistTokens[0].name)
         getTokenList(token.rowInWhiteList, (arr: any) => {
            expect(arr).to.include.members([unWhitelistTokens[0].name])
         })

         cy.deleteImportedToken(token.tokenOut, unWhitelistTokens[0].address)
         getTokenList(token.rowInWhiteList, (arr: any) => {
            expect(arr).not.to.include.members([unWhitelistTokens[0].name])
         })
      })
   })
})
