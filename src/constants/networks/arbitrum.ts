import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import ARBITRUM from 'assets/networks/arbitrum-network.svg'
import { EVMNetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const arbitrumInfo: EVMNetworkInfo = {
  chainId: ChainId.ARBITRUM,
  route: 'arbitrum',
  ksSettingRoute: 'arbitrum',
  priceRoute: 'arbitrum',
  poolFarmRoute: 'arbitrum',
  aggregatorRoute: 'arbitrum',
  name: 'Arbitrum',
  icon: ARBITRUM,
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  defaultBlockSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/arbitrum-blocks',
  etherscanUrl: 'https://arbiscan.io',
  etherscanName: 'Arbiscan',
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH',
    logo: EthereumLogo,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  defaultRpcUrl: 'https://arbitrum.kyberengineering.io',
  multicall: '0x80C7DD17B01855a6D2347444a0FCC36136a314de', // must use this for arbitrum to get exactly block number instead of L1 block number
  classic: {
    defaultSubgraph:
      'https://arbitrum-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-arbitrum',
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: {
      zap: '0xf530a090EF6481cfB33F98c63532E7745abab58A',
      router: '0xC3E2aED41ECdFB1ad41ED20D45377Da98D5489dD',
      factory: '0x51E8D106C646cA58Caf32A47812e95887C071a62',
    },
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: ['0xE8144386BF00f168ed7a0E0D821AC18e02a461BA', '0x8023a74412A0d6A2dF54E208E7C39713Ecd52AE8'],
  },
  elastic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-arbitrum-one',
    startBlock: 92166935,
    coreFactory: '0xC7a590291e07B9fe9E64b86c58fD8fC764308C4A',
    nonfungiblePositionManager: '0xe222fBE074A436145b255442D919E4E3A6c6a480',
    tickReader: '0x8Fd8Cb948965d9305999D767A02bf79833EADbB3',
    initCodeHash: '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x4d47fd5a29904Dae0Ef51b1c450C9750F15D7856',
    routers: '0xF9c2b5746c946EF883ab2660BbbB1f10A5bdeAb4',
    farms: ['0x7D5ba536ab244aAA1EA42aB88428847F25E3E676'],
    farmv2Quoter: '0x6AFeb9EDd6Cf44fA8E89b1eee28284e6dD7705C8',
    farmV2S: [
      '0xE44ec65521B85612fa7BC45d842645Fb4B690E4b',
      '0x3D6AfE2fB73fFEd2E3dD00c501A174554e147a43',
      '0xf2BcDf38baA52F6b0C1Db5B025DfFf01Ae1d6dBd',
    ],
  },
  limitOrder: {
    production: '0x227B0c196eA8db17A665EA6824D972A64202E936',
    development: '0x9deCa89E0934a5E0F187a1865299a9a586550864',
  },
  averageBlockTimeInSeconds: 1, // TODO: check these info
  coingeckoNetworkId: 'arbitrum-one',
  coingeckoNativeTokenId: 'ethereum',
  deBankSlug: 'arb',
  dexToCompare: 'uniswapv3',
  geckoTermialId: 'arbitrum',
}

export default arbitrumInfo
