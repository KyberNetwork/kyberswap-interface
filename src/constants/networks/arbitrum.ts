import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import ARBITRUM from 'assets/networks/arbitrum-network.svg'
import { KS_SETTING_API } from 'constants/env'
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
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.ARBITRUM}&isWhitelisted=${true}`,
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
    startBlock: 91170109,
    coreFactory: '0x0c46f2257E83f6EE80fE58ca372731b398beD1B8',
    nonfungiblePositionManager: '0x27f993271a4D38Ada6DBE9845050f916a09Bd1aE',
    tickReader: '0xae442786Ff290B1a25FC1f434ea1f132276863aC',
    initCodeHash: '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x9201906C8eD420622D843910bfA38c671Ae8f34E',
    routers: '0xe85a6F9eD85b3A0390C5fe0D2694a2af42AEa236',
    farms: ['0x522f6D7AB6e1Ff725c35133a42B288b856C633a2'],
  },
  limitOrder: {
    production: '0x227B0c196eA8db17A665EA6824D972A64202E936',
    development: '0x9deCa89E0934a5E0F187a1865299a9a586550864',
  },
  averageBlockTimeInSeconds: 1, // TODO: check these info
  coingeckoNetworkId: 'arbitrum-one',
  coingeckoNativeTokenId: 'ethereum',
  deBankSlug: 'arb',
  trueSightId: NOT_SUPPORT,
  dexToCompare: 'uniswapv3',
  geckoTermialId: 'arbitrum',
}

export default arbitrumInfo
