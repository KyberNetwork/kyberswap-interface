import { HomePage, TokenCatalog, myCallbackType } from "../pages/home-page.po.cy"
import { TOKEN_SYMBOLS, UNWHITE_LIST_TOKENS, tag } from "../pages/swap-page.po.cy"
import { notification, token } from "../selectors/selectors.cy"

const network_env = Cypress.env('NETWORK')
const unWhitelistTokens = UNWHITE_LIST_TOKENS[network_env]

const tokenSymbols = TOKEN_SYMBOLS[network_env]
const unListedToken = ['KNNC', 'KCCN']

const mainPage = `swap/${network_env}`.toLowerCase()

const arrAddress = [unWhitelistTokens[0].address, unWhitelistTokens[1].address, unWhitelistTokens[2].address]
const arrName = [unWhitelistTokens[0].name, unWhitelistTokens[1].name, unWhitelistTokens[2].name]

const homePage = new HomePage();
const tokenCatalog = new TokenCatalog();

describe(`Token Catalog on ${network_env}`, { tags: 'regression' }, () => {
   beforeEach(() => {
      homePage.openMainPage(mainPage)
   })

   describe('Remove/add token with favorite tokens list', () => {
      it('Should be removed tokenIn from favorite tokens list', () => {
         tokenCatalog.removeTokenInFavoriteTokensList(token.tokenIn, tokenSymbols[3])
         tokenCatalog.getTokenList(token.favoriteToken, (arr: string[]) => {
            expect(arr).not.to.include.members([tokenSymbols[3]])
         })

      })
   })
})
