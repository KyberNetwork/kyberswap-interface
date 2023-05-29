export function getText(selector: string, callback: any) {
  const text = cy.get(selector).invoke('text')
  text.then($text => {
    callback($text)
  })
}

export function getTokenList(selector: string, callback: any) {
  let arr: string[] = []
  const listToken = cy.get(selector)
  listToken
    .each(item => {
      arr.push(item.text())
    })
    .then(() => {
      callback(arr)
    })
}
