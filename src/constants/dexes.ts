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
    icon: '',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  oneswap: {
    name: 'OneSwap',
    icon: '',
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
    icon: '',
    chainIds: [ChainId.MATIC]
  },
  wault: {
    name: 'Wault',
    icon: '',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  dmm: {
    name: 'DMM',
    icon: '',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  curve: {
    name: 'Curve',
    icon: '',
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
    icon: '',
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
    icon: '',
    chainIds: [ChainId.BSCMAINNET]
  },
  apeswap: {
    name: 'ApeSwap',
    icon: '',
    chainIds: [ChainId.BSCMAINNET]
  },
  ellipsis: {
    name: 'Ellipsis',
    icon: '',
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
