import {
  CrossChainLocators,
  LimitOrderLocators,
  NetworkLocators,
  SwapPageLocators,
  TokenCatalogLocators,
  WalletLocators,
} from '../selectors/selectors.cy'

export interface myCallbackType<T> {
  (myArgument: T): void
}
export const Header = {
  connectWallet() {
    cy.get(WalletLocators.btnConnectWallet).should('be.visible').click()
    cy.connectWallet()
  },

  getStatusConnectedWallet() {
    cy.get(WalletLocators.statusConnected, { timeout: 10000 }).should('be.visible')
  },
}
