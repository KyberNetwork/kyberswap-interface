import { ChainId } from '@kyberswap/ks-sdk-core'

import elysiumIcon from 'assets/networks/elysium.svg'
import hyperevmIcon from 'assets/networks/hyperevm.svg'
import { NetworkInfo } from 'constants/networks/type'

const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const elysiumInfo: NetworkInfo = {
  chainId: ChainId.ELYSIUM,
  route: 'elysium',
  ksSettingRoute: 'elysium',
  priceRoute: 'elysium',
  aggregatorRoute: 'elysium',
  name: 'Elysium',
  icon: elysiumIcon,

  iconSelected: NOT_SUPPORT,

  // The explorer routes by URL fragment (`#/tx/…`, `#/address/…`, `#/token/…`).
  etherscanUrl: 'https://scan.elysp.com/#',
  etherscanName: 'ElysScan',
  bridgeURL: '',
  nativeToken: {
    symbol: 'HYPE',
    name: 'HYPE',
    logo: hyperevmIcon,
    decimal: 18,
  },
  defaultRpcUrl: 'https://elysium-rpc.kyberswap.com',
  multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  classic: {
    defaultSubgraph: '',
    static: {
      zap: '',
      router: '',
      factory: '',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
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
  limitOrder: '*',
  averageBlockTimeInSeconds: 2,
  coingeckoNetworkId: NOT_SUPPORT,
  coingeckoNativeTokenId: NOT_SUPPORT,
  dexToCompare: NOT_SUPPORT,
  geckoTermialId: NOT_SUPPORT,
  accessListEnabled: false,
}

export default elysiumInfo
