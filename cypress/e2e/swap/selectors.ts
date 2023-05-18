export const token = {
  tokenIn: '#swap-currency-input .token-symbol-container',
  tokenOut: '#swap-currency-output .token-symbol-container',
  inputToken: '#token-search-input',
  favoriteToken: '.favorite-token',
  iconRemoveToken: '.close-btn',
  rowInWhiteList: '.token-item',
  iconFavorite: '.button-favorite-token',
  iconDelete: '.button-remove-import-token',
  btnImport: '.button-import-token',
  btnUnderstand: '.button-confirm-import-token',
  clearAll: '.button-clear-all-import-token',

  /* favoriteToken: '.sc-iOeugr .sc-iMSIvx',
  iconRemoveToken: '.close-btn',
  rowInWhiteList: '.ddXQwm',
  iconFavorite: '.sc-lkkFJn',
  iconDelete: '.sc-jwKbUx',
  btnImport: '.sc-cTVMo .sc-gswNZR',
  btnUnderstand: '.sc-erbdlo button',
  clearAll: '.sc-iOeugr .sc-bgzEgf', */
}

export const homePage = {
  welcome: '.button-skip-tutorial',
}

export const notification = {
  notFound: 'no-token-result',
}

export const tab = {
  allTab: '.tab-all',
  import: 'tab-import',
}

export function getText(selector: string, callback: any) {
  const text = cy.get(selector).invoke('text')
  text.then($text => {
    callback($text)
  })
}

export function getList(selector: string, callback: any) {
  let arr: string[] = []
  const len = cy.get(selector).its('length')
  len.then($len => {
    const listToken = cy.get(selector)
    listToken.then($listToken => {
      for (let i = 0; i < $len; i++) {
        arr.push($listToken.eq(i).text())
      }
      callback(arr)
    })
  })
}
