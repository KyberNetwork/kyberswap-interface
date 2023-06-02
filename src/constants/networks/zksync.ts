import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import zkSync from 'assets/networks/zksync-network.png'
import { KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const chainId = ChainId.ZKSYNC

const zkSyncInfo: EVMNetworkInfo = {
  chainId,
  route: 'zksync',
  ksSettingRoute: 'zksync',
  priceRoute: 'zksync',
  poolFarmRoute: 'zksync',
  aggregatorRoute: 'zksync',
  name: 'zkSync',
  icon: zkSync,
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  defaultBlockSubgraph: 'https://api.thegraph.com/subgraphs/name/ianlapham/uni-testing-subgraph',
  etherscanUrl: 'https://explorer.zksync.io',
  etherscanName: 'zkSync Era Explorer',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${chainId}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH',
    logo: EthereumLogo,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  defaultRpcUrl: 'https://mainnet.era.zksync.io',
  multicall: '0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974',
  classic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-optimism',
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: ['0x715Cc6C0d591CA3FA8EA6e4Cb445adA0DC79069A'],
  },
  elastic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-optimism',
    startBlock: 99665516,
    coreFactory: '0xC7a590291e07B9fe9E64b86c58fD8fC764308C4A',
    nonfungiblePositionManager: '0xe222fBE074A436145b255442D919E4E3A6c6a480',
    tickReader: '0x8Fd8Cb948965d9305999D767A02bf79833EADbB3',
    initCodeHash: '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x4d47fd5a29904Dae0Ef51b1c450C9750F15D7856',
    routers: '0xF9c2b5746c946EF883ab2660BbbB1f10A5bdeAb4',
    farms: ['0x7D5ba536ab244aAA1EA42aB88428847F25E3E676'],
  },
  limitOrder: {
    development: '0xAF800D3EB207BAFBadE540554DF8bDCe561166f8',
    production: '0x227B0c196eA8db17A665EA6824D972A64202E936',
  },
  averageBlockTimeInSeconds: 120,
  coingeckoNetworkId: 'optimistic-ethereum',
  coingeckoNativeTokenId: 'ethereum',
  deBankSlug: '',
  trueSightId: NOT_SUPPORT,
  dexToCompare: '',
  geckoTermialId: 'optimism',
}

export default zkSyncInfo
