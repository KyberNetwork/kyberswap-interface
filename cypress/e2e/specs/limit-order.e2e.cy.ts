import { LimitOder } from '../pages/limit-order.po.cy'
import { SwapPage } from '../pages/swap-page.po.cy'
import { DEFAULT_URL, NETWORK, TAG, TOKEN_SYMBOLS } from '../selectors/constants.cy'

const tokenSymbols = TOKEN_SYMBOLS[NETWORK]

describe(`Limit Order on ${NETWORK}`, { tags: TAG.smoke }, () => {
  before(() => {
    SwapPage.open(DEFAULT_URL)
    SwapPage.connectWallet()
    cy.acceptMetamaskAccess()
    cy.changeMetamaskNetwork(NETWORK)

    SwapPage.goToLimitOrder()
    LimitOder.clickGetStarted()
  })

  it('able to select sell token', () => {
    LimitOder.selectTokenSell().selectTokenBySymbol(tokenSymbols[4])
    LimitOder.getCurrentTokenSell(text => {
      expect(text).to.equal(tokenSymbols[4])
    })
  })

  it('able to select buy token', () => {
    LimitOder.selectTokenBuy().selectTokenBySymbol(tokenSymbols[3])
    LimitOder.getCurrentTokenBuy(text => {
      expect(text).to.equal(tokenSymbols[3])
    })
  })

  it('able to set selling rate by number', () => {
    LimitOder.setSellingRate('1.2345..67')
    LimitOder.getSellingRate().then(value => {
      cy.wrap(value).should('eq', '1.234567')
    })
  })

  it('able to set sell amount', () => {
    LimitOder.selectTokenSell().selectTokenBySymbol(tokenSymbols[4])
    LimitOder.setSellAmount('100')
    LimitOder.getSellAmount().should('eq', '100')
  })

  it('able to set buy amount', () => {
    LimitOder.selectTokenBuy().selectTokenBySymbol(tokenSymbols[4])
    LimitOder.setBuyAmount('100')
    LimitOder.getBuyAmount().should('eq', '100')
  })

  it('verify error message when insufficient balance', () => {
    LimitOder.getBalanceIn(text => {
      LimitOder.setSellAmount(String(Number(text) + 1))
      LimitOder.getInsufficientErrorMessage().should('be.visible')
    })
  })
})
