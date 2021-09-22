import { ChainId } from 'libs/sdk/src'

export type DexConfig = {
  name: string
  icon: string
  chainIds?: ChainId[]
}

type DexList = { [key: string]: DexConfig }

export const dexListConfig: DexList = {
  firebird: {
    name: 'Firebird',
    icon: 'https://app.firebird.finance/favicon.png',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  'firebird-oneswap': {
    name: 'Firebird OneSwap',
    icon: 'https://app.firebird.finance/favicon.png',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  sushiswap: {
    name: 'SushiSwap',
    icon: '',
    chainIds: [ChainId.MATIC]
  },
  quickswap: {
    name: 'QuickSwap',
    icon: '',
    chainIds: [ChainId.MATIC]
  },
  dfyn: {
    name: 'Dfyn',
    icon:
      'https://raw.githubusercontent.com/firebird-finance/firebird-assets/master/blockchains/polygon/assets/0xC168E40227E4ebD8C1caE80F7a55a4F0e6D66C97/logo.png',
    chainIds: [ChainId.MATIC]
  },
  wault: {
    name: 'Wault',
    icon:
      'https://raw.githubusercontent.com/firebird-finance/firebird-assets/master/blockchains/smartchain/assets/0xB64E638E60D154B43f660a6BF8fD8a3b249a6a21/logo.png',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  dmm: {
    name: 'DMM',
    icon:
      'https://raw.githubusercontent.com/firebird-finance/firebird-assets/master/blockchains/polygon/assets/0x1C954E8fe737F99f68Fa1CCda3e51ebDB291948C/logo.png',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  curve: {
    name: 'Curve',
    icon:
      'https://raw.githubusercontent.com/firebird-finance/firebird-assets/master/blockchains/polygon/assets/0x172370d5Cd63279eFa6d502DAB29171933a610AF/logo.png',
    chainIds: [ChainId.MATIC]
  },
  jetswap: {
    name: 'JetSwap',
    icon: '',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  'iron-stable': {
    name: 'IronSwap',
    icon: '',
    chainIds: [ChainId.MATIC]
  },
  polydex: {
    name: 'PolyDex',
    icon:
      'https://raw.githubusercontent.com/firebird-finance/firebird-assets/master/blockchains/polygon/assets/0x7A5dc8A09c831251026302C93A778748dd48b4DF/logo.png',
    chainIds: [ChainId.MATIC]
  },
  polycat: {
    name: 'Polycat',
    icon: '',
    chainIds: [ChainId.MATIC]
  },
  pancake: {
    name: 'PancakeSwap',
    icon: '',
    chainIds: [ChainId.BSCMAINNET]
  },
  mdex: {
    name: 'Mdex',
    icon: '',
    chainIds: [ChainId.BSCMAINNET]
  },
  biswap: {
    name: 'Biswap',
    icon:
      'https://raw.githubusercontent.com/firebird-finance/firebird-assets/master/blockchains/smartchain/assets/0x965F527D9159dCe6288a2219DB51fc6Eef120dD1/logo.png',
    chainIds: [ChainId.BSCMAINNET]
  },
  apeswap: {
    name: 'ApeSwap',
    icon: '',
    chainIds: [ChainId.BSCMAINNET]
  },
  ellipsis: {
    name: 'Ellipsis',
    icon:
      'https://raw.githubusercontent.com/firebird-finance/firebird-assets/master/blockchains/smartchain/assets/0xA7f552078dcC247C2684336020c03648500C6d9F/logo.png',
    chainIds: [ChainId.BSCMAINNET]
  },
  nerve: {
    name: 'Nerve',
    icon: '',
    chainIds: [ChainId.BSCMAINNET]
  }
}

type DexTypes = {
  [chainId in ChainId]?: {
    [dex: string]: 0 | 1 | 2 | 3 | 4 | 5 | 6
  }
}
/*
// dex id - swap fee
0 - custom per pair
1 - 30 (default) = 0.3%
2 - 25
3 - 20
4 - 15
5 - 10
6 - 5
*/
export const dexIds: DexTypes = {
  [ChainId.BSCMAINNET]: {
    firebird: 0,
    pancake: 2,
    apeswap: 3,
    wault: 3,
    biswap: 5
  },
  [ChainId.MATIC]: {
    firebird: 0,
    polydex: 5,
    wault: 3,
    jetswap: 5,
    polycat: 2
  }
}

export const dexTypes: DexTypes = {
  [ChainId.BSCMAINNET]: {
    'firebird-oneswap': 1,
    curve: 2,
    ellipsis: 2,
    nerve: 1,
    dmm: 3
  },
  [ChainId.MATIC]: {
    'firebird-oneswap': 1,
    curve: 2,
    dmm: 3,
    'iron-stable': 4
  }
}
