export enum tag {
  smoke = 'smoke',
  regression = 'regression',
}

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

export const UNWHITE_LIST_TOKENS = {
  "bnb":
  [
    {
      name: 'TUSD',
      address: '0x40af3827f39d0eacbf4a168f8d4ee67c121d11c9',
    },
    {
      name: 'ARA',
      address: '0x5542958fa9bd89c96cb86d1a6cb7a3e644a3d46e',
    },
    {
      name: 'FLASH',
      address: '0xc3111096b3b46873393055dea14036ea603cfa95',
    }
  ],
  "arbitrum": [
     {
      name: 'OHM',
      address: '0xf0cb2dc0db5e6c66b9a70ac27b06b878da017028',
    },
    {
      name: 'GBL',
      address: '0xe9a264e9d45ff72e1b4a85d77643cdbd4c950207',
    },
    {
      name: 'Y2K',
      address: '0x65c936f008bc34fe819bce9fa5afd9dc2d49977f',
    },
  ]

}

