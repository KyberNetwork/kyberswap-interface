import { LimitOder } from "../pages/limit-order.po.cy"
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
        cy.get('#limit-button').click()
    })

    describe('Add/remove/select token with favorite tokens list', () => {
        it('Should be added, selected and removed favorite token sell', () => {
            LimitOder.selectTokenSell().addFavoriteToken([tokenSymbols[0], tokenSymbols[1]])
            tokenCatalog.getFavoriteTokens((list) => {
                expect(list).to.include.members([tokenSymbols[1]])
            })

            tokenCatalog.selectFavoriteToken(tokenSymbols[1])
            LimitOder.getCurrentTokenSell((text) => {
                expect(text).to.equal(tokenSymbols[1])
            })
            LimitOder.selectTokenSell()
            tokenCatalog.removeFavoriteToken(tokenSymbols[0])
            tokenCatalog.getFavoriteTokens((list) => {
                expect(list).not.to.include.members([tokenSymbols[0]])
            })
        })

        it('Should be added, selected and removed favorite token buy', () => {
            LimitOder.selectTokenBuy().addFavoriteToken([tokenSymbols[0], tokenSymbols[1]])
            tokenCatalog.getFavoriteTokens((list) => {
                expect(list).to.include.members([tokenSymbols[1]])
            })

            tokenCatalog.selectFavoriteToken(tokenSymbols[1])
            LimitOder.getCurrentTokenBuy((text) => {
                expect(text).to.equal(tokenSymbols[1])
            })
            LimitOder.selectTokenBuy()
            tokenCatalog.removeFavoriteToken(tokenSymbols[0])
            tokenCatalog.getFavoriteTokens((list) => {
                expect(list).not.to.include.members([tokenSymbols[0]])
            })
        })
    })

    describe('Select token by symbol', () => {
        it('Should be selected token sell by symbol successfully', () => {
            LimitOder.selectTokenSell().selectTokenBySymbol(tokenSymbols[0])
            LimitOder.getCurrentTokenSell((text) => {
                expect(text).to.equal(tokenSymbols[0])
            })
        })

        it('Should be selected token buy by symbol successfully', () => {
            LimitOder.selectTokenBuy().selectTokenBySymbol(tokenSymbols[1])
            LimitOder.getCurrentTokenBuy((text) => {
                expect(text).to.equal(tokenSymbols[1])
            })
        })

        it('Should be unselected tokenIn not exist in whitelist', () => {
            LimitOder.selectTokenSell().searchToken(UNWHITELIST_SYMBOL_TOKENS[0])
            tokenCatalog.getNoResultsFound((text) => {
                expect(text).to.equal(NORESULTS_TEXT)
            })
        })

        it('Should be unselected tokenOut not exist in whitelist', () => {
            LimitOder.selectTokenBuy().searchToken(UNWHITELIST_SYMBOL_TOKENS[0])
            tokenCatalog.getNoResultsFound((text) => {
                expect(text).to.equal(NORESULTS_TEXT)
            })
        })
    })
})