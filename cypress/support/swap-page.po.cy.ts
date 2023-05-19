export function getText(selector: string, callback: any) {
  const text = cy.get(selector).invoke('text')
  text.then($text => {
    callback($text)
  })
}

export function getTokenList(selector: string, callback: any) {
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
