import { ChainId, NativeCurrency, Token, WETH } from '@kyberswap/ks-sdk-core'

import { CHAINS_SUPPORT_FEE_CONFIGS, ETHER_ADDRESS } from './index'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from './networks'

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
  [ChainId.CRONOS]: [
    '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59', // usdc
    '0xF2001B145b43032AAF5Ee2884e456CCd805F677D', // dai
    '0x66e428c3f67a68878562e79A0234c1F83c208770', // usdt
    '0xC74D59A548ecf7fc1754bb7810D716E9Ac3e3AE5', // busd
    '0x2Ae35c8E3D4bD57e8898FF7cd2bBff87166EF8cb', // MAI
  ],
  [ChainId.ZKSYNC]: [],
  [ChainId.BTTC]: [],
  [ChainId.MATIC]: [],
  [ChainId.OPTIMISM]: [],
  [ChainId.GÖRLI]: [],
  [ChainId.MUMBAI]: [],
  [ChainId.BSCTESTNET]: [],
  [ChainId.AVAXTESTNET]: [],
  [ChainId.MAINNET]: [],
  [ChainId.AVAXMAINNET]: [],
  [ChainId.FANTOM]: [],
  [ChainId.BSCMAINNET]: [],
  [ChainId.ARBITRUM]: [],
  [ChainId.ZKEVM]: [],
  [ChainId.LINEA]: [],
  [ChainId.BASE]: [],
  [ChainId.SCROLL]: [],
  [ChainId.BLAST]: [],
  [ChainId.MANTLE]: [],
  [ChainId.XLAYER]: [],
}

// This is basically the same as STABLE_COIN_ADDRESSES_TO_TAKE_FEE,
// but with native token address and wrapped native token address
export const TOKENS_WITH_FEE_TIER_1: Record<ChainId, string[]> = CHAINS_SUPPORT_FEE_CONFIGS.reduce((acc, chainId) => {
  if (STABLE_COIN_ADDRESSES_TO_TAKE_FEE[chainId].length) {
    acc[chainId] = [...STABLE_COIN_ADDRESSES_TO_TAKE_FEE[chainId], ETHER_ADDRESS, WETH[chainId].address]
  } else {
    acc[chainId] = []
  }
  return acc
}, {} as Record<ChainId, string[]>)

export const SUPER_STABLE_COINS_ADDRESS: { [chainId in ChainId]: string[] } = {
  [ChainId.MAINNET]: [
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
  ],
  [ChainId.MATIC]: [
    '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // usdc
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // usdt
  ],
  [ChainId.BSCMAINNET]: [
    '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', // dai
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // usdc
    '0x55d398326f99059fF775485246999027B3197955', // usdt
    '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // busd
  ],
  [ChainId.AVAXMAINNET]: [
    '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // USDt
    '0xc7198437980c041c805A1EDcbA50c1Ce5db95118', // usdt.e
    '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664', // usdc.e
    '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // usdc
    '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', // dai.e
  ],
  [ChainId.FANTOM]: [
    '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', // dai
    '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', // usdc
    '0x049d68029688eAbF473097a2fC38ef61633A3C7A', // fusdt
  ],
  [ChainId.CRONOS]: [
    '0xF2001B145b43032AAF5Ee2884e456CCd805F677D', // dai
    '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59', // usdc
    '0x66e428c3f67a68878562e79A0234c1F83c208770', // usdt
    '0xC74D59A548ecf7fc1754bb7810D716E9Ac3e3AE5', // busd
  ],
  [ChainId.ARBITRUM]: [
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // dai
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // usdc
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // usdt
  ],
  [ChainId.BTTC]: [
    '0x9B5F27f6ea9bBD753ce3793a07CbA3C74644330d', // usdt_b
    '0xCa424b845497f7204D9301bd13Ff87C0E2e86FCF', // usdc_b
    '0x17F235FD5974318E4E2a5e37919a209f7c37A6d1', // usdd_t
    '0x935faA2FCec6Ab81265B301a30467Bbc804b43d3', // usdc_t

    '0xdB28719F7f938507dBfe4f0eAe55668903D34a15', // usdt_t
    '0xE887512ab8BC60BcC9224e1c3b5Be68E26048B8B', // usdt_e
    '0xAE17940943BA9440540940DB0F1877f101D39e8b', // usdc_e
  ],
  [ChainId.OPTIMISM]: [
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // Dai
    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // usdt
    '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // usdc
  ],
  [ChainId.ZKSYNC]: [],
  [ChainId.GÖRLI]: [],
  [ChainId.MUMBAI]: [],
  [ChainId.BSCTESTNET]: [],
  [ChainId.AVAXTESTNET]: [],
  [ChainId.ZKEVM]: [
    '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035', // USDC
    '0x1E4a5963aBFD975d8c9021ce480b42188849D41d', // USDT
    '0xC5015b9d9161Dca7e18e32f6f25C4aD850731Fd4', // DAI
  ],
  [ChainId.BASE]: [
    '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDbC
    '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
  ],
  [ChainId.LINEA]: [],
  [ChainId.SCROLL]: [],
  [ChainId.BLAST]: [],
  [ChainId.MANTLE]: [],
  [ChainId.XLAYER]: [],
}

export const CORRELATED_COINS_ADDRESS: { [chainId in ChainId]: string[][] } = {
  [ChainId.MAINNET]: [
    [
      '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', //MATIC
      '0x9ee91F9f426fA633d227f7a9b000E28b9dfd8599', //stMATIC
    ],
    [
      '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', //maxtic
      '0xf03A7Eb46d01d9EcAA104558C732Cf82f6B6B645', //maticX
    ],
    [
      '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', //maxtic
      '0xf03A7Eb46d01d9EcAA104558C732Cf82f6B6B645', //maticX
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // weth
      '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704', //cbETH
    ],
    [
      '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51', // susd
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', //usdc
    ],
    [
      '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51', // susd
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', //usdc
    ],
    [
      '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51', // susd
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // usdt
    ],
    [
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // Dai
      '0x83F20F44975D03b1b09e64809B757c47f942BEeA', // sdai
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee', // weETH
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0xbf5495Efe5DB9ce00f80364C8B423567e58d2110', // ezETH
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0xae78736Cd615f374D3085123A210448E74Fc6393', // rETH rocket pool eth
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0x9559Aaa82d9649C7A7b220E7c461d2E74c9a3593', // rETH stafi eth
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0xf951E335afb289353dc249e82926178EaC7DEd78', // swETH
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0xFAe103DC9cf190eD75350761e95403b7b8aFa6c0', // rswETH
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0xD9A442856C234a39a81a089C06451EBAa4306a72', // puffETH
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0xF1376bceF0f78459C0Ed0ba5ddce976F1ddF51F4', // uniETH
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0xA35b1B31Ce002FBF2058D22F30f95D405200A15b', // ethx
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0x35fA164735182de50811E8e2E824cFb9B6118ac2', // eETH
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0x5E8422345238F34275888049021821E8E08CAa1f', // frxETH
      '0xac3E018457B222d93114458476f3E3416Abbe38F', // sfrxETH
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0x856c4Efb76C1D1AE02e20CEB03A2A6a08b0b8dC3', // OETH
    ],

    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0x6ef3D766Dfe02Dc4bF04aAe9122EB9A0Ded25615', // primeETH
    ],
    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // ETH
      '0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb', // sETH
    ],
    [
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // wbtc
      '0x8dAEBADE922dF735c38C80C7eBD708Af50815fAa', // tbtc
      '0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6', // sbtc
    ],
    [
      '0x853d955aCEf822Db058eb8505911ED77F175b99e', // frax
      '0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32', // sfrax
    ],
    [
      '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f', // gho
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // usdc
    ],
    [
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // usdc
      '0xe07F9D810a48ab5c3c914BA3cA53AF14E4491e8A', // gyd
    ],

    [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', //WETH
      '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', //stETH
      '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', //wstETH
    ],
    [
      '0xdd974D5C2e2928deA5F71b9825b8b646686BD200', //KNCL
      '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202', //KNC
    ],
  ],

  [ChainId.MATIC]: [
    [
      '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', //WMATIC
      '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4', //stMATIC
      '0x0000000000000000000000000000000000001010', //MATIC
    ],
    [
      '0xfa68FB4628DFF1028CFEc22b4162FCcd0d45efb6', // MATICX
      '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
    ],
  ],
  [ChainId.BSCMAINNET]: [],
  [ChainId.AVAXMAINNET]: [
    [
      '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', //WAVAX
      '0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE', //sAVAX
    ],
  ],
  // TODO: fill here
  [ChainId.ZKSYNC]: [
    [
      '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91', // ETH - rETH
      '0x32fd44bb869620c0ef993754c8a00be67c464806',
    ],
  ],
  [ChainId.FANTOM]: [],
  [ChainId.CRONOS]: [],
  [ChainId.ARBITRUM]: [
    [
      // Eth/wstEth:
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      '0x5979d7b546e38e414f7e9822514be443a4800529',
    ],
    [
      // Eth/cbEth:
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      '0x1debd73e752beaf79865fd6446b0c970eae7732f',
    ],
    [
      // Eth/sfrxEth:
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      '0x95ab45875cffdba1e5f451b950bc2e42c0053f39',
    ],
    [
      // sFrax/Frax:
      '0xe3b3fe7bca19ca77ad877a5bebab186becfad906',
      '0x17fc002b466eec40dae837fc4be5c67993ddbd6f',
    ],
    [
      // Eth/frxEth:
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      '0x178412e79c25968a32e89b11f63b33f733770c2a',
    ],
    [
      // Eth/ezEth:
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      '0x2416092f143378750bb29b79ed961ab195cceea5',
    ],
    [
      // Eth/swEth:
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      '0xbc011a12da28e8f0f528d9ee5e7039e22f91cf18',
    ],
    [
      // Eth/rEth:
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      '0xec70dcb4a1efa46b8f2d97c310c9c4790ba5ffa8',
    ],
    [
      // Eth/weEth:
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      '0x35751007a407ca6feffe80b3cb397736d2cf4dbe',
    ],
  ],
  [ChainId.BTTC]: [],
  [ChainId.OPTIMISM]: [
    [
      // wBtc/sBtc:
      '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
      '0x298B9B95708152ff6968aafd889c6586e9169f1D',
    ],
    [
      // Eth/frxEth:
      '0x4f9a0e7fd2bf6067db6994cf12e4495df938e6e9',
      '0xcf7ecee185f19e2e970a301ee37f93536ed66179',
    ],
    [
      // stMatic/Matic:
      '0x83b874c1e09d316059d929da402dcb1a98e92082',
      '0xa2036f0538221a77a3937f1379699f44945018d0',
    ],
    [
      // Eth/wstEth:
      '0x4f9a0e7fd2bf6067db6994cf12e4495df938e6e9',
      '0x5d8cff95d7a57c0bf50b30b43c7cc0d52825d4a9',
    ],
  ],
  [ChainId.GÖRLI]: [],
  [ChainId.MUMBAI]: [],
  [ChainId.BSCTESTNET]: [],
  [ChainId.AVAXTESTNET]: [],
  [ChainId.ZKEVM]: [
    [
      // Eth/rEth:
      '0x4f9a0e7fd2bf6067db6994cf12e4495df938e6e9',
      '0xb23c20efce6e24acca0cef9b7b7aa196b84ec942',
    ],
  ],
  [ChainId.LINEA]: [
    [
      // Eth/wstEth:
      '0x5300000000000000000000000000000000000004',
      '0xf610a9dfb7c89644979b4a0f27063e9e7d7cda32',
    ],
    [
      // Eth/weEth:
      '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f',
      '0x1bf74c010e6320bab11e2e5a532b5ac15e0b8aa6',
    ],
    [
      // Eth/ezEth:
      '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f',
      '0x2416092f143378750bb29b79ed961ab195cceea5',
    ],
  ],
  [ChainId.BASE]: [
    [
      // Eth/ezEth:
      '0x4200000000000000000000000000000000000006',
      '0x2416092f143378750bb29b79ed961ab195cceea5',
    ],
    [
      // Eth/wstEth:
      '0x4200000000000000000000000000000000000006',
      '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
    ],
    [
      // Eth/cbEth:
      '0x4200000000000000000000000000000000000006',
      '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22',
    ],
    [
      // Eth/weEth:
      '0x4200000000000000000000000000000000000006',
      '0x04c0599ae5a44757c0af6f9ec3b93da8976c150a',
    ],
  ],
  [ChainId.SCROLL]: [],
  [ChainId.BLAST]: [],
  [ChainId.MANTLE]: [],
  [ChainId.XLAYER]: [],
}

export const KNC_ADDRESS = '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202'
export const KNCL_ADDRESS = '0xdd974D5C2e2928deA5F71b9825b8b646686BD200'

// todo: make it nullable
export const KNC: { [chainId in ChainId]: Token } = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, KNC_ADDRESS, 18, 'KNC', 'KNC'),
  [ChainId.GÖRLI]: new Token(ChainId.GÖRLI, '0xd19e5119Efc73FeA1e70f9fbbc105DaB89D914e4', 18, 'KNC', 'KNC'),
  [ChainId.MATIC]: new Token(ChainId.MATIC, '0x1C954E8fe737F99f68Fa1CCda3e51ebDB291948C', 18, 'KNC', 'KNC'),
  [ChainId.BSCTESTNET]: new Token(ChainId.BSCTESTNET, '0x51E8D106C646cA58Caf32A47812e95887C071a62', 18, 'KNC', 'KNC'),
  [ChainId.BSCMAINNET]: new Token(ChainId.BSCMAINNET, '0xfe56d5892BDffC7BF58f2E84BE1b2C32D21C308b', 18, 'KNC', 'KNC'),
  [ChainId.AVAXMAINNET]: new Token(ChainId.AVAXMAINNET, '0x39fC9e94Caeacb435842FADeDeCB783589F50f5f', 18, 'KNC', 'KNC'),
  [ChainId.BTTC]: new Token(ChainId.BTTC, '0x18fA72e0EE4C580a129b0CE5bD0694d716C7443E', 18, 'KNC_b', 'KNC v2 - BSC'),
  [ChainId.ARBITRUM]: new Token(ChainId.ARBITRUM, '0xe4DDDfe67E7164b0FE14E218d80dC4C08eDC01cB', 18, 'KNC', 'KNC'),
  [ChainId.OPTIMISM]: new Token(ChainId.OPTIMISM, '0xa00e3a3511aac35ca78530c85007afcd31753819', 18, 'KNC', 'KNC'),
  [ChainId.LINEA]: new Token(ChainId.LINEA, '0x3b2F62d42DB19B30588648bf1c184865D4C3B1D6', 18, 'KNC', 'KNC'),
  [ChainId.ZKEVM]: new Token(ChainId.ZKEVM, '0x6A80A465409ce8D36C513129C0FEEa61BEd579ba', 18, 'KNC', 'KNC'),
  [ChainId.BASE]: new Token(ChainId.BASE, '0x28fe69Ff6864C1C218878BDCA01482D36B9D57b1', 18, 'KNC', 'KNC'),

  // TODO(viet-nv): KNC does not exist on the below chain
  [ChainId.CRONOS]: new Token(ChainId.CRONOS, KNC_ADDRESS, 18, 'KNC', 'KNC'),
  [ChainId.FANTOM]: new Token(ChainId.FANTOM, KNC_ADDRESS, 18, 'KNC', 'KNC'),
  [ChainId.SCROLL]: new Token(ChainId.SCROLL, KNC_ADDRESS, 18, 'KNC', 'KNC'),
  [ChainId.ZKSYNC]: new Token(ChainId.ZKSYNC, KNC_ADDRESS, 18, 'KNC', 'KNC'),
  [ChainId.BLAST]: new Token(ChainId.BLAST, KNC_ADDRESS, 18, 'KNC', 'KNC'),
  [ChainId.MANTLE]: new Token(ChainId.MANTLE, KNC_ADDRESS, 18, 'KNC', 'KNC'),
  [ChainId.XLAYER]: new Token(ChainId.MANTLE, KNC_ADDRESS, 18, 'KNC', 'KNC'),

  [ChainId.AVAXTESTNET]: new Token(ChainId.AVAXTESTNET, KNC_ADDRESS, 18, 'KNC', 'KNC'),
  [ChainId.MUMBAI]: new Token(ChainId.MUMBAI, '0xFD1f9381Cb641Dc76Fe8087dbcf8ea84a2c77cbE', 18, 'KNC', 'KNC'),
}

export const DEFAULT_OUTPUT_TOKEN_BY_CHAIN: Partial<Record<ChainId, Token>> = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
  [ChainId.MATIC]: new Token(ChainId.MATIC, '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 6, 'USDT', 'Tether USD'),
  [ChainId.BSCMAINNET]: new Token(ChainId.BSCMAINNET, '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', 18, 'BUSD', 'BUSD'),
  [ChainId.AVAXMAINNET]: new Token(
    ChainId.AVAXMAINNET,
    '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
    6,
    'USDC.e',
    'USDC.e',
  ),
  [ChainId.FANTOM]: new Token(ChainId.FANTOM, '0x28a92dde19D9989F39A49905d7C9C2FAc7799bDf', 6, 'USDC', 'USD Coin'),
  [ChainId.CRONOS]: new Token(ChainId.CRONOS, '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59', 6, 'USDC', 'USD Coin'),
  [ChainId.ARBITRUM]: new Token(ChainId.ARBITRUM, '0x912CE59144191C1204E64559FE8253a0e49E6548', 18, 'ARB', 'Arbitrum'),
  [ChainId.OPTIMISM]: new Token(ChainId.OPTIMISM, '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', 6, 'USDC', 'USD Coin'),
  [ChainId.BTTC]: new Token(ChainId.BTTC, '0x9B5F27f6ea9bBD753ce3793a07CbA3C74644330d', 18, 'USDT_b', 'Tether USD_BSC'),
  [ChainId.GÖRLI]: new Token(ChainId.GÖRLI, '0x2bf64acf7ead856209749d0d125e9ade2d908e7f', 18, 'USDT', 'Tether USD'),
  [ChainId.ZKSYNC]: new Token(ChainId.ZKSYNC, '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4', 6, 'USDC', 'USD Coin'),
  [ChainId.ZKEVM]: new Token(ChainId.ZKEVM, '0x1E4a5963aBFD975d8c9021ce480b42188849D41d', 6, 'USDT', 'Tether USD'),
  [ChainId.LINEA]: new Token(ChainId.LINEA, '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', 6, 'USDC', 'USD Coin'),
  [ChainId.BASE]: new Token(ChainId.BASE, '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', 6, 'USDC', 'USD Coin'),
  [ChainId.SCROLL]: new Token(ChainId.SCROLL, '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df', 6, 'USDT', 'Tether USD'),
  [ChainId.BLAST]: new Token(ChainId.BLAST, '0x4300000000000000000000000000000000000003', 18, 'USDB', 'USDB'),
  [ChainId.MANTLE]: new Token(ChainId.MANTLE, '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE', 6, 'USDT', 'USDT'),
  [ChainId.XLAYER]: new Token(ChainId.XLAYER, '0x1e4a5963abfd975d8c9021ce480b42188849d41d', 6, 'USDT', 'USDT'),
}

export const DEFAULT_SWAP_FEE_STABLE_PAIRS = 4
export const DEFAULT_SWAP_FEE_NOT_STABLE_PAIRS = 10

export const mKNC: { [chain in ChainId]?: string } = {
  [ChainId.ARBITRUM]: '0x316772cFEc9A3E976FDE42C3Ba21F5A13aAaFf12',
  [ChainId.AVAXMAINNET]: '0x39fC9e94Caeacb435842FADeDeCB783589F50f5f',
  [ChainId.OPTIMISM]: '0x4518231a8FDF6ac553B9BBD51Bbb86825B583263',
  [ChainId.FANTOM]: '0x1e1085eFaA63EDFE74aaD7C05a28EAE4ef917C3F',
}

export const GAS_TOKENS = [
  new Token(ChainId.ZKSYNC, '0xed4040fd47629e7c8fbb7da76bb50b3e7695f0f2', 18, 'HOLD', 'HOLD'),
  new Token(ChainId.ZKSYNC, '0x493257fd37edb34451f62edf8d2a0c418852ba4c', 6, 'USDT', 'USDT'),
  new Token(ChainId.ZKSYNC, '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4', 6, 'USDC', 'USDC'),
  // new Token(ChainId.ZKSYNC, '0xbbeb516fb02a01611cbbe0453fe3c580d7281011', 8, 'wBTC', 'wBTC'),
]

export const CORRELATED_PAIR_FOR_SLIPPAGE: { [chainId: number]: { [address: string]: string } } = {
  [ChainId.MAINNET]: {},
}
