import {
  fantomTokens,
  ethereumTokens,
  polygonTokens,
  bnbTokens,
  avaxTokens,
  cronosTokens,
  arbitrumTokens,
  bttcTokens,
  velasTokens,
  auroraTokens,
  oasisTokens,
  optimismTokens,
  lineaTokens,
  zkSyncTokens,
  zkEvmTokens,
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
  106: {
    name: 'VLX',
    symbol: 'VLX',
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 106,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4747.png',
  },
  1313161554: eth(1313161554),
  42262: {
    name: 'ROSE',
    symbol: 'ROSE',
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 42262,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7653.png',
  },
  10: eth(10),
  59144: eth(59144),
  1101: eth(1101),
  324: eth(324),
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
  106: {
    name: 'Wrapped VLX',
    decimals: 18,
    symbol: 'WVLX',
    address: '0xc579D1f3CF86749E05CD06f7ADe17856c2CE3126',
    chainId: 106,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4747.png',
  },
  1313161554: {
    name: 'Wrapped ETH',
    decimals: 18,
    symbol: 'WETH',
    address: '0xC9BdeEd33CD01541e1eeD10f90519d2C06Fe3feB',
    chainId: 1313161554,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  },
  42262: {
    name: 'Wrapped ROSE',
    decimals: 18,
    symbol: 'WROSE',
    address: '0x21C718C22D52d0F3a789b752D4c2fD5908a8A733',
    chainId: 42262,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7653.png',
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
  106: velasTokens,
  1313161554: auroraTokens,
  42262: oasisTokens,
  10: optimismTokens,
  59144: lineaTokens,
  1101: zkEvmTokens,
  324: zkSyncTokens,
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
  106: '0x1877Ec0770901cc6886FDA7E7525a78c2Ed4e975',
  1313161554: '0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54',
  42262: '0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54',
  10: '0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974',
  59144: '0xcA11bde05977b3631167028862bE2a173976CA11',
  1101: '0xcA11bde05977b3631167028862bE2a173976CA11',
  324: '0xF9cda624FBC7e059355ce98a31693d299FACd963',
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
  106: 'velas',
  1313161554: 'aurora',
  42262: 'oasis',
  10: 'optimism',
  59144: 'linea',
  1101: 'polygon-zkevm',
  324: 'zksync',
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
  106: 'https://evmexplorer.velas.com',
  1313161554: 'https://aurorascan.dev',
  42262: 'https://www.oasisscan.com',
  10: 'https://optimistic.etherscan.io',
  59144: 'https://lineascan.build',
  1101: 'https://zkevm.polygonscan.com',
  324: 'https://explorer.zksync.io',
}

export const SUPPORTED_NETWORKS = Object.keys(SCAN_LINK)
