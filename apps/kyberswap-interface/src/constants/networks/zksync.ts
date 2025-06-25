import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import { NetworkInfo } from 'constants/networks/type'

const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const chainId = ChainId.ZKSYNC

const zkSyncInfo: NetworkInfo = {
  chainId,
  route: 'zksync',
  ksSettingRoute: 'zksync',
  priceRoute: 'zksync',
  aggregatorRoute: 'zksync',
  name: 'zkSync Era',
  icon: 'https://storage.googleapis.com/ks-setting-1d682dca/bd11850b-6aef-48c6-a27d-f8ee833e0dbc1693378187666.svg',

  iconSelected: NOT_SUPPORT,

  etherscanUrl: 'https://era.zksync.network',
  etherscanName: 'zkSync Era Explorer',
  bridgeURL: 'https://portal.zksync.io/bridge/',
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH',
    logo: EthereumLogo,
    decimal: 18,
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
    // zkSync not supports elastic
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-zksync',
    startBlock: 0,
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
    farms: [],
  },
  limitOrder: '*',
  averageBlockTimeInSeconds: 15,
  coingeckoNetworkId: 'zksync-ethereum',
  coingeckoNativeTokenId: 'ethereum',
  dexToCompare: '',
  geckoTermialId: 'zksync',
}

export default zkSyncInfo
