import {
  fantomTokens,
  ethereumTokens,
  polygonTokens,
  bnbTokens,
  avaxTokens,
  cronosTokens,
  arbitrumTokens,
  bttcTokens,
  optimismTokens,
  lineaTokens,
  zkSyncTokens,
  zkEvmTokens,
  baseTokens,
  blastTokens,
  mantleTokens,
  beraTokens,
  sonicTokens,
} from './tokens'

export enum ZIndex {
  UNDERLAYER = -1,
  OVERLAY = 100,
  DIALOG = 1000,
  TOOLTIP = 2000,
}

export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export interface TokenInfo {
  name: string
  symbol: string
  address: string
  decimals: number
  logoURI: string
  chainId: number
  isImport?: boolean
}

const eth = (chainId: number) => ({
  name: 'Ether',
  decimals: 18,
  symbol: 'ETH',
  address: NATIVE_TOKEN_ADDRESS,
  chainId: chainId,
  logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
})

export const NATIVE_TOKEN: {
  [chainId: number]: TokenInfo
} = {
  1: eth(1),
  137: {
    name: 'Matic',
    symbol: 'MATIC',
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 137,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
  },
  56: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 56,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
  },
  43114: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 43114,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
  },
  250: {
    name: 'Fantom',
    symbol: 'FTM',
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 250,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3513.png',
  },
  25: {
    name: 'Cronos',
    symbol: 'CRO',
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 25,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3635.png',
  },
  42161: eth(42161),
  199: {
    name: 'BTT',
    symbol: 'BTT',
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 199,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/16086.png',
  },
  10: eth(10),
  59144: eth(59144),
  1101: eth(1101),
  324: eth(324),
  8453: eth(8453),
  81457: eth(81457), // Blast
  5000: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 5000,
    logoURI: 'https://storage.googleapis.com/ks-setting-1d682dca/2bccd96f-b100-4ca1-858e-d8353ab0d0861710387147471.png',
  },
  80094: {
    name: 'BERA',
    symbol: 'BERA',
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 80094,
    logoURI: 'https://storage.googleapis.com/ks-setting-1d682dca/68e11813-067b-42d7-8d7a-c1b7bf80714e1739239376230.png',
  },
  146: {
    name: 'Sonic',
    symbol: 'S',
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 146,
    logoURI: 'https://www.soniclabs.com/favicon.ico',
  },
}

export const WRAPPED_NATIVE_TOKEN: {
  [chainId: number]: TokenInfo
} = {
  1: {
    name: 'Wrapped Ether',
    decimals: 18,
    symbol: 'WETH',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    chainId: 1,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  },
  137: {
    name: 'Wrapped Matic',
    decimals: 18,
    symbol: 'WMATIC',
    address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    chainId: 137,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
  },
  56: {
    name: 'Wrapped BNB',
    decimals: 18,
    symbol: 'WBNB',
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    chainId: 56,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
  },
  43114: {
    name: 'Wrapped AVAX',
    decimals: 18,
    symbol: 'WAVAX',
    address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    chainId: 43114,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
  },
  250: {
    name: 'Wrapped Fantom',
    decimals: 18,
    symbol: 'WFTM',
    address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    chainId: 250,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3513.png',
  },
  25: {
    name: 'Wrapped CRO',
    decimals: 18,
    symbol: 'WCRO',
    address: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',
    chainId: 25,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3635.png',
  },
  42161: {
    name: 'Wrapped Ether',
    decimals: 18,
    symbol: 'WETH',
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    chainId: 42161,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  },
  199: {
    name: 'Wrapped BitTorrent',
    decimals: 18,
    symbol: 'WBTT',
    address: '0x8D193c6efa90BCFf940A98785d1Ce9D093d3DC8A',
    chainId: 199,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/16086.png',
  },
  10: {
    name: 'Wrapped Ether',
    decimals: 18,
    symbol: 'WETH',
    address: '0x4200000000000000000000000000000000000006',
    chainId: 10,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  },
  59144: {
    name: 'Wrapped Ether',
    decimals: 18,
    symbol: 'WETH',
    address: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
    chainId: 59144,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  },
  1101: {
    name: 'Wrapped Ether',
    decimals: 18,
    symbol: 'WETH',
    address: '0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9',
    chainId: 1101,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  },
  324: {
    name: 'Wrapped Ether',
    decimals: 18,
    symbol: 'WETH',
    address: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',
    chainId: 324,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  },
  8453: {
    name: 'Wrapped Ether',
    decimals: 18,
    symbol: 'WETH',
    address: '0x4200000000000000000000000000000000000006',
    chainId: 8453,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  },
  81457: {
    name: 'Wrapped Ether',
    decimals: 18,
    symbol: 'WETH',
    address: '0x4300000000000000000000000000000000000004',
    chainId: 81457,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  },
  5000: {
    name: 'Wrapped MNT',
    decimals: 18,
    symbol: 'WMNT',
    address: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
    chainId: 5000,
    logoURI: 'https://storage.googleapis.com/ks-setting-1d682dca/2bccd96f-b100-4ca1-858e-d8353ab0d0861710387147471.png',
  },
  80094: {
    name: 'Wrapped BERA',
    decimals: 18,
    symbol: 'WBERA',
    address: '0x6969696969696969696969696969696969696969',
    chainId: 80094,
    logoURI: 'https://berascan.com/token/images/wrappedbera_ofc_64.png',
  },
  146: {
    name: 'Wrapped S',
    decimals: 18,
    symbol: 'wS',
    address: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38',
    chainId: 146,
    logoURI: 'https://sonicscan.org/token/images/wrappedsonic_32.svg',
  },
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const DEFAULT_TOKENS: {
  [chainId: number]: TokenInfo[]
} = {
  1: ethereumTokens,
  137: polygonTokens,
  56: bnbTokens,
  43114: avaxTokens,
  250: fantomTokens,
  25: cronosTokens,
  42161: arbitrumTokens,
  199: bttcTokens,
  10: optimismTokens,
  59144: lineaTokens,
  1101: zkEvmTokens,
  324: zkSyncTokens,
  8453: baseTokens,
  81457: blastTokens,
  5000: mantleTokens,
  80094: beraTokens,
  146: sonicTokens,
}

export const MULTICALL_ADDRESS: { [chainId: number]: string } = {
  1: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
  137: '0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4',
  56: '0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4',
  43114: '0xF2FD8219609E28C61A998cc534681f95D2740f61',
  250: '0x878dFE971d44e9122048308301F540910Bbd934c',
  25: '0x63Abb9973506189dC3741f61d25d4ed508151E6d',
  42161: '0x80C7DD17B01855a6D2347444a0FCC36136a314de',
  199: '0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54',
  10: '0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974',
  59144: '0xcA11bde05977b3631167028862bE2a173976CA11',
  1101: '0xcA11bde05977b3631167028862bE2a173976CA11',
  324: '0xF9cda624FBC7e059355ce98a31693d299FACd963',
  8453: '0xcA11bde05977b3631167028862bE2a173976CA11',
  81457: '0xcA11bde05977b3631167028862bE2a173976CA11',
  5000: '0xcA11bde05977b3631167028862bE2a173976CA11',
  80094: '0xcA11bde05977b3631167028862bE2a173976CA11',
  146: '0xcA11bde05977b3631167028862bE2a173976CA11',
}

export const AGGREGATOR_PATH: { [chainId: number]: string } = {
  1: 'ethereum',
  137: 'polygon',
  56: 'bsc',
  43114: 'avalanche',
  250: 'fantom',
  25: 'cronos',
  42161: 'arbitrum',
  199: 'bttc',
  10: 'optimism',
  59144: 'linea',
  1101: 'polygon-zkevm',
  324: 'zksync',
  8453: 'base',
  81457: 'blast',
  5000: 'mantle',
  80094: 'berachain',
  146: 'sonic',
}

export const SCAN_LINK: { [chainId: number]: string } = {
  1: 'https://etherscan.io',
  137: 'https://polygonscan.com',
  56: 'https://bscscan.com',
  43114: 'https://snowtrace.io',
  250: 'https://ftmscan.com',
  25: 'https://cronoscan.com',
  42161: 'https://arbiscan.io',
  199: 'https://bttcscan.com',
  10: 'https://optimistic.etherscan.io',
  59144: 'https://lineascan.build',
  1101: 'https://zkevm.polygonscan.com',
  324: 'https://explorer.zksync.io',
  8453: 'https://basescan.org',
  81457: 'https://blastscan.io',
  5000: 'https://explorer.mantle.xyz',
  80094: 'https://berascan.com',
  146: 'https://sonicscan.org',
}

export const DefaultRpcUrl: { [chainId: number]: string } = {
  1: 'https://ethereum.kyberengineering.io',
  137: 'https://polygon-rpc.com',
  56: 'https://bsc.kyberengineering.io',
  43114: 'https://avalanche.kyberengineering.io',
  250: 'https://rpc.fantom.network',
  25: '', // cronos deprecated
  42161: 'https://arbitrum.kyberengineering.io',
  199: '', // deprecated bttc
  10: 'https://optimism.kyberengineering.io',
  59144: 'https://rpc.linea.build',
  1101: 'https://zkevm-rpc.com',
  324: 'https://mainnet.era.zksync.io',
  8453: 'https://base.kyberengineering.io',
  81457: 'https://rpc.blast.io',
  5000: 'https://rpc.mantle.xyz',
  80094: 'https://rpc.berachain.com',
  146: 'https://rpc.soniclabs.com',
}

export const SUPPORTED_NETWORKS = Object.keys(SCAN_LINK)
