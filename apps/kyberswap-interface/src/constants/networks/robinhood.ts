import { ChainId } from '@kyberswap/ks-sdk-core'

import ethereumIcon from 'assets/networks/ethereum.svg'
import robinhoodIcon from 'assets/networks/robinhood.svg'
import { NetworkInfo } from 'constants/networks/type'

const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const robinhoodInfo: NetworkInfo = {
  chainId: ChainId.ROBINHOOD,
  route: 'robinhood',
  ksSettingRoute: 'robinhood',
  priceRoute: 'robinhood',
  aggregatorRoute: 'robinhood',
  name: 'Robinhood',
  icon: robinhoodIcon,

  iconSelected: NOT_SUPPORT,

  etherscanUrl: 'https://robinscan.io',
  etherscanName: 'Robinscan',
  bridgeURL: '',
  nativeToken: {
    symbol: 'ETH',
    name: 'Ethereum',
    logo: ethereumIcon,
    decimal: 18,
  },
  defaultRpcUrl: 'https://rpc.mainnet.chain.robinhood.com',
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
  averageBlockTimeInSeconds: 1,
  coingeckoNetworkId: NOT_SUPPORT,
  coingeckoNativeTokenId: NOT_SUPPORT,
  dexToCompare: NOT_SUPPORT,
  geckoTermialId: NOT_SUPPORT,
  accessListEnabled: false,
}

export default robinhoodInfo
