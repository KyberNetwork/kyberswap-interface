import { ChainId } from '@kyberswap/ks-sdk-core'

import monadIcon from 'assets/networks/monad.svg'
import { NetworkInfo } from 'constants/networks/type'

const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const monadInfo: NetworkInfo = {
  chainId: ChainId.MONAD,
  route: 'monad',
  ksSettingRoute: 'monad',
  priceRoute: 'monad',
  aggregatorRoute: 'monad',
  name: 'Monad',
  icon: monadIcon,

  iconSelected: NOT_SUPPORT,

  etherscanUrl: 'https://mainnet-beta.monvision.io',
  etherscanName: 'Monad Explorer',
  bridgeURL: '',
  nativeToken: {
    symbol: 'MON',
    name: 'MON',
    logo: monadIcon,
    decimal: 18,
  },
  defaultRpcUrl: 'https://rpc.monad.xyz',
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
  averageBlockTimeInSeconds: 2, // TODO: check these info
  coingeckoNetworkId: NOT_SUPPORT,
  coingeckoNativeTokenId: NOT_SUPPORT,
  dexToCompare: NOT_SUPPORT,
  geckoTermialId: NOT_SUPPORT,
  // Kept off: some wallets (e.g. Phantom) reject an `accessList` in `eth_sendTransaction`
  // on Monad (-32000), and an accessList-warmed gas estimate under-reports the real cost of
  // the wallet's list-less tx (out-of-gas). Re-enable once wallet support is reliable.
  accessListEnabled: false,
}

export default monadInfo
