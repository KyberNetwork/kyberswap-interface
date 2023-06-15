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
  defaultBlockSubgraph: 'https://zksync-graph.kyberengineering.io/subgraphs/name/kybernetwork/zksync-blocks',
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
  multicall: '0xF9cda624FBC7e059355ce98a31693d299FACd963',
  classic: {
    defaultSubgraph: 'https://zksync-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-zksync',
    static: {
      zap: '0x35004774C6163bCEE66F815F59975606cC841c54',
      router: '0x937f4f2FF1889b79dAa08debfCA5C237a07A5208',
      factory: '0x9017f5A42fbe5bCA3853400D2660a2Ee771b241e',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: [],
  },
  elastic: {
    defaultSubgraph: '',
    startBlock: 0,
    coreFactory: '',
    nonfungiblePositionManager: '',
    tickReader: '',
    initCodeHash: '',
    quoter: '',
    routers: '',
    farms: [],
  },
  limitOrder: {
    development: '',
    production: '',
  },
  averageBlockTimeInSeconds: 15,
  coingeckoNetworkId: 'zksync-ethereum',
  coingeckoNativeTokenId: 'ethereum',
  deBankSlug: '',
  dexToCompare: '',
  geckoTermialId: 'zksync',
}

export default zkSyncInfo
