import { ChainId } from '@namgold/ks-sdk-core'

export const DEX_TO_COMPARE: { [chainId in ChainId]: string | undefined } = {
  [ChainId.MAINNET]: 'uniswapv3',
  [ChainId.BSCMAINNET]: 'pancake',
  [ChainId.MATIC]: 'quickswap',
  [ChainId.AVAXMAINNET]: 'traderjoe',
  [ChainId.FANTOM]: 'spookyswap',
  [ChainId.CRONOS]: 'vvs',
  [ChainId.AURORA]: 'trisolaris',
  [ChainId.ARBITRUM]: 'sushiswap',
  [ChainId.VELAS]: 'wagyuswap',
  [ChainId.OASIS]: 'valleyswap-v2',
  [ChainId.OPTIMISM]: 'uniswapv3',

  [ChainId.BTTC]: undefined,
  [ChainId.SOLANA]: undefined,

  [ChainId.ROPSTEN]: undefined,
  [ChainId.RINKEBY]: undefined,
  [ChainId.GÖRLI]: undefined,
  [ChainId.KOVAN]: undefined,
  [ChainId.BSCTESTNET]: undefined,
  [ChainId.MUMBAI]: undefined,
  [ChainId.AVAXTESTNET]: undefined,
  [ChainId.CRONOSTESTNET]: undefined,
  [ChainId.ARBITRUM_TESTNET]: undefined,
  [ChainId.ETHW]: undefined,
}

export const kyberswapDexes = [
  {
    name: 'KyberSwap Elastic',
    id: 'kyberswapv2',
    logoURL: 'https://kyberswap.com/favicon.ico',
  },
  {
    name: 'KyberSwap Classic',
    id: 'kyberswapv1',
    logoURL: 'https://kyberswap.com/favicon.ico',
  },
]
