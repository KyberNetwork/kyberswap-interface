export const TokenCatalogSelectors = {
  dropdownTokenIn: '[data-testid=swap-currency-input] [data-testid=token-symbol-container]',
  dropdownTokenOut: '[data-testid=swap-currency-output] [data-testid=token-symbol-container]',
  txtToken: '[data-testid=token-search-input]',
  lblFavoriteToken: '[data-testid=favorite-token]',
  lblRowInWhiteList: '[data-testid=token-item]',
  lblNotFound: '[data-testid=no-token-result]',
  iconFavorite: '[data-testid=button-favorite-token]',
  iconRemoveImportedToken: '[data-testid=button-remove-import-token]',
  iconRemoveFavoriteToken: '[data-testid=close-btn]',
  btnImport: '[data-testid=button-import-token]',
  btnUnderstand: '[data-testid=button-confirm-import-token]',
  btnClearAll: '[data-testid=button-clear-all-import-token]',
  btnAllTab: '[data-testid=tab-all]',
  btnImportTab: '[data-testid=tab-import]'
}

export const SwapPageSelectors = {
  dropdownTokenIn: '[data-testid=swap-currency-input] [data-testid=token-symbol-container]',
  dropdownTokenOut: '[data-testid=swap-currency-output] [data-testid=token-symbol-container]',
  btnSkipTutorial: '[data-testid=button-skip-tutorial]',
}

export const WalletSelectors = {
  btnConnectWallet: '[data-testid=button-connect-wallet]',
  btnMetaMask: '[data-testid=connect-METAMASK]',
  chkAcceptTerm: '[data-testid=accept-term]',
  statusConnected: '[data-testid=web3-status-connected]',
}

export const NetworkSelectors = {
  btnSelectNetwork: '[data-testid=select-network]',
  btnNetwork: '[data-testid=network-button]',
}

export const HeaderSelectors = {
  dropdownEarn: '[data-testid=earn-menu]',
  lblPools: '[data-testid=pools-nav-link]',
  lblMyPools: '[data-testid=my-pools-nav-link]',
  lblFarms: '[data-testid=farms-nav-link]',
}
