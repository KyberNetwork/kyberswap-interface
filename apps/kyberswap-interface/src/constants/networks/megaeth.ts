import { ChainId } from '@kyberswap/ks-sdk-core'

import ethereumIcon from 'assets/networks/ethereum.svg'
import megaEthIcon from 'assets/networks/megaeth.svg'
import { NetworkInfo } from 'constants/networks/type'

const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const monadInfo: NetworkInfo = {
  chainId: ChainId.MEGAETH,
  route: 'megaeth',
  ksSettingRoute: 'megaeth',
  priceRoute: 'megaeth',
  aggregatorRoute: 'megaeth',
  name: 'MegaETH',
  icon: megaEthIcon,

  iconSelected: NOT_SUPPORT,

  etherscanUrl: 'https://megaeth.blockscout.com',
  etherscanName: 'MegaETH Explorer',
  bridgeURL: '',
  nativeToken: {
    symbol: 'ETH',
    name: 'Ethereum',
    logo: ethereumIcon,
    decimal: 18,
  },
  defaultRpcUrl: 'https://mainnet.megaeth.com/rpc',
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
  accessListEnabled: false,
}

export default monadInfo
