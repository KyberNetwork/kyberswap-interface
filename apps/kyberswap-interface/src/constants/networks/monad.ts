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
    logo: 'https://storage.googleapis.com/ks-setting-1d682dca/7d9b018b-7dfd-4644-9735-3215bcb9dec91763539895022.jpg',
    decimal: 18,
  },
  defaultRpcUrl: 'https://rpc-mainnet.monadinfra.com/rpc/ICLJSp4IKDWLSpZ4laJATUQfL0ucwxiK',
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
}

export default monadInfo
