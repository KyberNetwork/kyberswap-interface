import { ChainId } from 'libs/sdk/src'

export type DexConfig = {
  value?: string
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
  oneswap: {
    name: 'OneSwap',
    icon: 'https://app.firebird.finance/favicon.png',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  sushiswap: {
    name: 'SushiSwap',
    icon: 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
    chainIds: [ChainId.MATIC]
  },
  quickswap: {
    name: 'QuickSwap',
    icon: 'https://assets.coingecko.com/coins/images/13970/small/1_pOU6pBMEmiL-ZJVb0CYRjQ.png',
    chainIds: [ChainId.MATIC]
  },
  dfyn: {
    name: 'Dfyn',
    icon: 'https://assets.coingecko.com/markets/images/674/small/dyfn.png',
    chainIds: [ChainId.MATIC]
  },
  wault: {
    name: 'Wault',
    icon: 'https://assets.coingecko.com/coins/images/14991/small/wault_finance_logo.png',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  dmm: {
    name: 'DMM',
    icon: 'https://dmm.exchange/favicon.png',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  curve: {
    name: 'Curve',
    icon: 'https://assets.coingecko.com/coins/images/12124/small/Curve.png',
    chainIds: [ChainId.MATIC]
  },
  jetswap: {
    name: 'JetSwap',
    icon: 'https://jetswap.finance/favicon_io/favicon.ico',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  'iron-stable': {
    name: 'IronSwap',
    icon: 'https://assets.coingecko.com/coins/images/17024/small/ice_logo.jpg',
    chainIds: [ChainId.MATIC]
  },
  polydex: {
    name: 'PolyDex',
    icon: 'https://www.polydex.fi/favicon.ico',
    chainIds: [ChainId.MATIC]
  },
  polycat: {
    name: 'Polycat',
    icon: 'https://assets.coingecko.com/coins/images/15226/small/smallLogo.png',
    chainIds: [ChainId.MATIC]
  },
  pancake: {
    name: 'PancakeSwap',
    icon: 'https://assets.coingecko.com/markets/images/687/small/pancakeswap.jpeg',
    chainIds: [ChainId.BSCMAINNET]
  },
  mdex: {
    name: 'Mdex',
    icon: 'https://assets.coingecko.com/coins/images/13775/small/mdex.png',
    chainIds: [ChainId.BSCMAINNET]
  },
  biswap: {
    name: 'Biswap',
    icon: 'https://assets.coingecko.com/coins/images/16845/small/biswap.png',
    chainIds: [ChainId.BSCMAINNET]
  },
  apeswap: {
    name: 'ApeSwap',
    icon: 'https://assets.coingecko.com/coins/images/14870/thumb/apeswap_logo.png',
    chainIds: [ChainId.BSCMAINNET]
  },
  ellipsis: {
    name: 'Ellipsis',
    icon: 'https://assets.coingecko.com/coins/images/14498/small/ellipsis.png',
    chainIds: [ChainId.BSCMAINNET]
  },
  nerve: {
    name: 'Nerve',
    icon: 'https://assets.coingecko.com/coins/images/14233/small/nerve_finance_logo.png',
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
1 - 30 (default) = 0.3%
2 - 25
3 - 20
4 - 15
5 - 10
6 - 5
*/
export const dexIds: DexTypes = {
  [ChainId.BSCMAINNET]: {
    firebird: 1,
    pancake: 2,
    apeswap: 3,
    wault: 3,
    biswap: 5
  },
  [ChainId.MATIC]: {
    firebird: 1,
    polydex: 5,
    wault: 3,
    jetswap: 5,
    polycat: 2
  }
}

export const dexTypes: DexTypes = {
  [ChainId.BSCMAINNET]: {
    oneswap: 1,
    curve: 2,
    ellipsis: 2,
    nerve: 1,
    dmm: 3
  },
  [ChainId.MATIC]: {
    oneswap: 1,
    curve: 2,
    dmm: 3,
    'iron-stable': 4
  }
}

function findDex(exchange: string): DexConfig | undefined {
  const dex = dexListConfig[exchange]
  return dex ? { ...dex, value: exchange } : undefined
}

export const DEX_TO_COMPARE: { [chainId in ChainId]?: DexConfig } = {
  [ChainId.BSCMAINNET]: findDex('pancake'),
  [ChainId.MATIC]: findDex('quickswap')
}
