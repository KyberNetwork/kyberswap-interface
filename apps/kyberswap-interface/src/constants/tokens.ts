import { ChainId, NativeCurrency, Token, WETH } from '@kyberswap/ks-sdk-core'

import { CHAINS_SUPPORT_FEE_CONFIGS, ETHER_ADDRESS } from 'constants/index'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'

const NativeCurrenciesLocal: { [chainId in ChainId]: NativeCurrency } = SUPPORTED_NETWORKS.reduce(
  (acc, chainId) => ({
    ...acc,
    [chainId]: new NativeCurrency(
      chainId,
      NETWORKS_INFO[chainId].nativeToken.decimal,
      NETWORKS_INFO[chainId].nativeToken.symbol,
      NETWORKS_INFO[chainId].nativeToken.name,
    ),
  }),
  {},
) as { [chainId in ChainId]: NativeCurrency }

//this Proxy helps fallback undefined ChainId by Ethereum info
export const NativeCurrencies = new Proxy(NativeCurrenciesLocal, {
  get(target, p) {
    const prop = p as any as ChainId
    if (p && target[prop]) return target[prop]
    return target[ChainId.MAINNET]
  },
})

// This list is intentionally different from the list above
// Was requested from product team, to implement Swap fee config
export const STABLE_COIN_ADDRESSES_TO_TAKE_FEE: Record<ChainId, string[]> = {
  [ChainId.ZKSYNC]: [],
  [ChainId.MATIC]: [],
  [ChainId.OPTIMISM]: [],
  [ChainId.GÖRLI]: [],
  [ChainId.MAINNET]: [],
  [ChainId.AVAXMAINNET]: [],
  [ChainId.FANTOM]: [],
  [ChainId.BSCMAINNET]: [],
  [ChainId.ARBITRUM]: [],
  [ChainId.LINEA]: [],
  [ChainId.BASE]: [],
  [ChainId.SCROLL]: [],
  [ChainId.BLAST]: [],
  [ChainId.MANTLE]: [],
  [ChainId.SONIC]: [],
  [ChainId.BERA]: [],
  [ChainId.RONIN]: [],
  [ChainId.UNICHAIN]: [],
  [ChainId.HYPEREVM]: [],
  [ChainId.ETHERLINK]: [],
  [ChainId.PLASMA]: [],
  [ChainId.MONAD]: [],
  [ChainId.MEGAETH]: [],
  [ChainId.ROBINHOOD]: [],
}

// This is basically the same as STABLE_COIN_ADDRESSES_TO_TAKE_FEE,
// but with native token address and wrapped native token address
export const TOKENS_WITH_FEE_TIER_1: Record<ChainId, string[]> = CHAINS_SUPPORT_FEE_CONFIGS.reduce((acc, chainId) => {
  if ((STABLE_COIN_ADDRESSES_TO_TAKE_FEE[chainId] as string[]).length) {
    acc[chainId] = [...STABLE_COIN_ADDRESSES_TO_TAKE_FEE[chainId], ETHER_ADDRESS, (WETH[chainId] as Token).address]
  } else {
    acc[chainId] = []
  }
  return acc
}, {} as Record<ChainId, string[]>)

export const KNC_ADDRESS = '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202'
export const KNCL_ADDRESS = '0xdd974D5C2e2928deA5F71b9825b8b646686BD200'

export const KNC: Partial<Record<ChainId, Token>> = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, KNC_ADDRESS, 18, 'KNC', 'KNC'),
  [ChainId.GÖRLI]: new Token(ChainId.GÖRLI, '0xd19e5119Efc73FeA1e70f9fbbc105DaB89D914e4', 18, 'KNC', 'KNC'),
  [ChainId.MATIC]: new Token(ChainId.MATIC, '0x1C954E8fe737F99f68Fa1CCda3e51ebDB291948C', 18, 'KNC', 'KNC'),
  [ChainId.BSCMAINNET]: new Token(ChainId.BSCMAINNET, '0xfe56d5892BDffC7BF58f2E84BE1b2C32D21C308b', 18, 'KNC', 'KNC'),
  [ChainId.AVAXMAINNET]: new Token(ChainId.AVAXMAINNET, '0x39fC9e94Caeacb435842FADeDeCB783589F50f5f', 18, 'KNC', 'KNC'),
  [ChainId.ARBITRUM]: new Token(ChainId.ARBITRUM, '0xe4DDDfe67E7164b0FE14E218d80dC4C08eDC01cB', 18, 'KNC', 'KNC'),
  [ChainId.OPTIMISM]: new Token(ChainId.OPTIMISM, '0xa00e3a3511aac35ca78530c85007afcd31753819', 18, 'KNC', 'KNC'),
  [ChainId.LINEA]: new Token(ChainId.LINEA, '0x3b2F62d42DB19B30588648bf1c184865D4C3B1D6', 18, 'KNC', 'KNC'),
  [ChainId.BASE]: new Token(ChainId.BASE, '0x28fe69Ff6864C1C218878BDCA01482D36B9D57b1', 18, 'KNC', 'KNC'),
}

export const DEFAULT_OUTPUT_TOKEN_BY_CHAIN: Partial<Record<ChainId, Token>> = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
  [ChainId.MATIC]: new Token(ChainId.MATIC, '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 6, 'USDT', 'Tether USD'),
  [ChainId.BSCMAINNET]: new Token(ChainId.BSCMAINNET, '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 18, 'USDC', 'USDC'),
  [ChainId.AVAXMAINNET]: new Token(
    ChainId.AVAXMAINNET,
    '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
    6,
    'USDC.e',
    'USDC.e',
  ),
  [ChainId.FANTOM]: new Token(ChainId.FANTOM, '0x28a92dde19D9989F39A49905d7C9C2FAc7799bDf', 6, 'USDC', 'USD Coin'),
  [ChainId.ARBITRUM]: new Token(ChainId.ARBITRUM, '0x912CE59144191C1204E64559FE8253a0e49E6548', 18, 'ARB', 'Arbitrum'),
  [ChainId.OPTIMISM]: new Token(ChainId.OPTIMISM, '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', 6, 'USDC', 'USD Coin'),
  [ChainId.GÖRLI]: new Token(ChainId.GÖRLI, '0x2bf64acf7ead856209749d0d125e9ade2d908e7f', 18, 'USDT', 'Tether USD'),
  [ChainId.ZKSYNC]: new Token(ChainId.ZKSYNC, '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4', 6, 'USDC', 'USD Coin'),
  [ChainId.LINEA]: new Token(ChainId.LINEA, '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', 6, 'USDC', 'USD Coin'),
  [ChainId.BASE]: new Token(ChainId.BASE, '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', 6, 'USDC', 'USD Coin'),
  [ChainId.SCROLL]: new Token(ChainId.SCROLL, '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df', 6, 'USDT', 'Tether USD'),
  [ChainId.BLAST]: new Token(ChainId.BLAST, '0x4300000000000000000000000000000000000003', 18, 'USDB', 'USDB'),
  [ChainId.MANTLE]: new Token(ChainId.MANTLE, '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE', 6, 'USDT', 'USDT'),
  [ChainId.SONIC]: new Token(ChainId.SONIC, '0x29219dd400f2Bf60E5a23d13Be72B486D4038894', 6, 'USDC.e', 'USDC.e'),
  [ChainId.BERA]: new Token(ChainId.BERA, '0x549943e04f40284185054145c6E4e9568C1D3241', 6, 'USDC.e', 'USDC.e'),
  [ChainId.RONIN]: new Token(ChainId.RONIN, '0x0b7007c13325c48911f73a2dad5fa5dcbf808adc', 6, 'USDC', 'USD Coin'),
  [ChainId.UNICHAIN]: new Token(ChainId.UNICHAIN, '0x078D782b760474a361dDA0AF3839290b0EF57AD6', 6, 'USDC', 'USD Coin'),
  [ChainId.HYPEREVM]: new Token(ChainId.HYPEREVM, '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb', 6, 'USD₮0', 'USD₮0'),
  [ChainId.ETHERLINK]: new Token(ChainId.ETHERLINK, '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9', 6, 'USDC', 'USDC'),
  [ChainId.PLASMA]: new Token(ChainId.PLASMA, '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb', 6, 'USDT0', 'USDT0'),
  [ChainId.MONAD]: new Token(ChainId.MONAD, '0x754704Bc059F8C67012fEd69BC8A327a5aafb603', 6, 'USDC', 'USDC'),
  [ChainId.MEGAETH]: new Token(ChainId.MEGAETH, '0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7', 6, 'USDm', 'USDm'),
  [ChainId.ROBINHOOD]: new Token(
    ChainId.ROBINHOOD,
    '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
    6,
    'USDG',
    'Global Dollar',
  ),
}

export const PRICE_CHART_QUOTE_TOKEN_BY_CHAIN: Partial<Record<ChainId, Token>> = {
  [ChainId.MAINNET]: DEFAULT_OUTPUT_TOKEN_BY_CHAIN[ChainId.MAINNET],
  [ChainId.MATIC]: DEFAULT_OUTPUT_TOKEN_BY_CHAIN[ChainId.MATIC],
  [ChainId.BSCMAINNET]: new Token(
    ChainId.BSCMAINNET,
    '0x55d398326f99059fF775485246999027B3197955',
    18,
    'USDT',
    'Tether USD',
  ),
  [ChainId.AVAXMAINNET]: new Token(
    ChainId.AVAXMAINNET,
    '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    6,
    'USDt',
    'TetherToken',
  ),
  [ChainId.ARBITRUM]: new Token(ChainId.ARBITRUM, '0xaf88d065e77c8cc2239327c5edb3a432268e5831', 6, 'USDC', 'USD Coin'),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    6,
    'USDT',
    'Tether USD',
  ),
  [ChainId.BASE]: new Token(ChainId.BASE, '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', 6, 'USDC', 'USD Coin'),
  [ChainId.HYPEREVM]: new Token(ChainId.HYPEREVM, '0xb88339CB7199b77E23DB6E890353E22632Ba630f', 6, 'USDC', 'USDC'),
  [ChainId.MONAD]: DEFAULT_OUTPUT_TOKEN_BY_CHAIN[ChainId.MONAD],
  [ChainId.ROBINHOOD]: DEFAULT_OUTPUT_TOKEN_BY_CHAIN[ChainId.ROBINHOOD],
}

// Token-intent routes normally pair the subject with the chain's native gas token. This map is only
// used when the subject itself is native, avoiding native -> native pairs with a deterministic stablecoin.
export const TOKEN_INTENT_STABLE_COUNTER_BY_CHAIN: Partial<Record<ChainId, Token>> = {
  ...DEFAULT_OUTPUT_TOKEN_BY_CHAIN,
  ...PRICE_CHART_QUOTE_TOKEN_BY_CHAIN,
}

export const DEFAULT_SWAP_FEE_STABLE_PAIRS = 4
export const DEFAULT_SWAP_FEE_NOT_STABLE_PAIRS = 10

export const mKNC: { [chain in ChainId]?: string } = {
  [ChainId.ARBITRUM]: '0x316772cFEc9A3E976FDE42C3Ba21F5A13aAaFf12',
  [ChainId.AVAXMAINNET]: '0x39fC9e94Caeacb435842FADeDeCB783589F50f5f',
  [ChainId.OPTIMISM]: '0x4518231a8FDF6ac553B9BBD51Bbb86825B583263',
  [ChainId.FANTOM]: '0x1e1085eFaA63EDFE74aaD7C05a28EAE4ef917C3F',
}
