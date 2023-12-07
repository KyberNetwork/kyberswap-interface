import { Network, SwapPage, TokenCatalog } from '../pages/swap-page.po.cy'
import {
    DEFAULT_NETWORK,
    DEFAULT_URL,
    NETWORK,
    NORESULTS_TEXT,
    TAG,
    TOKEN_SYMBOLS,
    UNWHITELIST_SYMBOL_TOKENS,
    UNWHITELIST_TOKENS,
} from '../selectors/constants.cy'

import { LimitOder } from "../pages/limit-order.po.cy"
import { CrossChain } from "../pages/cross-chain.po.cy"

const unWhitelistTokens = UNWHITELIST_TOKENS[NETWORK]
const tokenSymbols = TOKEN_SYMBOLS[NETWORK]

const arrAddress = [unWhitelistTokens[0].address, unWhitelistTokens[1].address, unWhitelistTokens[2].address]
const arrSymbol = [unWhitelistTokens[0].symbol, unWhitelistTokens[1].symbol, unWhitelistTokens[2].symbol]

const tokenCatalog = new TokenCatalog()
const network = new Network()

describe(`Token Catalog on ${NETWORK}`, { tags: TAG.regression }, () => {
    before(() => {
        SwapPage.open(DEFAULT_URL)
        SwapPage.connectWallet()
        SwapPage.getStatusConnectedWallet()
    })

    after(() => {
        //Verify that Metamask is disconnected
        cy.disconnectMetamaskWalletFromDapp()
        cy.contains('Connect').should('be.visible');
    })

    describe('Select token in favorite tokens list', () => {
        it('Should be selected tokenIn in favorite tokens list successfully', () => {
            SwapPage.selectTokenIn().getFavoriteTokens(arr => {
                tokenCatalog.selectFavoriteToken(arr[1])
                SwapPage.getCurrentTokenIn(text => {
                    expect(text).to.equal(arr[1])
                })
            })
        })

        it('Should be selected tokenOut in favorite tokens list successfully', () => {
            SwapPage.selectTokenOut().getFavoriteTokens(arr => {
                tokenCatalog.selectFavoriteToken(arr[0])
                SwapPage.getCurrentTokenOut(text => {
                    expect(text).to.equal(arr[0])
                })
            })
        })
    })

    describe('Remove/add token with favorite tokens list', () => {
        afterEach(() => {
            tokenCatalog.closePopup()
        })
        it('Should be removed tokenIn from favorite tokens list', () => {
            SwapPage.selectTokenIn().getFavoriteTokens(arr => {
                tokenCatalog.removeFavoriteToken(arr[1])
                cy.wait(2000)
                tokenCatalog.getFavoriteTokens(list => {
                    expect(list).not.to.include.members([arr[1]])
                })
            })
        })

        it('Should be added tokenIn to favorite tokens list', () => {
            SwapPage.selectTokenIn().addFavoriteToken([tokenSymbols[0]])
            tokenCatalog.getFavoriteTokens(list => {
                expect(list).to.include.members([tokenSymbols[0]])
            })
        })

        it('Should be removed tokenOut from favorite tokens list', () => {
            SwapPage.selectTokenOut().getFavoriteTokens(arr => {
                tokenCatalog.removeFavoriteToken(arr[2])
                cy.wait(2000)
                tokenCatalog.getFavoriteTokens(list => {
                    expect(list).not.to.include.members([arr[2]])
                })
            })
        })

        it('Should be added tokenOut to favorite tokens list', () => {
            SwapPage.selectTokenOut().addFavoriteToken([tokenSymbols[4]])
            tokenCatalog.getFavoriteTokens(list => {
                expect(list).to.include.members([tokenSymbols[4]])
            })
        })
    })

    describe('Select token by symbol', () => {
        it('Should be selected tokenIn by symbol successfully', () => {
            SwapPage.selectTokenIn().selectTokenBySymbol(tokenSymbols[0])
            SwapPage.getCurrentTokenIn(text => {
                expect(text).to.equal(tokenSymbols[0])
            })
        })

        it('Should be selected tokenOut by symbol successfully', () => {
            SwapPage.selectTokenOut().selectTokenBySymbol(tokenSymbols[1])
            SwapPage.getCurrentTokenOut(text => {
                expect(text).to.equal(tokenSymbols[1])
            })
        })

        it('Should be unselected tokenIn not exist in whitelist', () => {
            SwapPage.selectTokenIn().searchToken(UNWHITELIST_SYMBOL_TOKENS[0])
            tokenCatalog.getNoResultsFound(text => {
                expect(text).to.equal(NORESULTS_TEXT)
            })
            tokenCatalog.closePopup()
        })

        it('Should be unselected tokenOut not exist in whitelist', () => {
            SwapPage.selectTokenOut().searchToken(UNWHITELIST_SYMBOL_TOKENS[0])
            tokenCatalog.getNoResultsFound(text => {
                expect(text).to.equal(NORESULTS_TEXT)
            })
            tokenCatalog.closePopup()
        })
    })

    describe('Import and delete token', () => {
        it('Should be imported then deleted tokenIn successfully', () => {
            tokenCatalog.importNewTokens(arrAddress)
            SwapPage.selectTokenIn().selectImportTab()
            tokenCatalog.getWhitelistTokens(list => {
                expect(list).to.include.members(arrSymbol)
            })

            tokenCatalog.deleteImportedToken(arrSymbol[2])
            tokenCatalog.getWhitelistTokens(list => {
                expect(list).not.to.include.members([arrSymbol[2]])
            })

            tokenCatalog.clearAllImportedTokens()
            tokenCatalog.getNoResultsFound(text => {
                expect(text).to.equal(NORESULTS_TEXT)
            })
            tokenCatalog.closePopup()
        })

        it('Should be imported then deleted tokenOut successfully', () => {
            tokenCatalog.importNewTokens(arrAddress)
            SwapPage.selectTokenOut().selectImportTab()
            tokenCatalog.getWhitelistTokens(list => {
                expect(list).to.include.members(arrSymbol)
            })

            tokenCatalog.deleteImportedToken(arrSymbol[1])
            tokenCatalog.getWhitelistTokens(list => {
                expect(list).not.to.include.members([arrSymbol[1]])
            })

            tokenCatalog.clearAllImportedTokens()
            tokenCatalog.getNoResultsFound(text => {
                expect(text).to.equal(NORESULTS_TEXT)
            })
            tokenCatalog.closePopup()
        })
    })
})

describe('E2E Smoke', { tags: TAG.smoke }, () => {
    before(() => {
        SwapPage.open(DEFAULT_URL)
        SwapPage.connectWallet()
        cy.acceptMetamaskAccess()
        SwapPage.getStatusConnectedWallet()

        if (NETWORK !== DEFAULT_NETWORK) {
            network.selectNetwork(NETWORK)
            cy.allowMetamaskToAddAndSwitchNetwork().then(approved => {
                expect(approved).to.be.true
            })
        }
    })
    it('Swap > Limit Order > Cross-Chain', () => {
        tokenCatalog.importNewTokens([arrAddress[2]])
        SwapPage.getCurrentTokenIn(text => {
            expect(text).to.equal(arrSymbol[2])
        })

        SwapPage.selectTokenOut().getFavoriteTokens(arr => {
            tokenCatalog.selectFavoriteToken(arr[0])
            SwapPage.getCurrentTokenOut(text => {
                expect(text).to.equal(arr[0])
            })
        })

        SwapPage.goToLimitOrder()
        LimitOder.checkGetStartedDisplay().then((checked) => {
            if (checked === true) {
                LimitOder.clickGetStarted()
            }
        })
        LimitOder.selectTokenSell().selectTokenBySymbol(tokenSymbols[0])
        LimitOder.getCurrentTokenSell((text) => {
            expect(text).to.equal(tokenSymbols[0])
        })

        LimitOder.selectTokenBuy().addFavoriteToken([tokenSymbols[0]])
        tokenCatalog.getFavoriteTokens((list) => {
            expect(list).to.include.members([tokenSymbols[0]])
        })

        tokenCatalog.selectFavoriteToken(tokenSymbols[0])
        LimitOder.getCurrentTokenBuy((text) => {
            expect(text).to.equal(tokenSymbols[0])
        })

        SwapPage.goToCrossChain()
        cy.wait(2000)
        CrossChain.closeUnderstandPopup()
        CrossChain.selectTokenIn().selectTokenBySymbol(tokenSymbols[0])
        CrossChain.getCurrentTokenIn((text) => {
            expect(text).to.equal(tokenSymbols[0])
        })

        CrossChain.getCurrentNetworkOut().then((currentNetworkOut) => {
            CrossChain.selectTokenOut().selectTokenBySymbol(TOKEN_SYMBOLS[currentNetworkOut][1])
            CrossChain.getCurrentTokenOut((text) => {
                expect(text).to.equal(TOKEN_SYMBOLS[currentNetworkOut][1])
            })
        })

    })

})
